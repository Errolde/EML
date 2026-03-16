import { supabase } from '../supabase';
import { useState, useRef } from 'react';
import { useApp } from '../context';
import { generateId, getDefaultStats, loadData } from '../store';
import { getAvatarUrl, computeStandings, getAllMatchesFromMatchdays, getRoundName } from '../utils/helpers';
import {
  LayoutDashboard, Shield, Users, Calendar, Newspaper, Award, MessageSquare,
  Plus, Trash2, Edit3, Save, X, Trophy, RefreshCw,
  Shuffle, Play, Square, Camera, BarChart3, Send,
} from 'lucide-react';
import { Team, Match, Matchday, NewsArticle, AwardCategory, KnockoutRound, KnockoutMatch, Group } from '../types';
import { Select } from '../components/ui/Select';

type AdminTab = 'teams' | 'groups' | 'assign' | 'stats' | 'matchdays' | 'news' | 'awards' | 'chats' | 'knockout';

interface Props { setPage: (p: string) => void; }

export function AdminPage({ setPage }: Props) {
  const [tab, setTab] = useState<AdminTab>('teams');
  const [mobileTabOpen, setMobileTabOpen] = useState(false);

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'teams', label: 'Teams', icon: <Shield size={14} /> },
    { id: 'groups', label: 'Groups', icon: <LayoutDashboard size={14} /> },
    { id: 'assign', label: 'Assign Players', icon: <Users size={14} /> },
    { id: 'stats', label: 'Player Stats', icon: <BarChart3 size={14} /> },
    { id: 'matchdays', label: 'Matchdays', icon: <Calendar size={14} /> },
    { id: 'knockout', label: 'Knockout', icon: <Trophy size={14} /> },
    { id: 'news', label: 'News', icon: <Newspaper size={14} /> },
    { id: 'awards', label: 'Awards', icon: <Award size={14} /> },
    { id: 'chats', label: 'Chats', icon: <MessageSquare size={14} /> },
  ];

  const currentTab = tabs.find(t => t.id === tab)!;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <LayoutDashboard size={20} className="text-purple-400" />Admin Dashboard
        </h1>
        <p className="text-white/40 text-sm mt-1">Manage all aspects of the EML</p>
      </div>

      {/* Mobile: dropdown tab selector */}
      <div className="sm:hidden">
        <button
          onClick={() => setMobileTabOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#c084fc' }}
        >
          <span className="flex items-center gap-2">{currentTab.icon} {currentTab.label}</span>
          <span style={{ fontSize: 10 }}>▼</span>
        </button>
        {mobileTabOpen && (
          <div className="mt-1 rounded-xl overflow-hidden"
            style={{ background: 'rgba(8,13,24,0.98)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setMobileTabOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all text-left"
                style={{
                  background: tab === t.id ? 'rgba(168,85,247,0.15)' : 'transparent',
                  color: tab === t.id ? '#c084fc' : 'rgba(255,255,255,0.6)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: horizontal tabs */}
      <div className="hidden sm:flex flex-wrap gap-1.5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={tab === t.id
              ? { background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => { if (tab !== t.id) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; } }}
            onMouseLeave={e => { if (tab !== t.id) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; } }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'teams' && <TeamsAdmin setPage={setPage} />}
        {tab === 'groups' && <GroupsAdmin />}
        {tab === 'assign' && <AssignAdmin setPage={setPage} />}
        {tab === 'stats' && <StatsAdmin setPage={setPage} />}
        {tab === 'matchdays' && <MatchdaysAdmin />}
        {tab === 'knockout' && <KnockoutAdmin setPage={setPage} />}
        {tab === 'news' && <NewsAdmin />}
        {tab === 'awards' && <AwardsAdmin setPage={setPage} />}
        {tab === 'chats' && <ChatsAdmin />}
      </div>
    </div>
  );
}

/* ── Shared card style ── */
const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
};
const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#e8b84b]/40 placeholder-white/25 transition-colors";

/* ==================== TEAMS ADMIN ==================== */
function TeamsAdmin({ setPage }: { setPage: (p: string) => void }) {
  const { data, update, showToast } = useApp();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function createTeam() {
  if (!name.trim()) { showToast('Team name required', 'error'); return; }
  if (data.teams.find(t => t.name.toLowerCase() === name.toLowerCase())) { showToast('Team name already taken', 'error'); return; }
  const { error } = await supabase.from('teams').insert({
    name: name.trim(), description, logo, player_ids: [], eml_championships: 0, created_at: Date.now()
  });
  if (error) { showToast('Failed to create team', 'error'); return; }
  showToast(`Team "${name}" created!`);
  setName(''); setDescription(''); setLogo(''); setCreating(false);
}

async function deleteTeam(teamId: string) {
  if (!confirm('Delete this team? Players will be removed from it.')) return;
  await supabase.from('teams').delete().eq('id', teamId);
  await supabase.from('profiles').update({ team_id: null }).eq('team_id', teamId);
  showToast('Team deleted');
}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white text-base sm:text-lg">Teams ({data.teams.length})</h2>
        <button onClick={() => setCreating(!creating)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#0a0f1a' }}>
          <Plus size={14} /> New Team
        </button>
      </div>

      {creating && (
        <div className="p-4 sm:p-5 space-y-3" style={card}>
          <h3 className="font-semibold text-white text-sm">Create New Team</h3>
          <div className="flex items-start gap-3 sm:gap-4">
            <button onClick={() => fileRef.current?.click()}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px dashed rgba(255,255,255,0.15)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,184,75,0.4)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'}>
              {logo ? <img src={logo} className="w-full h-full object-cover rounded-xl" alt="" /> : <Camera size={18} style={{ color: 'rgba(255,255,255,0.25)' }} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <div className="flex-1 space-y-2">
              <input placeholder="Team name*" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
              <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createTeam} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#0a0f1a' }}>
              <Save size={13} /> Create
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-2.5">
        {data.teams.map(team => {
          const players = data.users.filter(u => u.teamId === team.id);
          return (
            <div key={team.id} className="flex items-center gap-3 p-3 sm:p-4 transition-all rounded-2xl"
              style={{ ...card, background: 'rgba(255,255,255,0.03)' }}>
              {team.logo
                ? <img src={team.logo} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(232,184,75,0.1)' }}>
                    <Shield size={18} style={{ color: '#e8b84b' }} />
                  </div>}
              <div className="flex-1 min-w-0">
                <button onClick={() => setPage(`team_${team.id}`)} className="font-bold text-white text-sm hover:text-[#e8b84b] transition-colors truncate block">
                  {team.name}
                </button>
                <p className="text-white/40 text-xs mt-0.5">
                  {players.length} players{team.emlChampionships > 0 ? ` · ${team.emlChampionships}× Champion` : ''}
                </p>
              </div>
              <button onClick={() => deleteTeam(team.id)}
                className="p-2 rounded-xl transition-all flex-shrink-0"
                style={{ color: 'rgba(248,113,113,0.4)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.4)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        {data.teams.length === 0 && (
          <div className="py-12 text-center rounded-2xl" style={card}>
            <Shield size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-white/30 text-sm">No teams yet. Create your first team!</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== GROUPS ADMIN ==================== */
function GroupsAdmin() {
  const { data, update, showToast } = useApp();
  const gs = data.groupStage;
  const [numGroups, setNumGroups] = useState(gs?.groups.length || 4);
  const [qualPerGroup, setQualPerGroup] = useState(gs?.qualifiersPerGroup || 2);

  function initGroups() {
    const groups: Group[] = Array.from({ length: numGroups }, (_, i) => ({
      id: generateId(), name: `Group ${String.fromCharCode(65 + i)}`, teamIds: [],
    }));
    update({ ...data, groupStage: { groups, qualifiersPerGroup: qualPerGroup, matchdays: [], active: true } });
    showToast('Group stage initialized!');
  }

  function assignTeamToGroup(groupId: string, teamId: string) {
    if (!gs || !teamId) return;
    const alreadyIn = gs.groups.find(g => g.teamIds.includes(teamId));
    if (alreadyIn && alreadyIn.id !== groupId) {
      update({ ...data, groupStage: { ...gs, groups: gs.groups.map(g => ({ ...g, teamIds: g.id === alreadyIn.id ? g.teamIds.filter(id => id !== teamId) : g.id === groupId ? [...g.teamIds, teamId] : g.teamIds })) } });
    } else if (!alreadyIn) {
      update({ ...data, groupStage: { ...gs, groups: gs.groups.map(g => g.id === groupId ? { ...g, teamIds: [...g.teamIds, teamId] } : g) } });
    }
  }

  function removeFromGroup(groupId: string, teamId: string) {
    if (!gs) return;
    update({ ...data, groupStage: { ...gs, groups: gs.groups.map(g => g.id === groupId ? { ...g, teamIds: g.teamIds.filter(id => id !== teamId) } : g) } });
  }

  function randomize() {
    if (!gs) return;
    const all = [...data.teams.map(t => t.id)].sort(() => Math.random() - 0.5);
    const newGroups = gs.groups.map(g => ({ ...g, teamIds: [] as string[] }));
    all.forEach((tid, i) => { newGroups[i % newGroups.length].teamIds.push(tid); });
    update({ ...data, groupStage: { ...gs, groups: newGroups } });
    showToast('Teams randomized!');
  }

  function autoGenerateMatchdays() {
    if (!gs) return;
    const matchdays: Matchday[] = [];
    let dayNum = 1;
    const today = new Date();
    gs.groups.forEach(group => {
      const teams = group.teamIds;
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const d = new Date(today);
          d.setDate(d.getDate() + dayNum);
          const match: Match = { id: generateId(), homeTeamId: teams[i], awayTeamId: teams[j], played: false, date: d.toISOString().split('T')[0], groupId: group.id };
          const existing = matchdays.find(md => !md.matches.some(m => m.homeTeamId === teams[i] || m.awayTeamId === teams[i] || m.homeTeamId === teams[j] || m.awayTeamId === teams[j]));
          if (existing) { existing.matches.push(match); }
          else { matchdays.push({ id: generateId(), number: dayNum++, matches: [match], createdAt: Date.now() }); }
        }
      }
    });
    update({ ...data, groupStage: { ...gs, matchdays } });
    showToast(`Generated ${matchdays.length} matchdays!`);
  }

  function resetGroups() {
    if (!confirm('Reset group stage?')) return;
    update({ ...data, groupStage: undefined });
  }

  const unassigned = data.teams.filter(t => !gs?.groups.some(g => g.teamIds.includes(t.id)));

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-white text-base sm:text-lg">Group Stage</h2>
      {!gs ? (
        <div className="p-5 space-y-4" style={card}>
          <h3 className="font-semibold text-white text-sm">Initialize Group Stage</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs block mb-1.5">Number of Groups</label>
              <Select
                value={String(numGroups)}
                onChange={v => setNumGroups(Number(v))}
                options={[2,3,4,5,6,7,8].map(n => ({ value: String(n), label: String(n) }))}
              />
            </div>
            <div>
              <label className="text-white/40 text-xs block mb-1.5">Qualifiers per Group</label>
              <Select
                value={String(qualPerGroup)}
                onChange={v => setQualPerGroup(Number(v))}
                options={[1,2,3,4].map(n => ({ value: String(n), label: String(n) }))}
              />
            </div>
          </div>
          <button onClick={initGroups} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#0a0f1a' }}>
            <Play size={14} /> Initialize Groups
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <BtnSecondary icon={<Shuffle size={13} />} label="Randomize" color="blue" onClick={randomize} />
            <BtnSecondary icon={<Calendar size={13} />} label="Auto Matchdays" color="purple" onClick={autoGenerateMatchdays} />
            <BtnSecondary icon={<X size={13} />} label="Reset" color="red" onClick={resetGroups} />
          </div>

          {unassigned.length > 0 && (
            <div className="p-4 space-y-3" style={card}>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Unassigned Teams</p>
              <div className="flex flex-col gap-2">
                {unassigned.map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="text-white/80 text-sm flex-1 min-w-0 truncate">{t.name}</span>
                    <Select
                      value=""
                      onChange={v => assignTeamToGroup(v, t.id)}
                      options={gs.groups.map(g => ({ value: g.id, label: g.name }))}
                      placeholder="Assign to group..."
                      className="w-44"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {gs.groups.map(group => {
              const teams = data.teams.filter(t => group.teamIds.includes(t.id));
              return (
                <div key={group.id} className="p-4" style={card}>
                  <h3 className="font-bold text-white mb-3 text-sm">{group.name}</h3>
                  <div className="space-y-2">
                    {teams.map(t => (
                      <div key={t.id} className="flex items-center gap-2">
                        <span className="text-white/80 text-sm flex-1 truncate">{t.name}</span>
                        <button onClick={() => removeFromGroup(group.id, t.id)}
                          className="p-1 rounded-lg transition-all" style={{ color: 'rgba(248,113,113,0.5)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.5)'}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {teams.length === 0 && <p className="text-white/25 text-xs">No teams assigned</p>}
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

/* ==================== ASSIGN ADMIN ==================== */
function AssignAdmin({ setPage }: { setPage: (p: string) => void }) {
  const { data, showToast } = useApp();
  const players = data.users.filter(u => u.role === 'player');

  async function assignToTeam(userId: string, teamId: string) {
    await supabase.from('profiles').update({ team_id: teamId || null }).eq('id', userId);
    if (teamId) {
      const team = data.teams.find(t => t.id === teamId);
      const newPlayerIds = [...(team?.playerIds ?? []).filter((id: string) => id !== userId), userId];
      await supabase.from('teams').update({ player_ids: newPlayerIds }).eq('id', teamId);
    }
    const oldTeam = data.teams.find(t => t.playerIds?.includes(userId));
    if (oldTeam && oldTeam.id !== teamId) {
      await supabase.from('teams').update({ player_ids: oldTeam.playerIds.filter((id: string) => id !== userId) }).eq('id', oldTeam.id);
    }
    showToast(teamId ? 'Assigned to team!' : 'Removed from team');
  }

  const teamOptions = [{ value: '', label: 'No team' }, ...data.teams.map(t => ({ value: t.id, label: t.name }))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white text-base sm:text-lg">Assign Players ({players.length})</h2>
      </div>

      {/* Roster grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.teams.map(team => {
          const teamPlayers = data.users.filter(u => u.teamId === team.id);
          return (
            <div key={team.id} className="p-4" style={card}>
              <div className="flex items-center gap-2 mb-3">
                {team.logo ? <img src={team.logo} alt="" className="w-7 h-7 rounded-lg object-cover" /> : <Shield size={16} style={{ color: '#e8b84b' }} />}
                <span className="font-bold text-white text-sm truncate flex-1">{team.name}</span>
                <span className="text-white/30 text-xs">{teamPlayers.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {teamPlayers.map(p => (
                  <button key={p.id} onClick={() => setPage(`profile_${p.id}`)}
                    className="text-xs px-2 py-1 rounded-lg transition-all"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,184,75,0.15)'; (e.currentTarget as HTMLElement).style.color = '#e8b84b'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}>
                    {p.username}
                  </button>
                ))}
                {teamPlayers.length === 0 && <span className="text-white/20 text-xs">Empty</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Player assignment list */}
      <div style={card} className="overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07]">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">All Players</p>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {players.map((player, idx) => {
            const isLast = idx >= players.length - 3;
            return (
              <div key={player.id} className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setPage(`profile_${player.id}`)} className="flex items-center gap-2.5 flex-1 min-w-0">
                  <img src={player.avatar || getAvatarUrl(player.username)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" style={{ border: '1.5px solid rgba(255,255,255,0.1)' }} />
                  <div className="min-w-0 text-left">
                    <p className="text-white text-sm font-medium truncate hover:text-[#e8b84b] transition-colors">{player.username}</p>
                    <p className="text-white/35 text-xs truncate">{player.teamId ? data.teams.find(t => t.id === player.teamId)?.name || 'Unknown' : 'No team'}</p>
                  </div>
                </button>
                {/* Native select instead of custom Select to avoid dropdown going off screen */}
                <select
                  value={player.teamId || ''}
                  onChange={e => assignToTeam(player.id, e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: 'white',
                    padding: '6px 10px',
                    fontSize: 12,
                    width: 150,
                    flexShrink: 0,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {teamOptions.map(opt => (
                    <option key={opt.value} value={opt.value} style={{ background: '#0d1520' }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          {players.length === 0 && (
            <div className="px-4 py-10 text-center">
              <Users size={28} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="text-white/30 text-sm">No players yet. Players will appear here once they register.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );


/* ==================== STATS ADMIN ==================== */
function StatsAdmin({ setPage }: { setPage: (p: string) => void }) {
  const { data, update, showToast } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [editVals, setEditVals] = useState<Record<string, number>>({});
  const players = data.users.filter(u => u.role === 'player');

  function startEdit(userId: string) {
    const user = data.users.find(u => u.id === userId);
    if (!user) return;
    setEditVals({ matches: user.stats.matches, wins: user.stats.wins, goals: user.stats.goals, assists: user.stats.assists, emlChampionships: user.stats.emlChampionships });
    setEditing(userId);
  }

 async function saveEdit(userId: string) {
  await supabase.from('profiles').update({
    stats: {
      matches: editVals.matches || 0,
      wins: editVals.wins || 0,
      goals: editVals.goals || 0,
      assists: editVals.assists || 0,
      emlChampionships: editVals.emlChampionships || 0,
    }
  }).eq('id', userId);
  showToast('Stats updated!');
  setEditing(null);
}

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-white text-base sm:text-lg">Player Statistics ({players.length})</h2>

      {/* Mobile: card layout */}
      <div className="sm:hidden space-y-3">
        {players.map(player => {
          const isEditing = editing === player.id;
          return (
            <div key={player.id} className="p-4 space-y-3" style={card}>
              <div className="flex items-center gap-3">
                <button onClick={() => setPage(`profile_${player.id}`)}>
                  <img src={player.avatar || getAvatarUrl(player.username)} alt="" className="w-9 h-9 rounded-full object-cover" style={{ border: '1.5px solid rgba(255,255,255,0.1)' }} />
                </button>
                <button onClick={() => setPage(`profile_${player.id}`)} className="text-white font-semibold text-sm hover:text-[#e8b84b] transition-colors flex-1 text-left">
                  {player.username}
                </button>
                {isEditing ? (
                  <div className="flex gap-1">
                    <button onClick={() => saveEdit(player.id)} className="p-1.5 rounded-lg" style={{ color: '#e8b84b', background: 'rgba(232,184,75,0.1)' }}><Save size={13} /></button>
                    <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}><X size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(player.id)} className="p-1.5 rounded-lg transition-all"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'white'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}>
                    <Edit3 size={13} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {(['matches','wins','goals','assists','emlChampionships'] as const).map((k, idx) => {
                  const labels = ['P', 'W', 'G', 'A', '🏆'];
                  return (
                    <div key={k} className="text-center">
                      <p className="text-white/30 text-[10px] mb-1">{labels[idx]}</p>
                      {isEditing ? (
                        <input type="number" min="0" value={editVals[k] || 0}
                          onChange={e => setEditVals(p => ({ ...p, [k]: Number(e.target.value) }))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-1 py-1 text-white text-xs text-center focus:outline-none" />
                      ) : (
                        <p className={`font-bold text-sm ${k === 'emlChampionships' ? 'text-[#e8b84b]' : 'text-white'}`}>{player.stats[k]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {players.length === 0 && (
          <div className="py-10 text-center rounded-2xl" style={card}>
            <p className="text-white/30 text-sm">No players yet.</p>
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-hidden rounded-2xl" style={card}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Player','Played','Wins','Goals','Assists','Titles','Edit'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map(player => {
                const isEditing = editing === player.id;
                return (
                  <tr key={player.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <td className="px-4 py-3">
                      <button onClick={() => setPage(`profile_${player.id}`)} className="flex items-center gap-2.5">
                        <img src={player.avatar || getAvatarUrl(player.username)} alt="" className="w-8 h-8 rounded-full object-cover" style={{ border: '1.5px solid rgba(255,255,255,0.1)' }} />
                        <span className="text-white font-medium hover:text-[#e8b84b] transition-colors">{player.username}</span>
                      </button>
                    </td>
                    {isEditing ? (
                      <>
                        {(['matches','wins','goals','assists','emlChampionships'] as const).map(k => (
                          <td key={k} className="px-4 py-2">
                            <input type="number" min="0" value={editVals[k] || 0}
                              onChange={e => setEditVals(p => ({ ...p, [k]: Number(e.target.value) }))}
                              className="w-14 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-[#e8b84b]/40" />
                          </td>
                        ))}
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => saveEdit(player.id)} className="p-1.5 rounded-lg transition-all" style={{ color: '#e8b84b', background: 'rgba(232,184,75,0.1)' }}><Save size={13} /></button>
                            <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg" style={{ color: 'rgba(255,255,255,0.35)' }}><X size={13} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-center text-white/80 text-sm">{player.stats.matches}</td>
                        <td className="px-4 py-3 text-center text-white/80 text-sm">{player.stats.wins}</td>
                        <td className="px-4 py-3 text-center text-white font-bold text-sm">{player.stats.goals}</td>
                        <td className="px-4 py-3 text-center text-white/80 text-sm">{player.stats.assists}</td>
                        <td className="px-4 py-3 text-center font-bold text-sm" style={{ color: '#e8b84b' }}>{player.stats.emlChampionships}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => startEdit(player.id)} className="p-1.5 rounded-lg transition-all"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                            <Edit3 size={13} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {players.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>No players yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==================== MATCHDAYS ADMIN ==================== */
function MatchdaysAdmin() {
  const { data, update, showToast } = useApp();
  const [creating, setCreating] = useState(false);
  const [mdNumber, setMdNumber] = useState('');
  const [matches, setMatches] = useState<Partial<Match>[]>([{ id: generateId(), homeTeamId: '', awayTeamId: '', date: '', played: false }]);
  const [editingScore, setEditingScore] = useState<{ mdId: string; matchId: string; home: string; away: string } | null>(null);

  const teamOptions = data.teams.map(t => ({ value: t.id, label: t.name }));

  function addMatch() {
    setMatches(p => [...p, { id: generateId(), homeTeamId: '', awayTeamId: '', date: '', played: false }]);
  }

  function updateMatch(i: number, field: string, val: string) {
    setMatches(p => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  }

async function createMatchday() {
  const num = Number(mdNumber);
  if (!num || num < 1) { showToast('Invalid matchday number', 'error'); return; }
  if (data.matchdays.find(md => md.number === num)) { showToast('Matchday number already exists', 'error'); return; }
  const validMatches = matches.filter(m => m.homeTeamId && m.awayTeamId && m.homeTeamId !== m.awayTeamId && m.date);
  if (validMatches.length === 0) { showToast('Add at least one valid match', 'error'); return; }
  const { error } = await supabase.from('matchdays').insert({
    number: num, matches: validMatches, created_at: Date.now()
  });
  if (error) { showToast('Failed to create matchday', 'error'); return; }
  showToast(`Matchday ${num} created!`);
  setCreating(false); setMdNumber(''); setMatches([{ id: generateId(), homeTeamId: '', awayTeamId: '', date: '', played: false }]);
}

async function deleteMatchday(id: string) {
  if (!confirm('Delete this matchday?')) return;
  await supabase.from('matchdays').delete().eq('id', id);
  showToast('Matchday deleted');
}

async function saveScore() {
  if (!editingScore) return;
  const hs = Number(editingScore.home), as = Number(editingScore.away);
  if (isNaN(hs) || isNaN(as) || hs < 0 || as < 0) { showToast('Invalid scores', 'error'); return; }
  const md = data.matchdays.find(md => md.id === editingScore.mdId);
  if (!md) return;
  const updatedMatches = md.matches.map(m =>
    m.id !== editingScore.matchId ? m : { ...m, homeScore: hs, awayScore: as, played: true }
  );
  await supabase.from('matchdays').update({ matches: updatedMatches }).eq('id', editingScore.mdId);
  showToast('Score saved!');
  setEditingScore(null);
}

  const sortedMds = [...data.matchdays].sort((a, b) => a.number - b.number);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white text-base sm:text-lg">Matchdays ({data.matchdays.length})</h2>
        <button onClick={() => setCreating(!creating)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#0a0f1a' }}>
          <Plus size={13} /> New Matchday
        </button>
      </div>

      {creating && (
        <div className="p-4 sm:p-5 space-y-4" style={card}>
          <input type="number" placeholder="Matchday number" value={mdNumber} onChange={e => setMdNumber(e.target.value)}
            className={inputCls} style={{ maxWidth: 180 }} />
          <div className="space-y-3">
            {matches.map((m, i) => (
              <div key={i} className="space-y-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <Select
                    value={m.homeTeamId || ''}
                    onChange={v => updateMatch(i, 'homeTeamId', v)}
                    options={teamOptions}
                    placeholder="Home team"
                  />
                  <span className="text-white/30 text-sm font-bold text-center">vs</span>
                  <Select
                    value={m.awayTeamId || ''}
                    onChange={v => updateMatch(i, 'awayTeamId', v)}
                    options={teamOptions}
                    placeholder="Away team"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={m.date} onChange={e => updateMatch(i, 'date', e.target.value)} className={inputCls} />
                  <input type="time" value={m.time || ''} onChange={e => updateMatch(i, 'time', e.target.value)} className={inputCls} />
                </div>
                {matches.length > 1 && (
                  <button onClick={() => setMatches(p => p.filter((_, idx) => idx !== i))}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
                    style={{ color: 'rgba(248,113,113,0.6)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.6)'}>
                    <X size={11} /> Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={addMatch} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}>
              <Plus size={13} /> Add Match
            </button>
            <button onClick={createMatchday} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#0a0f1a' }}>
              <Save size={13} /> Create
            </button>
            <button onClick={() => setCreating(false)} className="px-3 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedMds.map(md => (
          <div key={md.id} className="overflow-hidden rounded-2xl" style={card}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="font-bold text-white text-sm">Matchday {md.number}</h3>
              <button onClick={() => deleteMatchday(md.id)} className="p-1.5 rounded-lg transition-all"
                style={{ color: 'rgba(248,113,113,0.4)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.4)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <Trash2 size={13} />
              </button>
            </div>
            <div>
              {md.matches.map((match, mi) => {
                const home = data.teams.find(t => t.id === match.homeTeamId);
                const away = data.teams.find(t => t.id === match.awayTeamId);
                const isEditingThis = editingScore?.mdId === md.id && editingScore?.matchId === match.id;
                return (
                  <div key={match.id} className="px-4 py-3 flex items-center gap-2 sm:gap-4"
                    style={{ borderBottom: mi < md.matches.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div className="flex-1 text-right text-xs sm:text-sm font-semibold text-white truncate">{home?.name || 'TBD'}</div>
                    {isEditingThis ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input type="number" min="0" value={editingScore.home}
                          onChange={e => setEditingScore(p => p ? { ...p, home: e.target.value } : p)}
                          className="w-10 rounded-lg px-1 py-1 text-white text-center text-sm focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }} />
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>–</span>
                        <input type="number" min="0" value={editingScore.away}
                          onChange={e => setEditingScore(p => p ? { ...p, away: e.target.value } : p)}
                          className="w-10 rounded-lg px-1 py-1 text-white text-center text-sm focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }} />
                        <button onClick={saveScore} className="p-1" style={{ color: '#e8b84b' }}><Save size={12} /></button>
                        <button onClick={() => setEditingScore(null)} className="p-1" style={{ color: 'rgba(255,255,255,0.3)' }}><X size={12} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingScore({ mdId: md.id, matchId: match.id, home: match.homeScore?.toString() || '', away: match.awayScore?.toString() || '' })}
                        className="px-2.5 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-bold flex-shrink-0 transition-all"
                        style={match.played
                          ? { background: 'rgba(232,184,75,0.12)', color: '#e8b84b', border: '1px solid rgba(232,184,75,0.2)' }
                          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {match.played ? `${match.homeScore} – ${match.awayScore}` : 'Score'}
                      </button>
                    )}
                    <div className="flex-1 text-xs sm:text-sm font-semibold text-white truncate">{away?.name || 'TBD'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {sortedMds.length === 0 && (
          <div className="py-12 text-center rounded-2xl" style={card}>
            <Calendar size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-white/30 text-sm">No matchdays yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== KNOCKOUT ADMIN ==================== */
function KnockoutAdmin({ setPage: _setPage }: { setPage: (p: string) => void }) {
  const { data, update, showToast, addNotification } = useApp();
  const ko = data.knockout;
  const [editingScore, setEditingScore] = useState<{ roundId: string; matchId: string; home: string; away: string } | null>(null);

  const allMatches = getAllMatchesFromMatchdays(data.matchdays);
  const standings = computeStandings(data.teams, allMatches);

  async function startKnockout() {
  const spots = data.qualificationSpots;
  const qualifiers = standings.slice(0, spots);
  if (qualifiers.length < 2) { showToast('Need at least 2 teams to start knockout', 'error'); return; }
  if (!confirm(`Start knockout with top ${qualifiers.length} teams?`)) return;
  const seeded = [...qualifiers];
  const numMatches = Math.pow(2, Math.floor(Math.log2(seeded.length)));
  const teams = seeded.slice(0, numMatches);
  const pairs: string[][] = [];
  for (let i = 0; i < teams.length / 2; i++) pairs.push([teams[i].teamId, teams[teams.length - 1 - i].teamId]);
  const round: KnockoutRound = {
    id: generateId(), name: getRoundName(numMatches, 0),
    matches: pairs.map(([h, a]) => ({ id: generateId(), homeTeamId: h, awayTeamId: a, played: false })),
  };
  const newKnockout = { active: true, rounds: [round], completed: false, championTeamId: undefined };
  await supabase.from('league_settings').upsert({
    id: 1, season_number: data.seasonNumber, qualification_spots: data.qualificationSpots,
    season_active: data.seasonActive, group_stage: data.groupStage,
    knockout: newKnockout, league_history: data.leagueHistory,
  });
  showToast('Knockout started!');
  data.users.filter(u => u.role === 'player').forEach(u => addNotification(u.id, 'knockout', 'The playoff knockout bracket has started!'));
}

async function cancelKnockout() {
  if (!confirm('Cancel knockout and return to regular season?')) return;
  const newKnockout = { active: false, rounds: [], completed: false };
  await supabase.from('league_settings').upsert({
    id: 1, season_number: data.seasonNumber, qualification_spots: data.qualificationSpots,
    season_active: data.seasonActive, group_stage: data.groupStage,
    knockout: newKnockout, league_history: data.leagueHistory,
  });
  showToast('Knockout cancelled');
}

async function resetBracket() {
  if (!confirm('Reset entire bracket?')) return;
  const newKnockout = {
    ...ko,
    rounds: ko.rounds.slice(0, 1).map(r => ({
      ...r, matches: r.matches.map(m => ({ ...m, played: false, homeScore: undefined, awayScore: undefined, winnerId: undefined }))
    })),
    completed: false,
  };
  await supabase.from('league_settings').upsert({
    id: 1, season_number: data.seasonNumber, qualification_spots: data.qualificationSpots,
    season_active: data.seasonActive, group_stage: data.groupStage,
    knockout: newKnockout, league_history: data.leagueHistory,
  });
  showToast('Bracket reset');
}

async function saveKnockoutScore() {
  if (!editingScore) return;
  const hs = Number(editingScore.home), as = Number(editingScore.away);
  if (isNaN(hs) || isNaN(as) || hs < 0 || as < 0) { showToast('Invalid scores', 'error'); return; }
  if (hs === as) { showToast('No draws allowed in knockout!', 'error'); return; }
  const roundIdx = ko.rounds.findIndex(r => r.id === editingScore.roundId);
  if (roundIdx === -1) return;
  if (!confirm(roundIdx > 0 ? 'Editing this score will reset all future rounds. Continue?' : 'Save score?')) return;
  const winnerId = hs > as
    ? ko.rounds[roundIdx].matches.find(m => m.id === editingScore.matchId)?.homeTeamId
    : ko.rounds[roundIdx].matches.find(m => m.id === editingScore.matchId)?.awayTeamId;
  const updatedRounds = ko.rounds.slice(0, roundIdx + 1).map((r, ri) =>
    ri !== roundIdx ? r : { ...r, matches: r.matches.map(m => m.id !== editingScore.matchId ? m : { ...m, homeScore: hs, awayScore: as, played: true, winnerId }) }
  );
  const currentRound = updatedRounds[roundIdx];
  const allPlayed = currentRound.matches.every(m => m.played);

  if (allPlayed) {
    const winners = currentRound.matches.map(m => m.winnerId!).filter(Boolean);
    if (winners.length === 1) {
      const championTeam = data.teams.find(t => t.id === winners[0]);
      const history = [...data.leagueHistory, { id: generateId(), season: data.seasonNumber, championTeamId: winners[0], championTeamName: championTeam?.name || '', year: new Date().getFullYear() }];
      // Update team championships
      await supabase.from('teams').update({ eml_championships: (championTeam?.emlChampionships ?? 0) + 1 }).eq('id', winners[0]);
      // Update player stats
      const champs = data.users.filter(u => u.teamId === winners[0]);
      for (const u of champs) {
        await supabase.from('profiles').update({ stats: { ...u.stats, emlChampionships: (u.stats?.emlChampionships ?? 0) + 1 } }).eq('id', u.id);
      }
      await supabase.from('league_settings').upsert({
        id: 1, season_number: data.seasonNumber, qualification_spots: data.qualificationSpots,
        season_active: data.seasonActive, group_stage: data.groupStage,
        knockout: { ...ko, rounds: updatedRounds, active: false, completed: true, championTeamId: winners[0] },
        league_history: history,
      });
      showToast(`🏆 ${championTeam?.name} are champions!`, 'success');
      data.users.filter(u => u.role === 'player').forEach(u => addNotification(u.id, 'championship', `🏆 ${championTeam?.name} are the EML Champions!`));
      setEditingScore(null);
      return;
    } else if (winners.length >= 2) {
      const nextMatches: KnockoutMatch[] = [];
      for (let i = 0; i < winners.length; i += 2) nextMatches.push({ id: generateId(), homeTeamId: winners[i], awayTeamId: winners[i + 1], played: false });
      const nextRound: KnockoutRound = { id: generateId(), name: getRoundName(winners.length * 2, updatedRounds.length), matches: nextMatches };
      await supabase.from('league_settings').upsert({
        id: 1, season_number: data.seasonNumber, qualification_spots: data.qualificationSpots,
        season_active: data.seasonActive, group_stage: data.groupStage,
        knockout: { ...ko, rounds: [...updatedRounds, nextRound] }, league_history: data.leagueHistory,
      });
      showToast('Round complete! Next round generated.');
      setEditingScore(null);
      return;
    }
  }

  await supabase.from('league_settings').upsert({
    id: 1, season_number: data.seasonNumber, qualification_spots: data.qualificationSpots,
    season_active: data.seasonActive, group_stage: data.groupStage,
    knockout: { ...ko, rounds: updatedRounds }, league_history: data.leagueHistory,
  });
  setEditingScore(null);
  showToast('Score saved!');
}

const spotsOptions = [2,4,8,16].map(n => ({ value: String(n), label: `${n} teams` }));
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-white text-base sm:text-lg">Knockout / Playoffs</h2>

      {!ko.active && !ko.completed && (
        <div className="p-5 space-y-4" style={card}>
          <p className="text-white/50 text-sm">End the regular season and start the knockout playoff with the top teams from standings.</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-white/50 text-sm flex-shrink-0">Qualification spots:</label>
            <Select
              value={String(data.qualificationSpots)}
              onChange={v => update({ ...data, qualificationSpots: Number(v) })}
              options={spotsOptions}
              className="w-40"
            />
          </div>
          <button onClick={startKnockout} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#0a0f1a' }}>
            <Play size={14} /> Start Knockout
          </button>
          <p className="text-white/25 text-xs">Top {data.qualificationSpots} teams from standings will enter the bracket.</p>
        </div>
      )}

      {ko.completed && (
        <div className="p-8 text-center rounded-2xl" style={{ background: 'rgba(232,184,75,0.06)', border: '1px solid rgba(232,184,75,0.2)' }}>
          <Trophy size={48} className="mx-auto mb-3" style={{ color: '#e8b84b' }} />
          <h3 className="text-2xl font-black text-white mb-1">Champions!</h3>
          <p className="font-bold text-lg" style={{ color: '#e8b84b' }}>{data.teams.find(t => t.id === ko.championTeamId)?.name}</p>
          <button onClick={cancelKnockout} className="mt-4 mx-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}>
            <RefreshCw size={13} /> New Season
          </button>
        </div>
      )}

      {(ko.active || ko.completed) && ko.rounds.length > 0 && (
        <div className="space-y-4">
          {!ko.completed && (
            <div className="flex gap-2 flex-wrap">
              <BtnSecondary icon={<Square size={12} />} label="Cancel" color="red" onClick={cancelKnockout} />
              <BtnSecondary icon={<RefreshCw size={12} />} label="Reset Bracket" color="gray" onClick={resetBracket} />
            </div>
          )}
          {ko.rounds.map(round => (
            <div key={round.id} className="overflow-hidden rounded-2xl" style={card}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 className="font-bold text-white text-sm">{round.name}</h3>
              </div>
              <div>
                {round.matches.map((match, mi) => {
                  const home = data.teams.find(t => t.id === match.homeTeamId);
                  const away = data.teams.find(t => t.id === match.awayTeamId);
                  const isEditingThis = editingScore?.roundId === round.id && editingScore?.matchId === match.id;
                  const homeWon = match.played && match.winnerId === match.homeTeamId;
                  const awayWon = match.played && match.winnerId === match.awayTeamId;
                  return (
                    <div key={match.id} className="px-4 py-3.5 flex items-center gap-3"
                      style={{ borderBottom: mi < round.matches.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div className="flex-1 text-right text-sm font-semibold truncate" style={{ color: homeWon ? '#e8b84b' : 'rgba(255,255,255,0.85)' }}>
                        {home?.name || 'TBD'} {homeWon && '🏆'}
                      </div>
                      {isEditingThis ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <input type="number" min="0" value={editingScore.home}
                            onChange={e => setEditingScore(p => p ? { ...p, home: e.target.value } : p)}
                            className="w-10 rounded-lg px-1 py-1 text-white text-center text-sm focus:outline-none"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }} />
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>–</span>
                          <input type="number" min="0" value={editingScore.away}
                            onChange={e => setEditingScore(p => p ? { ...p, away: e.target.value } : p)}
                            className="w-10 rounded-lg px-1 py-1 text-white text-center text-sm focus:outline-none"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }} />
                          <button onClick={saveKnockoutScore} className="p-1" style={{ color: '#e8b84b' }}><Save size={12} /></button>
                          <button onClick={() => setEditingScore(null)} className="p-1" style={{ color: 'rgba(255,255,255,0.3)' }}><X size={12} /></button>
                        </div>
                      ) : !ko.completed ? (
                        <button
                          onClick={() => setEditingScore({ roundId: round.id, matchId: match.id, home: match.homeScore?.toString() || '', away: match.awayScore?.toString() || '' })}
                          className="px-3 py-1.5 rounded-xl text-sm font-bold flex-shrink-0 transition-all"
                          style={match.played
                            ? { background: 'rgba(232,184,75,0.12)', color: '#e8b84b', border: '1px solid rgba(232,184,75,0.2)' }
                            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          {match.played ? `${match.homeScore} – ${match.awayScore}` : 'Score'}
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl text-sm font-bold flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
                          {match.played ? `${match.homeScore} – ${match.awayScore}` : '—'}
                        </span>
                      )}
                      <div className="flex-1 text-sm font-semibold truncate" style={{ color: awayWon ? '#e8b84b' : 'rgba(255,255,255,0.85)' }}>
                        {awayWon && '🏆 '}{away?.name || 'TBD'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== NEWS ADMIN ==================== */
function NewsAdmin() {
  const { data, update, currentUser, showToast } = useApp();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Announcement');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const fileRef = useRef<HTMLInputElement>(null);

  const categoryOptions = ['Match Recap', 'Announcement', 'Tournament Update', 'Player Spotlight'].map(c => ({ value: c, label: c }));

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    const reader = new FileReader();
    reader.onload = ev => setMediaUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function publishArticle() {
  if (!title.trim() || !content.trim()) { showToast('Title and content required', 'error'); return; }
  const { error } = await supabase.from('news_articles').insert({
    title: title.trim(), category, content: content.trim(),
    author_id: currentUser!.id,
    media: mediaUrl ? { type: mediaType, url: mediaUrl } : null,
    likes: [], comments: [], created_at: Date.now(),
  });
  if (error) { showToast('Failed to publish', 'error'); return; }
  showToast('Article published!');
  setCreating(false); setTitle(''); setContent(''); setMediaUrl('');
}

async function deleteArticle(id: string) {
  if (!confirm('Delete this article?')) return;
  await supabase.from('news_articles').delete().eq('id', id);
  showToast('Article deleted');
}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white text-base sm:text-lg">News ({data.news.length})</h2>
        <button onClick={() => setCreating(!creating)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#0a0f1a' }}>
          <Plus size={13} /> New Article
        </button>
      </div>

      {creating && (
        <div className="p-4 sm:p-5 space-y-3" style={card}>
          <input placeholder="Article title*" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
          <Select value={category} onChange={setCategory} options={categoryOptions} />
          <textarea placeholder="Article content*" value={content} onChange={e => setContent(e.target.value)} rows={6}
            className={`${inputCls} resize-none`} style={{ fontFamily: 'inherit' }} />
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}>
              <Camera size={13} /> {mediaUrl ? 'Change Media' : 'Add Media'}
            </button>
            {mediaUrl && <button onClick={() => setMediaUrl('')} className="text-red-400 text-xs hover:underline">Remove</button>}
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
          </div>
          {mediaUrl && (
            <div className="rounded-xl overflow-hidden max-h-40">
              {mediaType === 'image' ? <img src={mediaUrl} alt="" className="w-full max-h-40 object-cover" /> : <video src={mediaUrl} className="w-full max-h-40" controls />}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={publishArticle} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#0a0f1a' }}>
              <Send size={13} /> Publish
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {[...data.news].sort((a, b) => b.createdAt - a.createdAt).map(article => (
          <div key={article.id} className="flex items-start gap-3 p-4 transition-all rounded-2xl" style={card}>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm truncate">{article.title}</h3>
              <p className="text-white/35 text-xs mt-0.5">{article.category} · {article.likes.length} likes · {article.comments.length} comments</p>
            </div>
            <button onClick={() => deleteArticle(article.id)} className="p-2 rounded-xl flex-shrink-0 transition-all"
              style={{ color: 'rgba(248,113,113,0.4)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.4)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {data.news.length === 0 && (
          <div className="py-12 text-center rounded-2xl" style={card}>
            <Newspaper size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-white/30 text-sm">No articles yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== AWARDS ADMIN ==================== */
function AwardsAdmin({ setPage }: { setPage: (p: string) => void }) {
  const { data, update, showToast } = useApp();
  const [creating, setCreating] = useState(false);
  const [catName, setCatName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [nomineeSelects, setNomineeSelects] = useState<Record<string, string>>({});

  async function createCategory() {
  if (!catName.trim()) { showToast('Category name required', 'error'); return; }
  await supabase.from('awards').insert({
    name: catName.trim(), deadline: deadline ? new Date(deadline).getTime() : null,
    nominees: [], closed: false, created_at: Date.now()
  });
  showToast('Award category created!');
  setCatName(''); setDeadline(''); setCreating(false);
}

async function addNominee(categoryId: string, userId: string) {
  if (!userId) return;
  const cat = data.awards.find(a => a.id === categoryId);
  if (!cat || cat.nominees.find((n: any) => n.userId === userId)) return;
  const newNominees = [...cat.nominees, { userId, votes: [] }];
  await supabase.from('awards').update({ nominees: newNominees }).eq('id', categoryId);
  setNomineeSelects(p => ({ ...p, [categoryId]: '' }));
}

async function removeNominee(categoryId: string, userId: string) {
  const cat = data.awards.find(a => a.id === categoryId);
  if (!cat) return;
  await supabase.from('awards').update({ nominees: cat.nominees.filter((n: any) => n.userId !== userId) }).eq('id', categoryId);
}

async function toggleClose(categoryId: string) {
  const cat = data.awards.find(a => a.id === categoryId);
  if (!cat) return;
  await supabase.from('awards').update({ closed: !cat.closed }).eq('id', categoryId);
}

async function deleteCategory(id: string) {
  if (!confirm('Delete this award category?')) return;
  await supabase.from('awards').delete().eq('id', id);
  showToast('Category deleted');
}

  const players = data.users.filter(u => u.role === 'player');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white text-base sm:text-lg">Awards ({data.awards.length})</h2>
        <button onClick={() => setCreating(!creating)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#0a0f1a' }}>
          <Plus size={13} /> New Category
        </button>
      </div>

      {creating && (
        <div className="p-4 sm:p-5 space-y-3" style={card}>
          <input placeholder="Category name (e.g. Best Goalkeeper)" value={catName} onChange={e => setCatName(e.target.value)} className={inputCls} />
          <div>
            <label className="text-white/40 text-xs block mb-1.5">Voting Deadline (optional)</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={createCategory} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#0a0f1a' }}>
              <Save size={13} /> Create
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data.awards.map(cat => (
          <div key={cat.id} className="overflow-hidden rounded-2xl" style={card}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="font-bold text-white text-sm">{cat.name}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleClose(cat.id)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={cat.closed
                    ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                    : { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                  {cat.closed ? 'Closed' : 'Open'}
                </button>
                <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg transition-all"
                  style={{ color: 'rgba(248,113,113,0.4)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.4)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {cat.nominees.map(n => {
                const user = data.users.find(u => u.id === n.userId);
                return (
                  <div key={n.userId} className="flex items-center gap-3">
                    <img src={user?.avatar || getAvatarUrl(user?.username || 'U')} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" style={{ border: '1.5px solid rgba(255,255,255,0.1)' }} />
                    <button onClick={() => setPage(`profile_${n.userId}`)} className="text-white text-sm hover:text-[#e8b84b] transition-colors flex-1 text-left">{user?.username}</button>
                    <span className="text-white/35 text-xs">{n.votes.length} votes</span>
                    <button onClick={() => removeNominee(cat.id, n.userId)} className="p-1 rounded transition-all"
                      style={{ color: 'rgba(248,113,113,0.4)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.4)'}>
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
              {!cat.closed && (
                <Select
                  value={nomineeSelects[cat.id] || ''}
                  onChange={v => { addNominee(cat.id, v); }}
                  options={players.filter(p => !cat.nominees.find(n => n.userId === p.id)).map(p => ({ value: p.id, label: p.username }))}
                  placeholder="Add nominee..."
                />
              )}
              {cat.nominees.length === 0 && <p className="text-white/25 text-xs">No nominees yet.</p>}
            </div>
          </div>
        ))}
        {data.awards.length === 0 && (
          <div className="py-12 text-center rounded-2xl" style={card}>
            <Award size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-white/30 text-sm">No award categories yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== CHATS ADMIN ==================== */
function ChatsAdmin() {
  const { data, update, showToast } = useApp();
  const [viewingChat, setViewingChat] = useState<string | null>(null);

  function archiveChat(matchId: string) {
    update({ ...data, matchChats: data.matchChats.map(c => c.matchId === matchId ? { ...c, archived: true } : c) });
    showToast('Chat archived');
  }

  const activeChats = data.matchChats.filter(c => !c.archived);
  const archivedChats = data.matchChats.filter(c => c.archived);

  function getMatchInfo(matchId: string) {
    for (const md of data.matchdays) {
      const match = md.matches.find(m => m.id === matchId);
      if (match) {
        const home = data.teams.find(t => t.id === match.homeTeamId)?.name || 'Team';
        const away = data.teams.find(t => t.id === match.awayTeamId)?.name || 'Team';
        return `MD${md.number}: ${home} vs ${away}`;
      }
    }
    return 'Unknown Match';
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-white text-base sm:text-lg">Match Chats</h2>

      <div className="space-y-2.5">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Active ({activeChats.length})</p>
        {activeChats.length === 0 && <p className="text-white/25 text-sm">No active match chats.</p>}
        {activeChats.map(chat => (
          <div key={chat.matchId} className="p-4 rounded-2xl" style={card}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-sm truncate">{getMatchInfo(chat.matchId)}</p>
                <p className="text-white/35 text-xs mt-0.5">{chat.messages.length} messages</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setViewingChat(viewingChat === chat.matchId ? null : chat.matchId)}
                  className="px-3 py-1.5 rounded-xl text-xs transition-all font-medium"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}>
                  {viewingChat === chat.matchId ? 'Hide' : 'View'}
                </button>
                <button onClick={() => archiveChat(chat.matchId)}
                  className="px-3 py-1.5 rounded-xl text-xs transition-all font-medium"
                  style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(251,146,60,0.2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(251,146,60,0.12)'}>
                  Archive
                </button>
              </div>
            </div>
            {viewingChat === chat.matchId && (
              <div className="mt-3 pt-3 space-y-2 max-h-48 overflow-y-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {chat.messages.map(msg => {
                  const author = data.users.find(u => u.id === msg.authorId);
                  return (
                    <div key={msg.id} className="flex items-start gap-2 text-sm">
                      <img src={author?.avatar || getAvatarUrl(author?.username || 'U')} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                      <div>
                        <span className="text-white/50 font-medium text-xs">{author?.username}: </span>
                        <span className="text-white/80 text-xs">{msg.content}</span>
                      </div>
                    </div>
                  );
                })}
                {chat.messages.length === 0 && <p className="text-white/25 text-xs">No messages yet.</p>}
              </div>
            )}
          </div>
        ))}

        {archivedChats.length > 0 && (
          <>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mt-4">Archived ({archivedChats.length})</p>
            {archivedChats.map(chat => (
              <div key={chat.matchId} className="p-4 rounded-2xl opacity-50" style={{ ...card, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">{getMatchInfo(chat.matchId)}</p>
                    <p className="text-white/35 text-xs mt-0.5">{chat.messages.length} messages · Archived</p>
                  </div>
                  <button onClick={() => setViewingChat(viewingChat === chat.matchId ? null : chat.matchId)}
                    className="px-3 py-1.5 rounded-xl text-xs transition-all"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
                    {viewingChat === chat.matchId ? 'Hide' : 'View'}
                  </button>
                </div>
                {viewingChat === chat.matchId && (
                  <div className="mt-3 pt-3 space-y-2 max-h-48 overflow-y-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    {chat.messages.map(msg => {
                      const author = data.users.find(u => u.id === msg.authorId);
                      return (
                        <div key={msg.id} className="flex items-start gap-2">
                          <img src={author?.avatar || getAvatarUrl(author?.username || 'U')} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          <div>
                            <span className="text-white/40 font-medium text-xs">{author?.username}: </span>
                            <span className="text-white/60 text-xs">{msg.content}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Reusable secondary button ── */
function BtnSecondary({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: 'blue'|'purple'|'red'|'gray'; onClick: () => void }) {
  const colors = {
    blue:   { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)',  hbg: 'rgba(59,130,246,0.22)'  },
    purple: { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc', border: 'rgba(168,85,247,0.25)', hbg: 'rgba(168,85,247,0.22)'  },
    red:    { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.25)',  hbg: 'rgba(239,68,68,0.22)'   },
    gray:   { bg: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.7)', border: 'rgba(255,255,255,0.1)', hbg: 'rgba(255,255,255,0.12)' },
  };
  const c = colors[color];
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = c.hbg}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = c.bg}>
      {icon} {label}
    </button>
  );
}
