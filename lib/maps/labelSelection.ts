/**
 * labelSelection: Mapovy modul label Selection riesi specificku cast renderu alebo spravania mapy.
 *
 * Preco: Izolovane mapove utility v labelSelection znizuju riziko regresii pri upravach markerov a kamery.
 */

import {
  MAP_LABEL_CANDIDATE_MULTIPLIER,
  MAP_LABEL_COLLISION_GAP_X,
  MAP_LABEL_COLLISION_GAP_Y,
  MAP_LABEL_COLLISION_HEIGHT_SCALE_V3,
  MAP_LABEL_COLLISION_WIDTH_SCALE_V3,
  MAP_LABEL_ENTER_ZOOM,
  MAP_LABEL_EXIT_ZOOM,
  MAP_LABEL_HIGH_ZOOM_MAX,
  MAP_LABEL_LOW_ZOOM_MAX,
  MAP_LABEL_MAX_CANDIDATES_V3,
  MAP_LABEL_MAX_MARKERS,
  MAP_LABEL_MAX_WIDTH_PX,
  MAP_LABEL_MID_ZOOM_MAX,
  MAP_LABEL_SLOT_OFFSETS,
  MAP_LABEL_SLOT_PENALTIES,
  MAP_LABEL_STICKY_SCORE_BONUS,
  MAP_LABEL_STICKY_SLOT_BONUS,
} from "../constants/discover";
import type { DiscoverMapLabelPolicy } from "../interfaces";

export type MarkerLabelCandidate = {
  id: string;
  title: string;
  coordinate: { latitude: number; longitude: number };
  rating: number;
  estimatedWidth?: number;
  labelPriority: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
  labelHeight?: number;
  collisionWidth?: number;
  collisionHeight?: number;
  markerCollisionZones?: MarkerCollisionZone[];
  markerCollisionRows?: MarkerCollisionRow[];
  markerCollisionWidth?: number;
  markerCollisionHeight?: number;
  markerCollisionOffsetX?: number;
  markerCollisionOffsetY?: number;
  screenX?: number;
  screenY?: number;
};

export type MarkerCollisionZone = {
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
};

export type MarkerCollisionRowSegment = {
  left: number;
  right: number;
};

export type MarkerCollisionRow = {
  offsetY: number;
  height?: number;
  segments: MarkerCollisionRowSegment[];
};

export type MarkerObstacleScope = "placed" | "all";

export type LabelSlot = "below" | "below-right" | "below-left" | "above";

export type LabelPlacement = {
  id: string;
  title: string;
  slot: LabelSlot;
  left: number;
  top: number;
  width: number;
  height: number;
  screenX: number;
  screenY: number;
  score: number;
};

export type InlineLabelLayoutResult = {
  placements: LabelPlacement[];
  ids: string[];
  hash: string;
  enabled: boolean;
  budget: number;
  candidateCount: number;
  projectedCount: number;
  hiddenCount: number;
  rejectedByCollision: number;
  forcedPlaced: number;
  evicted: number;
};

export type ResolvedDiscoverMapLabelPolicy = {
  minZoom: number;
  enterZoom: number;
  exitZoom: number;
  lowZoomMax: number;
  midZoomMax: number;
  highZoomMax: number;
  maxMarkersForLabels: number;
};

type LabelRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type SlotOffset = { x: number; y: number };
type SlotOffsetMap = Record<LabelSlot, SlotOffset>;
type SlotPenaltyMap = Record<LabelSlot, number>;
type SlotVariant = {
  canonicalSlot: LabelSlot;
  slots: LabelSlot[];
  offset: SlotOffset;
  penalty: number;
  stableOrder: number;
};

type SelectInlineLabelLayoutParams = {
  candidates: MarkerLabelCandidate[];
  center: [number, number];
  zoom: number;
  singleModeZoom: number;
  preferVisibleNonOverlapping?: boolean;
  mapSize: { width: number; height: number };
  labelSize: { width: number; height: number; offsetY: number };
  policy: ResolvedDiscoverMapLabelPolicy;
  wasEnabled: boolean;
  candidateMultiplier?: number;
  collisionGapX?: number;
  collisionGapY?: number;
  collisionWidthScale?: number;
  collisionHeightScale?: number;
  stickyIds?: Set<string>;
  stickySlots?: ReadonlyMap<string, LabelSlot>;
  forceIncludeIds?: Set<string>;
  stickyScoreBonus?: number;
  stickySlotBonus?: number;
  maxLabelWidth?: number;
  maxCandidates?: number;
  slotOffsets?: Partial<SlotOffsetMap>;
  slotPenalties?: Partial<SlotPenaltyMap>;
  markerObstacleScope?: MarkerObstacleScope;
};

type ProjectedCandidate = {
  id: string;
  title: string;
  screenX: number;
  screenY: number;
  rating: number;
  labelWidth: number;
  labelHeight: number;
  collisionWidth: number;
  collisionHeight: number;
  markerCollisionZones: ResolvedMarkerCollisionZone[];
  markerCollisionRows: ResolvedMarkerCollisionRow[];
  labelOffsetX: number;
  labelOffsetY: number;
  labelPriority: number;
  distanceToCenterPx: number;
  neighborCount: number;
};

type ScoredProjectedCandidate = ProjectedCandidate & { baseScore: number };

type PlacedLabelEntry = {
  id: string;
  forced: boolean;
  active: boolean;
  score: number;
  slot: LabelSlot;
  rect: LabelRect;
  markerObstacleIndices: number[];
  placement: LabelPlacement;
};

type MarkerObstacleEntry = {
  id: string;
  active: boolean;
  rect: LabelRect;
  screenX: number;
  screenY: number;
  rows?: ResolvedMarkerCollisionRow[];
};

