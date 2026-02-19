/**
 * mockSource: Dátový modul mock Source rieši sourcing, normalizáciu alebo orchestráciu dát pre aplikáciu.
 *
 * Prečo: Oddelenie dátových pravidiel v mockSource uľahčuje výmenu datasource bez zmien v komponentoch.
 */

import type { DataSource } from "./source";
import type { BranchDto, MarkerDto } from "./models";
import { branchDtosFixture } from "../fixtures/branchDtos";
import { coords } from "./coords";
import { formatTitleFromId, getRatingForId } from "./utils/marker";
import { normalizeId } from "./utils/id";

const DEFAULT_HOURS = "9:00 - 21:00";
const DEFAULT_DISTANCE = "1.7 km";

const branchList: BranchDto[] = branchDtosFixture.map((branch) => ({
  ...branch,
  imageKey: branch.imageKey ?? normalizeId(branch.category ?? "fitness"),
  labelPriority:
    branch.labelPriority ??
    (Number.isFinite(branch.rating) ? Math.round((branch.rating as number) * 10) : undefined),
}));
const branchByRawId = new Map<string, BranchDto>();
const branchByCanonicalId = new Map<string, BranchDto>();

branchList.forEach((branch) => {
  branchByRawId.set(branch.id, branch);

  const canonicalId = normalizeId(branch.id);
  if (canonicalId && !branchByCanonicalId.has(canonicalId)) {
    branchByCanonicalId.set(canonicalId, branch);
  }
});

const markerList: MarkerDto[] = coords.map((coord) => {
  const rating = getRatingForId(coord.id);
  return {
    id: coord.id,
    title: formatTitleFromId(coord.id),
    groupId: coord.groupId,
    coord: { lng: coord.lng, lat: coord.lat },
    category: coord.category,
    rating,
    ratingFormatted: rating.toFixed(1),
    iconKey: normalizeId(coord.category),
    markerSpriteKey: coord.id,
    labelPriority: Math.round(rating * 10),
  } satisfies MarkerDto;
});

const markerByRawId = new Map<string, MarkerDto>();
const markerByCanonicalId = new Map<string, MarkerDto>();

markerList.forEach((marker) => {
  markerByRawId.set(marker.id, marker);

  const canonicalId = normalizeId(marker.id);
  if (canonicalId && !markerByCanonicalId.has(canonicalId)) {
    markerByCanonicalId.set(canonicalId, marker);
  }
});

const findBranch = (id: string) => {
  const byRaw = branchByRawId.get(id);
  if (byRaw) {
    return byRaw;
  }

  const canonicalId = normalizeId(id);
  if (!canonicalId) {
    return undefined;
  }

  return branchByCanonicalId.get(canonicalId);
};

const findMarker = (id: string) => {
  const byRaw = markerByRawId.get(id);
  if (byRaw) {
    return byRaw;
  }

  const canonicalId = normalizeId(id);
  if (!canonicalId) {
    return undefined;
  }

  return markerByCanonicalId.get(canonicalId);
};

const buildBranchFromMarker = (id: string, marker: MarkerDto): BranchDto => {
  const markerId = marker.id || id;
  const derivedBranch: BranchDto = {
    id: markerId,
    title: marker.title ?? formatTitleFromId(markerId),
    category: marker.category === "Multi" ? "Fitness" : marker.category,
    rating: Number.isFinite(marker.rating) ? marker.rating : getRatingForId(markerId),
    distance: DEFAULT_DISTANCE,
    hours: DEFAULT_HOURS,
    coordinates: [marker.coord.lng, marker.coord.lat],
    imageKey: normalizeId(marker.category === "Multi" ? "fitness" : marker.category),
    labelPriority: marker.labelPriority,
  };

  branchByRawId.set(markerId, derivedBranch);

  const canonicalId = normalizeId(id || markerId);
  if (canonicalId && !branchByCanonicalId.has(canonicalId)) {
    branchByCanonicalId.set(canonicalId, derivedBranch);
  }

  return derivedBranch;
};

export const mockSource: DataSource = {
  async getBranches() {
    return branchList;
  },

  async getBranchById(id: string) {
    const branch = findBranch(id);
    if (branch) {
      return branch;
    }

    const marker = findMarker(id);
    if (!marker) {
      return null;
    }

    return buildBranchFromMarker(id, marker);
  },

  async getMarkers() {
    return markerList;
  },
};
