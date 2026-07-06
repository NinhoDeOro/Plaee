import type { SportEvent } from "@/lib/types";

export function groupEventsByCompetition(events: SportEvent[]) {
  const groups = new Map<string, { competition: string; country?: string; events: SportEvent[] }>();

  for (const event of events) {
    const key = `${event.country ?? ""}-${event.competition}`;
    const current = groups.get(key);

    if (current) {
      current.events.push(event);
    } else {
      groups.set(key, {
        competition: event.competition,
        country: event.country,
        events: [event]
      });
    }
  }

  return Array.from(groups.values());
}
