import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type ListRenderItemInfo,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type GalleryItem = {
  id: string;
  image: ImageSourcePropType;
};

type Props = {
  visible: boolean;
  images: GalleryItem[];
  initialIndex: number;
  topInset: number;
  onClose: () => void;
};

const IMAGE_HEIGHT_RATIO = 379.19 / 393;

export function BusinessGalleryModal({
  visible,
  images,
  initialIndex,
  topInset,
  onClose,
}: Props) {
  const listRef = useRef<FlatList<GalleryItem>>(null);
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const clampedInitialIndex = useMemo(() => {
    if (images.length === 0) {
      return 0;
    }
    return Math.max(0, Math.min(initialIndex, images.length - 1));
  }, [images.length, initialIndex]);

  const topOffset = useMemo(() => Math.max(160, Math.round(width * 0.6)), [width]);
  const imageHeight = useMemo(
    () => Math.round(Math.max(280, width * IMAGE_HEIGHT_RATIO)),
    [width]
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    setCurrentIndex(clampedInitialIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: width * clampedInitialIndex,
        animated: false,
      });
    });
  }, [clampedInitialIndex, visible, width]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<GalleryItem>) => (
      <View style={{ width, height: imageHeight }}>
        <Image
          source={item.image}
          style={styles.image}
          resizeMode="cover"
          resizeMethod="resize"
          fadeDuration={0}
        />
        <View style={styles.imageOverlay} />
      </View>
    ),
    [imageHeight, width]
  );

  const handleMomentumEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / Math.max(1, width));
      setCurrentIndex(index);
    },
    [width]
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<GalleryItem> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width]
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.backButton, { top: topInset + 12 }]}
          activeOpacity={0.82}
          onPress={onClose}
        >
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>

        <View style={{ marginTop: topOffset }}>
          <FlatList
            ref={listRef}
            data={images}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumEnd}
            getItemLayout={getItemLayout}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            onScrollToIndexFailed={() => undefined}
          />
        </View>

        {images.length > 1 && (
          <View style={styles.paginationWrapper} pointerEvents="none">
            <View style={styles.paginationDots}>
              {images.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.dot,
                    index === currentIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFEFEF",
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 40,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  paginationWrapper: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  paginationDots: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#5F5F5F",
  },
  dotInactive: {
    backgroundColor: "#AFAFAF",
  },
});
