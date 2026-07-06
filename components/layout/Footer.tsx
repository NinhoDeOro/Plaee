import { TriangleAlert } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-field-900/30 via-field-950/78 to-black/92">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-center text-sm leading-7 text-slate-300 sm:px-6 lg:px-8">
        <p>
          <strong className="font-black text-slate-200">Plaee.it</strong> è un portale telematico di informazione,
          comparazione e recensione di bonus e offerte dei principali concessionari di gioco legali italiani in
          possesso di regolare licenza ADM (ex AAMS). Il servizio è totalmente gratuito e non costituisce in alcun
          modo incentivo al gioco d’azzardo ai sensi del D.L. 87/2018 (Decreto Dignità).
        </p>

        <p className="mx-auto inline-flex items-center justify-center gap-2 text-base font-black uppercase text-flare-400">
          <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden />
          IL GIOCO È VIETATO AI MINORI DI ANNI 18 E PUÒ CAUSARE DIPENDENZA PATOLOGICA.
        </p>

        <p>
          Gioca responsabilmente. Verifica le percentuali di vincita sui siti ufficiali dei concessionari o sul sito
          dell’Agenzia delle Dogane e dei Monopoli (ADM).
        </p>
      </div>
    </footer>
  );
}
