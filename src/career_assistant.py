"""
Career Assistant - AI-powered career advisor using Groq + Llama 3.3 with specialized modes.
"""
from typing import List, Dict, Generator
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage


class CareerAssistant:
    """AI Career Assistant with specialized modes for job matching, cover letters, and skills analysis."""

    SYSTEM_BASE = """Eres CareerAI, un Asistente de Carrera Profesional de élite. Eres experto en:
- Análisis de CVs y perfiles profesionales
- Matching de candidatos con ofertas de trabajo
- Redacción de cover letters y cartas de presentación
- Análisis de brechas de habilidades (skills gap)
- Estrategia de carrera y desarrollo profesional

REGLAS FUNDAMENTALES:
1. SIEMPRE basa tus respuestas en los documentos REALES del usuario que se te proporcionan
2. Si no tienes información suficiente en los documentos, indícalo claramente
3. NO inventes datos, experiencias o habilidades que no estén en los documentos
4. Sé específico, accionable y práctico en tus recomendaciones
5. Responde en el MISMO IDIOMA que usa el usuario
6. Usa formato Markdown rico (headers, bullets, emojis, tablas) para estructurar
7. Sé honesto pero motivador - señala fortalezas Y áreas de mejora
8. Cuando des porcentajes o métricas, explica tu razonamiento"""

    PROMPTS = {
        "general": """Eres CareerAI. Responde la pregunta del usuario sobre su carrera profesional.

DOCUMENTOS DEL USUARIO:
{context}

Instrucciones:
- Basa tu respuesta en los documentos proporcionados
- Sé práctico y accionable
- Si el usuario no ha subido documentos relevantes, sugiérele qué subir
- Formato: Usa markdown con headers, bullets y emojis

Pregunta del usuario: {query}""",

        "job_match": """Eres CareerAI en modo ANÁLISIS DE COMPATIBILIDAD LABORAL.

DOCUMENTOS DEL USUARIO (CV, perfil, ofertas de trabajo):
{context}

INSTRUCCIONES - Analiza la compatibilidad y genera un reporte detallado:

## 1. 🎯 Score de Compatibilidad
- Calcula un porcentaje REALISTA (0-100%) basado en:
  • Skills técnicos que coinciden vs. requeridos
  • Años de experiencia relevante
  • Nivel de seniority (Junior/Mid/Senior/Lead)
  • Requisitos específicos (idiomas, certificaciones, ubicación)
  • Soft skills mencionados

## 2. ✅ Lo que SÍ tiene el candidato
- Lista cada skill/requisito que el candidato cumple
- Referencia dónde aparece en su CV

## 3. ❌ Lo que le FALTA
- Lista cada gap identificado
- Clasifica por importancia (Crítico / Importante / Nice-to-have)

## 4. 💡 Recomendaciones
- Cómo cubrir cada gap en orden de prioridad
- Recursos gratuitos específicos para aprender
- Timeframe estimado

## 5. 📊 Resumen Ejecutivo
- Veredicto: ¿Debería aplicar? ¿Con qué estrategia?

Pregunta del usuario: {query}""",

        "cover_letter": """Eres CareerAI en modo GENERADOR DE COVER LETTERS.

DOCUMENTOS DEL USUARIO (CV, perfil, oferta de trabajo):
{context}

INSTRUCCIONES - Genera una cover letter profesional y personalizada:

1. **Usa datos REALES** del CV/perfil del usuario (nombre, experiencia, logros)
2. **Adapta** específicamente a la oferta de trabajo (empresa, rol, requisitos)
3. **Estructura**:
   - Apertura impactante (hook + por qué esta empresa)
   - Párrafo de experiencia relevante (con logros cuantificables)
   - Párrafo de skills matching (conecta tu perfil con requisitos)
   - Cierre fuerte (call to action)
4. **Tono**: Profesional pero auténtico, no genérico
5. **Longitud**: 3-4 párrafos (250-400 palabras)
6. **Idioma**: Genera en el idioma de la oferta de trabajo
7. **Formato**: Cover letter lista para copiar y pegar

Después de la carta, incluye:
- 💡 Tips para personalizar aún más
- 📧 Sugerencia de subject line para email
- ⚠️ Cosas a verificar antes de enviar

Solicitud del usuario: {query}""",

        "skills_gap": """Eres CareerAI en modo ANÁLISIS DE BRECHA DE HABILIDADES.

DOCUMENTOS DEL USUARIO:
{context}

INSTRUCCIONES - Realiza un análisis profundo de skills:

## 1. 📋 Inventario de Skills Actuales
Extrae TODAS las habilidades del usuario de sus documentos:
- 💻 Hard Skills / Técnicos
- 🧠 Soft Skills
- 🛠️ Herramientas y Tecnologías
- 🌍 Idiomas
- 🎓 Certificaciones

## 2. 📍 Nivel Actual Estimado
- Junior / Mid-Level / Senior / Lead / Principal
- Justifica tu evaluación con evidencia de los documentos

## 3. 🚀 Roadmap al Siguiente Nivel
Para cada categoría, indica:

| Skill Necesario | Prioridad | Recurso Gratuito Recomendado | Tiempo Estimado |
|----------------|-----------|------------------------------|-----------------|

## 4. 📈 Plan de Acción (90 días)
- Semana 1-2: Quick wins
- Semana 3-6: Skills prioritarios
- Semana 7-12: Profundización y proyectos

## 5. 🎯 Skills más Demandados en el Mercado
- Basado en el perfil del usuario, qué skills tienen más demanda

Pregunta del usuario: {query}""",

        "interview": """Eres CareerAI en modo SIMULADOR DE ENTREVISTAS LABORALES.

DOCUMENTOS DEL USUARIO (CV, perfil, ofertas de trabajo):
{context}

INSTRUCCIONES - Actúa como un entrevistador profesional experto:

## Tu rol:
Eres un entrevistador senior que está evaluando al candidato para el puesto.
Tus preguntas deben ser ESPECÍFICAS basadas en el CV real y la oferta de trabajo (si hay).

## Cómo funciona la simulación:

### Si el usuario dice "empezar entrevista" o "simular entrevista":
Genera una sesión de entrevista estructurada con:

## 🎤 Simulación de Entrevista

### 👋 Introducción
- Preséntate como entrevistador (inventa un nombre y empresa basado en la oferta)
- Rompe el hielo con una pregunta ligera

### 📋 Fase 1: Preguntas de Comportamiento (STAR Method)
Genera 3-4 preguntas basadas en la experiencia del CV:
- Usa el método STAR (Situación, Tarea, Acción, Resultado)
- Referencia experiencias específicas del CV
- Ejemplos: "Cuéntame sobre un proyecto donde tuviste que..."

### 💻 Fase 2: Preguntas Técnicas
Genera 3-4 preguntas técnicas relevantes:
- Basadas en los skills del CV y requisitos de la oferta
- Variedad: conceptuales, de diseño, y prácticas
- Adaptadas al nivel del candidato (junior/mid/senior)

### 🧠 Fase 3: Preguntas Situacionales
Genera 2-3 preguntas hipotéticas:
- "¿Qué harías si...?"
- Basadas en desafíos reales del puesto

### ❓ Fase 4: Preguntas del Candidato
- "¿Tenés preguntas para nosotros?"
- Sugiere 3 preguntas inteligentes que el candidato podría hacer

Para CADA pregunta incluye:
- 💡 **Tip**: Qué busca el entrevistador con esta pregunta
- ✅ **Respuesta ideal**: Framework o puntos clave que debería mencionar
- ⚠️ **Red flags**: Qué NO decir

### Si el usuario RESPONDE una pregunta de entrevista:
- Evalúa su respuesta (fortalezas y debilidades)
- Da feedback constructivo y específico
- Sugiere cómo mejorar la respuesta
- Después hace la SIGUIENTE pregunta

Solicitud del usuario: {query}""",
    }

    AVAILABLE_MODELS = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
    ]

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        """Initialize the career assistant with Groq API."""
        self.api_key = api_key
        self.model = model
        self.llm = ChatGroq(
            groq_api_key=api_key,
            model_name=model,
            temperature=0.3,
            max_tokens=4096,
        )

    def _build_messages(
        self,
        system_prompt: str,
        query: str,
        chat_history: List[Dict] = None,
    ) -> list:
        """Build the message list for the LLM."""
        messages = [SystemMessage(content=system_prompt)]

        # Include recent chat history for context continuity
        if chat_history:
            for msg in chat_history[-8:]:  # Last 8 messages
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    # Truncate long assistant messages in history
                    content = msg["content"]
                    if len(content) > 1000:
                        content = content[:1000] + "\n... [respuesta anterior truncada]"
                    messages.append(AIMessage(content=content))

        messages.append(HumanMessage(content=query))
        return messages

    def chat(
        self,
        query: str,
        context: str,
        chat_history: List[Dict] = None,
        mode: str = "general",
    ) -> str:
        """Process a query and return a complete response."""
        template = self.PROMPTS.get(mode, self.PROMPTS["general"])
        system_prompt = self.SYSTEM_BASE + "\n\n" + template.format(
            context=context, query=query
        )

        messages = self._build_messages(system_prompt, query, chat_history)

        try:
            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            error_msg = str(e)
            if "rate_limit" in error_msg.lower():
                return "⏳ **Límite de velocidad alcanzado.** Espera unos segundos e intenta de nuevo. Groq tiene un límite generoso pero puede saturarse con consultas muy seguidas."
            elif "authentication" in error_msg.lower() or "api_key" in error_msg.lower():
                return "🔑 **Error de autenticación.** Verifica tu API key de Groq. Puedes obtener una gratis en [console.groq.com](https://console.groq.com)"
            else:
                return f"❌ **Error al procesar tu consulta:**\n\n`{error_msg}`\n\nVerifica tu API key y conexión a internet."

    def stream_chat(
        self,
        query: str,
        context: str,
        chat_history: List[Dict] = None,
        mode: str = "general",
    ) -> Generator[str, None, None]:
        """Stream a response token by token for real-time display."""
        template = self.PROMPTS.get(mode, self.PROMPTS["general"])
        system_prompt = self.SYSTEM_BASE + "\n\n" + template.format(
            context=context, query=query
        )

        messages = self._build_messages(system_prompt, query, chat_history)

        try:
            for chunk in self.llm.stream(messages):
                if chunk.content:
                    yield chunk.content
        except Exception as e:
            error_msg = str(e)
            if "rate_limit" in error_msg.lower():
                yield "\n\n⏳ **Límite de velocidad alcanzado.** Espera unos segundos e intenta de nuevo."
            elif "authentication" in error_msg.lower():
                yield "\n\n🔑 **Error de autenticación.** Verifica tu API key de Groq."
            else:
                yield f"\n\n❌ **Error:** `{error_msg}`"

    def detect_mode(self, query: str) -> str:
        """Auto-detect the best mode based on the user's query."""
        query_lower = query.lower()

        interview_keywords = [
            "entrevista", "interview", "simula", "pregunta",
            "practica", "preparar entrevista", "mock interview",
            "entrevistar", "preguntas técnicas", "behavioral",
        ]
        job_keywords = [
            "match", "compatib", "oferta", "job", "vacante", "posición",
            "requisito", "aplica", "pegan", "encaj", "cumplo",
        ]
        cover_keywords = [
            "cover letter", "carta", "presentación", "letter",
            "aplicar", "postular", "escribir carta", "redacta",
        ]
        skills_keywords = [
            "skill", "habilidad", "faltan", "gap", "senior",
            "mejorar", "aprender", "certificac", "nivel",
            "roadmap", "plan", "desarrollo",
        ]

        for kw in interview_keywords:
            if kw in query_lower:
                return "interview"

        for kw in cover_keywords:
            if kw in query_lower:
                return "cover_letter"

        for kw in job_keywords:
            if kw in query_lower:
                return "job_match"

        for kw in skills_keywords:
            if kw in query_lower:
                return "skills_gap"

        return "general"
