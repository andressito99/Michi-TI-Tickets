// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import mysql from "mysql2";
import { config } from "./config.js";

const rawPool = mysql.createPool({
  ...config.db,
  charset:            "utf8mb4",
  timezone:           "Z",      // las fechas se guardan y devuelven en UTC
  connectionLimit:    10,
  waitForConnections: true,
  decimalNumbers:     true,
});

// Asegura que CURRENT_TIMESTAMP también use UTC en cada conexión
rawPool.on("connection", conn => conn.query("SET time_zone = '+00:00'"));

export const pool = rawPool.promise();

/** Ejecuta una consulta y devuelve las filas. */
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** Devuelve la primera fila o null. */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

/** Ejecuta `fn(conn)` dentro de una transacción. */
export async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Filtra `body` dejando solo las claves permitidas (y definidas). */
export function pick(body = {}, allowed) {
  return Object.fromEntries(
    allowed.filter(k => body[k] !== undefined).map(k => [k, body[k]])
  );
}
