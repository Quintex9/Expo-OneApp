// LoyaltyCardDetailScreen: obrazovka hlavneho flow aplikacie.
// Zodpovednost: renderuje UI, obsluhuje udalosti a lokalny stav obrazovky.
// Vstup/Vystup: pracuje s navigation params, hookmi a volaniami akcii.

import React, { useMemo, useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  useWindowDimensions,
  Linking,
  ScrollView,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import QRCode from "react-native-qrcode-svg";
import Barcode from "@kichiyaki/react-native-barcode-generator";
import { useTranslation } from "react-i18next";
import { TAB_BAR_BASE_HEIGHT, TAB_BAR_MIN_INSET } from "../lib/constants/layout";

const OFFER_IMAGES = {
  TESCO: require("../assets/offers/tesco_offer.jpg"),
  BILLA: require("../assets/offers/billa_offer.jpg"),
  "101 DROGERIA": require("../assets/offers/drogeria101_offer.jpg"),
  "teta drogerie": require("../assets/offers/teta_offer.jpg"),
  Kaufland: require("../assets/offers/kaufland_offer.jpg"),
};

const CARD_TYPES: Record<string, "barcode" | "qr"> = {
  TESCO: "barcode",
  BILLA: "barcode",
  dm: "qr",
  "101 DROGERIA": "barcode",
  "teta drogerie": "barcode",
  Kaufland: "barcode",
};

const CARD_WEBSITES: Record<string, string> = {
  TESCO: "https://www.tesco.com",
  BILLA: "https://www.billa.sk",
  dm: "https://www.dm.sk",
  "101 DROGERIA": "https://101drogerie.sk",
  "teta drogerie": "https://www.tetadrogerie.sk",
  Kaufland: "https://www.kaufland.sk",
};

const CARD_LEAFLET_URLS: Record<string, string> = {
  TESCO: "https://www.tesco.sk/akciove-ponuky/letaky-a-katalogy/",
  BILLA: "https://www.billa.sk/letaky-a-akcie/aktualny-letak",
  dm: "https://www.mojadm.sk/services/zakaznicky-program-servis/vzdy-vyhodne",
  "101 DROGERIA": "https://101drogerie.sk/online-letak",
  "teta drogerie": "https://letak.tetadrogerie.sk/",
  Kaufland: "https://predajne.kaufland.sk/aktualna-ponuka/letak.html",
};

type OfferItem = {
  image: number;
  labelKey: string;
  dateKey: string;
  buttonTextKey: string;
  imageMode?: "cover" | "contain";
  imageBackgroundColor?: string;
};

const CARD_OFFERS: Record<string, OfferItem> = {
  TESCO: {
    image: OFFER_IMAGES.TESCO,
    labelKey: "cardsOfferCurrentOffer",
    dateKey: "cardsOfferDateTesco",
    buttonTextKey: "cardsView",
  },
  BILLA: {
    image: OFFER_IMAGES.BILLA,
    labelKey: "cardsOfferFreshWeek",
    dateKey: "cardsOfferDateBilla",
    buttonTextKey: "cardsView",
  },
  dm: {
    image: require("../assets/offers/dm_logo.webp"),
    labelKey: "cardsOfferCurrentOffer",
    dateKey: "cardsOfferDateDm",
    buttonTextKey: "cardsView",
    imageMode: "contain",
    imageBackgroundColor: "#F8D1CA",
  },
  "101 DROGERIA": {
    image: OFFER_IMAGES["101 DROGERIA"],
    labelKey: "cardsOfferDrogeriaDeal",
    dateKey: "cardsOfferDate101Drogeria",
    buttonTextKey: "cardsView",
  },
  "teta drogerie": {
    image: OFFER_IMAGES["teta drogerie"],
    labelKey: "cardsOfferCareSpecial",
    dateKey: "cardsOfferDateTeta",
    buttonTextKey: "cardsView",
  },
  Kaufland: {
    image: OFFER_IMAGES.Kaufland,
    labelKey: "cardsOfferWeeklyPrices",
    dateKey: "cardsOfferDateKaufland",
    buttonTextKey: "cardsView",
  },
};

const DESIGN_BASE_SCREEN_HEIGHT = 852;

interface RouteParams {
  cardName: string;
  cardNumber: string;
}

const resolveCardKey = (cardName: string): string => {
  if (cardName.toLowerCase().includes("101 dro")) {
    return "101 DROGERIA";
  }
  return cardName;
};

const formatCardTitle = (name: string): string =>
  name
    .split(" ")
    .map((word) => {
      if (word.toLowerCase() === "dm") {
        return "DM";
      }
      if (!word.length) {
        return word;
      }
      return `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");

export default function LoyaltyCardDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const actionsSheetRef = useRef<BottomSheet | null>(null);
  const editCardSheetRef = useRef<BottomSheet | null>(null);
  const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);
  const [isEditCardSheetOpen, setIsEditCardSheetOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const horizontalPadding = 16;

  const { cardName = "TESCO", cardNumber = "123 456 7890" } =
    (route.params as RouteParams) || {};
  const [displayCardNumber, setDisplayCardNumber] = useState(cardNumber);
  const [editCardNumberInput, setEditCardNumberInput] = useState(
    cardNumber.replace(/\s/g, "")
  );

  const resolvedCardName = resolveCardKey(cardName);
  const codeType = CARD_TYPES[resolvedCardName] || "barcode";
  const cleanCardNumber = displayCardNumber.replace(/\s/g, "");
  const websiteUrl = CARD_WEBSITES[resolvedCardName] || CARD_WEBSITES.TESCO;
  const leafletUrl = CARD_LEAFLET_URLS[resolvedCardName] || websiteUrl;
  const offer = CARD_OFFERS[resolvedCardName] || CARD_OFFERS.TESCO;

  const contentWidth = useMemo(
    () => Math.max(0, screenWidth - horizontalPadding * 2),
    [screenWidth, horizontalPadding]
  );
  const cardWidth = contentWidth;
  const sectionWidth = contentWidth;
  const qrSize = useMemo(() => {
    const preferred = cardWidth - 120;
    const maxAllowed = Math.max(120, cardWidth - 40);
    return Math.min(maxAllowed, Math.max(140, Math.min(240, preferred)));
  }, [cardWidth]);
  const qrCardHeight = useMemo(
    () => Math.max(264, Math.round(cardWidth * 0.92)),
    [cardWidth]
  );
  const barcodeCardHeight = useMemo(
    () => Math.max(210, Math.round(cardWidth * 0.705)),
    [cardWidth]
  );
  const barcodeWidth = useMemo(
    () => Math.min(312.48, cardWidth - 48),
    [cardWidth]
  );
  const barcodeHeight = useMemo(
    () => Math.max(88, Math.min(114.88, cardWidth * 0.318)),
    [cardWidth]
  );
  const barcodeFormat = useMemo(
    () =>
      /^\d+$/.test(cleanCardNumber) && cleanCardNumber.length % 2 === 0
        ? "CODE128C"
        : "CODE128",
    [cleanCardNumber]
  );
  const barcodeLineWidth = useMemo(
    () => (barcodeFormat === "CODE128C" ? 4 : 3),
    [barcodeFormat]
  );
  const actionsSheetHeight = useMemo(
    () =>
      Math.max(
        220,
        Math.min(280, (screenHeight * 243.7) / DESIGN_BASE_SCREEN_HEIGHT)
      ),
    [screenHeight]
  );
  const editCardSheetHeight = useMemo(
    () =>
      Math.max(
        240,
        Math.min(320, (screenHeight * 266.43) / DESIGN_BASE_SCREEN_HEIGHT)
      ),
    [screenHeight]
  );
  const actionsSheetSnapPoints = useMemo(
    () => [actionsSheetHeight],
    [actionsSheetHeight]
  );
  const editCardSheetSnapPoints = useMemo(
    () => [editCardSheetHeight],
    [editCardSheetHeight]
  );
  const isQrCard = codeType === "qr";
  const title = useMemo(() => formatCardTitle(cardName), [cardName]);
  const isAnySheetOpen = isActionsSheetOpen || isEditCardSheetOpen;
  const tabBarInset = useMemo(
    () => Math.max(insets.bottom, TAB_BAR_MIN_INSET),
    [insets.bottom]
  );
  const bottomPadding = useMemo(
    () => TAB_BAR_BASE_HEIGHT + tabBarInset + 12,
    [tabBarInset]
  );

  const handleVisitWebsite = useCallback(() => {
    Linking.openURL(websiteUrl).catch(() => {});
  }, [websiteUrl]);

  const handleOpenLeaflet = useCallback(() => {
    Linking.openURL(leafletUrl).catch(() => {});
  }, [leafletUrl]);

  const handleOpenActions = useCallback(() => {
    setIsActionsSheetOpen(true);
    actionsSheetRef.current?.expand();
  }, []);

  const handleCloseActions = useCallback(() => {
    actionsSheetRef.current?.close();
  }, []);
  const handleCloseEditCard = useCallback(() => {
    editCardSheetRef.current?.close();
  }, []);

  const handleEditCard = useCallback(() => {
    actionsSheetRef.current?.close();
    setIsActionsSheetOpen(false);
    setEditCardNumberInput(displayCardNumber.replace(/\s/g, ""));
    setIsEditCardSheetOpen(true);
    editCardSheetRef.current?.expand();
  }, [displayCardNumber]);

  const handleSaveEditCard = useCallback(() => {
    const trimmed = editCardNumberInput.trim();
    if (!trimmed) {
      return;
    }
    setDisplayCardNumber(trimmed);
    editCardSheetRef.current?.close();
  }, [editCardNumberInput]);

  const handleDeleteCard = useCallback(() => {
    handleCloseActions();
    navigation.navigate("CardsList");
  }, [handleCloseActions, navigation]);

  const renderActionsBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.15}
        enableTouchThrough={false}
        pressBehavior="close"
        onPress={handleCloseActions}
      />
    ),
    [handleCloseActions]
  );

  const renderEditCardBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.15}
        enableTouchThrough={false}
        pressBehavior="close"
        onPress={handleCloseEditCard}
      />
    ),
    [handleCloseEditCard]
  );

  const handleActionsSheetChange = useCallback((index: number) => {
    setIsActionsSheetOpen(index >= 0);
  }, []);

  const handleEditCardSheetChange = useCallback((index: number) => {
    setIsEditCardSheetOpen(index >= 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const parentNavigation = navigation.getParent();
      parentNavigation?.setOptions({
        tabBarStyle: { display: isAnySheetOpen ? "none" : "flex" },
      });

      return () => {
        parentNavigation?.setOptions({
          tabBarStyle: { display: "flex" },
        });
      };
    }, [navigation, isAnySheetOpen])
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-back" size={30} color="#000000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{title}</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.75}
            onPress={handleOpenActions}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#000000" />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.codeCard,
            { width: cardWidth, height: isQrCard ? qrCardHeight : barcodeCardHeight },
          ]}
        >
          {isQrCard ? (
            <View style={styles.qrContent}>
              <QRCode
                value={cleanCardNumber}
                size={qrSize}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
              <Text style={[styles.cardNumber, styles.qrCardNumber]}>
                {displayCardNumber}
              </Text>
            </View>
          ) : (
            <>
              <Barcode
                value={cleanCardNumber}
                format={barcodeFormat}
                width={barcodeLineWidth}
                maxWidth={barcodeWidth}
                height={barcodeHeight}
                lineColor="#000000"
                background="#FFFFFF"
                text=""
              />
              <Text style={styles.cardNumber}>{displayCardNumber}</Text>
            </>
          )}
        </View>

        <View
          style={[
            styles.recommendedSection,
            { width: sectionWidth, marginTop: isQrCard ? 26 : 24 },
          ]}
        >
          <Text style={styles.sectionTitle}>{t("cardsRecommended")}</Text>

          <View style={styles.offerCard}>
            <View
              style={[
                styles.offerImageFrame,
                offer.imageBackgroundColor
                  ? { backgroundColor: offer.imageBackgroundColor }
                  : null,
              ]}
            >
              <Image
                source={offer.image}
                style={
                  offer.imageMode === "contain"
                    ? styles.offerImageContain
                    : styles.offerImage
                }
                resizeMode={offer.imageMode || "cover"}
              />
            </View>

            <View style={styles.offerContent}>
              <Text style={styles.offerLabel}>{t(offer.labelKey)}</Text>
              <Text style={styles.offerDate}>{t(offer.dateKey)}</Text>

              <TouchableOpacity
                style={styles.viewButton}
                activeOpacity={0.75}
                onPress={handleOpenLeaflet}
              >
                <Text style={styles.viewButtonText}>{t(offer.buttonTextKey)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.bottomActions, { width: sectionWidth }]}>
          <TouchableOpacity
            style={styles.websiteButton}
            activeOpacity={0.85}
            onPress={handleVisitWebsite}
          >
            <Text style={styles.websiteButtonText}>{t("cardsVisitWebsite")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileButton} activeOpacity={0.85}>
            <Text style={styles.profileButtonText}>{t("cardsOpenProfile")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomSheet
        ref={actionsSheetRef}
        index={-1}
        snapPoints={actionsSheetSnapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        handleComponent={null}
        backdropComponent={renderActionsBackdrop}
        backgroundStyle={styles.actionsSheetBackground}
        onChange={handleActionsSheetChange}
      >
        <View style={[styles.actionsSheet, { height: actionsSheetHeight }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetCompanyName} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.actionsButtons}>
            <TouchableOpacity
              style={styles.editCardButton}
              activeOpacity={0.85}
              onPress={handleEditCard}
            >
              <Text style={styles.sheetButtonText}>{t("cardsEditCard")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteCardButton}
              activeOpacity={0.85}
              onPress={handleDeleteCard}
            >
              <Text style={styles.sheetButtonText}>{t("cardsDeleteCard")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        ref={editCardSheetRef}
        index={-1}
        snapPoints={editCardSheetSnapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        handleComponent={null}
        backdropComponent={renderEditCardBackdrop}
        backgroundStyle={styles.actionsSheetBackground}
        onChange={handleEditCardSheetChange}
      >
        <View style={[styles.editCardSheet, { height: editCardSheetHeight }]}>
          <View style={styles.editCardSheetHandle} />
          <Text style={styles.editCardSheetTitle}>{t("cardsEditSheetTitle")}</Text>
          <View style={styles.editCardControls}>
            <View style={styles.editCardField}>
              <Text style={styles.editCardFieldLabel}>{t("cardsEditCardNumberLabel")}</Text>
              <TextInput
                style={styles.editCardInput}
                value={editCardNumberInput}
                onChangeText={setEditCardNumberInput}
                placeholder={t("cardsCardNumberPlaceholder")}
                placeholderTextColor="#71717A"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={t("cardsEditCardNumberLabel")}
              />
            </View>
            <TouchableOpacity
              style={styles.editCardSaveButton}
              activeOpacity={0.85}
              onPress={handleSaveEditCard}
            >
              <Text style={styles.editCardSaveButtonText}>{t("cardsSave")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 24,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: "#000000",
  },
  codeCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  cardNumber: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "600",
    color: "#767676",
    textAlign: "center",
  },
  qrContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  qrCardNumber: {
    marginTop: 6,
  },
  recommendedSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 10,
  },
  offerCard: {
    height: 117,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  offerImageFrame: {
    width: 83,
    height: 83,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#E4E4E7",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  offerImage: {
    width: "100%",
    height: "100%",
  },
  offerImageContain: {
    width: "72%",
    height: "72%",
  },
  offerContent: {
    flex: 1,
    marginLeft: 14,
  },
  offerLabel: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 2,
  },
  offerDate: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  viewButton: {
    width: "100%",
    maxWidth: 195,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  viewButtonText: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "600",
    color: "#18181B",
  },
  bottomActions: {
    marginTop: "auto",
  },
  websiteButton: {
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
    backgroundColor: "#FFFFFF",
  },
  websiteButtonText: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "700",
    color: "#000000",
  },
  profileButton: {
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  profileButtonText: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionsSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  actionsSheet: {
    paddingHorizontal: 17,
    paddingTop: 8,
  },
  sheetHandle: {
    width: 53,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#B9B9B9",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetCompanyName: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#111111",
    textAlign: "center",
    marginBottom: 30,
  },
  actionsButtons: {
    width: "100%",
    maxWidth: 360,
    height: 88,
    alignSelf: "center",
    padding: 0,
    gap: 8,
  },
  editCardButton: {
    width: "100%",
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteCardButton: {
    width: "100%",
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#D30000",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetButtonText: {
    fontSize: 16,
    lineHeight: 19,
    fontStyle: "normal",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    color: "#FAFAFA",
  },
  editCardSheet: {
    paddingTop: 8,
    alignItems: "center",
    paddingHorizontal: 17,
  },
  editCardSheetHandle: {
    width: 53,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#B9B9B9",
    alignSelf: "center",
    marginBottom: 20,
  },
  editCardSheetTitle: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#000000",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  editCardControls: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    gap: 8,
  },
  editCardField: {
    width: "100%",
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  editCardFieldLabel: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "400",
    fontFamily: "Inter_400Regular",
    color: "#71717A",
  },
  editCardInput: {
    width: "100%",
    height: 24,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "400",
    fontFamily: "Inter_400Regular",
    color: "#000000",
  },
  editCardSaveButton: {
    width: "100%",
    height: 40,
    borderRadius: 999,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  editCardSaveButtonText: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FAFAFA",
  },
});
