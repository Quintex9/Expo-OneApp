/**
 * index: Dátový modul index rieši sourcing, normalizáciu alebo orchestráciu dát pre aplikáciu.
 *
 * Prečo: Oddelenie dátových pravidiel v index uľahčuje výmenu datasource bez zmien v komponentoch.
 */

import { mockSource } from "./mockSource";
import type { DataSource } from "./source";
import { apiSource } from "./apiSource";
import { supabaseSource } from "./supabaseSource";
import { AppConfig } from "../config/AppConfig";

// Tu sa rozhoduje, ktory datasource sa ma pouzit.
export const getDataSource = (): DataSource => {
  const mode = AppConfig.dataSource;
  if (mode === "supabase") return supabaseSource; // ked bude supabase, pouzijeme tuto vetvu
  if (mode === "api") return apiSource; // ak by sme mali vlastne API, pojde sem
  return mockSource; // default zostava mock
};
