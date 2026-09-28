import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { getInitials } from "../utils/ticketUtils";

export function useAgents() {
  const [agents, setAgents] = useState([]);
  useEffect(() => {
    api.get("/agentes")
      .then(data => {
        setAgents((data ?? []).map(a => ({
          id:           String(a.id),
          name:         a.Nombre,
          initials:     getInitials(a.Nombre),
          especialidad: a.Especialidad || ""
        })));
      })
      .catch(err => console.error("Error cargando agentes:", err));
  }, []);
  return agents;
}
