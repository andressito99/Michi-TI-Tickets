// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { Router } from "express";
import { query, queryOne } from "../db.js";
import { isStaff } from "../middleware/auth.js";

const router = Router();

// GET /api/conversaciones/ultimas?tickets=1,2,3
// Último mensaje de cada ticket indicado (solo de tickets accesibles).
router.get("/ultimas", async (req, res) => {
  const ids = String(req.query.tickets ?? "")
    .split(",")
    .map(s => Number.parseInt(s, 10))
    .filter(n => Number.isInteger(n) && n > 0);
  if (ids.length === 0) return res.json([]);

  const ownerFilter = isStaff(req.user) ? "" : "AND t.Usuario = ?";
  const params      = isStaff(req.user) ? [ids] : [ids, req.user.id];

  const rows = await query(
    `SELECT c.*
     FROM Conversaciones c
     JOIN Tickets t ON t.id = c.incidente_id
     JOIN (
       SELECT incidente_id, MAX(id) AS max_id
       FROM Conversaciones
       WHERE incidente_id IN (?)
       GROUP BY incidente_id
     ) last ON last.max_id = c.id
     WHERE 1 = 1 ${ownerFilter}`,
    params
  );
  res.json(rows);
});

// GET /api/conversaciones/nuevas?after=<id>
// Mensajes de otros usuarios en MIS tickets con id > after (para notificaciones móviles).
// Sin `after` solo devuelve el último id existente.
router.get("/nuevas", async (req, res) => {
  const last = await queryOne("SELECT COALESCE(MAX(id), 0) AS id FROM Conversaciones");
  const after = Number.parseInt(req.query.after, 10);
  if (!Number.isInteger(after)) return res.json({ ultimo_id: last.id, mensajes: [] });

  const mensajes = await query(
    `SELECT c.*
     FROM Conversaciones c
     JOIN Tickets t ON t.id = c.incidente_id
     WHERE c.id > ? AND t.Usuario = ? AND (c.Usuario_ID IS NULL OR c.Usuario_ID <> ?)
     ORDER BY c.id ASC
     LIMIT 100`,
    [after, req.user.id, req.user.id]
  );
  res.json({ ultimo_id: last.id, mensajes });
});

export default router;
