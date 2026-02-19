/**
 * index: Modelový súbor index obsahuje typy pre dátový kontrakt alebo UI view model.
 *
 * Prečo: Typy v index tvoria stabilnú zmluvu medzi datasource vrstvou a prezentačným kódom.
 */

export type { DataSourceMode, BranchDto, MarkerDto, BranchMenuItemDto } from "./dto";
export type { BranchViewModel, MarkerViewModel } from "./viewModels";
