import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Console = "switch1" | "switch2" | "both";
export type Frequency = "daily" | "weekly" | "occasionally" | "rarely";

export interface SignupPayload {
  email: string;
  console: Console;
  frequency: Frequency;
  motivations: string[];
  favorite_games?: string;
  comment?: string;
}
