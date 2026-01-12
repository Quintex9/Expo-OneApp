import type { DataSource } from "./source";
import type { BranchData, DiscoverMapMarker } from "../interfaces";
import { mockSource } from "./mockSource";

// Sem pridame realne volania na Supabase (teraz len proxy na mock)
export const supabaseSource: DataSource = {
  async getBranches(): Promise<BranchData[]> {
    // TODO: nahradit mock volanie supabase dotazom
    return mockSource.getBranches();
  },
  async getBranchById(id: string): Promise<BranchData | null> {
    // TODO: nahradit mock volanie supabase dotazom
    return mockSource.getBranchById(id);
  },
  async getMarkers(): Promise<DiscoverMapMarker[]> {
    // TODO: nahradit mock volanie supabase dotazom
    return mockSource.getMarkers();
  },
};
