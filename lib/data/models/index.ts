// models index: barrel export pre data modely.
// Zodpovednost: centralizovat importy modelov cez jedno miesto.
// Vstup/Vystup: re-export DTO aj ViewModel typov.

export type { DataSourceMode, BranchDto, MarkerDto, BranchMenuItemDto } from "./dto";
export type { BranchViewModel, MarkerViewModel } from "./viewModels";
