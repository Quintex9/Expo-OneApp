import React from "react";
import type { DiscoverLocationSheetProps } from "../../lib/interfaces";

/**
 * DiscoverLocationSheet: Web fallback pre location sheet, keď natívna mapová implementácia nie je dostupná.
 *
 * Prečo: Aplikácia ostane kompilovateľná aj na webe bez importovania natívnych mapových závislostí.
 */
export default function DiscoverLocationSheet(_props: DiscoverLocationSheetProps) {
  return null;
}
