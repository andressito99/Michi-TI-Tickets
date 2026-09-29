// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { useState, useRef, useEffect } from "react";
import { Plus, Sun, Moon, LogOut, ChevronDown, Home, BookOpenCheck } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { Brand } from "../components/ui/Brand";
import { useMyTickets } from "../hooks/useMyTickets";
import { PortalHome } from "./PortalHome";
import { ReportWizard } from "./ReportWizard";
import { TicketThread } from "./TicketThread";
import { ForoBrowser } from "../foro/ForoBrowser";
import { MichiWatermark } from "../components/ui/MichiBuddy";
import { NotificationBell } from "../notifications/NotificationBell";
import { useNotificationHandler } from "../notifications/NotificationsProvider";
import { Credits } from "../components/ui/Credits";

/**
 * Portal sencillo para usuarios normales (rol "usuario"):
 * reportar un problema y seguir sus tickets.
 */
export function UserPortal({ user, onLogout, dark, onToggleDark }) {
  const [view, setView] = useState({ name: "home" }); // home | report | ticket | foro
  const data = useMyTickets(user);

  const goHome   = () => setView({ name: "home" });
  const goReport = () => setView({ name: "report" });
  const openTicket = id => setView({ name: "ticket", id });
  const goForo   = () => setView({ name: "foro" });

  // Al pulsar una notificación se abre el ticket correspondiente
  useNotificationHandler(note => { if (note.ticketId) openTicket(note.ticketId); else goHome(); });

  const ticket = view.name === "ticket" ? data.tickets.find(t => t._id === view.id) : null;

  return (
    <div className="relative min-h-screen bg-canvas paw-bg text-ink overflow-x-hidden">
      <MichiWatermark fixed />
      <PortalHeader
        user={user} onLogout={onLogout} dark={dark} onToggleDark={onToggleDark}
        onHome={goHome} onReport={goReport} onForo={goForo} view={view.name}
      />
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {view.name === "home" && (
          <PortalHome user={user} {...data} onReport={goReport} onOpenTicket={openTicket} onForo={goForo} />
        )}
        {view.name === "report" && (
          <ReportWizard
            onCancel={goHome}
            onCreated={() => data.refresh()}
            onOpenTicket={openTicket}
            onHome={goHome}
          />
        )}
        {view.name === "foro" && <ForoBrowser onReport={goReport} />}
        {view.name === "ticket" && (
          ticket
            ? <TicketThread key={ticket._id} ticket={ticket} user={user} onBack={goHome} onChanged={() => data.refresh()} />
            : <p className="text-sm text-muted">Cargando ticket…</p>
        )}
      </main>
    </div>
  );
}

function PortalHeader({ user, onLogout, dark, onToggleDark, onHome, onReport, onForo, view }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = e => { if (!ref.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <header className="bg-navy sticky top-0 z-40">
      <div className="max-w-4xl mx-auto h-14 px-4 sm:px-6 flex items-center gap-3">
        <button onClick={onHome} className="flex items-center gap-2.5">
          <Brand size="sm" />
        </button>

        <nav className="ml-2 sm:ml-4 flex gap-1">
          {[
            { key: "home", label: "Mis tickets", Icon: Home, onClick: onHome, active: view === "home" || view === "ticket" },
            { key: "foro", label: "Foro de soluciones", Icon: BookOpenCheck, onClick: onForo, active: view === "foro" },
          ].map(({ key, label, Icon, onClick, active }) => (
            <button
              key={key} onClick={onClick} title={label}
              className={`h-9 px-2.5 sm:px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                active ? "bg-white/12 text-white" : "text-white/70 hover:text-white hover:bg-white/8"
              }`}
            >
              <Icon size={15} /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {view !== "report" && (
            <button
              onClick={onReport}
              className="h-9 px-3 sm:px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">Reportar problema</span>
            </button>
          )}
          <NotificationBell />
          <button
            onClick={onToggleDark} title={dark ? "Modo claro" : "Modo oscuro"}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/80 hover:bg-navy-2 hover:text-white transition-colors"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="relative" ref={ref}>
            <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-1 rounded-full pl-0.5 pr-1.5 py-0.5 hover:bg-navy-2">
              <Avatar name={user.name} size="md" className="ring-2 ring-white/20" />
              <ChevronDown size={14} className="text-white/70" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 w-60 bg-surface rounded-xl border border-line shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-line flex items-center gap-3">
                  <Avatar name={user.name} size="lg" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                    {user.departamento && <p className="text-[11px] text-faint mt-0.5">{user.departamento}</p>}
                  </div>
                </div>
                <button onClick={onLogout} className="w-full px-4 py-2.5 text-sm text-ink-2 hover:bg-hover flex items-center gap-2">
                  <LogOut size={15} /> Cerrar sesión
                </button>
                <Credits className="px-4 py-2.5 border-t border-line bg-subtle" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
