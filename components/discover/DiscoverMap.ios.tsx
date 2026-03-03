import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { Region } from "react-native-maps";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { Asset } from "expo-asset";
import type { DiscoverMapMarker, DiscoverMapProps } from "../../lib/interfaces";
import { styles } from "./discoverStyles";
import { normalizeCenter, regionToZoom, zoomToRegion } from "../../lib/maps/camera";
import {
  getIOSScaledMarkerSize,
  isValidMapCoordinate,
  isValidRegion,
  toMarkerTitle,
} from "../../lib/maps/discoverMapUtils";
import {
  DEFAULT_CAMERA_ZOOM,
  DEFAULT_CITY_CENTER,
  IOS_CLUSTER_CELL_PX,
  IOS_FORCE_CLUSTER_ZOOM,
  IOS_ZOOM_OFFSET,
} from "../../lib/constants/discover";
import { CLUSTER_PRESS_ZOOM_STEP } from "./map/constants";
import { useClusteredFeatures } from "./map/hooks/useClusteredFeatures";
import { resolveIOSCompactPin } from "../../lib/maps/iosLabeledPinProvider";
import {
  IOS_SCALED_CLUSTER_BY_COUNT,
  IOS_SCALED_FILTER_CLUSTER_BY_COUNT,
} from "../../lib/maps/generatedIOSScaledClusterByCount";
import { IOS_SCALED_STACKED_BY_COUNT } from "../../lib/maps/generatedIOSScaledStackedByCount";
import { IOS_COMPACT_PIN_ANCHOR } from "../../lib/maps/generatedIOSCompactPins";

type OverlayMarkerKind = "cluster" | "grouped" | "single";

type MarkerGroup = {
  id: string;
  coordinate: { latitude: number; longitude: number };
  items: DiscoverMapMarker[];
};

type OverlayMarker = {
  id: string;
  kind: OverlayMarkerKind;
  coordinate: { latitude: number; longitude: number };
  focusCoordinate: { latitude: number; longitude: number };
  image: number;
  anchor: { x: number; y: number };
  title?: string;
  category?: DiscoverMapMarker["category"];
  count?: number;
};

type WebMarker = {
  id: string;
  kind: OverlayMarkerKind;
  lat: number;
  lng: number;
  focusLat: number;
  focusLng: number;
  category?: string;
  count?: number;
  title?: string;
  iconUri: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
};

type CameraState = {
  center: [number, number];
  zoom: number;
};

const CLUSTER_PRESS_DURATION_MS = 500;
const CLUSTER_PRESS_MIN_TARGET_ZOOM = IOS_FORCE_CLUSTER_ZOOM + 1;
const IOS_MULTI_COMPACT_FALLBACK = require("../../images/icons/ios-scaled/compact-pins/multi.png");

const toSafeClusterCountKey = (count: number) =>
  String(Math.max(0, Math.min(99, Math.floor(count)))) as keyof typeof IOS_SCALED_CLUSTER_BY_COUNT;

const resolveClusterImage = (count: number, hasActiveFilter: boolean) => {
  const key = toSafeClusterCountKey(count);
  const sourceSet = hasActiveFilter
    ? IOS_SCALED_FILTER_CLUSTER_BY_COUNT
    : IOS_SCALED_CLUSTER_BY_COUNT;
  return sourceSet[key] ?? IOS_MULTI_COMPACT_FALLBACK;
};

const resolveStackedImage = (count: number) => {
  const clampedCount = Math.max(2, Math.min(6, Math.floor(count)));
  return IOS_SCALED_STACKED_BY_COUNT[clampedCount] ?? IOS_MULTI_COMPACT_FALLBACK;
};

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, Math.min(i + chunk, bytes.length))));
  }
  return btoa(binary);
}

