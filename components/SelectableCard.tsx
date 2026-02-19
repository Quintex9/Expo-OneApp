import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import type { SelectableCardProps } from "../lib/interfaces";

/**
 * SelectableCard: Jednoduchá klikateľná karta pre výber položky podľa identifikátora.
 *
 * Prečo: Unifikované správanie výberu znižuje duplicitu a drží rovnaký tap feedback naprieč UI.
 */
export default function SelectableCard({
  id,
  title,
  price,
  description,
  popular = false,
  selected,
  onPress,
}: SelectableCardProps) {
  const { t } = useTranslation();
  const Wrapper: any = selected ? LinearGradient : View;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(id)}>
      <Wrapper
        style={[styles.card, selected && styles.selectedCard]}
        {...(selected && {
          colors: ["#EB8100", "#FFF5E8"],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 0 },
        })}
      >
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{title}</Text>
            {popular && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t("popular")}</Text>
              </View>
            )}
          </View>
          <Text style={styles.price}>
            {price} € <Text style={styles.per}>/ {t("month")}</Text>
          </Text>
        </View>

        <Text style={styles.desc} numberOfLines={3}>{description}</Text>
      </Wrapper>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 101,
    borderWidth: 0.5,
    borderColor: "#E4E4E7",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 16,
    backgroundColor: "#fff",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)" }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }),
  },
  selectedCard: {
    borderWidth: 0.5,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  per: {
    fontSize: 12,
    color: "#000",
    fontWeight: "500",
  },
  desc: {
    fontSize: 10,
    color: "rgba(0, 0, 0, 0.5)",
    lineHeight: 12,
    marginTop: 8,
  },
  badge: {
    backgroundColor: "#000",
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "600",
  },
});
