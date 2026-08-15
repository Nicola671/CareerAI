"""
RAG Engine v2.0 - Advanced retrieval with:
  • Multilingual embeddings (BGE-M3 / gte-multilingual / multilingual-e5)
  • Hybrid search (Vector + BM25 keyword via Reciprocal Rank Fusion)
  • Reranking with BGE-Reranker-v2
  • Metadata filtering by document type (CV vs Job Offer vs LinkedIn)
All 100% free & local.
"""
import os
import hashlib
import logging
from typing import List, Tuple, Optional, Dict

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

# ======================== EMBEDDING MODEL CATALOG ========================

EMBEDDING_MODELS = {
    "bge-m3": {
        "name": "BAAI/bge-m3",
        "display": "🌍 BGE-M3 (Multilingual · Recomendado)",
        "description": "Mejor modelo multilingual 2025. Dense+sparse, 100+ idiomas, ideal para RAG.",
        "size": "~2.3 GB",
        "languages": "100+",
        "performance": "⭐⭐⭐⭐⭐",
    },
    "gte-multilingual": {
        "name": "Alibaba-NLP/gte-multilingual-base",
        "display": "🚀 GTE Multilingual (Ligero · 70+ idiomas)",
        "description": "Excelente balance tamaño/calidad. 70+ idiomas, encoder-only.",
        "size": "~580 MB",
        "languages": "70+",
        "performance": "⭐⭐⭐⭐",
    },
    "multilingual-e5": {
        "name": "intfloat/multilingual-e5-base",
        "display": "📐 Multilingual E5 Base (Estándar)",
        "description": "Modelo estándar multilingual para retrieval y similitud semántica.",
        "size": "~1.1 GB",
        "languages": "100+",
        "performance": "⭐⭐⭐⭐",
    },
    "minilm-v2": {
        "name": "sentence-transformers/all-MiniLM-L6-v2",
        "display": "⚡ MiniLM v2 (Ultra-ligero · Solo inglés)",
        "description": "Modelo original, muy rápido pero solo inglés. Ideal para pruebas.",
        "size": "~90 MB",
        "languages": "Inglés",
        "performance": "⭐⭐⭐",
    },
}

DEFAULT_EMBEDDING = "bge-m3"


# ======================== BM25 KEYWORD INDEX ========================

class BM25Index:
    """Lightweight BM25 keyword index for hybrid search."""

    def __init__(self):
        self._documents: List[str] = []
        self._metadatas: List[dict] = []
        self._index = None

    @property
    def is_ready(self) -> bool:
        return self._index is not None and len(self._documents) > 0

    def add(self, texts: List[str], metadatas: List[dict]):
        """Add documents to the BM25 index."""
        self._documents.extend(texts)
        self._metadatas.extend(metadatas)
        self._rebuild()

    def _rebuild(self):
        """Rebuild the BM25 index from scratch."""
        try:
            from rank_bm25 import BM25Okapi
            tokenized = [doc.lower().split() for doc in self._documents]
            if tokenized:
                self._index = BM25Okapi(tokenized)
        except ImportError:
            logger.warning("rank_bm25 not installed – keyword search disabled. pip install rank_bm25")
            self._index = None

    def search(
        self, query: str, k: int = 10, filter_dict: Optional[dict] = None,
    ) -> List[Tuple[str, dict, float]]:
        """Search using BM25 keyword matching."""
        if not self.is_ready:
            return []

        tokenized_query = query.lower().split()
        scores = self._index.get_scores(tokenized_query)

        # Pair with metadata and filter
        results = []
        for idx, score in enumerate(scores):
            if score <= 0:
                continue
            meta = self._metadatas[idx] if idx < len(self._metadatas) else {}
            # Apply metadata filter
            if filter_dict:
                if not all(meta.get(k_f) == v_f for k_f, v_f in filter_dict.items()):
                    continue
            results.append((self._documents[idx], meta, float(score)))

        # Sort by score descending and return top-k
        results.sort(key=lambda x: x[2], reverse=True)
        return results[:k]

    def clear(self):
        """Clear the BM25 index."""
        self._documents.clear()
        self._metadatas.clear()
        self._index = None

    def rebuild_from_chroma(self, chroma_collection):
        """Rebuild BM25 index from existing ChromaDB collection."""
        try:
            data = chroma_collection.get()
            if data and data.get("documents"):
                self._documents = list(data["documents"])
                self._metadatas = list(data.get("metadatas", [{}] * len(self._documents)))
                self._rebuild()
                logger.info(f"BM25 index rebuilt with {len(self._documents)} documents")
        except Exception as e:
            logger.warning(f"Failed to rebuild BM25 index: {e}")


