import Image from "next/image";

type DecorativePlaeeMarkProps = {
  className?: string;
  priority?: boolean;
};

export function DecorativePlaeeMark({ className = "", priority = false }: DecorativePlaeeMarkProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none select-none ${className}`}>
      <Image
        src="/plaee-logo.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 420px, (min-width: 640px) 320px, 220px"
        className="object-contain"
        priority={priority}
      />
    </div>
  );
}
