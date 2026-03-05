---
title: CareerAI
emoji: 🚀
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: true
---

<p align="center">
  <img src="https://i.postimg.cc/2yY6ztpG/ideogram-v3-0-Logo-minimalista-y-moderno-para-Career-AI-una-app-de-asistente-IA-para-carreras-p-0-(1.png" alt="CareerAI Logo" width="400">
</p>

<h1 align="center">CareerAI</h1>

<p align="center">
  <strong>AI-Powered Career Assistant | Asistente de Carrera con IA</strong><br>
  <em>Upload your CV → Get personalized career advice → Land your next job</em>
</p>

<p align="center">
  <a href="https://careerai-app.hf.space"><img src="https://img.shields.io/badge/🚀_Live_Demo-careerai--app.hf.space-00C853?style=for-the-badge" alt="Live Demo"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Groq-Llama_3.3_70B-F97316?logo=meta&logoColor=white" alt="Groq">
  <img src="https://img.shields.io/badge/RAG-Hybrid_Search-8B5CF6" alt="RAG">
  <img src="https://img.shields.io/badge/ChromaDB-Vector_Store-7C3AED" alt="ChromaDB">
  <img src="https://img.shields.io/badge/Docker-Deployed-2496ED?logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/License-MIT-EAB308" alt="License">
</p>

<p align="center">
  <a href="#-english">🇺🇸 English</a> · <a href="#-español">🇦🇷 Español</a>
</p>

---

# 🇺🇸 English

## What is CareerAI?

**CareerAI** is a full-stack AI web application that analyzes your professional documents (CV, cover letters, certificates) using Retrieval-Augmented Generation (RAG) to deliver accurate, context-aware career guidance — with zero hallucinations.

Built from scratch with a **5-stage hybrid search pipeline**, real-time streaming, and a premium Claude-style interface.