# ======================== RERANKER ========================

class Reranker:
    """Cross-encoder reranker using BGE-Reranker-v2-m3 (free, local, multilingual)."""

    def __init__(self, model_name: str = "BAAI/bge-reranker-v2-m3"):
        self.model_name = model_name
        self._model = None

    @property
    def is_ready(self) -> bool:
        return self._model is not None

    def load(self):
        """Lazy-load the reranker model."""
        if self._model is not None:
            return
        try:
            from sentence_transformers import CrossEncoder
            self._model = CrossEncoder(self.model_name, max_length=512)
            logger.info(f"Reranker loaded: {self.model_name}")
        except ImportError:
            logger.warning("sentence-transformers not installed for reranking")
        except Exception as e:
            logger.warning(f"Failed to load reranker: {e}")

    def rerank(
        self,
        query: str,
        results: List[Tuple[str, dict, float]],
        top_k: int = 5,
    ) -> List[Tuple[str, dict, float]]:
        """Rerank results using cross-encoder scoring."""
        if not self.is_ready or not results:
            return results[:top_k]

        try:
            pairs = [(query, content) for content, _, _ in results]
            scores = self._model.predict(pairs)

            reranked = []
            for i, (content, meta, _) in enumerate(results):
                reranked.append((content, meta, float(scores[i])))

            reranked.sort(key=lambda x: x[2], reverse=True)
            return reranked[:top_k]
        except Exception as e:
            logger.warning(f"Reranking failed, returning original order: {e}")
            return results[:top_k]


# ======================== RECIPROCAL RANK FUSION ========================

def reciprocal_rank_fusion(
    results_list: List[List[Tuple[str, dict, float]]],
    k: int = 60,
    top_n: int = 15,
) -> List[Tuple[str, dict, float]]:
    """
    Merge multiple ranked result lists using Reciprocal Rank Fusion (RRF).
    Each result is identified by content hash. Final score = sum(1 / (k + rank)).
    """
    fused_scores: Dict[str, float] = {}
    content_map: Dict[str, Tuple[str, dict]] = {}

    for results in results_list:
        for rank, (content, meta, _) in enumerate(results):
            key = hashlib.md5(content[:200].encode()).hexdigest()
            fused_scores[key] = fused_scores.get(key, 0.0) + 1.0 / (k + rank + 1)
            if key not in content_map:
                content_map[key] = (content, meta)

    sorted_keys = sorted(fused_scores.keys(), key=lambda x: fused_scores[x], reverse=True)

    merged = []
    for key in sorted_keys[:top_n]:
        content, meta = content_map[key]
        merged.append((content, meta, fused_scores[key]))

    return merged


# ======================== RAG ENGINE v2 ========================

