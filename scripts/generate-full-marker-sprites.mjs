import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "canvas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const COORDS_FILE = path.join(ROOT_DIR, "lib/data/coords.ts");
const OUTPUT_DIR = path.join(ROOT_DIR, "images/icons/full-markers");
const OUTPUT_MAP_FILE = path.join(ROOT_DIR, "lib/maps/generatedFullMarkerSprites.ts");

const PIN_CANVAS_WIDTH = 165;
const BADGED_CANVAS_HEIGHT = 226;
const FULL_MARKER_CANVAS_WIDTH = 260;
const FULL_MARKER_CANVAS_HEIGHT = 276;
const FULL_MARKER_SIDE_PADDING = 16;
const FULL_MARKER_MAX_CANVAS_WIDTH = 920;

const PIN_TIP_Y = 217;
const FULL_MARKER_ANCHOR_X = 0.5;
const FULL_MARKER_ANCHOR_Y = PIN_TIP_Y / FULL_MARKER_CANVAS_HEIGHT;

const TITLE_TOP = BADGED_CANVAS_HEIGHT + 6;
const TITLE_HEIGHT = 36;
const TITLE_MIN_WIDTH = 140;
const TITLE_MAX_WIDTH = FULL_MARKER_MAX_CANVAS_WIDTH - FULL_MARKER_SIDE_PADDING * 2;
const TITLE_PADDING_X = 14;
const TITLE_TEXT_COLOR = "#FFFFFF";
const TITLE_STROKE_COLOR = "#000000";
const TITLE_STROKE_WIDTH = 5;
const TITLE_FONT = "600 30px Arial";
const MARKER_COLLISION_ALPHA_THRESHOLD = 24;
const MARKER_COLLISION_MIN_ZONE_WIDTH = 2;
const MARKER_COLLISION_MIN_ZONE_HEIGHT = 1;
const MARKER_COLLISION_MAX_HORIZONTAL_JOIN_DELTA = 1;

const CATEGORY_DIR_MAP = {
  Fitness: "fitness",
  Gastro: "gastro",
  Relax: "relax",
  Beauty: "beauty",
};

const RATING_VALUES = [4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0];

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function escapeTsString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toRounded(value, precision = 4) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeTitleFromId(id) {
  const normalized = id.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return id;
  }
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getRatingForId(id) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return RATING_VALUES[hash % RATING_VALUES.length];
}

function slugifyId(id) {
  const normalized = id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "marker";
}

function extractOpaqueRowSegments(data, width, y) {
  const segments = [];
  const rowOffset = y * width * 4;
  let x = 0;

  while (x < width) {
    while (x < width && data[rowOffset + x * 4 + 3] < MARKER_COLLISION_ALPHA_THRESHOLD) {
      x += 1;
    }
    if (x >= width) {
      break;
    }
    const startX = x;
    while (x < width && data[rowOffset + x * 4 + 3] >= MARKER_COLLISION_ALPHA_THRESHOLD) {
      x += 1;
    }
    const endX = x - 1;
    const segmentWidth = endX - startX + 1;
    if (segmentWidth >= MARKER_COLLISION_MIN_ZONE_WIDTH) {
      segments.push({
        left: startX,
        right: endX,
      });
    }
  }

  return segments;
}

function mergeRowSegmentsVertically(rowSegments) {
  const zones = [];
  let previousRefs = [];
  let previousY = -1;

  rowSegments.forEach((row) => {
    if (previousY >= 0 && row.y !== previousY + 1) {
      previousRefs = [];
    }
    const usedPrevious = new Set();
    const currentRefs = [];

    row.segments.forEach((segment) => {
      let bestMatch = null;
      let bestScore = Number.POSITIVE_INFINITY;

      previousRefs.forEach((prevRef, prevIndex) => {
        if (usedPrevious.has(prevIndex)) {
          return;
        }
        const leftDelta = Math.abs(prevRef.left - segment.left);
        const rightDelta = Math.abs(prevRef.right - segment.right);
        if (
          leftDelta > MARKER_COLLISION_MAX_HORIZONTAL_JOIN_DELTA ||
          rightDelta > MARKER_COLLISION_MAX_HORIZONTAL_JOIN_DELTA
        ) {
          return;
        }
        const score = leftDelta + rightDelta;
        if (score < bestScore) {
          bestScore = score;
          bestMatch = {
            prevIndex,
            zoneIndex: prevRef.zoneIndex,
          };
        }
      });

      if (bestMatch) {
        usedPrevious.add(bestMatch.prevIndex);
        const zone = zones[bestMatch.zoneIndex];
        const zoneRight = zone.left + zone.width - 1;
        zone.left = Math.min(zone.left, segment.left);
        zone.width = Math.max(zoneRight, segment.right) - zone.left + 1;
        zone.height += 1;
        currentRefs.push({
          zoneIndex: bestMatch.zoneIndex,
          left: segment.left,
          right: segment.right,
        });
        return;
      }

      const zoneIndex =
        zones.push({
          left: segment.left,
          top: row.y,
          width: segment.right - segment.left + 1,
          height: 1,
        }) - 1;
      currentRefs.push({
        zoneIndex,
        left: segment.left,
        right: segment.right,
      });
    });

    previousRefs = currentRefs;
    previousY = row.y;
  });

  return zones.filter(
    (zone) =>
      zone.width >= MARKER_COLLISION_MIN_ZONE_WIDTH &&
      zone.height >= MARKER_COLLISION_MIN_ZONE_HEIGHT
  );
}

