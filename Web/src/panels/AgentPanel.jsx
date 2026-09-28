import { useState } from "react";
import { LayoutDashboard, Inbox, BookOpenCheck } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { AgentDashboardView } from "../views/AgentDashboardView";
import { TicketsView } from "../views/TicketsView";
import { ForoBrowser } from "../foro/ForoBrowser";
import { useTickets } from "../hooks/useTickets";
import { useAgents } from "../hooks/useAgents";

const AGENT_NAV_ITEMS = [
  { key: "tickets",   label: "Mis tickets", Icon: Inbox, hasBadge: true },
  { key: "dashboard", label: "Dashboard",   Icon: LayoutDashboard },
  { key: "foro",      label: "Foro",        Icon: BookOpenCheck },
];

export function AgentPanel({ user, onLogout, dark, onToggleDark }) {
  const [activeView, setActiveView] = useState("tickets");
  const [selectedId, setSelectedId] = useState(null);
  const agents = useAgents();
  const { tickets, filteredTickets, filter, setFilter, agentFilter, setAgentFilter, search, setSearch, updateTicket, stats, loading, error, refresh } = useTickets(user.agentName);

  const handleSearch = q => {
    setSearch(q);
    if (q && activeView !== "tickets") setActiveView("tickets");
  };

  const openTicket = id => {
    setSelectedId(id);
    setActiveView("tickets");
  };

  const agentTickets   = tickets.filter(t => t.agent === user.agentName || t.requester === user.agentName);
  const selectedTicket = agentTickets.find(t => t.id === selectedId) ?? null;

  return (
    <AppLayout
      activeView={activeView} onNavigate={setActiveView}
      search={search} onSearch={handleSearch}
      pendingCount={stats.pending} dark={dark} onToggleDark={onToggleDark}
      user={user} onLogout={onLogout} navItems={AGENT_NAV_ITEMS}
      fullBleed={activeView === "tickets"}
    >
      {activeView === "dashboard" && (
        <AgentDashboardView stats={stats} tickets={agentTickets} onNavigate={setActiveView}
          onOpenTicket={openTicket} user={user} loading={loading} error={error} onRetry={refresh} />
      )}
      {activeView === "foro" && (
        <div className="max-w-4xl mx-auto"><ForoBrowser /></div>
      )}
      {activeView === "tickets" && (
        <TicketsView title="Mis tickets" filteredTickets={filteredTickets}
          selectedTicket={selectedTicket} onSelect={setSelectedId} onSave={updateTicket} isAgent={true}
          filter={filter} setFilter={setFilter} agentFilter={agentFilter} setAgentFilter={setAgentFilter}
          agents={agents} search={search} setSearch={setSearch}
          loading={loading} error={error} onRetry={refresh} />
      )}
    </AppLayout>
  );
}