type ResolvedMarkerCollisionZone = {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

type ResolvedMarkerCollisionRowSegment = {
  left: number;
  right: number;
};

type ResolvedMarkerCollisionRow = {
  top: number;
  bottom: number;
  segments: ResolvedMarkerCollisionRowSegment[];
};

const TILE_SIZE = 256;
const MAX_ZOOM = 20;
const MIN_ZOOM = 0;
const SLOT_ORDER: LabelSlot[] = ["below", "below-right", "below-left", "above"];
const LABEL_VIEWPORT_MARGIN = 12;
const DENSITY_GRID_CELL_SIZE = 96;
const MIN_COLLISION_SCALE = 0.45;
const MAX_COLLISION_SCALE = 1;
const MIN_COLLISION_GRID_CELL_SIZE = 44;
const MAX_COLLISION_GRID_CELL_SIZE = 128;
const MIN_LABEL_HEIGHT_PX = 8;
const MAX_LABEL_HEIGHT_PX = 128;
const MIN_MARKER_COLLISION_SIZE_PX = 0;
const MIN_MARKER_COLLISION_ROW_HEIGHT_PX = 0.5;
const MARKER_COLLISION_MIN_OVERLAP_WIDTH_PX = 1;
const MARKER_COLLISION_MIN_OVERLAP_HEIGHT_PX = 1;
const MARKER_COLLISION_MIN_OVERLAP_AREA_PX2 = 1;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const projectToWorld = (longitude: number, latitude: number, worldSize: number) => {
  const x = ((longitude + 180) / 360) * worldSize;
  const sinLat = Math.sin((latitude * Math.PI) / 180);
  const clampedSinLat = Math.min(0.9999, Math.max(-0.9999, sinLat));
  const y =
    (0.5 -
      Math.log((1 + clampedSinLat) / (1 - clampedSinLat)) / (4 * Math.PI)) *
    worldSize;
  return { x, y };
};

const wrapWorldDelta = (delta: number, worldSize: number) => {
  if (delta > worldSize / 2) {
    return delta - worldSize;
  }
  if (delta < -worldSize / 2) {
    return delta + worldSize;
  }
  return delta;
};

const rectsOverlap = (a: LabelRect, b: LabelRect) =>
  !(
    a.right <= b.left ||
    a.left >= b.right ||
    a.bottom <= b.top ||
    a.top >= b.bottom
  );

const rectIntersectionMetrics = (a: LabelRect, b: LabelRect) => {
  const overlapWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapHeight = Math.max(
    0,
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  );
  return {
    width: overlapWidth,
    height: overlapHeight,
    area: overlapWidth * overlapHeight,
  };
};

const hasMarkerRowsCollision = (
  labelRect: LabelRect,
  markerCenterX: number,
  markerCenterY: number,
  rows: ResolvedMarkerCollisionRow[]
) => {
  let overlapArea = 0;
  let overlapWidthMax = 0;
  let overlapTop = Number.POSITIVE_INFINITY;
  let overlapBottom = Number.NEGATIVE_INFINITY;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const rowTop = markerCenterY + row.top;
    const rowBottom = markerCenterY + row.bottom;
    if (rowBottom <= labelRect.top) {
      continue;
    }
    if (rowTop >= labelRect.bottom) {
      break;
    }
    const rowOverlapTop = Math.max(labelRect.top, rowTop);
    const rowOverlapBottom = Math.min(labelRect.bottom, rowBottom);
    if (rowOverlapBottom <= rowOverlapTop) {
      continue;
    }
    const rowOverlapHeight = rowOverlapBottom - rowOverlapTop;
    let rowIntersected = false;

    for (let segmentIndex = 0; segmentIndex < row.segments.length; segmentIndex += 1) {
      const segment = row.segments[segmentIndex];
      const segmentLeft = markerCenterX + segment.left;
      const segmentRight = markerCenterX + segment.right;
      const overlapLeft = Math.max(labelRect.left, segmentLeft);
      const overlapRight = Math.min(labelRect.right, segmentRight);
      if (overlapRight <= overlapLeft) {
        continue;
      }
      const overlapWidth = overlapRight - overlapLeft;
      overlapArea += overlapWidth * rowOverlapHeight;
      overlapWidthMax = Math.max(overlapWidthMax, overlapWidth);
      rowIntersected = true;
    }

    if (!rowIntersected) {
      continue;
    }
    overlapTop = Math.min(overlapTop, rowOverlapTop);
    overlapBottom = Math.max(overlapBottom, rowOverlapBottom);

    if (
      overlapArea >= MARKER_COLLISION_MIN_OVERLAP_AREA_PX2 &&
      overlapWidthMax >= MARKER_COLLISION_MIN_OVERLAP_WIDTH_PX &&
      overlapBottom - overlapTop >= MARKER_COLLISION_MIN_OVERLAP_HEIGHT_PX
    ) {
      return true;
    }
  }

  return false;
};

const densityCellKey = (x: number, y: number) => `${x}:${y}`;

const collisionCellKey = (x: number, y: number) => `${x}:${y}`;

const rectToCellBounds = (rect: LabelRect, cellSize: number) => ({
  minX: Math.floor(rect.left / cellSize),
  maxX: Math.floor(rect.right / cellSize),
  minY: Math.floor(rect.top / cellSize),
  maxY: Math.floor(rect.bottom / cellSize),
});

const compareScoresDesc = (a: ScoredProjectedCandidate, b: ScoredProjectedCandidate) => {
  if (b.baseScore !== a.baseScore) {
    return b.baseScore - a.baseScore;
  }
  if (b.labelPriority !== a.labelPriority) {
    return b.labelPriority - a.labelPriority;
  }
  if (b.rating !== a.rating) {
    return b.rating - a.rating;
  }
  return a.id.localeCompare(b.id);
};

const toRankingScore = (
  candidate: ProjectedCandidate,
  maxDistance: number,
  minPriority: number,
  maxPriority: number,
  isSticky: boolean,
  stickyScoreBonus: number
) => {
  const ratingNorm = clampNumber(candidate.rating / 5, 0, 1);
  const distanceNorm =
    maxDistance > 0
      ? clampNumber(1 - candidate.distanceToCenterPx / maxDistance, 0, 1)
      : 1;
  const priorityNorm =
    maxPriority > minPriority
      ? clampNumber(
          (candidate.labelPriority - minPriority) / (maxPriority - minPriority),
          0,
          1
        )
      : candidate.labelPriority > 0
        ? 1
        : 0;
  const baseScore = ratingNorm * 0.55 + distanceNorm * 0.35 + priorityNorm * 0.1;
  const orphanBonus = candidate.neighborCount === 0 ? 0.08 : 0;
  return baseScore + orphanBonus + (isSticky ? stickyScoreBonus : 0);
};

const shouldEnableLabels = (
  zoom: number,
  markerCount: number,
  wasEnabled: boolean,
  singleModeZoom: number,
  policy: ResolvedDiscoverMapLabelPolicy
) => {
  if (!Number.isFinite(zoom) || markerCount === 0) {
    return false;
  }
  if (markerCount > policy.maxMarkersForLabels && zoom < singleModeZoom) {
    return false;
  }
  if (wasEnabled) {
    return zoom >= policy.exitZoom;
  }
  return zoom >= policy.enterZoom;
};

