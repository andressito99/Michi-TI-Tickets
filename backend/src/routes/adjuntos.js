import { Router } from "express";
import path from "node:path";
import { queryOne } from "../db.js";
import { config } from "../config.js";
import { HttpError, isStaff } from "../middleware/auth.js";
import { getAccessibleTicket } from "./tickets.js";

const router = Router();

// GET /api/adjuntos/:id → la imagen, solo para quien tenga acceso a su ticket o reporte
router.get("/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID inválido");

  const adj = await queryOne("SELECT * FROM Adjuntos WHERE id = ?", [id]);
  if (!adj) throw new HttpError(404, "Adjunto no encontrado");

  if (adj.Ticket_ID) {
    await getAccessibleTicket(req.user, adj.Ticket_ID); // lanza 404 si no tiene acceso
  } else if (adj.Otro_ID) {
    const oi = await queryOne("SELECT Usuario_ID FROM Otros_incidentes WHERE id = ?", [adj.Otro_ID]);
    if (!oi || (!isStaff(req.user) && oi.Usuario_ID !== req.user.id)) throw new HttpError(404, "Adjunto no encontrado");
  } else {
    throw new HttpError(404, "Adjunto no encontrado");
  }

  // Nombre para la descarga, codificado para admitir tildes sin romper la cabecera
  const filename = encodeURIComponent(adj.Nombre);
  res.set({
    "Content-Type":        adj.Tipo,
    "Content-Disposition": `inline; filename*=UTF-8''${filename}`,
    "Cache-Control":       "private, max-age=3600",
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
  });
  res.sendFile(path.join(config.uploads.dir, path.basename(adj.Archivo)), err => {
    if (err && !res.headersSent) res.status(404).json({ error: "El archivo ya no existe" });
  });
});

export default router;
