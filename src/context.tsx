import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import { loadData } from './store';
import { AppData, User } from './types';
import { generateId } from './store';

export interface ToastMsg {
  msg: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface AppContextType {
  data: AppData;
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  update: (data: AppData) => void;
  addNotification: (userId: string, type: string, message: string) => void;
  toast: ToastMsg | null;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const AppContext = createContext<AppContextType>(null!);

function mapProfile(p: any) {
  return { ...p, teamId: p.team_id, createdAt: p.created_at, stats: p.stats ?? { matches: 0, wins: 0, goals: 0, assists: 0, emlChampionships: 0 } }
}

function mapChat(m: any) {
  return { ...m, authorId: m.author_id, matchId: m.match_id, createdAt: m.created_at, replyTo: m.reply_to, replies: m.replies ?? [] }
}

function mapNews(a: any) {
  return { ...a, authorId: a.author_id, createdAt: a.created_at, likes: a.likes ?? [], comments: a.comments ?? [] }
}

function mapMatchday(m: any) {
  return { ...m, createdAt: m.created_at, matches: m.matches ?? [] }
}

function mapNotification(n: any) {
  return { ...n, userId: n.user_id, createdAt: n.created_at, linkTo: n.link_to }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
    users: [], teams: [], matchdays: [], news: [], globalChat: [],
    matchChats: [], notifications: [], awards: [], leagueHistory: [],
    groupStage: undefined,
    knockout: { active: false, rounds: [], completed: false },
    seasonNumber: 1, qualificationSpots: 4, seasonActive: true,
  });

  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [toast, setToast] = useState<ToastMsg | null>(null);

  useEffect(() => {
    loadData().then(setData);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('profiles')
          .select('*').eq('id', session.user.id).single()
          .then(({ data: profile }) => {
            if (profile) setCurrentUserState(mapProfile(profile) as User);
          });
      }
    });
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('app-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => setData(prev => ({
          ...prev, globalChat: [...prev.globalChat, mapChat(payload.new)]
        })))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
        payload => setData(prev => ({
          ...prev, globalChat: prev.globalChat.map(m => m.id === payload.new.id ? mapChat(payload.new) : m)
        })))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matchdays' },
        payload => setData(prev => ({
          ...prev, matchdays: prev.matchdays.map(m => m.id === payload.new.id ? mapMatchday(payload.new) : m)
        })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matchdays' },
        payload => setData(prev => ({
          ...prev, matchdays: [...prev.matchdays, mapMatchday(payload.new)].sort((a, b) => a.number - b.number)
        })))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'matchdays' },
        payload => setData(prev => ({
          ...prev, matchdays: prev.matchdays.filter(m => m.id !== payload.old.id)
        })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_articles' },
        payload => setData(prev => ({
          ...prev, news: [mapNews(payload.new), ...prev.news]
        })))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'news_articles' },
        payload => setData(prev => ({
          ...prev, news: prev.news.map(a => a.id === payload.new.id ? mapNews(payload.new) : a)
        })))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'news_articles' },
        payload => setData(prev => ({
          ...prev, news: prev.news.filter(a => a.id !== payload.old.id)
        })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'teams' },
        payload => setData(prev => ({
          ...prev, teams: [...prev.teams, { ...payload.new, playerIds: payload.new.player_ids ?? [], emlChampionships: payload.new.eml_championships ?? 0, createdAt: payload.new.created_at }]
        })))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' },
        payload => setData(prev => ({
          ...prev, teams: prev.teams.map(t => t.id === payload.new.id ? { ...payload.new, playerIds: payload.new.player_ids ?? [], emlChampionships: payload.new.eml_championships ?? 0, createdAt: payload.new.created_at } : t)
        })))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'teams' },
        payload => setData(prev => ({
          ...prev, teams: prev.teams.filter(t => t.id !== payload.old.id)
        })))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' },
        payload => setData(prev => ({
          ...prev, users: prev.users.map(u => u.id === payload.new.id ? mapProfile(payload.new) : u)
        })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' },
        payload => setData(prev => ({
          ...prev, users: [...prev.users, mapProfile(payload.new)]
        })))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'awards' },
        payload => setData(prev => ({
          ...prev, awards: prev.awards.map(a => a.id === payload.new.id ? { ...payload.new, createdAt: payload.new.created_at, nominees: payload.new.nominees ?? [] } : a)
        })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'awards' },
        payload => setData(prev => ({
          ...prev, awards: [...prev.awards, { ...payload.new, createdAt: payload.new.created_at, nominees: payload.new.nominees ?? [] }]
        })))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'awards' },
        payload => setData(prev => ({
          ...prev, awards: prev.awards.filter(a => a.id !== payload.old.id)
        })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
        payload => {
          if (payload.new.user_id === currentUser?.id) {
            setData(prev => ({
              ...prev, notifications: [mapNotification(payload.new), ...prev.notifications]
            }));
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const update = useCallback(async (newData: AppData) => {
  await supabase.from('league_settings').upsert({
    id: 1,
    season_number: newData.seasonNumber,
    qualification_spots: newData.qualificationSpots,
    season_active: newData.seasonActive,
    group_stage: newData.groupStage,
    knockout: newData.knockout,
    league_history: newData.leagueHistory,
  });
}, []);

  const setCurrentUser = useCallback((u: User | null) => {
    setCurrentUserState(u);
  }, []);

  const addNotification = useCallback(async (userId: string, type: string, message: string) => {
    await supabase.from('notifications').insert({
      id: generateId(),
      user_id: userId,
      type,
      message,
      read: false,
      created_at: Date.now(),
    });
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <AppContext.Provider value={{ data, currentUser, setCurrentUser, update, addNotification, toast, showToast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}