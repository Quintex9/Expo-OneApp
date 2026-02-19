/**
 * index: Selektor index pripravuje filtrované alebo zoradené kolekcie pre obrazovky.
 *
 * Prečo: Presun výberovej logiky do index udrží komponenty jednoduchšie a výkonovo predvídateľné.
 */

export {
  buildDiscoverListItems,
  filterDiscoverListItems,
  getDistanceKm,
  sortDiscoverListItems,
} from "./discoverListSelectors";
export type { DiscoverListItem, DiscoverListSortOption } from "./discoverListSelectors";
