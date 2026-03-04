# 🚀 CareerAI - Asistente Inteligente de Carrera con RAG v2.0

<p align="center">
  <strong>Tu asistente de carrera profesional powered by IA + RAG Avanzado</strong><br>
  <em>100% Gratuito · Sin hallucinations · Basado en tus documentos reales</em>
</p>

---

## ✨ Características

| Feature | Descripción |
|---------|------------|
| 🎯 **Job Matching** | Analiza tu compatibilidad con ofertas de trabajo (% de match) |
| ✉️ **Cover Letters** | Genera cartas personalizadas usando datos reales de tu CV |
| 📈 **Skills Gap** | Identifica habilidades faltantes + roadmap para mejorar |
| 🎤 **Simulador de Entrevistas** | Practica entrevistas con preguntas técnicas y STAR |
| 💬 **Chat IA** | Pregunta lo que quieras sobre tu carrera |
| 🧠 **RAG Avanzado** | Hybrid Search + Reranking + Embeddings multilingual |
| 📄 **Multi-formato** | Soporta PDF, DOCX, TXT, imágenes (JPG, PNG, WebP) |
| ⚡ **Streaming** | Respuestas en tiempo real |
| 🎨 **UI Premium** | Diseño dark/light mode con glassmorphism |
| 📊 **Dashboard Visual** | Gráficos de skills, timeline, treemaps interactivos |

## 🛠️ Tech Stack

- **UI**: Streamlit
- **LLM**: Groq + Llama 3.3 70B (gratis)
- **Embeddings**: BGE-M3 multilingual (local, gratis) — seleccionable
- **Vector Store**: ChromaDB
- **Keyword Search**: BM25 (rank-bm25) para hybrid search
- **Reranking**: BGE-Reranker-v2-m3 (cross-encoder, local)
- **Fusion**: Reciprocal Rank Fusion (RRF) para combinar resultados
- **Orquestación**: LangChain
- **Parsing**: PyPDF, pdfplumber, PyMuPDF, python-docx
- **Vision AI**: Groq + Llama 4 Scout (fotos de documentos)
- **Exports**: PDF, DOCX, HTML, TXT con formato profesional

## 🧠 Modelos de Embedding Disponibles

| Modelo | Tamaño | Idiomas | Rendimiento |
|--------|--------|---------|-------------|
| 🌍 **BGE-M3** (Recomendado) | ~2.3 GB | 100+ | ⭐⭐⭐⭐⭐ |
| 🚀 **GTE Multilingual** | ~580 MB | 70+ | ⭐⭐⭐⭐ |
| 📐 **Multilingual E5** | ~1.1 GB | 100+ | ⭐⭐⭐⭐ |
| ⚡ **MiniLM v2** | ~90 MB | Solo EN | ⭐⭐⭐ |

## 🔍 Pipeline RAG v2.0

```
Query del usuario
    │
    ├─── 1. Vector Search (embeddings multilingual)
    │         └── ChromaDB + BGE-M3
    │
    ├─── 2. Keyword Search (BM25)
    │         └── rank-bm25 lexical matching
    │
    ├─── 3. Reciprocal Rank Fusion (RRF)
    │         └── Combina resultados semánticos + lexicales
    │
    ├─── 4. Reranking (Cross-Encoder)
    │         └── BGE-Reranker-v2-m3
    │
    └─── 5. LLM con contexto filtrado
              └── Groq + Llama 3.3 70B (streaming)
```

## 🚀 Setup Rápido

### 1. Crear entorno virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Obtener API Key (GRATIS)

1. Ve a [console.groq.com](https://console.groq.com)
2. Crea una cuenta gratis
3. Ve a "API Keys" → "Create API Key"
4. Copia tu key (empieza con `gsk_...`)

### 4. Ejecutar

```bash
streamlit run app.py
```

La app abrirá en `http://localhost:8501`

## 📖 Cómo Usar

1. **Pega tu API key** de Groq en la barra lateral
2. **Sube documentos**:
   - Tu CV/Resume (PDF, DOCX, TXT, imagen)
   - Ofertas de trabajo que te interesan
   - Tu perfil de LinkedIn exportado
3. **Configura el RAG** (opcional):
   - Selecciona modelo de embeddings
   - Activa/desactiva Hybrid Search y Reranking
4. **Selecciona un modo**:
   - 💬 Chat General
   - 🎯 Match de Jobs
   - ✉️ Cover Letter
   - 📈 Skills Gap
   - 🎤 Simulador de Entrevistas
5. **Pregunta lo que necesites!**

### Ejemplos de preguntas:
- *"¿Qué jobs me pegan al 90%?"*
- *"Genera cover letter para esta oferta"*
- *"¿Qué skills me faltan para ser Senior?"*
- *"Empezar simulación de entrevista"*
- *"Preguntas técnicas para mi perfil"*

## 📁 Estructura del Proyecto

```
CareerAI/
├── app.py                    # App principal Streamlit
├── requirements.txt          # Dependencias
├── .streamlit/
│   ├── config.toml          # Tema y configuración
│   └── secrets.toml         # API keys (no commitear!)
├── src/
│   ├── __init__.py
│   ├── document_processor.py # Parsing de documentos + Vision AI
│   ├── rag_engine.py        # Motor RAG v2.0 (Hybrid + Reranking)
│   ├── career_assistant.py  # Asistente IA (Groq + 5 modos)
│   ├── profile_extractor.py # Extractor de perfil para dashboard
│   └── exporter.py          # Exportación PDF/DOCX/HTML/TXT
└── data/
    ├── uploads/             # Documentos subidos
    └── vectordb/            # Base de datos vectorial
```

## 🆓 ¿Por qué es 100% gratis?

| Componente | Costo |
|-----------|-------|
| Groq API (Llama 3.3 70B) | ✅ Gratis (rate limits generosos) |
| BGE-M3 Embeddings | ✅ Gratis (corre local) |
| BGE-Reranker-v2-m3 | ✅ Gratis (corre local) |
| BM25 (rank-bm25) | ✅ Gratis (corre local) |
| ChromaDB | ✅ Gratis (corre local) |
| Streamlit | ✅ Gratis |

## 🔧 Modelos LLM Disponibles (todos gratis vía Groq)

| Modelo | Velocidad | Calidad | Contexto |
|--------|-----------|---------|----------|
| 🦙 Llama 3.3 70B | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 128K |
| ⚡ Llama 3.1 8B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 128K |
| 🔀 Mixtral 8x7B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 32K |
| 💎 Gemma 2 9B | ⭐⭐⭐⭐ | ⭐⭐⭐ | 8K |

---

<p align="center">
  Hecho con ❤️ usando Streamlit + LangChain + Groq<br>
  <em>CareerAI v2.0 — RAG Avanzado + Simulador de Entrevistas</em>
</p>
