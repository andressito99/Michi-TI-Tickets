// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MichiWatermark } from "../ui/MichiBuddy";

// Títulos para las vistas que no traen cabecera propia
const VIEW_TITLES = {
  reports: "Reportes",
};

// fullBleed: la vista ocupa todo el área sin padding (workspace de tickets)
export function AppLayout({ children, activeView, onNavigate, search, onSearch, pendingCount, dark, onToggleDark, user, onLogout, navItems, fullBleed = false }) {
  return (
    <div className="flex flex-col h-screen bg-navy font-sans text-ink">
      <Topbar
        search={search} onSearch={onSearch}
        dark={dark} onToggleDark={onToggleDark}
        user={user} onLogout={onLogout} onNavigate={onNavigate}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          activeView={activeView} onNavigate={onNavigate}
          pendingCount={pendingCount} onLogout={onLogout} navItems={navItems}
        />
        <main className="relative flex-1 min-w-0 bg-canvas paw-bg rounded-tl-2xl overflow-hidden flex flex-col">
          {!fullBleed && <MichiWatermark />}
          {fullBleed ? children : (
            <div className="relative flex-1 overflow-y-auto thin-scroll">
              <div className="max-w-7xl mx-auto px-6 py-6">
                {VIEW_TITLES[activeView] && (
                  <h1 className="text-xl font-semibold text-ink tracking-tight mb-5">{VIEW_TITLES[activeView]}</h1>
                )}
                {children}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
