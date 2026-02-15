// marker utils: deterministicke helpery pre title a rating markerov.
// Zodpovednost: stabilne fallback hodnoty z marker ID.
// Vstup/Vystup: funkcie getRatingForId a formatTitleFromId.

const RATING_VALUES = [4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0];

// Deterministicke helpery pre marker title/rating.
// Stabilny pseudo-random rating podla marker ID.
export const getRatingForId = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return RATING_VALUES[hash % RATING_VALUES.length];
};

// Prevod ID-like hodnoty na citatelny nazov.
export const formatTitleFromId = (id: string): string =>
  id
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
