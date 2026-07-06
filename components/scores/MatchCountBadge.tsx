type MatchCountBadgeProps = {
  count: number;
};

export function MatchCountBadge({ count }: MatchCountBadgeProps) {
  return (
    <span className="inline-flex min-w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-xs font-black text-slate-300">
      {count}
    </span>
  );
}
