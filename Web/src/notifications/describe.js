// Convierte un evento en tiempo real en una notificación legible (o null si no hay que avisar).
import { STATUS_MAP, PRIORITY_MAP } from "../utils/ticketUtils";
import { STATUS_LABELS } from "../components/tickets/StatusBadge";
import { PRIORITIES } from "../components/tickets/PriorityBadge";

const statusLabel = raw => STATUS_LABELS[STATUS_MAP[String(raw ?? "").toLowerCase()]] ?? raw;
const priorityLabel = raw => PRIORITIES.find(p => p.key === PRIORITY_MAP[String(raw ?? "").toLowerCase()])?.label ?? raw;
const plural = (n, one, many) => (n === 1 ? one : many.replace("{n}", n));

/**
 * @param {object} e     Evento recibido por SSE
 * @param {object} user  Usuario de la sesión ({ id, role })
 * @returns {{ kind, title, body, ticketId?, tone }} | null
 */
export function describeEvent(e, user) {
  if (!e?.type || e.type === "ready" || e.type === "connected") return null;
  if (e.actorId && e.actorId === user.id) return null; // no avisar a quien hizo el cambio

  const staff   = user.role === "admin" || user.role === "agente";
  const isOwner = e.ownerId === user.id;
  const actor   = e.actor ?? "Alguien";
  const ticket  = { kind: "ticket", ticketId: e.ticketId, codigo: e.codigo };

  switch (e.type) {
    case "ticket.created":
      if (isOwner && e.desdeOtro) {
        return { ...ticket, tone: "success", title: "Tu reporte ya es un ticket", body: `${e.codigo} · ${e.titulo}` };
      }
      if (staff) return { ...ticket, tone: "info", title: `Nuevo ticket ${e.codigo}`, body: `${actor}: ${e.titulo}` };
      return null;

    case "ticket.updated": {
      const c = e.cambios ?? {};
      if (c.Status !== undefined) {
        const label = statusLabel(c.Status);
        return isOwner
          ? { ...ticket, tone: c.Status === "resolved" ? "success" : "info", title: `Tu ticket ${e.codigo} está «${label}»`, body: e.titulo }
          : { ...ticket, tone: "info", title: `${e.codigo}: ${label}`, body: `${actor} cambió el estado · ${e.titulo}` };
      }
      if (e.adjuntos && e.reporteOriginal) return null; // ya se avisó con «Nuevo ticket»
      if (e.adjuntos) {
        return { ...ticket, tone: "info", title: `Capturas nuevas en ${e.codigo}`, body: `${actor} ${plural(e.adjuntos, "adjuntó una imagen", "adjuntó {n} imágenes")}` };
      }
      if (!staff) return null; // agente o prioridad: solo interesa al equipo
      if (c.Agente !== undefined) return { ...ticket, tone: "info", title: `${e.codigo} reasignado`, body: `${actor} cambió el agente · ${e.titulo}` };
      if (c.Prioridad !== undefined) {
        const urgent = PRIORITY_MAP[String(c.Prioridad).toLowerCase()] === "urgent";
        return { ...ticket, tone: urgent ? "danger" : "info", title: `${e.codigo}: prioridad ${priorityLabel(c.Prioridad)}`, body: e.titulo };
      }
      return null;
    }

    case "message.created": {
      if (e.sistema) return null; // los cambios de estado ya se avisan en ticket.updated
      const soloImagen = e.adjuntos && String(e.extracto ?? "").startsWith("📎");
      const body = soloImagen ? `${actor} ${plural(e.adjuntos, "envió una imagen", "envió {n} imágenes")}` : `${actor}: ${e.extracto}`;
      return isOwner
        ? { ...ticket, tone: "info", title: `El soporte te respondió en ${e.codigo}`, body }
        : { ...ticket, tone: "info", title: `Nuevo mensaje en ${e.codigo}`, body };
    }

    case "otro.created":
      return { kind: "otro", tone: "warning", title: "Nuevo reporte «Otro» por clasificar", body: `${actor}: ${e.categoria ?? e.extracto}` };

    case "foro.proposed":
      return { kind: "foro", tone: "info", title: "Nueva propuesta para el foro", body: e.titulo };

    default:
      return null;
  }
}
