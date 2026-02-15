// LanguageScreen: obrazovka profilovej sekcie.
// Zodpovednost: renderuje UI, obsluhuje udalosti a lokalny stav obrazovky.
// Vstup/Vystup: pracuje s navigation params, hookmi a volaniami akcii.

import { useNavigation } from "@react-navigation/native";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const FLAGS = {
  en: String.fromCodePoint(0x1f1ec, 0x1f1e7),
  sk: String.fromCodePoint(0x1f1f8, 0x1f1f0),
  cz: String.fromCodePoint(0x1f1e8, 0x1f1ff),
};

export default function LanguageScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const changeLanguage = async (lang: "en" | "sk" | "cz") => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem("language", lang);
  };

  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.content}>
        {/* HEADER */}
        <View style={[styles.header, { marginTop: insets.top + 6 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>{t("language")}</Text>
        </View>

        {/* SUBTITLE */}
        <Text style={styles.subtitle}>{t("changeLanguage")}</Text>

      {/* LANGUAGE CARD */}
      <View style={styles.card}>
        <LanguageItem flag={FLAGS.en} label={t("languageEnglish")} onPress={() => changeLanguage("en")} />
        <Divider />
        <LanguageItem flag={FLAGS.sk} label={t("languageSlovak")} onPress={() => changeLanguage("sk")} />
        <Divider />
        <LanguageItem flag={FLAGS.cz} label={t("languageCzech")} onPress={() => changeLanguage("cz")} />
      </View>
      </View>
    </SafeAreaView>
  );
}

function LanguageItem({
  flag,
  label,
  onPress,
}: {
  flag: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Text style={styles.flag}>{flag}</Text>
        <Text style={styles.itemText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#999" />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  content: {
    width: "100%",
    maxWidth: 420,
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
  },

  subtitle: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.5)",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#E4E4E7",
    paddingVertical: 20,
    paddingHorizontal: 16,
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

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  flag: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Apple Color Emoji",
      android: "NotoColorEmoji",
      default: "Segoe UI Emoji",
    }),
  },

  itemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },

  divider: {
    height: 1,
    backgroundColor: "#E4E4E7",
    marginVertical: 16,
  },
});
