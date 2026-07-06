export type Sport = "football" | "tennis" | "basketball" | "formula1" | "other";
export type MatchGender = "men" | "women" | "mixed" | "junior";

export type EventStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export type SportsProviderName =
  | "auto"
  | "mock"
  | "api-sports"
  | "api-football"
  | "api-tennis"
  | "api-basketball"
  | "api-formula1"
  | "thesportsdb";

export type NewsProviderName = "mock" | "newsapi" | "rss";

export type SportEvent = {
  id: string;
  sport: Sport;
  competition: string;
  competitionId?: string | number;
  country?: string;
  countryCode?: string;
  countryFlag?: string;
  leagueLogo?: string;
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: number | string;
  awayScore?: number | string;
  status: EventStatus;
  statusLabel: string;
  minute?: string | number;
  startTime: string;
  isLive: boolean;
  venue?: string;
  category?: string;
  gender?: MatchGender;
  discipline?: "singles" | "doubles" | "mixed-doubles" | "junior" | "unknown";
  tourLevel?:
    | "grand-slam"
    | "atp-finals"
    | "wta-finals"
    | "atp-1000"
    | "wta-1000"
    | "atp-500"
    | "wta-500"
    | "atp-250"
    | "wta-250"
    | "challenger"
    | "itf"
    | "junior"
    | "other";
  eventTypeType?: string;
  eventTypeKey?: string | number;
  firstPlayerKey?: string | number;
  secondPlayerKey?: string | number;
  firstPlayerImage?: string;
  secondPlayerImage?: string;
  firstPlayerImageSource?: "fixture" | "players-lookup" | "fallback";
  secondPlayerImageSource?: "fixture" | "players-lookup" | "fallback";
  firstPlayerCountry?: string;
  secondPlayerCountry?: string;
  firstPlayerRanking?: string | number;
  secondPlayerRanking?: string | number;
  tennisScore?: TennisScore;
  raceName?: string;
  circuit?: string;
  sessionType?: string;
  winner?: string;
  importanceScore?: number;
  scorers?: {
    home: Scorer[];
    away: Scorer[];
  };
  provider: SportsProviderName;
};

export type MatchTimelineItem = {
  minute?: string | number;
  type: string;
  team?: string;
  player?: string;
  description: string;
};

export type MatchStat = {
  label: string;
  homeValue: string | number;
  awayValue: string | number;
};

export type TennisSetScore = {
  home: number | string | null;
  away: number | string | null;
  homeTiebreak?: number | string | null;
  awayTiebreak?: number | string | null;
};

export type TennisScore = {
  sets: TennisSetScore[];
  totalSetsHome: number | string | null;
  totalSetsAway: number | string | null;
  currentGameHome?: string | number | null;
  currentGameAway?: string | number | null;
  currentPointHome?: string | number | null;
  currentPointAway?: string | number | null;
  currentSet?: string | number | null;
  servingPlayer?: "home" | "away" | null;
  statusLabel: string;
  rawResult?: string;
};

export type PreMatchInsight = {
  label: string;
  value: string;
  detail?: string;
};

export type Scorer = {
  playerName: string;
  minute: number | string;
  teamName: string;
  detail?: string;
  isOwnGoal?: boolean;
  isPenalty?: boolean;
};

export type NewsItem = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  imageSource?: "rss-image" | "enclosure" | "media-content" | "media-thumbnail" | "content-img" | "og-image" | "fallback";
  publishedAt: string;
  sport?: string;
  provider: NewsProviderName;
};

export type MatchDetail = SportEvent & {
  timeline?: MatchTimelineItem[];
  stats?: MatchStat[];
  preMatchInsights?: PreMatchInsight[];
  relatedNews?: NewsItem[];
};

export type ScoreQuery = {
  sport?: Sport | "all" | "trending" | "motors";
  date?: string;
  status?: EventStatus | "all";
  competition?: string;
  country?: string;
  team?: string;
  q?: string;
  noCache?: boolean;
};

export type NewsQuery = {
  sport?: string;
  q?: string;
  source?: string;
};

export type SportsProvider = {
  name: SportsProviderName;
  getEvents: (query?: ScoreQuery) => Promise<SportEvent[]>;
  getMatchDetail: (id: string) => Promise<MatchDetail | null>;
};

export type NewsProvider = {
  name: NewsProviderName;
  getNews: (query?: NewsQuery) => Promise<NewsItem[]>;
};
