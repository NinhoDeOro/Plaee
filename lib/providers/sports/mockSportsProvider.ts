import type { MatchDetail, MatchStat, MatchTimelineItem, ScoreQuery, SportEvent } from "@/lib/types";
import { dateAt, normalizeDateParam, toDateKey } from "@/lib/utils/date";
import { getStatusLabel } from "@/lib/utils/status";

const countryMeta: Record<string, { code: string; flag: string }> = {
  Italia: { code: "IT", flag: "🇮🇹" },
  Inghilterra: { code: "GB", flag: "🇬🇧" },
  Spagna: { code: "ES", flag: "🇪🇸" },
  Germania: { code: "DE", flag: "🇩🇪" },
  Francia: { code: "FR", flag: "🇫🇷" },
  Monaco: { code: "MC", flag: "🇲🇨" },
  Portogallo: { code: "PT", flag: "🇵🇹" },
  USA: { code: "US", flag: "🇺🇸" },
  Egypt: { code: "EG", flag: "🇪🇬" },
  Australia: { code: "AU", flag: "🇦🇺" },
  Svizzera: { code: "CH", flag: "🇨🇭" },
  Brasile: { code: "BR", flag: "🇧🇷" },
  Argentina: { code: "AR", flag: "🇦🇷" },
  Ecuador: { code: "EC", flag: "🇪🇨" },
  Europa: { code: "EU", flag: "🌍" },
  Mondo: { code: "WORLD", flag: "🌍" },
  Internazionale: { code: "INT", flag: "🌍" }
};

function withStatus(event: Omit<SportEvent, "statusLabel" | "isLive" | "provider">): SportEvent {
  const meta = event.country ? countryMeta[event.country] : undefined;

  return {
    ...event,
    countryCode: event.countryCode ?? meta?.code,
    countryFlag: event.countryFlag ?? meta?.flag,
    isLive: event.status === "live",
    statusLabel: getStatusLabel(event.status, event.minute),
    provider: "mock"
  };
}

