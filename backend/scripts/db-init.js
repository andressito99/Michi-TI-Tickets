// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

// Crea la base de datos y las tablas a partir de database/schema.sql.
// Con --seed además inserta datos de demostración (solo si las tablas están vacías).
//
//   npm run db:init     → solo esquema
//   npm run db:seed     → esquema + datos demo
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { config } from "../src/config.js";

const schemaPath = new URL("../../database/schema.sql", import.meta.url);
const withSeed   = process.argv.includes("--seed");

// El schema.sql usa "ti_tickets"; si DB_NAME es otro, se reemplaza.
const schema = (await readFile(schemaPath, "utf8")).replaceAll("ti_tickets", config.db.database);

const conn = await mysql.createConnection({
  host: config.db.host, port: config.db.port,
  user: config.db.user, password: config.db.password,
  multipleStatements: true, charset: "utf8mb4", timezone: "Z",
});

try {
  await conn.query(schema);
  console.log(`✔ Esquema aplicado en "${config.db.database}"`);

  if (withSeed) await seed(conn);
} finally {
  await conn.end();
}

async function seed(conn) {
  await conn.query(`USE \`${config.db.database}\``);
  await conn.query("SET time_zone = '+00:00'");
  const [[{ n }]] = await conn.query("SELECT COUNT(*) AS n FROM Usuarios");
  if (n > 0) {
    console.log("• Usuarios ya tiene datos — se omite el seed.");
    return;
  }

  const hash = pw => bcrypt.hashSync(pw, 10);

  // Las contraseñas demo se leen de backend/.env (SEED_*). Si no están, se generan al azar.
  const pw = name => process.env[name]?.trim() || randomBytes(9).toString("base64url");
  const passwords = {
    admin:   pw("SEED_ADMIN_PASSWORD"),
    agente:  pw("SEED_AGENT_PASSWORD"),
    usuario: pw("SEED_USER_PASSWORD"),
  };

  await conn.query(
    "INSERT INTO Usuarios (Usuario, `Contraseña`, Rol, Correo, Departmento) VALUES ?",
    [[
      ["Administrador", hash(passwords.admin),   "admin",   "admin1@empresa.com",  "TI"],
      ["Ana García",    hash(passwords.agente),  "agente",  "agente1@empresa.com", "TI"],
      ["juan",          hash(passwords.usuario), "usuario", "juan@empresa.com",    "Ventas"],
    ]]
  );

  await conn.query("INSERT INTO Agentes (Nombre, Especialidad) VALUES ?", [[
    ["Ana García",   "Redes y conectividad"],
    ["Carlos Pérez", "Hardware y equipos"],
  ]]);

  await conn.query("INSERT INTO Incidentes (Categoria, Incidente, Tiempo, Prioridad, Agentes) VALUES ?", [[
    ["Redes",    "Sin conexión a internet",           "2 horas",  "high",   1],
    ["Redes",    "Wi-Fi lento o intermitente",        "4 horas",  "medium", 1],
    ["Hardware", "El equipo no enciende",             "1 día",    "high",   2],
    ["Hardware", "Impresora no imprime",              "4 horas",  "medium", 2],
    ["Software", "Instalación de programa",           "1 día",    "low",    2],
    ["Cuentas",  "Restablecer contraseña de correo",  "1 hora",   "urgent", 1],
  ]]);

  await conn.query(
    "INSERT INTO Tickets (Usuario, Departamento, Status, Incidente_ID, Descripcion, Prioridad, Agente) VALUES ?",
    [[
      [3, "Ventas", "open",    1, "Desde esta mañana no tengo internet en mi escritorio.", "high",   1],
      [3, "Ventas", "pending", 4, "La impresora del piso 2 marca atasco de papel.",         "medium", 2],
    ]]
  );

  await conn.query("INSERT INTO Conversaciones (incidente_id, mensaje, Usuario_ID) VALUES ?", [[
    [1, "Hola, ya revisamos el switch de tu área. ¿Puedes reiniciar el equipo?", 2],
  ]]);

  await conn.query(
    "INSERT INTO Foro_publicaciones (Titulo, Categoria, Problema, Solucion, Estado, Publicado_por, published_at, Vistas) VALUES ?",
    [[
      [
        "No puedo entrar a mi correo porque olvidé la contraseña", "Cuentas",
        "Al intentar abrir el correo aparece \"contraseña incorrecta\" y, tras varios intentos, la cuenta se bloquea.",
        "1. Espera 15 minutos: el bloqueo por intentos fallidos se levanta solo.\n2. Entra en el portal de autoservicio y pulsa \"¿Olvidaste tu contraseña?\".\n3. Sigue el enlace que llega a tu correo personal o teléfono registrado.\n4. Usa una contraseña nueva de al menos 12 caracteres.\n5. Si no tienes datos de recuperación registrados, reporta un problema en la categoría Cuentas y te la restablecemos.",
        "publicado", 1, new Date(), 42,
      ],
      [
        "El Wi-Fi se corta cada pocos minutos en las salas de reuniones", "Redes",
        "La conexión Wi-Fi funciona un rato y luego se desconecta, sobre todo en salas con mucha gente.",
        "1. Olvida la red Wi-Fi en tu equipo y vuelve a conectarte.\n2. Si tu equipo lo permite, conéctate a la red de 5 GHz (termina en \"-5G\"): hay menos interferencias.\n3. Desactiva el ahorro de energía del adaptador Wi-Fi (Administrador de dispositivos → Adaptador de red → Administración de energía).\n4. Si sigue fallando, reporta un problema indicando la sala: puede que el punto de acceso necesite revisión.",
        "publicado", 1, new Date(), 17,
      ],
    ]]
  );

  console.log("✔ Datos demo insertados:");
  console.log(`   admin1@empresa.com  / ${passwords.admin}   (admin)`);
  console.log(`   agente1@empresa.com / ${passwords.agente}   (agente)`);
  console.log(`   juan                / ${passwords.usuario}   (usuario)`);
  if (!process.env.SEED_ADMIN_PASSWORD) console.log("   (contraseñas generadas al azar: defínelas en backend/.env con SEED_*_PASSWORD si quieres fijarlas)");
}
