<p align="center">
  <img src="https://i.postimg.cc/2yY6ztpG/ideogram-v3-0-Logo-minimalista-y-moderno-para-Career-AI-una-app-de-asistente-IA-para-carreras-p-0-(1.png" alt="CareerAI Logo" width="420">
</p>

<h1 align="center">CareerAI</h1>

<p align="center">
  <strong>🧠 AI-Powered Career Assistant | Asistente Inteligente de Carrera</strong><br>
  <em>Analyze your CV · Generate Cover Letters · Simulate Interviews · Search Jobs</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.115+-green?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Groq-Llama_3.3-orange?logo=meta&logoColor=white" alt="Groq">
  <img src="https://img.shields.io/badge/ChromaDB-Vector_Store-purple" alt="ChromaDB">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

<p align="center">
  <a href="#-english">🇺🇸 English</a> · <a href="#-español">🇦🇷 Español</a>
</p>

---

# 🇺🇸 English

## 🎬 What is CareerAI?

**CareerAI** is an AI-powered web application that helps you boost your professional career. Upload your documents (CV, cover letters, certificates) and the AI assistant analyzes them using advanced Retrieval-Augmented Generation (RAG) to give you personalized recommendations, generate professional documents, and prepare you for job interviews.

### ✨ 100% Free · No hallucinations · Based on your real documents

---

## 🚀 Key Features

### 🤖 Custom AI Models

| Model | Engine | Description |
|-------|--------|-------------|
| 🧠 **CareerAI Pro** | Llama 3.3 70B | Maximum quality · Detailed responses |
| ⚡ **CareerAI Flash** | Llama 3.1 8B | Ultra fast · Instant responses |

### 💬 5 Assistant Modes

| Mode | What it does |
|------|-------------|
| 💬 **General Chat** | Ask anything about your professional career |
| 🎯 **Job Match** | Analyze your compatibility with job offers (% match) |
| ✉️ **Cover Letter** | Generate personalized cover letters using your real CV |
| 📈 **Skills Gap** | Identify missing skills + roadmap to improve |
| 🎤 **Interview** | Simulate interviews with technical and STAR method questions |

### 📋 Full Feature List

| Feature | Description |
|---------|-------------|
| 📄 **Multi-format** | Supports PDF, DOCX, TXT, images (JPG, PNG, WebP) |
| 🖼️ **Vision AI** | Smart reading of scanned PDFs and document photos |
| ⚡ **Streaming** | Real-time token-by-token responses |
| 📤 **Premium Export** | Export to PDF, DOCX, HTML, TXT with professional formatting |
| 📊 **Dashboard** | Skills charts, professional timeline, AI insights |
| 🔐 **Full Auth** | Register, login, Google OAuth, password reset |
| 💼 **Job Search** | Integration with LinkedIn, Indeed, Glassdoor via JSearch |
| 🎨 **Premium UI** | Claude/ChatGPT-style design with dark mode |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |
| 💾 **Persistence** | Chat history synced to the cloud |

---

## 🧠 RAG Pipeline v2.0

CareerAI uses an advanced retrieval pipeline combining multiple techniques to find the most relevant information from your documents:

```
📝 User Query
     │
     ├── 1️⃣ Vector Search (Semantic)
     │      └── ChromaDB + BGE-M3 (100+ languages)
     │
     ├── 2️⃣ Keyword Search (Lexical)
     │      └── BM25 lexical matching
     │
     ├── 3️⃣ Reciprocal Rank Fusion (RRF)
     │      └── Merges semantic + lexical results
     │
     ├── 4️⃣ Reranking (Cross-Encoder)
     │      └── BGE-Reranker-v2-m3 (relevance reordering)
     │
     └── 5️⃣ LLM with optimized context
            └── Groq + Llama 3.3 70B (streaming)
```

### Available Embedding Models

