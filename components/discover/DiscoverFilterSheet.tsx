import React from "react";
import { Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { styles } from "./discoverStyles";
import type { DiscoverFilterSheetProps } from "../../lib/interfaces";

export default function DiscoverFilterSheet({
  filterRef,
  snapPoints,
  onSheetChange,
  insetsBottom,
  filter,
  setFilter,
  rating,
  setRating,
  filterOptions,
  filterIcons: _filterIcons,
  subcategories,
  sub,
  toggle,
  count,
  setAppliedFilters,
  setAppliedRatings,
  setSub,
  subcategoryChipWidth: _subcategoryChipWidth,
  t,
}: DiscoverFilterSheetProps) {
  const ratingOptions = ["4.7", "4.5", "4.0", "3.5", "3.0"];
  const categoryEmojis: Record<string, string> = {
    Fitness: "🏋️‍♂️",
    Relax: "🧖‍♀️",
    Beauty: "💄",
    Gastro: "🍽️",
  };
  const subcategoryEmojis: Record<string, string> = {
    Vegan: "🌱",
    Coffee: "☕️",
    Seafood: "🦐",
    Pizza: "🍕",
    Sushi: "🍣",
    "Fast Food": "🍟",
    Asian: "🥢",
    Beer: "🍺",
  };

  return (
    <BottomSheet
      ref={filterRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onChange={onSheetChange}
      backgroundStyle={styles.filterSheetBackground}
      handleStyle={styles.filterSheetHandle}
      handleIndicatorStyle={styles.filterSheetHandleIndicator}
    >
      <View style={styles.filterDrawerWrapper}>
        <View style={styles.filterDrawerPanel}>
          <View style={styles.filterDrawerHandle}>
            <View style={styles.filterDrawerHandleLine} />
          </View>

          <BottomSheetScrollView
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.filterHeader}>
              <Text style={styles.filterHeaderTitle}>{t("filters")}</Text>
              <View style={styles.filterHeaderActions}>
                <TouchableOpacity
                  onPress={() => {
                    setAppliedFilters(new Set());
                    setSub(new Set());
                    setRating(new Set());
                    setAppliedRatings(new Set());
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.filterHeaderReset}>{t("reset")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterCloseButton}
                  onPress={() => filterRef.current?.close()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.filterCloseText}>X</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t("categories")}</Text>
              <View style={styles.filterChips}>
                {filterOptions.map((option) => {
                  const active = filter === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setFilter(option)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.filterChipEmoji}>
                        {categoryEmojis[option] ?? "🍽️"}
                      </Text>
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {t(option)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                {t(filter)} {t("subcategories")}
              </Text>
              <View style={styles.filterChips}>
                {subcategories.map((subs) => {
                  const active = sub.has(subs);
                  const emoji = subcategoryEmojis[subs];

                  return (
                    <TouchableOpacity
                      key={subs}
                      onPress={() => toggle(subs)}
                      activeOpacity={0.85}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                    >
                      {emoji ? <Text style={styles.filterChipEmoji}>{emoji}</Text> : null}
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={[styles.filterChipText, active && styles.filterChipTextActive]}
                      >
                        {t(subs)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Rating</Text>
              <View style={styles.filterChips}>
                {ratingOptions.map((value) => {
                  const active = rating.has(value);
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.filterChip,
                        styles.filterRatingChip,
                        active && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setRating(() => (active ? new Set() : new Set([value])))
                      }
                      activeOpacity={0.85}
                    >
                      <Text style={styles.filterChipEmoji}>⭐️</Text>
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </BottomSheetScrollView>

          <View style={[styles.filterApplyRow, { paddingBottom: insetsBottom + 12 }]}>
            <TouchableOpacity
              style={styles.filterApplyButton}
              onPress={() => {
                setAppliedFilters(new Set([filter]));
                setAppliedRatings(new Set(rating));
                filterRef.current?.close();
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.filterApplyText}>Filter ({count})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}
