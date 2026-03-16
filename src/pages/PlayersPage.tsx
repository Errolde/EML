import { useState } from 'react';
import React from 'react';
import { useApp } from '../context';
import { getAvatarUrl } from '../utils/helpers';
import { Users, Target, Zap, Trophy, Shield } from 'lucide-react';
interface Props { setPage: (p: string) => void; }

type SortKey = 'goals' | 'assists' | 'matches' | 'wins' | 'emlChampionships';

export function PlayersPage({ setPage }: Props) {
  const { data } = useApp();
  const [sortKey, setSortKey] = useState<SortKey>('goals');

  const players = data.users
    .filter(u => u.role === 'player')
    .sort((a, b) => b.stats[sortKey] - a.stats[sortKey]);

  const tabs: { key: SortKey; label: string; icon: React.ReactNode }[] = [
    { key: 'goals', label: 'Goals', icon: <Target size={14} /> },
    { key: 'assists', label: 'Assists', icon: <Zap size={14} /> },
    { key: 'matches', label: 'Matches', icon: <Shield size={14} /> },
    { key: 'wins', label: 'Wins', icon: <Trophy size={14} /> },
    { key: 'emlChampionships', label: 'Titles', icon: <Trophy size={14} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Users size={22} className="text-[#e8b84b]" />Players</h1>
        <p className="text-white/40 text-sm mt-1">{players.length} registered players</p>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setSortKey(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              sortKey === t.key ? 'bg-[#e8b84b] text-[#0a0f1a]' : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {players.length === 0 ? (
        <div className="bg-[#0f1923] border border-white/10 rounded-xl p-12 text-center text-white/30">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No players yet.</p>
        </div>
      ) : (
        <div className="bg-[#0f1923] border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-8">#</th>
                  <th className="px-4 py-3 text-left">Player</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-3 py-3 text-center">MP</th>
                  <th className="px-3 py-3 text-center">W</th>
                  <th className="px-3 py-3 text-center">G</th>
                  <th className="px-3 py-3 text-center">A</th>
                  <th className="px-3 py-3 text-center">🏆</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {players.map((p, i) => {
                  const team = p.teamId ? data.teams.find(t => t.id === p.teamId) : null;
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`font-black ${i === 0 ? 'text-[#e8b84b]' : i === 1 ? 'text-white/60' : i === 2 ? 'text-amber-700' : 'text-white/30'} text-sm`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setPage(`player_${p.id}`)}
                          className="flex items-center gap-3 group"
                        >
                          <img src={getAvatarUrl(p.username, p.avatar)} alt={p.username} className="w-9 h-9 rounded-full object-cover" />
                          <div className="text-left">
                            <div className="font-semibold text-white group-hover:text-[#e8b84b] transition-colors">{p.username}</div>
                            {p.stats.emlChampionships > 0 && (
                              <div className="text-xs text-[#e8b84b]">{'🏆'.repeat(p.stats.emlChampionships)}</div>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {team ? (
                          <div className="flex items-center gap-2">
                            {team.logo ? (
                              <img src={team.logo} alt={team.name} className="w-6 h-6 rounded object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded bg-[#e8b84b]/10 flex items-center justify-center text-[#e8b84b] text-xs font-bold">{team.name[0]}</div>
                            )}
                            <span className="text-white/70 text-sm">{team.name}</span>
                          </div>
                        ) : <span className="text-white/30 text-sm">—</span>}
                      </td>
                      <td className="px-3 py-3 text-center text-white/70">{p.stats.matches}</td>
                      <td className="px-3 py-3 text-center text-emerald-400">{p.stats.wins}</td>
                      <td className={`px-3 py-3 text-center font-bold ${sortKey === 'goals' ? 'text-[#e8b84b]' : 'text-white/70'}`}>{p.stats.goals}</td>
                      <td className={`px-3 py-3 text-center font-bold ${sortKey === 'assists' ? 'text-[#e8b84b]' : 'text-white/70'}`}>{p.stats.assists}</td>
                      <td className="px-3 py-3 text-center text-[#e8b84b]">{p.stats.emlChampionships || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
