// data source contract: spolocne rozhranie pre vsetky datasource implementacie.
// Zodpovednost: definovat jednotny tvar metod pre branch a marker data.
// Vstup/Vystup: urcuje API pre mock, api aj supabase zdroj.

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
