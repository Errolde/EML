import { useState } from 'react';
import { useApp } from '../context';
import { computeStandings, getAllMatchesFromMatchdays } from '../utils/helpers';
import { Trophy, Check } from 'lucide-react';

interface Props { setPage: (p: string) => void; }

export function StandingsPage({ setPage }: Props) {
  const { data, currentUser } = useApp();
  const [qualSpots, setQualSpots] = useState(data.qualificationSpots);

  const allMatches = getAllMatchesFromMatchdays(data.matchdays);
  const standings = computeStandings(data.teams, allMatches);

  const posColors = ['text-[#e8b84b]', 'text-white/60', 'text-amber-700'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Trophy size={22} className="text-[#e8b84b]" />Standings</h1>
          <p className="text-white/40 text-sm mt-1">Season {data.seasonNumber}</p>
        </div>
        {currentUser?.role === 'admin' && (
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
                    <tr
                      key={s.teamId}
                      className={`transition-colors hover:bg-white/5 ${qualifies ? 'bg-emerald-500/5' : ''} ${isQualLine ? 'border-b-2 border-emerald-500/40' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className={`font-black text-base ${posColors[i] || 'text-white/60'}`}>{i + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {team?.logo ? (
                            <img src={team.logo} alt={team.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#e8b84b]/10 flex items-center justify-center text-[#e8b84b] text-xs font-black">
                              {team?.name?.[0]}
                            </div>
                          )}
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
    </div>
  );
}
