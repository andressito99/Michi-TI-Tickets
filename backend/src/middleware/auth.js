// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { queryOne } from "../db.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function normalizeRole(rol) {
  const r = (rol ?? "").toLowerCase().trim();
  if (r === "administrador") return "admin";
  return r || "usuario";
}

export const isStaff = user => user?.rol === "admin" || user?.rol === "agente";

const JWT_OPTIONS = { algorithm: "HS256", issuer: "ti-tickets-api" };

export function signToken(user) {
  return jwt.sign(
    { id: user.id, usuario: user.Usuario, rol: normalizeRole(user.Rol) },
    config.jwtSecret,
    { ...JWT_OPTIONS, expiresIn: config.jwtExpiresIn }
  );
}

/**
 * Exige un JWT válido en `Authorization: Bearer <token>` y deja el usuario en req.user.
 * El rol se lee de la base de datos en cada petición: si el admin cambia el rol
 * o elimina al usuario, el token deja de dar esos permisos de inmediato.
 */
export async function requireAuth(req, _res, next) {
  const header = req.get("authorization") ?? "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "No autenticado"));

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: [JWT_OPTIONS.algorithm], issuer: JWT_OPTIONS.issuer });
  } catch {
    return next(new HttpError(401, "Sesión inválida o expirada"));
  }

  try {
    const user = await queryOne("SELECT id, Usuario, Rol FROM Usuarios WHERE id = ?", [payload.id]);
    if (!user) return next(new HttpError(401, "Sesión inválida o expirada"));
    req.user = { id: user.id, usuario: user.Usuario, rol: normalizeRole(user.Rol) };
    next();
  } catch (err) {
    next(err);
  }
}

/** Exige que el usuario tenga uno de los roles indicados. */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.rol)) return next(new HttpError(403, "No tienes permiso para esta acción"));
    next();
  };
}

export const requireStaff = requireRole("admin", "agente");
export const requireAdmin = requireRole("admin");
