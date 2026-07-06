import type { Sport } from "@/lib/types";

export type TeamAliasEntry = {
  name: string;
  aliases: string[];
  country?: string;
  sport: Sport;
  priority?: number;
};

export const TEAM_ALIAS_ENTRIES: TeamAliasEntry[] = [
  {
    name: "Inter",
    aliases: ["Internazionale", "Inter Milan", "FC Internazionale", "Internazionale Milano"],
    country: "Italia",
    sport: "football",
    priority: 98
  },
  { name: "Juventus", aliases: ["Juve", "Juventus FC"], country: "Italia", sport: "football", priority: 97 },
  { name: "AC Milan", aliases: ["Milan", "Milano", "A.C. Milan"], country: "Italia", sport: "football", priority: 96 },
  { name: "Napoli", aliases: ["SSC Napoli", "Naples"], country: "Italia", sport: "football", priority: 92 },
  { name: "Roma", aliases: ["AS Roma", "Rome"], country: "Italia", sport: "football", priority: 88 },
  { name: "Lazio", aliases: ["SS Lazio"], country: "Italia", sport: "football", priority: 84 },
  { name: "Fiorentina", aliases: ["Florence", "ACF Fiorentina"], country: "Italia", sport: "football", priority: 82 },
  { name: "Torino", aliases: ["Turin", "Torino FC"], country: "Italia", sport: "football", priority: 78 },
  { name: "Atalanta", aliases: ["Bergamo", "Atalanta BC"], country: "Italia", sport: "football", priority: 86 },
  { name: "Genoa", aliases: ["Genova", "Genoa CFC"], country: "Italia", sport: "football", priority: 74 },
  {
    name: "Bayern Munich",
    aliases: ["Bayern", "Bayern Monaco", "Bayern Múnich", "FC Bayern", "Baviera"],
    country: "Germania",
    sport: "football",
    priority: 96
  },
  {
    name: "Manchester United",
    aliases: ["Man United", "Man Utd", "United", "Manchester Utd"],
    country: "Inghilterra",
    sport: "football",
    priority: 96
  },
  {
    name: "Manchester City",
    aliases: ["Man City", "City", "Manchester C."],
    country: "Inghilterra",
    sport: "football",
    priority: 96
  },
  {
    name: "Paris Saint-Germain",
    aliases: ["PSG", "Paris", "Parigi", "Paris SG", "Paris Saint Germain"],
    country: "Francia",
    sport: "football",
    priority: 95
  },
  {
    name: "Real Madrid",
    aliases: ["Real", "Madrid", "Los Blancos"],
    country: "Spagna",
    sport: "football",
    priority: 97
  },
  {
    name: "Atletico Madrid",
    aliases: ["Atletico", "Atletico de Madrid", "Atleti"],
    country: "Spagna",
    sport: "football",
    priority: 92
  },
  {
    name: "Barcelona",
    aliases: ["Barcellona", "FC Barcelona", "Barça", "Barca", "Barsa"],
    country: "Spagna",
    sport: "football",
    priority: 96
  },
  { name: "Arsenal", aliases: ["Arsenal FC"], country: "Inghilterra", sport: "football", priority: 90 },
  { name: "Chelsea", aliases: ["Chelsea FC"], country: "Inghilterra", sport: "football", priority: 88 },
  { name: "Liverpool", aliases: ["Liverpool FC"], country: "Inghilterra", sport: "football", priority: 92 },
  { name: "Tottenham", aliases: ["Spurs", "Tottenham Hotspur"], country: "Inghilterra", sport: "football", priority: 86 }
];

export const TEAM_ALIASES: Record<string, string[]> = Object.fromEntries(
  TEAM_ALIAS_ENTRIES.map((entry) => [entry.name.toLowerCase(), entry.aliases])
);
