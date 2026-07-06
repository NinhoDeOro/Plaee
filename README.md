# Plaee

Plaee è un MVP sportivo moderno e mobile-first per `plaee.it`: risultati live, calendario eventi, dettaglio partita e news sportive con dati normalizzati.

Il progetto usa Next.js App Router, TypeScript, Tailwind CSS e un sistema provider-based con fallback mock. Le news funzionano subito via RSS pubblico; calendario e risultati reali passano da provider ufficiali separati per Calcio, Tennis, Basket e Motori.

## Stack

- Next.js con App Router
- TypeScript
- Tailwind CSS
- Componenti UI riutilizzabili
- API route interne
- Deploy su Vercel

## Installazione

```bash
npm install
```

## Avvio locale

```bash
npm run dev
```

Apri `http://localhost:3000`.

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Configurazione `.env`

Copia `.env.example` in `.env.local` e compila solo le chiavi che vuoi usare.

```bash
cp .env.example .env.local
```

Variabili principali:

```env
NEXT_PUBLIC_SITE_NAME=Plaee
NEXT_PUBLIC_SITE_URL=https://plaee.it

SPORTS_PROVIDER=api-sports
API_SPORTS_KEY=
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_BASKETBALL_BASE_URL=https://v1.basketball.api-sports.io
API_FORMULA1_BASE_URL=https://v1.formula-1.api-sports.io

TENNIS_PROVIDER=api-tennis
API_TENNIS_KEY=
API_TENNIS_BASE_URL=https://api.api-tennis.com/tennis/
THESPORTSDB_KEY=

ENABLE_FOOTBALL=true
ENABLE_TENNIS=true
ENABLE_BASKETBALL=true
ENABLE_FORMULA1=true

NEWS_PROVIDER=rss
NEWS_API_KEY=

ENABLE_RSS_NEWS=true
RSS_MAX_ITEM_AGE_DAYS=45
ANSA_RSS_SPORT=https://www.ansa.it/sito/notizie/sport/sport_rss.xml
SKY_RSS_SPORT=https://sport.sky.it/rss/sport.xml
BBC_RSS_SPORT=https://feeds.bbci.co.uk/sport/rss.xml
```

## Provider scelti

Configurazione consigliata per provare il multi-sport reale:

```env
SPORTS_PROVIDER=api-sports
API_SPORTS_KEY=INSERIRE_CHIAVE_API_SPORTS
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_BASKETBALL_BASE_URL=https://v1.basketball.api-sports.io
API_FORMULA1_BASE_URL=https://v1.formula-1.api-sports.io

TENNIS_PROVIDER=api-tennis
API_TENNIS_KEY=INSERIRE_CHIAVE_TENNIS
API_TENNIS_BASE_URL=https://api.api-tennis.com/tennis/

ENABLE_FOOTBALL=true
ENABLE_TENNIS=true
ENABLE_BASKETBALL=true
ENABLE_FORMULA1=true

NEWS_PROVIDER=rss
ENABLE_RSS_NEWS=true
```

Con `SPORTS_PROVIDER=api-sports`, Plaee usa:

- Calcio: solo API-FOOTBALL con `API_SPORTS_KEY`.
- Tennis: solo API-Tennis con `API_TENNIS_KEY`.
- Basket: solo API-BASKETBALL con `API_SPORTS_KEY`.
- Motori: solo API-FORMULA-1 con `API_SPORTS_KEY`.
- Trending: selezione dei migliori eventi del giorno, separata per Calcio, Tennis, Basket e Motori.
- Mock data solo se imposti `SPORTS_PROVIDER=mock`, se manca la chiave necessaria, o se il provider reale fallisce.

Per le news, Plaee usa RSS pubblici verificati, filtra gli item troppo vecchi e può integrare NewsAPI se configuri la chiave.

## Uso con dati mock

Lascia:

```env
SPORTS_PROVIDER=mock
NEWS_PROVIDER=mock
```

Il sito usa partite e news dimostrative realistiche, incluse Serie A, Champions League, Premier League, ATP, NBA ed Eurolega.

## Configurazione API-FOOTBALL