const LEAFLET_HTML = String.raw`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f3f4f6; }
    .marker-wrap { display: flex; align-items: center; justify-content: center; }
    .marker-img { display: block; pointer-events: none; user-select: none; -webkit-user-drag: none; }
    .marker-label {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 100%;
      margin-top: -12px;
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
      user-select: none;
      color: #0B0F19;
      font-size: 11px;
      line-height: 14px;
      font-weight: 600;
      font-family: Roboto, Inter, "Inter_600SemiBold", "Helvetica Neue", Arial, sans-serif;
      text-align: center;
      text-shadow: 0 0 3px rgba(255, 255, 255, 0.92);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <script>
    (function () {
      function send(payload) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      // Raster basemap without labels/POIs (clean background for custom markers + text).
      var style = {
        version: 8,
        sources: {
          carto: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
              'https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
              'https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
              'https://d.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
            ],
            tileSize: 256,
            maxzoom: 20
          },
          cartoLabels: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
              'https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
              'https://c.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
              'https://d.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png'
            ],
            tileSize: 256,
            maxzoom: 20
          }
        },
        layers: [
          { id: 'carto-raster', type: 'raster', source: 'carto' },
          // Labels overlay to approximate Android look (street names visible).
          { id: 'carto-labels', type: 'raster', source: 'cartoLabels' }
        ]
      };

      var map = new maplibregl.Map({
        container: 'map',
        style: style,
        center: [17.1077, 48.1486],
        zoom: 12,
        attributionControl: false,
        dragRotate: true,
        touchZoomRotate: true,
        pitchWithRotate: false,
        bearingSnap: 0,
      });

      var markers = [];
      var userMarker = null;
      var isProgrammaticMove = false;
      var isUserGesture = false;
      var labelCollisionRaf = null;
      var textMeasureCanvas = document.createElement('canvas');
      var textMeasureCtx = textMeasureCanvas.getContext('2d');

      function escapeHtml(value) {
        var text = String(value || '');
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function markerHtml(entry) {
        var w = Number(entry.width);
        var h = Number(entry.height);
        if (!entry.iconUri || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
          return '<div class="marker-wrap"></div>';
        }
        var title = entry.kind === 'single' ? String(entry.title || '') : '';
        var safeTitle = escapeHtml(title);
        var labelHtml = safeTitle ? '<div class="marker-label">' + safeTitle + '</div>' : '';
        return '<div class="marker-wrap" style="width:' + w + 'px;height:' + h + 'px;"><img class="marker-img" src="' + entry.iconUri + '" style="width:' + w + 'px;height:' + h + 'px;" />' + labelHtml + '</div>';
      }

      function createMarker(entry) {
        var width = Number.isFinite(Number(entry.width)) ? Number(entry.width) : 18;
        var height = Number.isFinite(Number(entry.height)) ? Number(entry.height) : 18;
        var iconSize = [
          width,
          height,
        ];
        var anchorX = Number(entry.anchorX);
        var anchorY = Number(entry.anchorY);
        var ax = Number.isFinite(anchorX) ? anchorX : 0.5;
        var ay = Number.isFinite(anchorY) ? anchorY : 0.5;
        var element = document.createElement('div');
        element.innerHTML = markerHtml(entry);
        element.style.width = String(width) + 'px';
        element.style.height = String(height) + 'px';
        element.style.pointerEvents = 'auto';
        element.style.cursor = 'pointer';
        element.addEventListener('click', function (evt) {
          evt.preventDefault();
          evt.stopPropagation();
          send({
            type: 'markerPress',
            id: entry.id,
            kind: entry.kind,
            focus: [entry.focusLng, entry.focusLat],
          });
        });
        var marker = new maplibregl.Marker({
          element: element,
          anchor: 'top-left',
          offset: [-(width * ax), -(height * ay)],
          rotationAlignment: 'viewport',
          pitchAlignment: 'viewport',
        })
          .setLngLat([entry.lng, entry.lat])
          .addTo(map);
        var labelEl = element.querySelector('.marker-label');
        return {
          marker: marker,
          element: element,
          labelEl: labelEl,
          entry: entry,
          width: width,
          height: height,
          anchorX: ax,
          anchorY: ay,
        };
      }

      function rectsIntersect(a, b) {
        return !(
          a.right <= b.left ||
          a.left >= b.right ||
          a.bottom <= b.top ||
          a.top >= b.bottom
        );
      }

      function estimateLabelWidth(title) {
        var text = String(title || '');
        if (!text) return 0;
        if (textMeasureCtx) {
          textMeasureCtx.font = '600 11px Roboto, Inter, "Helvetica Neue", Arial, sans-serif';
          var measured = textMeasureCtx.measureText(text).width;
          return Math.min(180, Math.max(24, measured));
        }
        return Math.min(180, Math.max(24, text.length * 6.6));
      }

      function buildMarkerRect(m) {
        var p = map.project([m.entry.lng, m.entry.lat]);
        var left = p.x - m.width * m.anchorX;
        var top = p.y - m.height * m.anchorY;
        return {
          left: left,
          top: top,
          right: left + m.width,
          bottom: top + m.height,
        };
      }

      function buildLabelRect(m, markerRect) {
        if (!m.labelEl) return null;
        var title = String(m.entry.title || '');
        if (!title) return null;
        var labelWidth = estimateLabelWidth(title);
        var labelHeight = 14;
        var marginTop = -12;
        var left = markerRect.left + m.width / 2 - labelWidth / 2;
        var top = markerRect.top + m.height + marginTop;
        return {
          left: left,
          top: top,
          right: left + labelWidth,
          bottom: top + labelHeight,
        };
      }

      function applyLabelCollisions() {
        if (!Array.isArray(window.__markers__) || window.__markers__.length === 0) return;

        var markerRects = new Array(window.__markers__.length);
        for (var i = 0; i < window.__markers__.length; i += 1) {
          markerRects[i] = buildMarkerRect(window.__markers__[i]);
        }

        var acceptedLabelRects = [];
        for (var j = 0; j < window.__markers__.length; j += 1) {
          var markerObj = window.__markers__[j];
          var labelEl = markerObj.labelEl;
          if (!labelEl) continue;

          // Reset to visible first; we'll hide only on collision.
          labelEl.style.display = '';

          var labelRect = buildLabelRect(markerObj, markerRects[j]);
          if (!labelRect) {
            labelEl.style.display = 'none';
            continue;
          }

          var hasCollision = false;

          // Rule 1: hide if touches any other marker icon.
          for (var k = 0; k < markerRects.length; k += 1) {
            if (k === j) continue;
            if (rectsIntersect(labelRect, markerRects[k])) {
              hasCollision = true;
              break;
            }
          }

          // Rule 2: hide if touches already accepted label.
          if (!hasCollision) {
            for (var l = 0; l < acceptedLabelRects.length; l += 1) {
              if (rectsIntersect(labelRect, acceptedLabelRects[l])) {
                hasCollision = true;
                break;
              }
            }
          }

          if (hasCollision) {
            labelEl.style.display = 'none';
          } else {
            labelEl.style.display = '';
            acceptedLabelRects.push(labelRect);
          }
        }
      }

      function scheduleLabelCollisionPass() {
        if (labelCollisionRaf != null) return;
        labelCollisionRaf = requestAnimationFrame(function () {
          labelCollisionRaf = null;
          applyLabelCollisions();
        });
      }

      function setMarkers(markers) {
        for (var i = 0; i < window.__markers__.length; i += 1) {
          window.__markers__[i].marker.remove();
        }
        window.__markers__ = [];
        if (!Array.isArray(markers)) return;
        for (var j = 0; j < markers.length; j += 1) {
          var m = markers[j];
          if (!m || !Number.isFinite(m.lat) || !Number.isFinite(m.lng)) continue;
          window.__markers__.push(createMarker(m));
        }
        scheduleLabelCollisionPass();
      }

      function setUserCoord(coord) {
        if (userMarker) {
          userMarker.remove();
          userMarker = null;
        }
        if (!Array.isArray(coord) || coord.length !== 2) return;
        var lng = Number(coord[0]);
        var lat = Number(coord[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
        var dot = document.createElement('div');
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.borderRadius = '9999px';
        dot.style.border = '2px solid #ffffff';
        dot.style.background = '#3b82f6';
        dot.style.boxShadow = '0 1px 4px rgba(0,0,0,0.35)';
        dot.style.pointerEvents = 'none';
        userMarker = new maplibregl.Marker({
          element: dot,
          anchor: 'center',
          rotationAlignment: 'viewport',
          pitchAlignment: 'viewport',
        }).setLngLat([lng, lat]).addTo(map);
      }

      function setCamera(center, zoom, durationMs) {
        if (!Array.isArray(center) || center.length !== 2) return;
        var lng = Number(center[0]);
        var lat = Number(center[1]);
        var z = Number(zoom);
        var d = Number(durationMs);
        if (!Number.isFinite(lng) || !Number.isFinite(lat) || !Number.isFinite(z)) return;
        isProgrammaticMove = true;
        if (Number.isFinite(d) && d > 0) {
          map.easeTo({
            center: [lng, lat],
            zoom: z,
            duration: d,
            essential: true,
          });
          setTimeout(function () { isProgrammaticMove = false; }, d + 80);
        } else {
          map.jumpTo({
            center: [lng, lat],
            zoom: z,
          });
          setTimeout(function () { isProgrammaticMove = false; }, 50);
        }
      }

      function onIncoming(raw) {
        try {
          var msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (!msg || typeof msg !== 'object') return;
          if (msg.type === 'setData') {
            setMarkers(msg.markers || []);
            setUserCoord(msg.userCoord || null);
            return;
          }
          if (msg.type === 'setCamera') {
            setCamera(msg.center, msg.zoom, msg.durationMs || 0);
          }
        } catch (e) {}
      }

      window.addEventListener('message', function (e) { onIncoming(e.data); });
      document.addEventListener('message', function (e) { onIncoming(e.data); });

      window.__markers__ = [];

      map.on('dragstart', function () { if (!isProgrammaticMove) isUserGesture = true; });
      map.on('zoomstart', function () { if (!isProgrammaticMove) isUserGesture = true; });
      map.on('rotatestart', function () { if (!isProgrammaticMove) isUserGesture = true; });
      map.on('move', scheduleLabelCollisionPass);
      map.on('zoom', scheduleLabelCollisionPass);
      map.on('rotate', scheduleLabelCollisionPass);
      map.on('moveend', function () {
        var center = map.getCenter();
        send({
          type: 'cameraIdle',
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
          isUserGesture: isUserGesture && !isProgrammaticMove,
        });
        isUserGesture = false;
        scheduleLabelCollisionPass();
      });

      map.on('load', function () {
        send({ type: 'ready' });
      });
    })();
  </script>
</body>
</html>`;

