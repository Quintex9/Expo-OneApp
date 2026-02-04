import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { SvgUri } from "react-native-svg";

// Barcode image from images folder
const BarcodeImage = require("../images/barcode.png");

// Brandfetch Logo URLs
const BRANDFETCH_CLIENT = "1id2wnRBnylM5mUQzYz";
const LOGO_URLS: Record<string, string> = {
  TESCO: `https://cdn.brandfetch.io/domain/tesco.com/w/800/h/200/logo?c=${BRANDFETCH_CLIENT}`,
  BILLA: `https://cdn.brandfetch.io/domain/billa.at/w/800/h/239/logo?c=${BRANDFETCH_CLIENT}`,
  dm: `https://cdn.brandfetch.io/domain/dm.de/w/800/h/300/logo?c=${BRANDFETCH_CLIENT}`,
  "101 DROGÉRIA": "https://101drogerie.sk/themes/nerd/assets/images/logo_new.svg",
  "teta drogerie": "https://www.tetadrogerie.cz/img/logo.svg",
  Kaufland: `https://cdn.brandfetch.io/domain/kaufland.de/w/800/h/300/logo?c=${BRANDFETCH_CLIENT}`,
};

const LOGO_SCALES: Record<string, number> = {
  "101 DROGÉRIA": 1.15,
  "teta drogerie": 1.15,
};

// Card types - some use barcode, some use QR
const CARD_TYPES: Record<string, "barcode" | "qr"> = {
  TESCO: "barcode",
  BILLA: "barcode",
  dm: "qr",
  "101 DROGÉRIA": "barcode",
  "teta drogerie": "barcode",
  Kaufland: "barcode",
};

interface RouteParams {
  cardName: string;
  cardNumber: string;
}

export default function LoyaltyCardDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const { cardName = "TESCO", cardNumber = "123 456 7890" } = (route.params as RouteParams) || {};
  
  const logoUrl = LOGO_URLS[cardName] || LOGO_URLS.TESCO;
  const isLogoSvg = logoUrl.includes(".svg");
  const logoScale = LOGO_SCALES[cardName] || 1;
  const codeType = CARD_TYPES[cardName] || "barcode";
  
  // Remove spaces from card number for barcode/QR
  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  
  const cardWidth = Math.min(362, screenWidth - 32);
  const codeWidth = cardWidth - 50;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={25} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{cardName}</Text>

        <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Card */}
      <View style={[styles.card, { width: cardWidth, height: codeType === "barcode" ? 240 : 380 }]}>
        {/* Logo */}
        {isLogoSvg ? (
          <SvgUri uri={logoUrl} width={76 * logoScale} height={50 * logoScale} />
        ) : (
          <Image
            source={{ uri: logoUrl }}
            style={[styles.logo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
        )}

        {/* Barcode or QR Code */}
        <View style={styles.codeContainer}>
          {codeType === "barcode" ? (
            <Image
              source={BarcodeImage}
              style={{ width: 430, height: 160 }}
              resizeMode="stretch"
            />
          ) : (
            <>
              <QRCode
                value={cleanCardNumber}
                size={240}
                backgroundColor="white"
                color="black"
              />
              {/* Card Number - only for QR codes */}
              <Text style={styles.cardNumber}>{cardNumber}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 11,
    height: 48,
    marginBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },
  menuButton: {
    width: 48,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 3px 10px rgba(0, 0, 0, 0.1)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 3,
        }),
  },
  card: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#E4E4E7",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 25,
    paddingHorizontal: 25,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 3px 10px rgba(0, 0, 0, 0.1)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 3,
        }),
  },
  logo: {
    width: 76,
    height: 50,
    marginBottom: 16,
  },
  codeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#767676",
    textAlign: "center",
    marginTop: 16,
  },
});
