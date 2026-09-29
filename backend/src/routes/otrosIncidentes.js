// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { Router } from "express";
import { pick, query, queryOne, transaction } from "../db.js";
import { HttpError, isStaff, requireStaff } from "../middleware/auth.js";
import { notifyTicket, publish, toAdmins } from "../lib/realtime.js";
import { ADJUNTO_FIELDS, deleteStoredFiles, receiveImages, saveImages, validateImages } from "../lib/uploads.js";

const router = Router();

// GET /api/otros-incidentes?activos=1
// staff: todos; usuario: solo los suyos. `activos` excluye los "Terminado".
router.get("/", async (req, res) => {
  const where  = [];
  const params = [];
  if (!isStaff(req.user)) { where.push("Usuario_ID = ?"); params.push(req.user.id); }
  if (req.query.activos)  { where.push("(Status IS NULL OR Status <> 'Terminado')"); }

  const sql = `SELECT * FROM Otros_incidentes ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY Fecha DESC`;
  res.json(await query(sql, params));
});

// POST /api/otros-incidentes
router.post("/", async (req, res) => {
  const data = pick(req.body, ["Departamento", "Status", "Categoria", "Descripcion", "Prioridad", "Agente"]);
  data.Usuario_ID = req.user.id;
  data.Status ??= "Pendiente";
  if (!String(data.Descripcion ?? "").trim()) throw new HttpError(400, "Describe el problema");
  if (!data.Departamento) {
    const me = await queryOne("SELECT Departmento FROM Usuarios WHERE id = ?", [req.user.id]);
    data.Departamento = me?.Departmento ?? null;
  }

  const result = await query("INSERT INTO Otros_incidentes SET ?", [data]);
  const oi = await queryOne("SELECT * FROM Otros_incidentes WHERE id = ?", [result.insertId]);
  res.status(201).json(oi);

  publish({
    type: "otro.created", otroId: oi.id, categoria: oi.Categoria,
    extracto: String(oi.Descripcion ?? "").slice(0, 120), actorId: req.user.id, actor: req.user.usuario,
  }, toAdmins);
});

// POST /api/otros-incidentes/:id/adjuntos → capturas del reporte (solo su autor)
router.post("/:id/adjuntos", receiveImages, async (req, res) => {
  const oi = await queryOne("SELECT id, Usuario_ID FROM Otros_incidentes WHERE id = ?", [req.params.id]);
  if (!oi || oi.Usuario_ID !== req.user.id) throw new HttpError(404, "Reporte no encontrado");
  const validated = validateImages(req.files);
  if (validated.length === 0) throw new HttpError(400, "No se recibió ninguna imagen");
  res.status(201).json(await saveImages(validated, { otroId: oi.id, userId: req.user.id }));
});

// GET /api/otros-incidentes/:id/adjuntos → capturas del reporte (su autor o el staff)
router.get("/:id/adjuntos", async (req, res) => {
  const oi = await queryOne("SELECT id, Usuario_ID FROM Otros_incidentes WHERE id = ?", [req.params.id]);
  if (!oi || (!isStaff(req.user) && oi.Usuario_ID !== req.user.id)) throw new HttpError(404, "Reporte no encontrado");
  res.json(await query(`SELECT ${ADJUNTO_FIELDS} FROM Adjuntos WHERE Otro_ID = ? ORDER BY id`, [oi.id]));
});

// POST /api/otros-incidentes/:id/convertir  { Incidente_ID, Prioridad, Agente }
// Crea un ticket a partir del "otro incidente" y lo elimina, todo en una transacción.
router.post("/:id/convertir", requireStaff, async (req, res) => {
  const incidenteId = Number.parseInt(req.body?.Incidente_ID, 10);
  if (!Number.isInteger(incidenteId)) throw new HttpError(400, "Selecciona un tipo de incidente");

  const ticketId = await transaction(async conn => {
    const [[oi]] = await conn.query("SELECT * FROM Otros_incidentes WHERE id = ? FOR UPDATE", [req.params.id]);
    if (!oi) throw new HttpError(404, "Incidente no encontrado");

    const [[inc]] = await conn.query("SELECT Agentes FROM Incidentes WHERE id = ?", [incidenteId]);
    if (!inc) throw new HttpError(400, "El tipo de incidente no existe");

    const [result] = await conn.query("INSERT INTO Tickets SET ?", [{
      Incidente_ID: incidenteId,
      Usuario:      oi.Usuario_ID,
      Agente:       req.body?.Agente || inc.Agentes || null,
      Status:       "open",
      Prioridad:    req.body?.Prioridad || oi.Prioridad || "medium",
      Fecha:        oi.Fecha,
      Descripcion:  oi.Descripcion,
      Departamento: oi.Departamento,
    }]);
    // Las capturas del reporte pasan a ser capturas del reporte original del ticket
    await conn.query("UPDATE Adjuntos SET Ticket_ID = ?, Otro_ID = NULL WHERE Otro_ID = ?", [result.insertId, oi.id]);
    await conn.query("DELETE FROM Otros_incidentes WHERE id = ?", [oi.id]);
    return result.insertId;
  });

  res.status(201).json(await queryOne("SELECT * FROM Tickets WHERE id = ?", [ticketId]));
  notifyTicket("ticket.created", ticketId, { actorId: req.user.id, actor: req.user.usuario, desdeOtro: true })
    .catch(err => console.error("[realtime]", err.message));
});

// DELETE /api/otros-incidentes/:id (también borra del disco sus capturas)
router.delete("/:id", requireStaff, async (req, res) => {
  const archivos = await query("SELECT Archivo FROM Adjuntos WHERE Otro_ID = ?", [req.params.id]);
  const result = await query("DELETE FROM Otros_incidentes WHERE id = ?", [req.params.id]);
  if (result.affectedRows === 0) throw new HttpError(404, "Incidente no encontrado");
  await deleteStoredFiles(archivos.map(a => a.Archivo));
  res.status(204).end();
});

export default router;