| Model | Languages | Size | Performance |
|-------|-----------|------|-------------|
| 🌍 **BGE-M3** (Recommended) | 100+ | ~2.3 GB | ⭐⭐⭐⭐⭐ |
| 🚀 **GTE Multilingual** | 70+ | ~580 MB | ⭐⭐⭐⭐ |
| 📐 **Multilingual E5** | 100+ | ~1.1 GB | ⭐⭐⭐⭐ |
| ⚡ **MiniLM v2** | English | ~90 MB | ⭐⭐⭐ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI + Uvicorn |
| **Frontend** | HTML5 + CSS3 + JavaScript (Claude-style) |
| **LLM** | Groq API (Llama 3.3 70B / Llama 3.1 8B) |
| **RAG** | ChromaDB + BM25 + BGE-M3 + Reranker + RRF |
| **Database** | SQLite + SQLAlchemy |
| **Auth** | JWT + BCrypt + Google OAuth |
| **Email** | FastAPI-Mail + Gmail SMTP |
| **Vision AI** | Groq + Llama 4 Scout |
| **Embeddings** | HuggingFace (BGE-M3, GTE, E5, MiniLM) |
| **Export** | FPDF2, python-docx |
| **Job Search** | JSearch API (RapidAPI) |

---

## � Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Nicola671/CareerAI.git
cd CareerAI
```

### 2. Create virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
# Groq API Key (free from console.groq.com)
GROQ_API_KEY=your_api_key_here

# JWT Secret (change to something random)
SECRET_KEY=your_very_long_random_secret_key

# Email for password recovery (optional)
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@gmail.com

# JSearch API Key for job search (optional)
JSEARCH_API_KEY=your_jsearch_key
```

### 5. Get Groq API Key (FREE)

