import { Dimensions } from "react-native";
import type { Region } from "react-native-maps";
import type { MapViewRef } from "../interfaces";

type MapCameraOptions = {
  center: [number, number];
  zoom: number;
  durationMs?: number;
  aspectRatio?: number;
};

const MIN_ZOOM = 0;
const MAX_ZOOM = 20;
const MIN_DELTA = 0.00001;
const MIN_LATITUDE = -85;
const MAX_LATITUDE = 85;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;
const LONGITUDE_SPAN = 360;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

export const normalizeLongitude = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized =
    ((((value - MIN_LONGITUDE) % LONGITUDE_SPAN) + LONGITUDE_SPAN) % LONGITUDE_SPAN) +
    MIN_LONGITUDE;

  return normalized;
};

export const normalizeLatitude = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return clamp(value, MIN_LATITUDE, MAX_LATITUDE);
};

export const normalizeCenter = (center: [number, number]): [number, number] => {
  const lng = Array.isArray(center) && center.length > 0 ? center[0] : NaN;
  const lat = Array.isArray(center) && center.length > 1 ? center[1] : NaN;
  return [normalizeLongitude(lng), normalizeLatitude(lat)];
};

const getDefaultAspectRatio = () => {
  const { width, height } = Dimensions.get("window");
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0) {
    return 1;
  }
  return height / width;
};

export const zoomToRegion = (
  center: [number, number],
  zoom: number,
  aspectRatio: number = getDefaultAspectRatio()
): Region => {
  const [longitude, latitude] = normalizeCenter(center);
  const normalizedZoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
  const longitudeDelta = 360 / Math.pow(2, normalizedZoom);
  const safeAspectRatio =
    Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
  const latitudeDelta = longitudeDelta * safeAspectRatio;

  return {
    latitude,
    longitude,
    latitudeDelta: Math.max(MIN_DELTA, latitudeDelta),
    longitudeDelta: Math.max(MIN_DELTA, longitudeDelta),
  };
};

export const regionToZoom = (region: Partial<Region> | null | undefined) => {
  const delta =
    typeof region?.longitudeDelta === "number"
      ? Math.abs(region.longitudeDelta)
      : NaN;
  if (!Number.isFinite(delta) || delta <= 0) {
    return MIN_ZOOM;
  }
  return clamp(Math.log2(360 / delta), MIN_ZOOM, MAX_ZOOM);
};

export const setMapCamera = (ref: MapViewRef, options: MapCameraOptions) => {
  const view = ref.current;
  if (!view) return;

  const { center, zoom, durationMs = 500, aspectRatio } = options;
  if (
    !Array.isArray(center) ||
    center.length !== 2 ||
    !Number.isFinite(center[0]) ||
    !Number.isFinite(center[1]) ||
    !Number.isFinite(zoom)
  ) {
    return;
  }
  const region = zoomToRegion(center, zoom, aspectRatio);
  const animationDuration = durationMs > 0 ? durationMs : 0;

  view.animateToRegion(region, animationDuration);
};
