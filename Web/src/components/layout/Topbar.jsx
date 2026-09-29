// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { useState, useRef, useEffect } from "react";
import { Search, X, Sun, Moon, HelpCircle, LogOut, ChevronDown } from "lucide-react";
import { NotificationBell } from "../../notifications/NotificationBell";
import { Avatar } from "../ui/Avatar";
import { Brand } from "../ui/Brand";
import { Credits } from "../ui/Credits";

export function Topbar({ search, onSearch, dark, onToggleDark, user, onLogout, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Cierra el menú de usuario al hacer clic fuera
  useEffect(() => {
    if (!menuOpen) return;
    const close = e => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const iconBtn = "w-9 h-9 rounded-lg flex items-center justify-center text-white/80 hover:bg-navy-2 hover:text-white transition-colors";

  return (
    <header className="h-14 bg-navy flex items-center px-3 gap-4 flex-shrink-0">
      {/* Marca */}
      <button onClick={() => onNavigate("dashboard")} className="flex items-center gap-2.5 w-52 flex-shrink-0 pl-1">
        <Brand size="sm" />
      </button>

      {/* Búsqueda global */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-2 w-full max-w-md h-9 px-3 rounded-lg bg-white/10 border border-white/10 focus-within:bg-white/15 focus-within:border-white/30 transition-colors">
          <Search size={15} className="text-white/60 flex-shrink-0" />
          <input
            type="text" placeholder="Buscar tickets, usuarios, categorías…"
            value={search} onChange={e => onSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
          />
          {search && (
            <button onClick={() => onSearch("")} className="text-white/60 hover:text-white" title="Limpiar">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onNavigate("tickets")}
          className="h-9 px-4 mr-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors"
        >
          Ver tickets
        </button>
        <button onClick={onToggleDark} className={iconBtn} title={dark ? "Modo claro" : "Modo oscuro"}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <NotificationBell />
        <button className={iconBtn} title="Ayuda">
          <HelpCircle size={18} />
        </button>

        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-1 rounded-full pl-0.5 pr-1.5 py-0.5 hover:bg-navy-2 transition-colors"
          >
            <Avatar name={user?.name} size="md" className="ring-2 ring-white/20" />
            <ChevronDown size={14} className="text-white/70" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 w-60 bg-surface rounded-xl border border-line shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-line flex items-center gap-3">
                <Avatar name={user?.name} size="lg" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                  <p className="text-[11px] text-faint capitalize mt-0.5">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full px-4 py-2.5 text-sm text-ink-2 hover:bg-hover flex items-center gap-2 transition-colors"
              >
                <LogOut size={15} /> Cerrar sesión
              </button>
              <Credits className="px-4 py-2.5 border-t border-line bg-subtle" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
