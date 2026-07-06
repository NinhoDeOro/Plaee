import { getNewsGradientByCategory } from "@/lib/utils/newsVisuals";
import { cn } from "@/lib/utils/cn";

type NewsImageFallbackProps = {
  sport?: string;
  title: string;
};

function labelFor(sport?: string) {
  if (!sport) return "PLAEE";
  const labels: Record<string, string> = {
    football: "Calcio",
    calcio: "Calcio",
    basketball: "Basket",
    basket: "Basket",
    tennis: "Tennis",
    formula1: "Motori",
    motori: "Motori"
  };
  return labels[sport.toLowerCase()] ?? sport.slice(0, 12);
}

export function NewsImageFallback({ sport, title }: NewsImageFallbackProps) {
  return (
    <div
      className={cn(
        "relative h-full min-h-28 w-full overflow-hidden bg-gradient-to-br",
        getNewsGradientByCategory(sport)
      )}
    >
      <div className="absolute -left-10 top-6 h-28 w-44 rotate-[-16deg] rounded-full bg-white/14 blur-2xl" aria-hidden />
      <div className="absolute -right-8 bottom-4 h-24 w-40 rotate-12 rounded-full bg-field-950/40 blur-xl" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_82%_78%,rgba(18,211,238,0.18),transparent_28%)]" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-field-950/70 to-transparent" aria-hidden />
      <div className="relative flex h-full min-h-28 flex-col justify-between p-4">
        <span className="w-fit rounded-full border border-white/20 bg-field-950/62 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-glow">
          {labelFor(sport)}
        </span>
        <span className="max-w-[13rem] text-lg font-black leading-tight text-white/95 drop-shadow">
          Plaee News
        </span>
        <span className="sr-only">{title}</span>
      </div>
    </div>
  );
}
