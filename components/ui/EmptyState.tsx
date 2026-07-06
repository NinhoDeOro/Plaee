import { CircleOff } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center">
      <CircleOff className="mx-auto mb-3 h-8 w-8 text-slate-500" aria-hidden />
      <p className="font-semibold text-white">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
    </div>
  );
}
