// mappers index: barrel export mapper vrstvy.
// Zodpovednost: jednotny import mapovacich funkcii.
// Vstup/Vystup: re-export branch/marker/discover mapper API.

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
