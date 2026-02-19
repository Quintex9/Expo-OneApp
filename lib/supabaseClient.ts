/**
 * supabaseClient: Inicializuje a exportuje jednu inštanciu Supabase klienta pre celú aplikáciu.
 *
 * Prečo: Jedna klientská inštancia zabraňuje rozdielnej konfigurácii a nepredvídateľným chybám pri API volaniach.
 */

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";
import { AppConfig } from "./config/AppConfig";

const resolvedSupabaseUrl = AppConfig.supabaseUrl ?? SUPABASE_URL;
const resolvedSupabaseAnonKey = AppConfig.supabaseAnonKey ?? SUPABASE_ANON_KEY;

if (!resolvedSupabaseUrl || !resolvedSupabaseAnonKey) {
  console.error(
    "Missing Supabase configuration. Ensure .env contains:\n" +
      "SUPABASE_URL=https://your-project.supabase.co\n" +
      "SUPABASE_ANON_KEY=your-publishable-key"
  );
}

export const supabase = createClient(
  resolvedSupabaseUrl || "",
  resolvedSupabaseAnonKey || "",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);