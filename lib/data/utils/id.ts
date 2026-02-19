/**
 * id: Utility id poskytuje čisté helper funkcie pre prácu s dátami.
 *
 * Prečo: Opakované dátové operácie v id sú na jednom mieste, čo znižuje duplicitu aj chyby.
 */

const DIACRITIC_REGEX = /[\u0300-\u036f]/g;
const SPACE_OR_DASH_REGEX = /[\s-]+/g;
const INVALID_CHARS_REGEX = /[^a-z0-9_]/g;
const DUPLICATE_UNDERSCORES_REGEX = /_+/g;
const EDGE_UNDERSCORES_REGEX = /^_+|_+$/g;

// Utility pre jednotny ID format napriec appkou.
export const normalizeId = (input: string): string => {
  if (!input) {
    return "";
  }

  return input
    .normalize("NFD")
    .replace(DIACRITIC_REGEX, "")
    .trim()
    .toLowerCase()
    .replace(SPACE_OR_DASH_REGEX, "_")
    .replace(INVALID_CHARS_REGEX, "_")
    .replace(DUPLICATE_UNDERSCORES_REGEX, "_")
    .replace(EDGE_UNDERSCORES_REGEX, "");
};

// Porovnanie ID po canonical normalizacii.
export const idsEqual = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) {
    return false;
  }
  return normalizeId(a) === normalizeId(b);
};

// Vrati canonical ID alebo fallback pri prazdnom/neplatnom vstupe.
export const canonicalOrFallbackId = (input?: string | null, fallback = ""): string => {
  if (!input) {
    return fallback;
  }
  const canonical = normalizeId(input);
  return canonical || fallback;
};
