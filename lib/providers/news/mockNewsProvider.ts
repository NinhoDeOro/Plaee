import type { NewsItem, NewsQuery } from "@/lib/types";
import { dateAt } from "@/lib/utils/date";
import { createStableSlug } from "@/lib/utils/slug";

type MockNewsSeed = Omit<NewsItem, "id" | "slug" | "provider" | "publishedAt"> & {
  publishedOffset: number;
  publishedHour: number;
};

const seeds: MockNewsSeed[] = [
  {
    title: "Serie A, il weekend si accende con tre scontri diretti",
    description: "Calendario fitto e alta classifica ravvicinata: le prossime gare possono cambiare ritmo alla corsa europea.",
    source: "Plaee Mock Desk",
    sourceUrl: "https://plaee.it",
    sport: "football",
    publishedOffset: 0,
    publishedHour: 9
  },
  {
    title: "Champions League, pressing alto e transizioni al centro della serata",
    description: "Le squadre più in forma puntano su aggressività e ampiezza: il dettaglio tattico può fare la differenza.",
    source: "Plaee Mock Desk",
    sourceUrl: "https://plaee.it",
    sport: "football",
    publishedOffset: 0,
    publishedHour: 10
  },
  {
    title: "Sinner e Alcaraz, nuova sfida generazionale nel circuito ATP",
    description: "Due stili diversi e una rivalità sempre più centrale: ritmo, risposta e gestione dei break saranno decisivi.",
    source: "Plaee Mock Desk",
    sourceUrl: "https://plaee.it",
    sport: "tennis",
    publishedOffset: 0,
    publishedHour: 11
  },
  {
    title: "Basket italiano, Milano e Bologna cercano continuità",
    description: "Rotazioni profonde e difese più aggressive stanno orientando la fase calda della stagione.",
    source: "Plaee Mock Desk",
    sourceUrl: "https://plaee.it",
    sport: "basketball",
    publishedOffset: 0,
    publishedHour: 12
  },
  {
    title: "NBA, notte di grandi classiche tra rivalità e giovani stelle",
    description: "Il calendario propone incroci pesanti: attenzione a gestione dei possessi e contributo delle panchine.",
    source: "Plaee Mock Desk",
    sourceUrl: "https://plaee.it",
    sport: "basketball",
    publishedOffset: -1,
    publishedHour: 22
  },
  {
    title: "Eurolega, le italiane cercano punti in trasferta",
    description: "La lotta playoff resta corta: ogni quarto può pesare nel bilancio finale della regular season.",
    source: "Plaee Mock Desk",
    sourceUrl: "https://plaee.it",
    sport: "basketball",
    publishedOffset: -1,
    publishedHour: 18
  },
  {
    title: "Premier League, calendario compresso e rotazioni decisive",
    description: "Le big alternano titolari e giovani: il margine di errore si riduce nelle settimane più dense.",
    source: "Plaee Mock Desk",
    sourceUrl: "https://plaee.it",
    sport: "football",
    publishedOffset: -1,
    publishedHour: 16
  },
  {
    title: "Tennis femminile, servizio e risposta guidano la settimana WTA",
    description: "Le migliori del circuito stanno alzando la percentuale di punti vinti sulla seconda di servizio.",
    source: "Plaee Mock Desk",
    sourceUrl: "https://plaee.it",
    sport: "tennis",
    publishedOffset: -1,
    publishedHour: 14
  },
  {
    title: "Formula 1, sviluppo aerodinamico e gestione gomme sotto osservazione",
    description: "I team lavorano sugli aggiornamenti: simulazioni passo gara e degrado restano il punto chiave.",
    source: "Plaee Mock Desk",
    sourceUrl: "https://plaee.it",
    sport: "formula1",
    publishedOffset: -2,
    publishedHour: 13
  },
  {
    title: "Mercato, priorità agli esterni per le squadre europee",
    description: "Le aree scouting cercano profili rapidi e duttili, capaci di coprire più corsie nel corso della gara.",
    source: "Plaee Mock Desk",
    sourceUrl: "https://plaee.it",
    sport: "football",
    publishedOffset: -2,
    publishedHour: 8
  }
];

export function getMockNewsItems(): NewsItem[] {
  return seeds.map((seed) => {
    const publishedAt = dateAt(seed.publishedOffset, seed.publishedHour, 30);
    const slug = createStableSlug(seed.title, `${seed.title}-${publishedAt}`);

    return {
      id: `mock-news-${slug}`,
      title: seed.title,
      slug,
      description: seed.description,
      source: seed.source,
      sourceUrl: seed.sourceUrl,
      publishedAt,
      sport: seed.sport,
      provider: "mock"
    };
  });
}

export async function getMockNews(query: NewsQuery = {}) {
  return getMockNewsItems()
    .filter((item) => (query.sport ? item.sport === query.sport : true))
    .filter((item) => (query.source ? item.source.toLowerCase().includes(query.source.toLowerCase()) : true))
    .filter((item) => {
      if (!query.q) return true;
      const value = `${item.title} ${item.description ?? ""}`.toLowerCase();
      return value.includes(query.q.toLowerCase());
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export const mockNewsProvider = {
  name: "mock" as const,
  getNews: getMockNews
};