const buildSlotOffsets = (overrides?: Partial<SlotOffsetMap>): SlotOffsetMap => ({
  below: overrides?.below ?? MAP_LABEL_SLOT_OFFSETS.below,
  "below-right": overrides?.["below-right"] ?? MAP_LABEL_SLOT_OFFSETS["below-right"],
  "below-left": overrides?.["below-left"] ?? MAP_LABEL_SLOT_OFFSETS["below-left"],
  above: overrides?.above ?? MAP_LABEL_SLOT_OFFSETS.above,
});

const buildSlotPenalties = (overrides?: Partial<SlotPenaltyMap>): SlotPenaltyMap => ({
  below: overrides?.below ?? MAP_LABEL_SLOT_PENALTIES.below,
  "below-right":
    overrides?.["below-right"] ?? MAP_LABEL_SLOT_PENALTIES["below-right"],
  "below-left": overrides?.["below-left"] ?? MAP_LABEL_SLOT_PENALTIES["below-left"],
  above: overrides?.above ?? MAP_LABEL_SLOT_PENALTIES.above,
});

const buildSlotVariants = (
  offsets: SlotOffsetMap,
  penalties: SlotPenaltyMap
): SlotVariant[] => {
  const bySignature = new Map<string, SlotVariant>();
  SLOT_ORDER.forEach((slot, stableOrder) => {
    const offset = offsets[slot];
    const penalty = penalties[slot] ?? 0;
    const signature = `${offset.x.toFixed(3)}:${offset.y.toFixed(3)}:${penalty.toFixed(4)}`;
    const existing = bySignature.get(signature);
    if (existing) {
      existing.slots.push(slot);
      return;
    }
    bySignature.set(signature, {
      canonicalSlot: slot,
      slots: [slot],
      offset,
      penalty,
      stableOrder,
    });
  });
  return Array.from(bySignature.values());
};

const buildSlotVariantAttemptOrder = (
  stickySlot: LabelSlot | undefined,
  variants: SlotVariant[],
  stickySlotBonus: number
) => {
  const orderScore = (variant: SlotVariant) => {
    const stickyBonus =
      stickySlot && variant.slots.includes(stickySlot) ? stickySlotBonus : 0;
    return stickyBonus - variant.penalty;
  };

  return [...variants].sort((left, right) => {
    const diff = orderScore(right) - orderScore(left);
    if (Math.abs(diff) > 0.000001) {
      return diff;
    }
    return left.stableOrder - right.stableOrder;
  });
};

const getLabelBudgetByZoom = (
  zoom: number,
  singleModeZoom: number,
  policy: ResolvedDiscoverMapLabelPolicy
) => {
  if (!Number.isFinite(zoom) || zoom < policy.minZoom) {
    return 0;
  }
  if (zoom < singleModeZoom) {
    return policy.lowZoomMax;
  }
  if (zoom < singleModeZoom + 1.2) {
    return policy.midZoomMax;
  }
  return policy.highZoomMax;
};

const toHash = (placements: LabelPlacement[]) =>
  [...placements]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((placement) => `${placement.id}:${placement.slot}`)
    .join("|");

export const normalizeDiscoverMapLabelPolicy = (
  policy?: Partial<DiscoverMapLabelPolicy>
): ResolvedDiscoverMapLabelPolicy => {
  const minZoomInput = normalizeNumber(policy?.minZoom);
  const enterZoomInput = normalizeNumber(policy?.enterZoom);
  const exitZoomInput = normalizeNumber(policy?.exitZoom);
  const lowZoomMaxInput = normalizeNumber(policy?.lowZoomMax);
  const midZoomMaxInput = normalizeNumber(policy?.midZoomMax);
  const highZoomMaxInput = normalizeNumber(policy?.highZoomMax);
  const maxMarkersInput = normalizeNumber(policy?.maxMarkersForLabels);

  const minZoom = clampNumber(
    minZoomInput ?? Math.min(MAP_LABEL_ENTER_ZOOM, MAP_LABEL_EXIT_ZOOM),
    MIN_ZOOM,
    MAX_ZOOM
  );
  const enterZoom = clampNumber(
    Math.max(minZoom, enterZoomInput ?? MAP_LABEL_ENTER_ZOOM),
    minZoom,
    MAX_ZOOM
  );
  const exitZoom = clampNumber(
    exitZoomInput ?? MAP_LABEL_EXIT_ZOOM,
    minZoom,
    enterZoom
  );

  const lowZoomMax = Math.max(1, Math.round(lowZoomMaxInput ?? MAP_LABEL_LOW_ZOOM_MAX));
  const midZoomMax = Math.max(
    lowZoomMax,
    Math.round(midZoomMaxInput ?? MAP_LABEL_MID_ZOOM_MAX)
  );
  const highZoomMax = Math.max(
    midZoomMax,
    Math.round(highZoomMaxInput ?? MAP_LABEL_HIGH_ZOOM_MAX)
  );
  const maxMarkersForLabels = Math.max(
    1,
    Math.round(maxMarkersInput ?? MAP_LABEL_MAX_MARKERS)
  );

  return {
    minZoom,
    enterZoom,
    exitZoom,
    lowZoomMax,
    midZoomMax,
    highZoomMax,
    maxMarkersForLabels,
  };
};

