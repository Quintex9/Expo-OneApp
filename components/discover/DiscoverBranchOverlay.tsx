import React from "react";
import { Image, Text, View, useWindowDimensions } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import BranchCard from "../BranchCard";
import { styles } from "./discoverStyles";
import type { DiscoverBranchOverlayProps } from "../../lib/interfaces";
import { useNavigation } from "@react-navigation/native";

export default function DiscoverBranchOverlay({
  insetsBottom,
  categoriesOpen,
  setCategoriesOpen,
  filterOptions,
  filterIcons,
  appliedFilter,
  setAppliedFilter,
  setFilter,
  branches,
  branchCardWidth,
  t,
}: DiscoverBranchOverlayProps) {
  const { width: screenWidth } = useWindowDimensions();
  const pageWidth = screenWidth;
  const snapOffsets = branches.map((_, index) => index * pageWidth);
  const navigation = useNavigation<any>();
  return (
    <View style={[styles.branchOverlay, { bottom: insetsBottom }]} pointerEvents="box-none">
      <View style={styles.branchOverlayHandle}>
        {categoriesOpen && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {filterOptions.map((option) => {
              const active = appliedFilter === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.categoryIconBtn, active && styles.categoryIconBtnActive]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setFilter(option);
                    setAppliedFilter((prev) => (prev === option ? null : option));
                  }}
                >
                  <Image source={filterIcons[option]} style={styles.categoryIcon} />
                  {active && (
                    <Text style={[styles.categoryLabel, styles.categoryLabelActive]}>{t(option)}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setCategoriesOpen((prev) => !prev)}
          style={[styles.branchOverlayHandleToggle, categoriesOpen && styles.branchOverlayHandleToggleOpen]}
        >
          <Image
            source={require("../../images/button.png")}
            style={[styles.branchOverlayHandleIcon, categoriesOpen && styles.branchOverlayHandleIconOpen]}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        contentContainerStyle={{}}
        snapToOffsets={snapOffsets}
        snapToAlignment="start"
        snapToInterval={pageWidth}
        decelerationRate="fast"
        disableIntervalMomentum
        bounces={false}
      >
        {branches.map((b, index) => {
          
          const { onPress: _onPress, ...branchData } = b;
          return (
            <TouchableOpacity
              key={b.title}
              style={{
                width: pageWidth,
                paddingVertical: 7,
                alignItems: "center",
              }}
            >
              <View style={{ width: branchCardWidth }}>
                <BranchCard
                  {...b}
                  onPress={() => {
                    navigation.navigate("BusinessDetailScreen", { branch: branchData });
                  }}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
