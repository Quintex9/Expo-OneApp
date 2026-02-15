// useDataSource: hook pre stabilne nacitanie aktivneho datasource.
// Zodpovednost: memoizuje vybrany zdroj dat pre render cyklus.
// Vstup/Vystup: vracia instanciu DataSource pre dalsie hooky/sluzby.

import { useMemo } from "react";
import { getDataSource } from "./index";
import type { DataSource } from "./source";

// Hook na ziskanie aktualneho zdroja dat (mock/api/supabase)
export const useDataSource = (): DataSource => {
  // useMemo aby sa zdroj nemenil na kazdom renderi.
  return useMemo(() => getDataSource(), []);
};