export const selectInlineLabelLayout = ({
  candidates,
  center,
  zoom,
  singleModeZoom,
  preferVisibleNonOverlapping,
  mapSize,
  labelSize,
  policy,
  wasEnabled,
  candidateMultiplier,
  collisionGapX,
  collisionGapY,
  collisionWidthScale,
  collisionHeightScale,
  stickyIds,
  stickySlots,
  forceIncludeIds,
  stickyScoreBonus,
  stickySlotBonus,
  maxLabelWidth,
  maxCandidates,
  slotOffsets,
  slotPenalties,
  markerObstacleScope,
}: SelectInlineLabelLayoutParams): InlineLabelLayoutResult => {
  const useVisibleNonOverlappingMode = preferVisibleNonOverlapping === true;
  const enabled = useVisibleNonOverlappingMode
    ? Number.isFinite(zoom) && zoom >= singleModeZoom && candidates.length > 0
    : shouldEnableLabels(
        zoom,
        candidates.length,
        wasEnabled,
        singleModeZoom,
        policy
      );

  if (!enabled) {
    return {
      placements: [],
      ids: [],
      hash: "",
      enabled: false,
      budget: 0,
      candidateCount: candidates.length,
      projectedCount: 0,
      hiddenCount: 0,
      rejectedByCollision: 0,
      forcedPlaced: 0,
      evicted: 0,
    };
  }

  if (mapSize.width <= 0 || mapSize.height <= 0) {
    return {
      placements: [],
      ids: [],
      hash: "",
      enabled: true,
      budget: 0,
      candidateCount: candidates.length,
      projectedCount: 0,
      hiddenCount: 0,
      rejectedByCollision: 0,
      forcedPlaced: 0,
      evicted: 0,
    };
  }

  const rawBudget = useVisibleNonOverlappingMode
    ? Math.max(1, candidates.length)
    : getLabelBudgetByZoom(zoom, singleModeZoom, policy);
  if (rawBudget <= 0) {
    return {
      placements: [],
      ids: [],
      hash: "",
      enabled: true,
      budget: 0,
      candidateCount: candidates.length,
      projectedCount: 0,
      hiddenCount: 0,
      rejectedByCollision: 0,
      forcedPlaced: 0,
      evicted: 0,
    };
  }

  const worldSize = TILE_SIZE * Math.pow(2, clampNumber(zoom, MIN_ZOOM, MAX_ZOOM));
  const centerPoint = projectToWorld(center[0], center[1], worldSize);
  const diagonal = Math.hypot(mapSize.width, mapSize.height) || 1;
  const resolvedStickyScoreBonus =
    typeof stickyScoreBonus === "number" && Number.isFinite(stickyScoreBonus)
      ? stickyScoreBonus
      : MAP_LABEL_STICKY_SCORE_BONUS;
  const resolvedStickySlotBonus =
    typeof stickySlotBonus === "number" && Number.isFinite(stickySlotBonus)
      ? stickySlotBonus
      : MAP_LABEL_STICKY_SLOT_BONUS;
  const resolvedCollisionWidthScale = clampNumber(
    typeof collisionWidthScale === "number" && Number.isFinite(collisionWidthScale)
      ? collisionWidthScale
      : MAP_LABEL_COLLISION_WIDTH_SCALE_V3,
    MIN_COLLISION_SCALE,
    MAX_COLLISION_SCALE
  );
  const resolvedCollisionHeightScale = clampNumber(
    typeof collisionHeightScale === "number" && Number.isFinite(collisionHeightScale)
      ? collisionHeightScale
      : MAP_LABEL_COLLISION_HEIGHT_SCALE_V3,
    MIN_COLLISION_SCALE,
    MAX_COLLISION_SCALE
  );
  const resolvedGapX = collisionGapX ?? MAP_LABEL_COLLISION_GAP_X;
  const resolvedGapY = collisionGapY ?? MAP_LABEL_COLLISION_GAP_Y;
  const resolvedSlotOffsets = buildSlotOffsets(slotOffsets);
  const resolvedSlotPenalties = buildSlotPenalties(slotPenalties);
  const resolvedMarkerObstacleScope: MarkerObstacleScope =
    markerObstacleScope === "all" ? "all" : "placed";
  const maxAllowedLabelWidth = clampNumber(
    typeof maxLabelWidth === "number" && Number.isFinite(maxLabelWidth)
      ? maxLabelWidth
      : MAP_LABEL_MAX_WIDTH_PX,
    labelSize.width,
    Math.max(labelSize.width, MAP_LABEL_MAX_WIDTH_PX)
  );
  const maxViewportLabelWidth = Math.max(
    labelSize.width,
    Math.min(maxAllowedLabelWidth, mapSize.width - 24)
  );

  const projected: ProjectedCandidate[] = [];
  let projectedLabelWidthSum = 0;
  let projectedLabelHeightSum = 0;
  let projectedCollisionWidthSum = 0;
  let projectedCollisionHeightSum = 0;
  let projectedMarkerCollisionWidthSum = 0;
  let projectedMarkerCollisionHeightSum = 0;
  let projectedMarkerCollisionCount = 0;
  const densityCounts = new Map<string, number>();

  candidates.forEach((candidate) => {
    const coordinate = candidate.coordinate;
    if (
      !Number.isFinite(coordinate.latitude) ||
      !Number.isFinite(coordinate.longitude)
    ) {
      return;
    }

    const explicitScreenX = candidate.screenX;
    const explicitScreenY = candidate.screenY;
    const hasExplicitScreenPoint =
      typeof explicitScreenX === "number" &&
      Number.isFinite(explicitScreenX) &&
      typeof explicitScreenY === "number" &&
      Number.isFinite(explicitScreenY);
    let screenX = 0;
    let screenY = 0;
    let distanceToCenterPx = 0;

    if (hasExplicitScreenPoint) {
      screenX = explicitScreenX!;
      screenY = explicitScreenY!;
      distanceToCenterPx = Math.hypot(
        screenX - mapSize.width / 2,
        screenY - mapSize.height / 2
      );
    } else {
      const candidatePoint = projectToWorld(
        coordinate.longitude,
        coordinate.latitude,
        worldSize
      );
      const dx = wrapWorldDelta(candidatePoint.x - centerPoint.x, worldSize);
      const dy = candidatePoint.y - centerPoint.y;
      screenX = mapSize.width / 2 + dx;
      screenY = mapSize.height / 2 + dy;
      distanceToCenterPx = Math.hypot(dx, dy);
    }
    const labelWidth = clampNumber(
      typeof candidate.estimatedWidth === "number" && Number.isFinite(candidate.estimatedWidth)
        ? candidate.estimatedWidth
        : labelSize.width,
      labelSize.width,
      maxViewportLabelWidth
    );
    const labelHeight = clampNumber(
      typeof candidate.labelHeight === "number" && Number.isFinite(candidate.labelHeight)
        ? candidate.labelHeight
        : labelSize.height,
      MIN_LABEL_HEIGHT_PX,
      Math.max(
        MIN_LABEL_HEIGHT_PX,
        Math.min(MAX_LABEL_HEIGHT_PX, mapSize.height + LABEL_VIEWPORT_MARGIN * 2)
      )
    );
    const labelOffsetX =
      typeof candidate.labelOffsetX === "number" && Number.isFinite(candidate.labelOffsetX)
        ? candidate.labelOffsetX
        : 0;
    const labelOffsetY =
      typeof candidate.labelOffsetY === "number" && Number.isFinite(candidate.labelOffsetY)
        ? candidate.labelOffsetY
        : labelSize.offsetY;
    const collisionWidth = clampNumber(
      typeof candidate.collisionWidth === "number" &&
        Number.isFinite(candidate.collisionWidth)
        ? candidate.collisionWidth
        : labelWidth,
      16,
      labelWidth
    );
    const collisionHeight = clampNumber(
      typeof candidate.collisionHeight === "number" &&
        Number.isFinite(candidate.collisionHeight)
        ? candidate.collisionHeight
        : labelHeight,
      MIN_LABEL_HEIGHT_PX,
      labelHeight
    );
    const fallbackMarkerCollisionZones: MarkerCollisionZone[] =
      typeof candidate.markerCollisionWidth === "number" &&
      Number.isFinite(candidate.markerCollisionWidth) &&
      typeof candidate.markerCollisionHeight === "number" &&
      Number.isFinite(candidate.markerCollisionHeight)
        ? [
            {
              width: candidate.markerCollisionWidth,
              height: candidate.markerCollisionHeight,
              offsetX: candidate.markerCollisionOffsetX,
              offsetY: candidate.markerCollisionOffsetY,
            },
          ]
        : [];
    const rawMarkerCollisionZones =
      Array.isArray(candidate.markerCollisionZones) &&
      candidate.markerCollisionZones.length > 0
        ? candidate.markerCollisionZones
        : fallbackMarkerCollisionZones;
    const markerCollisionZones: ResolvedMarkerCollisionZone[] = [];
    rawMarkerCollisionZones.forEach((zone) => {
      const zoneWidth = clampNumber(
        typeof zone.width === "number" && Number.isFinite(zone.width) ? zone.width : 0,
        MIN_MARKER_COLLISION_SIZE_PX,
        Math.max(
          MIN_MARKER_COLLISION_SIZE_PX,
          mapSize.width + LABEL_VIEWPORT_MARGIN * 2
        )
      );
      const zoneHeight = clampNumber(
        typeof zone.height === "number" && Number.isFinite(zone.height) ? zone.height : 0,
        MIN_MARKER_COLLISION_SIZE_PX,
        Math.max(
          MIN_MARKER_COLLISION_SIZE_PX,
          mapSize.height + LABEL_VIEWPORT_MARGIN * 2
        )
      );
      if (zoneWidth <= 0 || zoneHeight <= 0) {
        return;
      }
      markerCollisionZones.push({
        width: zoneWidth,
        height: zoneHeight,
        offsetX:
          typeof zone.offsetX === "number" && Number.isFinite(zone.offsetX)
            ? zone.offsetX
            : 0,
        offsetY:
          typeof zone.offsetY === "number" && Number.isFinite(zone.offsetY)
            ? zone.offsetY
            : 0,
        });
    });
    const markerCollisionRows: ResolvedMarkerCollisionRow[] = [];
    if (
      Array.isArray(candidate.markerCollisionRows) &&
      candidate.markerCollisionRows.length > 0
    ) {
      candidate.markerCollisionRows.forEach((row) => {
        const rowTop =
          typeof row.offsetY === "number" && Number.isFinite(row.offsetY)
            ? row.offsetY
            : 0;
        const rowHeight = clampNumber(
          typeof row.height === "number" && Number.isFinite(row.height)
            ? row.height
            : 1,
          MIN_MARKER_COLLISION_ROW_HEIGHT_PX,
          Math.max(
            MIN_MARKER_COLLISION_ROW_HEIGHT_PX,
            mapSize.height + LABEL_VIEWPORT_MARGIN * 2
          )
        );
        if (!Array.isArray(row.segments) || row.segments.length === 0) {
          return;
        }
        const segments: ResolvedMarkerCollisionRowSegment[] = [];
        row.segments.forEach((segment) => {
          const segmentLeft =
            typeof segment.left === "number" && Number.isFinite(segment.left)
              ? segment.left
              : 0;
          const segmentRight =
            typeof segment.right === "number" && Number.isFinite(segment.right)
              ? segment.right
              : segmentLeft;
          if (segmentRight <= segmentLeft) {
            return;
          }
          segments.push({
            left: segmentLeft,
            right: segmentRight,
          });
        });
        if (segments.length === 0) {
          return;
        }
        markerCollisionRows.push({
          top: rowTop,
          bottom: rowTop + rowHeight,
          segments,
        });
      });
    }
    const renderLeft = screenX + labelOffsetX - labelWidth / 2;
    const renderTop = screenY + labelOffsetY;
    const renderRight = renderLeft + labelWidth;
    const renderBottom = renderTop + labelHeight;

    if (
      renderRight < -LABEL_VIEWPORT_MARGIN ||
      renderLeft > mapSize.width + LABEL_VIEWPORT_MARGIN ||
      renderBottom < -LABEL_VIEWPORT_MARGIN ||
      renderTop > mapSize.height + LABEL_VIEWPORT_MARGIN
    ) {
      return;
    }

    const normalizedRating = Number.isFinite(candidate.rating)
      ? clampNumber(candidate.rating, 0, 5)
      : 0;

    projected.push({
      id: candidate.id,
      title: candidate.title,
      screenX,
      screenY,
      rating: normalizedRating,
      labelWidth,
      labelHeight,
      collisionWidth,
      collisionHeight,
      markerCollisionZones,
      markerCollisionRows,
      labelOffsetX,
      labelOffsetY,
      labelPriority: Number.isFinite(candidate.labelPriority)
        ? candidate.labelPriority
        : 0,
      distanceToCenterPx,
      neighborCount: 0,
    });
    projectedLabelWidthSum += labelWidth;
    projectedLabelHeightSum += labelHeight;
    projectedCollisionWidthSum += collisionWidth;
    projectedCollisionHeightSum += collisionHeight;
    markerCollisionZones.forEach((zone) => {
      projectedMarkerCollisionWidthSum += zone.width;
      projectedMarkerCollisionHeightSum += zone.height;
      projectedMarkerCollisionCount += 1;
    });

    const densityX = Math.floor(screenX / DENSITY_GRID_CELL_SIZE);
    const densityY = Math.floor(screenY / DENSITY_GRID_CELL_SIZE);
    const key = densityCellKey(densityX, densityY);
    densityCounts.set(key, (densityCounts.get(key) ?? 0) + 1);
  });

  if (projected.length === 0) {
    return {
      placements: [],
      ids: [],
      hash: "",
      enabled: true,
      budget: rawBudget,
      candidateCount: candidates.length,
      projectedCount: 0,
      hiddenCount: 0,
      rejectedByCollision: 0,
      forcedPlaced: 0,
      evicted: 0,
    };
  }

  projected.forEach((candidate) => {
    const densityX = Math.floor(candidate.screenX / DENSITY_GRID_CELL_SIZE);
    const densityY = Math.floor(candidate.screenY / DENSITY_GRID_CELL_SIZE);
    let neighbors = 0;

    for (let x = densityX - 1; x <= densityX + 1; x += 1) {
      for (let y = densityY - 1; y <= densityY + 1; y += 1) {
        neighbors += densityCounts.get(densityCellKey(x, y)) ?? 0;
      }
    }
    candidate.neighborCount = Math.max(0, neighbors - 1);
  });

  let minPriority = Number.POSITIVE_INFINITY;
  let maxPriority = Number.NEGATIVE_INFINITY;
  projected.forEach((candidate) => {
    minPriority = Math.min(minPriority, candidate.labelPriority);
    maxPriority = Math.max(maxPriority, candidate.labelPriority);
  });

  const scoredCandidates: ScoredProjectedCandidate[] = projected.map((candidate) => ({
    ...candidate,
    baseScore: toRankingScore(
      candidate,
      diagonal,
      minPriority,
      maxPriority,
      stickyIds?.has(candidate.id) ?? false,
      resolvedStickyScoreBonus
    ),
  }));
  scoredCandidates.sort(compareScoresDesc);

  const maxCandidatesRaw =
    typeof maxCandidates === "number" && Number.isFinite(maxCandidates)
      ? Math.round(maxCandidates)
      : MAP_LABEL_MAX_CANDIDATES_V3;
  const resolvedMaxCandidates = clampNumber(
    maxCandidatesRaw,
    1,
    Math.max(1, scoredCandidates.length)
  );
  const candidateLimit = useVisibleNonOverlappingMode
    ? resolvedMaxCandidates
    : Math.max(
        rawBudget,
        Math.round(rawBudget * (candidateMultiplier ?? MAP_LABEL_CANDIDATE_MULTIPLIER))
      );
  const effectiveCandidateLimit = clampNumber(
    candidateLimit,
    1,
    Math.max(1, scoredCandidates.length)
  );

  const forceIdSet = forceIncludeIds ?? new Set<string>();
  const scoredById = new Map(scoredCandidates.map((candidate) => [candidate.id, candidate]));
  const filteredByCap = new Map<string, ScoredProjectedCandidate>();
  scoredCandidates.slice(0, effectiveCandidateLimit).forEach((candidate) => {
    filteredByCap.set(candidate.id, candidate);
  });
  forceIdSet.forEach((forcedId) => {
    const forcedCandidate = scoredById.get(forcedId);
    if (forcedCandidate) {
      filteredByCap.set(forcedCandidate.id, forcedCandidate);
    }
  });

  const rankedCandidates = Array.from(filteredByCap.values()).sort(compareScoresDesc);
  const projectedCount = rankedCandidates.length;
  const budget = clampNumber(rawBudget, 1, projectedCount);
  const averageCollisionWidth =
    projected.length > 0
      ? (projectedCollisionWidthSum / projected.length) * resolvedCollisionWidthScale
      : labelSize.width * resolvedCollisionWidthScale;
  const averageCollisionHeight =
    projected.length > 0
      ? (projectedCollisionHeightSum / projected.length) * resolvedCollisionHeightScale
      : labelSize.height * resolvedCollisionHeightScale;
  const averageMarkerCollisionWidth =
    projectedMarkerCollisionCount > 0
      ? projectedMarkerCollisionWidthSum / projectedMarkerCollisionCount
      : 0;
  const averageMarkerCollisionHeight =
    projectedMarkerCollisionCount > 0
      ? projectedMarkerCollisionHeightSum / projectedMarkerCollisionCount
      : 0;
  const averageSpatialCollisionWidth = Math.max(
    averageCollisionWidth,
    averageMarkerCollisionWidth
  );
  const averageSpatialCollisionHeight = Math.max(
    averageCollisionHeight,
    averageMarkerCollisionHeight
  );
  const collisionGridCellSize = clampNumber(
    Math.round((averageSpatialCollisionWidth + averageSpatialCollisionHeight) / 2),
    MIN_COLLISION_GRID_CELL_SIZE,
    MAX_COLLISION_GRID_CELL_SIZE
  );
  const slotVariants = buildSlotVariants(resolvedSlotOffsets, resolvedSlotPenalties);

  const forcedRanked = rankedCandidates.filter((candidate) =>
    forceIdSet.has(candidate.id)
  );
  const regularRanked = rankedCandidates.filter(
    (candidate) => !forceIdSet.has(candidate.id)
  );
  const processQueue = [...forcedRanked, ...regularRanked];

  const placedEntries: PlacedLabelEntry[] = [];
  const collisionGrid = new Map<string, number[]>();
  const collisionSeenStampByIndex: number[] = [];
  let collisionQueryStamp = 0;
  const collisionScratchIndices: number[] = [];
  const markerObstacles: MarkerObstacleEntry[] = [];
  const markerObstacleGrid = new Map<string, number[]>();
  const markerObstacleSeenStampByIndex: number[] = [];
  let markerObstacleQueryStamp = 0;
  let rejectedByCollision = 0;
  let forcedPlaced = 0;
  let evicted = 0;
  let activeLabelCount = 0;

  const pushToCollisionGrid = (entryIndex: number, rect: LabelRect) => {
    const bounds = rectToCellBounds(rect, collisionGridCellSize);
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
        const key = collisionCellKey(x, y);
        const bucket = collisionGrid.get(key);
        if (!bucket) {
          collisionGrid.set(key, [entryIndex]);
          continue;
        }
        bucket.push(entryIndex);
      }
    }
  };

  const collectCollisionCandidates = (rect: LabelRect) => {
    collisionScratchIndices.length = 0;
    collisionQueryStamp += 1;
    const stamp = collisionQueryStamp;
    const bounds = rectToCellBounds(rect, collisionGridCellSize);
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
        const key = collisionCellKey(x, y);
        const bucket = collisionGrid.get(key);
        if (!bucket) {
          continue;
        }
        for (let i = 0; i < bucket.length; i += 1) {
          const index = bucket[i];
          if (collisionSeenStampByIndex[index] === stamp) {
            continue;
          }
          collisionSeenStampByIndex[index] = stamp;
          const entry = placedEntries[index];
          if (!entry?.active) {
            continue;
          }
          if (rectsOverlap(rect, entry.rect)) {
            collisionScratchIndices.push(index);
          }
        }
      }
    }
    return collisionScratchIndices;
  };

  const pushMarkerObstacleToGrid = (entryIndex: number, rect: LabelRect) => {
    const bounds = rectToCellBounds(rect, collisionGridCellSize);
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
        const key = collisionCellKey(x, y);
        const bucket = markerObstacleGrid.get(key);
        if (!bucket) {
          markerObstacleGrid.set(key, [entryIndex]);
          continue;
        }
        bucket.push(entryIndex);
      }
    }
  };

  const buildMarkerObstacleRects = (candidate: ProjectedCandidate) => {
    const rects: LabelRect[] = [];
    candidate.markerCollisionZones.forEach((zone) => {
      const markerLeft = candidate.screenX + zone.offsetX - zone.width / 2;
      const markerTop = candidate.screenY + zone.offsetY - zone.height / 2;
      const markerRect: LabelRect = {
        left: markerLeft,
        right: markerLeft + zone.width,
        top: markerTop,
        bottom: markerTop + zone.height,
      };

      if (
        markerRect.right < -LABEL_VIEWPORT_MARGIN ||
        markerRect.left > mapSize.width + LABEL_VIEWPORT_MARGIN ||
        markerRect.bottom < -LABEL_VIEWPORT_MARGIN ||
        markerRect.top > mapSize.height + LABEL_VIEWPORT_MARGIN
      ) {
        return;
      }
      rects.push(markerRect);
    });
    return rects;
  };

  const buildMarkerObstacleBoundingRectFromRows = (
    candidate: ProjectedCandidate
  ): LabelRect | null => {
    if (candidate.markerCollisionRows.length === 0) {
      return null;
    }
    let minLeft = Number.POSITIVE_INFINITY;
    let maxRight = Number.NEGATIVE_INFINITY;
    let minTop = Number.POSITIVE_INFINITY;
    let maxBottom = Number.NEGATIVE_INFINITY;

    candidate.markerCollisionRows.forEach((row) => {
      const rowTop = candidate.screenY + row.top;
      const rowBottom = candidate.screenY + row.bottom;
      if (
        rowBottom < -LABEL_VIEWPORT_MARGIN ||
        rowTop > mapSize.height + LABEL_VIEWPORT_MARGIN
      ) {
        return;
      }
      row.segments.forEach((segment) => {
        const segmentLeft = candidate.screenX + segment.left;
        const segmentRight = candidate.screenX + segment.right;
        if (
          segmentRight < -LABEL_VIEWPORT_MARGIN ||
          segmentLeft > mapSize.width + LABEL_VIEWPORT_MARGIN
        ) {
          return;
        }
        minLeft = Math.min(minLeft, segmentLeft);
        maxRight = Math.max(maxRight, segmentRight);
        minTop = Math.min(minTop, rowTop);
        maxBottom = Math.max(maxBottom, rowBottom);
      });
    });

    if (
      !Number.isFinite(minLeft) ||
      !Number.isFinite(maxRight) ||
      !Number.isFinite(minTop) ||
      !Number.isFinite(maxBottom) ||
      maxRight <= minLeft ||
      maxBottom <= minTop
    ) {
      return null;
    }

    return {
      left: minLeft,
      right: maxRight,
      top: minTop,
      bottom: maxBottom,
    };
  };

  const pushMarkerObstaclesForCandidate = (
    candidate: ProjectedCandidate,
    active: boolean
  ) => {
    const markerObstacleIndices: number[] = [];
    const markerRowBounds = buildMarkerObstacleBoundingRectFromRows(candidate);
    if (markerRowBounds) {
      const markerObstacleIndex =
        markerObstacles.push({
          id: candidate.id,
          active,
          rect: markerRowBounds,
          screenX: candidate.screenX,
          screenY: candidate.screenY,
          rows: candidate.markerCollisionRows,
        }) - 1;
      pushMarkerObstacleToGrid(markerObstacleIndex, markerRowBounds);
      markerObstacleIndices.push(markerObstacleIndex);
      return markerObstacleIndices;
    }

    const markerRects = buildMarkerObstacleRects(candidate);
    markerRects.forEach((markerRect) => {
      const markerObstacleIndex =
        markerObstacles.push({
          id: candidate.id,
          active,
          rect: markerRect,
          screenX: candidate.screenX,
          screenY: candidate.screenY,
        }) - 1;
      pushMarkerObstacleToGrid(markerObstacleIndex, markerRect);
      markerObstacleIndices.push(markerObstacleIndex);
    });
    return markerObstacleIndices;
  };

  if (resolvedMarkerObstacleScope === "all") {
    projected.forEach((candidate) => {
      void pushMarkerObstaclesForCandidate(candidate, true);
    });
  }

  const pushMarkerObstacles = (candidate: ProjectedCandidate) => {
    if (resolvedMarkerObstacleScope !== "placed") {
      return [];
    }
    return pushMarkerObstaclesForCandidate(candidate, true);
  };

  const deactivateEntry = (entry: PlacedLabelEntry) => {
    if (!entry.active) {
      return;
    }
    entry.active = false;
    if (resolvedMarkerObstacleScope !== "placed") {
      activeLabelCount = Math.max(0, activeLabelCount - 1);
      return;
    }
    entry.markerObstacleIndices.forEach((obstacleIndex) => {
      const obstacle = markerObstacles[obstacleIndex];
      if (obstacle) {
        obstacle.active = false;
      }
    });
    activeLabelCount = Math.max(0, activeLabelCount - 1);
  };

  const hasMarkerObstacleCollision = (
    rect: LabelRect,
    candidateId: string
  ): boolean => {
    if (markerObstacles.length === 0) {
      return false;
    }

    markerObstacleQueryStamp += 1;
    const stamp = markerObstacleQueryStamp;
    const bounds = rectToCellBounds(rect, collisionGridCellSize);
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
        const key = collisionCellKey(x, y);
        const bucket = markerObstacleGrid.get(key);
        if (!bucket) {
          continue;
        }
        for (let i = 0; i < bucket.length; i += 1) {
          const index = bucket[i];
          if (markerObstacleSeenStampByIndex[index] === stamp) {
            continue;
          }
          markerObstacleSeenStampByIndex[index] = stamp;
          const entry = markerObstacles[index];
          if (!entry || !entry.active || entry.id === candidateId) {
            continue;
          }
          if (!rectsOverlap(rect, entry.rect)) {
            continue;
          }
          if (entry.rows && entry.rows.length > 0) {
            if (
              hasMarkerRowsCollision(
                rect,
                entry.screenX,
                entry.screenY,
                entry.rows
              )
            ) {
              return true;
            }
            continue;
          }
          const overlap = rectIntersectionMetrics(rect, entry.rect);
          const isMeaningfulCollision =
            overlap.area >= MARKER_COLLISION_MIN_OVERLAP_AREA_PX2 &&
            overlap.width >= MARKER_COLLISION_MIN_OVERLAP_WIDTH_PX &&
            overlap.height >= MARKER_COLLISION_MIN_OVERLAP_HEIGHT_PX;
          if (isMeaningfulCollision) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const placeCandidate = (
    candidate: ScoredProjectedCandidate,
    forced: boolean
  ): boolean => {
    const previousSlot = stickySlots?.get(candidate.id);
    const slotOrder = buildSlotVariantAttemptOrder(
      previousSlot,
      slotVariants,
      resolvedStickySlotBonus
    );

    for (const slotVariant of slotOrder) {
      const slotOffset = slotVariant.offset;
      const slotPenalty = slotVariant.penalty;
      const resolvedSlot =
        previousSlot && slotVariant.slots.includes(previousSlot)
          ? previousSlot
          : slotVariant.canonicalSlot;
      const stickyBonus =
        previousSlot === resolvedSlot ? resolvedStickySlotBonus : 0;
      const slotScore = candidate.baseScore - slotPenalty + stickyBonus;

      const renderLeft =
        candidate.screenX +
        candidate.labelOffsetX +
        slotOffset.x -
        candidate.labelWidth / 2;
      const renderTop = candidate.screenY + candidate.labelOffsetY + slotOffset.y;
      const renderRight = renderLeft + candidate.labelWidth;
      const renderBottom = renderTop + candidate.labelHeight;

      if (
        renderRight < -LABEL_VIEWPORT_MARGIN ||
        renderLeft > mapSize.width + LABEL_VIEWPORT_MARGIN ||
        renderBottom < -LABEL_VIEWPORT_MARGIN ||
        renderTop > mapSize.height + LABEL_VIEWPORT_MARGIN
      ) {
        continue;
      }

      const collisionWidth = candidate.collisionWidth * resolvedCollisionWidthScale;
      const collisionHeight = candidate.collisionHeight * resolvedCollisionHeightScale;
      const collisionLeft =
        candidate.screenX +
        candidate.labelOffsetX +
        slotOffset.x -
        collisionWidth / 2;
      const collisionTop =
        candidate.screenY +
        candidate.labelOffsetY +
        slotOffset.y +
        (candidate.labelHeight - collisionHeight) / 2;
      const collisionRect: LabelRect = {
        left: collisionLeft - resolvedGapX,
        right: collisionLeft + collisionWidth + resolvedGapX,
        top: collisionTop - resolvedGapY,
        bottom: collisionTop + collisionHeight + resolvedGapY,
      };

      if (hasMarkerObstacleCollision(collisionRect, candidate.id)) {
        continue;
      }

      const collidingEntries = collectCollisionCandidates(collisionRect);

      if (collidingEntries.length > 0) {
        if (!forced) {
          continue;
        }
        let allEvictable = true;
        for (let i = 0; i < collidingEntries.length; i += 1) {
          const entry = placedEntries[collidingEntries[i]];
          if (!entry.active || entry.forced || entry.score >= slotScore) {
            allEvictable = false;
            break;
          }
        }
        if (!allEvictable) {
          continue;
        }
        for (let i = 0; i < collidingEntries.length; i += 1) {
          const index = collidingEntries[i];
          const entry = placedEntries[index];
          if (entry?.active) {
            deactivateEntry(entry);
            evicted += 1;
          }
        }
      }

      const placement: LabelPlacement = {
        id: candidate.id,
        title: candidate.title,
        slot: resolvedSlot,
        left: renderLeft,
        top: renderTop,
        width: candidate.labelWidth,
        height: candidate.labelHeight,
        screenX: candidate.screenX + candidate.labelOffsetX + slotOffset.x,
        screenY: candidate.screenY + candidate.labelOffsetY + slotOffset.y,
        score: slotScore,
      };
      const entry: PlacedLabelEntry = {
        id: candidate.id,
        forced,
        active: true,
        score: slotScore,
        slot: resolvedSlot,
        rect: collisionRect,
        markerObstacleIndices: [],
        placement,
      };
      const entryIndex = placedEntries.push(entry) - 1;
      entry.markerObstacleIndices = pushMarkerObstacles(candidate);
      pushToCollisionGrid(entryIndex, collisionRect);
      activeLabelCount += 1;
      if (forced) {
        forcedPlaced += 1;
      }
      return true;
    }

    rejectedByCollision += 1;
    return false;
  };

  processQueue.forEach((candidate) => {
    const forced = forceIdSet.has(candidate.id);
    if (activeLabelCount >= budget && !forced) {
      return;
    }
    void placeCandidate(candidate, forced);
  });

  let finalEntries = placedEntries
    .filter((entry) => entry.active)
    .sort((left, right) => right.score - left.score);

  if (finalEntries.length > budget) {
    const forcedEntries = finalEntries.filter((entry) => entry.forced);
    const nonForcedEntries = finalEntries.filter((entry) => !entry.forced);
    const keepNonForcedCount = Math.max(0, budget - forcedEntries.length);
    finalEntries = [...forcedEntries, ...nonForcedEntries.slice(0, keepNonForcedCount)];
    finalEntries.sort((left, right) => right.score - left.score);
  }

  const placements = finalEntries.map((entry) => entry.placement);
  const ids = placements.map((placement) => placement.id);
  const hiddenCount = Math.max(0, projectedCount - placements.length);

  return {
    placements,
    ids,
    hash: toHash(placements),
    enabled: true,
    budget,
    candidateCount: candidates.length,
    projectedCount,
    hiddenCount,
    rejectedByCollision,
    forcedPlaced,
    evicted,
  };
};

export const selectInlineLabelIds = (
  params: SelectInlineLabelLayoutParams
) => {
  const layout = selectInlineLabelLayout(params);
  return {
    ids: layout.ids,
    hash: layout.hash,
    enabled: layout.enabled,
    budget: layout.budget,
    candidateCount: layout.candidateCount,
    projectedCount: layout.projectedCount,
    rejectedByCollision: layout.rejectedByCollision,
    hiddenCount: layout.hiddenCount,
    forcedPlaced: layout.forcedPlaced,
    evicted: layout.evicted,
  };
};
