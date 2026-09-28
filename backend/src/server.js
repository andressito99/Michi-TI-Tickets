import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";

try {
  await pool.query("SELECT 1");
  console.log(`[db] Conectado a MySQL ${config.db.host}:${config.db.port}/${config.db.database}`);
} catch (err) {
  console.error(`[db] No se pudo conectar a MySQL (${err.code ?? err.message}). ¿Está MAMP encendido y existe la base "${config.db.database}"?`);
}

app.listen(config.port, () => {
  console.log(`[api] Escuchando en http://localhost:${config.port}/api`);
});
