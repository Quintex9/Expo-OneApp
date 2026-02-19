/**
 * supabaseSource: Dátový modul supabase Source rieši sourcing, normalizáciu alebo orchestráciu dát pre aplikáciu.
 *
 * Prečo: Oddelenie dátových pravidiel v supabaseSource uľahčuje výmenu datasource bez zmien v komponentoch.
 */

import type { DataSource } from "./source";
import type { BranchDto, MarkerDto } from "./models";
import { mockSource } from "./mockSource";

// Sem pridame realne volania na Supabase (teraz len proxy na mock)
export const supabaseSource: DataSource = {
  async getBranches(): Promise<BranchDto[]> {
    // TODO: nahradit mock volanie supabase dotazom
    return mockSource.getBranches();
  },
  async getBranchById(id: string): Promise<BranchDto | null> {
    // TODO: nahradit mock volanie supabase dotazom
    return mockSource.getBranchById(id);
  },
  async getMarkers(): Promise<MarkerDto[]> {
    // TODO: nahradit mock volanie supabase dotazom
    return mockSource.getMarkers();
  },
};
