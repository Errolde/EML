import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import { loadData } from './store';
import { AppData, User, Notification } from './types';
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

  // Load all data on startup
  useEffect(() => {
    loadData().then(setData);

    // Restore logged-in user from session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('profiles')
          .select('*').eq('id', session.user.id).single()
          .then(({ data: profile }) => {
            if (profile) setCurrentUserState(profile as User);
          });
      }
    });
  }, []);

  // Real-time: push live updates to all users
  useEffect(() => {
    const channel = supabase
      .channel('app-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => setData(prev => ({
          ...prev, globalChat: [...prev.globalChat, payload.new as any]
        })))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matchdays' },
        payload => setData(prev => ({
          ...prev,
          matchdays: prev.matchdays.map(m => m.id === payload.new.id ? payload.new as any : m)
        })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_articles' },
        payload => setData(prev => ({
          ...prev, news: [payload.new as any, ...prev.news]
        })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
        payload => {
          if (payload.new.user_id === currentUser?.id) {
            setData(prev => ({
              ...prev, notifications: [payload.new as any, ...prev.notifications]
            }));
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const update = useCallback(async (newData: AppData) => {
    setData(newData);
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