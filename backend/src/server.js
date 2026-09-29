import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import { closeAllClients } from "./lib/realtime.js";

try {
  await pool.query("SELECT 1");
  console.log(`[db] Conectado a MySQL ${config.db.host}:${config.db.port}/${config.db.database}`);
} catch (err) {
  console.error(`[db] No se pudo conectar a MySQL (${err.code ?? err.message}). ¿Está MAMP encendido y existe la base "${config.db.database}"?`);
}

const server = app.listen(config.port, () => {
  console.log(`[api] Escuchando en http://localhost:${config.port}/api`);
});

// Apagado ordenado: se cierran las conexiones en tiempo real para que los navegadores
// se reconecten enseguida a la nueva instancia, en lugar de quedarse esperando.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    closeAllClients();
    server.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
