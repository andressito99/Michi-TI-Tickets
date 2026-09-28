import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useConversaciones(ticketId) {
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConversaciones = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/tickets/${ticketId}/conversaciones`);

      setConversaciones(data.map(c => ({
        id: c.id,
        mensaje: c.mensaje,
        fecha: new Date(c.fecha_publicacion).toLocaleString("es-ES"),
        rawFecha: c.fecha_publicacion,
        usuario: c.Usuario_nombre || "Sistema",
        usuarioId: c.Usuario_ID,
      })));
    } catch (err) {
      console.error("Error cargando conversaciones:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadConversaciones();
  }, [loadConversaciones]);

  // El autor lo toma el backend del token de sesión
  const addConversacion = async (mensaje) => {
    try {
      await api.post(`/tickets/${ticketId}/conversaciones`, { mensaje });
      await loadConversaciones();
      return { success: true };
    } catch (err) {
      console.error("Error al añadir conversación:", err);
      return { success: false, error: err.message };
    }
  };

  return { conversaciones, loading, error, addConversacion };
}
