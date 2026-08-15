"""
Profile Extractor - Uses LLM (Groq) to extract structured skills and experience from document text.
Returns JSON for dashboard: skills (by category/level) and experience (timeline).
"""
import json
import re
from typing import List, Dict, Any


EXTRACT_PROMPT = """Analiza el siguiente texto de CV/perfil profesional y extrae SOLO información que aparezca explícitamente.

Responde ÚNICAMENTE con un bloque JSON válido (sin markdown, sin texto antes o después), con esta estructura exacta:

{{
  "summary": {{
    "headline": "titular corto del perfil (opcional)",
    "estimated_seniority": "junior|mid|senior|lead|unknown",
    "total_years_experience": 0
  }},
  "skills": [
    {{ "name": "nombre del skill", "category": "technical" | "soft" | "tools" | "language", "level": "basic" | "intermediate" | "advanced", "evidence": "frase corta del documento (opcional)" }}
  ],
  "experience": [
    {{ "company": "nombre empresa", "role": "puesto", "start_date": "YYYY-MM o año", "end_date": "YYYY-MM o null si actual", "current": true/false, "location": "opcional", "description": "breve descripción opcional", "highlights": ["logro 1", "logro 2"] }}
  ]
}}

Reglas:
- skills: category "technical" = lenguajes, frameworks, bases de datos; "soft" = comunicación, liderazgo; "tools" = Herramientas (Git, Jira); "language" = idiomas.
- experience: start_date y end_date en formato "YYYY" o "YYYY-MM" si se puede inferir. Si es el trabajo actual, end_date puede ser null y current true.
- Extrae SOLO lo que esté en el texto. No inventes datos.
- Si no hay información para skills o experience, devuelve listas vacías [].
- El JSON debe ser válido (comillas dobles, sin comas finales).
- Si no puedes determinar seniority o años, usa \"unknown\" y 0.

TEXTO DEL DOCUMENTO:
---
{text}
---
Responde solo con el JSON, nada más."""

def _extract_json_candidate(text: str) -> str:
    """Best-effort: pull a JSON object from model output."""
    if not text:
        return ""
    s = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", s)
    if fence:
        s = fence.group(1).strip()

    # If there's extra text, keep the first {...} block.
    start = s.find("{")
    end = s.rfind("}")
    if start != -1 and end != -1 and end > start:
        s = s[start : end + 1]

    # Remove trailing commas (common LLM issue)
    s = re.sub(r",\s*([}\]])", r"\1", s)
    return s.strip()


def extract_profile_from_text(text: str, llm) -> Dict[str, Any]:
    """
    Call LLM to extract structured profile (skills + experience) from document text.
    llm: LangChain ChatGroq instance (e.g. from CareerAssistant.llm).
    Returns dict with "skills" and "experience" lists; on error returns empty structure.
    """
    if not text or not text.strip():
        return {"skills": [], "experience": []}

    # Limit size to avoid token limits (keep first ~12k chars)
    text_trimmed = text.strip()[:12000]
    prompt = EXTRACT_PROMPT.format(text=text_trimmed)

    try:
        from langchain_core.messages import HumanMessage
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content if hasattr(response, "content") else str(response)
        candidate = _extract_json_candidate(content)
        data = json.loads(candidate)
        skills = data.get("skills") or []
        experience = data.get("experience") or []
        summary = data.get("summary") or {}
        # Normalize
        if not isinstance(skills, list):
            skills = []
        if not isinstance(experience, list):
            experience = []
        if not isinstance(summary, dict):
            summary = {}
        return {"summary": summary, "skills": skills, "experience": experience}
    except (json.JSONDecodeError, Exception):
        return {"summary": {}, "skills": [], "experience": []}

INSIGHTS_PROMPT = """Eres un analista de carrera. Te paso un perfil ya extraído de documentos reales (skills + experiencia).\n\nTu tarea: generar insights accionables SIN inventar información.\n\nResponde ÚNICAMENTE JSON válido (sin markdown), con esta estructura exacta:\n\n{\n  \"strengths\": [\"...\"],\n  \"potential_gaps\": [\"...\"],\n  \"role_suggestions\": [\"...\"],\n  \"next_actions\": [\"...\"]\n}\n\nReglas:\n- Todo debe derivarse SOLO del perfil que recibes. Si falta info, dilo en el texto del insight (ej: \"No hay evidencia de X en los documentos\").\n- Sé concreto y breve (bullets de 1 línea).\n- No menciones que eres una IA.\n\nPERFIL (JSON):\n{profile_json}\n"""


def generate_dashboard_insights(profile: Dict[str, Any], llm) -> Dict[str, Any]:
    """Generate 'smart' insights based on extracted profile JSON."""
    try:
        from langchain_core.messages import HumanMessage
        profile_json = json.dumps(profile or {}, ensure_ascii=False)[:12000]
        prompt = INSIGHTS_PROMPT.format(profile_json=profile_json)
        resp = llm.invoke([HumanMessage(content=prompt)])
        content = resp.content if hasattr(resp, "content") else str(resp)
        candidate = _extract_json_candidate(content)
        data = json.loads(candidate)
        out = {
            "strengths": data.get("strengths") or [],
            "potential_gaps": data.get("potential_gaps") or [],
            "role_suggestions": data.get("role_suggestions") or [],
            "next_actions": data.get("next_actions") or [],
        }
        for k in list(out.keys()):
            if not isinstance(out[k], list):
                out[k] = []
            out[k] = [str(x).strip() for x in out[k] if str(x).strip()][:12]
        return out
    except Exception:
        return {"strengths": [], "potential_gaps": [], "role_suggestions": [], "next_actions": []}


def skills_by_category(skills: List[Dict]) -> Dict[str, int]:
    """Count skills per category for bar chart."""
    counts = {}
    for s in skills:
        if not isinstance(s, dict):
            continue
        cat = (s.get("category") or "other").lower()
        counts[cat] = counts.get(cat, 0) + 1
    return counts


def skills_by_level(skills: List[Dict]) -> Dict[str, int]:
    """Count skills per level for chart."""
    counts = {"basic": 0, "intermediate": 0, "advanced": 0}
    for s in skills:
        if not isinstance(s, dict):
            continue
        level = (s.get("level") or "intermediate").lower()
        if level in counts:
            counts[level] += 1
        else:
            counts["intermediate"] += 1
    return counts


def experience_for_timeline(experience: List[Dict]) -> List[Dict]:
    """
    Normalize experience entries for timeline: ensure start_date/end_date for plotting.
    Returns list of dicts with company, role, start_date, end_date, current, description.
    """
    out = []
    for e in experience:
        if not isinstance(e, dict):
            continue
        start = (e.get("start_date") or "").strip() or "Unknown"
        end = e.get("end_date")
        if end is None and e.get("current"):
            end = "Actualidad"
        elif not end:
            end = "?"
        out.append({
            "company": (e.get("company") or "?").strip(),
            "role": (e.get("role") or "?").strip(),
            "start_date": start,
            "end_date": end,
            "current": bool(e.get("current")),
            "description": (e.get("description") or "").strip()[:200],
        })
    return out
