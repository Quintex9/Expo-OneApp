import { mockSource } from "./mockSource";
import type { DataSource } from "./source";
import { apiSource } from "./apiSource";
import { supabaseSource } from "./supabaseSource";

// TU sa rozhodujeme, aky zdroj dat pouzime (mock / api / supabase)
export const getDataSource = (): DataSource => {
  const mode = process.env.DATA_SOURCE;
  if (mode === "supabase") return supabaseSource; // ked bude supabase, pouzijeme tuto vetvu
  if (mode === "api") return apiSource; // ak by sme mali vlastne API, pojde sem
  return mockSource; // default zostava mock
};
