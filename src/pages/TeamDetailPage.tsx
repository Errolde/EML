import { useApp } from '../context';
import { getAvatarUrl } from '../utils/helpers';
import { ArrowLeft, Shield, Crown, Users, Target, TrendingUp } from 'lucide-react';

interface Props { teamId: string; setPage: (p: string) => void; }

export function TeamDetailPage({ teamId, setPage }: Props) {
  const { data } = useApp();
  const team = data.teams.find(t => t.id === teamId);
  if (!team) return (
    <div className="text-center text-white/40 py-20">
      <Shield size={40} className="mx-auto mb-3 opacity-30" />
      <p>Team not found.</p>
      <button onClick={() => setPage('teams')} className="mt-4 text-[#e8b84b] hover:underline text-sm">← Back to Teams</button>
    </div>
  );

  const players = data.users.filter(u => u.teamId === team.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => setPage('teams')}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={16} /> Back to Teams
      </button>

      {/* Team Header */}
      <div className="bg-[#0f1923] border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-6">
          {team.logo ? (
            <img src={team.logo} alt={team.name} className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#e8b84b]/20 to-[#c99a2e]/10 border border-[#e8b84b]/20 flex items-center justify-center">
              <Shield size={40} className="text-[#e8b84b]" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black text-white">{team.name}</h1>
            {team.description && <p className="text-white/50 mt-1 text-sm max-w-lg">{team.description}</p>}
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-white/40 text-sm">
                <Users size={14} />
                {players.length} player{players.length !== 1 ? 's' : ''}
              </span>
              {team.emlChampionships > 0 && (
                <span className="flex items-center gap-1.5 text-[#e8b84b] text-sm font-semibold">
                  <Crown size={14} />
                  {team.emlChampionships} EML Title{team.emlChampionships !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="bg-[#0f1923] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <Users size={18} className="text-[#e8b84b]" />
          <h2 className="font-bold text-white">Roster</h2>
          <span className="ml-auto text-white/30 text-sm">{players.length} players</span>
        </div>
        {players.length === 0 ? (
          <div className="p-12 text-center text-white/30">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p>No players assigned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {players.map(player => (
              <button
                key={player.id}
                onClick={() => setPage(`profile_${player.id}`)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-all text-left"
              >
                <img
                  src={player.avatar || getAvatarUrl(player.username)}
                  alt={player.username}
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                <div className="flex-1">
                  <p className="font-semibold text-white">{player.username}</p>
                  {player.stats.emlChampionships > 0 && (
                    <p className="text-[#e8b84b] text-xs flex items-center gap-1">
                      <Crown size={10} /> {player.stats.emlChampionships}x Champion
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-white font-bold">{player.stats.goals}</div>
                    <div className="text-white/30 text-xs flex items-center gap-1"><Target size={10} />Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold">{player.stats.assists}</div>
                    <div className="text-white/30 text-xs flex items-center gap-1"><TrendingUp size={10} />Assists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold">{player.stats.matches}</div>
                    <div className="text-white/30 text-xs">Played</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
