import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../lib/api";
import { isTicketEvent, useRealtimeRefresh } from "../lib/realtime";
import { mapDbTicket } from "../utils/ticketUtils";


export function useTickets(agentName = null) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [search,  setSearch]  = useState("");

  // silent = recarga en segundo plano (sondeo) sin mostrar el spinner
  const loadTickets = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [ticketRows, incRows, usrRows, agtRows] = await Promise.all([
        api.get("/tickets"),
        api.get("/incidentes"),
        api.get("/usuarios"),
        api.get("/agentes"),
      ]);

      const incMap = Object.fromEntries((incRows ?? []).map(i => [i.id, i]));
      const usrMap = Object.fromEntries((usrRows ?? []).map(u => [u.id, u]));

      // agentMap from Agentes
      const agentMap = Object.fromEntries(
        (agtRows ?? []).map(a => [a.id, { Nombre: a.Nombre }])
      );

      setTickets((ticketRows ?? []).map(row => mapDbTicket(row, incMap, usrMap, agentMap)));
    } catch (err) {
      setError(err.message ?? "Error al cargar datos");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Tiempo real: la API avisa de tickets nuevos, cambios y mensajes (sin consultar cada X segundos)
  useRealtimeRefresh(isTicketEvent, () => loadTickets({ silent: true }));

  const filteredTickets = useMemo(() => {
    let list = agentName ? tickets.filter(t => t.agent === agentName || t.requester === agentName) : tickets;
    if (agentFilter !== "all") list = list.filter(t => String(t.agentRawId) === agentFilter);
    if (filter === "urgent") list = list.filter(t => t.priority === "urgent");
    else if (filter === "all") list = list.filter(t => t.status !== "resolved");
    else list = list.filter(t => t.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q)    ||
        t.id.toLowerCase().includes(q)        ||
        t.requester.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tickets, filter, search, agentName, agentFilter]);

  const updateTicket = useCallback(async (formattedId, changes) => {
    const ticket = tickets.find(t => t.id === formattedId);
    if (!ticket) return;

    setTickets(prev => prev.map(t => t.id === formattedId ? { ...t, ...changes } : t));

    const dbPayload = {};
    if (changes.status     !== undefined) dbPayload.Status  = changes.status;
    if (changes.agentRawId !== undefined) dbPayload.Agente  = changes.agentRawId;
    if (changes.priority   !== undefined) dbPayload.Prioridad = changes.priority;
    if (changes.comment    !== undefined) dbPayload.comment = changes.comment;
    try {
      await api.patch(`/tickets/${ticket._id}`, dbPayload);
      return true;
    } catch (dbErr) {
      console.error("Error al actualizar ticket:", dbErr.message);
      setTickets(prev => prev.map(t => t.id === formattedId ? ticket : t));
      return false;
    }
  }, [tickets]);

  const stats = useMemo(() => {
    const base = agentName ? tickets.filter(t => t.agent === agentName || t.requester === agentName) : tickets;
    return {
      pending:  base.filter(t => t.status === "pending" || t.status === "open").length,
      resolved: base.filter(t => t.status === "resolved").length,
      urgent:   base.filter(t => t.priority === "urgent" && !["resolved", "closed"].includes(t.status)).length,
      byStatus: ["open", "pending", "resolved", "closed"].map(s => ({
        key: s, count: base.filter(t => t.status === s).length, total: base.length,
      })),
    };
  }, [tickets, agentName]);

  return { tickets, filteredTickets, filter, setFilter, agentFilter, setAgentFilter, search, setSearch, updateTicket, stats, loading, error, refresh: () => loadTickets() };
}
