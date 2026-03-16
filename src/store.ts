import { supabase } from './supabase'
import type { AppData } from './types'

export async function loadData(): Promise<AppData> {
  const [profiles, teams, matchdays, news, chat, notifs, awards, settings] =
    await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('matchdays').select('*').order('number'),
      supabase.from('news_articles').select('*').order('created_at', { ascending: false }),
      supabase.from('chat_messages').select('*').order('created_at'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('awards').select('*').order('created_at'),
      supabase.from('league_settings').select('*').single(),
    ])

  return {
    users: profiles.data ?? [],
    teams: teams.data ?? [],
    matchdays: matchdays.data ?? [],
    news: news.data ?? [],
    globalChat: chat.data ?? [],
    matchChats: [],
    notifications: notifs.data ?? [],
    awards: awards.data ?? [],
    groupStage: settings.data?.group_stage,
    knockout: settings.data?.knockout ?? { active: false, rounds: [], completed: false },
    leagueHistory: settings.data?.league_history ?? [],
    seasonNumber: settings.data?.season_number ?? 1,
    qualificationSpots: settings.data?.qualification_spots ?? 4,
    seasonActive: settings.data?.season_active ?? true,
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function getDefaultStats() {
  return { matches: 0, wins: 0, goals: 0, assists: 0, emlChampionships: 0 }
}