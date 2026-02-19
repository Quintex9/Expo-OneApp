/**
 * source: Dátový modul source rieši sourcing, normalizáciu alebo orchestráciu dát pre aplikáciu.
 *
 * Prečo: Oddelenie dátových pravidiel v source uľahčuje výmenu datasource bez zmien v komponentoch.
 */

import type { BranchDto, MarkerDto } from "./models";

// Spolocny kontrakt pre vsetky datasource implementacie.
export interface DataSource {
  // Zoznam prevadzok (DTO vrstva).
  getBranches(): Promise<BranchDto[]>;
  // Detail prevadzky podla ID.
  getBranchById(id: string): Promise<BranchDto | null>;
  // Zoznam markerov pre mapu.
  getMarkers(): Promise<MarkerDto[]>;
}
