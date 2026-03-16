import { useState } from 'react';
import { useApp } from '../context';
import { getAvatarUrl } from '../utils/helpers';
import { Shield, Users, Search, Crown } from 'lucide-react';

interface Props { setPage: (p: string) => void; }

export function TeamsPage({ setPage }: Props) {
  const { data } = useApp();
  const [search, setSearch] = useState('');

  const teams = data.teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Shield size={22} className="text-[#e8b84b]" />Teams</h1>
          <p className="text-white/40 text-sm mt-1">{data.teams.length} teams</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            placeholder="Search teams..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#e8b84b]/40"
          />
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="bg-[#0f1923] border border-white/10 rounded-xl p-12 text-center text-white/30">
          <Shield size={40} className="mx-auto mb-3 opacity-30" />
          <p>No teams yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {teams.map(team => {
            const players = data.users.filter(u => u.teamId === team.id);
            return (
              <button
                key={team.id}
                onClick={() => setPage(`team_${team.id}`)}
                className="bg-[#0f1923] border border-white/10 rounded-xl p-5 text-left hover:border-[#e8b84b]/30 hover:bg-[#e8b84b]/5 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-14 h-14 rounded-xl object-cover shadow-lg" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#e8b84b]/20 to-[#e8b84b]/5 flex items-center justify-center text-[#e8b84b] text-2xl font-black border border-[#e8b84b]/20">
                      {team.name[0]}
                    </div>
                  )}
                  {team.emlChampionships > 0 && (
                    <Crown size={14} className="text-[#e8b84b]" />
                  )}
                </div>
                <h3 className="font-bold text-white group-hover:text-[#e8b84b] transition-colors">{team.name}</h3>
                {team.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{team.description}</p>}
                <div className="flex items-center gap-2 mt-3 text-xs text-white/40">
                  <Users size={12} />
                  {players.length} players
                  {team.emlChampionships > 0 && (
                    <span className="ml-auto text-[#e8b84b] font-bold">🏆 ×{team.emlChampionships}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {players.slice(0, 4).map(p => (
                    <img key={p.id} src={getAvatarUrl(p.username, p.avatar)} alt={p.username} className="w-6 h-6 rounded-full object-cover border border-white/10" title={p.username} />
                  ))}
                  {players.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50">+{players.length - 4}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
