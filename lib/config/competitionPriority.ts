export type CompetitionPriorityRule = {
  match: string[];
  score: number;
};

export const COMPETITION_PRIORITY: CompetitionPriorityRule[] = [
  { match: ["World Cup", "FIFA World Cup", "Mondiali"], score: 100 },
  { match: ["UEFA European Championship", "Euro"], score: 95 },
  { match: ["Copa America"], score: 95 },
  { match: ["Champions League", "UEFA Champions League"], score: 92 },
  { match: ["Europa League"], score: 88 },
  { match: ["Conference League"], score: 84 },
  { match: ["Serie A"], score: 82 },
  { match: ["Premier League"], score: 82 },
  { match: ["La Liga", "LaLiga"], score: 80 },
  { match: ["Bundesliga"], score: 78 },
  { match: ["Ligue 1"], score: 76 },
  { match: ["Coppa Italia", "FA Cup", "Copa del Rey", "DFB Pokal"], score: 70 },
  { match: ["Serie B", "Championship"], score: 55 },
  { match: ["Grand Slam", "Australian Open", "Roland Garros", "French Open", "Wimbledon", "US Open"], score: 94 },
  { match: ["ATP Finals", "WTA Finals"], score: 88 },
  { match: ["ATP 1000", "WTA 1000", "Masters 1000"], score: 84 },
  { match: ["ATP 500", "WTA 500"], score: 78 },
  { match: ["ATP 250", "WTA 250"], score: 72 },
  { match: ["ATP", "WTA"], score: 66 },
  { match: ["Challenger"], score: 44 },
  { match: ["ITF"], score: 30 },
  { match: ["Women", "Femminile", "Women's"], score: 50 }
];

export const FEATURED_MIN_SCORE = 75;
export const TOP_COMPETITION_MIN_SCORE = 70;
