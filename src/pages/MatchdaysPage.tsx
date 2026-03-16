import { useState } from 'react';
import { useApp } from '../context';
import { formatDate } from '../utils/helpers';
import { Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Props { setPage: (p: string) => void; }

export function MatchdaysPage({ setPage }: Props) {
  const { data } = useApp();
  const [expanded, setExpanded] = useState<string | null>(data.matchdays[data.matchdays.length - 1]?.id || null);

  const sorted = [...data.matchdays].sort((a, b) => a.number - b.number);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Calendar size={22} className="text-[#e8b84b]" />Matchdays</h1>
        <p className="text-white/40 text-sm mt-1">Season {data.seasonNumber} fixtures</p>
      </div>

      {/* Knockout if active */}
      {data.knockout?.active && (
        <div className="bg-[#1a0f30] border border-purple-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 text-purple-300 font-bold mb-1">
            🏆 Knockout Stage Active
          </div>
          <p className="text-white/50 text-sm">The playoff knockout bracket is underway!</p>
          <button onClick={() => setPage('knockout')} className="mt-3 text-sm text-purple-300 hover:text-purple-200 underline">
            View Bracket →
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="bg-[#0f1923] border border-white/10 rounded-xl p-12 text-center text-white/30">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p>No matchdays scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(md => {
            const isOpen = expanded === md.id;
            const played = md.matches.filter(m => m.played).length;
            return (
              <div key={md.id} className="bg-[#0f1923] border border-white/10 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : md.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#e8b84b]/10 flex items-center justify-center text-[#e8b84b] font-black text-sm">
                      {md.number}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">Matchday {md.number}</div>
                      <div className="text-xs text-white/40">{played}/{md.matches.length} matches played</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      played === md.matches.length && md.matches.length > 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : played > 0
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-white/10 text-white/40'
                    }`}>
                      {played === md.matches.length && md.matches.length > 0 ? 'Complete' : played > 0 ? 'In Progress' : 'Upcoming'}
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 divide-y divide-white/5">
                    {md.matches.length === 0 ? (
                      <div className="px-5 py-4 text-white/30 text-sm">No matches</div>
                    ) : md.matches.map(match => {
                      const home = data.teams.find(t => t.id === match.homeTeamId);
                      const away = data.teams.find(t => t.id === match.awayTeamId);
                      return (
                        <div key={match.id} className={`px-5 py-4 flex items-center ${match.played ? 'bg-white/2' : ''}`}>
                          {/* Home */}
                          <div className="flex-1 flex items-center gap-2 justify-end">
                            <span className="font-semibold text-white text-sm">{home?.name}</span>
                            {home?.logo ? (
                              <img src={home.logo} alt={home.name} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-[#e8b84b]/10 flex items-center justify-center text-[#e8b84b] text-xs font-bold">
                                {home?.name?.[0]}
                              </div>
                            )}
                          </div>

                          {/* Score / vs */}
                          <div className="px-4 text-center min-w-[80px]">
                            {match.played ? (
                              <div className="text-xl font-black text-white">
                                {match.homeScore} – {match.awayScore}
                              </div>
                            ) : (
                              <div className="text-white/40 text-sm font-bold">VS</div>
                            )}
                            <div className="flex items-center justify-center gap-1 text-white/30 text-xs mt-0.5">
                              <Calendar size={10} />
                              {formatDate(match.date)}
                              {match.time && <><Clock size={10} />{match.time}</>}
                            </div>
                          </div>

                          {/* Away */}
                          <div className="flex-1 flex items-center gap-2">
                            {away?.logo ? (
                              <img src={away.logo} alt={away.name} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-300 text-xs font-bold">
                                {away?.name?.[0]}
                              </div>
                            )}
                            <span className="font-semibold text-white text-sm">{away?.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
