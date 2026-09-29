// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { Clock, CheckCircle2, AlertCircle, Gauge, TrendingUp, TrendingDown } from "lucide-react";

const KPI_CONFIG = {
  pending:  { label: "Tickets pendientes",      icon: Clock,        bg: "bg-amber-500/20", iconColor: "text-amber-500",  trend: "+2 desde ayer",       trendUp: false },
  resolved: { label: "Resueltos",               icon: CheckCircle2, bg: "bg-success/15", iconColor: "text-success",  trend: "+18% vs. ayer",       trendUp: true  },
  urgent:   { label: "Urgentes abiertos",       icon: AlertCircle,  bg: "bg-red-500/20",   iconColor: "text-red-400",    trend: "−1 desde ayer",       trendUp: true  },
  avgTime:  { label: "Tiempo prom. resolución", icon: Gauge,        bg: "bg-success/15", iconColor: "text-success",  trend: "−30min vs. sem. ant.", trendUp: true  },
};

export function KpiCard({ type, value }) {
  const cfg = KPI_CONFIG[type];
  const Icon = cfg.icon;
  const TrendIcon = cfg.trendUp ? TrendingDown : TrendingUp;
  const trendColor = cfg.trendUp ? "text-success" : "text-red-400";
  return (
    <div className="bg-surface rounded-xl border border-line p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted">{cfg.label}</span>
        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
          <Icon size={15} className={cfg.iconColor} />
        </div>
      </div>
      <p className="text-2xl font-medium text-ink tracking-tight">{value}</p>
      <p className={`text-xs mt-1 flex items-center gap-1 ${trendColor}`}>
        <TrendIcon size={11} /> {cfg.trend}
      </p>
    </div>
  );
}
