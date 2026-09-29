// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { Router } from "express";
import { pick, query, queryOne } from "../db.js";
import { HttpError, requireAdmin, requireStaff } from "../middleware/auth.js";
import { hashPassword } from "./auth.js";

// ── Incidentes ───────────────────────────────────────────────
export const incidentes = Router();

const INCIDENTE_FIELDS = ["Categoria", "Incidente", "Tiempo", "Prioridad", "Agentes"];

// GET /api/incidentes?categoria=Redes
incidentes.get("/", async (req, res) => {
  const { categoria } = req.query;
  const rows = categoria
    ? await query("SELECT * FROM Incidentes WHERE Categoria = ? ORDER BY Incidente", [categoria])
    : await query("SELECT * FROM Incidentes ORDER BY Categoria, Incidente");
  res.json(rows);
});

// GET /api/incidentes/categorias
incidentes.get("/categorias", async (_req, res) => {
  const rows = await query("SELECT DISTINCT Categoria FROM Incidentes ORDER BY Categoria");
  res.json(rows.map(r => r.Categoria));
});

incidentes.post("/", requireAdmin, async (req, res) => {
  const data = pick(req.body, INCIDENTE_FIELDS);
  if (!data.Categoria || !data.Incidente) throw new HttpError(400, "Categoría e incidente son requeridos");
  const result = await query("INSERT INTO Incidentes SET ?", [data]);
  res.status(201).json(await queryOne("SELECT * FROM Incidentes WHERE id = ?", [result.insertId]));
});

incidentes.patch("/:id", requireAdmin, async (req, res) => {
  const data = pick(req.body, INCIDENTE_FIELDS);
  if (Object.keys(data).length === 0) throw new HttpError(400, "Nada que actualizar");
  const result = await query("UPDATE Incidentes SET ? WHERE id = ?", [data, req.params.id]);
  if (result.affectedRows === 0) throw new HttpError(404, "Incidente no encontrado");
  res.json(await queryOne("SELECT * FROM Incidentes WHERE id = ?", [req.params.id]));
});

// ── Agentes ──────────────────────────────────────────────────
export const agentes = Router();

agentes.get("/", async (_req, res) => {
  res.json(await query("SELECT id, Nombre, Especialidad FROM Agentes ORDER BY Nombre"));
});

// ── Usuarios (nunca se devuelve la contraseña) ───────────────
export const usuarios = Router();

const USER_FIELDS = "id, Usuario, Correo, Rol, Departmento, created_at";

usuarios.get("/", requireStaff, async (_req, res) => {
  res.json(await query(`SELECT ${USER_FIELDS} FROM Usuarios ORDER BY id`));
});

usuarios.patch("/:id", requireAdmin, async (req, res) => {
  const data = pick(req.body, ["Usuario", "Correo", "Rol", "Departmento"]);
  if (data.Correo) data.Correo = String(data.Correo).toLowerCase().trim();
  if (data.Rol)    data.Rol    = String(data.Rol).toLowerCase().trim();
  // Contraseña vacía = no cambiarla
  const nueva = req.body?.["Contraseña"];
  if (typeof nueva === "string" && nueva.length > 0) {
    if (nueva.length < 4) throw new HttpError(400, "La contraseña debe tener al menos 4 caracteres");
    data["Contraseña"] = await hashPassword(nueva);
  }
  if (Object.keys(data).length === 0) throw new HttpError(400, "Nada que actualizar");

  try {
    const result = await query("UPDATE Usuarios SET ? WHERE id = ?", [data, req.params.id]);
    if (result.affectedRows === 0) throw new HttpError(404, "Usuario no encontrado");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") throw new HttpError(409, "El usuario o correo ya está en uso");
    throw err;
  }
  res.json(await queryOne(`SELECT ${USER_FIELDS} FROM Usuarios WHERE id = ?`, [req.params.id]));
});
