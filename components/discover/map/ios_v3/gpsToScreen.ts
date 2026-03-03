import type { Region } from "react-native-maps";

export type MapViewportSize = {
  width: number;
  height: number;
};

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

const MAX_MERCATOR_LATITUDE = 85.05112878;
const MIN_WORLD_SPAN = 1e-9;

const clampLatitude = (latitude: number): number => {
  "worklet";
  return Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
};

const longitudeToWorldX = (longitude: number): number => {
  "worklet";
  return (longitude + 180) / 360;
};

const latitudeToWorldY = (latitude: number): number => {
  "worklet";
  const clamped = clampLatitude(latitude);
  const radians = (clamped * Math.PI) / 180;
  const sinLat = Math.sin(radians);
  return 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
};

export const gpsToScreen = (
  coordinate: MapCoordinate,
  region: Region,
  viewport: MapViewportSize
): { x: number; y: number } | null => {
  "worklet";
  if (
    !Number.isFinite(coordinate.latitude) ||
    !Number.isFinite(coordinate.longitude) ||
    !Number.isFinite(region.latitude) ||
    !Number.isFinite(region.longitude) ||
    !Number.isFinite(region.latitudeDelta) ||
    !Number.isFinite(region.longitudeDelta) ||
    !Number.isFinite(viewport.width) ||
    !Number.isFinite(viewport.height) ||
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    region.latitudeDelta <= 0 ||
    region.longitudeDelta <= 0
  ) {
    return null;
  }

  const safeLongitudeDelta = Math.min(360, Math.max(region.longitudeDelta, MIN_WORLD_SPAN));
  const westLongitude = region.longitude - safeLongitudeDelta / 2;
  const worldSpanX = safeLongitudeDelta / 360;
  const westWorldX = longitudeToWorldX(westLongitude);
  const coordWorldX = longitudeToWorldX(coordinate.longitude);
  let relativeWorldX = coordWorldX - westWorldX;
  if (relativeWorldX < 0) {
    relativeWorldX += 1;
  }
  const x = (relativeWorldX / worldSpanX) * viewport.width;

  const northLatitude = region.latitude + region.latitudeDelta / 2;
  const southLatitude = region.latitude - region.latitudeDelta / 2;
  const northWorldY = latitudeToWorldY(northLatitude);
  const southWorldY = latitudeToWorldY(southLatitude);
  const worldSpanY = Math.max(MIN_WORLD_SPAN, southWorldY - northWorldY);
  const coordWorldY = latitudeToWorldY(coordinate.latitude);
  const y = ((coordWorldY - northWorldY) / worldSpanY) * viewport.height;

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return { x, y };
};
