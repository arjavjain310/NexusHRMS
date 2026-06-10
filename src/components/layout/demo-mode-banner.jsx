"use client";

import { Info } from "lucide-react";

export function DemoModeBanner() {
  return (
    <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-950 dark:text-amber-100 lg:px-8">
      <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
      <p>
        You are currently exploring a <span className="font-semibold">sandbox environment</span>.
        All actions affect demo data only and do not impact real company records. Data resets when
        you sign out.
      </p>
    </div>
  );
}
