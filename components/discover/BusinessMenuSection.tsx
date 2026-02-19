import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import type { BranchMenuItem, BranchMenuLabelMode } from "../../lib/interfaces";

type Props = {
  menuItems?: BranchMenuItem[];
  labelMode?: BranchMenuLabelMode;
};

const resolveLabel = (translated: string, key: string, fallback: string): string =>
  translated === key ? fallback : translated;

export const BusinessMenuSection = memo(function BusinessMenuSection({
  menuItems,
  labelMode = "menu",
}: Props) {
  const { t } = useTranslation();

  const headingKey = labelMode === "menu" ? "businessMenuTitle" : "businessPricelistTitle";
  const headingFallback = labelMode === "menu" ? "Menu" : "Price list";
  const heading = useMemo(
    () => resolveLabel(t(headingKey), headingKey, headingFallback),
    [headingKey, headingFallback, t]
  );

  const emptyLabel = useMemo(
    () => resolveLabel(t("businessMenuEmpty"), "businessMenuEmpty", "No menu available."),
    [t]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{heading}</Text>

      {!menuItems || menuItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{emptyLabel}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {menuItems.map((item, index) => (
            <View key={item.id} style={[styles.row, index > 0 && styles.rowSpacing]}>
              <View style={styles.nameWrap}>
                <Text style={styles.name}>{resolveLabel(t(item.name), item.name, item.name)}</Text>
                {item.details ? (
                  <Text style={styles.details}>
                    {resolveLabel(t(item.details), item.details, item.details)}
                  </Text>
                ) : null}
              </View>
              {item.price ? (
                <Text style={styles.price} numberOfLines={1}>
                  {item.price}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    lineHeight: 24,
    color: "#000",
    marginBottom: 12,
  },
  list: {
    paddingBottom: 6,
  },
  row: {
    borderWidth: 0.5,
    borderColor: "#E4E4E7",
    borderRadius: 20,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowSpacing: {
    marginTop: 10,
  },
  nameWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    lineHeight: 19,
    color: "#111827",
  },
  details: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(17, 24, 39, 0.7)",
  },
  price: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 18,
    color: "#111827",
  },
  emptyCard: {
    borderWidth: 0.5,
    borderColor: "#E4E4E7",
    borderRadius: 20,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    color: "#71717A",
  },
});
