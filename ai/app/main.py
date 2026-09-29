# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

"""Servicio de IA de TI-Tickets (FastAPI + DeepSeek).

Lo consume únicamente el backend Node (backend/src/routes/ai.js), que le envía
el contexto ya leído de MySQL. Ejecutar desde la carpeta ai/:

    uvicorn app.main:app --host 127.0.0.1 --port 8000
"""
import hmac
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from . import config, deepseek, prompts

app = FastAPI(
    title="TI-Tickets IA",
    version="1.0.0",
    docs_url="/docs" if config.ENABLE_DOCS else None,
    redoc_url=None,
    openapi_url="/openapi.json" if config.ENABLE_DOCS else None,
)


def verify_token(x_internal_token: str = Header(default="")) -> None:
    if not hmac.compare_digest(x_internal_token.encode(), config.AI_SERVICE_TOKEN.encode()):
        raise HTTPException(401, "Token interno inválido")


# ── Modelos ──────────────────────────────────────────────────
class Incidente(BaseModel):
    id: int
    Categoria: str
    Incidente: str
    Tiempo: str | None = None
    Prioridad: str | None = None
    Agentes: int | None = None


class Agente(BaseModel):
    id: int
    Nombre: str
    Especialidad: str | None = None


class ClasificarRequest(BaseModel):
    descripcion: str = Field(min_length=1, max_length=5000)
    categoria: str | None = None
    incidentes: list[Incidente] = Field(min_length=1)
    agentes: list[Agente] = []


class ClasificarResponse(BaseModel):
    incidente_id: int
    categoria: str
    incidente: str
    prioridad: str
    agente_id: int | None
    confianza: float
    justificacion: str


class SugerirRespuestaRequest(BaseModel):
    ticket: dict[str, Any]
    conversacion: list[dict[str, Any]] = []
    agente: str | None = None
    instrucciones: str | None = Field(default=None, max_length=1000)


class SugerirRespuestaResponse(BaseModel):
    respuesta: str


# ── Endpoints ────────────────────────────────────────────────
@app.get("/health", dependencies=[Depends(verify_token)])
def health():
    return {"ok": True, "modelo": config.DEEPSEEK_MODEL, "api_key_configurada": bool(config.DEEPSEEK_API_KEY)}


@app.post("/clasificar", response_model=ClasificarResponse, dependencies=[Depends(verify_token)])
def clasificar(req: ClasificarRequest):
    incidentes = [i.model_dump() for i in req.incidentes]
    agentes = [a.model_dump() for a in req.agentes]
    data = deepseek.chat_json(
        prompts.CLASIFICAR_SYSTEM,
        prompts.clasificar_user(req.descripcion, req.categoria, incidentes, agentes),
    )

    # Validar la salida del modelo contra el catálogo real
    por_id = {i.id: i for i in req.incidentes}
    try:
        inc = por_id.get(int(data.get("incidente_id")))
    except (TypeError, ValueError):
        inc = None
    if inc is None:
        raise HTTPException(502, "La IA sugirió un incidente que no existe en el catálogo")

    prioridad = str(data.get("prioridad", "")).lower()
    if prioridad not in prompts.PRIORIDADES:
        prioridad = (inc.Prioridad or "medium").lower()
        if prioridad not in prompts.PRIORIDADES:
            prioridad = "medium"

    agentes_ids = {a.id for a in req.agentes}
    try:
        agente_id = int(data["agente_id"]) if data.get("agente_id") is not None else None
    except (TypeError, ValueError):
        agente_id = None
    if agente_id not in agentes_ids:
        agente_id = inc.Agentes if inc.Agentes in agentes_ids else None

    try:
        confianza = min(max(float(data.get("confianza", 0.5)), 0.0), 1.0)
    except (TypeError, ValueError):
        confianza = 0.5

    return ClasificarResponse(
        incidente_id=inc.id,
        categoria=inc.Categoria,
        incidente=inc.Incidente,
        prioridad=prioridad,
        agente_id=agente_id,
        confianza=confianza,
        justificacion=str(data.get("justificacion", "")).strip(),
    )


@app.post("/sugerir-respuesta", response_model=SugerirRespuestaResponse, dependencies=[Depends(verify_token)])
def sugerir_respuesta(req: SugerirRespuestaRequest):
    texto = deepseek.chat(
        prompts.RESPUESTA_SYSTEM,
        prompts.respuesta_user(req.ticket, req.conversacion, req.agente, req.instrucciones),
        temperature=0.5,
    )
    return SugerirRespuestaResponse(respuesta=texto)


class ResumenForoRequest(BaseModel):
    incidente: str | None = None
    categoria: str | None = None
    descripcion: str = ""
    conversacion: list[dict[str, Any]] = []


class ResumenForoResponse(BaseModel):
    titulo: str
    problema: str
    solucion: str


@app.post("/resumen-foro", response_model=ResumenForoResponse, dependencies=[Depends(verify_token)])
def resumen_foro(req: ResumenForoRequest):
    data = deepseek.chat_json(
        prompts.FORO_SYSTEM,
        prompts.foro_user(req.incidente, req.categoria, req.descripcion, req.conversacion),
    )
    titulo, problema, solucion = (str(data.get(k, "")).strip() for k in ("titulo", "problema", "solucion"))
    if not titulo or not problema or not solucion:
        raise HTTPException(502, "La IA no devolvió una publicación completa")
    return ResumenForoResponse(titulo=titulo[:191], problema=problema, solucion=solucion)
