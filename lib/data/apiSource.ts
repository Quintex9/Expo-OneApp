/**
 * apiSource: Dátový modul api Source rieši sourcing, normalizáciu alebo orchestráciu dát pre aplikáciu.
 *
 * Prečo: Oddelenie dátových pravidiel v apiSource uľahčuje výmenu datasource bez zmien v komponentoch.
 */

import type { DataSource } from "./source";
import type { BranchDto, MarkerDto } from "./models";
import { mockSource } from "./mockSource";

// Sem pridame realne volania na API (teraz len proxy na mock).
export const apiSource: DataSource = {
  async getBranches(): Promise<BranchDto[]> {
    return mockSource.getBranches();
  },
  async getBranchById(id: string): Promise<BranchDto | null> {
    return mockSource.getBranchById(id);
  },
  async getMarkers(): Promise<MarkerDto[]> {
    return mockSource.getMarkers();
  },
};
