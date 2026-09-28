export function getInitials(name = "") {
  return (name || "").trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").slice(0, 2).join("") || "?";
}

export function formatDuration(startIso, endIso = null) {
  if (!startIso) return "—";
  const start    = new Date(startIso);
  const end      = endIso ? new Date(endIso) : new Date();
  const totalMin = Math.max(0, Math.floor((end - start) / 60_000));

  if (totalMin < 1)   return "< 1 min";
  if (totalMin < 60)  return `${totalMin} min`;

  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 24)  return m  ? `${h}h ${m}min` : `${h}h`;

  const d  = Math.floor(h / 24);
  const rh = h % 24;
  if (d < 30)  return rh ? `${d}d ${rh}h`  : `${d}d`;

  const mo = Math.floor(d / 30);
  const rd = d % 30;
  return rd ? `${mo}m ${rd}d` : `${mo}m`;
}

export const STATUS_MAP = {
  "en proceso": "open",
  "pendiente": "pending",
  "finalizado": "resolved",
  "bloqueado": "closed",
  "open": "open",
  "pending": "pending",
  "resolved": "resolved",
  "closed": "closed"
};

export const PRIORITY_MAP = {
  "urgente": "urgent",
  "alta": "high",
  "media": "medium",
  "baja": "low",
  "urgent": "urgent",
  "high": "high",
  "medium": "medium",
  "low": "low"
};

export function mapDbTicket(row, incMap, usrMap, agentMap = {}) {
  let inc = incMap[row.Incidente_ID];
  if (!inc && row.Departamento) {
    inc = Object.values(incMap).find(i => i.Categoria === row.Departamento) || {};
  } else {
    inc = inc || {};
  }
  const usr = usrMap[row.Usuario]      ?? {};
  const assignedAgentId = row.Agente ?? inc.Agentes ?? null;
  const parsedAgentId = assignedAgentId != null ? parseInt(assignedAgentId) : null;
  const agt = agentMap[parsedAgentId] ?? {};
  
  const rawStatus = (row.Status || "open").toLowerCase();
  const rawPriority = (row.Prioridad || "medium").toLowerCase();

  return {
    _id:               row.id,
    id:                `TK-${String(row.id).padStart(4, "0")}`,
    title:             inc.Incidente   ?? row.Descripcion?.slice(0, 60) ?? "Sin título",
    category:          inc.Categoria   ?? row.Departamento ?? "—",
    requester:         usr.Usuario     ?? `Usuario #${row.Usuario ?? "?"}`,
    requesterInitials: getInitials(usr.Usuario),
    agent:             agt.Nombre      ?? "Sin asignar",
    agentInitials:     getInitials(agt.Nombre),
    agentRawId:        parsedAgentId,
    status:            STATUS_MAP[rawStatus] || "open",
    priority:          PRIORITY_MAP[rawPriority] || "medium",
    created:           row.Fecha ? new Date(row.Fecha).toLocaleDateString("es-ES") : "—",
    desc:              row.Descripcion  ?? "",
    departamento:      row.Departamento ?? "",
    incidenteTiempo:   inc.Tiempo       ?? "",
    comment:           row.comment      ?? "",
    rawFecha:          row.Fecha        ?? null,
  };
}
