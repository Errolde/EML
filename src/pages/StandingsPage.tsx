import { useState } from 'react';
import { useApp } from '../context';
import { computeStandings, getAllMatchesFromMatchdays, getRoundName } from '../utils/helpers';
import { Trophy, Check } from 'lucide-react';

interface Props { setPage: (p: string) => void; initialTab?: 'standings' | 'knockout'; }

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

      {/* Tabs — only show if knockout is active or completed */}
      {(ko?.active || ko?.completed) && (
        <div className="flex gap-2">
          <button
            onClick={() => setTab('standings')}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab === 'standings'
              ? { background: 'rgba(232,184,75,0.15)', color: '#e8b84b', border: '1px solid rgba(232,184,75,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Standings
          </button>
          <button
            onClick={() => setTab('knockout')}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab === 'knockout'
              ? { background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            🏆 Knockout Bracket
          </button>
        </div>
      )}

      {/* Knockout bracket view */}
      {tab === 'knockout' && (
        <div className="space-y-4">
          {ko?.completed && (
            <div className="p-8 text-center rounded-2xl"
              style={{ background: 'rgba(232,184,75,0.06)', border: '1px solid rgba(232,184,75,0.2)' }}>
              <Trophy size={48} className="mx-auto mb-3 text-[#e8b84b]" />
              <h3 className="text-2xl font-black text-white mb-1">Champions!</h3>
              <p className="font-bold text-lg text-[#e8b84b]">
                {data.teams.find(t => t.id === ko.championTeamId)?.name}
              </p>
            </div>
          )}

          {ko?.rounds.map(round => (
            <div key={round.id} className="bg-[#0f1923] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="font-bold text-white text-sm">{round.name}</h3>
              </div>
              <div>
                {round.matches.map((match, mi) => {
                  const home = data.teams.find(t => t.id === match.homeTeamId);
                  const away = data.teams.find(t => t.id === match.awayTeamId);
                  const homeWon = match.played && match.winnerId === match.homeTeamId;
                  const awayWon = match.played && match.winnerId === match.awayTeamId;
                  return (
                    <div key={match.id}
                      className="px-5 py-4 flex items-center gap-4"
                      style={{ borderBottom: mi < round.matches.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      {/* Home */}
                      <div className="flex-1 flex items-center gap-2 justify-end">
                        <span className="font-semibold text-sm" style={{ color: homeWon ? '#e8b84b' : 'rgba(255,255,255,0.85)' }}>
                          {home?.name || 'TBD'} {homeWon && '🏆'}
                        </span>
                        {home?.logo
                          ? <img src={home.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          : <div className="w-8 h-8 rounded-lg bg-[#e8b84b]/10 flex items-center justify-center text-[#e8b84b] text-xs font-bold">{home?.name?.[0]}</div>
                        }
                      </div>
                      {/* Score */}
                      <div className="px-3 text-center min-w-[60px]">
                        {match.played
                          ? <div className="text-lg font-black text-white">{match.homeScore} – {match.awayScore}</div>
                          : <div className="text-white/30 text-sm font-bold">VS</div>
                        }
                      </div>
                      {/* Away */}
                      <div className="flex-1 flex items-center gap-2">
                        {away?.logo
                          ? <img src={away.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          : <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-300 text-xs font-bold">{away?.name?.[0]}</div>
                        }
                        <span className="font-semibold text-sm" style={{ color: awayWon ? '#e8b84b' : 'rgba(255,255,255,0.85)' }}>
                          {awayWon && '🏆 '}{away?.name || 'TBD'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {(!ko?.rounds || ko.rounds.length === 0) && (
            <div className="bg-[#0f1923] border border-white/10 rounded-xl p-12 text-center text-white/30">
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p>Knockout bracket not started yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Standings table */}
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