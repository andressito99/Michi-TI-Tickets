// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { Router } from "express";
import { query } from "../db.js";
import { config } from "../config.js";
import { HttpError, requireAdmin, requireStaff } from "../middleware/auth.js";
import { anonimizar } from "../lib/anonimizar.js";
import { borradorDesdeTicket } from "./foro.js";
import { getAccessibleTicket } from "./tickets.js";

const router = Router();

/** Llama al microservicio Python de IA. */
async function callAi(path, payload) {
  let res;
  try {
    res = await fetch(`${config.ai.url}${path}`, {
      method:  payload ? "POST" : "GET",
      headers: { "Content-Type": "application/json", "X-Internal-Token": config.ai.token },
      body:    payload ? JSON.stringify(payload) : undefined,
      signal:  AbortSignal.timeout(60_000),
    });
  } catch {
    throw new HttpError(503, "El servicio de IA no está disponible. ¿Está corriendo ai/ (uvicorn)?");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(res.status === 401 ? 502 : res.status, body.detail ?? "Error en el servicio de IA");
  return body;
}

// GET /api/ai/health
router.get("/health", async (_req, res) => {
  res.json(await callAi("/health"));
});

// POST /api/ai/clasificar  { descripcion, categoria? }
// Sugiere incidente del catálogo, prioridad y agente para un reporte.
router.post("/clasificar", requireStaff, async (req, res) => {
  const descripcion = String(req.body?.descripcion ?? "").trim();
  if (!descripcion) throw new HttpError(400, "La descripción está vacía");

  const [incidentes, agentes] = await Promise.all([
    query("SELECT id, Categoria, Incidente, Tiempo, Prioridad, Agentes FROM Incidentes ORDER BY Categoria, Incidente"),
    query("SELECT id, Nombre, Especialidad FROM Agentes ORDER BY Nombre"),
  ]);
  if (incidentes.length === 0) throw new HttpError(400, "No hay incidentes en el catálogo para clasificar");

  res.json(await callAi("/clasificar", {
    descripcion,
    categoria: req.body?.categoria ?? null,
    incidentes,
    agentes,
  }));
});

// POST /api/ai/tickets/:id/sugerir-respuesta
// Redacta una respuesta para el ticket usando su historial de conversación.
router.post("/tickets/:id/sugerir-respuesta", requireStaff, async (req, res) => {
  const ticket = await getAccessibleTicket(req.user, Number.parseInt(req.params.id, 10));
  const [incidente] = ticket.Incidente_ID
    ? await query("SELECT Categoria, Incidente, Tiempo FROM Incidentes WHERE id = ?", [ticket.Incidente_ID])
    : [];
  const conversacion = await query(
    `SELECT c.mensaje, c.fecha_publicacion, u.Usuario AS autor, u.Rol AS rol
     FROM Conversaciones c
     LEFT JOIN Usuarios u ON u.id = c.Usuario_ID
     WHERE c.incidente_id = ?
     ORDER BY c.fecha_publicacion ASC, c.id ASC`,
    [ticket.id]
  );

  res.json(await callAi("/sugerir-respuesta", {
    ticket: {
      id:           ticket.id,
      descripcion:  ticket.Descripcion ?? "",
      departamento: ticket.Departamento ?? "",
      estado:       ticket.Status ?? "",
      prioridad:    ticket.Prioridad ?? "",
      categoria:    incidente?.Categoria ?? null,
      incidente:    incidente?.Incidente ?? null,
      tiempo:       incidente?.Tiempo ?? null,
    },
    conversacion,
    agente:        req.user.usuario,
    instrucciones: req.body?.instrucciones ?? null,
  }));
});

// POST /api/ai/tickets/:id/resumen-foro  (solo admin)
// Redacta título, problema y solución generales y anónimos para publicar el caso en el foro.
router.post("/tickets/:id/resumen-foro", requireAdmin, async (req, res) => {
  const { ticket, mensajes, nombres } = await borradorDesdeTicket(Number.parseInt(req.params.id, 10));

  // Se anonimiza ANTES de enviar nada a la IA: DeepSeek nunca recibe nombres ni correos
  const conversacion = mensajes
    .filter(m => !m.mensaje.trim().startsWith("[Sistema]"))
    .map(m => ({
      rol:     m.Usuario_ID === ticket.Usuario ? "usuario" : "soporte",
      mensaje: anonimizar(m.mensaje, nombres),
    }));

  const r = await callAi("/resumen-foro", {
    incidente:   ticket.Incidente ?? null,
    categoria:   ticket.Inc_Categoria ?? null,
    descripcion: anonimizar(ticket.Descripcion ?? "", nombres),
    conversacion,
  });

  // Segunda pasada por si la IA reintrodujo algo identificable
  res.json({
    Titulo:   anonimizar(r.titulo, nombres),
    Problema: anonimizar(r.problema, nombres),
    Solucion: anonimizar(r.solucion, nombres),
  });
});

export default router;
