import type { DataSource } from "./source";
import type { BranchData, DiscoverMapMarker } from "../interfaces";
import { mockSource } from "./mockSource";

// Minimal stub: reuse mock for now. Replace methods with real fetch logic later.
export const apiSource: DataSource = {
  async getBranches(): Promise<BranchData[]> {
    return mockSource.getBranches();
  },
  async getBranchById(id: string): Promise<BranchData | null> {
    return mockSource.getBranchById(id);
  },
  async getMarkers(): Promise<DiscoverMapMarker[]> {
    return mockSource.getMarkers();
  },
};
