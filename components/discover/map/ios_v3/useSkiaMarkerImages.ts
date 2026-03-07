import { useCallback, useRef } from "react";
import { Skia, type SkImage } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import { Asset } from "expo-asset";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";

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
            const base64 = await readAsStringAsync(localUri, {
              encoding: EncodingType.Base64,
            });
            if (!base64) {
              cacheRef.current[id] = null;
              return;
            }
            const data = Skia.Data.fromBase64(base64);
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
