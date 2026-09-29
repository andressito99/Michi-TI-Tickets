// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { useState } from "react";
import { Michi } from "./Michi";
import { LOADING_LINES, pick } from "../../utils/michiVoice";

export function LoadingSpinner({ text }) {
  const [line] = useState(() => text ?? pick(LOADING_LINES));
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-1" role="status" aria-live="polite">
      <Michi pose="laptop" size={110} title="" />
      <p className="text-sm text-muted font-medium flex items-center gap-1">
        {line}
      </p>
    </div>
  );
}