1. Go to [console.groq.com](https://console.groq.com)
2. Create a free account
3. Go to "API Keys" → "Create API Key"
4. Copy your key (starts with `gsk_...`)
5. Paste it in your `.env` file

### 6. Run

```bash
uvicorn api:app --reload --port 8000
```

Open **http://localhost:8000** in your browser 🚀

---

## � API Endpoints (22 routes)

| Group | Endpoints | Description |
|-------|-----------|-------------|
| 🏠 Frontend | `GET /` | Serves the web app |
| ⚙️ Config | `GET /api/status`, `POST /api/config` | Status & configuration |
| 💬 Chat | `POST /api/chat`, `POST /api/chat/stream` | Chat with/without streaming |
| 📄 Docs | `POST /api/documents`, `GET /api/documents`, `DELETE /api/documents/{file}` | Document CRUD |
| 📤 Export | `POST /api/export`, `POST /api/export/conversation` | Export to PDF/DOCX/HTML/TXT |
| 💼 Jobs | `GET /api/jobs` | Job search |
| 📊 Dashboard | `GET /api/dashboard` | AI-powered profile analysis |
| 🔐 Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Full authentication |

Interactive API docs: **http://localhost:8000/docs** (Swagger UI)

---

## 📊 Project Metrics

| Metric | Value |
|--------|-------|
| Lines of code | 8,400+ |
| API Endpoints | 22 |
| Frontend functions | 80+ |
| Backend functions | 60+ |
| Assistant modes | 5 |
| Export formats | 4 (PDF, DOCX, HTML, TXT) |
| Upload formats | 7 (PDF, DOCX, TXT, JPG, PNG, WEBP) |
| Embedding models | 4 |

---

---

# 🇦🇷 Español

## 🎬 ¿Qué es CareerAI?

**CareerAI** es una aplicación web de inteligencia artificial que te ayuda a impulsar tu carrera profesional. Subís tus documentos (CV, cartas, certificados) y el asistente los analiza con IA avanzada (RAG) para darte recomendaciones personalizadas, generar documentos profesionales y prepararte para entrevistas.

### ✨ Todo esto 100% gratis · Sin alucinaciones · Basado en tus documentos reales

---

## 🚀 Funcionalidades Principales

### 🤖 Modelos de IA Personalizados

| Modelo | Motor | Descripción |
|--------|-------|-------------|
| 🧠 **CareerAI Pro** | Llama 3.3 70B | Máxima calidad · Respuestas detalladas |
| ⚡ **CareerAI Flash** | Llama 3.1 8B | Ultra rápido · Respuestas al instante |

### 💬 5 Modos del Asistente

| Modo | Qué hace |
|------|----------|
| 💬 **Chat General** | Consultá lo que quieras sobre tu carrera profesional |
| 🎯 **Job Match** | Analizá tu compatibilidad con ofertas de trabajo (% de match) |
| ✉️ **Cover Letter** | Generá cartas de presentación personalizadas usando tu CV real |
| 📈 **Skills Gap** | Identificá habilidades faltantes + roadmap para mejorar |
| 🎤 **Entrevista** | Simulá entrevistas con preguntas técnicas y método STAR |

### 📋 Lista Completa de Características

| Feature | Descripción |
|---------|-------------|
| 📄 **Multi-formato** | Soporta PDF, DOCX, TXT, imágenes (JPG, PNG, WebP) |
| 🖼️ **Vision AI** | Lectura inteligente de PDFs escaneados y fotos de documentos |
| ⚡ **Streaming** | Respuestas en tiempo real token por token |
| 📤 **Export Premium** | Exportá a PDF, DOCX, HTML, TXT con formato profesional |
| 📊 **Dashboard** | Gráficos de skills, timeline profesional, insights de IA |
| 🔐 **Auth Completo** | Registro, login, Google OAuth, reset de contraseña |
| 💼 **Búsqueda de Empleo** | Integración con LinkedIn, Indeed, Glassdoor via JSearch |
| 🎨 **UI Premium** | Diseño tipo Claude/ChatGPT con dark mode |
| 📱 **Responsive** | Funciona en desktop, tablet y celular |
| 💾 **Persistencia** | Historial de chats sincronizado en la nube |

---

## 🧠 Pipeline RAG v2.0

CareerAI usa un pipeline de retrieval avanzado que combina múltiples técnicas para encontrar la información más relevante de tus documentos:

```
📝 Query del usuario
     │
     ├── 1️⃣ Vector Search (Semántico)
     │      └── ChromaDB + BGE-M3 (100+ idiomas)
     │
     ├── 2️⃣ Keyword Search (Léxico)
     │      └── BM25 lexical matching
     │
     ├── 3️⃣ Reciprocal Rank Fusion (RRF)
     │      └── Combina resultados semánticos + léxicos
     │
     ├── 4️⃣ Reranking (Cross-Encoder)
     │      └── BGE-Reranker-v2-m3 (reordena por relevancia)
     │
     └── 5️⃣ LLM con contexto optimizado
            └── Groq + Llama 3.3 70B (streaming)
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | FastAPI + Uvicorn |
| **Frontend** | HTML5 + CSS3 + JavaScript (estilo Claude) |
| **LLM** | Groq API (Llama 3.3 70B / Llama 3.1 8B) |
| **RAG** | ChromaDB + BM25 + BGE-M3 + Reranker + RRF |
| **Base de datos** | SQLite + SQLAlchemy |
| **Auth** | JWT + BCrypt + Google OAuth |
| **Email** | FastAPI-Mail + Gmail SMTP |
| **Vision AI** | Groq + Llama 4 Scout |
| **Embeddings** | HuggingFace (BGE-M3, GTE, E5, MiniLM) |
| **Exportación** | FPDF2, python-docx |
| **Búsqueda** | JSearch API (RapidAPI) |

---

## 🚀 Instalación y Setup

### 1. Clonar el repositorio

```bash
git clone https://github.com/Nicola671/CareerAI.git
cd CareerAI
```

### 2. Crear entorno virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Creá un archivo `.env` en la raíz del proyecto:

```env
# Groq API Key (gratis desde console.groq.com)
GROQ_API_KEY=tu_api_key_aqui

# JWT Secret (cambiá por algo aleatorio)
SECRET_KEY=tu_secret_key_muy_larga_y_aleatoria

# Email para recuperación de contraseña (opcional)
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password
MAIL_FROM=tu_email@gmail.com

# JSearch API Key para búsqueda de empleos (opcional)
JSEARCH_API_KEY=tu_jsearch_key
```

### 5. Obtener API Key de Groq (GRATIS)

1. Andá a [console.groq.com](https://console.groq.com)
2. Creá una cuenta gratis
3. Andá a "API Keys" → "Create API Key"
4. Copiá tu key (empieza con `gsk_...`)
5. Pegala en el archivo `.env`

### 6. Ejecutar

```bash
uvicorn api:app --reload --port 8000
```

Abrí **http://localhost:8000** en tu navegador 🚀

---

## � Estructura del Proyecto

```
CareerAI/
├── api.py                        # 🚀 Backend FastAPI (22 endpoints)
├── requirements.txt              # 📦 Dependencias Python
├── .env                          # 🔐 Variables de entorno (NO se sube a Git)
├── README.md                     # 📖 Este archivo
│
├── frontend/                     # 🎨 UI tipo Claude
│   ├── index.html                # Estructura HTML
│   ├── app.js                    # Lógica completa (1,842 líneas)
│   ├── styles.css                # Sistema de diseño (1,695 líneas)
│   ├── icon-pro.png              # 🧠 Icono CareerAI Pro
│   ├── icon-flash.png            # ⚡ Icono CareerAI Flash
│   └── favicon.png               # Favicon
│
├── src/                          # 🧠 Core Engine
│   ├── career_assistant.py       # Motor IA con 5 modos especializados
│   ├── rag_engine.py             # RAG v2.0 (Hybrid + Reranking + RRF)
│   ├── document_processor.py     # Procesador multi-formato + Vision AI
│   ├── profile_extractor.py      # Extractor de perfil para dashboard
│   ├── exporter.py               # Exportación PDF/DOCX/HTML/TXT
│   ├── auth.py                   # Autenticación (JWT + Google OAuth)
│   └── models.py                 # Modelos SQLAlchemy (User, Conversation)
│
└── data/                         # 💾 Datos (no se suben a Git)
    ├── uploads/                  # Documentos subidos
    └── vectordb/                 # ChromaDB persistencia
```

---

## 🆓 ¿Por qué es 100% Gratis? / Why is it 100% Free?

| Component | Cost |
|-----------|------|
| Groq API (Llama 3.3 70B) | ✅ Free (generous rate limits) |
| BGE-M3 Embeddings | ✅ Free (runs locally) |
| BGE-Reranker-v2-m3 | ✅ Free (runs locally) |
| BM25 Keyword Search | ✅ Free (runs locally) |
| ChromaDB Vector Store | ✅ Free (runs locally) |
| FastAPI + Frontend | ✅ Free (open source) |
| SQLite Database | ✅ Free (runs locally) |

---

## 🤝 Contributing

Contributions are welcome! If you want to improve CareerAI:

1. Fork the repository
2. Create a branch: `git checkout -b feature/new-feature`
3. Commit: `git commit -m "Add new feature"`
4. Push: `git push origin feature/new-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it.

---

## 👨‍💻 Author / Autor

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
    <img src="https://img.shields.io/badge/Email-nicolasmedinae06@gmail.com-EA4335?logo=gmail&logoColor=white&style=for-the-badge" alt="Email">
  </a>
</p>

<br>

<p align="center">
  <em>If this project helped you, consider giving it a ⭐ on GitHub!</em><br>
  <em>Si este proyecto te ayudó, ¡considerá darle una ⭐ en GitHub!</em>
</p>

<br>

<p align="center">
  <strong>CareerAI v1.0</strong> — FastAPI + RAG v2.0 + Groq<br>
  <em>Made with ❤️ in Argentina 🇦🇷</em>
</p>
