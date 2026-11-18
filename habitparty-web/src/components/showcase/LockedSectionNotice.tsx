"use client";

import { Lock } from "lucide-react";

interface LockedSectionNoticeProps {
  title: string;
  description: string;
}

export function LockedSectionNotice({
  title,
  description,
}: LockedSectionNoticeProps) {
  return (
    <section className="rounded-2xl border border-dashed border-neutral-700 dark:border-primary/25 bg-card/70 dark:bg-surface/40 p-5 flex items-center gap-3">
      <Lock
        size={18}
        className="text-neutral-400 shrink-0"
        aria-hidden="true"
      />
      <div>
        <h2 className="text-sm font-bold text-neutral-100">{title}</h2>
        <p className="text-xs text-neutral-400 mt-0.5">{description}</p>
      </div>
    </section>
  );
}
