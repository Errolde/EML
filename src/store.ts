import { supabase } from './supabase'
import type { AppData } from './types'

function mapProfile(p: any) {
  return {
    ...p,
    teamId: p.team_id,
    createdAt: p.created_at,
    emlChampionships: p.eml_championships,
    stats: p.stats ?? { matches: 0, wins: 0, goals: 0, assists: 0, emlChampionships: 0 },
  }
}

function mapTeam(t: any) {
  return {
    ...t,
    playerIds: t.player_ids ?? [],
    emlChampionships: t.eml_championships ?? 0,
    createdAt: t.created_at,
  }
}

function mapMatchday(m: any) {
  return {
    ...m,
    createdAt: m.created_at,
    matches: m.matches ?? [],
  }
}

function mapNews(a: any) {
  return {
    ...a,
    authorId: a.author_id,
    createdAt: a.created_at,
    likes: a.likes ?? [],
    comments: a.comments ?? [],
  }
}

function mapChat(m: any) {
  return {
    ...m,
    authorId: m.author_id,
    matchId: m.match_id,
    createdAt: m.created_at,
    replyTo: m.reply_to,
    replies: m.replies ?? [],
  }
}

function mapNotification(n: any) {
  return {
    ...n,
    userId: n.user_id,
    createdAt: n.created_at,
    linkTo: n.link_to,
  }
}

function mapAward(a: any) {
  return {
    ...a,
    createdAt: a.created_at,
    nominees: a.nominees ?? [],
  }
}

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
    users: (profiles.data ?? []).map(mapProfile),
    teams: (teams.data ?? []).map(mapTeam),
    matchdays: (matchdays.data ?? []).map(mapMatchday),
    news: (news.data ?? []).map(mapNews),
    globalChat: (chat.data ?? []).filter((m: any) => !m.match_id).map(mapChat),
    matchChats: [],
    notifications: (notifs.data ?? []).map(mapNotification),
    awards: (awards.data ?? []).map(mapAward),
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