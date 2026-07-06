import Image from "next/image";

type TeamMarkProps = {
  name: string;
  logo?: string;
};

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "P") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
}

export function TeamMark({ name, logo }: TeamMarkProps) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt={`${name} logo`}
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-full object-contain"
      />
    );
  }

  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-field-800 text-[10px] font-black uppercase text-pulse-400">
      {initials(name)}
    </span>
  );
}