class RAGEngine:
    """
    Advanced RAG Engine v2.0 with:
    - Selectable multilingual embeddings
    - Hybrid search (vector + BM25 keyword)
    - Cross-encoder reranking
    - Metadata filtering
    """

    def __init__(
        self,
        persist_directory: str = None,
        embedding_key: str = DEFAULT_EMBEDDING,
        enable_reranking: bool = True,
        enable_hybrid: bool = True,
    ):
        if persist_directory is None:
            persist_directory = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "data", "vectordb"
            )
        self.persist_directory = persist_directory
        os.makedirs(persist_directory, exist_ok=True)

        # ---- Embeddings ----
        self.embedding_key = embedding_key
        model_info = EMBEDDING_MODELS.get(embedding_key, EMBEDDING_MODELS[DEFAULT_EMBEDDING])
        model_name = model_info["name"]

        self.embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={"device": "cpu", "trust_remote_code": True},
            encode_kwargs={"normalize_embeddings": True},
        )

        # ---- ChromaDB Vector Store ----
        # Use collection name based on embedding to avoid dimension conflicts
        collection_name = f"career_docs_{embedding_key.replace('-', '_')}"
        self.vectorstore = Chroma(
            collection_name=collection_name,
            embedding_function=self.embeddings,
            persist_directory=persist_directory,
        )

        # ---- BM25 Keyword Index (hybrid search) ----
        self.enable_hybrid = enable_hybrid
        self.bm25 = BM25Index()
        if enable_hybrid:
            try:
                self.bm25.rebuild_from_chroma(self.vectorstore._collection)
            except Exception:
                pass

        # ---- Reranker (lazy-loaded on first use) ----
        self.enable_reranking = enable_reranking
        self.reranker = Reranker() if enable_reranking else None

    # ======================== DOCUMENT OPS ========================

    def add_document(self, chunks: List[str], metadata: dict, user_id: str = "anonymous") -> int:
        """Add document chunks to vector store + BM25 index."""
        if not chunks:
            return 0

        docs = []
        chunk_metas = []
        for i, chunk in enumerate(chunks):
            doc_id = hashlib.md5(
                f"{metadata.get('filename', 'unknown')}_{i}_{chunk[:50]}".encode()
            ).hexdigest()

            doc_metadata = {
                **metadata,
                "user_id": user_id,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "doc_id": doc_id,
            }
            docs.append(Document(page_content=chunk, metadata=doc_metadata))
            chunk_metas.append(doc_metadata)

        # Add to vector store
        self.vectorstore.add_documents(docs)

        # Add to BM25 index
        if self.enable_hybrid:
            self.bm25.add(chunks, chunk_metas)

        logger.info(f"Added {len(docs)} chunks for '{metadata.get('filename', '?')}'")
        return len(docs)

    def delete_document(self, filename: str, user_id: str = "anonymous"):
        """Delete all chunks for a specific document considering user_id."""
        try:
            collection = self.vectorstore._collection
            
            if user_id == "anonymous":
                # Try getting explicitly labeled anonymous docs
                results = collection.get(where={"$and": [{"filename": filename}, {"user_id": user_id}]})
                
                # If none found, fallback to legacy docs that have no user_id
                if not results or not results.get("ids"):
                    all_file_docs = collection.get(where={"filename": filename})
                    if all_file_docs and all_file_docs.get("ids"):
                        legacy_ids = [ids for i, ids in enumerate(all_file_docs["ids"]) if "user_id" not in all_file_docs["metadatas"][i]]
                        results = {"ids": legacy_ids}
            else:
                results = collection.get(where={"$and": [{"filename": filename}, {"user_id": user_id}]})
                
            if results and results.get("ids"):
                collection.delete(ids=results["ids"])
                # Rebuild BM25 index after deletion
                if self.enable_hybrid:
                    self.bm25.rebuild_from_chroma(collection)
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            return False

    # ======================== SEARCH ========================

    def search(
        self,
        query: str,
        k: int = 5,
        filter_dict: Optional[dict] = None,
        user_id: str = "anonymous"
    ) -> List[Tuple[str, dict, float]]:
        """
        Advanced search pipeline:
        1. Vector similarity search (semantic)
        2. BM25 keyword search (lexical) — if hybrid enabled
        3. Reciprocal Rank Fusion to merge results
        4. Reranking with cross-encoder — if enabled
        """
        # Build ChromaDB-compatible filter with user_id
        filter_dict = filter_dict or {}
        if "user_id" not in filter_dict:
            filter_dict["user_id"] = user_id
        
        # ChromaDB requires $and for multiple filter keys
        if len(filter_dict) > 1:
            chroma_filter = {"$and": [{k: v} for k, v in filter_dict.items()]}
        else:
            chroma_filter = filter_dict

        # Step 1: Vector search
        vector_results = self._vector_search(query, k=k * 2, filter_dict=chroma_filter)

        # Step 2: BM25 keyword search (if enabled)
        if self.enable_hybrid and self.bm25.is_ready:
            bm25_results = self.bm25.search(query, k=k * 2, filter_dict=chroma_filter)

            # Step 3: Fuse results with RRF
            merged = reciprocal_rank_fusion(
                [vector_results, bm25_results],
                top_n=k * 2,
            )
        else:
            merged = vector_results

        # Step 4: Rerank (if enabled and model loaded)
        if self.enable_reranking and self.reranker is not None:
            if not self.reranker.is_ready:
                self.reranker.load()
            if self.reranker.is_ready:
                merged = self.reranker.rerank(query, merged, top_k=k)
            else:
                merged = merged[:k]
        else:
            merged = merged[:k]

        return merged

    def _vector_search(
        self, query: str, k: int = 10, filter_dict: Optional[dict] = None,
    ) -> List[Tuple[str, dict, float]]:
        """Pure vector similarity search."""
        try:
            results = self.vectorstore.similarity_search_with_score(
                query, k=k, filter=filter_dict
            )
            return [
                (doc.page_content, doc.metadata, score) for doc, score in results
            ]
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")
            return []

    def search_by_type(
        self,
        query: str,
        doc_type: str,
        k: int = 5,
    ) -> List[Tuple[str, dict, float]]:
        """Search filtered by document type (cv, job_offer, linkedin, other)."""
        return self.search(query, k=k, filter_dict={"doc_type": doc_type})

    # ======================== CONTEXT BUILDING ========================

    def get_context(
        self,
        query: str,
        k: int = 8,
        filter_type: Optional[str] = None,
        user_id: str = "anonymous"
    ) -> str:
        """Get formatted context string for LLM consumption."""
        filter_dict = {"doc_type": filter_type} if filter_type else {}
        # user_id will be injected by search() if not already present
        results = self.search(query, k=k, filter_dict=filter_dict, user_id=user_id)

        if not results:
            return "⚠️ No se encontraron documentos relevantes. Por favor, sube tu CV u otros documentos primero."

        context_parts = []
        seen_content = set()

        for content, metadata, score in results:
            # Deduplicate similar chunks
            content_hash = hashlib.md5(content[:100].encode()).hexdigest()
            if content_hash in seen_content:
                continue
            seen_content.add(content_hash)

            source = metadata.get("filename", "Desconocido")
            doc_type = metadata.get("doc_type", "documento")

            type_labels = {
                "cv": "📋 CV/Resume",
                "job_offer": "💼 Oferta de Trabajo",
                "linkedin": "👤 LinkedIn",
                "other": "📄 Documento",
            }
            type_label = type_labels.get(doc_type, "📄 Documento")

            # Score display depends on search mode
            score_str = f"{score:.3f}"

            context_parts.append(
                f"[{type_label} | Fuente: {source} | Score: {score_str}]\n{content}"
            )

        return "\n\n" + "─" * 50 + "\n\n".join(context_parts)

    # ======================== STATS & UTILS ========================

    def get_document_list(self, user_id: str = "anonymous") -> List[str]:
        """Get list of all indexed document filenames for a user."""
        try:
            collection = self.vectorstore._collection
            if user_id == "anonymous":
                # For anonymous users, we get everything but could restrict it later. 
                # For now, if "anonymous", just get the ones explicitly marked "anonymous"
                results = collection.get(where={"user_id": user_id})
                # If nothing found, it might be legacy (no user_id set), so get those too
                if not results.get("ids"):
                    all_docs = collection.get()
                    results = {"metadatas": [m for m in all_docs.get("metadatas", []) if "user_id" not in m]}
            else:
                results = collection.get(where={"user_id": user_id})
            
            filenames = set()
            for meta in results.get("metadatas", []):
                if meta and "filename" in meta:
                    filenames.add(meta["filename"])
            return sorted(list(filenames))
        except Exception:
            return []

    def get_stats(self, user_id: str = "anonymous") -> dict:
        """Get vector store statistics for a user."""
        try:
            collection = self.vectorstore._collection
            if user_id == "anonymous":
                results = collection.get(where={"user_id": user_id})
                if not results.get("ids"):
                    all_docs = collection.get()
                    results = {"ids": [ids for i, ids in enumerate(all_docs.get("ids", [])) if "user_id" not in all_docs.get("metadatas", [])[i]]}
            else:
                results = collection.get(where={"user_id": user_id})

            count = len(results["ids"]) if results and results.get("ids") else 0
            docs = self.get_document_list(user_id=user_id)
            return {
                "total_chunks": count,
                "total_documents": len(docs),
                "documents": docs,
                "embedding_model": self.embedding_key,
                "hybrid_search": self.enable_hybrid and self.bm25.is_ready,
                "reranking": self.enable_reranking,
            }
        except Exception:
            return {
                "total_chunks": 0,
                "total_documents": 0,
                "documents": [],
                "embedding_model": self.embedding_key,
                "hybrid_search": False,
                "reranking": False,
            }

    def get_all_text(self, user_id: str = "anonymous") -> str:
        """Get all document text for a specific user (for full-context queries)."""
        try:
            collection = self.vectorstore._collection
            results = collection.get(where={"user_id": user_id})
            if results and results["documents"]:
                return "\n\n".join(results["documents"])
        except Exception:
            pass
        return ""

    def get_documents_by_type(self) -> Dict[str, List[str]]:
        """Get documents grouped by type."""
        try:
            collection = self.vectorstore._collection
            results = collection.get()
            by_type: Dict[str, List[str]] = {}
            for meta in results.get("metadatas", []):
                if meta:
                    doc_type = meta.get("doc_type", "other")
                    filename = meta.get("filename", "?")
                    if doc_type not in by_type:
                        by_type[doc_type] = []
                    if filename not in by_type[doc_type]:
                        by_type[doc_type].append(filename)
            return by_type
        except Exception:
            return {}
