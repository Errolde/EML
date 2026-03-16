import { useState } from 'react';
import { useApp } from '../context';
import { computeStandings, getAllMatchesFromMatchdays, getRoundName } from '../utils/helpers';
import { Trophy, Check } from 'lucide-react';

interface Props { setPage: (p: string) => void; initialTab?: 'standings' | 'knockout'; }

function TeamSlot({ teamId, score, won, data }: { teamId?: string; score?: number; won?: boolean; data: any }) {
  const team = teamId ? data.teams.find((t: any) => t.id === teamId) : null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 10px', height: 36,
      background: won ? 'rgba(232,184,75,0.12)' : team ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
        {team ? (
          team.logo
            ? <img src={team.logo} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 18, height: 18, borderRadius: 4, background: won ? 'rgba(232,184,75,0.3)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: won ? '#e8b84b' : 'rgba(255,255,255,0.5)', fontWeight: 800, flexShrink: 0 }}>
                {team.name?.[0]}
              </div>
        ) : (
          <div style={{ width: 18, height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 12, fontWeight: won ? 700 : 500, color: won ? '#e8b84b' : team ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {team?.name ?? 'TBD'}
        </span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: won ? '#e8b84b' : score !== undefined ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)', marginLeft: 8, flexShrink: 0, minWidth: 16, textAlign: 'right' }}>
        {score !== undefined ? score : '–'}
      </span>
    </div>
  );
}

function MatchCard({ match, data }: { match: any; data: any }) {
  const homeWon = match.played && match.winnerId === match.homeTeamId;
  const awayWon = match.played && match.winnerId === match.awayTeamId;
  return (
    <div style={{
      width: 180, borderRadius: 10, overflow: 'hidden',
      border: `1px solid ${match.played ? 'rgba(232,184,75,0.2)' : 'rgba(255,255,255,0.1)'}`,
      background: '#0d1520',
      boxShadow: match.played ? '0 0 12px rgba(232,184,75,0.08)' : 'none',
    }}>
      <TeamSlot teamId={match.homeTeamId} score={match.played ? match.homeScore : undefined} won={homeWon} data={data} />
      <TeamSlot teamId={match.awayTeamId} score={match.played ? match.awayScore : undefined} won={awayWon} data={data} />
    </div>
  );
}

function BracketTree({ rounds, data }: { rounds: any[]; data: any }) {
  if (!rounds || rounds.length === 0) return null;

  const CARD_H = 74;
  const CARD_W = 180;
  const V_GAP = 24;
  const H_GAP = 56;
  const LABEL_H = 28;
  const CHAMPION_W = 160;

  // Build all rounds including future empty rounds
  // Figure out max rounds needed based on first round match count
  const firstRoundMatches = rounds[0].matches.length;
  const totalRoundsNeeded = Math.ceil(Math.log2(firstRoundMatches * 2)) + (firstRoundMatches === 1 ? 0 : 0);

  // Build full round list — pad with empty future rounds
  const allRounds: any[] = [...rounds];
  let prevCount = rounds[rounds.length - 1].matches.length;
  while (prevCount > 1) {
    const nextCount = Math.ceil(prevCount / 2);
    allRounds.push({
      id: `future_${allRounds.length}`,
      name: getRoundName(prevCount * 2, allRounds.length),
      matches: Array.from({ length: nextCount }, (_, i) => ({
        id: `empty_${allRounds.length}_${i}`,
        homeTeamId: undefined, awayTeamId: undefined,
        played: false, empty: true,
      })),
    });
    prevCount = nextCount;
  }

  const totalRounds = allRounds.length;

  // Compute vertical positions for each match per round
  function getPositions(roundIdx: number): number[] {
    const count = allRounds[roundIdx].matches.length;
    if (roundIdx === 0) {
      return allRounds[0].matches.map((_: any, i: number) => LABEL_H + i * (CARD_H + V_GAP));
    }
    const prev = getPositions(roundIdx - 1);
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      const a = prev[i * 2] ?? prev[prev.length - 1];
      const b = prev[i * 2 + 1] ?? a;
      positions.push((a + b) / 2);
    }
    return positions;
  }

  const allPositions = allRounds.map((_, i) => getPositions(i));
  const svgH = Math.max(...allPositions[0].map((p: number) => p + CARD_H)) + 40;
  const svgW = totalRounds * (CARD_W + H_GAP) + CHAMPION_W + H_GAP;

  // Find champion
  const lastReal = rounds[rounds.length - 1];
  const championId = lastReal?.matches[0]?.winnerId;
  const champion = championId ? data.teams.find((t: any) => t.id === championId) : null;
  const champX = totalRounds * (CARD_W + H_GAP);
  const champY = allPositions[totalRounds - 1][0] + CARD_H / 2 - 20;

  return (
    <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: 8 }}>
      <div style={{ position: 'relative', width: svgW, height: svgH }}>

        {/* SVG for connector lines */}
        <svg style={{ position: 'absolute', left: 0, top: 0, width: svgW, height: svgH, pointerEvents: 'none', overflow: 'visible' }}>
          {allRounds.map((round, rIdx) => {
            if (rIdx >= totalRounds - 1) return null;
            const positions = allPositions[rIdx];
            const nextPositions = allPositions[rIdx + 1];
            const x1 = rIdx * (CARD_W + H_GAP) + CARD_W;
            const x2 = (rIdx + 1) * (CARD_W + H_GAP);
            const midX = x1 + H_GAP / 2;

            return positions.map((p: number, mIdx: number) => {
              const myMid = p + LABEL_H / 2 + CARD_H / 2 - (rIdx === 0 ? 0 : LABEL_H / 2);
              const actualMyMid = p + CARD_H / 2;
              const nextIdx = Math.floor(mIdx / 2);
              const nextMid = nextPositions[nextIdx] + CARD_H / 2;
              const isTop = mIdx % 2 === 0;
              const siblingIdx = isTop ? mIdx + 1 : mIdx - 1;
              const siblingMid = siblingIdx < positions.length ? positions[siblingIdx] + CARD_H / 2 : actualMyMid;
              const vertTop = Math.min(actualMyMid, siblingMid);
              const vertBot = Math.max(actualMyMid, siblingMid);

              return (
                <g key={`${rIdx}-${mIdx}`}>
                  {/* Horizontal from match to midpoint */}
                  <line x1={x1} y1={actualMyMid} x2={midX} y2={actualMyMid}
                    stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                  {/* Vertical connector between siblings — only draw once (for top sibling) */}
                  {isTop && (
                    <line x1={midX} y1={vertTop} x2={midX} y2={vertBot}
                      stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                  )}
                  {/* Horizontal to next round — only draw once (for top sibling) */}
                  {isTop && (
                    <line x1={midX} y1={nextMid} x2={x2} y2={nextMid}
                      stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                  )}
                </g>
              );
            });
          })}

          {/* Line from final to champion */}
          {champion && (() => {
            const finalPos = allPositions[totalRounds - 1][0];
            const finalMid = finalPos + CARD_H / 2;
            const fx = (totalRounds - 1) * (CARD_W + H_GAP) + CARD_W;
            return (
              <line x1={fx} y1={finalMid} x2={champX} y2={finalMid}
                stroke="rgba(232,184,75,0.4)" strokeWidth="1.5" strokeDasharray="4 3" />
            );
          })()}
        </svg>

        {/* Match cards */}
        {allRounds.map((round, rIdx) => {
          const positions = allPositions[rIdx];
          const x = rIdx * (CARD_W + H_GAP);
          const isReal = rIdx < rounds.length;

          return (
            <div key={round.id}>
              {/* Round label */}
              <div style={{ position: 'absolute', left: x, top: 0, width: CARD_W, textAlign: 'center', fontSize: 10, fontWeight: 700, color: isReal ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {round.name}
              </div>

              {round.matches.map((match: any, mIdx: number) => {
                const y = positions[mIdx];
                // For future empty rounds, show who advanced
                let displayMatch = match;
                if (match.empty && isReal === false && rIdx > 0) {
                  // Try to figure out winner from previous round
                  const prevRound = allRounds[rIdx - 1];
                  if (prevRound && rIdx < rounds.length + 1) {
                    const homeFromMatch = prevRound.matches[mIdx * 2];
                    const awayFromMatch = prevRound.matches[mIdx * 2 + 1];
                    displayMatch = {
                      ...match,
                      homeTeamId: homeFromMatch?.winnerId,
                      awayTeamId: awayFromMatch?.winnerId,
                    };
                  }
                }

                return (
                  <div key={match.id} style={{ position: 'absolute', left: x, top: y + LABEL_H }}>
                    <MatchCard match={displayMatch} data={data} />
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Champion box */}
        {champion && (
          <div style={{ position: 'absolute', left: champX + H_GAP / 2, top: champY }}>
            <div style={{
              padding: '10px 16px', borderRadius: 12, textAlign: 'center',
              background: 'linear-gradient(135deg,rgba(232,184,75,0.2),rgba(232,184,75,0.08))',
              border: '1.5px solid rgba(232,184,75,0.5)',
              boxShadow: '0 0 20px rgba(232,184,75,0.15)',
            }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>🏆</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#e8b84b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Champion</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{champion.name}</div>
            </div>
          </div>
        )}

        {/* Pending champion box */}
        {!champion && (
          <div style={{ position: 'absolute', left: champX + H_GAP / 2, top: champY }}>
            <div style={{
              padding: '10px 16px', borderRadius: 12, textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1.5px dashed rgba(255,255,255,0.1)',
            }}>
              <div style={{ fontSize: 16, marginBottom: 4, opacity: 0.3 }}>🏆</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Champion</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>TBD</div>
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
            <select value={qualSpots} onChange={e => setQualSpots(Number(e.target.value))}
              className="bg-white/10 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm">
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
        <div className="bg-[#0a1020] border border-white/10 rounded-2xl p-6">
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