"""Cliente de DeepSeek (API compatible con OpenAI)."""
import json

from fastapi import HTTPException
from openai import APIConnectionError, APIStatusError, AuthenticationError, OpenAI

from . import config

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if not config.DEEPSEEK_API_KEY:
        raise HTTPException(503, "DEEPSEEK_API_KEY no está configurada en ai/.env")
    if _client is None:
        _client = OpenAI(api_key=config.DEEPSEEK_API_KEY, base_url=config.DEEPSEEK_BASE_URL, timeout=45)
    return _client


def chat(system: str, user: str, *, json_mode: bool = False, temperature: float = 0.3) -> str:
    """Envía una conversación a DeepSeek y devuelve el texto de la respuesta."""
    kwargs = {"response_format": {"type": "json_object"}} if json_mode else {}
    try:
        resp = _get_client().chat.completions.create(
            model=config.DEEPSEEK_MODEL,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=temperature,
            max_tokens=1024,
            **kwargs,
        )
    except AuthenticationError:
        raise HTTPException(502, "La API key de DeepSeek es inválida")
    except APIConnectionError:
        raise HTTPException(503, "No se pudo conectar con DeepSeek")
    except APIStatusError as e:
        if e.status_code == 402:
            raise HTTPException(502, "Saldo insuficiente en la cuenta de DeepSeek")
        if e.status_code == 429:
            raise HTTPException(429, "DeepSeek está limitando las peticiones, intenta en unos segundos")
        raise HTTPException(502, f"Error de DeepSeek ({e.status_code})")

    content = (resp.choices[0].message.content or "").strip()
    if not content:
        raise HTTPException(502, "DeepSeek devolvió una respuesta vacía")
    return content


def chat_json(system: str, user: str) -> dict:
    """Igual que chat() pero exige y parsea una respuesta JSON."""
    raw = chat(system, user, json_mode=True, temperature=0.1)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(502, "DeepSeek no devolvió un JSON válido")
    if not isinstance(data, dict):
        raise HTTPException(502, "DeepSeek devolvió un JSON inesperado")
    return data
