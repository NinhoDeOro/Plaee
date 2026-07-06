import { Flame } from "lucide-react";
import type { SportEvent } from "@/lib/types";
import { getMatchImportanceScore } from "@/lib/utils/matchPriority";

type PriorityBadgeProps = {
  event: SportEvent;
};

export function PriorityBadge({ event }: PriorityBadgeProps) {
  const score = getMatchImportanceScore(event);
  if (score < 70 && !event.isLive) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-flare-400/25 bg-flare-400/10 px-2 py-0.5 text-[11px] font-black uppercase text-flare-300">
      <Flame className="h-3 w-3" aria-hidden />
      Top
    </span>
  );
}
