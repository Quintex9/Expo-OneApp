import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";

// Kontrola, či sú nastavené potrebné premenné
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "❌ Chýbajú Supabase konfiguračné premenné!\n" +
    "Uistite sa, že máte v .env súbore:\n" +
    "SUPABASE_URL=https://your-project.supabase.co\n" +
    "SUPABASE_ANON_KEY=your-publishable-key\n\n" +
    "POZNÁMKA: Supabase zmenilo API kľúče!\n" +
    "Použite nový 'publishable' kľúč namiesto starého 'anon' kľúča.\n" +
    "Nový kľúč nájdete v Supabase Dashboard > Settings > API > Publishable key"
  );
}

export const supabase = createClient(
  SUPABASE_URL || "",
  SUPABASE_ANON_KEY || "",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // Pre React Native nepoužívame PKCE flow (nie je podporovaný WebCrypto API)
      // Necháme default flow, ktorý funguje s novými API kľúčmi
    },
  }
);