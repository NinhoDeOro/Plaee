export function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-label="Caricamento">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="relative h-24 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
          <div className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
