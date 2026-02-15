// view models: UI orientovane typy po mapovani z DTO.
// Zodpovednost: drzat shape pripraveny pre React Native komponenty.
// Vstup/Vystup: exportuje BranchViewModel a MarkerViewModel.

import type { BranchData, DiscoverMapMarker } from "../../interfaces";

// Typy pre UI vrstvu po mapovani.
export interface BranchViewModel extends BranchData {}

export interface MarkerViewModel extends DiscoverMapMarker {}
