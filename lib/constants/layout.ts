/**
 * layout: Súbor layout drží zdieľané konštanty používané vo viacerých moduloch.
 *
 * Prečo: Centralizované hodnoty v layout bránia rozchodu čísel a názvov medzi obrazovkami.
 */

export const BRANCH_CARD_BASELINE_OFFSET = 0;
export const BRANCH_CARD_OVERLAY_PADDING_Y = 7;
// Negative value compensates BranchCard marginBottom (16) + overlay padding (7).
export const BRANCH_CARD_EXTRA_OFFSET = -23;
export const TAB_BAR_BASE_HEIGHT = 60;
export const TAB_BAR_MIN_INSET = 6;
