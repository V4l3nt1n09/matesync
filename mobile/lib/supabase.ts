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
