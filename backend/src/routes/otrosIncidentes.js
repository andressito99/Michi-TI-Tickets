import { Router } from "express";
import { pick, query, queryOne, transaction } from "../db.js";
import { HttpError, isStaff, requireStaff } from "../middleware/auth.js";

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
  res.status(201).json(await queryOne("SELECT * FROM Otros_incidentes WHERE id = ?", [result.insertId]));
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
    await conn.query("DELETE FROM Otros_incidentes WHERE id = ?", [oi.id]);
    return result.insertId;
  });

  res.status(201).json(await queryOne("SELECT * FROM Tickets WHERE id = ?", [ticketId]));
});

// DELETE /api/otros-incidentes/:id
router.delete("/:id", requireStaff, async (req, res) => {
  const result = await query("DELETE FROM Otros_incidentes WHERE id = ?", [req.params.id]);
  if (result.affectedRows === 0) throw new HttpError(404, "Incidente no encontrado");
  res.status(204).end();
});

export default router;
