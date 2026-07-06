import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <EmptyState title="Pagina non trovata" description="Il contenuto richiesto non è disponibile." />
      <div className="mt-6 text-center">
        <Link href="/" className="rounded-full bg-pulse-400 px-5 py-3 text-sm font-black text-field-950">
          Torna alla home
        </Link>
      </div>
    </main>
  );
}
