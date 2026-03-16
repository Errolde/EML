import { useApp } from '../context';
import { Trophy, Users, Calendar, Target, Star, Crown, ChevronRight, Shield } from 'lucide-react';
import { computeStandings, getAllMatchesFromMatchdays, getAvatarUrl } from '../utils/helpers';
import { Badge } from '../components/ui/Badge';

interface Props { setPage: (p: string) => void; currentUser: any; }

export function HomePage({ setPage, currentUser }: Props) {
  const { data } = useApp();

  const allMatches = getAllMatchesFromMatchdays(data.matchdays);
  const standings = data.teams.length > 0 ? computeStandings(data.teams, allMatches) : [];
  const topTeams = standings.slice(0, 3);

  const topScorers = [...data.users]
    .filter(u => u.role === 'player')
    .sort((a, b) => b.stats.goals - a.stats.goals)
    .slice(0, 5);
  const champion = data.knockout.championTeamId
    ? data.teams.find(t => t.id === data.knockout.championTeamId)
    : null;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070d17] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(30,58,95,0.2) 0%, transparent 70%), radial-gradient(ellipse at 80% 20%, rgba(232,184,75,0.05) 0%, transparent 50%)' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="relative text-center max-w-xl px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#e8b84b] to-[#c99a2e] shadow-2xl shadow-[#e8b84b]/20 mb-8">
            <Trophy size={38} className="text-[#0a0f1a]" />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tight leading-none">EML</h1>
          <p className="text-[#e8b84b] font-bold text-sm tracking-[0.22em] uppercase mt-2">European MamoBall League</p>
          <p className="text-white/35 italic text-base mt-2 font-light">Where Europe Competes</p>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#e8b84b]/40 to-transparent mx-auto my-6" />
          <p className="text-white/45 text-base leading-relaxed mb-10 max-w-md mx-auto">
            The European MamoBall League brings the best European teams together for structured and competitive play.
          </p>
          <button
            onClick={() => setPage('login')}
            className="px-8 py-3.5 bg-gradient-to-r from-[#e8b84b] to-[#d4a43a] text-[#0a0f1a] rounded-xl font-bold text-base hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-[#e8b84b]/20"
          >
            Enter the League
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#101f38] to-[#0a1628] p-8 border border-white/[0.08]">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 85% 50%, rgba(232,184,75,0.08) 0%, transparent 55%)' }} />
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #e8b84b 0%, transparent 70%)' }} />
        <div className="relative">
          {champion && (
            <div className="flex items-center gap-3 mb-4">
              <Crown className="text-[#e8b84b]" size={22} />
              <div>
                <p className="text-[#e8b84b]/70 text-xs font-bold uppercase tracking-widest">Current Champions</p>
                <h2 className="text-lg font-black text-white leading-tight">{champion.name}</h2>
              </div>
            </div>
          )}
          <h1 className="text-3xl font-black text-white mb-1">
            Welcome, <span className="text-[#e8b84b]">{currentUser.username}</span>
          </h1>
          <p className="text-white/40 text-sm">Season {data.seasonNumber} · {data.seasonActive ? 'Season In Progress' : 'Off Season'}</p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={() => setPage('matchdays')}
              className="px-4 py-2 bg-gradient-to-r from-[#e8b84b] to-[#d4a43a] text-[#0a0f1a] rounded-xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-[#e8b84b]/20"
            >
              View Matchdays
            </button>
            <button
              onClick={() => setPage('standings')}
              className="px-4 py-2 bg-white/[0.07] text-white/80 rounded-xl font-bold text-sm hover:bg-white/[0.12] border border-white/[0.08] transition-all"
            >
              Standings
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Shield size={18} />, label: 'Teams', value: data.teams.length, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/10' },
          { icon: <Users size={18} />, label: 'Players', value: data.users.filter(u => u.role === 'player').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10' },
          { icon: <Calendar size={18} />, label: 'Matchdays', value: data.matchdays.length, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/10' },
          { icon: <Target size={18} />, label: 'Played', value: allMatches.filter(m => m.played).length, color: 'text-[#e8b84b]', bg: 'bg-[#e8b84b]/10', border: 'border-[#e8b84b]/10' },
        ].map(stat => (
          <div key={stat.label} className={`bg-[#0f1923] border ${stat.border} rounded-xl p-4 flex items-center gap-3`}>
            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>{stat.icon}</div>
            <div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-white/35">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Top Standings */}
        <div className="bg-[#0f1923] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Trophy size={15} className="text-[#e8b84b]" />Standings
            </div>
            <button onClick={() => setPage('standings')} className="text-xs text-[#e8b84b]/70 hover:text-[#e8b84b] flex items-center gap-1 transition-colors">
              View All <ChevronRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {topTeams.length === 0 ? (
              <div className="px-5 py-10 text-center text-white/25 text-sm">No standings yet</div>
            ) : topTeams.map((s, i) => {
              const team = data.teams.find(t => t.id === s.teamId);
              return (
                <div key={s.teamId} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <span className={`w-5 text-sm font-black ${i === 0 ? 'text-[#e8b84b]' : 'text-white/30'}`}>{i + 1}</span>
                  {team?.logo ? (
                    <img src={team.logo} alt={team.name} className="w-7 h-7 rounded-lg object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-[#e8b84b]/15 flex items-center justify-center text-[#e8b84b] text-xs font-black">
                      {team?.name?.[0]}
                    </div>
                  )}
                  <span className="flex-1 font-semibold text-white/90 text-sm">{team?.name}</span>
                  <div className="text-right">
                    <span className="text-[#e8b84b] font-black text-sm">{s.points}pts</span>
                    <div className="text-[10px] text-white/25">{s.played}G · GD{s.goalDiff > 0 ? '+' : ''}{s.goalDiff}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Scorers */}
        <div className="bg-[#0f1923] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Star size={15} className="text-[#e8b84b]" />Top Scorers
            </div>
            <button onClick={() => setPage('players')} className="text-xs text-[#e8b84b]/70 hover:text-[#e8b84b] flex items-center gap-1 transition-colors">
              View All <ChevronRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {topScorers.length === 0 ? (
              <div className="px-5 py-10 text-center text-white/25 text-sm">No players yet</div>
            ) : topScorers.map((p, i) => {
              const team = p.teamId ? data.teams.find(t => t.id === p.teamId) : null;
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <span className={`w-5 text-sm font-black ${i === 0 ? 'text-[#e8b84b]' : 'text-white/30'}`}>{i + 1}</span>
                  <img src={getAvatarUrl(p.username, p.avatar)} alt={p.username} className="w-7 h-7 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white/90 text-sm truncate">{p.username}</div>
                    <div className="text-[10px] text-white/30 truncate">{team?.name || 'No team'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#e8b84b] font-black text-sm">{p.stats.goals}G</div>
                    <div className="text-[10px] text-white/30">{p.stats.assists}A</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent News */}
      {data.news.length > 0 && (
        <div className="bg-[#0f1923] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
            <div className="font-bold text-white text-sm">Latest News</div>
            <button onClick={() => setPage('news')} className="text-xs text-[#e8b84b]/70 hover:text-[#e8b84b] flex items-center gap-1 transition-colors">
              View All <ChevronRight size={11} />
            </button>
          </div>
          <div className="grid md:grid-cols-2 divide-y divide-white/[0.04] md:divide-y-0 md:divide-x md:divide-white/[0.04]">
            {data.news.slice(0, 2).map(article => {
              const author = data.users.find(u => u.id === article.authorId);
              const catColors: Record<string, any> = { 'Match Recap': 'green', 'Announcement': 'blue', 'Tournament Update': 'gold', 'Player Spotlight': 'purple' };
              return (
                <div key={article.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                  <Badge color={catColors[article.category] || 'gray'}>{article.category}</Badge>
                  <h3 className="font-bold text-white/90 mt-2 mb-1 text-sm">{article.title}</h3>
                  <p className="text-white/40 text-xs line-clamp-2">{article.content}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-white/25">
                    <img src={getAvatarUrl(author?.username || 'A', author?.avatar)} alt="" className="w-4 h-4 rounded-full" />
                    {author?.username}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
