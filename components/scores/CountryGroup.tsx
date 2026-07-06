import type { MatchGroup } from "@/lib/utils/groupMatches";
import { CompetitionGroup } from "@/components/scores/CompetitionGroup";
import { MatchSectionHeader } from "@/components/scores/MatchSectionHeader";

type CountryGroupProps = {
  country: string;
  groups: MatchGroup[];
};

export function CountryGroup({ country, groups }: CountryGroupProps) {
  const count = groups.reduce((total, group) => total + group.events.length, 0);

  return (
    <section className="space-y-3">
      <MatchSectionHeader title={country} count={count} />
      <div className="space-y-3">
        {groups.map((group) => (
          <CompetitionGroup
            key={group.key}
            competition={group.title}
            country={group.country}
            countryCode={group.countryCode}
            countryFlag={group.countryFlag}
            leagueLogo={group.leagueLogo}
            category={group.category}
            gender={group.gender}
            events={group.events}
          />
        ))}
      </div>
    </section>
  );
}
