import type { BranchData, DiscoverMapMarker } from "../interfaces";

export interface DataSource {
  getBranches(): Promise<BranchData[]>;
  getBranchById(id: string): Promise<BranchData | null>;
  getMarkers(): Promise<DiscoverMapMarker[]>;
}
