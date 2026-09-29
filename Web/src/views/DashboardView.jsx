// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import {  } from "lucide-react";
import { KpiCard } from "../components/dashboard/KpiCard";
import { StatusBadge } from "../components/tickets/StatusBadge";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { Michi } from "../components/ui/Michi";
import { MichiBuddy } from "../components/ui/MichiBuddy";
import { greeting, moodFor } from "../utils/michiVoice";

const STATUS_INFO = [
  { key: "open",     label: "En proceso", color: "bg-[#2563eb]" },
  { key: "pending",  label: "Pendientes", color: "bg-warning" },
  { key: "resolved", label: "Finalizados", color: "bg-success" },
  { key: "closed",   label: "Bloqueados",  color: "bg-danger" },
];

export function DashboardView({ stats, tickets, onNavigate, onOpenTicket, user, loading, error, onRetry }) {
  const mood = moodFor(stats);
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <MichiBuddy pose={mood.pose} size={72} className="-my-3" />
          <div>
          <p className="text-base font-semibold text-ink">
            {greeting()}, {user?.name ?? "Admin"}
          </p>
          <p className="text-xs text-faint mt-0.5">
            {mood.text} · {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        </div>
        <button
          onClick={() => onNavigate("tickets")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover transition-colors"
        >
          Ver tickets
        </button>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={onRetry} /></div>}

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <KpiCard type="pending"  value={stats.pending} />
            <KpiCard type="resolved" value={stats.resolved} />
            <KpiCard type="urgent"   value={stats.urgent} />
            <KpiCard type="avgTime"  value="—" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-xl border border-line overflow-hidden">
              <div className="px-4 py-3 border-b border-line flex items-center">
                <span className="text-sm font-semibold text-ink flex-1">Tickets recientes</span>
                <button onClick={() => onNavigate("tickets")} className="text-xs text-brand hover:underline">Ver todos →</button>
              </div>
              {tickets.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-faint">
                  <Michi pose="sleep" size={84} className="mx-auto mb-2" />
                  Sin tickets registrados
                </div>
              ) : (
                tickets.slice(0, 4).map(t => (
                  <div
                    key={t._id} onClick={() => onOpenTicket(t.id)}
                    className="px-4 py-2.5 flex items-center gap-3 border-b border-line last:border-none hover:bg-hover cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">{t.title}</p>
                      <p className="text-[11px] text-muted">{t.id} · {t.requester}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))
              )}
            </div>

            <div className="bg-surface rounded-xl border border-line overflow-hidden">
              <div className="px-4 py-3 border-b border-line">
                <span className="text-sm font-semibold text-ink">Distribución por estado</span>
              </div>
              <div className="px-4 py-4 flex flex-col gap-3">
                {STATUS_INFO.map(({ key, label, color }) => {
                  const row = stats.byStatus.find(s => s.key === key);
                  const pct = row && row.total > 0 ? Math.round((row.count / row.total) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-ink-2 font-medium">{label}</span>
                        <span className="text-xs font-semibold text-ink">
                          {row?.count ?? 0} <span className="text-faint font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-line rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