function extractMarkerCollisionRows(ctx, width, height) {
  const maxY = Math.min(height - 1, PIN_TIP_Y + 1);
  const imageData = ctx.getImageData(0, 0, width, maxY + 1);
  const { data } = imageData;
  const rows = [];

  for (let y = 0; y <= maxY; y += 1) {
    const segments = extractOpaqueRowSegments(data, width, y);
    if (segments.length === 0) {
      continue;
    }
    rows.push({
      y,
      segments: segments.map((segment) => ({
        left: segment.left,
        width: segment.right - segment.left + 1,
      })),
    });
  }

  return rows;
}

function toMergeInputRows(collisionRows) {
  return collisionRows.map((row) => ({
    y: row.y,
    segments: row.segments.map((segment) => ({
      left: segment.left,
      right: segment.left + segment.width - 1,
    })),
  }));
}

function extractMarkerCollision(ctx, width, height) {
  const collisionRows = extractMarkerCollisionRows(ctx, width, height);
  const collisionZones = mergeRowSegmentsVertically(
    toMergeInputRows(collisionRows)
  );
  return {
    collisionRows,
    collisionZones,
  };
}

function readMarkerCatalog() {
  const coordsSource = fs.readFileSync(COORDS_FILE, "utf8");
  const markerRegex = /\{id:\s*"([^"]+)"[^}]*category:\s*"([^"]+)"/g;
  const uniqueById = new Map();
  let match = markerRegex.exec(coordsSource);

  while (match) {
    const id = match[1];
    const category = match[2];
    if (!CATEGORY_DIR_MAP[category]) {
      match = markerRegex.exec(coordsSource);
      continue;
    }
    if (!uniqueById.has(id)) {
      uniqueById.set(id, {
        id,
        category,
        title: normalizeTitleFromId(id),
        rating: getRatingForId(id),
      });
    }
    match = markerRegex.exec(coordsSource);
  }

  return Array.from(uniqueById.values()).sort((a, b) => a.id.localeCompare(b.id));
}

async function main() {
  ensureDirectory(OUTPUT_DIR);
  const catalog = readMarkerCatalog();
  if (catalog.length === 0) {
    throw new Error("No markers found in coords catalog.");
  }

  const imageCache = new Map();
  const manifest = [];

  for (const marker of catalog) {
    const categoryDir = CATEGORY_DIR_MAP[marker.category];
    const ratingKey = marker.rating.toFixed(1);
    const badgedPath = path.join(
      ROOT_DIR,
      "images/icons/badged",
      categoryDir,
      `${categoryDir}_rating_${ratingKey}.png`
    );

    if (!fs.existsSync(badgedPath)) {
      throw new Error(`Missing badged icon: ${badgedPath}`);
    }

    let badgedImage = imageCache.get(badgedPath);
    if (!badgedImage) {
      badgedImage = await loadImage(badgedPath);
      imageCache.set(badgedPath, badgedImage);
    }

    const measureCanvas = createCanvas(1, 1);
    const measureCtx = measureCanvas.getContext("2d");
    measureCtx.font = TITLE_FONT;
    const renderTitle = marker.title.toUpperCase();
    const measuredTextWidth = measureCtx.measureText(renderTitle).width;
    const strokeAllowance = TITLE_STROKE_WIDTH * 2;
    const titleWidth = clampNumber(
      Math.ceil(measuredTextWidth + TITLE_PADDING_X * 2 + strokeAllowance),
      TITLE_MIN_WIDTH,
      TITLE_MAX_WIDTH
    );
    const canvasWidth = clampNumber(
      Math.max(FULL_MARKER_CANVAS_WIDTH, titleWidth + FULL_MARKER_SIDE_PADDING * 2),
      FULL_MARKER_CANVAS_WIDTH,
      FULL_MARKER_MAX_CANVAS_WIDTH
    );

    const canvas = createCanvas(canvasWidth, FULL_MARKER_CANVAS_HEIGHT);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pinOffsetX = Math.round((canvasWidth - PIN_CANVAS_WIDTH) / 2);
    ctx.drawImage(badgedImage, pinOffsetX, 0);

    ctx.font = TITLE_FONT;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const titleX = Math.round((canvasWidth - titleWidth) / 2);
    const titleY = TITLE_TOP;

    if (titleX < 0 || titleX + titleWidth > canvasWidth) {
      throw new Error(`Title capsule overflow for ${marker.id}`);
    }
    if (
      measuredTextWidth + strokeAllowance >
      titleWidth - TITLE_PADDING_X * 2 + 0.5
    ) {
      throw new Error(`Title text clipping guard failed for ${marker.id}`);
    }

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineWidth = TITLE_STROKE_WIDTH;
    ctx.strokeStyle = TITLE_STROKE_COLOR;
    ctx.strokeText(renderTitle, canvasWidth / 2, titleY + TITLE_HEIGHT / 2);
    ctx.fillStyle = TITLE_TEXT_COLOR;
    ctx.fillText(renderTitle, canvasWidth / 2, titleY + TITLE_HEIGHT / 2);
    ctx.restore();

    const fileBase = `${slugifyId(marker.id)}_${hashString(marker.id)}`;
    const fileName = `${fileBase}.png`;
    const outputPath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));

    const collision = extractMarkerCollision(
      ctx,
      canvasWidth,
      FULL_MARKER_CANVAS_HEIGHT
    );

    manifest.push({
      id: marker.id,
      fileName,
      width: canvasWidth,
      height: FULL_MARKER_CANVAS_HEIGHT,
      collisionRows: collision.collisionRows,
      collisionZones: collision.collisionZones,
    });
  }

  const mapFileLines = [
    "/* eslint-disable */",
    "// AUTO-GENERATED FILE. DO NOT EDIT.",
    "// Generated by scripts/generate-full-marker-sprites.mjs",
    "",
    "export type FullMarkerSpriteEntry = {",
    "  image: number;",
    "  anchor: { x: number; y: number };",
    "  width: number;",
    "  height: number;",
    "  collisionRows: ReadonlyArray<FullMarkerCollisionRow>;",
    "  collisionZones: ReadonlyArray<FullMarkerCollisionZone>;",
    "};",
    "",
    "export type FullMarkerCollisionRow = {",
    "  y: number;",
    "  segments: ReadonlyArray<FullMarkerCollisionRowSegment>;",
    "};",
    "",
    "export type FullMarkerCollisionRowSegment = {",
    "  left: number;",
    "  width: number;",
    "};",
    "",
    "export type FullMarkerCollisionZone = {",
    "  left: number;",
    "  top: number;",
    "  width: number;",
    "  height: number;",
    "};",
    "",
    `export const FULL_MARKER_CANVAS_WIDTH = ${FULL_MARKER_CANVAS_WIDTH};`,
    `export const FULL_MARKER_CANVAS_HEIGHT = ${FULL_MARKER_CANVAS_HEIGHT};`,
    "export const FULL_MARKER_DEFAULT_ANCHOR = {",
    `  x: ${FULL_MARKER_ANCHOR_X},`,
    `  y: ${FULL_MARKER_ANCHOR_Y.toFixed(12)},`,
    "} as const;",
    "",
    "export const FULL_MARKER_SPRITES: Record<string, FullMarkerSpriteEntry> = {",
  ];

  manifest.forEach((item) => {
    mapFileLines.push(
      `  "${escapeTsString(item.id)}": {`,
      `    image: require("../../images/icons/full-markers/${item.fileName}"),`,
      "    anchor: FULL_MARKER_DEFAULT_ANCHOR,",
      `    width: ${item.width},`,
      `    height: ${item.height},`,
      "    collisionRows: [",
      ...item.collisionRows.map(
        (row) =>
          `      { y: ${toRounded(row.y, 3)}, segments: [${row.segments
            .map(
              (segment) =>
                `{ left: ${toRounded(segment.left, 3)}, width: ${toRounded(
                  segment.width,
                  3
                )} }`
            )
            .join(", ")}] },`
      ),
      "    ],",
      "    collisionZones: [",
      ...item.collisionZones.map(
        (zone) =>
          `      { left: ${toRounded(zone.left, 3)}, top: ${toRounded(
            zone.top,
            3
          )}, width: ${toRounded(zone.width, 3)}, height: ${toRounded(
            zone.height,
            3
          )} },`
      ),
      "    ],",
      "  },"
    );
  });

  mapFileLines.push(
    "};",
    "",
    "export const getLocalFullMarkerSprite = (spriteKey?: string | null) => {",
    "  if (!spriteKey) {",
    "    return undefined;",
    "  }",
    "  return FULL_MARKER_SPRITES[spriteKey];",
    "};",
    "",
    "export const hasLocalFullMarkerSpriteKey = (spriteKey?: string | null) =>",
    "  Boolean(spriteKey && FULL_MARKER_SPRITES[spriteKey]);",
    ""
  );

  fs.writeFileSync(OUTPUT_MAP_FILE, mapFileLines.join("\n"));

  console.log(`[full-marker-sprites] generated ${manifest.length} marker sprites`);
  console.log(`[full-marker-sprites] output map: ${path.relative(ROOT_DIR, OUTPUT_MAP_FILE)}`);
}

main().catch((error) => {
  console.error("[full-marker-sprites] failed:", error);
  process.exitCode = 1;
});