export function getMockSportsEvents(): SportEvent[] {
  return [
    withStatus({
      id: "mock-football-world-cup-portugal-croatia",
      sport: "football",
      competition: "FIFA World Cup",
      competitionId: "mock-fifa-world-cup",
      country: "Mondo",
      homeName: "Portogallo",
      awayName: "Croazia",
      status: "scheduled",
      startTime: dateAt(0, 1, 0),
      venue: "MetLife Stadium",
      category: "Round of 16",
      gender: "men"
    }),
    withStatus({
      id: "mock-football-world-cup-spain-austria",
      sport: "football",
      competition: "FIFA World Cup",
      competitionId: "mock-fifa-world-cup",
      country: "Mondo",
      homeName: "Spagna",
      awayName: "Austria",
      homeScore: 2,
      awayScore: 1,
      status: "live",
      minute: 72,
      startTime: dateAt(0, 21, 0),
      venue: "Rose Bowl",
      category: "Knockout - Round of 16",
      gender: "men",
      scorers: {
        home: [
          { playerName: "Morata", minute: 21, teamName: "Spagna" },
          { playerName: "Pedri", minute: 68, teamName: "Spagna" }
        ],
        away: [{ playerName: "Arnautovic", minute: 44, teamName: "Austria" }]
      }
    }),
    withStatus({
      id: "mock-football-world-cup-egypt-australia",
      sport: "football",
      competition: "FIFA World Cup",
      competitionId: "mock-fifa-world-cup",
      country: "Mondo",
      homeName: "Egypt",
      awayName: "Australia",
      homeScore: 1,
      awayScore: 1,
      status: "finished",
      startTime: dateAt(0, 17, 0),
      venue: "Levi's Stadium",
      category: "Group Stage",
      gender: "men",
      scorers: {
        home: [{ playerName: "Salah", minute: 37, teamName: "Egypt" }],
        away: [{ playerName: "Duke", minute: 74, teamName: "Australia" }]
      }
    }),
    withStatus({
      id: "mock-football-world-cup-usa-bosnia",
      sport: "football",
      competition: "FIFA World Cup",
      competitionId: "mock-fifa-world-cup",
      country: "Mondo",
      homeName: "USA",
      awayName: "Bosnia ed Erzegovina",
      homeScore: 2,
      awayScore: 0,
      status: "finished",
      startTime: dateAt(0, 2, 0),
      venue: "Mercedes-Benz Stadium",
      category: "Round of 16",
      gender: "men",
      scorers: {
        home: [
          { playerName: "Pulisic", minute: 28, teamName: "USA" },
          { playerName: "Reyna", minute: 81, teamName: "USA" }
        ],
        away: []
      }
    }),
    withStatus({
      id: "mock-football-juventus-inter",
      sport: "football",
      competition: "Serie A",
      competitionId: "mock-serie-a",
      country: "Italia",
      homeName: "Juventus",
      awayName: "Inter",
      homeScore: 1,
      awayScore: 1,
      status: "live",
      minute: 63,
      startTime: dateAt(0, 20, 45),
      venue: "Allianz Stadium",
      scorers: {
        home: [{ playerName: "Vlahovic", minute: 59, teamName: "Juventus" }],
        away: [{ playerName: "Lautaro", minute: 18, teamName: "Inter" }]
      }
    }),
    withStatus({
      id: "mock-football-milan-napoli",
      sport: "football",
      competition: "Serie A",
      competitionId: "mock-serie-a",
      country: "Italia",
      homeName: "Milan",
      awayName: "Napoli",
      status: "scheduled",
      startTime: dateAt(0, 21, 15),
      venue: "San Siro"
    }),
    withStatus({
      id: "mock-football-roma-lazio",
      sport: "football",
      competition: "Serie A",
      competitionId: "mock-serie-a",
      country: "Italia",
      homeName: "Roma",
      awayName: "Lazio",
      homeScore: 2,
      awayScore: 0,
      status: "finished",
      startTime: dateAt(0, 18, 0),
      venue: "Stadio Olimpico",
      scorers: {
        home: [
          { playerName: "Dybala", minute: 12, teamName: "Roma" },
          { playerName: "Pellegrini", minute: 67, teamName: "Roma" }
        ],
        away: []
      }
    }),
    withStatus({
      id: "mock-football-atalanta-bologna",
      sport: "football",
      competition: "Serie A",
      competitionId: "mock-serie-a",
      country: "Italia",
      homeName: "Atalanta",
      awayName: "Bologna",
      status: "scheduled",
      startTime: dateAt(1, 18, 30),
      venue: "Gewiss Stadium"
    }),
    withStatus({
      id: "mock-football-fiorentina-torino",
      sport: "football",
      competition: "Serie A",
      competitionId: "mock-serie-a",
      country: "Italia",
      homeName: "Fiorentina",
      awayName: "Torino",
      homeScore: 1,
      awayScore: 0,
      status: "finished",
      startTime: dateAt(-1, 20, 45),
      venue: "Artemio Franchi"
    }),
    withStatus({
      id: "mock-football-real-city",
      sport: "football",
      competition: "Champions League",
      competitionId: "mock-champions-league",
      country: "Europa",
      homeName: "Real Madrid",
      awayName: "Manchester City",
      homeScore: 2,
      awayScore: 2,
      status: "live",
      minute: 78,
      startTime: dateAt(0, 21, 0),
      venue: "Santiago Bernabeu",
      scorers: {
        home: [
          { playerName: "Vinicius", minute: 11, teamName: "Real Madrid" },
          { playerName: "Bellingham", minute: 70, teamName: "Real Madrid" }
        ],
        away: [
          { playerName: "Foden", minute: 34, teamName: "Manchester City" },
          { playerName: "Haaland", minute: 52, teamName: "Manchester City" }
        ]
      }
    }),
    withStatus({
      id: "mock-football-bayern-psg",
      sport: "football",
      competition: "Champions League",
      competitionId: "mock-champions-league",
      country: "Europa",
      homeName: "Bayern Monaco",
      awayName: "PSG",
      status: "scheduled",
      startTime: dateAt(1, 21, 0),
      venue: "Allianz Arena"
    }),
    withStatus({
      id: "mock-football-arsenal-liverpool",
      sport: "football",
      competition: "Premier League",
      competitionId: "mock-premier-league",
      country: "Inghilterra",
      homeName: "Arsenal",
      awayName: "Liverpool",
      homeScore: 3,
      awayScore: 2,
      status: "finished",
      startTime: dateAt(-1, 17, 30),
      venue: "Emirates Stadium"
    }),
    withStatus({
      id: "mock-football-barcelona-atletico",
      sport: "football",
      competition: "LaLiga",
      competitionId: "mock-laliga",
      country: "Spagna",
      homeName: "Barcellona",
      awayName: "Atletico Madrid",
      status: "scheduled",
      startTime: dateAt(0, 22, 0),
      venue: "Estadi Olimpic"
    }),
    withStatus({
      id: "mock-football-bayern-dortmund",
      sport: "football",
      competition: "Bundesliga",
      competitionId: "mock-bundesliga",
      country: "Germania",
      homeName: "Bayern Monaco",
      awayName: "Borussia Dortmund",
      homeScore: 2,
      awayScore: 1,
      status: "live",
      minute: 67,
      startTime: dateAt(0, 18, 30),
      venue: "Allianz Arena",
      scorers: {
        home: [
          { playerName: "Kane", minute: 19, teamName: "Bayern Monaco" },
          { playerName: "Musiala", minute: 61, teamName: "Bayern Monaco" }
        ],
        away: [{ playerName: "Brandt", minute: 42, teamName: "Borussia Dortmund" }]
      }
    }),
    withStatus({
      id: "mock-football-psg-lyon",
      sport: "football",
      competition: "Ligue 1",
      competitionId: "mock-ligue-1",
      country: "Francia",
      homeName: "Paris Saint-Germain",
      awayName: "Lyon",
      status: "scheduled",
      startTime: dateAt(0, 20, 45),
      venue: "Parc des Princes"
    }),
    withStatus({
      id: "mock-football-benfica-porto",
      sport: "football",
      competition: "Primeira Liga",
      competitionId: "mock-primeira-liga",
      country: "Portogallo",
      homeName: "Benfica",
      awayName: "Porto",
      homeScore: 1,
      awayScore: 1,
      status: "finished",
      startTime: dateAt(-1, 21, 15),
      venue: "Estadio da Luz"
    }),
    withStatus({
      id: "mock-football-women-barcelona-lyon",
      sport: "football",
      competition: "UEFA Women's Champions League",
      competitionId: "mock-women-champions-league",
      country: "Europa",
      homeName: "Barcelona Femminile",
      awayName: "Lyon Femminile",
      status: "scheduled",
      startTime: dateAt(0, 19, 0),
      venue: "Johan Cruyff Stadium",
      category: "Semifinale",
      gender: "women"
    }),
    withStatus({
      id: "mock-football-women-italy-germany",
      sport: "football",
      competition: "UEFA European Championship Women",
      competitionId: "mock-euro-women",
      country: "Europa",
      homeName: "Italia Femminile",
      awayName: "Germania Femminile",
      homeScore: 1,
      awayScore: 1,
      status: "live",
      minute: 55,
      startTime: dateAt(0, 18, 0),
      venue: "St. Jakob-Park",
      category: "Group Stage",
      gender: "women"
    }),
    withStatus({
      id: "mock-tennis-sinner-alcaraz",
      sport: "tennis",
      competition: "Wimbledon - ATP Singles",
      competitionId: "mock-wimbledon-atp-singles",
      country: "Internazionale",
      homeName: "Jannik Sinner",
      awayName: "Carlos Alcaraz",
      homeScore: "6 4",
      awayScore: "4 3",
      status: "live",
      minute: "2 set",
      startTime: dateAt(0, 16, 0),
      venue: "Campo Centrale",
      category: "Singolare maschile",
      gender: "men"
    }),
    withStatus({
      id: "mock-tennis-paolini-swiatek",
      sport: "tennis",
      competition: "Wimbledon - WTA Singles",
      competitionId: "mock-wimbledon-wta-singles",
      country: "Internazionale",
      homeName: "Jasmine Paolini",
      awayName: "Iga Swiatek",
      status: "scheduled",
      startTime: dateAt(0, 19, 20),
      venue: "Arena 1",
      category: "Singolare femminile",
      gender: "women"
    }),
    withStatus({
      id: "mock-tennis-djokovic-medvedev",
      sport: "tennis",
      competition: "Wimbledon - ATP Singles",
      competitionId: "mock-wimbledon-atp-singles",
      country: "Internazionale",
      homeName: "Novak Djokovic",
      awayName: "Daniil Medvedev",
      homeScore: "7 6",
      awayScore: "6 4",
      status: "finished",
      startTime: dateAt(-1, 15, 30),
      venue: "Centre Court",
      category: "Singolare maschile",
      gender: "men"
    }),
    withStatus({
      id: "mock-tennis-sabalenka-gauff",
      sport: "tennis",
      competition: "WTA Finals",
      competitionId: "mock-wta-finals",
      country: "Internazionale",
      homeName: "Aryna Sabalenka",
      awayName: "Coco Gauff",
      status: "scheduled",
      startTime: dateAt(1, 17, 0),
      venue: "Indoor Arena",
      category: "Singolare femminile",
      gender: "women"
    }),
    withStatus({
      id: "mock-tennis-musetti-rune",
      sport: "tennis",
      competition: "Wimbledon - ATP Doubles",
      competitionId: "mock-wimbledon-atp-doubles",
      country: "Internazionale",
      homeName: "Lorenzo Musetti",
      awayName: "Holger Rune",
      homeScore: "6 2",
      awayScore: "3 6",
      status: "finished",
      startTime: dateAt(0, 13, 15),
      venue: "Campo 2",
      category: "Doppio maschile",
      gender: "men"
    }),
    withStatus({
      id: "mock-basket-milano-virtus",
      sport: "basketball",
      competition: "Serie A Basket",
      country: "Italia",
      homeName: "Olimpia Milano",
      awayName: "Virtus Bologna",
      homeScore: 68,
      awayScore: 64,
      status: "live",
      minute: "Q4 06:21",
      startTime: dateAt(0, 20, 30),
      venue: "Mediolanum Forum"
    }),
    withStatus({
      id: "mock-basket-lakers-celtics",
      sport: "basketball",
      competition: "NBA",
      country: "USA",
      homeName: "Los Angeles Lakers",
      awayName: "Boston Celtics",
      status: "scheduled",
      startTime: dateAt(1, 3, 0),
      venue: "Crypto.com Arena"
    }),
    withStatus({
      id: "mock-basket-knicks-heat",
      sport: "basketball",
      competition: "NBA",
      country: "USA",
      homeName: "New York Knicks",
      awayName: "Miami Heat",
      homeScore: 112,
      awayScore: 105,
      status: "finished",
      startTime: dateAt(-1, 1, 30),
      venue: "Madison Square Garden"
    }),
    withStatus({
      id: "mock-basket-real-pao",
      sport: "basketball",
      competition: "Eurolega",
      country: "Europa",
      homeName: "Real Madrid Basket",
      awayName: "Panathinaikos",
      status: "scheduled",
      startTime: dateAt(0, 20, 45),
      venue: "WiZink Center"
    }),
    withStatus({
      id: "mock-basket-fener-olympiacos",
      sport: "basketball",
      competition: "Eurolega",
      country: "Europa",
      homeName: "Fenerbahce",
      awayName: "Olympiacos",
      homeScore: 83,
      awayScore: 79,
      status: "finished",
      startTime: dateAt(0, 18, 15),
      venue: "Ulker Sports Arena"
    }),
    withStatus({
      id: "mock-formula1-monaco-qualifying",
      sport: "formula1",
      competition: "Gran Premio di Monaco",
      competitionId: "mock-f1-monaco",
      country: "Monaco",
      homeName: "Gran Premio di Monaco",
      awayName: "Circuit de Monaco",
      status: "live",
      minute: "Q2",
      startTime: dateAt(0, 15, 0),
      venue: "Circuit de Monaco",
      category: "Qualifiche",
      raceName: "Gran Premio di Monaco",
      circuit: "Circuit de Monaco",
      sessionType: "Qualifiche"
    }),
    withStatus({
      id: "mock-formula1-italy-race",
      sport: "formula1",
      competition: "Gran Premio d'Italia",
      competitionId: "mock-f1-italy",
      country: "Italia",
      homeName: "Gran Premio d'Italia",
      awayName: "Autodromo Nazionale Monza",
      status: "scheduled",
      startTime: dateAt(0, 16, 0),
      venue: "Monza",
      category: "Gara",
      raceName: "Gran Premio d'Italia",
      circuit: "Autodromo Nazionale Monza",
      sessionType: "Gara"
    }),
    withStatus({
      id: "mock-formula1-britain-sprint",
      sport: "formula1",
      competition: "British Grand Prix",
      competitionId: "mock-f1-britain",
      country: "Inghilterra",
      homeName: "British Grand Prix",
      awayName: "Silverstone Circuit",
      homeScore: "Vincitore",
      awayScore: "Lando Norris",
      status: "finished",
      startTime: dateAt(-1, 17, 0),
      venue: "Silverstone",
      category: "Sprint",
      raceName: "British Grand Prix",
      circuit: "Silverstone Circuit",
      sessionType: "Sprint",
      winner: "Lando Norris"
    })
  ];
}

