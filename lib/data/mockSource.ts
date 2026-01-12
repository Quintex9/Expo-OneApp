import type { DataSource } from "./source";
import type { BranchData, DiscoverMapMarker, DiscoverCategory } from "../interfaces";
import { branchesFixture } from "../fixtures/branches";
import { coords } from "../data/coords";
import { normalizeBranch, formatTitleFromId } from "./normalizers";

const MARKER_ICONS: Record<DiscoverCategory, any> = {
  Fitness: require("../../images/icons/fitness/fitness_without_review.png"),
  Gastro: require("../../images/icons/gastro/gastro_without_rating.png"),
  Relax: require("../../images/icons/relax/relax_without_rating.png"),
  Beauty: require("../../images/icons/beauty/beauty_without_rating.png"),
};

const ratingValues = [4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0];
const getRatingForId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return ratingValues[hash % ratingValues.length];
};

const branchMap = new Map<string, BranchData>();
branchesFixture.forEach((b) => {
  const normalized = normalizeBranch(b);
  branchMap.set(normalized.id ?? normalized.title, normalized);
});

const markers: DiscoverMapMarker[] = coords.map((c) => ({
  id: c.id,
  title: formatTitleFromId(c.id),
  groupId: c.groupId,
  coord: { lng: c.lng, lat: c.lat },
  category: c.category,
  rating: getRatingForId(c.id),
  icon: MARKER_ICONS[c.category],
}));

export const mockSource: DataSource = {
  async getBranches() {
    return Array.from(branchMap.values());
  },
  async getBranchById(id: string) {
    const cached = branchMap.get(id);
    if (cached) return cached;

    const marker = markers.find((m) => m.id === id);
    if (!marker) return null;

    const normalized = normalizeBranch({
      id,
      title: id,
      category: marker.category,
      rating: marker.rating,
    });
    branchMap.set(id, normalized);
    return normalized;
  },
  async getMarkers() {
    return markers;
  },
};
