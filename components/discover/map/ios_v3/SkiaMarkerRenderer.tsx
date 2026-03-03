import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import type { Region } from "react-native-maps";
import type { SkiaImageMap } from "./useSkiaMarkerImages";
import { gpsToScreen } from "./gpsToScreen";
import type { MapViewportSize } from "./gpsToScreen";

export type MarkerDatum = {
  latitude: number;
  longitude: number;
  /** require() asset module ID */
  imageId: number;
  anchorX: number;
  anchorY: number;
  width: number;
  height: number;
};

type Props = {
  regionShared: SharedValue<Region>;
  viewportShared: SharedValue<MapViewportSize>;
  markersShared: SharedValue<MarkerDatum[]>;
  imageMapShared: SharedValue<SkiaImageMap>;
};

// Module-level recorder — reused across frames inside the useDerivedValue worklet.
const recorder = Skia.PictureRecorder();

const VIEWPORT_PADDING = 50;

export const SkiaMarkerRenderer = memo(function SkiaMarkerRenderer({
  regionShared,
  viewportShared,
  markersShared,
  imageMapShared,
}: Props) {
  const picture = useDerivedValue(() => {
    "worklet";
    const vp = viewportShared.value;
    const w = vp.width > 0 ? vp.width : 1;
    const h = vp.height > 0 ? vp.height : 1;

    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, w, h));

    if (vp.width > 0 && vp.height > 0) {
      const region = regionShared.value;
      const markers = markersShared.value;
      const imageMap = imageMapShared.value;

      for (let i = 0; i < markers.length; i++) {
        const m = markers[i];
        const pos = gpsToScreen(
          { latitude: m.latitude, longitude: m.longitude },
          region,
          vp
        );
        if (!pos) continue;

        const img = imageMap[m.imageId];
        if (!img) continue;

        const x = pos.x - m.width * m.anchorX;
        const y = pos.y - m.height * m.anchorY;

        if (
          x < -VIEWPORT_PADDING - m.width ||
          x > vp.width + VIEWPORT_PADDING ||
          y < -VIEWPORT_PADDING - m.height ||
          y > vp.height + VIEWPORT_PADDING
        ) {
          continue;
        }

        canvas.save();
        canvas.translate(x, y);
        canvas.scale(m.width / img.width(), m.height / img.height());
        canvas.drawImage(img, 0, 0);
        canvas.restore();
      }
    }

    return recorder.finishRecordingAsPicture();
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
});
