import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { StyleSheet, View } from "react-native";
import type { Region } from "react-native-maps";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { Asset } from "expo-asset";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import type { DiscoverMapMarker, DiscoverMapProps } from "../../lib/interfaces";
import { discoverDebugLog, isDiscoverDebugEnabled } from "../../lib/debug/discoverDebug";
import { styles } from "./discoverStyles";
import { normalizeCenter, regionToZoom, zoomToRegion } from "../../lib/maps/camera";
import { DISCOVER_WEBVIEW_STYLE_JSON } from "../../lib/maps/discoverWebViewStyle";
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
  imageKey: string;
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

const WEBVIEW_ICON_URI_CACHE: Record<number, string | null> = {};

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

const LEAFLET_HTML = String.raw`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
  <style>
    *, *::before, *::after {
      -webkit-tap-highlight-color: transparent !important;
      -webkit-touch-callout: none;
      tap-highlight-color: transparent !important;
    }
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #f3f4f6;
    }
    .marker-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }
    .marker-img { display: block; pointer-events: none; user-select: none; -webkit-user-drag: none; }
    .maplibregl-marker,
    .maplibregl-marker * {
      -webkit-tap-highlight-color: transparent !important;
      outline: none !important;
    }
    .maplibregl-marker:active, .maplibregl-marker:focus, .maplibregl-marker:hover,
    .maplibregl-marker *:active, .maplibregl-marker *:focus, .maplibregl-marker *:hover,
    .marker-wrap:active, .marker-wrap:focus, .marker-wrap:hover {
      opacity: 1 !important;
      background: transparent !important;
      outline: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }
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

      function debug(eventName, data) {
        send({
          type: 'debug',
          scope: 'web',
          event: eventName,
          data: data || null,
          ts: Date.now()
        });
      }

      var style = ${DISCOVER_WEBVIEW_STYLE_JSON};

      var map = new maplibregl.Map({
        container: 'map',
        style: style,
        center: [17.1077, 48.1486],
        zoom: 12,
        antialias: true,
        attributionControl: false,
        renderWorldCopies: false,
        dragRotate: true,
        touchZoomRotate: true,
        touchPitch: false,
        maxPitch: 0,
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
      var SINGLE_MARKERS_SOURCE_ID = 'single-markers';
      var SINGLE_MARKERS_HIT_LAYER_ID = 'single-markers-hit';
      var SINGLE_MARKERS_ICON_LAYER_ID = 'single-markers-icons';
      var SINGLE_MARKERS_LABEL_LAYER_ID = 'single-markers-labels';
      var singleMarkersRevision = 0;
      var markerLongPressTimer = null;
      var markerLongPressFeature = null;
      var markerLongPressStartPoint = null;
      var suppressNextMarkerClick = false;
      var MARKER_LONG_PRESS_MS = 450;
      var MARKER_LONG_PRESS_MOVE_TOLERANCE_PX = 10;
      var MARKER_HIT_QUERY_PAD_PX = 10;
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
        var anchorX = Number(entry.anchorX);
        var anchorY = Number(entry.anchorY);
        var ax = Number.isFinite(anchorX) ? anchorX : 0.5;
        var ay = Number.isFinite(anchorY) ? anchorY : 0.5;
        var element = document.createElement('div');
        element.innerHTML = markerHtml(entry);
        element.style.width = String(width) + 'px';
        element.style.height = String(height) + 'px';
        // Purely visual — all hit detection goes through the canvas hit layer.
        element.style.pointerEvents = 'none';
        element.style.userSelect = 'none';
        element.style.webkitUserSelect = 'none';
        var marker = new maplibregl.Marker({
          element: element,
          anchor: 'top-left',
          offset: [-(width * ax), -(height * ay)],
          rotationAlignment: 'viewport',
          pitchAlignment: 'viewport',
        })
          .setLngLat([entry.lng, entry.lat])
          .addTo(map);
        // Also silence the MapLibre wrapper so touches fall through to canvas.
        var wrapperEl = marker.getElement();
        if (wrapperEl) {
          wrapperEl.style.pointerEvents = 'none';
        }
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

      function pointInRect(point, rect, slop) {
        var pad = Number.isFinite(slop) ? Math.max(0, slop) : 0;
        return (
          point.x >= rect.left - pad &&
          point.x <= rect.right + pad &&
          point.y >= rect.top - pad &&
          point.y <= rect.bottom + pad
        );
      }

      function distanceSqToRectCenter(point, rect) {
        var cx = (rect.left + rect.right) * 0.5;
        var cy = (rect.top + rect.bottom) * 0.5;
        var dx = point.x - cx;
        var dy = point.y - cy;
        return dx * dx + dy * dy;
      }

      function findMarkerAtPoint(point, slop) {
        if (
          !point ||
          !Number.isFinite(point.x) ||
          !Number.isFinite(point.y) ||
          !Array.isArray(window.__markers__) ||
          window.__markers__.length === 0
        ) {
          return null;
        }

        var bestMarker = null;
        var bestDistanceSq = Infinity;
        for (var i = 0; i < window.__markers__.length; i += 1) {
          var markerObj = window.__markers__[i];
          if (!markerObj || !markerObj.entry) continue;
          if (String(markerObj.entry.kind || '') === 'single') continue;
          var markerRect = buildMarkerRect(markerObj);
          if (!pointInRect(point, markerRect, slop)) {
            continue;
          }

          var distanceSq = distanceSqToRectCenter(point, markerRect);
          if (distanceSq < bestDistanceSq) {
            bestDistanceSq = distanceSq;
            bestMarker = markerObj;
          }
        }

        return bestMarker;
      }

      function findSingleMarkerAtPoint(point, radius) {
        if (
          !point ||
          !Number.isFinite(point.x) ||
          !Number.isFinite(point.y) ||
          !Array.isArray(window.__markers__) ||
          window.__markers__.length === 0
        ) {
          return null;
        }

        var safeRadius = Number.isFinite(radius) ? Math.max(1, radius) : SINGLE_MARKER_TAP_RADIUS_PX;
        var maxDistanceSq = safeRadius * safeRadius;
        var bestMarker = null;
        var bestDistanceSq = Infinity;

        for (var i = 0; i < window.__markers__.length; i += 1) {
          var markerObj = window.__markers__[i];
          if (!markerObj || !markerObj.entry) continue;
          if (String(markerObj.entry.kind || '') !== 'single') continue;

          var projectedPoint = map.project([markerObj.entry.lng, markerObj.entry.lat]);
          var dx = projectedPoint.x - point.x;
          var dy = projectedPoint.y - point.y;
          var distanceSq = dx * dx + dy * dy;
          if (distanceSq > maxDistanceSq) {
            continue;
          }

          if (distanceSq < bestDistanceSq) {
            bestDistanceSq = distanceSq;
            bestMarker = markerObj;
          }
        }

        return bestMarker;
      }

      function extractMarkerPayloadFromFeature(feature) {
        if (!feature || !feature.properties || !feature.properties.id) {
          return null;
        }

        var props = feature.properties;
        var kind = String(props.kind || 'single');
        var coord = null;
        if (
          feature.geometry &&
          feature.geometry.type === 'Point' &&
          Array.isArray(feature.geometry.coordinates) &&
          feature.geometry.coordinates.length >= 2
        ) {
          var coordLng = Number(feature.geometry.coordinates[0]);
          var coordLat = Number(feature.geometry.coordinates[1]);
          if (Number.isFinite(coordLng) && Number.isFinite(coordLat)) {
            coord = [coordLng, coordLat];
          }
        }

        var focusLng = Number(props.focusLng);
        var focusLat = Number(props.focusLat);
        if (coord) {
          focusLng = Number(coord[0]);
          focusLat = Number(coord[1]);
        }

        return {
          id: String(props.id),
          kind: kind,
          coord: coord,
          focus: [focusLng, focusLat]
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

          var labelRect = buildLabelRect(markerObj, markerRects[j]);
          if (!labelRect) {
            if (labelEl.style.display !== 'none') {
              labelEl.style.display = 'none';
            }
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
            if (labelEl.style.display !== 'none') {
              labelEl.style.display = 'none';
            }
          } else {
            if (labelEl.style.display === 'none') {
              labelEl.style.display = '';
            }
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

      function buildEmptyFeatureCollection() {
        return {
          type: 'FeatureCollection',
          features: []
        };
      }

      function resolveEventPoint(event) {
        if (
          event &&
          event.point &&
          Number.isFinite(event.point.x) &&
          Number.isFinite(event.point.y)
        ) {
          return event.point;
        }
        if (
          event &&
          Array.isArray(event.points) &&
          event.points.length > 0 &&
          event.points[0] &&
          Number.isFinite(event.points[0].x) &&
          Number.isFinite(event.points[0].y)
        ) {
          return event.points[0];
        }
        return null;
      }

      function clearMarkerLongPressTracking() {
        if (markerLongPressTimer != null) {
          clearTimeout(markerLongPressTimer);
          markerLongPressTimer = null;
        }
        markerLongPressFeature = null;
        markerLongPressStartPoint = null;
      }

      function findBestMarkerFeatureAtPoint(point, pad) {
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
          return null;
        }

        var radius = Number.isFinite(pad) ? Math.max(0, Math.round(pad)) : 24;
        var bbox = [
          [point.x - radius, point.y - radius],
          [point.x + radius, point.y + radius]
        ];
        var features = map.queryRenderedFeatures(bbox, {
          layers: [SINGLE_MARKERS_HIT_LAYER_ID]
        });

        if (!Array.isArray(features) || features.length === 0) {
          return null;
        }

        var bestFeature = null;
        var bestDist = Infinity;
        for (var fi = 0; fi < features.length; fi += 1) {
          var feature = features[fi];
          if (!feature || !feature.geometry || feature.geometry.type !== 'Point') continue;
          var projectedPoint = map.project(feature.geometry.coordinates);
          var dx = projectedPoint.x - point.x;
          var dy = projectedPoint.y - point.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDist) {
            bestDist = dist;
            bestFeature = feature;
          }
        }

        return bestFeature;
      }

      function extractMarkerPayloadFromEntry(entry) {
        if (!entry || !entry.id) {
          return null;
        }

        var coordLng = Number(entry.lng);
        var coordLat = Number(entry.lat);
        if (!Number.isFinite(coordLng) || !Number.isFinite(coordLat)) {
          return null;
        }

        var coord = [coordLng, coordLat];
        var focusLng = Number(entry.focusLng);
        var focusLat = Number(entry.focusLat);
        if (!Number.isFinite(focusLng) || !Number.isFinite(focusLat)) {
          focusLng = coordLng;
          focusLat = coordLat;
        }

        return {
          id: String(entry.id),
          kind: String(entry.kind || 'single'),
          coord: coord,
          focus: [focusLng, focusLat]
        };
      }

      function scheduleMarkerLongPress(feature, point) {
        clearMarkerLongPressTracking();
        markerLongPressFeature = feature;
        markerLongPressStartPoint = { x: Number(point.x), y: Number(point.y) };
        markerLongPressTimer = setTimeout(function () {
          var payload = extractMarkerPayloadFromFeature(markerLongPressFeature);
          if (!payload || !payload.coord) {
            clearMarkerLongPressTracking();
            return;
          }

          suppressNextMarkerClick = true;
          var projected = map.project(payload.coord);
          var markerPoint = projected
            ? [Math.round(projected.x), Math.round(projected.y)]
            : [Math.round(point.x), Math.round(point.y)];
          send({
            type: 'markerLongPress',
            id: payload.id,
            kind: payload.kind,
            coord: payload.coord,
            point: markerPoint,
            focus: payload.focus
          });
          debug('markerLongPressDispatched', { id: payload.id, kind: payload.kind });
          clearMarkerLongPressTracking();
        }, MARKER_LONG_PRESS_MS);
      }

      function ensureSingleMarkerLayers() {
        if (!map.getSource(SINGLE_MARKERS_SOURCE_ID)) {
          map.addSource(SINGLE_MARKERS_SOURCE_ID, {
            type: 'geojson',
            data: buildEmptyFeatureCollection()
          });
        }

        if (!map.getLayer(SINGLE_MARKERS_HIT_LAYER_ID)) {
          map.addLayer({
            id: SINGLE_MARKERS_HIT_LAYER_ID,
            type: 'circle',
            source: SINGLE_MARKERS_SOURCE_ID,
            paint: {
              'circle-radius': ['coalesce', ['get', 'hitRadius'], 20],
              'circle-color': '#000000',
              'circle-opacity': 0.001,
              'circle-stroke-width': 0
            }
          });
        }

        if (!map.getLayer(SINGLE_MARKERS_ICON_LAYER_ID)) {
          map.addLayer({
            id: SINGLE_MARKERS_ICON_LAYER_ID,
            type: 'symbol',
            source: SINGLE_MARKERS_SOURCE_ID,
            layout: {
              'icon-image': ['get', 'imageKey'],
              'icon-anchor': 'bottom',
              'icon-size': 1,
              'icon-overlap': 'always',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true
            }
          });
        }

        if (!map.getLayer(SINGLE_MARKERS_LABEL_LAYER_ID)) {
          map.addLayer({
            id: SINGLE_MARKERS_LABEL_LAYER_ID,
            type: 'symbol',
            source: SINGLE_MARKERS_SOURCE_ID,
            layout: {
              'text-field': ['coalesce', ['get', 'title'], ''],
              'text-font': ['Open Sans Regular'],
              'text-size': 11,
              'text-line-height': 1.15,
              'text-anchor': 'top',
              'text-offset': [0, 0.45],
              'text-max-width': 12,
              'text-overlap': 'always',
              'text-optional': true
            },
            paint: {
              'text-color': '#0B0F19',
              'text-halo-color': 'rgba(255,255,255,0.92)',
              'text-halo-width': 1.5
            }
          });
        }
      }

      function dataUriToBlob(dataUri) {
        var parts = dataUri.split(',');
        if (parts.length < 2) return null;
        var mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/png';
        var byteString = atob(parts[1]);
        var ab = new ArrayBuffer(byteString.length);
        var ua = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
          ua[i] = byteString.charCodeAt(i);
        }
        return new Blob([ua], { type: mime });
      }

      function addImageFromBitmap(entry, bitmap) {
        var naturalWidth = bitmap.width;
        var naturalHeight = bitmap.height;
        if (!naturalWidth || !naturalHeight) return false;
        var declaredWidth = Number(entry.width);
        var declaredHeight = Number(entry.height);
        var pixelRatioX =
          Number.isFinite(declaredWidth) && declaredWidth > 0
            ? naturalWidth / declaredWidth : NaN;
        var pixelRatioY =
          Number.isFinite(declaredHeight) && declaredHeight > 0
            ? naturalHeight / declaredHeight : NaN;
        var pixelRatio = Number.isFinite(pixelRatioX) && pixelRatioX > 0
          ? pixelRatioX
          : Number.isFinite(pixelRatioY) && pixelRatioY > 0
            ? pixelRatioY : 1;
        var canvas = document.createElement('canvas');
        canvas.width = naturalWidth;
        canvas.height = naturalHeight;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return false;
        ctx.drawImage(bitmap, 0, 0);
        var imageData = ctx.getImageData(0, 0, naturalWidth, naturalHeight);
        if (!map.hasImage(entry.imageKey)) {
          map.addImage(entry.imageKey, imageData, { pixelRatio: pixelRatio });
        }
        debug('singleImageLoaded', {
          id: String(entry.id || ''),
          imageKey: entry.imageKey,
          naturalWidth: naturalWidth,
          naturalHeight: naturalHeight,
          pixelRatio: pixelRatio
        });
        return true;
      }

      function loadSingleMarkerImage(entry) {
        return new Promise(function (resolve) {
          if (!entry || !entry.imageKey || !entry.iconUri) {
            resolve();
            return;
          }
          if (map.hasImage(entry.imageKey)) {
            resolve();
            return;
          }

          var blob;
          try {
            blob = dataUriToBlob(entry.iconUri);
          } catch (e) {
            debug('singleImageDecodeFailed', { id: String(entry.id || ''), imageKey: entry.imageKey });
          }

          if (blob && typeof createImageBitmap === 'function') {
            createImageBitmap(blob).then(function (bitmap) {
              try { addImageFromBitmap(entry, bitmap); } catch (e) {
                debug('singleImageAddFailed', { id: String(entry.id || ''), imageKey: entry.imageKey, error: String(e) });
              }
              resolve();
            }).catch(function () {
              debug('createImageBitmapFailed', { id: String(entry.id || ''), imageKey: entry.imageKey });
              loadSingleMarkerImageFallback(entry, resolve);
            });
            return;
          }

          loadSingleMarkerImageFallback(entry, resolve);
        });
      }

      function loadSingleMarkerImageFallback(entry, resolve) {
        var blobUrl = null;
        try {
          var b = dataUriToBlob(entry.iconUri);
          if (b) blobUrl = URL.createObjectURL(b);
        } catch (e) {}
        var image = new Image();
        image.onload = function () {
          try { addImageFromBitmap(entry, image); } catch (e) {
            debug('singleImageFallbackFailed', { id: String(entry.id || ''), imageKey: entry.imageKey, error: String(e) });
          }
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          resolve();
        };
        image.onerror = function () {
          debug('singleImageLoadError', { id: String(entry.id || ''), imageKey: entry.imageKey, usedBlob: !!blobUrl });
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          resolve();
        };
        image.src = blobUrl || entry.iconUri;
      }

      function toSingleMarkerFeature(entry) {
        var width = Number(entry.width);
        var height = Number(entry.height);
        var fallbackRadius = Math.max(16, Math.round(Math.max(width, height) * 0.5));
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [entry.lng, entry.lat]
          },
          properties: {
            id: entry.id,
            imageKey: entry.imageKey,
            title: entry.title || '',
            focusLng: entry.focusLng,
            focusLat: entry.focusLat,
            hitRadius: Number.isFinite(fallbackRadius) ? fallbackRadius : 20
          }
        };
      }

      function setSingleMarkers(newMarkers) {
        ensureSingleMarkerLayers();

        var safeMarkers = Array.isArray(newMarkers) ? newMarkers : [];
        var nextRevision = ++singleMarkersRevision;
        var seenImageKeys = {};
        var imageLoads = [];

        for (var i = 0; i < safeMarkers.length; i += 1) {
          var imageEntry = safeMarkers[i];
          if (!imageEntry || !imageEntry.imageKey || seenImageKeys[imageEntry.imageKey]) {
            continue;
          }
          seenImageKeys[imageEntry.imageKey] = true;
          imageLoads.push(loadSingleMarkerImage(imageEntry));
        }

        Promise.all(imageLoads).then(function () {
          if (nextRevision !== singleMarkersRevision) {
            return;
          }

          var source = map.getSource(SINGLE_MARKERS_SOURCE_ID);
          if (!source || typeof source.setData !== 'function') {
            return;
          }

          var features = [];
          for (var j = 0; j < safeMarkers.length; j += 1) {
            var markerEntry = safeMarkers[j];
            if (!markerEntry || !Number.isFinite(markerEntry.lat) || !Number.isFinite(markerEntry.lng)) {
              continue;
            }
            if (!markerEntry.imageKey || !map.hasImage(markerEntry.imageKey)) {
              continue;
            }
            features.push(toSingleMarkerFeature(markerEntry));
          }

          source.setData({
            type: 'FeatureCollection',
            features: features
          });

          var firstFeature = features.length > 0 ? features[0] : null;
          var firstPoint = null;
          var firstVisibleFeature = null;
          var firstVisiblePoint = null;
          var viewportWidth = map.getContainer().clientWidth;
          var viewportHeight = map.getContainer().clientHeight;
          for (var featureIndex = 0; featureIndex < features.length; featureIndex += 1) {
            var candidateFeature = features[featureIndex];
            if (
              !candidateFeature ||
              !candidateFeature.geometry ||
              !Array.isArray(candidateFeature.geometry.coordinates) ||
              candidateFeature.geometry.coordinates.length < 2
            ) {
              continue;
            }
            var candidatePoint = map.project(candidateFeature.geometry.coordinates);
            var roundedCandidatePoint = [Math.round(candidatePoint.x), Math.round(candidatePoint.y)];
            if (!firstPoint) {
              firstPoint = roundedCandidatePoint;
            }
            if (
              candidatePoint.x >= 0 &&
              candidatePoint.x <= viewportWidth &&
              candidatePoint.y >= 0 &&
              candidatePoint.y <= viewportHeight
            ) {
              firstVisibleFeature = candidateFeature;
              firstVisiblePoint = roundedCandidatePoint;
              break;
            }
          }
          debug('setSingleMarkers', {
            requested: safeMarkers.length,
            rendered: features.length,
            firstId: firstFeature && firstFeature.properties ? String(firstFeature.properties.id || '') : '',
            firstPoint: firstPoint,
            firstVisibleId:
              firstVisibleFeature && firstVisibleFeature.properties
                ? String(firstVisibleFeature.properties.id || '')
                : '',
            firstVisiblePoint: firstVisiblePoint
          });
        });
      }

      function markerFingerprint(m) {
        return m.id + '|' + m.lat + '|' + m.lng + '|' + m.kind + '|' +
          (m.title || '') + '|' + (m.count || 0) + '|' + m.width + '|' +
          m.height + '|' + (m.iconUri ? m.iconUri.length : 0);
      }

      function getVisibleMarkerSnapshot(markerEntries) {
        var sourceMarkers = Array.isArray(markerEntries) ? markerEntries : [];
        var snapshot = {
          firstId: '',
          firstKind: '',
          firstPoint: null
        };
        var viewportWidth = map.getContainer().clientWidth;
        var viewportHeight = map.getContainer().clientHeight;

        for (var markerIndex = 0; markerIndex < sourceMarkers.length; markerIndex += 1) {
          var candidateMarker = sourceMarkers[markerIndex];
          if (!candidateMarker || !candidateMarker.entry) continue;
          var projectedMarkerPoint = map.project([candidateMarker.entry.lng, candidateMarker.entry.lat]);
          if (
            projectedMarkerPoint.x >= 0 &&
            projectedMarkerPoint.x <= viewportWidth &&
            projectedMarkerPoint.y >= 0 &&
            projectedMarkerPoint.y <= viewportHeight
          ) {
            snapshot.firstId = String(candidateMarker.entry.id || '');
            snapshot.firstKind = String(candidateMarker.entry.kind || '');
            snapshot.firstPoint = [
              Math.round(projectedMarkerPoint.x),
              Math.round(projectedMarkerPoint.y)
            ];
            break;
          }
        }

        return snapshot;
      }

      function setMarkers(newMarkers) {
        var safeMarkers = Array.isArray(newMarkers) ? newMarkers : [];

        var existingById = {};
        for (var i = 0; i < window.__markers__.length; i++) {
          var mo = window.__markers__[i];
          existingById[mo.entry.id] = mo;
        }

        var nextArr = [];
        var didChange = false;
        for (var j = 0; j < safeMarkers.length; j++) {
          var entry = safeMarkers[j];
          if (!entry || !Number.isFinite(entry.lat) || !Number.isFinite(entry.lng)) continue;
          var existing = existingById[entry.id];
          if (existing && markerFingerprint(existing.entry) === markerFingerprint(entry)) {
            existing.entry = entry;
            nextArr.push(existing);
            delete existingById[entry.id];
          } else {
            if (existing) {
              existing.marker.remove();
              delete existingById[entry.id];
            }
            didChange = true;
            nextArr.push(createMarker(entry));
          }
        }

        var leftoverIds = Object.keys(existingById);
        for (var k = 0; k < leftoverIds.length; k++) {
          existingById[leftoverIds[k]].marker.remove();
        }
        if (leftoverIds.length > 0) {
          didChange = true;
        }

        if (!didChange) {
          if (window.__markers__.length !== nextArr.length) {
            didChange = true;
          } else {
            for (var orderIndex = 0; orderIndex < nextArr.length; orderIndex += 1) {
              if (window.__markers__[orderIndex] !== nextArr[orderIndex]) {
                didChange = true;
                break;
              }
            }
          }
        }

        var firstMarker = nextArr.length > 0 ? nextArr[0] : null;
        var firstMarkerPoint = null;
        var firstVisibleSnapshot = getVisibleMarkerSnapshot(nextArr);
        for (var markerIndex = 0; markerIndex < nextArr.length; markerIndex += 1) {
          var candidateMarker = nextArr[markerIndex];
          if (!candidateMarker || !candidateMarker.entry) continue;
          var projectedMarkerPoint = map.project([candidateMarker.entry.lng, candidateMarker.entry.lat]);
          var roundedMarkerPoint = [Math.round(projectedMarkerPoint.x), Math.round(projectedMarkerPoint.y)];
          if (!firstMarkerPoint) {
            firstMarkerPoint = roundedMarkerPoint;
          }
        }
        window.__markers__ = nextArr;
        debug('setMarkers', {
          requested: safeMarkers.length,
          rendered: nextArr.length,
          didChange: didChange,
          firstId: firstMarker && firstMarker.entry ? String(firstMarker.entry.id || '') : '',
          firstKind: firstMarker && firstMarker.entry ? String(firstMarker.entry.kind || '') : '',
          firstPoint: firstMarkerPoint,
          firstVisibleId: firstVisibleSnapshot.firstId,
          firstVisibleKind: firstVisibleSnapshot.firstKind,
          firstVisiblePoint: firstVisibleSnapshot.firstPoint
        });

        // Sync canvas hit layer with all current DOM markers so map.on('click')
        // can detect taps on all marker types without any DOM touch events.
        ensureSingleMarkerLayers();
        var hitSource = map.getSource(SINGLE_MARKERS_SOURCE_ID);
        if (hitSource && typeof hitSource.setData === 'function') {
          var hitFeatures = [];
          for (var hi = 0; hi < nextArr.length; hi += 1) {
            var hm = nextArr[hi];
            if (!hm || !hm.entry || !Number.isFinite(hm.entry.lat) || !Number.isFinite(hm.entry.lng)) continue;
            // hitRadius must cover the full icon height — for bottom-anchored pins
            // the coord is at the base, so the entire icon body sits above it.
            var hitRadius = Math.max(18, Math.round(Math.min(hm.width, hm.height) * 0.38));
            hitFeatures.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [hm.entry.lng, hm.entry.lat] },
              properties: {
                id: hm.entry.id,
                kind: hm.entry.kind,
                focusLng: hm.entry.focusLng,
                focusLat: hm.entry.focusLat,
                hitRadius: hitRadius
              }
            });
          }
          hitSource.setData({ type: 'FeatureCollection', features: hitFeatures });
        }

        if (didChange) {
          scheduleLabelCollisionPass();
        }
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
            var allMarkers = (msg.markers || []).concat(msg.singleMarkers || []);
            debug('incomingSetData', {
              markerCount: Array.isArray(msg.markers) ? msg.markers.length : 0,
              singleMarkerCount: Array.isArray(msg.singleMarkers) ? msg.singleMarkers.length : 0,
              totalMarkers: allMarkers.length,
              hasUserCoord: Array.isArray(msg.userCoord)
            });
            setMarkers(allMarkers);
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

      map.on('dragstart', function () {
        clearMarkerLongPressTracking();
        if (!isProgrammaticMove) {
          isUserGesture = true;
          send({ type: 'userGestureStart' });
        }
      });
      map.on('zoomstart', function () {
        clearMarkerLongPressTracking();
        if (!isProgrammaticMove) {
          isUserGesture = true;
          send({ type: 'userGestureStart' });
        }
      });
      map.on('rotatestart', function () {
        clearMarkerLongPressTracking();
        if (!isProgrammaticMove) {
          isUserGesture = true;
          send({ type: 'userGestureStart' });
        }
      });
      map.on('move', scheduleLabelCollisionPass);
      map.on('zoom', scheduleLabelCollisionPass);
      map.on('rotate', scheduleLabelCollisionPass);
      map.on('touchstart', function (e) {
        var point = resolveEventPoint(e);
        var touchCount = e && Array.isArray(e.points) ? e.points.length : 1;
        if (!point || touchCount !== 1) {
          clearMarkerLongPressTracking();
          send({ type: 'userGestureStart' });
          return;
        }

        var feature = findBestMarkerFeatureAtPoint(point, MARKER_HIT_QUERY_PAD_PX);
        if (!feature) {
          clearMarkerLongPressTracking();
          send({ type: 'userGestureStart' });
          return;
        }

        scheduleMarkerLongPress(feature, point);
      });
      map.on('touchmove', function (e) {
        send({ type: 'userGestureStart' });
        if (!markerLongPressStartPoint) {
          return;
        }

        var point = resolveEventPoint(e);
        var touchCount = e && Array.isArray(e.points) ? e.points.length : 1;
        if (!point || touchCount !== 1) {
          clearMarkerLongPressTracking();
          return;
        }

        var dx = Number(point.x) - Number(markerLongPressStartPoint.x);
        var dy = Number(point.y) - Number(markerLongPressStartPoint.y);
        if (Math.sqrt(dx * dx + dy * dy) > MARKER_LONG_PRESS_MOVE_TOLERANCE_PX) {
          clearMarkerLongPressTracking();
        }
      });
      map.on('touchend', function () {
        clearMarkerLongPressTracking();
      });
      map.on('moveend', function () {
        var center = map.getCenter();
        var visibleMarkerSnapshot = getVisibleMarkerSnapshot(window.__markers__);
        send({
          type: 'cameraIdle',
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
          isUserGesture: isUserGesture && !isProgrammaticMove,
        });
        debug('visibleAfterMove', visibleMarkerSnapshot);
        isUserGesture = false;
        scheduleLabelCollisionPass();
      });

      map.on('click', function (e) {
        if (suppressNextMarkerClick) {
          suppressNextMarkerClick = false;
          debug('markerClickSuppressedAfterLongPress', {});
          return;
        }

        var point = resolveEventPoint(e);
        var markerObj = point ? findBestMarkerFeatureAtPoint(point, MARKER_HIT_QUERY_PAD_PX) : null;
        debug('mapClick', {
          point: point ? [Math.round(point.x), Math.round(point.y)] : null,
          featureCount: markerObj ? 1 : 0
        });
        if (!markerObj) return;

        var payload = extractMarkerPayloadFromFeature(markerObj);
        if (!payload) return;

        send({
          type: 'markerPress',
          id: payload.id,
          kind: payload.kind,
          focus: payload.focus
        });
        debug('markerPressDispatched', { id: payload.id, kind: payload.kind });
      });

      map.on('style.load', function () {
        ensureSingleMarkerLayers();
        debug('styleLoad', {
          center: [map.getCenter().lng, map.getCenter().lat],
          zoom: map.getZoom(),
          style: 'discover-light-vector'
        });
      });

      map.on('load', function () {
        ensureSingleMarkerLayers();
        debug('mapLoad', {
          center: [map.getCenter().lng, map.getCenter().lat],
          zoom: map.getZoom()
        });
        send({ type: 'ready' });
      });
    })();
  </script>
</body>
</html>`;

