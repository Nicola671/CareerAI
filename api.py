"""
🚀 CareerAI — FastAPI Backend
Connects the Claude-style frontend with the existing RAG + Groq + ChromaDB engine.
Run: uvicorn api:app --reload --port 8000
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Optional
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load .env file
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import (
    StreamingResponse,
    FileResponse,
    Response,
    JSONResponse,
)
from pydantic import BaseModel

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

from src.rag_engine import RAGEngine, EMBEDDING_MODELS
from src.career_assistant import CareerAssistant
from src.document_processor import DocumentProcessor
from src.exporter import (
    export_to_pdf,
    export_to_docx,
    export_to_html,
    export_to_txt,
    get_smart_filename,
    export_conversation_to_pdf,
    export_conversation_to_docx,
    export_conversation_to_html,
)
from src.profile_extractor import (
    extract_profile_from_text,
    generate_dashboard_insights,
    skills_by_category,
    skills_by_level,
    experience_for_timeline,
)

# Import Auth routers
from src.auth import router as auth_router, conv_router, get_user_or_session_id


# ======================== STATE ========================
class AppState:
    """Global application state (shared across requests)."""

    def __init__(self):
        self.rag_engine: Optional[RAGEngine] = None
        self.assistant: Optional[CareerAssistant] = None
        self.api_key: str = ""
        self.model: str = "llama-3.3-70b-versatile"
        self.api_configured: bool = False
        self.embedding_model: str = "bge-m3"
        self.enable_reranking: bool = True
        self.enable_hybrid: bool = True

    def get_rag(self) -> RAGEngine:
        if self.rag_engine is None:
            self.rag_engine = RAGEngine(
                embedding_key=self.embedding_model,
                enable_reranking=self.enable_reranking,
                enable_hybrid=self.enable_hybrid,
            )
        return self.rag_engine

    def reset_rag(self):
        """Reset RAG engine (e.g. when embedding model changes)."""
        self.rag_engine = None

    def init_assistant(self, api_key: str, model: str):
        self.assistant = CareerAssistant(api_key=api_key, model=model)
        self.api_key = api_key
        self.model = model
        self.api_configured = True


state = AppState()


# ======================== AUTO-LOAD API KEY ========================
def _auto_load_api_key():
    """Try to load API key from environment or secrets.toml."""
    # 1. Environment variable
    key = os.environ.get("GROQ_API_KEY", "")
    if key:
        return key

    # 2. .streamlit/secrets.toml
    try:
        import re as _re
        secrets_path = os.path.join(os.path.dirname(__file__), ".streamlit", "secrets.toml")
        if os.path.exists(secrets_path):
            with open(secrets_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GROQ_API_KEY"):
                        m = _re.search(r'"(.+?)"', line)
                        if m:
                            return m.group(1)
    except Exception:
        pass

    return ""


# ======================== STARTUP ========================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize on startup."""
    # Auto-configure API key
    key = _auto_load_api_key()
    if key:
        try:
            state.init_assistant(key, state.model)
            print(f"✅ Auto-connected with API key (model: {state.model})")
        except Exception as e:
            print(f"⚠️ Could not auto-connect: {e}")

    # Pre-initialize RAG engine
    try:
        rag = state.get_rag()
        stats = rag.get_stats()
        print(f"✅ RAG engine ready ({stats['total_documents']} docs, {stats['total_chunks']} chunks)")
    except Exception as e:
        print(f"⚠️ RAG engine init: {e}")

    yield
    print("🔴 CareerAI API shutting down")


# ======================== APP ========================
app = FastAPI(
    title="CareerAI API",
    description="Backend API for CareerAI Assistant",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan,
)

# Register specialized routers
app.include_router(auth_router)
app.include_router(conv_router)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
if os.path.isdir(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")


# ======================== MODELS ========================
class ChatRequest(BaseModel):
    query: str
    chat_history: List[Dict[str, str]] = []
    mode: str = "auto"  # "auto", "general", "job_match", "cover_letter", "skills_gap", "interview"


class ConfigRequest(BaseModel):
    api_key: str
    model: str = "llama-3.3-70b-versatile"


class RAGConfigRequest(BaseModel):
    embedding_model: str = "bge-m3"
    enable_reranking: bool = True
    enable_hybrid: bool = True


class ExportRequest(BaseModel):
    content: str
    format: str = "pdf"  # "pdf", "docx", "html", "txt"


class ConversationExportRequest(BaseModel):
    messages: List[Dict[str, str]]
    format: str = "pdf"


# ======================== ROUTES: FRONTEND ========================
@app.get("/")
async def serve_frontend():
    """Serve the main frontend page."""
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "CareerAI API is running. Frontend not found at /frontend/"}