const groupMarkersByLocation = (markers: DiscoverMapMarker[]): MarkerGroup[] => {
  const grouped = new Map<string, MarkerGroup>();
  for (let index = 0; index < markers.length; index += 1) {
    const marker = markers[index];
    const lat = marker.coord?.lat;
    const lng = marker.coord?.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }
    const fallbackKey = `${lat.toFixed(6)}:${lng.toFixed(6)}`;
    const key = marker.groupId ?? fallbackKey;
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, {
        id: key,
        coordinate: { latitude: lat, longitude: lng },
        items: [marker],
      });
      continue;
    }
    current.items.push(marker);
  }
  return Array.from(grouped.values());
};

const buildClusterSourceMarkers = (groups: MarkerGroup[]): DiscoverMapMarker[] => {
  const next: DiscoverMapMarker[] = [];
  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
    const primary = group.items[0];
    if (!primary) continue;
    next.push({
      ...primary,
      id: `group:${group.id}`,
      groupId: group.id,
      groupCount: group.items.length,
      category: group.items.length > 1 ? "Multi" : primary.category,
      coord: {
        lat: group.coordinate.latitude,
        lng: group.coordinate.longitude,
      },
    });
  }
  return next;
};

function DiscoverMapIOS({
  cameraRef,
  filteredMarkers,
  userCoord,
  hasActiveFilter,
  onCameraChanged,
  mapCenter,
  mapZoom,
  cityCenter,
  onMarkerPress,
  initialCamera,
}: DiscoverMapProps) {
  const fallbackCenter = mapCenter ?? cityCenter ?? DEFAULT_CITY_CENTER;
  const fallbackZoom = mapZoom ?? DEFAULT_CAMERA_ZOOM;
  const initialRegion = useMemo<Region>(() => {
    return initialCamera
      ? zoomToRegion(initialCamera.center, initialCamera.zoom)
      : zoomToRegion(fallbackCenter, fallbackZoom);
  }, [fallbackCenter, fallbackZoom, initialCamera]);

  const initialDiscreteZoom = Math.floor(
    Math.max(0, Math.min(20, fallbackZoom + IOS_ZOOM_OFFSET))
  );
  const [webReady, setWebReady] = useState(false);
  const [discreteZoomState, setDiscreteZoomState] = useState(initialDiscreteZoom);
  const [settledCenter, setSettledCenter] = useState<[number, number]>(
    normalizeCenter([initialRegion.longitude, initialRegion.latitude])
  );
  const [webMarkers, setWebMarkers] = useState<WebMarker[]>([]);
  const discreteZoomRef = useRef(initialDiscreteZoom);
  const webViewRef = useRef<WebView | null>(null);
  const cameraStateRef = useRef<CameraState>({
    center: normalizeCenter([initialRegion.longitude, initialRegion.latitude]),
    zoom: fallbackZoom,
  });
  const iconUriCacheRef = useRef<Record<number, string | null>>({});

  const postToWeb = useCallback((payload: unknown) => {
    const json = JSON.stringify(payload);
    webViewRef.current?.postMessage(json);
  }, []);

  // Camera shim: keeps existing cameraRef API usable by the rest of the app
  // (setMapCamera, restore camera hooks, top controls).
  useEffect(() => {
    const shim = {
      animateToRegion: (region: Region, durationMs?: number) => {
        if (!isValidRegion(region)) return;
        const center = normalizeCenter([region.longitude, region.latitude]);
        const zoom = regionToZoom(region);
        if (!Number.isFinite(zoom)) return;
        cameraStateRef.current = { center, zoom };
        postToWeb({
          type: "setCamera",
          center,
          zoom,
          durationMs: Number.isFinite(durationMs) ? Math.max(0, Number(durationMs)) : 0,
        });
      },
      animateCamera: (
        camera: { center?: { latitude?: number; longitude?: number }; zoom?: number },
        durationMs?: number
      ) => {
        const lat = camera?.center?.latitude;
        const lng = camera?.center?.longitude;
        const zoom =
          typeof camera?.zoom === "number" && Number.isFinite(camera.zoom)
            ? camera.zoom
            : cameraStateRef.current.zoom;
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom)) return;
        const center = normalizeCenter([Number(lng), Number(lat)]);
        cameraStateRef.current = { center, zoom };
        postToWeb({
          type: "setCamera",
          center,
          zoom,
          durationMs: Number.isFinite(durationMs) ? Math.max(0, Number(durationMs)) : 0,
        });
      },
      getCamera: async () => {
        const [lng, lat] = cameraStateRef.current.center;
        return {
          center: { latitude: lat, longitude: lng },
          zoom: cameraStateRef.current.zoom,
        };
      },
    };

    (cameraRef as MutableRefObject<any>).current = shim;
    return () => {
      if ((cameraRef as MutableRefObject<any>).current === shim) {
        (cameraRef as MutableRefObject<any>).current = null;
      }
    };
  }, [cameraRef, postToWeb]);

  const effectiveZoom = discreteZoomState;
  const visibleMode: OverlayMarkerKind =
    effectiveZoom <= IOS_FORCE_CLUSTER_ZOOM ? "cluster" : "single";
  const cameraCenter = settledCenter;

  const groups = useMemo(() => groupMarkersByLocation(filteredMarkers), [filteredMarkers]);
  const clusterSourceMarkers = useMemo(() => buildClusterSourceMarkers(groups), [groups]);
  const clusterRadiusPx = Math.max(28, Math.round(IOS_CLUSTER_CELL_PX * 0.58));
  const stableClusterZoom = Math.max(0, Math.min(IOS_FORCE_CLUSTER_ZOOM, effectiveZoom));

  const clusteredFeatures = useClusteredFeatures({
    showClusterLayer: visibleMode === "cluster",
    filteredMarkers: clusterSourceMarkers,
    cameraCenter,
    zoom: effectiveZoom,
    shouldCullClustersByViewport: false,
    mapMarkerPipelineOptV1: true,
    clusterRadiusPx,
    forceClusterZoom: IOS_FORCE_CLUSTER_ZOOM,
    stableClusterZoom,
    isIOS: true,
  });

  const overlayMarkers = useMemo<OverlayMarker[]>(() => {
    if (visibleMode === "cluster") {
      return clusteredFeatures.map((feature) => ({
        id: feature.id,
        kind: "cluster",
        coordinate: feature.coordinates,
        focusCoordinate: feature.focusCoordinates ?? feature.coordinates,
        image: resolveClusterImage(feature.count, Boolean(hasActiveFilter)),
        anchor: IOS_COMPACT_PIN_ANCHOR,
        count: feature.count,
        category: "Multi",
      }));
    }
    const markers: OverlayMarker[] = [];
    for (let index = 0; index < groups.length; index += 1) {
      const group = groups[index];
      if (group.items.length > 1) {
        markers.push({
          id: group.id,
          kind: "grouped",
          coordinate: group.coordinate,
          focusCoordinate: group.coordinate,
          image: resolveStackedImage(group.items.length),
          anchor: IOS_COMPACT_PIN_ANCHOR,
          count: group.items.length,
          category: "Multi",
        });
        continue;
      }
      const marker = group.items[0];
      if (!marker) continue;
      markers.push({
        id: marker.id,
        kind: "single",
        coordinate: group.coordinate,
        focusCoordinate: group.coordinate,
        image: resolveIOSCompactPin(marker.category),
        anchor: IOS_COMPACT_PIN_ANCHOR,
        title: toMarkerTitle(marker),
        category: marker.category,
      });
    }
    return markers;
  }, [clusteredFeatures, groups, hasActiveFilter, visibleMode]);

  useEffect(() => {
    let cancelled = false;

    const resolveIconUri = async (assetId: number): Promise<string | null> => {
      const cached = iconUriCacheRef.current[assetId];
      if (cached !== undefined) {
        return cached;
      }
      try {
        const asset = Asset.fromModule(assetId);
        await asset.downloadAsync();
        const localUri = asset.localUri ?? asset.uri;
        if (!localUri) {
          iconUriCacheRef.current[assetId] = null;
          return null;
        }
        const response = await fetch(localUri);
        const buffer = await response.arrayBuffer();
        const base64 = uint8ToBase64(new Uint8Array(buffer));
        const dataUri = `data:image/png;base64,${base64}`;
        iconUriCacheRef.current[assetId] = dataUri;
        return dataUri;
      } catch {
        iconUriCacheRef.current[assetId] = null;
        return null;
      }
    };

    const build = async () => {
      const next: WebMarker[] = [];
      for (let i = 0; i < overlayMarkers.length; i += 1) {
        const marker = overlayMarkers[i];
        if (!isValidMapCoordinate(marker.coordinate.latitude, marker.coordinate.longitude)) continue;
        const iconUri = await resolveIconUri(marker.image);
        if (!iconUri) continue;
        const spriteSize = getIOSScaledMarkerSize(marker.image);
        next.push({
          id: marker.id,
          kind: marker.kind,
          lat: marker.coordinate.latitude,
          lng: marker.coordinate.longitude,
          focusLat: marker.focusCoordinate.latitude,
          focusLng: marker.focusCoordinate.longitude,
          category: marker.category,
          count: marker.count,
          title: marker.title,
          iconUri,
          width: spriteSize.width,
          height: spriteSize.height,
          anchorX: marker.anchor.x,
          anchorY: marker.anchor.y,
        });
      }
      if (!cancelled) {
        setWebMarkers(next);
      }
    };

    void build();

    return () => {
      cancelled = true;
    };
  }, [overlayMarkers]);

  const sanitizedUserCoord = useMemo<[number, number] | null>(() => {
    if (!userCoord || !Array.isArray(userCoord) || userCoord.length !== 2) return null;
    if (!isValidMapCoordinate(userCoord[1], userCoord[0])) return null;
    return [userCoord[0], userCoord[1]];
  }, [userCoord]);

  useEffect(() => {
    if (!webReady) return;
    postToWeb({
      type: "setData",
      markers: webMarkers,
      userCoord: sanitizedUserCoord,
    });
  }, [postToWeb, sanitizedUserCoord, webMarkers, webReady]);

  useEffect(() => {
    if (!webReady) return;
    const { center, zoom } = cameraStateRef.current;
    postToWeb({ type: "setCamera", center, zoom, durationMs: 0 });
  }, [postToWeb, webReady]);

  useEffect(() => {
    if (!webReady) return;
    if (!Array.isArray(mapCenter) || mapCenter.length !== 2) return;
    if (typeof mapZoom !== "number" || !Number.isFinite(mapZoom)) return;
    const center = normalizeCenter(mapCenter);
    const sameCenter =
      Math.abs(center[0] - cameraStateRef.current.center[0]) < 1e-8 &&
      Math.abs(center[1] - cameraStateRef.current.center[1]) < 1e-8;
    const sameZoom = Math.abs(mapZoom - cameraStateRef.current.zoom) < 1e-6;
    if (sameCenter && sameZoom) return;
    cameraStateRef.current = { center, zoom: mapZoom };
    postToWeb({ type: "setCamera", center, zoom: mapZoom, durationMs: 0 });
  }, [mapCenter, mapZoom, postToWeb, webReady]);

  const handleWebMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data ?? "{}") as Record<string, unknown>;
        if (payload.type === "ready") {
          setWebReady(true);
          return;
        }
        if (payload.type === "cameraIdle") {
          const center = Array.isArray(payload.center) ? payload.center : null;
          const zoom = Number(payload.zoom);
          if (
            !center ||
            center.length !== 2 ||
            !Number.isFinite(center[0]) ||
            !Number.isFinite(center[1]) ||
            !Number.isFinite(zoom)
          ) {
            return;
          }
          const normalizedCenter = normalizeCenter([Number(center[0]), Number(center[1])]);
          cameraStateRef.current = { center: normalizedCenter, zoom };
          setSettledCenter(normalizedCenter);
          const nextDiscrete = Math.floor(Math.max(0, Math.min(20, zoom + IOS_ZOOM_OFFSET)));
          if (nextDiscrete !== discreteZoomRef.current) {
            discreteZoomRef.current = nextDiscrete;
            setDiscreteZoomState(nextDiscrete);
          }
          onCameraChanged(
            normalizedCenter,
            zoom,
            Boolean(payload.isUserGesture)
          );
          return;
        }
        if (payload.type === "markerPress") {
          const id = typeof payload.id === "string" ? payload.id : "";
          const kind = payload.kind;
          const focus = Array.isArray(payload.focus) ? payload.focus : null;
          if (kind === "cluster" && focus && focus.length === 2) {
            const focusLng = Number(focus[0]);
            const focusLat = Number(focus[1]);
            if (!Number.isFinite(focusLng) || !Number.isFinite(focusLat)) return;
            const targetZoom = Math.min(
              20,
              Math.max(
                cameraStateRef.current.zoom + CLUSTER_PRESS_ZOOM_STEP,
                CLUSTER_PRESS_MIN_TARGET_ZOOM
              )
            );
            const targetCenter = normalizeCenter([focusLng, focusLat]);
            cameraStateRef.current = { center: targetCenter, zoom: targetZoom };
            postToWeb({
              type: "setCamera",
              center: targetCenter,
              zoom: targetZoom,
              durationMs: CLUSTER_PRESS_DURATION_MS,
            });
            return;
          }
          if (id) {
            onMarkerPress?.(id);
          }
        }
      } catch {
        // Ignore malformed payloads from the web side.
      }
    },
    [onCameraChanged, onMarkerPress, postToWeb]
  );

  if (Platform.OS === "web") {
    return (
      <View style={styles.map}>
        <Text style={{ textAlign: "center", marginTop: 50, color: "#666" }}>
          Map view is not available on web. Please use the mobile app.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.map}>
      <WebView
        ref={webViewRef}
        style={StyleSheet.absoluteFill}
        originWhitelist={["*"]}
        source={{ html: LEAFLET_HTML }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleWebMessage}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

export default memo(DiscoverMapIOS);
