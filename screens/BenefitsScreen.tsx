import { useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  useWindowDimensions,
  ScrollView,
  Animated,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../lib/theme";

export default function BenefitsScreen() {
  const [actualTab, setActualTab] = useState<"Activated" | "Claimed">("Activated");
  const [qrVisible, setQrVisible] = useState(false);
  const [qrTimer, setQrTimer] = useState(600); // 10 minutes in seconds
  const [lastClickedBenefitId, setLastClickedBenefitId] = useState<string | null>(null);
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const horizontalPadding = Math.min(24, Math.max(16, Math.round(screenWidth * 0.06)));
  const contentMaxWidth = 560;
  const qrPadding = 32;
  const qrSize = Math.max(180, Math.floor(Math.min(280, screenWidth - 64 - qrPadding * 2)));

  // QR Timer countdown
  useEffect(() => {
    if (qrVisible && qrTimer > 0) {
      const interval = setInterval(() => {
        setQrTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [qrVisible, qrTimer]);

  // Reset timer when modal opens
  useEffect(() => {
    if (qrVisible) {
      setQrTimer(600);
    }
  }, [qrVisible]);

  // Pulse animation for active benefit
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const benefits = useMemo(
    () => [
      {
        id: "benefit-1",
        title: t("benefit1Title"),
        description: t("benefit1Desc"),
        icon: "gift-outline" as const,
        discount: "20%",
      },
      {
        id: "benefit-2",
        title: t("benefit2Title"),
        description: t("benefit2Desc"),
        icon: "people-outline" as const,
        discount: "1+1",
      },
    ],
    [t]
  );

  const isActivated = actualTab === "Activated";

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.contentInner,
            { maxWidth: contentMaxWidth, paddingHorizontal: horizontalPadding },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { marginTop: insets.top + 6 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={1}>
              {t("myBenefits")}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{benefits.length}</Text>
              <Text style={styles.statLabel}>{t("active")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>{t("claimed")}</Text>
            </View>
          </View>

          {/* Segmented Control */}
          <View style={styles.segmented}>
            <TouchableOpacity
              onPress={() => setActualTab("Activated")}
              style={[styles.segmentButton, isActivated && styles.segmentButtonActive]}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={isActivated ? "#FFF" : "#9CA3AF"}
                style={styles.segmentIcon}
              />
              <Text style={[styles.segmentText, isActivated && styles.segmentTextActive]} numberOfLines={1}>
                {t("activated")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActualTab("Claimed")}
              style={[styles.segmentButton, !isActivated && styles.segmentButtonActive]}
              activeOpacity={0.85}
            >
              <Ionicons
                name="time"
                size={16}
                color={!isActivated ? "#FFF" : "#9CA3AF"}
                style={styles.segmentIcon}
              />
              <Text style={[styles.segmentText, !isActivated && styles.segmentTextActive]} numberOfLines={1}>
                {t("claimed")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Benefits List */}
          <View style={styles.benefitsList}>
            {benefits.map((benefit) => {
              const shouldPulse = isActivated && lastClickedBenefitId === benefit.id;
              return (
                <Animated.View
                  key={benefit.id}
                  style={[
                    styles.benefitCard,
                    shouldPulse && { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  {/* Discount Badge */}
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{benefit.discount}</Text>
                  </View>

                  {/* Icon */}
                  <View style={styles.benefitIconWrap}>
                    <Ionicons name={benefit.icon} size={28} color={colors.primary} />
                  </View>

                  {/* Content */}
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDesc}>{benefit.description}</Text>
                  </View>

                  {/* Action */}
                  <TouchableOpacity
                    onPress={() => {
                      setLastClickedBenefitId(benefit.id);
                      setQrVisible(true);
                    }}
                    disabled={!isActivated}
                    style={[styles.primaryButton, !isActivated && styles.primaryButtonDisabled]}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={isActivated ? "qr-code" : "checkmark-done"}
                      size={18}
                      color={isActivated ? "#FFF" : "#9CA3AF"}
                      style={styles.buttonIcon}
                    />
                    <Text
                      style={[styles.primaryButtonText, !isActivated && styles.primaryButtonTextDisabled]}
                    >
                      {isActivated ? t("showQR") : t("claimed")}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Empty State for Claimed */}
          {!isActivated && (
            <View style={styles.emptyState}>
              <Ionicons name="gift" size={48} color="#E4E4E7" />
              <Text style={styles.emptyText}>{t("noClaimed")}</Text>
            </View>
          )}
        </View>

        {/* QR Modal */}
        <Modal visible={qrVisible} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setQrVisible(false)}>
            <View style={styles.qrBackdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.qrCard}>
                  {/* Close Button */}
                  <TouchableOpacity
                    style={styles.qrClose}
                    onPress={() => setQrVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={24} color="#71717A" />
                  </TouchableOpacity>

                  {/* Header */}
                  <View style={styles.qrHeader}>
                    <Ionicons name="gift" size={24} color={colors.primary} />
                    <Text style={styles.qrTitle}>
                      {benefits.find(b => b.id === lastClickedBenefitId)?.title || t("benefit1Title")}
                    </Text>
                  </View>

                  {/* QR Code */}
                  <View style={styles.qrCodeWrap}>
                    <QRCode
                      value="BENEFIT-20-DISCOUNT-2024"
                      size={qrSize}
                      backgroundColor="white"
                      color="#18181B"
                    />
                  </View>

                  {/* Timer */}
                  <View style={styles.timerWrap}>
                    <Ionicons name="time-outline" size={18} color={qrTimer < 60 ? "#EF4444" : colors.primary} />
                    <Text style={[styles.qrTimer, qrTimer < 60 && styles.qrTimerUrgent]}>
                      {formatTime(qrTimer)}
                    </Text>
                  </View>

                  {/* Instructions */}
                  <Text style={styles.qrInstruction}>
                    {t("qrInstruction")}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flexGrow: 1,
  },
  contentInner: {
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    flex: 1,
    flexShrink: 1,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "#E4E4E7",
    alignItems: "center",
    justifyContent: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#71717A",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E4E4E7",
    marginHorizontal: 16,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  segmentButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#18181B",
  },
  segmentIcon: {
    marginRight: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  benefitsList: {
    marginTop: 16,
    gap: 14,
  },
  benefitCard: {
    width: "100%",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  discountBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomLeftRadius: 16,
  },
  discountText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  benefitIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(235, 129, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  benefitContent: {
    marginBottom: 16,
  },
  benefitTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#18181B",
    marginBottom: 6,
  },
  benefitDesc: {
    fontSize: 13,
    color: "#71717A",
    lineHeight: 20,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#18181B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#F4F4F5",
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  primaryButtonTextDisabled: {
    color: "#9CA3AF",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  qrBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  qrCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    position: "relative",
  },
  qrClose: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },
  qrHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 10,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18181B",
  },
  qrCodeWrap: {
    padding: 20,
    backgroundColor: "#FAFAFA",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  timerWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 8,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  qrTimer: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
  },
  qrTimerUrgent: {
    color: "#EF4444",
  },
  qrInstruction: {
    marginTop: 16,
    fontSize: 13,
    color: "#71717A",
    textAlign: "center",
  },
});