1. Copia `.env.example` in `.env.local`.
2. Inserisci la chiave reale in `API_SPORTS_KEY`.
3. Verifica che `SPORTS_PROVIDER=api-sports`.
4. Avvia il sito con `npm run dev`.
5. Testa `http://127.0.0.1:3000/api/health`.
6. Testa `http://127.0.0.1:3000/api/scores?sport=football&date=YYYY-MM-DD`.
7. Non committare mai `.env.local` su GitHub.

Esempio:

```env
SPORTS_PROVIDER=api-sports
API_SPORTS_KEY=INSERIRE_CHIAVE_API_SPORTS
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
```

La chiave resta sempre server-side: non usare variabili `NEXT_PUBLIC` e non chiamare mai API-FOOTBALL dal frontend.

Il provider usa questi endpoint ufficiali v3:

- `/status` per controllare account e quota.
- `/fixtures?date=YYYY-MM-DD` per le partite del giorno.
- `/fixtures?live=all` per le partite live.
- `/fixtures?id=FIXTURE_ID` per il dettaglio partita.
- `/fixtures/events?fixture=FIXTURE_ID` per timeline, gol, cartellini e sostituzioni.
- `/fixtures/statistics?fixture=FIXTURE_ID` per statistiche rapide.

Se la chiave manca, la quota è esaurita o la chiamata fallisce, Plaee torna ai mock senza mostrare errori tecnici all'utente.
Per le richieste `status=live`, Plaee usa cache e polling di almeno 2 minuti per proteggere la quota.

Documentazione: https://www.api-football.com/documentation-v3

## Configurazione API-Sports multi-sport

La stessa `API_SPORTS_KEY` viene usata server-side per:

- Calcio: `API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io`
- Basket: `API_BASKETBALL_BASE_URL=https://v1.basketball.api-sports.io`
- Formula 1: `API_FORMULA1_BASE_URL=https://v1.formula-1.api-sports.io`

Esempio:

```env
SPORTS_PROVIDER=api-sports
API_SPORTS_KEY=INSERIRE_CHIAVE_API_SPORTS
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_BASKETBALL_BASE_URL=https://v1.basketball.api-sports.io
API_FORMULA1_BASE_URL=https://v1.formula-1.api-sports.io
ENABLE_FOOTBALL=true
ENABLE_TENNIS=true
ENABLE_BASKETBALL=true
ENABLE_FORMULA1=true
```

Le pagine specifiche non mischiano sport:

- `/api/scores?sport=football&date=YYYY-MM-DD` usa solo API-FOOTBALL.
- `/api/scores?sport=tennis&date=YYYY-MM-DD` usa solo API-Tennis.
- `/api/scores?sport=basketball&date=YYYY-MM-DD` usa solo API-BASKETBALL.
- `/api/scores?sport=formula1&date=YYYY-MM-DD` usa solo API-FORMULA-1.
- `/api/scores?sport=trending&date=YYYY-MM-DD` seleziona solo eventi importanti e li separa in UI per sport.

Se una API reale risponde con lista vuota, Plaee mostra empty state e non aggiunge mock.

## Collegare API Tennis

1. Ottieni una chiave da API Tennis.
2. Imposta:

```env
SPORTS_PROVIDER=api-sports
TENNIS_PROVIDER=api-tennis
API_TENNIS_KEY=INSERIRE_CHIAVE_TENNIS
API_TENNIS_BASE_URL=https://api.api-tennis.com/tennis/
```

Il provider usa `get_events`, `get_livescore` e dettaglio match quando disponibili.

Documentazione: https://api-tennis.com/documentation

## Collegare API-Sports Basketball

1. Ottieni una chiave API-Sports Basketball.
2. Imposta:

```env
SPORTS_PROVIDER=api-sports
API_SPORTS_KEY=INSERIRE_CHIAVE_API_SPORTS
API_BASKETBALL_BASE_URL=https://v1.basketball.api-sports.io
```

Il provider usa endpoint ufficiali per partite e livescore basket.

Documentazione: https://api-sports.io/sports/basketball

## Collegare TheSportsDB

