// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

// Notificaciones en tiempo real con Server-Sent Events (SSE).
//
// Cada navegador abre GET /api/events y mantiene la conexión abierta. Cuando algo cambia
// (ticket nuevo, cambio de estado, mensaje…), la API envía un evento SOLO a las personas
// que deben enterarse: el admin, el agente asignado y el dueño del ticket.
//
// Los clientes se guardan en memoria: sirve para un único proceso de la API. Si algún día
// se ejecutan varias instancias, habría que repartir los eventos con Redis (pub/sub).
import { queryOne } from "../db.js";

const clients = new Map(); // id de conexión → { user, res }
let nextId = 1;
let eventSeq = 0;

// Latido frecuente: el navegador da la conexión por muerta si pasa ~40 s sin recibir nada
const HEARTBEAT_MS = 15_000;

/** Registra una conexión SSE y la mantiene viva hasta que el cliente se desconecta. */
export function addClient(user, req, res) {
  res.writeHead(200, {
    "Content-Type":      "text/event-stream; charset=utf-8",
    "Cache-Control":     "no-cache, no-transform",
    "Connection":        "keep-alive",
    "X-Accel-Buffering": "no", // evita que Nginx u otros proxies retengan los eventos
  });
  res.write("retry: 5000\n\n");

  const id = nextId++;
  clients.set(id, { user, res });
  send(res, { type: "ready" });

  req.on("close", () => clients.delete(id));
}

function send(res, payload) {
  res.write(`id: ${++eventSeq}\ndata: ${JSON.stringify(payload)}\n\n`);
}

/**
 * Envía un evento a los usuarios conectados que cumplan `audience(user)`.
 * @param {object} payload  { type, ...datos }
 * @param {(user: {id:number, usuario:string, rol:string}) => boolean} audience
 */
export function publish(payload, audience) {
  for (const { user, res } of clients.values()) {
    try {
      if (audience(user)) send(res, payload);
    } catch {
      /* conexión rota: se limpia en el evento "close" */
    }
  }
}

export const toAdmins = user => user.rol === "admin";

/**
 * Quién debe enterarse de lo que pasa en un ticket: los admins, el agente asignado
 * (su nombre de usuario coincide con el de la tabla Agentes) y el dueño del ticket.
 */
export async function ticketAudience(ticketId) {
  const t = await queryOne(
    `SELECT t.Usuario, a.Nombre AS agente
     FROM Tickets t LEFT JOIN Agentes a ON a.id = t.Agente
     WHERE t.id = ?`,
    [ticketId]
  );
  if (!t) return () => false;
  return user =>
    user.rol === "admin" ||
    user.id === t.Usuario ||
    (user.rol === "agente" && !!t.agente && user.usuario === t.agente);
}

/** Datos básicos de un ticket para mostrar en la notificación. */
export async function ticketSummary(ticketId) {
  const t = await queryOne(
    `SELECT t.id, t.Status, t.Usuario, i.Incidente, t.Descripcion
     FROM Tickets t LEFT JOIN Incidentes i ON i.id = t.Incidente_ID
     WHERE t.id = ?`,
    [ticketId]
  );
  if (!t) return null;
  return {
    ticketId: t.id,
    codigo:   `TK-${String(t.id).padStart(4, "0")}`,
    titulo:   t.Incidente ?? String(t.Descripcion ?? "").slice(0, 60),
    status:   t.Status,
    ownerId:  t.Usuario,
  };
}

/** Atajo: publica un evento de ticket a su audiencia (opcionalmente unida a otra previa). */
export async function notifyTicket(type, ticketId, extra = {}, previousAudience = null) {
  const [summary, audience] = await Promise.all([ticketSummary(ticketId), ticketAudience(ticketId)]);
  if (!summary) return;
  publish({ type, ...summary, ...extra }, user => audience(user) || (previousAudience?.(user) ?? false));
}

// Latido para que proxies y navegadores no cierren conexiones inactivas
setInterval(() => {
  for (const { res } of clients.values()) {
    try { res.write(": ping\n\n"); } catch { /* se limpia al cerrar */ }
  }
}, HEARTBEAT_MS).unref();

export const connectedClients = () => clients.size;

/** Cierra todas las conexiones (al apagar la API) para que los navegadores se reconecten enseguida. */
export function closeAllClients() {
  for (const { res } of clients.values()) {
    try { res.end(); } catch { /* ya cerrada */ }
  }
  clients.clear();
}
