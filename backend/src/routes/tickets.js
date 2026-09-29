// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { Router } from "express";
import { pick, query, queryOne } from "../db.js";
import { HttpError, isStaff, requireStaff } from "../middleware/auth.js";
import { notifyTicket, ticketAudience } from "../lib/realtime.js";
import { ADJUNTO_FIELDS, receiveImages, saveImages, validateImages } from "../lib/uploads.js";

const router = Router();

const TICKET_SELECT = `
  SELECT t.*, i.Tiempo AS Incidente_Tiempo
  FROM Tickets t
  LEFT JOIN Incidentes i ON i.id = t.Incidente_ID`;

const toId = value => {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID inválido");
  return id;
};

/** Carga el ticket y verifica que el usuario pueda verlo. */
export async function getAccessibleTicket(user, ticketId) {
  const ticket = await queryOne(`${TICKET_SELECT} WHERE t.id = ?`, [ticketId]);
  if (!ticket) throw new HttpError(404, "Ticket no encontrado");
  if (!isStaff(user) && ticket.Usuario !== user.id) throw new HttpError(404, "Ticket no encontrado");
  return ticket;
}

// GET /api/tickets — staff: todos; usuario: solo los suyos
router.get("/", async (req, res) => {
  const rows = isStaff(req.user)
    ? await query(`${TICKET_SELECT} ORDER BY t.Fecha DESC`)
    : await query(`${TICKET_SELECT} WHERE t.Usuario = ? ORDER BY t.Fecha DESC`, [req.user.id]);
  res.json(rows);
});

// GET /api/tickets/:id
router.get("/:id", async (req, res) => {
  res.json(await getAccessibleTicket(req.user, toId(req.params.id)));
});

// POST /api/tickets
router.post("/", async (req, res) => {
  const staff = isStaff(req.user);
  const data  = pick(req.body, staff
    ? ["Incidente_ID", "Departamento", "Descripcion", "Agente", "Prioridad", "Status"]
    : ["Incidente_ID", "Departamento", "Descripcion"]);
  // Un usuario normal solo puede crear tickets a su nombre
  data.Usuario = staff && req.body?.Usuario ? req.body.Usuario : req.user.id;
  data.Status ??= "En proceso";

  if (!staff) {
    // El agente y la prioridad los decide el catálogo, no el cliente
    if (!String(data.Descripcion ?? "").trim()) throw new HttpError(400, "Describe el problema");
    const inc = await queryOne("SELECT Agentes, Prioridad FROM Incidentes WHERE id = ?", [data.Incidente_ID]);
    if (!inc) throw new HttpError(400, "El tipo de incidente no existe");
    data.Agente    = inc.Agentes;
    data.Prioridad = inc.Prioridad || "medium";
    if (!data.Departamento) {
      const me = await queryOne("SELECT Departmento FROM Usuarios WHERE id = ?", [req.user.id]);
      data.Departamento = me?.Departmento ?? null;
    }
  }

  const result = await query("INSERT INTO Tickets SET ?", [data]);
  res.status(201).json(await queryOne(`${TICKET_SELECT} WHERE t.id = ?`, [result.insertId]));
  notifyTicket("ticket.created", result.insertId, actorOf(req)).catch(logEventError);
});

// PATCH /api/tickets/:id — solo staff
router.patch("/:id", requireStaff, async (req, res) => {
  const id   = toId(req.params.id);
  const data = pick(req.body, ["Status", "Agente", "comment", "Prioridad", "Incidente_ID", "Departamento"]);
  if (Object.keys(data).length === 0) throw new HttpError(400, "Nada que actualizar");

  // Audiencia ANTES del cambio: si se reasigna, el agente anterior también debe enterarse
  const before = await ticketAudience(id);
  const result = await query("UPDATE Tickets SET ? WHERE id = ?", [data, id]);
  if (result.affectedRows === 0) throw new HttpError(404, "Ticket no encontrado");
  res.json(await queryOne(`${TICKET_SELECT} WHERE t.id = ?`, [id]));
  notifyTicket("ticket.updated", id, { ...actorOf(req), cambios: data }, before).catch(logEventError);
});

