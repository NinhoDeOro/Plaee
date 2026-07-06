import type { EventStatus } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type StatusBadgeProps = {
  status: EventStatus;
  label: string;
};

const styles: Record<EventStatus, string> = {
  live: "border-red-400/40 bg-red-500/15 text-red-100 shadow-[0_0_24px_rgba(248,113,113,0.18)]",
  scheduled: "border-court-400/30 bg-court-500/10 text-court-400",
  finished: "border-white/10 bg-white/[0.08] text-slate-300",
  postponed: "border-flare-400/30 bg-flare-500/10 text-flare-400",
  cancelled: "border-slate-500/40 bg-slate-500/10 text-slate-300"
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase leading-none", styles[status])}>
      {status === "live" ? <span className="h-1.5 w-1.5 animate-softPulse rounded-full bg-red-400" aria-hidden /> : null}
      {label}
    </span>
  );
}
