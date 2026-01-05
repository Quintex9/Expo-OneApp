import React, { useMemo } from "react";
import { Image, useWindowDimensions } from "react-native";
import Mapbox, {
  Camera,
  MapView,
  LocationPuck,
  UserLocation,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { DiscoverMapProps } from "../../lib/interfaces";
import { styles } from "./discoverStyles";

const CLUSTER_IMAGE = require("../../images/group_pin.png");
const FILTER_CLUSTER_IMAGE = require("../../images/filter_pin.png");
const BADGE_IMAGE = require("../../images/badge.png");
const STAR_IMAGE = require("../../images/star_white.png");
const CITY_CLUSTER_ZOOM = 12;
const CLUSTER_MAX_ZOOM = 14;
const DEFAULT_CITY_CENTER: [number, number] = [18.091, 48.3069];
const CLUSTER_DEFAULT_NAME = "clusterDefault";
const CLUSTER_FILTER_NAME = "clusterFilter";
const BADGE_IMAGE_NAME = "badge";
const STAR_IMAGE_NAME = "star";
const BADGE_BASE_OFFSET_X = 14;
const BADGE_BASE_OFFSET_Y = -53;
const BADGE_BASE_CENTER_Y = BADGE_BASE_OFFSET_Y - 8;
const STAR_BASE_OFFSET_X = BADGE_BASE_OFFSET_X - 8;
const STAR_BASE_OFFSET_Y = BADGE_BASE_CENTER_Y + 3;
const TEXT_BASE_OFFSET_X = BADGE_BASE_OFFSET_X;
const TEXT_BASE_OFFSET_Y = BADGE_BASE_CENTER_Y;
const BADGE_BASE_WIDTH = 360;

const clusterFadeOut = [
  "interpolate",
  ["linear"],
  ["zoom"],
  CLUSTER_MAX_ZOOM,
  1,
  CLUSTER_MAX_ZOOM + 0.4,
  0,
] as const;

const markerFadeIn = [
  "interpolate",
  ["linear"],
  ["zoom"],
  CLUSTER_MAX_ZOOM,
  0,
  CLUSTER_MAX_ZOOM + 0.4,
  1,
] as const;

const clusterLayerBase = {
  iconSize: 1,
  iconAnchor: "bottom",
  iconAllowOverlap: true,
  iconIgnorePlacement: true,
  iconOpacity: clusterFadeOut,
  textField: ["to-string", ["get", "point_count"]],
  textSize: 13,
  textFont: ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
  textColor: "#fff",
  textAnchor: "center",
  textOffset: [0, -3.2],
  textOpacity: clusterFadeOut,
  textAllowOverlap: true,
  textIgnorePlacement: true,
} as const;

const pointLayerStyle = {
  iconImage: ["get", "icon"],
  iconSize: 1,
  iconAnchor: "bottom",
  iconAllowOverlap: true,
  iconIgnorePlacement: true,
  iconOpacity: markerFadeIn,
} as const;

const badgeLayerBase = {
  iconImage: BADGE_IMAGE_NAME,
  iconSize: 1,
  iconAnchor: "bottom",
  iconAllowOverlap: true,
  iconIgnorePlacement: true,
  iconOffset: [0, 0],
  iconTranslateAnchor: "viewport",
  iconOpacity: markerFadeIn,
} as const;

const badgeStarLayerBase = {
  iconImage: STAR_IMAGE_NAME,
  iconSize: 0.62,
  iconAnchor: "bottom",
  iconAllowOverlap: true,
  iconIgnorePlacement: true,
  iconOffset: [0, 0],
  iconTranslateAnchor: "viewport",
  iconOpacity: markerFadeIn,
} as const;

const badgeTextLayerBase = {
  textField: ["get", "rating"],
  textSize: 10,
  textFont: ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
  textColor: "#fff",
  textAnchor: "left",
  textOffset: [0, 0],
  textTranslateAnchor: "viewport",
  textOpacity: markerFadeIn,
  textAllowOverlap: true,
  textIgnorePlacement: true,
} as const;

const ratingValues = ["4.1", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "5.0"];

const getRatingForId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return ratingValues[hash % ratingValues.length];
};

const toFeatureCollection = <TProps,>(features: Feature<Point, TProps>[]) =>
  ({
    type: "FeatureCollection",
    features,
  }) as FeatureCollection<Point, TProps>;

