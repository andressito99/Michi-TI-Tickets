import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { useRealtimeRefresh } from "../lib/realtime";

/**
 * Conversación de un ticket (mensajes con sus imágenes) y las imágenes del reporte original.
 * Se actualiza sola cuando llega un mensaje nuevo en tiempo real.
 */
export function useConversaciones(ticketId) {
  const [conversaciones, setConversaciones] = useState([]);
  const [adjuntosReporte, setAdjuntosReporte] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConversaciones = useCallback(async ({ silent = false } = {}) => {
    if (!ticketId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [data, adjuntos] = await Promise.all([
        api.get(`/tickets/${ticketId}/conversaciones`),
        api.get(`/tickets/${ticketId}/adjuntos`),
      ]);

      setConversaciones(data.map(c => ({
        id: c.id,
        mensaje: c.mensaje,
        fecha: new Date(c.fecha_publicacion).toLocaleString("es-ES"),
        rawFecha: c.fecha_publicacion,
        usuario: c.Usuario_nombre || "Sistema",
        usuarioId: c.Usuario_ID,
        adjuntos: c.adjuntos ?? [],
      })));
      setAdjuntosReporte(adjuntos.filter(a => !a.Conversacion_ID));
    } catch (err) {
      console.error("Error cargando conversaciones:", err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadConversaciones();
  }, [loadConversaciones]);

  // Tiempo real: mensajes o imágenes nuevas en ESTE ticket
  useRealtimeRefresh(
    e => (e.type === "message.created" || (e.type === "ticket.updated" && e.adjuntos)) && e.ticketId === ticketId
      || (e.type === "connected" && e.reconnected),
    () => loadConversaciones({ silent: true })
  );

  /**
   * Envía un mensaje, opcionalmente con imágenes (File[]). El autor lo toma el backend del token.
   */
  const addConversacion = async (mensaje, archivos = []) => {
    try {
      if (archivos.length > 0) {
        const form = new FormData();
        form.append("mensaje", mensaje ?? "");
        archivos.forEach(f => form.append("archivos", f, f.name));
        await api.upload(`/tickets/${ticketId}/conversaciones`, form);
      } else {
        await api.post(`/tickets/${ticketId}/conversaciones`, { mensaje });
      }
      await loadConversaciones({ silent: true });
      return { success: true };
    } catch (err) {
      console.error("Error al añadir conversación:", err);
      return { success: false, error: err.message };
    }
  };

  return { conversaciones, adjuntosReporte, loading, error, addConversacion };
}
