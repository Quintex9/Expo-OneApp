import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type {
  BranchCardProps,
  DiscoverAddressSuggestion,
  DiscoverFavoritePlace,
  DiscoverSearchSheetProps,
} from "../../lib/interfaces";
import { useFavorites } from "../../lib/FavoritesContext";
import {
  DISCOVER_TOP_CONTROL_GAP,
  DISCOVER_TOP_CONTROL_HEIGHT,
  DISCOVER_TOP_HORIZONTAL_PADDING,
  DISCOVER_TOP_OFFSET,
} from "../../lib/constants/discoverUi";

const SEARCH_TOP_ROW_Y = DISCOVER_TOP_OFFSET;
const RESULT_ROW_FALLBACK_HEIGHT = 108;
const CARD_SHADOW =
  Platform.OS === "web"
    ? { boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.07)" }
    : {
        shadowColor: "#000",
        shadowOpacity: 0.07,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      };

/**
 * DiscoverSearchSheet: full-screen search overlay pre Discover mapu aj list.
 *
 * Preco: drzi search flow, favorite miesta, branch vysledky a adresy v jednej vrstve
 * a vizualne kopiruje aktualny mobile search navrh.
 */
function DiscoverSearchSheet({
  onSheetChange,
  onClose,
  sheetIndex,
  text,
  setText,
  filtered,
  addressSuggestions = [],
  onSelectBranch,
  onSelectAddressSuggestion,
  favoritePlaces,
  onSelectFavorite,
  autoFocus = false,
  showFavorites = true,
  resultTabs,
  activeResultTabKey,
  onChangeResultTab,
  t,
}: DiscoverSearchSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const inputRef = useRef<TextInput>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [listHeight, setListHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [rowHeight, setRowHeight] = useState(0);
  const [showAllResults, setShowAllResults] = useState(false);

  const layoutScale = useMemo(() => Math.min(1, Math.max(0.84, windowWidth / 393)), [windowWidth]);
  const rowImageSize = useMemo(() => Math.round(56 * layoutScale), [layoutScale]);
  const rowImageRadius = useMemo(() => Math.round(8 * layoutScale), [layoutScale]);
  const rowGap = useMemo(() => Math.round(12 * layoutScale), [layoutScale]);
  const rowPaddingH = useMemo(() => Math.round(14 * layoutScale), [layoutScale]);
  const rowPaddingV = useMemo(() => Math.round(12 * layoutScale), [layoutScale]);
  const rowTitleSize = useMemo(() => Math.max(15, Math.round(16 * layoutScale)), [layoutScale]);
  const rowMetaSize = useMemo(() => Math.max(11, Math.round(12 * layoutScale)), [layoutScale]);
  const rowOfferTextSize = useMemo(() => Math.max(10, Math.round(11 * layoutScale)), [layoutScale]);
  const rowMoreSize = useMemo(() => Math.max(13, Math.round(14 * layoutScale)), [layoutScale]);
  const resolvedRowImageSize = useMemo(() => {
    if (rowHeight <= 0) {
      return rowImageSize;
    }

    return Math.max(rowImageSize, rowHeight - rowPaddingV * 2);
  }, [rowHeight, rowImageSize, rowPaddingV]);

  const trimmedText = text.trim();
  const hasActiveQuery = trimmedText.length > 0;
  const hasAddressSuggestions = hasActiveQuery && addressSuggestions.length > 0;
  const hasResultTabs = !showFavorites && Array.isArray(resultTabs) && resultTabs.length > 0;

  useEffect(() => {
    if (sheetIndex === -1 || !autoFocus) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [sheetIndex, autoFocus]);

  useEffect(() => {
    setShowAllResults(false);
  }, [filtered.length, sheetIndex, trimmedText]);

  const keyExtractor = useCallback((item: BranchCardProps) => item.id ?? item.title, []);

  const visibleResultsLimit = useMemo(() => {
    const fallbackLimit = Math.max(1, Math.floor((windowHeight * 0.62) / RESULT_ROW_FALLBACK_HEIGHT));
    const availableHeight = listHeight > 0 ? Math.max(0, listHeight - headerHeight) : 0;
    const itemHeight = rowHeight > 0 ? rowHeight : RESULT_ROW_FALLBACK_HEIGHT;

    if (showAllResults) {
      return filtered.length;
    }

    if (availableHeight <= 0) {
      return Math.min(filtered.length, fallbackLimit);
    }

    return Math.max(1, Math.min(filtered.length, Math.floor(availableHeight / itemHeight)));
  }, [filtered.length, headerHeight, listHeight, rowHeight, showAllResults, windowHeight]);

  const displayedResults = useMemo(
    () => filtered.slice(0, visibleResultsLimit),
    [filtered, visibleResultsLimit]
  );

  const shouldShowFavoritesSection = showFavorites && !hasActiveQuery;
  const shouldShowRecentSection = !hasActiveQuery && displayedResults.length > 0;
  const shouldShowBranchesSection = hasActiveQuery && displayedResults.length > 0;
  const shouldShowInlineAddresses = hasAddressSuggestions && displayedResults.length === 0;
  const shouldShowFooterAddresses = hasAddressSuggestions && displayedResults.length > 0;
  const shouldShowShowMore = !hasActiveQuery && !showAllResults && filtered.length > displayedResults.length;

  const handleListLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    if (!Number.isFinite(nextHeight) || nextHeight <= 0 || nextHeight === listHeight) {
      return;
    }
    setListHeight(nextHeight);
  }, [listHeight]);

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    if (!Number.isFinite(nextHeight) || nextHeight < 0 || nextHeight === headerHeight) {
      return;
    }
    setHeaderHeight(nextHeight);
  }, [headerHeight]);

  const handleRowLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    if (!Number.isFinite(nextHeight) || nextHeight <= 0 || nextHeight === rowHeight) {
      return;
    }
    setRowHeight(nextHeight);
  }, [rowHeight]);

  const handleClose = useCallback(() => {
    onSheetChange?.(-1);
    onClose();
  }, [onClose, onSheetChange]);

  const handleToggleFavorite = useCallback((branch: BranchCardProps) => {
    toggleFavorite(branch);
  }, [toggleFavorite]);

  const renderMetaDivider = useCallback(() => <View style={localStyles.resultMetaDivider} />, []);

  const renderItem = useCallback(
    ({ item, index }: { item: BranchCardProps; index: number }) => {
      const ratingText = Number.isFinite(item.rating) ? item.rating.toFixed(1) : "-";
      const resolvedOffers =
        Array.isArray(item.offers) && item.offers.length > 0
          ? item.offers
          : item.discount
            ? [item.discount]
            : [];
      const resolvedMoreCount =
        typeof item.moreCount === "number"
          ? item.moreCount
          : Math.max(0, resolvedOffers.length - (resolvedOffers.length > 0 ? 1 : 0));
      const cardIsFavorite = isFavorite(item.id);
      const isLast = index === displayedResults.length - 1;

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            localStyles.resultCard,
            !isLast && localStyles.resultCardSpaced,
            { paddingHorizontal: rowPaddingH, paddingVertical: rowPaddingV },
          ]}
          onPress={() => onSelectBranch(item)}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          onLayout={index === 0 ? handleRowLayout : undefined}
        >
          <Image
            source={item.image}
            style={[
              localStyles.resultImage,
              {
                width: resolvedRowImageSize,
                height: resolvedRowImageSize,
                borderRadius: rowImageRadius,
                marginRight: rowGap,
              },
            ]}
            resizeMode="cover"
          />

          <View style={localStyles.resultContent}>
            <View style={localStyles.resultTopRow}>
              <Text
                style={[
                  localStyles.resultTitle,
                  { fontSize: rowTitleSize, lineHeight: Math.round(rowTitleSize * 1.2) },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>

              <TouchableOpacity
                activeOpacity={0.75}
                style={localStyles.favoriteButton}
                onPress={(event) => {
                  event.stopPropagation();
                  handleToggleFavorite(item);
                }}
                accessibilityRole="button"
                accessibilityLabel={t("discoverMapQuickFavoriteA11y", { place: item.title })}
              >
                <Ionicons
                  name={cardIsFavorite ? "heart" : "heart-outline"}
                  size={22}
                  color={cardIsFavorite ? "#FF3B30" : "#8A8A8E"}
                />
              </TouchableOpacity>
            </View>

            <View style={localStyles.resultMetaRow}>
              <View style={localStyles.resultMetaItem}>
                <Ionicons name="star" size={13} color="#FFD000" />
                <Text
                  style={[
                    localStyles.resultMetaText,
                    { fontSize: rowMetaSize, lineHeight: Math.round(rowMetaSize * 1.35) },
                  ]}
                >
                  {ratingText}
                </Text>
              </View>

              {renderMetaDivider()}

              <View style={localStyles.resultMetaItem}>
                <Ionicons name="location-outline" size={13} color="#8A8A8E" />
                <Text
                  style={[
                    localStyles.resultMetaText,
                    { fontSize: rowMetaSize, lineHeight: Math.round(rowMetaSize * 1.35) },
                  ]}
                >
                  {item.distance}
                </Text>
              </View>

              {renderMetaDivider()}

              <View style={localStyles.resultMetaItem}>
                <Ionicons name="time-outline" size={13} color="#8A8A8E" />
                <Text
                  style={[
                    localStyles.resultMetaText,
                    { fontSize: rowMetaSize, lineHeight: Math.round(rowMetaSize * 1.35) },
                  ]}
                >
                  {item.hours}
                </Text>
              </View>
            </View>

            {resolvedOffers.length > 0 ? (
              <View style={localStyles.resultOfferRow}>
                {resolvedOffers[0] ? (
                  <View style={localStyles.resultOfferBadge}>
                    <Text
                      style={[
                        localStyles.resultOfferText,
                        {
                          fontSize: rowOfferTextSize,
                          lineHeight: Math.round(rowOfferTextSize * 1.25),
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {t(resolvedOffers[0])}
                    </Text>
                  </View>
                ) : null}

                {resolvedMoreCount > 0 ? (
                  <Text
                    style={[
                      localStyles.resultMoreText,
                      { fontSize: rowMoreSize, lineHeight: Math.round(rowMoreSize * 1.2) },
                    ]}
                    numberOfLines={1}
                  >
                    + {resolvedMoreCount}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [
      displayedResults.length,
      handleRowLayout,
      handleToggleFavorite,
      isFavorite,
      onSelectBranch,
      renderMetaDivider,
      rowGap,
      resolvedRowImageSize,
      rowImageRadius,
      rowMetaSize,
      rowMoreSize,
      rowOfferTextSize,
      rowPaddingH,
      rowPaddingV,
      rowTitleSize,
      t,
    ]
  );

  const renderFavoriteChip = useCallback(
    (place: DiscoverFavoritePlace) => (
      <TouchableOpacity
        key={place.id}
        style={localStyles.favoriteChip}
        activeOpacity={0.88}
        onPress={() => onSelectFavorite(place)}
        accessibilityRole="button"
        accessibilityLabel={t("discoverSearchFavoriteA11y", { place: place.label })}
      >
        <Ionicons name="location-outline" size={20} color="#111111" />
        <Text style={localStyles.favoriteChipText} numberOfLines={1}>
          {place.label}
        </Text>
      </TouchableOpacity>
    ),
    [onSelectFavorite, t]
  );

  const renderAddressSuggestion = useCallback(
    (item: DiscoverAddressSuggestion) => {
      const subtitle =
        typeof item.branchCount === "number" && item.branchCount > 1
          ? t("discoverSearchAddressBusinessesCount", { value: item.branchCount })
          : item.subtitle;

      return (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.9}
          style={localStyles.addressCard}
          onPress={() => onSelectAddressSuggestion?.(item)}
          accessibilityRole="button"
          accessibilityLabel={t("discoverSearchAddressShowA11y", { address: item.label })}
        >
          <View style={localStyles.addressIconWrap}>
            <Ionicons name="location-outline" size={28} color="#111111" />
          </View>

          <View style={localStyles.addressTextWrap}>
            <Text style={localStyles.addressTitle} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={localStyles.addressSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={28} color="#111111" />
        </TouchableOpacity>
      );
    },
    [onSelectAddressSuggestion, t]
  );

  const resultTabsRow = useMemo(() => {
    if (!hasResultTabs) {
      return null;
    }

    return (
      <View style={localStyles.resultTabsRow}>
        {resultTabs.map((tab) => {
          const isActive = tab.key === activeResultTabKey;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                localStyles.resultTabButton,
                isActive && localStyles.resultTabButtonActive,
              ]}
              activeOpacity={0.85}
              onPress={() => onChangeResultTab?.(tab.key)}
            >
              <Text style={[localStyles.resultTabText, isActive && localStyles.resultTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [activeResultTabKey, hasResultTabs, onChangeResultTab, resultTabs]);

  const listHeader = useMemo(() => {
    if (
      !shouldShowFavoritesSection &&
      !shouldShowRecentSection &&
      !shouldShowBranchesSection &&
      !shouldShowInlineAddresses &&
      !hasResultTabs
    ) {
      return null;
    }

    return (
      <View style={localStyles.listHeaderWrap} onLayout={handleHeaderLayout}>
        {shouldShowFavoritesSection ? (
          <View style={localStyles.sectionBlock}>
            <Text style={localStyles.sectionTitle}>{t("discoverSearchFavoritesTitle")}</Text>
            {favoritePlaces.length > 0 ? (
              <View style={localStyles.favoritesWrap}>
                {favoritePlaces.map((place) => renderFavoriteChip(place))}
              </View>
            ) : null}
          </View>
        ) : null}

        {resultTabsRow}

        {shouldShowRecentSection ? (
          <Text style={localStyles.sectionTitle}>{t("discoverSearchRecentTitle")}</Text>
        ) : null}

        {shouldShowBranchesSection ? (
          <Text style={localStyles.sectionTitle}>{t("discoverSearchBranchesTitle")}</Text>
        ) : null}

        {shouldShowInlineAddresses ? (
          <View style={localStyles.sectionBlock}>
            <Text style={localStyles.sectionTitle}>{t("discoverSearchAddressesTitle")}</Text>
            <View style={localStyles.addressCardsWrap}>
              {addressSuggestions.map((item) => renderAddressSuggestion(item))}
            </View>
          </View>
        ) : null}
      </View>
    );
  }, [
    addressSuggestions,
    favoritePlaces,
    handleHeaderLayout,
    hasResultTabs,
    renderAddressSuggestion,
    renderFavoriteChip,
    resultTabsRow,
    shouldShowBranchesSection,
    shouldShowFavoritesSection,
    shouldShowInlineAddresses,
    shouldShowRecentSection,
    t,
  ]);

  const listFooter = useMemo(() => {
    if (!shouldShowFooterAddresses && !shouldShowShowMore) {
      return <View style={localStyles.listFooterSpacer} />;
    }

    return (
      <View style={localStyles.listFooterWrap}>
        {shouldShowFooterAddresses ? (
          <View style={[localStyles.sectionBlock, localStyles.footerAddressesSection]}>
            <Text style={localStyles.sectionTitle}>{t("discoverSearchAddressesTitle")}</Text>
            <View style={localStyles.addressCardsWrap}>
              {addressSuggestions.map((item) => renderAddressSuggestion(item))}
            </View>
          </View>
        ) : null}

        {shouldShowShowMore ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={localStyles.showMoreButton}
            onPress={() => setShowAllResults(true)}
          >
            <Text style={localStyles.showMoreText}>{t("showMore")}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={localStyles.listFooterSpacer} />
      </View>
    );
  }, [
    addressSuggestions,
    renderAddressSuggestion,
    shouldShowFooterAddresses,
    shouldShowShowMore,
    t,
  ]);

  const listEmptyComponent = useMemo(() => {
    if (!hasActiveQuery || hasAddressSuggestions) {
      return null;
    }

    return (
      <View style={localStyles.emptyResults}>
        <Text style={localStyles.emptyResultsText}>{t("noPlacesFound")}</Text>
      </View>
    );
  }, [hasActiveQuery, hasAddressSuggestions, t]);

  if (sheetIndex === -1) {
    return null;
  }

  return (
    <View style={[localStyles.container, { paddingTop: insets.top + SEARCH_TOP_ROW_Y }]}>
      <View style={localStyles.searchTopRow}>
        <View style={localStyles.searchInputWrapper}>
          <Ionicons name="search-outline" size={26} color="#000000" />
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder={t("searchbranches")}
            style={localStyles.searchInput}
            placeholderTextColor="#71717A"
            accessibilityLabel={t("discoverSearchInputA11y")}
            autoFocus={autoFocus}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />

          {text.length > 0 ? (
            <TouchableOpacity
              onPress={() => setText("")}
              style={localStyles.searchClearButton}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t("homeSearchClearA11y")}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={localStyles.mapButton}
          onPress={handleClose}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t("discoverSearchBackA11y")}
        >
          <Ionicons name="map-outline" size={24} color="#111111" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedResults}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={listEmptyComponent}
        contentContainerStyle={localStyles.listContent}
        onLayout={handleListLayout}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={false}
      />
    </View>
  );
}

export default memo(DiscoverSearchSheet);

const localStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6000,
    elevation: 6000,
    backgroundColor: "#FAFAFA",
  },
  searchTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DISCOVER_TOP_CONTROL_GAP,
    paddingHorizontal: DISCOVER_TOP_HORIZONTAL_PADDING,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flex: 1,
    minWidth: 120,
    height: DISCOVER_TOP_CONTROL_HEIGHT,
    borderRadius: DISCOVER_TOP_CONTROL_HEIGHT / 2,
    paddingLeft: 16,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    ...CARD_SHADOW,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    color: "#111111",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    includeFontPadding: false,
  },
  searchClearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  mapButton: {
    width: DISCOVER_TOP_CONTROL_HEIGHT,
    height: DISCOVER_TOP_CONTROL_HEIGHT,
    borderRadius: DISCOVER_TOP_CONTROL_HEIGHT / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  listContent: {
    paddingHorizontal: DISCOVER_TOP_HORIZONTAL_PADDING,
    paddingBottom: 24,
  },
  listHeaderWrap: {
    marginBottom: 4,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  footerAddressesSection: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 14,
  },
  favoritesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  favoriteChip: {
    minHeight: 44,
    maxWidth: "100%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D4D4D8",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  favoriteChipText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    color: "#111111",
    flexShrink: 1,
  },
  resultTabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  resultTabButton: {
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#D4D4D8",
    backgroundColor: "#FFFFFF",
  },
  resultTabButtonActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  resultTabText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#52525B",
  },
  resultTabTextActive: {
    color: "#FFFFFF",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    width: "100%",
    ...CARD_SHADOW,
  },
  resultCardSpaced: {
    marginBottom: 12,
  },
  resultImage: {
    backgroundColor: "#E4E4E7",
  },
  resultContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 2,
  },
  resultTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  resultTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "700",
    color: "#000000",
  },
  favoriteButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -1,
    marginRight: -2,
  },
  resultMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 6,
    rowGap: 2,
    marginTop: 4,
  },
  resultMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
  },
  resultMetaDivider: {
    width: 1,
    height: 13,
    backgroundColor: "#A1A1AA",
    opacity: 0.7,
  },
  resultMetaText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#7C7C7C",
    flexShrink: 1,
  },
  resultOfferRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    minWidth: 0,
  },
  resultOfferBadge: {
    borderRadius: 999,
    backgroundColor: "#EB8100",
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: "72%",
    minWidth: 0,
    flexShrink: 1,
  },
  resultOfferText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    flexShrink: 1,
  },
  resultMoreText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    color: "#111111",
    flexShrink: 1,
    minWidth: 0,
  },
  addressCardsWrap: {
    gap: 14,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 18,
    ...CARD_SHADOW,
  },
  addressIconWrap: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  addressTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  addressTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    color: "#111111",
  },
  addressSubtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
    color: "#8A8A8E",
  },
  showMoreButton: {
    alignSelf: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  showMoreText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "#7C7C7C",
    textAlign: "center",
  },
  listFooterWrap: {
    paddingTop: 8,
  },
  listFooterSpacer: {
    height: 24,
  },
  emptyResults: {
    paddingVertical: 28,
    alignItems: "center",
  },
  emptyResultsText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#71717A",
  },
});
