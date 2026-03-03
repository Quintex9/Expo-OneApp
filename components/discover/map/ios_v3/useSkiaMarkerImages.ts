import { useCallback, useRef } from "react";
import { Skia, type SkImage } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import { Asset } from "expo-asset";

export type SkiaImageMap = Record<number, SkImage | null>;

export function useSkiaMarkerImages() {
  const cacheRef = useRef<SkiaImageMap>({});
  const imageMapShared = useSharedValue<SkiaImageMap>({});

  const ensureImages = useCallback(
    async (assetIds: number[]): Promise<void> => {
      const missing = assetIds.filter((id) => !(id in cacheRef.current));
      if (missing.length === 0) {
        return;
      }

      await Promise.all(
        missing.map(async (id) => {
          try {
            const asset = Asset.fromModule(id);
            await asset.downloadAsync();
            const localUri = asset.localUri;
            if (!localUri) {
              cacheRef.current[id] = null;
              return;
            }
            const response = await fetch(localUri);
            const buffer = await response.arrayBuffer();
            const data = Skia.Data.fromBytes(new Uint8Array(buffer));
            cacheRef.current[id] = Skia.Image.MakeImageFromEncoded(data);
          } catch {
            cacheRef.current[id] = null;
          }
        })
      );

      // Assign a new object reference so the SharedValue triggers worklet re-run.
      imageMapShared.value = { ...cacheRef.current };
    },
    [imageMapShared]
  );

  return { imageMapShared, ensureImages };
}
