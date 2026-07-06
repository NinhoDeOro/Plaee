import { ExternalLink } from "lucide-react";

type ExternalSourceLabelProps = {
  source: string;
};

export function ExternalSourceLabel({ source }: ExternalSourceLabelProps) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
      {source}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}
