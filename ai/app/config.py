# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

"""Configuración del servicio de IA. Todo lo sensible viene de ai/.env (nunca del código)."""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").strip()
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat").strip()
AI_SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN", "").strip()
# Documentación interactiva (/docs): solo si se activa explícitamente en desarrollo
ENABLE_DOCS = os.getenv("AI_ENABLE_DOCS", "").strip().lower() in ("1", "true", "yes")

# Sin token compartido cualquiera en la red podría usar (y gastar) la API de DeepSeek:
# el servicio se niega a arrancar.
if len(AI_SERVICE_TOKEN) < 16 or AI_SERVICE_TOKEN == "cambia-esto-tambien":
    sys.exit(
        "[config] AI_SERVICE_TOKEN falta en ai/.env o es demasiado corto (mínimo 16 caracteres).\n"
        "Debe ser el mismo valor que AI_SERVICE_TOKEN en backend/.env."
    )
