import { useApp } from '../context';
import { getAvatarUrl } from '../utils/helpers';
import { Award, Trophy, Check, Lock } from 'lucide-react';
import { supabase } from '../supabase';

interface Props { setPage: (p: string) => void; }

export function AwardsPage({ setPage }: Props) {
  const { data, currentUser, showToast } = useApp();

  async function vote(categoryId: string, nomineeUserId: string) {
    if (!currentUser) return;
    const category = data.awards.find(a => a.id === categoryId);
    if (!category || category.closed) { showToast('Voting is closed for this category', 'error'); return; }
    if (category.deadline && Date.now() > category.deadline) { showToast('Voting deadline has passed', 'error'); return; }

    const newNominees = category.nominees.map(n => ({
      ...n,
      votes: n.userId === nomineeUserId
        ? n.votes.includes(currentUser.id) ? n.votes.filter(id => id !== currentUser.id) : [...n.votes, currentUser.id]
        : n.votes.filter(id => id !== currentUser.id),
    }));

    await supabase.from('awards').update({ nominees: newNominees }).eq('id', categoryId);
    showToast('Vote recorded!');
  }

  if (data.awards.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Award size={22} className="text-[#e8b84b]" />Awards</h1>
        </div>
        <div className="bg-[#0f1923] border border-white/10 rounded-xl p-12 text-center text-white/30">
          <Award size={40} className="mx-auto mb-3 opacity-30" />
          <p>No awards yet. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Award size={22} className="text-[#e8b84b]" />Awards & Voting</h1>
        <p className="text-white/40 text-sm mt-1">{data.awards.length} categor{data.awards.length !== 1 ? 'ies' : 'y'}</p>
      </div>

      <div className="grid gap-6">
        {data.awards.map(category => {
          const isClosed = category.closed || (category.deadline ? Date.now() > category.deadline : false);
          const myVote = currentUser ? category.nominees.find(n => n.votes.includes(currentUser.id))?.userId : null;
          const maxVotes = Math.max(...category.nominees.map(n => n.votes.length), 0);
          const winners = isClosed ? category.nominees.filter(n => n.votes.length === maxVotes && maxVotes > 0) : [];

          return (
            <div key={category.id} className="bg-[#0f1923] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award size={18} className="text-[#e8b84b]" />
                  <h2 className="font-bold text-white text-lg">{category.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {isClosed && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 text-white/50 px-3 py-1.5 rounded-lg">
                      <Lock size={11} /> Closed
                    </span>
                  )}
                  {category.deadline && !isClosed && (
                    <span className="text-xs text-white/40">
                      Ends {new Date(category.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {category.nominees.length === 0 ? (
                <div className="p-8 text-center text-white/30 text-sm">No nominees yet.</div>
              ) : (
                <div className="p-6 grid gap-3">
                  {category.nominees
                    .sort((a, b) => isClosed ? b.votes.length - a.votes.length : 0)
                    .map(nominee => {
                      const user = data.users.find(u => u.id === nominee.userId);
                      if (!user) return null;
                      const isWinner = isClosed && winners.some(w => w.userId === nominee.userId);
                      const isMyVote = myVote === nominee.userId;
                      const votePercent = isClosed && maxVotes > 0 ? (nominee.votes.length / maxVotes) * 100 : 0;

                      return (
                        <div
                          key={nominee.userId}
                          className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all ${
                            isWinner
                              ? 'bg-[#e8b84b]/10 border-[#e8b84b]/40'
                              : isMyVote
                              ? 'bg-blue-500/10 border-blue-500/30'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          {isWinner && (
                            <div className="absolute top-2 right-2">
                              <Trophy size={14} className="text-[#e8b84b]" />
                            </div>
                          )}
                          {isClosed && (
                            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-white/3 transition-all"
                                style={{ width: `${votePercent}%` }}
                              />
                            </div>
                          )}
                          <img
                            src={user.avatar || getAvatarUrl(user.username)}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/10 relative z-10 cursor-pointer"
                            onClick={() => setPage(`profile_${user.id}`)}
                          />
                          <div className="flex-1 relative z-10">
                            <button onClick={() => setPage(`profile_${user.id}`)} className="font-bold text-white hover:text-[#e8b84b] transition-colors">
                              {user.username}
                            </button>
                            {isWinner && <div className="text-[#e8b84b] text-xs font-semibold">🏆 Winner</div>}
                            <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                              <span>{user.stats?.goals ?? 0}G</span>
                              <span>{user.stats?.assists ?? 0}A</span>
                              {user.stats?.emlChampionships > 0 && <span>{user.stats.emlChampionships}× Champion</span>}
                            </div>
                          </div>
                          {isClosed ? (
                            <div className="text-white font-bold text-lg relative z-10">{nominee.votes.length}</div>
                          ) : (
                            !isClosed && currentUser && (
                              <button
                                onClick={() => vote(category.id, nominee.userId)}
                                className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                  isMyVote
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : 'bg-white/10 text-white hover:bg-[#e8b84b]/20 hover:text-[#e8b84b]'
                                }`}
                              >
                                {isMyVote && <Check size={14} />}
                                {isMyVote ? 'Voted' : 'Vote'}
                              </button>
                            )
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}