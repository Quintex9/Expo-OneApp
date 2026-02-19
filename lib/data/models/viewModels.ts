/**
 * viewModels: Modelový súbor view Models obsahuje typy pre dátový kontrakt alebo UI view model.
 *
 * Prečo: Typy v viewModels tvoria stabilnú zmluvu medzi datasource vrstvou a prezentačným kódom.
 */

import type { BranchData, DiscoverMapMarker } from "../../interfaces";

// Typy pre UI vrstvu po mapovani.
export interface BranchViewModel extends BranchData {}

export interface MarkerViewModel extends DiscoverMapMarker {}
