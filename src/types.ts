export type UserRole = 'admin' | 'player';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  avatar?: string;
  teamId?: string;
  stats: PlayerStats;
  createdAt: number;
}

export interface PlayerStats {
  matches: number;
  wins: number;
  goals: number;
  assists: number;
  emlChampionships: number;
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  description: string;
  playerIds: string[];
  emlChampionships: number;
  createdAt: number;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  date: string;
  time?: string;
  groupId?: string;
}

export interface Matchday {
  id: string;
  number: number;
  matches: Match[];
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  teamIds: string[];
}

export interface GroupStage {
  groups: Group[];
  qualifiersPerGroup: number;
  matchdays: Matchday[];
  active: boolean;
}

export interface KnockoutMatch {
  id: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  winnerId?: string;
  date?: string;
}

export interface KnockoutRound {
  id: string;
  name: string;
  matches: KnockoutMatch[];
}

export interface Knockout {
  active: boolean;
  rounds: KnockoutRound[];
  championTeamId?: string;
  completed: boolean;
}

export interface LeagueHistory {
  id: string;
  season: number;
  championTeamId: string;
  championTeamName: string;
  year: number;
}

export type NewsCategory = 'Match Recap' | 'Announcement' | 'Tournament Update' | 'Player Spotlight';

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: number;
  likes: string[];
  replies: Reply[];
}

export interface Reply {
  id: string;
  authorId: string;
  content: string;
  createdAt: number;
  likes: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  category: NewsCategory;
  content: string;
  authorId: string;
  media?: { type: 'image' | 'video'; url: string };
  likes: string[];
  comments: Comment[];
  createdAt: number;
}

export interface AwardNominee {
  userId: string;
  votes: string[];
}

export interface AwardCategory {
  id: string;
  name: string;
  deadline?: number;
  nominees: AwardNominee[];
  closed: boolean;
  createdAt: number;
}

export interface ChatReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  content: string;
  createdAt: number;
  matchId?: string;
  archived?: boolean;
  replyTo?: { id: string; authorId: string; content: string };
  replies?: ChatReply[];
}

export interface MatchChat {
  matchId: string;
  matchdayId: string;
  messages: ChatMessage[];
  archived: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: number;
  linkTo?: string;
}

export interface AppData {
  users: User[];
  teams: Team[];
  matchdays: Matchday[];
  groupStage?: GroupStage;
  knockout: Knockout;
  leagueHistory: LeagueHistory[];
  news: NewsArticle[];
  awards: AwardCategory[];
  globalChat: ChatMessage[];
  matchChats: MatchChat[];
  notifications: Notification[];
  seasonNumber: number;
  qualificationSpots: number;
  seasonActive: boolean;
}
