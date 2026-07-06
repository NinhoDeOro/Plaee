import Image from "next/image";

type AppLogoProps = {
  compact?: boolean;
};

export function AppLogo({ compact = false }: AppLogoProps) {
  return (
    <span className="inline-flex items-center">
      <Image
        src="/plaee-logo.png"
        alt="Plaee"
        width={compact ? 132 : 170}
        height={compact ? 58 : 74}
        priority
        className={compact ? "h-12 w-auto object-contain drop-shadow-[0_0_14px_rgba(34,211,238,0.24)] sm:h-14 lg:h-16" : "h-14 w-auto object-contain"}
      />
    </span>
  );
}
