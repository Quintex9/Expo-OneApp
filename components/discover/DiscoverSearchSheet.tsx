/**
 * DiscoverSearchSheet.tsx
 * 
 * Bottom sheet s vyhľadávaním pobočiek.
 * Obsahuje textové pole a virtualizovaný zoznam výsledkov.
 * 
 * OPTIMALIZÁCIE:
 * - BottomSheetFlatList namiesto ScrollView - virtualizácia (renderuje len viditeľné položky)
 * - memo() na komponente - zabraňuje zbytočným renderom
 * - useCallback() na renderItem a keyExtractor - stabilné referencie
 */

import React, { memo, useCallback } from "react";
import { FlatList, Image, View, StyleSheet, Text } from "react-native";
import { TextInput, TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BranchCard from "../BranchCard";
import { styles } from "./discoverStyles";
import type { DiscoverSearchSheetProps, BranchCardProps } from "../../lib/interfaces";

function DiscoverSearchSheet({
  onSheetChange,     // callback pri zmene pozície sheetu
  sheetIndex,        // aktuálna pozícia (-1 = zatvorený)
  text,              // text vo vyhľadávacom poli
  setText,           // funkcia na zmenu textu
  filtered,          // prefiltrované pobočky
  t,                 // prekladová funkcia
}: DiscoverSearchSheetProps) {
  const insets = useSafeAreaInsets();
  
  /**
   * Funkcia na extrahovanie kľúča pre FlatList
   * useCallback zabezpečí stabilnú referenciu - FlatList sa nebude zbytočne renderovať
   */
  const keyExtractor = useCallback(
    (item: BranchCardProps) => item.id ?? item.title,
    []
  );

  /**
   * Funkcia na renderovanie položky
   * useCallback zabezpečí stabilnú referenciu
   */
  const renderItem = useCallback(
    ({ item }: { item: BranchCardProps }) => <BranchCard {...item} />,
    []
  );

  if (sheetIndex === -1) {
    return null;
  }

  return (
    <View style={[styles.searchScreen, { paddingTop: insets.top + 8 }]}>

      {/* Header */}
      <View style={styles.searchSheetHeader}>
        <TouchableOpacity style={styles.searchLocationChip} activeOpacity={0.9}>
          <Image source={require("../../images/pin.png")} style={styles.searchLocationIcon} />
          <Text style={styles.searchLocationText}>Your Location</Text>
          <Image source={require("../../images/options.png")} style={styles.searchLocationCaret} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSheetChange(-1)} activeOpacity={0.8}>
          <Text style={styles.searchCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Vyhľadávacie pole */}
      <View style={styles.searchInputWrapper}>
        <Image source={require("../../images/search.png")} style={styles.searchIcon} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("searchbranches")}
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
        />
        {text.length > 0 && (
          <TouchableOpacity
            onPress={() => setText("")}
            style={styles.searchClearButton}
            activeOpacity={0.8}
          >
            <Image source={require("../../images/searchclose.png")} style={styles.searchClearIcon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Virtualizovaný zoznam pobočiek */}
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={listStyles.contentContainer}
        showsVerticalScrollIndicator={false}
        // === OPTIMALIZAČNÉ NASTAVENIA ===
        initialNumToRender={5}       // koľko položiek vyrenderovať na začiatku
        maxToRenderPerBatch={10}     // koľko položiek vyrenderovať naraz pri scrolle
        windowSize={5}               // koľko "obrazoviek" držať v pamäti
        removeClippedSubviews={true} // odstráni položky mimo obrazovky (šetrí pamäť)
      />
    </View>
  );
}

// memo() zabraňuje zbytočným renderom
export default memo(DiscoverSearchSheet);

// Štýly pre FlatList
const listStyles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
