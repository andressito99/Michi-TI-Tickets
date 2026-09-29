// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

// Copia los datos de Supabase a MySQL conservando los IDs.
// Requiere SUPABASE_URL y SUPABASE_KEY (service_role para poder leer todo) en backend/.env
// y que el esquema ya exista (npm run db:init).
//
//   npm run db:migrate-supabase
//
// Las contraseñas en texto plano se guardan hasheadas con bcrypt.
// Las filas cuyo id ya existe en MySQL se omiten, así que se puede ejecutar varias veces.
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { config } from "../src/config.js";

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Define SUPABASE_URL y SUPABASE_KEY en backend/.env");
  process.exit(1);
}

// Orden pensado para respetar las relaciones
const TABLES = ["Usuarios", "Agentes", "Incidentes", "Tickets", "Otros_incidentes", "Conversaciones"];
const PAGE   = 1000;

async function fetchAll(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}?select=*&order=id.asc`, {
      headers: {
        apikey:        SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range:         `${from}-${from + PAGE - 1}`,
      },
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

/** Convierte cada valor al tipo de la columna MySQL y descarta columnas inexistentes. */
function coerceRow(row, columns) {
  const out = {};
  for (const [name, type] of columns) {
    if (!(name in row)) continue;
    const v = row[name];
    if (v === null || v === undefined) { out[name] = null; continue; }
    if (type.startsWith("int"))           out[name] = Number.isFinite(Number.parseInt(v, 10)) ? Number.parseInt(v, 10) : null;
    else if (type.startsWith("datetime")) out[name] = new Date(v);
    else                                  out[name] = typeof v === "object" ? JSON.stringify(v) : String(v);
  }
  return out;
}

const conn = await mysql.createConnection({ ...config.db, charset: "utf8mb4", timezone: "Z" });
await conn.query("SET time_zone = '+00:00'");
await conn.query("SET FOREIGN_KEY_CHECKS = 0");

try {
  for (const table of TABLES) {
    let rows;
    try {
      rows = await fetchAll(table);
    } catch (err) {
      console.warn(`⚠ ${table}: no se pudo leer de Supabase (${err.message})`);
      continue;
    }

    const [cols] = await conn.query(`SHOW COLUMNS FROM \`${table}\``);
    const columns = cols.map(c => [c.Field, c.Type.toLowerCase()]);

    let inserted = 0, skipped = 0, failed = 0;
    for (const raw of rows) {
      const row = coerceRow(raw, columns);
      if (table === "Usuarios" && row["Contraseña"] && !/^\$2[aby]\$/.test(row["Contraseña"])) {
        row["Contraseña"] = bcrypt.hashSync(row["Contraseña"], 10);
      }
      if (table === "Usuarios" && row.Correo) row.Correo = row.Correo.toLowerCase().trim();
      try {
        const [res] = await conn.query(`INSERT IGNORE INTO \`${table}\` SET ?`, [row]);
        res.affectedRows ? inserted++ : skipped++;
      } catch (err) {
        failed++;
        console.warn(`  ✖ ${table} id=${raw.id}: ${err.message}`);
      }
    }
    console.log(`✔ ${table}: ${inserted} insertadas, ${skipped} omitidas (ya existían/duplicadas), ${failed} con error`);
  }
} finally {
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  await conn.end();
}