const timelineById: Record<string, MatchTimelineItem[]> = {
  "mock-football-juventus-inter": [
    { minute: 18, type: "goal", team: "Inter", player: "Lautaro Martinez", description: "Inserimento centrale e tiro rasoterra." },
    { minute: 41, type: "card", team: "Juventus", player: "Locatelli", description: "Ammonizione per fallo tattico." },
    { minute: 59, type: "goal", team: "Juventus", player: "Vlahovic", description: "Pareggio di testa su cross dalla destra." }
  ],
  "mock-football-real-city": [
    { minute: 11, type: "goal", team: "Real Madrid", player: "Vinicius Junior", description: "Ripartenza veloce e conclusione sul secondo palo." },
    { minute: 34, type: "goal", team: "Manchester City", player: "Foden", description: "Sinistro dal limite dopo possesso prolungato." },
    { minute: 52, type: "goal", team: "Manchester City", player: "Haaland", description: "Tap-in da pochi passi." },
    { minute: 70, type: "goal", team: "Real Madrid", player: "Bellingham", description: "Inserimento perfetto sul filtrante centrale." }
  ],
  "mock-basket-milano-virtus": [
    { minute: "Q1", type: "run", team: "Olimpia Milano", description: "Parziale iniziale da 9-2 con due triple consecutive." },
    { minute: "Q3", type: "timeout", team: "Virtus Bologna", description: "Timeout dopo il sorpasso dei padroni di casa." },
    { minute: "Q4", type: "three", team: "Virtus Bologna", player: "Belinelli", description: "Tripla dall'angolo per riaprire la partita." }
  ]
};

