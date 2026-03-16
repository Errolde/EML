import { useState, useRef } from 'react';
import { useApp } from '../context';
import { getAvatarUrl } from '../utils/helpers';
import { ArrowLeft, Crown, Target, TrendingUp, Shield, Edit3, Save, X, Camera } from 'lucide-react';

interface Props { userId: string; setPage: (p: string) => void; }

export function ProfilePage({ userId, setPage }: Props) {
  const { data, update, currentUser, showToast } = useApp();
  const user = data.users.find(u => u.id === userId);
  const isOwn = currentUser?.id === userId;
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return (
    <div className="text-center text-white/40 py-20">
      <p>User not found.</p>
      <button onClick={() => setPage('home')} className="mt-4 text-[#e8b84b] hover:underline text-sm">← Home</button>
    </div>
  );

  const team = user.teamId ? data.teams.find(t => t.id === user.teamId) : null;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function saveProfile() {
    if (!user) return;
    if (!username.trim()) { showToast('Username cannot be empty', 'error'); return; }
    if (username !== user.username && data.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== userId)) {
      showToast('Username already taken', 'error'); return;
    }
    if (password && password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    const updated = data.users.map(u => u.id === userId ? {
      ...u,
      username: username.trim(),
      ...(password ? { password } : {}),
      ...(avatar !== user.avatar ? { avatar } : {}),
    } : u);
    update({ ...data, users: updated });
    showToast('Profile updated!');
    setEditing(false);
    setPassword('');
  }

  const stats = [
    { label: 'Matches', value: user.stats.matches, icon: Shield },
    { label: 'Wins', value: user.stats.wins, icon: Crown },
    { label: 'Goals', value: user.stats.goals, icon: Target },
    { label: 'Assists', value: user.stats.assists, icon: TrendingUp },
    { label: 'EML Titles', value: user.stats.emlChampionships, icon: Crown, gold: true },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => setPage('home')} className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile Card */}
      <div className="bg-[#0f1923] border border-white/10 rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-[#1e3a5f] to-[#0a1628]" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <img
                src={editing ? (avatar || getAvatarUrl(username)) : (user.avatar || getAvatarUrl(user.username))}
                alt={user.username}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-[#0f1923]"
              />
              {editing && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center hover:bg-black/70 transition-all"
                >
                  <Camera size={20} className="text-white" />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            {isOwn && !editing && (
              <button
                onClick={() => { setEditing(true); setUsername(user.username); setAvatar(user.avatar || ''); }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Username</label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e8b84b]/50"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New password..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e8b84b]/50"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveProfile} className="flex items-center gap-2 px-4 py-2 bg-[#e8b84b] text-[#0a0f1a] rounded-xl text-sm font-bold hover:bg-[#f0c86a] transition-all">
                  <Save size={14} /> Save
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all">
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-black text-white">{user.username}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                  {user.role === 'admin' ? 'Admin' : 'Player'}
                </span>
                {team && (
                  <button onClick={() => setPage(`team_${team.id}`)} className="flex items-center gap-1.5 text-white/50 text-sm hover:text-[#e8b84b] transition-colors">
                    <Shield size={12} /> {team.name}
                  </button>
                )}
                {user.stats.emlChampionships > 0 && (
                  <span className="flex items-center gap-1 text-[#e8b84b] text-sm font-bold">
                    <Crown size={12} /> {user.stats.emlChampionships}x Champion
                  </span>
                )}
              </div>
              <p className="text-white/30 text-xs mt-2">Member since {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {user.role === 'player' && (
        <div className="bg-[#0f1923] border border-white/10 rounded-2xl p-6">
          <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider text-white/50">Career Statistics</h2>
          <div className="grid grid-cols-5 gap-3">
            {stats.map(s => (
              <div key={s.label} className={`text-center p-3 rounded-xl ${s.gold ? 'bg-[#e8b84b]/10 border border-[#e8b84b]/20' : 'bg-white/5'}`}>
                <div className={`text-2xl font-black ${s.gold ? 'text-[#e8b84b]' : 'text-white'}`}>{s.value}</div>
                <div className="text-white/40 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team */}
      {team && (
        <div className="bg-[#0f1923] border border-white/10 rounded-2xl p-6">
          <h2 className="font-bold text-white mb-4 text-sm uppercase tracking-wider text-white/50">Current Team</h2>
          <button
            onClick={() => setPage(`team_${team.id}`)}
            className="flex items-center gap-4 hover:bg-white/5 rounded-xl p-3 -mx-3 w-full text-left transition-all"
          >
            {team.logo ? (
              <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#e8b84b]/10 border border-[#e8b84b]/20 flex items-center justify-center">
                <Shield size={22} className="text-[#e8b84b]" />
              </div>
            )}
            <div>
              <p className="font-bold text-white">{team.name}</p>
              {team.emlChampionships > 0 && (
                <p className="text-[#e8b84b] text-xs flex items-center gap-1"><Crown size={10} /> {team.emlChampionships}x EML Champion</p>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