Plaee usa già TheSportsDB come fallback reale con la chiave pubblica dimostrativa `3`. Per produzione è meglio ottenere una chiave dedicata.

1. Ottieni una chiave TheSportsDB.
2. Imposta:

```env
SPORTS_PROVIDER=thesportsdb
THESPORTSDB_KEY=la_tua_chiave
```

Il provider usa la API v1 per eventi del giorno e dettaglio evento. Se non risponde, Plaee usa il fallback mock.

Documentazione: https://www.thesportsdb.com/documentation

## Collegare NewsAPI

1. Ottieni una chiave NewsAPI.
2. Imposta:

```env
NEWS_PROVIDER=newsapi
NEWS_API_KEY=la_tua_chiave
```

Plaee mostra solo titolo, fonte, data, descrizione breve e link originale. Non usa il contenuto completo dell'articolo.

Documentazione: https://newsapi.org/docs/endpoints/everything

## Collegare feed RSS

Con `NEWS_PROVIDER=newsapi` o `NEWS_PROVIDER=rss`, puoi attivare feed RSS pubblici:

```env
ENABLE_RSS_NEWS=true
ANSA_RSS_SPORT=https://www.ansa.it/sito/notizie/sport/sport_rss.xml
SKY_RSS_SPORT=https://sport.sky.it/rss/sport.xml
BBC_RSS_SPORT=https://feeds.bbci.co.uk/sport/rss.xml
RSS_MAX_ITEM_AGE_DAYS=45
GAZZETTA_RSS_GENERAL=https://www.gazzetta.it/rss/home.xml
GAZZETTA_RSS_CALCIO=https://www.gazzetta.it/rss/calcio.xml
GAZZETTA_RSS_SERIE_A=https://www.gazzetta.it/rss/serie-a.xml
GAZZETTA_RSS_BASKET=https://www.gazzetta.it/rss/basket.xml
GAZZETTA_RSS_FORMULA1=https://www.gazzetta.it/rss/formula-1.xml
```

Gli URL RSS possono cambiare: il codice gestisce feed non raggiungibili senza rompere il sito. `RSS_MAX_ITEM_AGE_DAYS` evita di mostrare item storici come news attuali; usa `0` per disattivare il filtro. Per prudenza, le immagini dei feed RSS non vengono riutilizzate.

## API interne

- `GET /api/scores?sport=football&date=today&status=live`
- `GET /api/scores?sport=basketball&date=today`
- `GET /api/scores?sport=tennis&date=today`
- `GET /api/scores?sport=formula1&date=today`
- `GET /api/scores?sport=trending&date=today`
- `GET /api/matches/:id`
- `GET /api/news?sport=football&q=serie`
- `GET /api/health`

`/api/health` mostra solo la presenza delle chiavi, mai il valore delle chiavi.

## Caching e aggiornamenti

- Live calcio/basket/tennis: cache almeno 2 minuti.
- Risultati calcio/basket/tennis per data: cache almeno 10 minuti.
- Formula 1: cache 15/30 minuti salvo live.
- Trending: costruito dai provider configurati e ordinato per `importanceScore`, massimo 10/12 eventi.
- Dettaglio match: cache almeno 5 minuti.
- Statistiche match: cache almeno 10 minuti.
- News: revalidate ogni 10 minuti.
- Provider esterni: timeout e fallback mock.

## Deploy su Vercel

1. Collega il repository a Vercel.
2. Configura le variabili ambiente nella dashboard Vercel.
3. Esegui il deploy.

Comandi standard:

```bash
npm install
npm run build
```

## Note legali

Da non fare:

- No scraping di siti terzi.
- No copia di articoli.
- No copia di immagini editoriali senza licenza chiara.
- No copia di database da siti terzi.
- No copia di layout, loghi, colori, testi o asset proprietari di Sofascore, Flashscore, Gazzetta dello Sport o altri.

Da fare sempre:

- Usare dati mock, API ufficiali o feed autorizzati.
- Mostrare attribuzione alla fonte.
- Linkare la notizia originale.
- Mostrare solo snippet forniti da API/feed.
- Verificare i termini d'uso dei provider prima della pubblicazione.
