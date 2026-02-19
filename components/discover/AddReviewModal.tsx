import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ReviewPhotoDraft } from "../../lib/reviews/types";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, text: string, photos?: ReviewPhotoDraft[]) => void;
  branchName?: string;
  photosEnabled?: boolean;
  maxPhotos?: number;
};

const createPhotoDraft = (asset: ImagePicker.ImagePickerAsset): ReviewPhotoDraft => ({
  id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  uri: asset.uri,
  fileName: asset.fileName ?? undefined,
  fileSize: asset.fileSize ?? undefined,
  width: asset.width,
  height: asset.height,
  mimeType: asset.mimeType ?? undefined,
  status: "local",
});

const dedupePhotosByUri = (photos: ReviewPhotoDraft[]) => {
  const unique = new Map<string, ReviewPhotoDraft>();
  photos.forEach((photo) => {
    if (!unique.has(photo.uri)) {
      unique.set(photo.uri, photo);
    }
  });
  return Array.from(unique.values());
};

/**
 * AddReviewModal: Modal na vytvorenie recenzie s hodnotením, textom a výberom fotiek.
 *
 * Prečo: Vedený formulár zvyšuje kvalitu recenzií a znižuje počet neúplných odoslaní.
 */
export function AddReviewModal({
  visible,
  onClose,
  onSubmit,
  branchName,
  photosEnabled = false,
  maxPhotos = 3,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [photos, setPhotos] = useState<ReviewPhotoDraft[]>([]);

  const resetState = useCallback(() => {
    setRating(0);
    setReviewText("");
    setPhotos([]);
  }, []);

  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      Alert.alert(t("error"), t("ratingRequired"));
      return;
    }
    if (reviewText.trim().length < 10) {
      Alert.alert(t("error"), t("reviewRequired"));
      return;
    }

    onSubmit(rating, reviewText.trim(), photosEnabled ? photos : undefined);
    resetState();
    Alert.alert(t("success"), t("thankYouReview"));
    onClose();
  }, [onClose, onSubmit, photos, photosEnabled, rating, resetState, reviewText, t]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handlePickPhotos = useCallback(async () => {
    if (!photosEnabled) {
      return;
    }

    const remainingSlots = Math.max(0, maxPhotos - photos.length);
    if (remainingSlots === 0) {
      Alert.alert(t("error"), t("reviewPhotoLimitReached", { count: maxPhotos }));
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: remainingSlots > 1,
        selectionLimit: remainingSlots,
        quality: 0.82,
      });

      if (result.canceled) {
        return;
      }

      const drafts = result.assets.map(createPhotoDraft);
      setPhotos((prev) =>
        dedupePhotosByUri([...prev, ...drafts]).slice(0, maxPhotos)
      );
    } catch {
      Alert.alert(t("error"), t("reviewPhotoPickerError"));
    }
  }, [maxPhotos, photos.length, photosEnabled, t]);

  const handleRemovePhoto = useCallback((photoId: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
  }, []);

  const getRatingLabel = useCallback(
    (value: number) => {
      if (value === 5) return t("ratingLabel5");
      if (value === 4) return t("ratingLabel4");
      if (value === 3) return t("ratingLabel3");
      if (value === 2) return t("ratingLabel2");
      return t("ratingLabel1");
    },
    [t]
  );

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i += 1) {
      const isActive = i <= (hoveredStar || rating);
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          onPressIn={() => setHoveredStar(i)}
          onPressOut={() => setHoveredStar(0)}
          activeOpacity={0.7}
          style={styles.starButton}
          accessibilityLabel={t("selectRating")}
        >
          <Ionicons
            name={isActive ? "star" : "star-outline"}
            size={36}
            color={isActive ? "#F5A623" : "#D1D5DB"}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const photoSectionVisible = photosEnabled;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTouchable} onPress={handleClose} />
        </View>

        <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{t("writeReview")}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {branchName ? <Text style={styles.branchName}>{branchName}</Text> : null}

          <View style={styles.ratingSection}>
            <Text style={styles.sectionLabel}>{t("selectRating")}</Text>
            <View style={styles.starsContainer}>{renderStars()}</View>
            {rating > 0 ? <Text style={styles.ratingText}>{getRatingLabel(rating)}</Text> : null}
          </View>

          <View style={styles.textSection}>
            <Text style={styles.sectionLabel}>{t("yourReview")}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t("reviewPlaceholder")}
              placeholderTextColor="#9CA3AF"
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={5}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{reviewText.length}/500</Text>
          </View>

          {photoSectionVisible ? (
            <View style={styles.photoSection}>
              <View style={styles.photoSectionHeader}>
                <Text style={styles.sectionLabel}>{t("reviewPhotosTitle")}</Text>
                <Text style={styles.photoCount}>
                  {photos.length}/{maxPhotos}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.photoPickerButton,
                  photos.length >= maxPhotos && styles.photoPickerButtonDisabled,
                ]}
                onPress={handlePickPhotos}
                activeOpacity={0.8}
                disabled={photos.length >= maxPhotos}
                accessibilityLabel={t("reviewPhotoAddA11y")}
              >
                <Ionicons name="images-outline" size={16} color="#FFFFFF" />
                <Text style={styles.photoPickerButtonText}>{t("reviewPhotoAdd")}</Text>
              </TouchableOpacity>

              {photos.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoPreviewRow}
                >
                  {photos.map((photo) => (
                    <View key={photo.id} style={styles.photoPreviewItem}>
                      <Image source={{ uri: photo.uri }} style={styles.photoPreviewImage} />
                      <TouchableOpacity
                        style={styles.photoRemoveButton}
                        onPress={() => handleRemovePhoto(photo.id)}
                        accessibilityLabel={t("reviewPhotoRemoveA11y")}
                      >
                        <Ionicons name="close" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (rating === 0 || reviewText.trim().length < 10) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#FFF" style={styles.submitIcon} />
            <Text style={styles.submitButtonText}>{t("submitReview")}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdropTouchable: {
    flex: 1,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  branchName: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  ratingSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  textSection: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  charCount: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 6,
  },
  photoSection: {
    marginBottom: 18,
  },
  photoSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  photoCount: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  photoPickerButton: {
    backgroundColor: "#F97316",
    borderRadius: 10,
    minHeight: 40,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoPickerButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  photoPickerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  photoPreviewRow: {
    gap: 10,
    paddingTop: 10,
  },
  photoPreviewItem: {
    width: 74,
    height: 74,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    position: "relative",
  },
  photoPreviewImage: {
    width: "100%",
    height: "100%",
  },
  photoRemoveButton: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
