// markerMapper: prevod MarkerDto na MarkerViewModel.
// Zodpovednost: normalizacia ID, ratingu, category a marker ikon.
// Vstup/Vystup: mapMarkerDtoToViewModel pre mapovy render pipeline.

import type { MarkerDto, MarkerViewModel } from "../models";
import { formatTitleFromId, getRatingForId } from "../normalizers";
import { canonicalOrFallbackId, normalizeId } from "../utils/id";
import { toNonEmptyString, type MapperContext } from "./context";

// Mapper pre prevod MarkerDto na MarkerViewModel.
const clampRating = (value: number) => Math.min(5, Math.max(0, value));

const parseRating = (dto: MarkerDto) => {
  if (Number.isFinite(dto.rating)) {
    return clampRating(dto.rating as number);
  }

  if (typeof dto.ratingFormatted === "string") {
    const parsed = Number.parseFloat(dto.ratingFormatted);
    if (Number.isFinite(parsed)) {
      return clampRating(parsed);
    }
  }

  return undefined;
};

const resolveCategory = (dto: MarkerDto, context: MapperContext): MarkerViewModel["category"] => {
  if (dto.category === "Multi") {
    return "Multi";
  }
  return context.resolveCategory(dto.category);
};

export const mapMarkerDtoToViewModel = (
  dto: MarkerDto,
  context: MapperContext
): MarkerViewModel => {
  const id = toNonEmptyString(dto.id) ?? canonicalOrFallbackId(dto.title, "marker");
  const canonicalId = normalizeId(id);
  const category = resolveCategory(dto, context);

  const rating = parseRating(dto) ?? getRatingForId(canonicalId || id);
  const title = toNonEmptyString(dto.title) ?? formatTitleFromId(id);

  const lng = Number.isFinite(dto.coord?.lng) ? dto.coord.lng : 0;
  const lat = Number.isFinite(dto.coord?.lat) ? dto.coord.lat : 0;

  return {
    id,
    title,
    labelPriority: Number.isFinite(dto.labelPriority)
      ? (dto.labelPriority as number)
      : undefined,
    markerSpriteUrl: toNonEmptyString(dto.markerSpriteUrl),
    markerSpriteKey: toNonEmptyString(dto.markerSpriteKey) ?? id,
    coord: { lng, lat },
    groupId: toNonEmptyString(dto.groupId),
    groupCount: Number.isFinite(dto.groupCount)
      ? Math.max(1, Math.round(dto.groupCount as number))
      : undefined,
    icon: context.resolveMarkerIcon(category, dto.iconUrl),
    rating,
    ratingFormatted: rating.toFixed(1),
    category,
  };
};