# ======================== ROUTES: CONFIG ========================
@app.get("/api/status")
async def get_status(user_id: str = Depends(get_user_or_session_id)):
    """Get current API configuration status."""
    rag = state.get_rag()
    stats = rag.get_stats(user_id=user_id)
    return {
        "api_configured": state.api_configured,
        "model": state.model,
        "embedding_model": state.embedding_model,
        "enable_reranking": state.enable_reranking,
        "enable_hybrid": state.enable_hybrid,
        "documents": stats["documents"],
        "total_chunks": stats["total_chunks"],
        "total_documents": stats["total_documents"],
    }


# ======================== ROUTES: JOB SEARCH ========================
JSEARCH_API_KEY = os.environ.get("JSEARCH_API_KEY", "")

@app.get("/api/jobs")
async def search_jobs(
    query: str = Query(..., description="Job search terms, e.g. 'Python developer remote'"),
    country: str = Query("worldwide", description="Country code, e.g. 'ar', 'es', 'us'"),
    date_posted: str = Query("month", description="Filter: all, today, 3days, week, month"),
    employment_type: str = Query("", description="FULLTIME, PARTTIME, CONTRACTOR, INTERN (comma separated)"),
    remote_only: bool = Query(False, description="Only remote jobs"),
    num_pages: int = Query(1, description="Number of result pages (1 page = 10 jobs)"),
):
    """Search worldwide job listings via JSearch (LinkedIn, Indeed, Glassdoor, etc.)."""
    import httpx

    headers = {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": JSEARCH_API_KEY,
    }

    params = {
        "query": query,
        "page": "1",
        "num_pages": str(num_pages),
        "date_posted": date_posted,
    }
    if country and country != "worldwide":
        params["country"] = country
    if remote_only:
        params["remote_jobs_only"] = "true"
    if employment_type:
        params["employment_types"] = employment_type

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://jsearch.p.rapidapi.com/search",
                headers=headers,
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error consultando JSearch: {str(e)}")

    jobs = data.get("data", [])
    formatted = []
    for j in jobs:
        salary_min = j.get("job_min_salary")
        salary_max = j.get("job_max_salary")
        salary_currency = j.get("job_salary_currency", "")
        salary_period = j.get("job_salary_period", "")
        if salary_min and salary_max:
            salary_str = f"{salary_currency} {int(salary_min):,} – {int(salary_max):,} / {salary_period}"
        elif salary_min:
            salary_str = f"{salary_currency} {int(salary_min):,}+ / {salary_period}"
        else:
            salary_str = None

        formatted.append({
            "id": j.get("job_id", ""),
            "title": j.get("job_title", ""),
            "company": j.get("employer_name", ""),
            "company_logo": j.get("employer_logo", ""),
            "location": f"{j.get('job_city', '') or ''} {j.get('job_state', '') or ''} {j.get('job_country', '') or ''}".strip(),
            "employment_type": j.get("job_employment_type", ""),
            "is_remote": j.get("job_is_remote", False),
            "description_snippet": (j.get("job_description", "")[:220] + "…") if j.get("job_description") else "",
            "salary": salary_str,
            "posted_at": j.get("job_posted_at_datetime_utc", ""),
            "apply_link": j.get("job_apply_link", "#"),
            "publisher": j.get("job_publisher", ""),
        })

    return {"total": len(formatted), "jobs": formatted}