export default function DiscoverMap({
  cameraRef,
  filteredMarkers,
  onUserLocationUpdate,
  onCameraChanged,
  mapZoom,
  cityCenter,
  isFilterActive,
}: DiscoverMapProps) {
  const { width } = useWindowDimensions();
  const badgeScale = width / BADGE_BASE_WIDTH;
  const badgeOffsetX = BADGE_BASE_OFFSET_X * badgeScale;
  const badgeOffsetY = BADGE_BASE_OFFSET_Y * badgeScale;
  const starOffsetX = STAR_BASE_OFFSET_X * badgeScale;
  const starOffsetY = STAR_BASE_OFFSET_Y * badgeScale;
  const textOffsetX = TEXT_BASE_OFFSET_X * badgeScale;
  const textOffsetY = TEXT_BASE_OFFSET_Y * badgeScale;
  const clusterCenter = cityCenter ?? DEFAULT_CITY_CENTER;
  const isCityCluster =
    typeof mapZoom === "number" && mapZoom <= CITY_CLUSTER_ZOOM && filteredMarkers.length > 0;
  const clusterIconName = isFilterActive ? CLUSTER_FILTER_NAME : CLUSTER_DEFAULT_NAME;
  const clusterLayerStyle = useMemo(
    () => ({ ...clusterLayerBase, iconImage: clusterIconName }),
    [clusterIconName]
  );
  const soloClusterLayerStyle = useMemo(
    () => ({
      ...clusterLayerBase,
      iconImage: clusterIconName,
      textField: "1",
    }),
    [clusterIconName]
  );
  const badgeLayerStyle = useMemo(
    () => ({
      ...badgeLayerBase,
      iconTranslate: [badgeOffsetX, badgeOffsetY],
    }),
    [badgeOffsetX, badgeOffsetY]
  );
  const badgeStarLayerStyle = useMemo(
    () => ({
      ...badgeStarLayerBase,
      iconTranslate: [starOffsetX, starOffsetY],
    }),
    [starOffsetX, starOffsetY]
  );
  const badgeTextLayerStyle = useMemo(
    () => ({
      ...badgeTextLayerBase,
      textTranslate: [textOffsetX, textOffsetY],
    }),
    [textOffsetX, textOffsetY]
  );

  const { shape, images, clusterEnabled } = useMemo(() => {
    const imageMap: Record<string, any> = {
      [CLUSTER_DEFAULT_NAME]: CLUSTER_IMAGE,
      [CLUSTER_FILTER_NAME]: FILTER_CLUSTER_IMAGE,
      [BADGE_IMAGE_NAME]: BADGE_IMAGE,
      [STAR_IMAGE_NAME]: STAR_IMAGE,
    };

    if (isCityCluster) {
      const cityFeature: Feature<Point, { point_count: number }> = {
        type: "Feature",
        id: "city-cluster",
        properties: { point_count: filteredMarkers.length },
        geometry: { type: "Point", coordinates: clusterCenter },
      };
      return {
        clusterEnabled: false,
        images: imageMap,
        shape: toFeatureCollection([cityFeature]),
      };
    }

    const iconNameByKey = new Map<string, string>();
    let index = 0;
    const features: Feature<Point, { icon: string; rating: string }>[] = filteredMarkers.map(
      (marker) => {
      const key = String(marker.icon);
      let iconName = iconNameByKey.get(key);
      if (!iconName) {
        iconName = `marker-${index++}`;
        iconNameByKey.set(key, iconName);
        imageMap[iconName] = marker.icon;
      }
      const rating = getRatingForId(marker.id);
      return {
        type: "Feature",
        id: marker.id,
        properties: { icon: iconName, rating },
        geometry: {
          type: "Point",
          coordinates: [marker.coord.lng, marker.coord.lat],
        },
      };
    });

    return {
      clusterEnabled: true,
      images: imageMap,
      shape: toFeatureCollection(features),
    };
  }, [clusterCenter, filteredMarkers, isCityCluster]);

  return (
    <MapView
      style={styles.map}
      styleURL={Mapbox.StyleURL.Street}
      scaleBarEnabled={false}
      onCameraChanged={(state) => {
        const center =
          state?.properties?.center ??
          (state as { geometry?: { coordinates?: number[] } })?.geometry?.coordinates;
        const zoom = state?.properties?.zoom;
        if (!Array.isArray(center) || center.length < 2 || typeof zoom !== "number") {
          return;
        }
        const isUserGesture = Boolean(state?.gestures?.isGestureActive);
        onCameraChanged([center[0], center[1]], zoom, isUserGesture);
      }}
    >
      <Mapbox.Images images={images} />
      <Camera ref={cameraRef} centerCoordinate={[18.091, 48.3069]} zoomLevel={14} />

      <UserLocation
        visible
        onUpdate={(location) => {
          onUserLocationUpdate([location.coords.longitude, location.coords.latitude]);
        }}
      />

      <LocationPuck
        topImage={Image.resolveAssetSource(require("../../images/navigation.png")).uri}
        visible={true}
        scale={["interpolate", ["linear"], ["zoom"], 10, 1.0, 20, 4.0]}
        pulsing={{
          isEnabled: true,
          color: "teal",
          radius: 50.0,
        }}
      />

      <ShapeSource
        id="discover-markers"
        shape={shape}
        cluster={clusterEnabled}
        clusterRadius={120}
        clusterMaxZoomLevel={CLUSTER_MAX_ZOOM}
      >
        <SymbolLayer
          id="discover-clusters"
          filter={["has", "point_count"]}
          style={clusterLayerStyle}
          maxZoomLevel={CLUSTER_MAX_ZOOM}
        />
        <SymbolLayer
          id="discover-solo-clusters"
          filter={["!", ["has", "point_count"]]}
          style={soloClusterLayerStyle}
          maxZoomLevel={CLUSTER_MAX_ZOOM}
        />
        <SymbolLayer
          id="discover-markers-layer"
          filter={["!", ["has", "point_count"]]}
          style={pointLayerStyle}
          minZoomLevel={CLUSTER_MAX_ZOOM}
        />
        <SymbolLayer
          id="discover-badge-layer"
          filter={["!", ["has", "point_count"]]}
          style={badgeLayerStyle}
          minZoomLevel={CLUSTER_MAX_ZOOM}
        />
        <SymbolLayer
          id="discover-badge-star"
          filter={["!", ["has", "point_count"]]}
          style={badgeStarLayerStyle}
          minZoomLevel={CLUSTER_MAX_ZOOM}
        />
        <SymbolLayer
          id="discover-badge-text"
          filter={["!", ["has", "point_count"]]}
          style={badgeTextLayerStyle}
          minZoomLevel={CLUSTER_MAX_ZOOM}
        />
      </ShapeSource>
    </MapView>
  );
}
