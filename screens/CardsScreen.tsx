import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SvgUri } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../lib/AuthContext";
import { extractNameFromEmail } from "../lib/utils/userUtils";

// Brandfetch Logo URLs (PNG format via domain API)
const BRANDFETCH_CLIENT = "1id2wnRBnylM5mUQzYz";
const LOGO_URLS = {
  tesco: `https://cdn.brandfetch.io/domain/tesco.com/w/800/h/200/logo?c=${BRANDFETCH_CLIENT}`,
  billa: `https://cdn.brandfetch.io/domain/billa.at/w/800/h/239/logo?c=${BRANDFETCH_CLIENT}`,
  dm: `https://cdn.brandfetch.io/domain/dm.de/w/800/h/300/logo?c=${BRANDFETCH_CLIENT}`,
  drogeria: "https://101drogerie.sk/themes/nerd/assets/images/logo_new.svg",
  teta: "https://www.tetadrogerie.cz/img/logo.svg",
  kaufland: `https://cdn.brandfetch.io/domain/kaufland.de/w/800/h/300/logo?c=${BRANDFETCH_CLIENT}`,
};

// Dummy loyalty card data with card numbers
const LOYALTY_CARDS = [
  { id: "1", name: "TESCO", logoUrl: LOGO_URLS.tesco, cardNumber: "123 456 7890", hasCard: true },
  { id: "2", name: "BILLA", logoUrl: LOGO_URLS.billa, cardNumber: "987 654 3210", hasCard: true },
  { id: "3", name: "dm", logoUrl: LOGO_URLS.dm, cardNumber: "456 789 0123", hasCard: true },
  { id: "4", name: "101 DROGÉRIA", logoUrl: LOGO_URLS.drogeria, cardNumber: "111 222 3333", hasCard: true, logoScale: 1.15 },
  { id: "5", name: "teta drogerie", logoUrl: LOGO_URLS.teta, cardNumber: "444 555 6666", hasCard: true, logoScale: 1.15 },
  { id: "6", name: "Kaufland", logoUrl: LOGO_URLS.kaufland, cardNumber: "777 888 9999", hasCard: true },
];

const NEARBY_STORES = [
  { id: "n1", name: "TESCO", logoUrl: LOGO_URLS.tesco, cardNumber: "123 456 7890", distance: "0.3 km" },
  { id: "n2", name: "dm", logoUrl: LOGO_URLS.dm, cardNumber: "456 789 0123", distance: "0.5 km" },
];

interface LoyaltyCardProps {
  item: typeof LOYALTY_CARDS[0];
  cardWidth: number;
  cardHeight: number;
  onPress?: () => void;
}

