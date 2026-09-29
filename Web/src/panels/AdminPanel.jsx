import { useState } from "react";
import { LayoutDashboard, Inbox, Users, UserCog, BarChart3, Settings, BookOpenCheck } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { DashboardView } from "../views/DashboardView";
import { TicketsView } from "../views/TicketsView";
import { UsersView } from "../views/UsersView";
import { AgentsView } from "../views/AgentsView";
import { ReportsView } from "../views/ReportsView";
import { ConfigView } from "../views/ConfigView";
import { ForoAdminView } from "../views/ForoAdminView";
import { useTickets } from "../hooks/useTickets";
import { useAgents } from "../hooks/useAgents";
import { useNotificationHandler } from "../notifications/NotificationsProvider";

const ADMIN_NAV_ITEMS = [
  { key: "tickets",   label: "Tickets",       Icon: Inbox, hasBadge: true },
  { key: "dashboard", label: "Dashboard",     Icon: LayoutDashboard },
  { key: "users",     label: "Usuarios",      Icon: Users },
  { key: "agents",    label: "Agentes",       Icon: UserCog },
  { key: "reports",   label: "Reportes",      Icon: BarChart3 },
  { key: "foro",      label: "Foro",          Icon: BookOpenCheck },
  { key: "config",    label: "Configuración", Icon: Settings },
];

export function AdminPanel({ user, onLogout, dark, onToggleDark }) {
  const [activeView, setActiveView] = useState("tickets");
  const [selectedId, setSelectedId] = useState(null);
  const agents = useAgents();
  const { tickets, filteredTickets, filter, setFilter, agentFilter, setAgentFilter, search, setSearch, updateTicket, stats, loading, error, refresh } = useTickets();

  const handleSearch = q => {
    setSearch(q);
    if (q && activeView !== "tickets") setActiveView("tickets");
  };

  // Abrir un ticket desde cualquier vista lleva al workspace de tickets
  const openTicket = id => {
    setSelectedId(id);
    setActiveView("tickets");
  };

  // Al pulsar una notificación: ticket → workspace; reporte "Otro" → Reportes; propuesta → Foro
  useNotificationHandler(note => {
    if (note.ticketId) openTicket(`TK-${String(note.ticketId).padStart(4, "0")}`);
    else if (note.kind === "otro") setActiveView("reports");
    else if (note.kind === "foro") setActiveView("foro");
  });

  const selectedTicket = tickets.find(t => t.id === selectedId) ?? null;

  return (
    <AppLayout
      activeView={activeView} onNavigate={setActiveView}
      search={search} onSearch={handleSearch}
      pendingCount={stats.pending} dark={dark} onToggleDark={onToggleDark}
      user={user} onLogout={onLogout} navItems={ADMIN_NAV_ITEMS}
      fullBleed={activeView === "tickets"}
    >
      {activeView === "dashboard" && (
        <DashboardView stats={stats} tickets={tickets} onNavigate={setActiveView}
          onOpenTicket={openTicket} user={user} loading={loading} error={error} onRetry={refresh} />
      )}
      {activeView === "tickets" && (
        <TicketsView title="Todos los tickets" filteredTickets={filteredTickets}
          selectedTicket={selectedTicket} onSelect={setSelectedId} onSave={updateTicket} isAgent={false}
          filter={filter} setFilter={setFilter} agentFilter={agentFilter} setAgentFilter={setAgentFilter}
          agents={agents} search={search} setSearch={setSearch}
          loading={loading} error={error} onRetry={refresh} />
      )}
      {activeView === "users" && (
        <UsersView />
      )}
      {activeView === "agents" && (
        <AgentsView agents={agents} tickets={tickets} onOpenTicket={openTicket} />
      )}
      {activeView === "reports" && (
        <ReportsView tickets={tickets} onTicketAdded={refresh} />
      )}
      {activeView === "foro" && (
        <ForoAdminView />
      )}
      {activeView === "config" && (
        <ConfigView />
      )}
    </AppLayout>
  );
}
