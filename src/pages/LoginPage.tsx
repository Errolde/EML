import { useState } from 'react';
import { useApp } from '../context';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { getDefaultStats } from '../store';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '../supabase';

interface Props { setPage: (p: string) => void; }

export function LoginPage({ setPage }: Props) {
  const { setCurrentUser, showToast } = useApp();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = 'Username is required';
    if (!password) e.password = 'Password is required';
    if (tab === 'register' && password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.trim())
      .single();

    if (!profile) {
      setErrors({ password: 'No profile found for this username' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: `${username.trim().toLowerCase()}@eml26.com`,
      password,
    });

    if (error) {
      setErrors({ password: error.message });
      setLoading(false);
      return;
    }

    setCurrentUser(profile);
    showToast(`Welcome, ${profile.username}!`);
    setPage('home');
    setLoading(false);
  }

  async function handleRegister() {
    if (!validate()) return;

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (existing) {
      setErrors({ username: 'Username already taken' });
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${username.trim().toLowerCase()}@eml26.com`,
      password,
    });

    if (authError || !authData.user) {
      setErrors({ password: authError?.message ?? 'Registration failed' });
      setLoading(false);
      return;
    }

    const newProfile = {
      id: authData.user.id,
      username: username.trim(),
      role: 'player' as const,
      ...getDefaultStats(),
      created_at: Date.now(),
    };

    await supabase.from('profiles').insert(newProfile);

    setCurrentUser(newProfile as any);
    showToast(`Welcome to EML, ${newProfile.username}!`);
    setPage('home');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#070d17] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#070d17] to-[#050a12]" />
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(ellipse at 20% 60%, rgba(232,184,75,0.06) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(30,58,95,0.15) 0%, transparent 55%)',
      }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e8b84b] to-[#c99a2e] shadow-2xl shadow-[#e8b84b]/20 mb-5">
            <Shield size={28} className="text-[#080e18]" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">EML</h1>
          <p className="text-[#e8b84b] font-bold text-xs tracking-[0.2em] uppercase mt-1">European MamoBall League</p>
          <p className="text-white/30 italic text-sm mt-1.5 font-light">Where Europe Competes</p>
        </div>

        <div className="bg-[#0d1520]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-7 shadow-2xl shadow-black/50">
          <div className="flex rounded-xl bg-white/[0.04] p-1 mb-6 gap-1">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-gradient-to-r from-[#e8b84b] to-[#d4a43a] text-[#080e18] shadow-lg shadow-[#e8b84b]/20'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <Input
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              error={errors.username}
              onKeyDown={e => { if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleRegister(); }}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={errors.password}
                onKeyDown={e => { if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleRegister(); }}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-8 text-white/30 hover:text-white/70 transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <Button
              onClick={tab === 'login' ? handleLogin : handleRegister}
              className="w-full mt-2"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#080e18]/30 border-t-[#080e18] rounded-full animate-spin" />
                  {tab === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                tab === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </div>

          <p className="text-center text-white/20 text-xs mt-5">
            {tab === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setErrors({}); }}
              className="text-[#e8b84b]/60 hover:text-[#e8b84b] transition-colors font-medium"
            >
              {tab === 'login' ? 'Register here' : 'Sign in here'}
            </button>
          </p>
        </div>

        <p className="text-center text-white/15 text-xs mt-4">
          EML · European MamoBall League · Season Competition Platform
        </p>
      </div>
    </div>
  );
}