const statsById: Record<string, MatchStat[]> = {
  "mock-football-juventus-inter": [
    { label: "Possesso", homeValue: "48%", awayValue: "52%" },
    { label: "Tiri", homeValue: 9, awayValue: 11 },
    { label: "Tiri in porta", homeValue: 4, awayValue: 5 },
    { label: "Corner", homeValue: 3, awayValue: 6 }
  ],
  "mock-football-real-city": [
    { label: "Possesso", homeValue: "44%", awayValue: "56%" },
    { label: "Tiri", homeValue: 12, awayValue: 14 },
    { label: "Occasioni create", homeValue: 7, awayValue: 8 },
    { label: "Recuperi alti", homeValue: 5, awayValue: 9 }
  ],
  "mock-basket-milano-virtus": [
    { label: "Rimbalzi", homeValue: 31, awayValue: 29 },
    { label: "Assist", homeValue: 18, awayValue: 16 },
    { label: "Triple", homeValue: "10/24", awayValue: "8/21" },
    { label: "Palle perse", homeValue: 9, awayValue: 11 }
  ]
};

export async function getMockEvents(query: ScoreQuery = {}) {
  const targetDate = normalizeDateParam(query.date);
  const sport = query.sport && query.sport !== "all" ? query.sport : undefined;
  const status = query.status && query.status !== "all" ? query.status : undefined;

  return getMockSportsEvents()
    .filter((event) => toDateKey(event.startTime) === targetDate)
    .filter((event) => (sport ? event.sport === sport : true))
    .filter((event) => (status ? event.status === status : true))
    .sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
}

export async function getMockMatchDetail(id: string): Promise<MatchDetail | null> {
  const event = getMockSportsEvents().find((item) => item.id === id);
  if (!event) return null;

  return {
    ...event,
    timeline: timelineById[id] ?? [],
    stats: statsById[id] ?? [],
    relatedNews: []
  };
}

export const mockSportsProvider = {
  name: "mock" as const,
  getEvents: getMockEvents,
  getMatchDetail: getMockMatchDetail
};
