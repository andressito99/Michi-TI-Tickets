// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { RefreshCw } from "lucide-react";
import { Michi } from "./Michi";

export function ErrorBanner({ message, onRetry }) {
  return (
    <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 flex items-center gap-4">
      <Michi pose="sad" size={64} title="" className="flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">¡Gatástrofe! Algo salió mal</p>
        <p className="text-sm text-danger mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors"
        >
          <RefreshCw size={12} /> Reintentar
        </button>
      )}
    </div>
  );
}
