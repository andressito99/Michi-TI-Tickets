// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

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