// GET /api/tickets/:id/conversaciones → mensajes, cada uno con sus imágenes adjuntas
router.get("/:id/conversaciones", async (req, res) => {
  const ticket = await getAccessibleTicket(req.user, toId(req.params.id));
  const [rows, adjuntos] = await Promise.all([
    query(
      `SELECT c.*, u.Usuario AS Usuario_nombre
       FROM Conversaciones c
       LEFT JOIN Usuarios u ON u.id = c.Usuario_ID
       WHERE c.incidente_id = ?
       ORDER BY c.fecha_publicacion ASC, c.id ASC`,
      [ticket.id]
    ),
    query(`SELECT ${ADJUNTO_FIELDS} FROM Adjuntos WHERE Ticket_ID = ? AND Conversacion_ID IS NOT NULL ORDER BY id`, [ticket.id]),
  ]);
  res.json(rows.map(c => ({ ...c, adjuntos: adjuntos.filter(a => a.Conversacion_ID === c.id) })));
});

// POST /api/tickets/:id/conversaciones
// JSON { mensaje } o multipart/form-data con "mensaje" y hasta 5 imágenes en "archivos"
router.post("/:id/conversaciones", receiveImages, async (req, res) => {
  const ticket    = await getAccessibleTicket(req.user, toId(req.params.id));
  const validated = validateImages(req.files);
  let mensaje     = String(req.body?.mensaje ?? "").trim();
  if (!mensaje && validated.length === 0) throw new HttpError(400, "El mensaje está vacío");
  if (!mensaje) mensaje = validated.length === 1 ? "📎 Imagen adjunta" : `📎 ${validated.length} imágenes adjuntas`;

  const result = await query(
    "INSERT INTO Conversaciones (incidente_id, mensaje, Usuario_ID) VALUES (?, ?, ?)",
    [ticket.id, mensaje, req.user.id]
  );
  const adjuntos = await saveImages(validated, { ticketId: ticket.id, conversacionId: result.insertId, userId: req.user.id });
  const saved = await queryOne("SELECT * FROM Conversaciones WHERE id = ?", [result.insertId]);
  res.status(201).json({ ...saved, adjuntos });

  notifyTicket("message.created", ticket.id, {
    ...actorOf(req),
    mensajeId: saved.id,
    extracto:  mensaje.slice(0, 120),
    sistema:   mensaje.startsWith("[Sistema]"),
    adjuntos:  adjuntos.length,
  }).catch(logEventError);
});

// GET /api/tickets/:id/adjuntos → todas las imágenes del ticket
// (las del reporte original tienen Conversacion_ID = null)
router.get("/:id/adjuntos", async (req, res) => {
  const ticket = await getAccessibleTicket(req.user, toId(req.params.id));
  res.json(await query(`SELECT ${ADJUNTO_FIELDS} FROM Adjuntos WHERE Ticket_ID = ? ORDER BY id`, [ticket.id]));
});

// POST /api/tickets/:id/adjuntos → imágenes del reporte original (multipart, campo "archivos")
router.post("/:id/adjuntos", receiveImages, async (req, res) => {
  const ticket    = await getAccessibleTicket(req.user, toId(req.params.id));
  const validated = validateImages(req.files);
  if (validated.length === 0) throw new HttpError(400, "No se recibió ninguna imagen");
  const adjuntos = await saveImages(validated, { ticketId: ticket.id, userId: req.user.id });
  res.status(201).json(adjuntos);
  // reporteOriginal: son las capturas del propio reporte; recarga la vista pero no merece otro aviso
  notifyTicket("ticket.updated", ticket.id, { ...actorOf(req), adjuntos: adjuntos.length, reporteOriginal: true }).catch(logEventError);
});

// Quién hizo el cambio (para que el propio autor no reciba su notificación)
function actorOf(req) {
  return { actorId: req.user.id, actor: req.user.usuario };
}
function logEventError(err) {
  console.error("[realtime] no se pudo enviar el evento:", err.message);
}

export default router;
