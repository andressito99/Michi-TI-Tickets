import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { mapDbTicket } from "../utils/ticketUtils";

const POLL_INTERVAL_MS = 20_000;

/**
 * Datos del portal del usuario: sus tickets (con el último mensaje)
 * y sus reportes "Otros" que aún están en revisión por el equipo.
 */
export function useMyTickets(user) {
  const [tickets, setTickets] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [rows, otros, incs, agts] = await Promise.all([
        api.get("/tickets"),
        api.get("/otros-incidentes?activos=1"),
        api.get("/incidentes"),
        api.get("/agentes"),
      ]);

      const ids = rows.map(r => r.id);
      const ultimos = ids.length ? await api.get(`/conversaciones/ultimas?tickets=${ids.join(",")}`) : [];
      const lastById = Object.fromEntries(ultimos.map(c => [c.incidente_id, c]));

      const incMap   = Object.fromEntries(incs.map(i => [i.id, i]));
      const usrMap   = { [user.id]: { Usuario: user.name } };
      const agentMap = Object.fromEntries(agts.map(a => [a.id, { Nombre: a.Nombre }]));

      setTickets(rows.map(r => {
        const t = mapDbTicket(r, incMap, usrMap, agentMap);
        const last = lastById[r.id];
        return {
          ...t,
          lastMessage:     last?.mensaje ?? null,
          lastMessageAt:   last?.fecha_publicacion ?? null,
          lastFromSupport: last ? last.Usuario_ID !== user.id : false,
        };
      }));

      setPending(otros.map(o => ({
        _id:         o.id,
        id:          `OI-${String(o.id).padStart(4, "0")}`,
        categoria:   o.Categoria ?? "Otro",
        descripcion: o.Descripcion ?? "",
        rawFecha:    o.Fecha,
      })));
    } catch (err) {
      setError(err.message ?? "No se pudieron cargar tus tickets");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user.id, user.name]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { tickets, pending, loading, error, refresh: () => load() };
}
