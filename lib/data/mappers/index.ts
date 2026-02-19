/**
 * index: Mapper index prevádza zdrojové DTO dáta na view model pripravený pre UI.
 *
 * Prečo: Jasne oddelený mapping v index drží fallback pravidlá a normalizáciu mimo komponentov.
 */

export { createMapperContext, normalizeCategoryValue } from "./context";
export type { MapperContext } from "./context";
export { mapBranchDtoToViewModel } from "./branchMapper";
export { mapMarkerDtoToViewModel } from "./markerMapper";
export {
  appendDerivedBranchesFromMarkers,
  buildBranchFromMarkerViewModel,
  groupMarkersByLocation,
} from "./discoverMapper";
export type { GroupedMarkerBucket } from "./discoverMapper";
