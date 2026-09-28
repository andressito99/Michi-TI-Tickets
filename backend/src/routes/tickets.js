import { Router } from "express";
import { pick, query, queryOne } from "../db.js";
import { HttpError, isStaff, requireStaff } from "../middleware/auth.js";

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
});

// PATCH /api/tickets/:id — solo staff
router.patch("/:id", requireStaff, async (req, res) => {
  const id   = toId(req.params.id);
  const data = pick(req.body, ["Status", "Agente", "comment", "Prioridad", "Incidente_ID", "Departamento"]);
  if (Object.keys(data).length === 0) throw new HttpError(400, "Nada que actualizar");

  const result = await query("UPDATE Tickets SET ? WHERE id = ?", [data, id]);
  if (result.affectedRows === 0) throw new HttpError(404, "Ticket no encontrado");
  res.json(await queryOne(`${TICKET_SELECT} WHERE t.id = ?`, [id]));
});

// GET /api/tickets/:id/conversaciones
router.get("/:id/conversaciones", async (req, res) => {
  const ticket = await getAccessibleTicket(req.user, toId(req.params.id));
  const rows = await query(
    `SELECT c.*, u.Usuario AS Usuario_nombre
     FROM Conversaciones c
     LEFT JOIN Usuarios u ON u.id = c.Usuario_ID
     WHERE c.incidente_id = ?
     ORDER BY c.fecha_publicacion ASC, c.id ASC`,
    [ticket.id]
  );
  res.json(rows);
});

// POST /api/tickets/:id/conversaciones  { mensaje }
router.post("/:id/conversaciones", async (req, res) => {
  const ticket  = await getAccessibleTicket(req.user, toId(req.params.id));
  const mensaje = String(req.body?.mensaje ?? "").trim();
  if (!mensaje) throw new HttpError(400, "El mensaje está vacío");

  const result = await query(
    "INSERT INTO Conversaciones (incidente_id, mensaje, Usuario_ID) VALUES (?, ?, ?)",
    [ticket.id, mensaje, req.user.id]
  );
  res.status(201).json(await queryOne("SELECT * FROM Conversaciones WHERE id = ?", [result.insertId]));
});

export default router;
