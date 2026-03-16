import { useState, useRef } from 'react';
import { useApp } from '../context';
import { getAvatarUrl } from '../utils/helpers';
import { KeyRound, Camera, Save, Eye, EyeOff, User, ArrowLeft, Shield } from 'lucide-react';

interface Props { setPage: (p: string) => void; }

export function SettingsPage({ setPage }: Props) {
  const { data, update, currentUser, setCurrentUser, showToast } = useApp();
  const rawUser = data.users.find(u => u.id === currentUser?.id);

  const [username, setUsername] = useState(rawUser?.username ?? '');
  const [avatar, setAvatar] = useState(rawUser?.avatar ?? '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!currentUser || !rawUser) {
    return (
      <div className="text-center text-white/40 py-20">
        <p>Please log in to access settings.</p>
      </div>
    );
  }

  // Safe references after guard
  const uid = rawUser.id;
  const storedPassword = rawUser.password;
  const currentUsername = rawUser.username;
  const currentAvatar = rawUser.avatar;
  const userRole = rawUser.role;
  const userTeamId = rawUser.teamId;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function saveProfile() {
    if (!username.trim()) { showToast('Username cannot be empty', 'error'); return; }
    if (username.trim() === currentUsername && avatar === currentAvatar) {
      showToast('No changes detected', 'error'); return;
    }
    if (username.trim() !== currentUsername &&
      data.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== uid)) {
      showToast('Username already taken', 'error'); return;
    }
    setSaving(true);
    setTimeout(() => {
      const updated = data.users.map(u =>
        u.id === uid ? { ...u, username: username.trim(), avatar } : u
      );
      const found = updated.find(u => u.id === uid);
      if (found) {
        update({ ...data, users: updated });
        setCurrentUser(found);
      }
      showToast('Profile updated!');
      setSaving(false);
    }, 400);
  }

  function savePassword() {
    if (!currentPw) { showToast('Enter your current password', 'error'); return; }
    if (currentPw !== storedPassword) { showToast('Current password is incorrect', 'error'); return; }
    if (!newPw) { showToast('Enter a new password', 'error'); return; }
    if (newPw.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    if (newPw !== confirmPw) { showToast('Passwords do not match', 'error'); return; }
    setSaving(true);
    setTimeout(() => {
      const updated = data.users.map(u => u.id === uid ? { ...u, password: newPw } : u);
      update({ ...data, users: updated });
      showToast('Password updated!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setSaving(false);
    }, 400);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '12px 14px',
    color: 'white',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  function PwInput({ value, onChange, show, toggle, placeholder }: {
    value: string; onChange: (v: string) => void; show: boolean; toggle: () => void; placeholder: string;
  }) {
    return (
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...inputStyle, paddingRight: 44 }}
          onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(232,184,75,0.4)'}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button
          type="button"
          onClick={toggle}
          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex' }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    );
  }

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 24,
  };

  const team = userTeamId ? data.teams.find(t => t.id === userTeamId) : null;

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-10">
      {/* Back */}
      <button
        onClick={() => setPage('home')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0 }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'}
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div>
        <h1 className="text-2xl font-black text-white">Account Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your profile and security</p>
      </div>

      {/* Profile card */}
      <div style={card}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(99,102,241,0.15))' }}>
            <User size={14} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Profile</p>
            <p className="text-white/35 text-xs">Username and avatar</p>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-5">
          <div className="relative flex-shrink-0">
            <img
              src={getAvatarUrl(username || currentUsername, avatar)}
              alt=""
              className="w-20 h-20 rounded-2xl object-cover"
              style={{ border: '2px solid rgba(232,184,75,0.25)' }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{ position: 'absolute', bottom: -6, right: -6, width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(232,184,75,0.4)' }}
            >
              <Camera size={13} color="#060a12" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{currentUsername}</p>
            <p className="text-white/35 text-xs mt-0.5 mb-3">
              {userRole === 'admin' ? '⚡ Administrator' : '🎮 Player'}
              {team ? ` · ${team.name}` : ''}
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              style={{ fontSize: 12, color: '#e8b84b', background: 'rgba(232,184,75,0.1)', border: '1px solid rgba(232,184,75,0.2)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(232,184,75,0.18)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(232,184,75,0.1)'}
            >
              Change photo
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={inputStyle}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(232,184,75,0.4)'}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#060a12', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(232,184,75,0.3)', opacity: saving ? 0.7 : 1 }}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Password card */}
      <div style={card}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(14,165,233,0.3),rgba(6,182,212,0.15))' }}>
            <KeyRound size={14} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Change Password</p>
            <p className="text-white/35 text-xs">Keep your account secure</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Current Password</label>
            <PwInput value={currentPw} onChange={setCurrentPw} show={showCurrent} toggle={() => setShowCurrent(v => !v)} placeholder="Enter current password" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">New Password</label>
            <PwInput value={newPw} onChange={setNewPw} show={showNew} toggle={() => setShowNew(v => !v)} placeholder="Minimum 6 characters" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Confirm Password</label>
            <PwInput value={confirmPw} onChange={setConfirmPw} show={showConfirm} toggle={() => setShowConfirm(v => !v)} placeholder="Repeat new password" />
          </div>
        </div>

        <button
          onClick={savePassword}
          disabled={saving}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,rgba(14,165,233,0.9),rgba(6,182,212,0.8))', color: 'white', border: 'none', cursor: 'pointer', marginTop: 16, boxShadow: '0 4px 16px rgba(14,165,233,0.2)', opacity: saving ? 0.7 : 1 }}
        >
          <Shield size={14} />
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
