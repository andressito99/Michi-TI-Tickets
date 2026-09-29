// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { Router } from "express";
import { pick, query, queryOne } from "../db.js";
import { HttpError, isStaff, requireAdmin } from "../middleware/auth.js";
import { anonimizar } from "../lib/anonimizar.js";
import { publish, toAdmins } from "../lib/realtime.js";

const router = Router();

const ESTADOS = ["propuesta", "publicado", "oculto"];
const RESUELTO = ["resolved", "finalizado", "terminado", "resuelto"];

const toId = value => {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID inválido");
  return id;
};

// Campos públicos: nunca Ticket_ID, Propuesto_por ni Publicado_por
const PUBLIC_SELECT = `
  SELECT p.id, p.Titulo, p.Categoria, p.Problema, p.Solucion, p.Vistas, p.published_at,
    (SELECT COUNT(*) FROM Foro_votos v WHERE v.Publicacion_ID = p.id AND v.Util = 1) AS util_si,
    (SELECT COUNT(*) FROM Foro_votos v WHERE v.Publicacion_ID = p.id AND v.Util = 0) AS util_no,
    (SELECT COUNT(*) FROM Foro_comentarios c WHERE c.Publicacion_ID = p.id)           AS comentarios
  FROM Foro_publicaciones p`;

const ADMIN_SELECT = `
  SELECT p.*,
    (p.Propuesto_por IS NOT NULL) AS propuesta_usuario,
    (SELECT COUNT(*) FROM Foro_votos v WHERE v.Publicacion_ID = p.id AND v.Util = 1) AS util_si,
    (SELECT COUNT(*) FROM Foro_votos v WHERE v.Publicacion_ID = p.id AND v.Util = 0) AS util_no,
    (SELECT COUNT(*) FROM Foro_comentarios c WHERE c.Publicacion_ID = p.id)           AS comentarios
  FROM Foro_publicaciones p`;

/**
 * Borrador anónimo a partir de un ticket: título del incidente, descripción
 * como problema y respuestas del soporte como solución, sin datos personales.
 */
export async function borradorDesdeTicket(ticketId) {
  const ticket = await queryOne(
    `SELECT t.*, i.Incidente, i.Categoria AS Inc_Categoria, u.Usuario AS Solicitante
     FROM Tickets t
     LEFT JOIN Incidentes i ON i.id = t.Incidente_ID
     LEFT JOIN Usuarios u ON u.id = t.Usuario
     WHERE t.id = ?`,
    [ticketId]
  );
  if (!ticket) throw new HttpError(404, "Ticket no encontrado");

  const mensajes = await query(
    `SELECT c.mensaje, c.Usuario_ID, u.Usuario AS autor, u.Rol AS rol
     FROM Conversaciones c LEFT JOIN Usuarios u ON u.id = c.Usuario_ID
     WHERE c.incidente_id = ? ORDER BY c.fecha_publicacion, c.id`,
    [ticketId]
  );

  const nombres = {
    usuarios: [ticket.Solicitante],
    soporte:  [...new Set(mensajes.filter(m => m.Usuario_ID !== ticket.Usuario).map(m => m.autor))],
  };
  const humanos   = mensajes.filter(m => !m.mensaje.trim().startsWith("[Sistema]"));
  const delSoporte = humanos.filter(m => m.Usuario_ID !== ticket.Usuario).map(m => m.mensaje.trim());

  return {
    ticket,
    mensajes,
    nombres,
    borrador: {
      Titulo:    ticket.Incidente ?? String(ticket.Descripcion ?? "Problema resuelto").slice(0, 80),
      Categoria: ticket.Inc_Categoria ?? ticket.Departamento ?? null,
      Problema:  anonimizar(ticket.Descripcion ?? "", nombres),
      Solucion:  anonimizar(delSoporte.join("\n\n"), nombres),
      Ticket_ID: ticket.id,
    },
  };
}

// ── Lectura (todos los roles) ───────────────────────────────

// GET /api/foro?q=&categoria=&orden=recientes|utiles&limit=
router.get("/", async (req, res) => {
  const where = ["p.Estado = 'publicado'"];
  const params = [];
  // Cada palabra debe aparecer; se ignoran guiones ("wifi" encuentra "Wi-Fi").
  // La collation es insensible a mayúsculas y tildes ("conexion" encuentra "conexión").
  const TEXTO = "REPLACE(CONCAT_WS(' ', p.Titulo, p.Categoria, p.Problema, p.Solucion), '-', '')";
  const terms = String(req.query.q ?? "").replace(/-/g, "").split(/\s+/).filter(t => t.length >= 2).slice(0, 8);
  for (const t of terms) {
    where.push(`${TEXTO} LIKE ?`);
    params.push(`%${t.replace(/[%_\\]/g, "\\$&")}%`);
  }
  if (req.query.categoria) { where.push("p.Categoria = ?"); params.push(req.query.categoria); }

  const orden = req.query.orden === "utiles" ? "util_si DESC, p.published_at DESC" : "p.published_at DESC";
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 100, 100);

  res.json(await query(`${PUBLIC_SELECT} WHERE ${where.join(" AND ")} ORDER BY ${orden} LIMIT ${limit}`, params));
});