@app.post("/api/config")
async def configure_api(config: ConfigRequest):
    """Configure the Groq API key and model."""
    try:
        state.init_assistant(config.api_key, config.model)
        return {
            "success": True,
            "message": f"Conectado con {config.model}",
            "model": config.model,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/config/rag")
async def configure_rag(config: RAGConfigRequest):
    """Update RAG engine settings."""
    changed = False
    if config.embedding_model != state.embedding_model:
        state.embedding_model = config.embedding_model
        changed = True
    if config.enable_reranking != state.enable_reranking:
        state.enable_reranking = config.enable_reranking
        changed = True
    if config.enable_hybrid != state.enable_hybrid:
        state.enable_hybrid = config.enable_hybrid
        changed = True

    if changed:
        state.reset_rag()

    rag = state.get_rag()
    stats = rag.get_stats()
    return {
        "success": True,
        "embedding_model": state.embedding_model,
        "enable_reranking": state.enable_reranking,
        "enable_hybrid": state.enable_hybrid,
        "stats": stats,
    }


@app.get("/api/models")
async def list_models():
    """List available LLM models."""
    models = {
        "llama-3.3-70b-versatile": {"name": "CareerAI Pro", "description": "Recomendado · Máxima calidad"},
        "llama-3.1-8b-instant": {"name": "CareerAI Flash", "description": "Ultra rápido · Respuestas al instante"},
    }
    return {"models": models, "current": state.model}


@app.get("/api/embedding-models")
async def list_embedding_models():
    """List available embedding models."""
    result = {}
    for key, info in EMBEDDING_MODELS.items():
        result[key] = {
            "display": info["display"],
            "description": info.get("description", ""),
            "size": info.get("size", ""),
            "languages": info.get("languages", ""),
            "performance": info.get("performance", ""),
        }
    return {"models": result, "current": state.embedding_model}


@app.post("/api/model")
async def change_model(model: str = Query(...)):
    """Change the active LLM model."""
    if not state.api_configured:
        raise HTTPException(status_code=400, detail="API key not configured")
    try:
        state.init_assistant(state.api_key, model)
        return {"success": True, "model": model}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ======================== ROUTES: CHAT ========================
@app.post("/api/chat")
async def chat(request: ChatRequest, user_id: str = Depends(get_user_or_session_id)):
    """Send a message and get AI response (non-streaming)."""
    if not state.api_configured:
        raise HTTPException(
            status_code=400,
            detail="API key not configured. Use POST /api/config first.",
        )

    # Auto-detect mode
    mode = request.mode
    if mode == "auto":
        mode = state.assistant.detect_mode(request.query)

    # Get RAG context
    rag = state.get_rag()
    context = rag.get_context(request.query, k=8, user_id=user_id)

    # Get response
    try:
        response = state.assistant.chat(
            query=request.query,
            context=context,
            chat_history=request.chat_history,
            mode=mode,
        )
        return {
            "response": response,
            "mode": mode,
            "model": state.model,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest, user_id: str = Depends(get_user_or_session_id)):
    """Send a message and get AI response via Server-Sent Events (streaming)."""
    if not state.api_configured:
        raise HTTPException(
            status_code=400,
            detail="API key not configured",
        )

    # Auto-detect mode
    mode = request.mode
    if mode == "auto":
        mode = state.assistant.detect_mode(request.query)

    # Get RAG context
    rag = state.get_rag()
    context = rag.get_context(request.query, k=8, user_id=user_id)

    async def event_generator():
        """Stream response as SSE."""
        try:
            # Send mode info first
            yield f"data: {json.dumps({'type': 'mode', 'mode': mode})}\n\n"

            # Stream tokens
            for chunk in state.assistant.stream_chat(
                query=request.query,
                context=context,
                chat_history=request.chat_history,
                mode=mode,
            ):
                yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"

            # Done signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ======================== ROUTES: DOCUMENTS ========================
@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("cv"),
    user_id: str = Depends(get_user_or_session_id)
):
    """Upload and process a document through the RAG pipeline."""
    # Validate file type
    valid_extensions = [".pdf", ".txt", ".docx", ".doc", ".jpg", ".jpeg", ".png", ".webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in valid_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Supported: {', '.join(valid_extensions)}",
        )

    # Check if already indexed
    rag = state.get_rag()
    existing_docs = rag.get_document_list(user_id=user_id)
    if file.filename in existing_docs:
        return {
            "success": True,
            "already_indexed": True,
            "message": f"{file.filename} ya está indexado",
            "filename": file.filename,
        }

    # Save file
    upload_dir = os.path.join(os.path.dirname(__file__), "data", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Extract text
    try:
        api_key = state.api_key if state.api_configured else ""
        text = DocumentProcessor.extract_text(file_path, groq_api_key=api_key)
        if not text.strip():
            raise ValueError("No se pudo extraer texto del documento")

        # Chunk
        chunks = DocumentProcessor.chunk_text(text, chunk_size=400, overlap=80)

        # Key info
        info = DocumentProcessor.extract_key_info(text)

        # Add to RAG
        metadata = {
            "filename": file.filename,
            "doc_type": doc_type,
            "upload_date": datetime.now().isoformat(),
            "word_count": str(info["word_count"]),
        }
        num_chunks = rag.add_document(chunks, metadata, user_id=user_id)

        return {
            "success": True,
            "already_indexed": False,
            "filename": file.filename,
            "doc_type": doc_type,
            "text_length": len(text),
            "word_count": info["word_count"],
            "num_chunks": num_chunks,
            "message": f"{file.filename} procesado: {info['word_count']:,} palabras, {num_chunks} chunks",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents")
async def list_documents(user_id: str = Depends(get_user_or_session_id)):
    """List all indexed documents for user."""
    rag = state.get_rag()
    stats = rag.get_stats(user_id=user_id)
    return {
        "documents": stats["documents"],
        "total_documents": stats["total_documents"],
        "total_chunks": stats["total_chunks"],
    }


@app.delete("/api/documents/{filename}")
async def delete_document(
    filename: str,
    user_id: str = Depends(get_user_or_session_id)
):
    """Delete a document from the index."""
    try:
        rag = state.get_rag()
        rag.delete_document(filename, user_id=user_id)
        return {"success": True, "message": f"{filename} eliminado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ======================== ROUTES: EXPORT ========================
@app.post("/api/export")
async def export_content(request: ExportRequest):
    """Export a single message/content to PDF, DOCX, HTML, or TXT."""
    fmt = request.format.lower()
    filename = get_smart_filename(request.content, fmt)

    try:
        if fmt == "pdf":
            data = export_to_pdf(request.content)
            mime = "application/pdf"
        elif fmt == "docx":
            data = export_to_docx(request.content)
            mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif fmt == "html":
            data = export_to_html(request.content)
            mime = "text/html"
        elif fmt == "txt":
            data = export_to_txt(request.content)
            mime = "text/plain"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {fmt}")

        return Response(
            content=data,
            media_type=mime,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export/conversation")
async def export_conversation(request: ConversationExportRequest):
    """Export full conversation history."""
    fmt = request.format.lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"CareerAI_Chat_{timestamp}.{fmt}"

    try:
        if fmt == "pdf":
            data = export_conversation_to_pdf(request.messages)
            mime = "application/pdf"
        elif fmt == "docx":
            data = export_conversation_to_docx(request.messages)
            mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif fmt == "html":
            data = export_conversation_to_html(request.messages)
            mime = "text/html"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {fmt}")

        return Response(
            content=data,
            media_type=mime,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ======================== ROUTES: DETECT MODE ========================
@app.get("/api/detect-mode")
async def detect_mode(query: str = Query(...)):
    """Auto-detect the best assistant mode for a query."""
    if not state.api_configured:
        return {"mode": "general"}
    mode = state.assistant.detect_mode(query)
    return {"mode": mode}


# ======================== ROUTES: DASHBOARD ========================
@app.get("/api/dashboard")
async def dashboard_data(user_id: str = Depends(get_user_or_session_id)):
    """Extract profile data from documents for dashboard charts and insights."""
    if not state.api_configured:
        return {
            "has_data": False,
            "error": "API not configured",
        }

    rag = state.get_rag()
    all_text = rag.get_all_text(user_id=user_id)
    if not all_text.strip():
        return {
            "has_data": False,
            "error": "No documents indexed",
        }

    try:
        # Extract profile from documents
        profile = extract_profile_from_text(all_text, state.assistant.llm)

        skills = profile.get("skills", [])
        experience = profile.get("experience", [])
        summary = profile.get("summary", {})

        # Build chart data
        cat_data = skills_by_category(skills)
        level_data = skills_by_level(skills)
        timeline = experience_for_timeline(experience)

        # Generate insights
        insights = generate_dashboard_insights(profile, state.assistant.llm)

        return {
            "has_data": True,
            "summary": summary,
            "skills": skills,
            "skills_by_category": cat_data,
            "skills_by_level": level_data,
            "experience_timeline": timeline,
            "insights": insights,
            "total_skills": len(skills),
            "total_experience": len(experience),
        }

    except Exception as e:
        return {
            "has_data": False,
            "error": str(e),
        }


# ======================== HEALTH ========================
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "api_configured": state.api_configured,
        "model": state.model,
    }


# ======================== RUN ========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
