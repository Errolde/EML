import { Match, Matchday, Team } from '../types';

export interface Standing {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export function computeStandings(teams: Team[], matches: Match[]): Standing[] {
  const map: Record<string, Standing> = {};
  for (const t of teams) {
    map[t.id] = { teamId: t.id, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 };
  }
  for (const m of matches) {
    if (!m.played || m.homeScore === undefined || m.awayScore === undefined) continue;
    const home = map[m.homeTeamId];
    const away = map[m.awayTeamId];
    if (!home || !away) continue;
    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;
    if (m.homeScore > m.awayScore) {
      home.wins++; home.points += 3; away.losses++;
    } else if (m.homeScore < m.awayScore) {
      away.wins++; away.points += 3; home.losses++;
    } else {
      home.draws++; away.draws++;
      home.points++; away.points++;
    }
  }
  for (const s of Object.values(map)) {
    s.goalDiff = s.goalsFor - s.goalsAgainst;
  }
  return Object.values(map).sort((a, b) =>
    b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor
  );
}

export function computeGroupStandings(teams: Team[], matches: Match[], groupTeamIds: string[]): Standing[] {
  const groupTeams = teams.filter(t => groupTeamIds.includes(t.id));
  const groupMatches = matches.filter(m => groupTeamIds.includes(m.homeTeamId) && groupTeamIds.includes(m.awayTeamId));
  return computeStandings(groupTeams, groupMatches);
}

export function getAllMatchesFromMatchdays(matchdays: Matchday[]): Match[] {
  return matchdays.flatMap(md => md.matches);
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function getRoundName(totalTeams: number, roundIndex: number, _totalRounds?: number): string {
  const teamsInRound = totalTeams / Math.pow(2, roundIndex);
  if (teamsInRound === 2) return 'Final';
  if (teamsInRound === 4) return 'Semi-Finals';
  if (teamsInRound === 8) return 'Quarter-Finals';
  if (teamsInRound === 16) return 'Round of 16';
  if (teamsInRound === 32) return 'Round of 32';
  return `Round ${roundIndex + 1}`;
}

export function getAvatarUrl(username: string, avatar?: string): string {
  if (avatar) return avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1e3a5f&color=fff&bold=true`;
}

export function parseMentions(content: string): Array<{ type: 'text' | 'mention'; value: string }> {
  const parts: Array<{ type: 'text' | 'mention'; value: string }> = [];
  const regex = /@(\w+)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'mention', value: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) });
  }
  return parts;
}

export function generateKnockoutRoundsFromIds(teamIds: string[], idGen: () => string): import('../types').KnockoutRound[] {
  const n = teamIds.length;
  const seeded = [...teamIds];
  const firstRoundMatches: import('../types').KnockoutMatch[] = [];
  const half = Math.floor(seeded.length / 2);
  for (let i = 0; i < half; i++) {
    firstRoundMatches.push({
      id: idGen(),
      homeTeamId: seeded[i],
      awayTeamId: seeded[seeded.length - 1 - i],
      played: false,
    });
  }
  const numRounds = Math.ceil(Math.log2(n));
  const totalTeams = Math.pow(2, numRounds);
  const rounds: import('../types').KnockoutRound[] = [];
  rounds.push({ id: idGen(), name: getRoundName(totalTeams, 0, numRounds), matches: firstRoundMatches });
  for (let r = 1; r < numRounds; r++) {
    const matchCount = Math.pow(2, numRounds - r - 1);
    const matches: import('../types').KnockoutMatch[] = [];
    for (let i = 0; i < matchCount; i++) {
      matches.push({ id: idGen(), played: false });
    }
    rounds.push({ id: idGen(), name: getRoundName(totalTeams, r, numRounds), matches });
  }
  return rounds;
}