// GET /api/foro/categorias → [{ Categoria, total }]
router.get("/categorias", async (_req, res) => {
  res.json(await query(
    `SELECT Categoria, COUNT(*) AS total FROM Foro_publicaciones
     WHERE Estado = 'publicado' AND Categoria IS NOT NULL
     GROUP BY Categoria ORDER BY Categoria`
  ));
});

// ── Administración ──────────────────────────────────────────

// GET /api/foro/admin/todas
router.get("/admin/todas", requireAdmin, async (_req, res) => {
  res.json(await query(`${ADMIN_SELECT} ORDER BY FIELD(p.Estado, 'propuesta', 'publicado', 'oculto'), COALESCE(p.published_at, p.created_at) DESC`));
});

// GET /api/foro/borrador/ticket/:id → publicación existente o borrador anónimo nuevo
router.get("/borrador/ticket/:id", requireAdmin, async (req, res) => {
  const ticketId = toId(req.params.id);
  const existente = await queryOne(`${ADMIN_SELECT} WHERE p.Ticket_ID = ?`, [ticketId]);
  if (existente) return res.json({ existente: true, publicacion: existente });
  const { borrador } = await borradorDesdeTicket(ticketId);
  res.json({ existente: false, publicacion: borrador });
});

// POST /api/foro
router.post("/", requireAdmin, async (req, res) => {
  const data = pick(req.body, ["Titulo", "Categoria", "Problema", "Solucion", "Estado", "Ticket_ID"]);
  if (!String(data.Titulo ?? "").trim() || !String(data.Problema ?? "").trim()) {
    throw new HttpError(400, "El título y el problema son obligatorios");
  }
  data.Estado = ESTADOS.includes(data.Estado) ? data.Estado : "publicado";
  if (data.Estado === "publicado" && !String(data.Solucion ?? "").trim()) {
    throw new HttpError(400, "Para publicar hace falta la solución");
  }
  data.Publicado_por = req.user.id;
  if (data.Estado === "publicado") data.published_at = new Date();

  try {
    const result = await query("INSERT INTO Foro_publicaciones SET ?", [data]);
    res.status(201).json(await queryOne(`${ADMIN_SELECT} WHERE p.id = ?`, [result.insertId]));
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") throw new HttpError(409, "Este ticket ya tiene una publicación en el foro");
    throw err;
  }
});

// PATCH /api/foro/:id
router.patch("/:id", requireAdmin, async (req, res) => {
  const id = toId(req.params.id);
  const actual = await queryOne("SELECT * FROM Foro_publicaciones WHERE id = ?", [id]);
  if (!actual) throw new HttpError(404, "Publicación no encontrada");

  const data = pick(req.body, ["Titulo", "Categoria", "Problema", "Solucion", "Estado"]);
  if (data.Estado !== undefined && !ESTADOS.includes(data.Estado)) throw new HttpError(400, "Estado inválido");
  const final = { ...actual, ...data };
  if (final.Estado === "publicado" && !String(final.Solucion ?? "").trim()) {
    throw new HttpError(400, "Para publicar hace falta la solución");
  }
  if (data.Estado === "publicado" && actual.Estado !== "publicado") {
    data.published_at  = new Date();
    data.Publicado_por = req.user.id;
  }
  if (Object.keys(data).length === 0) throw new HttpError(400, "Nada que actualizar");

  await query("UPDATE Foro_publicaciones SET ? WHERE id = ?", [data, id]);
  res.json(await queryOne(`${ADMIN_SELECT} WHERE p.id = ?`, [id]));
});

// DELETE /api/foro/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  const result = await query("DELETE FROM Foro_publicaciones WHERE id = ?", [toId(req.params.id)]);
  if (result.affectedRows === 0) throw new HttpError(404, "Publicación no encontrada");
  res.status(204).end();
});

// ── Propuestas de los usuarios ──────────────────────────────

async function ticketPropio(user, ticketId) {
  const ticket = await queryOne("SELECT id, Usuario, Status FROM Tickets WHERE id = ?", [ticketId]);
  if (!ticket || (!isStaff(user) && ticket.Usuario !== user.id)) throw new HttpError(404, "Ticket no encontrado");
  return ticket;
}

// GET /api/foro/ticket/:id/estado → { estado: null | "propuesta" | "publicado" | "oculto", id }
router.get("/ticket/:id/estado", async (req, res) => {
  const ticket = await ticketPropio(req.user, toId(req.params.id));
  const pub = await queryOne("SELECT id, Estado FROM Foro_publicaciones WHERE Ticket_ID = ?", [ticket.id]);
  res.json({ estado: pub?.Estado ?? null, id: pub?.Estado === "publicado" ? pub.id : null });
});

