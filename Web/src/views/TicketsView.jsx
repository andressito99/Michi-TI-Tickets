// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { TicketList } from "../components/tickets/TicketList";
import { TicketWorkspace } from "../components/tickets/TicketWorkspace";
import { Michi } from "../components/ui/Michi";

// Vista de tickets en tres columnas: lista · conversación · propiedades
export function TicketsView({
  title, filteredTickets, selectedTicket, onSelect, onSave, isAgent,
  filter, setFilter, agentFilter, setAgentFilter, agents,
  search, setSearch, loading, error, onRetry,
}) {
  return (
    // @container: el diseño se adapta al ancho real de esta zona (cambia al expandir el menú)
    <div className="@container relative flex flex-1 min-h-0">
      <TicketList
        // En pantallas estrechas se muestra la lista O el ticket, no ambos
        className={selectedTicket ? "hidden @4xl:flex @4xl:w-[300px] @7xl:w-[320px]" : "flex w-full @4xl:w-[300px] @7xl:w-[320px]"}
        title={title}
        tickets={filteredTickets}
        selectedId={selectedTicket?.id ?? null}
        onSelect={onSelect}
        filter={filter} setFilter={setFilter}
        agentFilter={agentFilter} setAgentFilter={setAgentFilter}
        agents={isAgent ? null : agents}
        search={search} setSearch={setSearch}
        loading={loading} error={error} onRetry={onRetry}
      />
      {selectedTicket ? (
        <TicketWorkspace
          key={selectedTicket._id}
          ticket={selectedTicket}
          agents={agents}
          isAgent={isAgent}
          onSave={onSave}
          onClose={() => onSelect(null)}
        />
      ) : (
        <div className="hidden @4xl:flex flex-1 flex-col items-center justify-center text-center px-6">
          <Michi pose="laptop" size={170} className="mb-2" title="Michi espera un ticket" />
          <p className="text-base font-semibold text-ink">Selecciona un ticket</p>
          <p className="text-sm text-muted mt-1 max-w-xs">
            Elige un ticket de la lista para ver la conversación, responder y cambiar su estado.
          </p>
        </div>
      )}
    </div>
  );
}
