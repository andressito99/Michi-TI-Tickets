import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { config } from "./config.js";
import { pool } from "./db.js";
import { HttpError, requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import ticketRoutes from "./routes/tickets.js";
import conversacionRoutes from "./routes/conversaciones.js";
import otrosIncidentesRoutes from "./routes/otrosIncidentes.js";
import aiRoutes from "./routes/ai.js";
import foroRoutes from "./routes/foro.js";
import adjuntosRoutes from "./routes/adjuntos.js";
import { addClient } from "./lib/realtime.js";
import { agentes, incidentes, usuarios } from "./routes/catalogo.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());   // cabeceras de seguridad (nosniff, frameguard, HSTS, etc.)
app.use(cors({ origin: config.corsOrigins.length ? config.corsOrigins : true }));
app.use(express.json({ limit: "1mb" }));

// Límite general por IP y uno estricto para login/registro (contra fuerza bruta)
app.use("/api", rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));
const authLimiter = rateLimit({
  windowMs: 15 * 60_000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
});

app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
});

app.use("/api/auth/login",    authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);

// Todo lo demás requiere sesión
app.use("/api", requireAuth);

// Canal de notificaciones en tiempo real (Server-Sent Events): la conexión queda abierta
app.get("/api/events", (req, res) => addClient(req.user, req, res));

app.use("/api/tickets",          ticketRoutes);
app.use("/api/adjuntos",         adjuntosRoutes);
app.use("/api/conversaciones",   conversacionRoutes);
app.use("/api/otros-incidentes", otrosIncidentesRoutes);
app.use("/api/incidentes",       incidentes);
app.use("/api/agentes",          agentes);
app.use("/api/usuarios",         usuarios);
app.use("/api/ai",               aiRoutes);
app.use("/api/foro",             foroRoutes);

app.use("/api", (_req, _res, next) => next(new HttpError(404, "Ruta no encontrada")));

// Manejador de errores: Express 5 captura también los errores de funciones async
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON inválido" });
  if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Registro duplicado" });
  if (err.code === "ECONNREFUSED") return res.status(503).json({ error: "No se pudo conectar a MySQL. ¿Está MAMP encendido?" });
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});