// POST /api/foro/proponer { ticket_id } → el usuario ofrece su caso resuelto; el admin lo revisa
router.post("/proponer", async (req, res) => {
  const ticket = await ticketPropio(req.user, toId(req.body?.ticket_id));
  if (!RESUELTO.includes(String(ticket.Status ?? "").toLowerCase())) {
    throw new HttpError(400, "Solo se pueden proponer tickets resueltos");
  }
  const existente = await queryOne("SELECT Estado FROM Foro_publicaciones WHERE Ticket_ID = ?", [ticket.id]);
  if (existente) return res.json({ estado: existente.Estado });

  const { borrador } = await borradorDesdeTicket(ticket.id);
  await query("INSERT INTO Foro_publicaciones SET ?", [{
    ...borrador,
    Estado:        "propuesta",
    Propuesto_por: req.user.id,
  }]);
  res.status(201).json({ estado: "propuesta" });
  // Aviso al admin sin revelar quién lo propuso
  publish({ type: "foro.proposed", titulo: borrador.Titulo }, toAdmins);
});

// ── Detalle, votos y comentarios ────────────────────────────

// DELETE /api/foro/comentarios/:id → el propio autor o el admin
router.delete("/comentarios/:id", async (req, res) => {
  const com = await queryOne("SELECT id, Usuario_ID FROM Foro_comentarios WHERE id = ?", [toId(req.params.id)]);
  if (!com) throw new HttpError(404, "Comentario no encontrado");
  if (req.user.rol !== "admin" && com.Usuario_ID !== req.user.id) throw new HttpError(403, "No puedes borrar este comentario");
  await query("DELETE FROM Foro_comentarios WHERE id = ?", [com.id]);
  res.status(204).end();
});

async function publicacionVisible(user, id) {
  const pub = await queryOne(`${PUBLIC_SELECT} WHERE p.id = ? AND (p.Estado = 'publicado' OR ?)`, [id, user.rol === "admin"]);
  if (!pub) throw new HttpError(404, "Publicación no encontrada");
  return pub;
}

// GET /api/foro/:id → publicación + mi voto + comentarios (anónimos sin nombre)
router.get("/:id", async (req, res) => {
  const id = toId(req.params.id);
  const pub = await publicacionVisible(req.user, id);
  if (req.user.rol !== "admin") await query("UPDATE Foro_publicaciones SET Vistas = Vistas + 1 WHERE id = ?", [id]);

  const [voto] = await query("SELECT Util FROM Foro_votos WHERE Publicacion_ID = ? AND Usuario_ID = ?", [id, req.user.id]);
  const comentarios = await query(
    `SELECT c.id, c.Mensaje, c.created_at, c.Anonimo, c.Usuario_ID, u.Usuario, u.Rol
     FROM Foro_comentarios c LEFT JOIN Usuarios u ON u.id = c.Usuario_ID
     WHERE c.Publicacion_ID = ? ORDER BY c.created_at, c.id`,
    [id]
  );

  res.json({
    ...pub,
    mi_voto: voto ? Boolean(voto.Util) : null,
    comentarios: comentarios.map(c => ({
      id:         c.id,
      mensaje:    c.Mensaje,
      created_at: c.created_at,
      autor:      c.Anonimo ? null : c.Usuario,
      soporte:    !c.Anonimo && ["admin", "agente"].includes(String(c.Rol ?? "").toLowerCase()),
      mio:        c.Usuario_ID === req.user.id,
    })),
  });
});

// POST /api/foro/:id/voto { util: boolean }
router.post("/:id/voto", async (req, res) => {
  const id = toId(req.params.id);
  await publicacionVisible(req.user, id);
  const util = req.body?.util ? 1 : 0;
  await query(
    "INSERT INTO Foro_votos (Publicacion_ID, Usuario_ID, Util) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Util = VALUES(Util)",
    [id, req.user.id, util]
  );
  res.json(await publicacionVisible(req.user, id));
});

// POST /api/foro/:id/comentarios { mensaje, anonimo }
router.post("/:id/comentarios", async (req, res) => {
  const id = toId(req.params.id);
  await publicacionVisible(req.user, id);
  const mensaje = String(req.body?.mensaje ?? "").trim();
  if (!mensaje) throw new HttpError(400, "El comentario está vacío");
  if (mensaje.length > 2000) throw new HttpError(400, "El comentario es demasiado largo");

  // Los comentarios anónimos también pasan por el anonimizador (correos, teléfonos…)
  const anonimo = req.body?.anonimo !== false;
  const texto   = anonimo ? anonimizar(mensaje, { usuarios: [req.user.usuario] }) : mensaje;
  await query(
    "INSERT INTO Foro_comentarios (Publicacion_ID, Usuario_ID, Mensaje, Anonimo) VALUES (?, ?, ?, ?)",
    [id, req.user.id, texto, anonimo ? 1 : 0]
  );
  res.status(201).json({ ok: true });
});

export default router;