const LoyaltyCard = ({ item, cardWidth, cardHeight, onPress }: LoyaltyCardProps) => {
  if (!item.hasCard) {
    return (
      <View style={[styles.loyaltyCard, styles.loyaltyCardEmpty, { width: cardWidth, height: cardHeight }]}>
        {/* Empty card placeholder */}
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.loyaltyCard, { width: cardWidth, height: cardHeight }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {item.logoUrl && (item.logoUrl.includes(".svg") ? (
        <SvgUri
          uri={item.logoUrl}
          width={cardWidth * 0.75 * (item.logoScale || 1)}
          height={cardHeight * 0.5 * (item.logoScale || 1)}
        />
      ) : (
        <Image
          source={{ uri: item.logoUrl }}
          style={{ 
            width: cardWidth * 0.75 * (item.logoScale || 1), 
            height: cardHeight * 0.5 * (item.logoScale || 1),
          }}
          resizeMode="contain"
        />
      ))}
    </TouchableOpacity>
  );
};

interface NearbyCardProps {
  item: typeof NEARBY_STORES[0];
  cardWidth: number;
  onPress?: () => void;
}

const NearbyCard = ({ item, cardWidth, onPress }: NearbyCardProps) => {
  return (
    <TouchableOpacity 
      style={[styles.nearbyCard, { width: cardWidth }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {item.logoUrl && (item.logoUrl.includes(".svg") ? (
        <SvgUri
          uri={item.logoUrl}
          width={cardWidth * 0.6}
          height={50}
        />
      ) : (
        <Image
          source={{ uri: item.logoUrl }}
          style={{ 
            width: cardWidth * 0.6, 
            height: 50,
          }}
          resizeMode="contain"
        />
      ))}
    </TouchableOpacity>
  );
};

export default function CardsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const userName = extractNameFromEmail(user?.email);
  const firstName = userName?.firstName || "Martin";
  const lastName = userName?.lastName || "Novák";
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  const userId = user?.id?.substring(0, 6) || "254923";

  // Calculate card dimensions
  const sidePadding = 16;
  const cardGap = 10;
  const availableWidth = screenWidth - sidePadding * 2;
  const loyaltyCardWidth = useMemo(
    () => Math.floor((availableWidth - cardGap * 2) / 3),
    [availableWidth, cardGap]
  );
  const loyaltyCardHeight = useMemo(() => Math.floor(loyaltyCardWidth * 0.632), [loyaltyCardWidth]);
  
  const nearbyCardWidth = useMemo(
    () => Math.floor((availableWidth - 14) / 2),
    [availableWidth]
  );

  const filteredLoyaltyCards = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return LOYALTY_CARDS;

    const normalizedDigits = normalizedQuery.replace(/\s/g, "");
    return LOYALTY_CARDS.filter((card) => {
      if (card.name.toLowerCase().includes(normalizedQuery)) return true;
      return card.cardNumber.replace(/\s/g, "").includes(normalizedDigits);
    });
  }, [searchQuery]);

  const filteredNearbyStores = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return NEARBY_STORES;

    return NEARBY_STORES.filter((store) =>
      store.name.toLowerCase().includes(normalizedQuery)
    );
  }, [searchQuery]);

  const handleUserCardPress = useCallback(() => {
    navigation.navigate("QRModal");
  }, [navigation]);

  const handleShowAll = useCallback(() => {
    // Navigate to show all cards/stores
  }, []);

  const handleAddCard = useCallback(() => {
    navigation.navigate("CardsAdd");
  }, [navigation]);

  const handleCardPress = useCallback((cardName: string, cardNumber: string) => {
    navigation.navigate("LoyaltyCardDetail", { cardName, cardNumber });
  }, [navigation]);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Row - Search & Add Button */}
      <View style={styles.topRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#000000" />
          <TextInput
            style={styles.searchInput}
            placeholder={t("search")}
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={handleAddCard}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* User Card */}
      <LinearGradient
        colors={["#EB8100", "#FFF5E8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.userCard}
      >
        <View style={styles.userCardContent}>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userId}>{userId}</Text>
        </View>
        <TouchableOpacity style={styles.qrButton} activeOpacity={0.7} onPress={handleUserCardPress}>
          <Ionicons name="qr-code" size={24} color="#000000" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Nearest To You Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("nearestToYou")}</Text>
          <TouchableOpacity onPress={handleShowAll} activeOpacity={0.7}>
            <Text style={styles.showAll}>{t("showAll")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.nearbyRow}>
          {filteredNearbyStores.map((store) => (
            <NearbyCard 
              key={store.id} 
              item={store} 
              cardWidth={nearbyCardWidth}
              onPress={() => handleCardPress(store.name, store.cardNumber)}
            />
          ))}
        </View>
      </View>

      {/* Your Cards Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("yourCards")}</Text>
          <TouchableOpacity onPress={handleShowAll} activeOpacity={0.7}>
            <Text style={styles.showAll}>{t("showAll")}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.cardsGrid}>
          {filteredLoyaltyCards.map((card) => (
            <LoyaltyCard 
              key={card.id} 
              item={card} 
              cardWidth={loyaltyCardWidth} 
              cardHeight={loyaltyCardHeight}
              onPress={card.hasCard && card.name && card.cardNumber 
                ? () => handleCardPress(card.name!, card.cardNumber!) 
                : undefined
              }
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#EB8100",
    alignItems: "center",
    justifyContent: "center",
  },
  userCard: {
    height: 179,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 0.5,
    borderColor: "#E4E4E7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
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
  userCardContent: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  qrButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  showAll: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C7C7C",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  loyaltyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#E4E4E7",
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
  loyaltyCardEmpty: {
    backgroundColor: "#FFFFFF",
  },
  nearbyRow: {
    flexDirection: "row",
    gap: 14,
  },
  nearbyCard: {
    height: 109,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#E4E4E7",
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
});
