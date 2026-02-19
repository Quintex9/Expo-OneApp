/**
 * useDataSource: Dátový modul use Data Source rieši sourcing, normalizáciu alebo orchestráciu dát pre aplikáciu.
 *
 * Prečo: Oddelenie dátových pravidiel v useDataSource uľahčuje výmenu datasource bez zmien v komponentoch.
 */

import { useMemo } from "react";
import { getDataSource } from "./index";
import type { DataSource } from "./source";

// Hook na ziskanie aktualneho zdroja dat (mock/api/supabase)
export const useDataSource = (): DataSource => {
  // useMemo aby sa zdroj nemenil na kazdom renderi.
  return useMemo(() => getDataSource(), []);
};
