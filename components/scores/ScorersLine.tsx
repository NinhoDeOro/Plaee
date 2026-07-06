import type { Scorer } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type ScorersLineProps = {
  scorers?: Scorer[];
  className?: string;
};

function minuteLabel(value: Scorer["minute"]) {
  if (value === "" || value === undefined || value === null) return "";
  const raw = String(value);
  return raw.endsWith("'") ? raw : `${raw}'`;
}

function scorerLabel(scorer: Scorer) {
  return [
    scorer.playerName,
    minuteLabel(scorer.minute),
    scorer.isPenalty ? "(rig.)" : undefined,
    scorer.isOwnGoal ? "(aut.)" : undefined
  ]
    .filter(Boolean)
    .join(" ");
}

export function ScorersLine({ scorers, className }: ScorersLineProps) {
  if (!scorers?.length) return null;

  const visible = scorers.slice(0, 3);
  const extra = scorers.length - visible.length;

  return (
    <p className={cn("mt-1.5 line-clamp-1 text-xs font-bold leading-5 text-slate-300/90", className)}>
      {visible.map(scorerLabel).join(", ")}
      {extra > 0 ? `, +${extra} altri` : ""}
    </p>
  );
}
