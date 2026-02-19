/**
 * stackedIcons: Mapový modul stacked Icons rieši špecifickú časť renderu alebo správania mapy.
 *
 * Prečo: Izolované mapové utility v stackedIcons znižujú riziko regresií pri úpravách markerov a kamery.
 */

import type { ClusterCountKey } from "./clusterIcons";

export const STACKED_ICON_SOURCES: Partial<Record<ClusterCountKey, number>> = {
  "2": require("../../images/icons/stacked/stacked_2.png"),
  "3": require("../../images/icons/stacked/stacked_3.png"),
  "4": require("../../images/icons/stacked/stacked_4.png"),
  "5": require("../../images/icons/stacked/stacked_5.png"),
  "6": require("../../images/icons/stacked/stacked_6.png"),
};
