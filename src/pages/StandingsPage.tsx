import { useState } from 'react';
import { useApp } from '../context';
import { computeStandings, getAllMatchesFromMatchdays, getRoundName } from '../utils/helpers';
import { Trophy, Check } from 'lucide-react';

interface Props { setPage: (p: string) => void; initialTab?: 'standings' | 'knockout'; }

function TeamBox({ teamId, score, won, data }: { teamId?: string; score?: number; won?: boolean; data: any }) {
  const team = teamId ? data.teams.find((t: any) => t.id === teamId) : null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 8, padding: '7px 10px', borderRadius: 8, width: 150,
      background: won ? 'rgba(232,184,75,0.15)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${won ? 'rgba(232,184,75,0.4)' : 'rgba(255,255,255,0.1)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {team?.logo
          ? <img src={team.logo} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 18, height: 18, borderRadius: 4, background: 'rgba(232,184,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#e8b84b', fontWeight: 700, flexShrink: 0 }}>
              {team?.name?.[0] ?? '?'}
            </div>
        }
        <span style={{ fontSize: 12, fontWeight: 600, color: won ? '#e8b84b' : 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {team?.name ?? 'TBD'}
        </span>
      </div>
      {score !== undefined && (
        <span style={{ fontSize: 13, fontWeight: 800, color: won ? '#e8b84b' : 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{score}</span>
      )}
    </div>
  );
}

function MatchNode({ match, data }: { match: any; data: any }) {
  const homeWon = match.played && match.winnerId === match.homeTeamId;
  const awayWon = match.played && match.winnerId === match.awayTeamId;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TeamBox teamId={match.homeTeamId} score={match.played ? match.homeScore : undefined} won={homeWon} data={data} />
      <TeamBox teamId={match.awayTeamId} score={match.played ? match.awayScore : undefined} won={awayWon} data={data} />
    </div>
  );
}

function BracketTree({ rounds, data }: { rounds: any[]; data: any }) {
  if (!rounds || rounds.length === 0) return null;

  const MATCH_H = 72;
  const MATCH_GAP = 20;
  const ROUND_W = 170;
  const ROUND_GAP = 60;
  const totalRounds = rounds.length;

  // Calculate vertical positions for each match in each round
  function getMatchPositions(roundIdx: number): number[] {
    const matchCount = rounds[roundIdx].matches.length;
    if (roundIdx === 0) {
      return rounds[roundIdx].matches.map((_: any, i: number) => i * (MATCH_H + MATCH_GAP));
    }
    const prevPositions = getMatchPositions(roundIdx - 1);
    const positions: number[] = [];
    for (let i = 0; i < matchCount; i++) {
      const top = prevPositions[i * 2];
      const bottom = prevPositions[i * 2 + 1] ?? top;
      positions.push((top + bottom) / 2);
    }
    return positions;
  }

  const allPositions = rounds.map((_, i) => getMatchPositions(i));
  const totalHeight = Math.max(...allPositions[0].map((p: number) => p + MATCH_H)) + 40;
  const totalWidth = totalRounds * (ROUND_W + ROUND_GAP) + (rounds[rounds.length - 1].matches.length === 1 ? ROUND_W + ROUND_GAP + 120 : 0);

  // Champion box position
  const lastRoundIdx = rounds.length - 1;
  const lastPositions = allPositions[lastRoundIdx];
  const championY = lastPositions[0] + MATCH_H / 2 - 18;
  const championX = lastRoundIdx * (ROUND_W + ROUND_GAP) + ROUND_W + ROUND_GAP;
  const champion = rounds[lastRoundIdx]?.matches[0]?.winnerId
    ? data.teams.find((t: any) => t.id === rounds[lastRoundIdx].matches[0].winnerId)
    : null;

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
      <div style={{ position: 'relative', width: totalWidth, height: totalHeight, minWidth: totalWidth }}>
        {rounds.map((round, roundIdx) => {
          const positions = allPositions[roundIdx];
          const x = roundIdx * (ROUND_W + ROUND_GAP);

          return (
            <div key={round.id}>
              {/* Round label */}
              <div style={{ position: 'absolute', left: x, top: 0, width: ROUND_W, textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: 8 }}>
                {round.name}
              </div>

              {round.matches.map((match: any, matchIdx: number) => {
                const y = positions[matchIdx] + 24;

                // Draw connector lines to next round
                let lines = null;
                if (roundIdx < rounds.length - 1) {
                  const nextPositions = allPositions[roundIdx + 1];
                  const nextMatchIdx = Math.floor(matchIdx / 2);
                  const nextY = nextPositions[nextMatchIdx] + 24 + MATCH_H / 2;
                  const myMidY = y + MATCH_H / 2;
                  const lineX1 = x + ROUND_W;
                  const lineX2 = x + ROUND_W + ROUND_GAP;
                  const midX = lineX1 + ROUND_GAP / 2;

                  lines = (
                    <svg style={{ position: 'absolute', left: 0, top: 0, width: totalWidth, height: totalHeight, pointerEvents: 'none', overflow: 'visible' }}>
                      {/* Horizontal line from match to mid */}
                      <line x1={lineX1} y1={myMidY} x2={midX} y2={myMidY} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                      {/* Vertical line connecting siblings */}
                      {matchIdx % 2 === 0 && (
                        <>
                          <line x1={midX} y1={myMidY} x2={midX} y2={nextY} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                          {/* Horizontal line to next match */}
                          <line x1={midX} y1={nextY} x2={lineX2} y2={nextY} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        </>
                      )}
                    </svg>
                  );
                }

                // Line from last round to champion
                let championLine = null;
                if (roundIdx === rounds.length - 1 && champion) {
                  const myMidY = y + MATCH_H / 2;
                  championLine = (
                    <svg style={{ position: 'absolute', left: 0, top: 0, width: totalWidth, height: totalHeight, pointerEvents: 'none', overflow: 'visible' }}>
                      <line x1={x + ROUND_W} y1={myMidY} x2={championX} y2={myMidY} stroke="rgba(232,184,75,0.4)" strokeWidth="1.5" />
                    </svg>
                  );
                }

                return (
                  <div key={match.id}>
                    {lines}
                    {championLine}
                    <div style={{ position: 'absolute', left: x, top: y }}>
                      <MatchNode match={match} data={data} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Champion box */}
        {champion && (
          <div style={{ position: 'absolute', left: championX, top: championY }}>
            <div style={{ padding: '8px 14px', borderRadius: 10, background: 'linear-gradient(135deg,rgba(232,184,75,0.25),rgba(232,184,75,0.1))', border: '1.5px solid rgba(232,184,75,0.5)', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#e8b84b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>🏆 Champion</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{champion.name}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StandingsPage({ setPage, initialTab = 'standings' }: Props) {
  const { data, currentUser } = useApp();
  const [tab, setTab] = useState<'standings' | 'knockout'>(
    data.knockout?.active || data.knockout?.completed ? initialTab : 'standings'
  );
  const [qualSpots, setQualSpots] = useState(data.qualificationSpots);

  const allMatches = getAllMatchesFromMatchdays(data.matchdays);
  const standings = computeStandings(data.teams, allMatches);
  const ko = data.knockout;

  const posColors = ['text-[#e8b84b]', 'text-white/60', 'text-amber-700'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy size={22} className="text-[#e8b84b]" />
            {tab === 'knockout' ? 'Knockout Bracket' : 'Standings'}
          </h1>
          <p className="text-white/40 text-sm mt-1">Season {data.seasonNumber}</p>
        </div>
        {currentUser?.role === 'admin' && tab === 'standings' && (
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-sm">Qualification spots:</span>
            <select
              value={qualSpots}
              onChange={e => setQualSpots(Number(e.target.value))}
              className="bg-white/10 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm"
            >
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
      </div>

      {(ko?.active || ko?.completed) && (
        <div className="flex gap-2">
          <button onClick={() => setTab('standings')} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab === 'standings'
              ? { background: 'rgba(232,184,75,0.15)', color: '#e8b84b', border: '1px solid rgba(232,184,75,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Standings
          </button>
          <button onClick={() => setTab('knockout')} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab === 'knockout'
              ? { background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            🏆 Knockout Bracket
          </button>
        </div>
      )}

      {tab === 'knockout' && (
        <div className="bg-[#0f1923] border border-white/10 rounded-2xl p-6">
          {(!ko?.rounds || ko.rounds.length === 0) ? (
            <div className="py-12 text-center text-white/30">
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p>Knockout bracket not started yet.</p>
            </div>
          ) : (
            <BracketTree rounds={ko.rounds} data={data} />
          )}
        </div>
      )}

      {tab === 'standings' && (
        <>
          {standings.length === 0 ? (
            <div className="bg-[#0f1923] border border-white/10 rounded-xl p-12 text-center text-white/30">
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p>No teams yet. Standings will appear once teams are created.</p>
            </div>
          ) : (
            <div className="bg-[#0f1923] border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left w-8">#</th>
                      <th className="px-4 py-3 text-left">Team</th>
                      <th className="px-3 py-3 text-center">P</th>
                      <th className="px-3 py-3 text-center">W</th>
                      <th className="px-3 py-3 text-center">D</th>
                      <th className="px-3 py-3 text-center">L</th>
                      <th className="px-3 py-3 text-center">GF</th>
                      <th className="px-3 py-3 text-center">GA</th>
                      <th className="px-3 py-3 text-center">GD</th>
                      <th className="px-3 py-3 text-center font-black">Pts</th>
                      <th className="px-3 py-3 text-center">Q</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {standings.map((s, i) => {
                      const team = data.teams.find(t => t.id === s.teamId);
                      const qualifies = i < qualSpots;
                      const isQualLine = i === qualSpots - 1;
                      return (
                        <tr key={s.teamId}
                          className={`transition-colors hover:bg-white/5 ${qualifies ? 'bg-emerald-500/5' : ''} ${isQualLine ? 'border-b-2 border-emerald-500/40' : ''}`}>
                          <td className="px-4 py-3">
                            <span className={`font-black text-base ${posColors[i] || 'text-white/60'}`}>{i + 1}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {team?.logo
                                ? <img src={team.logo} alt={team.name} className="w-8 h-8 rounded-lg object-cover" />
                                : <div className="w-8 h-8 rounded-lg bg-[#e8b84b]/10 flex items-center justify-center text-[#e8b84b] text-xs font-black">{team?.name?.[0]}</div>
                              }
                              <button onClick={() => setPage(`team_${s.teamId}`)} className="font-semibold text-white hover:text-[#e8b84b] transition-colors">
                                {team?.name}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-white/70">{s.played}</td>
                          <td className="px-3 py-3 text-center text-emerald-400">{s.wins}</td>
                          <td className="px-3 py-3 text-center text-white/50">{s.draws}</td>
                          <td className="px-3 py-3 text-center text-red-400">{s.losses}</td>
                          <td className="px-3 py-3 text-center text-white/70">{s.goalsFor}</td>
                          <td className="px-3 py-3 text-center text-white/70">{s.goalsAgainst}</td>
                          <td className="px-3 py-3 text-center font-semibold text-white/70">
                            {s.goalDiff > 0 ? '+' : ''}{s.goalDiff}
                          </td>
                          <td className="px-3 py-3 text-center font-black text-[#e8b84b] text-base">{s.points}</td>
                          <td className="px-3 py-3 text-center">
                            {qualifies && <Check size={16} className="text-emerald-400 mx-auto" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3 text-xs text-white/30">
                <div className="w-3 h-3 rounded bg-emerald-500/20 border-l-2 border-emerald-500" />
                Top {qualSpots} teams qualify for playoffs
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}