<p align="center">
  <img src="https://i.postimg.cc/2yY6ztpG/ideogram-v3-0-Logo-minimalista-y-moderno-para-Career-AI-una-app-de-asistente-IA-para-carreras-p-0-(1.png" alt="CareerAI Logo" width="80">
</p>

<h1 align="center">CareerAI</h1>

<p align="center">
  <strong>🧠 Asistente Inteligente de Carrera Profesional</strong><br>
  <em>Analiza tu CV · Genera Cover Letters · Simula Entrevistas · Busca Empleos</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.115+-green?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Groq-Llama_3.3-orange?logo=meta&logoColor=white" alt="Groq">
  <img src="https://img.shields.io/badge/ChromaDB-Vector_Store-purple" alt="ChromaDB">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

---

## 🎬 ¿Qué es CareerAI?

**CareerAI** es una aplicación web de inteligencia artificial que te ayuda a impulsar tu carrera profesional. Subís tus documentos (CV, cartas, certificados) y el asistente los analiza con IA avanzada para darte recomendaciones personalizadas, generar documentos profesionales y prepararte para entrevistas.

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

### � Características Completas

| Feature | Descripción |
|---------|-------------|
| 📄 **Multi-formato** | Soporta PDF, DOCX, TXT, imágenes (JPG, PNG, WebP) |
| 🖼️ **Vision AI** | Lectura inteligente de PDFs escaneados y fotos de documentos |
| ⚡ **Streaming** | Respuestas en tiempo real token por token |
| 📤 **Export Premium** | Exportá a PDF, DOCX, HTML, TXT con formato profesional |
| 📊 **Dashboard** | Gráficos de skills, timeline profesional, insights de IA |
| 🔐 **Auth Completo** | Registro, login, Google OAuth, reset de contraseña |
| � **Búsqueda de Empleo** | Integración con LinkedIn, Indeed, Glassdoor via JSearch |
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

### Modelos de Embedding Disponibles

| Modelo | Idiomas | Tamaño | Rendimiento |
|--------|---------|--------|-------------|
| 🌍 **BGE-M3** (Recomendado) | 100+ | ~2.3 GB | ⭐⭐⭐⭐⭐ |
| 🚀 **GTE Multilingual** | 70+ | ~580 MB | ⭐⭐⭐⭐ |
| 📐 **Multilingual E5** | 100+ | ~1.1 GB | ⭐⭐⭐⭐ |
| ⚡ **MiniLM v2** | Inglés | ~90 MB | ⭐⭐⭐ |

---

## �️ Tech Stack

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
| **Job Search** | JSearch API (RapidAPI) |

---

## 📁 Estructura del Proyecto

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

## 📖 Cómo Usar

1. **Configurá tu API key** de Groq (si no está en `.env`, la app te la pide)
2. **Subí documentos**: CV, ofertas de trabajo, certificados (PDF, DOCX, TXT, imágenes)
3. **Elegí un modelo**: CareerAI Pro (máxima calidad) o CareerAI Flash (ultra rápido)
4. **Preguntá lo que necesites**:

### Ejemplos de consultas:

| Modo | Ejemplo |
|------|---------|
| 💬 General | *"¿Qué puedo mejorar en mi perfil profesional?"* |
| 🎯 Job Match | *"¿Qué porcentaje de compatibilidad tengo con esta oferta?"* |
| ✉️ Cover Letter | *"Generame una carta de presentación para este puesto"* |
| 📈 Skills Gap | *"¿Qué skills me faltan para ser Senior Developer?"* |
| 🎤 Entrevista | *"Simulá una entrevista técnica para mi perfil"* |

---

## � API Endpoints (22 rutas)

| Grupo | Endpoints | Descripción |
|-------|-----------|-------------|
| 🏠 Frontend | `GET /` | Sirve la aplicación web |
| ⚙️ Config | `GET /api/status`, `POST /api/config` | Estado y configuración |
| 💬 Chat | `POST /api/chat`, `POST /api/chat/stream` | Chat con/sin streaming |
| 📄 Docs | `POST /api/documents`, `GET /api/documents`, `DELETE /api/documents/{file}` | CRUD de documentos |
| 📤 Export | `POST /api/export`, `POST /api/export/conversation` | Exportar a PDF/DOCX/HTML/TXT |
| 💼 Jobs | `GET /api/jobs` | Búsqueda de empleos |
| 📊 Dashboard | `GET /api/dashboard` | Análisis de perfil con IA |
| 🔐 Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Autenticación completa |

Documentación interactiva disponible en: **http://localhost:8000/docs** (Swagger UI)

---

## 🆓 ¿Por qué es 100% Gratis?

| Componente | Costo |
|-----------|-------|
| Groq API (Llama 3.3 70B) | ✅ Gratis (rate limits generosos) |
| BGE-M3 Embeddings | ✅ Gratis (corre local) |
| BGE-Reranker-v2-m3 | ✅ Gratis (corre local) |
| BM25 Keyword Search | ✅ Gratis (corre local) |
| ChromaDB Vector Store | ✅ Gratis (corre local) |
| FastAPI + Frontend | ✅ Gratis (open source) |
| SQLite Database | ✅ Gratis (corre local) |

---

## 📊 Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Líneas de código | 8,400+ |
| Endpoints API | 22 |
| Funciones frontend | 80+ |
| Funciones backend | 60+ |
| Modos de asistente | 5 |
| Formatos de export | 4 (PDF, DOCX, HTML, TXT) |
| Formatos de upload | 7 (PDF, DOCX, TXT, JPG, PNG, WEBP) |
| Modelos de embedding | 4 |

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si querés mejorar CareerAI:

1. Hacé un Fork del repositorio
2. Creá una rama: `git checkout -b feature/nueva-feature`
3. Hacé commit: `git commit -m "Agrega nueva feature"`
4. Pusheá: `git push origin feature/nueva-feature`
5. Abrí un Pull Request

---

## � Licencia

Este proyecto está bajo la licencia MIT. Sentite libre de usarlo, modificarlo y distribuirlo.

---

<p align="center">
  <strong>Hecho con ❤️ por <a href="https://github.com/Nicola671">Nicola671</a></strong><br>
  <em>CareerAI v1.0 — FastAPI + RAG v2.0 + Groq</em>
</p>