> **Try it now →** [careerai-app.hf.space](https://careerai-app.hf.space)

---

## Key Features

### AI Models

| Model | Engine | Use Case |
|-------|--------|----------|
| 🧠 **CareerAI Pro** | Llama 3.3 70B | Deep analysis, detailed responses |
| ⚡ **CareerAI Flash** | Llama 3.1 8B | Quick answers, instant feedback |

### 5 Specialized Modes

| Mode | Description |
|------|-------------|
| 💬 **General Chat** | Open-ended career consultation |
| 🎯 **Job Match** | Compatibility analysis with job postings (% match score) |
| ✉️ **Cover Letter** | Auto-generated cover letters based on your actual CV data |
| 📈 **Skills Gap** | Identifies missing skills + improvement roadmap |
| 🎤 **Mock Interview** | Simulated interviews with STAR method and technical questions |

### Platform Capabilities

| Category | Features |
|----------|----------|
| **Document Processing** | PDF, DOCX, TXT, JPG, PNG, WebP — including scanned documents via Vision AI |
| **Real-time Streaming** | Token-by-token response generation with live markdown rendering |
| **Export Engine** | Professional PDF, DOCX, HTML, TXT with smart filename generation |
| **Analytics Dashboard** | Skills radar chart, professional timeline, AI-powered insights |
| **Authentication** | JWT + BCrypt + Google OAuth + password recovery |
| **Job Search** | Live job listings from LinkedIn, Indeed, Glassdoor via JSearch API |
| **Responsive Design** | Premium dark-mode UI optimized for desktop, tablet, and mobile |
| **Cloud Persistence** | Conversations synced per user, guest sessions isolated |

---

## RAG Pipeline Architecture

CareerAI implements a **5-stage hybrid retrieval pipeline** that combines semantic understanding with lexical precision:

```
📝 User Query
     │
     ├── 1. Vector Search (Semantic)
     │     └── ChromaDB + BGE-M3 Embeddings (100+ languages)
     │
     ├── 2. Keyword Search (Lexical)
     │     └── BM25 with tokenized index
     │
     ├── 3. Reciprocal Rank Fusion (RRF)
     │     └── Merges and normalizes both result sets
     │
     ├── 4. Cross-Encoder Reranking
     │     └── BGE-Reranker-v2-m3 (fine-grained relevance scoring)
     │
     └── 5. LLM Generation
           └── Groq API + Llama 3.3 70B (streaming)
```

### Embedding Models

| Model | Languages | Size | Quality |
|-------|-----------|------|---------|
| 🌍 **BGE-M3** | 100+ | ~2.3 GB | ⭐⭐⭐⭐⭐ |
| 🚀 **GTE Multilingual** | 70+ | ~580 MB | ⭐⭐⭐⭐ |
| 📐 **Multilingual E5** | 100+ | ~1.1 GB | ⭐⭐⭐⭐ |
| ⚡ **MiniLM v2** | English | ~90 MB | ⭐⭐⭐ |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI + Uvicorn |
| **Frontend** | Vanilla HTML5 / CSS3 / JavaScript |
| **LLM** | Groq API (Llama 3.3 70B / Llama 3.1 8B) |
| **RAG** | ChromaDB + BM25 + BGE-M3 + Reranker + RRF |
| **Database** | SQLite + SQLAlchemy |
| **Auth** | JWT + BCrypt + Google OAuth 2.0 |
| **Vision AI** | Groq + Llama 4 Scout (scanned document OCR) |
| **Embeddings** | HuggingFace Sentence-Transformers |
| **Export** | FPDF2, python-docx |
| **Job Search** | JSearch API (RapidAPI) |
| **Deployment** | Docker + HuggingFace Spaces |

---

## Quick Start

### Prerequisites

- Python 3.10+
- [Groq API Key](https://console.groq.com) (free)

### Setup

```bash
# Clone
git clone https://github.com/Nicola671/CareerAI.git
cd CareerAI

# Virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Dependencies
pip install -r requirements.txt
```

### Configure

Create a `.env` file in the project root:

```env
# Required
GROQ_API_KEY=gsk_your_key_here
SECRET_KEY=your_random_secret_key

# Optional
JSEARCH_API_KEY=your_jsearch_key
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@gmail.com
```

### Run

```bash
uvicorn api:app --reload --port 8000
```

Open **http://localhost:8000** → ready to go.

---

## Deployment

CareerAI is deployed on **HuggingFace Spaces** using Docker:

```bash
# Add HF remote
git remote add hf https://huggingface.co/spaces/CareerAI/app

# Deploy (push to HF)
git push hf main --force
```

Set environment variables as **Secrets** in HF Space Settings.

| Env Variable | Required | Description |
|-------------|----------|-------------|
| `GROQ_API_KEY` | ✅ | LLM API key from console.groq.com |
| `SECRET_KEY` | ✅ | JWT signing key |
| `EMBEDDING_MODEL` | ❌ | Override embedding model (default: `bge-m3`) |
| `ENABLE_RERANKING` | ❌ | Enable/disable reranker (default: `true`) |
| `JSEARCH_API_KEY` | ❌ | Job search API |
| `MAIL_USERNAME` | ❌ | Gmail SMTP username |
| `MAIL_PASSWORD` | ❌ | Gmail app password |
| `MAIL_FROM` | ❌ | Sender email address |

---

## Project Structure

```
CareerAI/
├── api.py                        # FastAPI application (22 endpoints)
├── Dockerfile                    # Production Docker image
├── requirements.txt              # Python dependencies
├── render.yaml                   # Render deployment config
├── .env                          # Environment variables (git-ignored)
│
├── frontend/                     # Client-side application
│   ├── index.html                # HTML structure
│   ├── app.js                    # Application logic (1,842 lines)
│   ├── styles.css                # Design system (1,695 lines)
│   └── *.png                     # Icons and favicon
│
├── src/                          # Core modules
│   ├── rag_engine.py             # RAG v2.0 — Hybrid Search + Reranking
│   ├── career_assistant.py       # LLM orchestration — 5 specialized modes
│   ├── document_processor.py     # Multi-format extraction + Vision AI
│   ├── profile_extractor.py      # Profile analysis for dashboard
│   ├── exporter.py               # PDF / DOCX / HTML / TXT export
│   ├── auth.py                   # JWT + Google OAuth + email recovery
│   └── models.py                 # SQLAlchemy ORM (User, Conversation)
│
└── data/                         # Runtime data (git-ignored)
    ├── uploads/                  # User documents
    └── vectordb/                 # ChromaDB persistence
```

---

## API Reference

**22 endpoints** — full Swagger documentation at `/docs`

| Group | Method | Endpoint | Description |
|-------|--------|----------|-------------|
| Status | `GET` | `/api/status` | Health check + system info |
| Config | `POST` | `/api/config` | Configure API key and model |
| Config | `POST` | `/api/config/rag` | Configure RAG settings |
| Chat | `POST` | `/api/chat` | Single-response chat |
| Chat | `POST` | `/api/chat/stream` | SSE streaming chat |
| Documents | `POST` | `/api/documents/upload` | Upload and index document |
| Documents | `GET` | `/api/documents` | List indexed documents |
| Documents | `DELETE` | `/api/documents/{file}` | Remove document |
| Export | `POST` | `/api/export` | Export message to PDF/DOCX/HTML/TXT |
| Export | `POST` | `/api/export/conversation` | Export full conversation |
| Jobs | `GET` | `/api/jobs` | Search job listings |
| Dashboard | `GET` | `/api/dashboard` | AI profile analysis |
| Auth | `POST` | `/api/auth/register` | User registration |
| Auth | `POST` | `/api/auth/login` | User login |
| Auth | `GET` | `/api/auth/me` | Current user info |
| Auth | `POST` | `/api/auth/me` | Update profile |
| Auth | `POST` | `/api/auth/forgot-password` | Request password reset |
| Auth | `POST` | `/api/auth/reset-password` | Reset password with code |
| Auth | `POST` | `/api/auth/google` | Google OAuth login |
| Conversations | `GET` | `/api/conversations` | List saved conversations |
| Conversations | `POST` | `/api/conversations` | Save conversation |
| Conversations | `DELETE` | `/api/conversations/{id}` | Delete conversation |

---

## Metrics

| Metric | Value |
|--------|-------|
| Total lines of code | **8,400+** |
| API endpoints | **22** |
| Frontend functions | **80+** |
| Backend modules | **7** |
| Assistant modes | **5** |
| Export formats | **4** |
| Supported upload types | **7** |
| Embedding models | **4** |

---

---

# 🇦🇷 Español

## ¿Qué es CareerAI?

**CareerAI** es una aplicación web full-stack que analiza tus documentos profesionales (CV, cartas, certificados) usando Retrieval-Augmented Generation (RAG) para darte asesoramiento preciso y personalizado — sin alucinaciones.

Construida desde cero con un **pipeline de búsqueda híbrida de 5 etapas**, streaming en tiempo real, y una interfaz premium estilo Claude.

> **Probalo ahora →** [careerai-app.hf.space](https://careerai-app.hf.space)

---

## Funcionalidades

### Modelos de IA

| Modelo | Motor | Uso |
|--------|-------|-----|
| 🧠 **CareerAI Pro** | Llama 3.3 70B | Análisis profundo, respuestas detalladas |
| ⚡ **CareerAI Flash** | Llama 3.1 8B | Respuestas rápidas, feedback instantáneo |

### 5 Modos Especializados

| Modo | Descripción |
|------|-------------|
| 💬 **Chat General** | Consulta abierta sobre tu carrera |
| 🎯 **Job Match** | Análisis de compatibilidad con ofertas (% de match) |
| ✉️ **Cover Letter** | Cartas de presentación generadas desde tu CV real |
| 📈 **Skills Gap** | Habilidades faltantes + roadmap de mejora |
| 🎤 **Entrevista** | Simulación con preguntas técnicas y método STAR |

### Capacidades de la Plataforma

| Categoría | Características |
|-----------|----------------|
| **Procesamiento** | PDF, DOCX, TXT, JPG, PNG, WebP — incluyendo documentos escaneados con Vision AI |
| **Streaming** | Generación token-por-token con rendering markdown en vivo |
| **Exportación** | PDF, DOCX, HTML, TXT profesional con nombres inteligentes |
| **Dashboard** | Gráfico radar de skills, timeline profesional, insights con IA |
| **Autenticación** | JWT + BCrypt + Google OAuth + recuperación de contraseña |
| **Búsqueda de Empleo** | LinkedIn, Indeed, Glassdoor en tiempo real vía JSearch API |
| **Diseño** | UI premium dark-mode optimizada para desktop, tablet y móvil |
| **Persistencia** | Conversaciones sincronizadas por usuario |

---

## Arquitectura RAG

```
📝 Query del usuario
     │
     ├── 1. Búsqueda Vectorial (Semántica)
     │     └── ChromaDB + BGE-M3 (100+ idiomas)
     │
     ├── 2. Búsqueda por Keywords (Léxica)
     │     └── BM25 con índice tokenizado
     │
     ├── 3. Reciprocal Rank Fusion (RRF)
     │     └── Combina y normaliza ambos resultados
     │
     ├── 4. Reranking (Cross-Encoder)
     │     └── BGE-Reranker-v2-m3 (scoring de relevancia)
     │
     └── 5. Generación LLM
           └── Groq API + Llama 3.3 70B (streaming)
```

---

## Instalación Local

```bash
# Clonar
git clone https://github.com/Nicola671/CareerAI.git
cd CareerAI

# Entorno virtual
python -m venv venv
venv\Scripts\activate

# Dependencias
pip install -r requirements.txt
```

Creá un archivo `.env`:

```env
GROQ_API_KEY=gsk_tu_key_aqui
SECRET_KEY=tu_secret_random
```

```bash
# Ejecutar
uvicorn api:app --reload --port 8000
```

Abrí **http://localhost:8000** 🚀

---

## Costo Total

| Componente | Costo |
|-----------|-------|
| Groq API (Llama 3.3 70B) | ✅ Gratis |
| BGE-M3 Embeddings | ✅ Gratis (corre local) |
| BGE-Reranker-v2-m3 | ✅ Gratis (corre local) |
| ChromaDB + BM25 | ✅ Gratis (corre local) |
| HuggingFace Spaces (hosting) | ✅ Gratis |
| **Total** | **$0** |

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License — free to use, modify, and distribute.

---

<p align="center">
  <strong>Nicolás Medina</strong>
</p>

<p align="center">
  <a href="https://github.com/Nicola671">
    <img src="https://img.shields.io/badge/GitHub-Nicola671-181717?logo=github&logoColor=white&style=for-the-badge" alt="GitHub">
  </a>
  &nbsp;
  <a href="https://www.linkedin.com/in/nicolás-medina-33663237a">
    <img src="https://img.shields.io/badge/LinkedIn-Nicolás_Medina-0A66C2?logo=linkedin&logoColor=white&style=for-the-badge" alt="LinkedIn">
  </a>
  &nbsp;
  <a href="mailto:nicolasmedinae06@gmail.com">
    <img src="https://img.shields.io/badge/Email-Contact-EA4335?logo=gmail&logoColor=white&style=for-the-badge" alt="Email">
  </a>
</p>

<br>

<p align="center">
  <em>If this project helped you, consider giving it a ⭐ on GitHub!</em><br>
  <em>Si te sirvió, ¡dejale una ⭐ en GitHub!</em>
</p>

<br>

<p align="center">
  <strong>CareerAI v2.0</strong> — Full-Stack RAG + Groq + Docker<br>
  <em>Made with ❤️ in Argentina 🇦🇷</em>
</p>