const WEBVIEW_ORIGIN_WHITELIST = ["*"];
const WEBVIEW_SOURCE = { html: LEAFLET_HTML };

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

function DiscoverMapNative({
  cameraRef,
  filteredMarkers,
  userCoord,
  hasActiveFilter,
  onCameraChanged,
  mapCenter,
  mapZoom,
  cityCenter,
  onMarkerPress,
  onMarkerLongPress,
  onUserGestureStart,
  initialCamera,
}: DiscoverMapProps) {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
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
  const iconUriCacheRef = useRef<Record<number, string | null>>(WEBVIEW_ICON_URI_CACHE);
  const onCameraChangedRef = useRef(onCameraChanged);
  const onMarkerPressRef = useRef(onMarkerPress);
  const onMarkerLongPressRef = useRef(onMarkerLongPress);
  const onUserGestureStartRef = useRef(onUserGestureStart);

  if (isDiscoverDebugEnabled()) {
    discoverDebugLog("[DiscoverMapDebug:native] render", {
      renderCount: renderCountRef.current,
      filteredMarkers: filteredMarkers.length,
      webReady,
      webMarkers: webMarkers.length,
    });
  }

  useEffect(() => {
    onCameraChangedRef.current = onCameraChanged;
  }, [onCameraChanged]);

  useEffect(() => {
    onMarkerPressRef.current = onMarkerPress;
  }, [onMarkerPress]);

  useEffect(() => {
    onMarkerLongPressRef.current = onMarkerLongPress;
  }, [onMarkerLongPress]);

  useEffect(() => {
    onUserGestureStartRef.current = onUserGestureStart;
  }, [onUserGestureStart]);

  useEffect(() => {
    discoverDebugLog("[DiscoverMapDebug:native] mounted");
    return () => {
      discoverDebugLog("[DiscoverMapDebug:native] unmounted");
    };
  }, []);

  const postToWeb = useCallback((payload: unknown) => {
    const json = JSON.stringify(payload);
    if (isDiscoverDebugEnabled()) {
      const payloadType =
        payload && typeof payload === "object" && "type" in (payload as Record<string, unknown>)
          ? String((payload as Record<string, unknown>).type)
          : "unknown";
      discoverDebugLog("[DiscoverMapDebug:native] postToWeb", { type: payloadType });
    }
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

  const prevWebMarkersRef = useRef<WebMarker[]>([]);

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
        const localUri = asset.localUri;
        if (!localUri) {
          iconUriCacheRef.current[assetId] = null;
          return null;
        }
        const base64 = await readAsStringAsync(localUri, {
          encoding: EncodingType.Base64,
        });
        if (!base64) {
          iconUriCacheRef.current[assetId] = null;
          return null;
        }
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
          imageKey: `asset-${marker.image}`,
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
      if (cancelled) return;

      const prev = prevWebMarkersRef.current;
      if (
        prev.length === next.length &&
        next.every(
          (m, idx) =>
            prev[idx].id === m.id &&
            prev[idx].lat === m.lat &&
            prev[idx].lng === m.lng &&
            prev[idx].kind === m.kind &&
            prev[idx].imageKey === m.imageKey &&
            prev[idx].title === m.title &&
            prev[idx].count === m.count &&
            prev[idx].width === m.width &&
            prev[idx].height === m.height &&
            prev[idx].iconUri === m.iconUri
        )
      ) {
        return;
      }
      prevWebMarkersRef.current = next;
      setWebMarkers(next);
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

  const singleLayerMarkers = useMemo(
    () => webMarkers.filter((marker) => marker.kind === "single"),
    [webMarkers]
  );

  const domWebMarkers = useMemo(
    () => webMarkers.filter((marker) => marker.kind !== "single"),
    [webMarkers]
  );

  useEffect(() => {
    discoverDebugLog("[DiscoverMapDebug:native] markerPayloadChanged", {
      total: webMarkers.length,
      singles: singleLayerMarkers.length,
    });
  }, [singleLayerMarkers.length, webMarkers.length]);

  useEffect(() => {
    if (!webReady) return;
    postToWeb({
      type: "setData",
      markers: domWebMarkers,
      singleMarkers: singleLayerMarkers,
      userCoord: sanitizedUserCoord,
    });
  }, [domWebMarkers, postToWeb, sanitizedUserCoord, singleLayerMarkers, webReady]);

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
        if (payload.type === "debug") {
          discoverDebugLog("[DiscoverMapDebug:web]", payload);
          return;
        }
        if (payload.type === "ready") {
          discoverDebugLog("[DiscoverMapDebug:native] webReady");
          setWebReady(true);
          return;
        }
        if (payload.type === "cameraIdle") {
          discoverDebugLog("[DiscoverMapDebug:native] cameraIdle", payload);
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
          const previousCamera = cameraStateRef.current;
          const sameCenter =
            Math.abs(normalizedCenter[0] - previousCamera.center[0]) < 1e-8 &&
            Math.abs(normalizedCenter[1] - previousCamera.center[1]) < 1e-8;
          const sameZoom = Math.abs(zoom - previousCamera.zoom) < 1e-6;
          cameraStateRef.current = { center: normalizedCenter, zoom };
          if (!sameCenter) {
            setSettledCenter(normalizedCenter);
          }
          const nextDiscrete = Math.floor(Math.max(0, Math.min(20, zoom + IOS_ZOOM_OFFSET)));
          if (nextDiscrete !== discreteZoomRef.current) {
            discreteZoomRef.current = nextDiscrete;
            setDiscreteZoomState(nextDiscrete);
          }
          if (!sameCenter || !sameZoom) {
            onCameraChangedRef.current(
              normalizedCenter,
              zoom,
              Boolean(payload.isUserGesture)
            );
          }
          return;
        }
        if (payload.type === "markerPress") {
          discoverDebugLog("[DiscoverMapDebug:native] markerPress", payload);
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
            onMarkerPressRef.current?.(id);
          }
          return;
        }
        if (payload.type === "markerLongPress") {
          discoverDebugLog("[DiscoverMapDebug:native] markerLongPress", payload);
          const id = typeof payload.id === "string" ? payload.id : "";
          const coord = Array.isArray(payload.coord) ? payload.coord : null;
          const point = Array.isArray(payload.point) ? payload.point : null;
          if (!id || !coord || coord.length !== 2 || !point || point.length !== 2) {
            return;
          }

          const lng = Number(coord[0]);
          const lat = Number(coord[1]);
          const x = Number(point[0]);
          const y = Number(point[1]);
          if (!Number.isFinite(lng) || !Number.isFinite(lat) || !Number.isFinite(x) || !Number.isFinite(y)) {
            return;
          }

          onMarkerLongPressRef.current?.(id, normalizeCenter([lng, lat]), [x, y]);
        }
        if (payload.type === "userGestureStart") {
          onUserGestureStartRef.current?.();
        }
      } catch {
        // Ignore malformed payloads from the web side.
      }
    },
    [postToWeb]
  );

  return (
    <View style={styles.map}>
      <WebView
        ref={webViewRef}
        style={StyleSheet.absoluteFill}
        originWhitelist={WEBVIEW_ORIGIN_WHITELIST}
        source={WEBVIEW_SOURCE}
        javaScriptEnabled
        domStorageEnabled
        onLoadStart={() => {
          discoverDebugLog("[DiscoverMapDebug:native] webViewLoadStart");
        }}
        onLoadEnd={() => {
          discoverDebugLog("[DiscoverMapDebug:native] webViewLoadEnd");
        }}
        onMessage={handleWebMessage}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

const areDiscoverMapPropsEqual = (
  previous: DiscoverMapProps,
  next: DiscoverMapProps
) =>
  previous.cameraRef === next.cameraRef &&
  previous.filteredMarkers === next.filteredMarkers &&
  previous.userCoord === next.userCoord &&
  previous.hasActiveFilter === next.hasActiveFilter &&
  previous.labelPolicy === next.labelPolicy &&
  previous.markerRenderPolicy === next.markerRenderPolicy &&
  previous.onCameraChanged === next.onCameraChanged &&
  previous.onMarkerPress === next.onMarkerPress &&
  previous.onMarkerLongPress === next.onMarkerLongPress &&
  previous.onUserGestureStart === next.onUserGestureStart &&
  previous.mapCenter === next.mapCenter &&
  previous.mapZoom === next.mapZoom &&
  previous.cityCenter === next.cityCenter;

export default memo(DiscoverMapNative, areDiscoverMapPropsEqual);
