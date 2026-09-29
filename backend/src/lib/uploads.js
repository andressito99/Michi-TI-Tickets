// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

// Recepción y almacenamiento seguro de capturas de pantalla.
//
// - Solo imágenes PNG, JPEG, GIF y WebP. El tipo se decide por los PRIMEROS BYTES del archivo
//   (su "firma"), no por la extensión ni por lo que diga el navegador, que se pueden falsificar.
//   SVG no se acepta: puede contener JavaScript.
// - Se guardan con un nombre aleatorio en una carpeta fuera de la web (config.uploads.dir);
//   solo se pueden descargar a través de la API, que comprueba permisos.
// - Nada se escribe en disco hasta que la ruta ha comprobado que el usuario puede adjuntar.
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { config } from "../config.js";
import { query } from "../db.js";
import { HttpError } from "../middleware/auth.js";

const SIGNATURES = [
  { mime: "image/png",  ext: "png",  test: b => b.length > 8 && b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG" },
  { mime: "image/jpeg", ext: "jpg",  test: b => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/gif",  ext: "gif",  test: b => b.length > 6 && ["GIF87a", "GIF89a"].includes(b.toString("ascii", 0, 6)) },
  { mime: "image/webp", ext: "webp", test: b => b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
];

export const detectImage = buffer => SIGNATURES.find(s => s.test(buffer)) ?? null;

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.uploads.maxBytes, files: config.uploads.maxFiles, fields: 10 },
});

/**
 * Middleware: acepta hasta N imágenes en el campo "archivos" (multipart/form-data).
 * Si la petición es JSON normal, no hace nada. Traduce los errores de multer a mensajes claros.
 */
export function receiveImages(req, res, next) {
  multerUpload.array("archivos", config.uploads.maxFiles)(req, res, err => {
    if (!err) return next();
    const mb = Math.round(config.uploads.maxBytes / 1024 / 1024);
    if (err.code === "LIMIT_FILE_SIZE")  return next(new HttpError(413, `Cada imagen puede pesar como máximo ${mb} MB`));
    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(new HttpError(400, `Puedes adjuntar como máximo ${config.uploads.maxFiles} imágenes`));
    }
    next(new HttpError(400, "No se pudieron leer los archivos adjuntos"));
  });
}

/** Valida TODAS las imágenes antes de guardar ninguna. */
export function validateImages(files = []) {
  return files.map(file => {
    const kind = detectImage(file.buffer);
    if (!kind) throw new HttpError(415, `«${file.originalname}» no es una imagen válida (PNG, JPG, GIF o WebP)`);
    return { file, kind };
  });
}

const cleanName = name =>
  String(name ?? "captura")
    .replace(/[\\/]/g, "_")
    .replace(/[\u0000-\u001f\u007f"<>|:*?]/g, "")
    .trim()
    .slice(0, 150) || "captura";

/**
 * Guarda imágenes ya validadas y registra cada una en la tabla Adjuntos.
 * @param {{ ticketId?: number, otroId?: number, conversacionId?: number, userId: number }} owner
 */
export async function saveImages(validated, { ticketId = null, otroId = null, conversacionId = null, userId }) {
  if (validated.length === 0) return [];
  await fs.mkdir(config.uploads.dir, { recursive: true });

  const saved = [];
  for (const { file, kind } of validated) {
    const archivo = `${randomUUID()}.${kind.ext}`;
    await fs.writeFile(path.join(config.uploads.dir, archivo), file.buffer, { flag: "wx" });
    const nombre = cleanName(file.originalname);
    const result = await query(
      `INSERT INTO Adjuntos (Ticket_ID, Otro_ID, Conversacion_ID, Usuario_ID, Nombre, Archivo, Tipo, Tamano)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ticketId, otroId, conversacionId, userId, nombre, archivo, kind.mime, file.size]
    );
    saved.push({ id: result.insertId, Nombre: nombre, Tipo: kind.mime, Tamano: file.size, Conversacion_ID: conversacionId });
  }
  return saved;
}

/** Borra del disco los archivos indicados (por ejemplo, al eliminar un reporte). */
export async function deleteStoredFiles(archivos) {
  await Promise.all(archivos.map(a =>
    fs.unlink(path.join(config.uploads.dir, path.basename(a))).catch(() => {})
  ));
}

export const ADJUNTO_FIELDS = "id, Ticket_ID, Otro_ID, Conversacion_ID, Usuario_ID, Nombre, Tipo, Tamano, created_at";
