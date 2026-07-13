import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Console = "switch1" | "switch2" | "both";
export type Frequency = "daily" | "weekly" | "occasionally" | "rarely";

export interface Profile {
  id: string;
  console: Console | null;
  frequency: Frequency | null;
  favorite_games: string[];
  pseudo: string | null;
  avatar_url: string | null;
  switch_friend_code: string | null;
}

export type SessionRequestStatus = "pending" | "accepted" | "declined";

export interface GameSession {
  id: string;
  creator_id: string;
  creator_pseudo: string;
  creator_avatar_url: string | null;
  game: string;
  description: string | null;
  scheduled_at: string | null;
  slots_total: number;
  created_at: string;
  expires_at: string;
}

export interface SessionRequest {
  id: string;
  session_id: string;
  requester_id: string;
  requester_pseudo: string;
  requester_avatar_url: string | null;
  status: SessionRequestStatus;
  created_at: string;
  decided_at: string | null;
}

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export interface FriendRequest {
  id: string;
  requester_id: string;
  requester_pseudo: string;
  requester_avatar_url: string | null;
  addressee_id: string;
  addressee_pseudo: string;
  addressee_avatar_url: string | null;
  status: FriendRequestStatus;
  created_at: string;
  decided_at: string | null;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_pseudo: string;
  content: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  user_a: string;
  user_b: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface PlayerRating {
  rater_id: string;
  ratee_id: string;
  ratee_pseudo: string;
  ratee_avatar_url: string | null;
  liked: boolean;
  session_id: string;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  created_at: string;
}
