import type { ReactNode } from "react";
import { MatchCountBadge } from "@/components/scores/MatchCountBadge";

type MatchSectionHeaderProps = {
  title: string;
  count?: number;
  description?: string;
  action?: ReactNode;
};

export function MatchSectionHeader({ title, count, description, action }: MatchSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-white">{title}</h2>
          {typeof count === "number" ? <MatchCountBadge count={count} /> : null}
        </div>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
