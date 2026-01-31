import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import sk from "./locales/sk.json";
import cz from "./locales/cz.json";

// Zoberieme prvý jazyk zo systému (en, sk, cs, ...)
const rawSystemLanguage = Localization.getLocales()?.[0]?.languageCode ?? "en";

// Mapujeme systémové kódy na naše kódy (cs -> cz)
const mapLanguageCode = (code: string): string => {
  if (code === "cs") return "cz"; // Čeština
  if (["en", "sk", "cz"].includes(code)) return code;
  return "en"; // Fallback na angličtinu pre nepodporované jazyky
};

const systemLanguage = mapLanguageCode(rawSystemLanguage);

// Inicializácia i18n
i18n.use(initReactI18next).init({
  lng: systemLanguage, // Predvolene systémový jazyk
  fallbackLng: "en",

  resources: {
    en: { translation: en },
    sk: { translation: sk },
    cz: { translation: cz },
  },

  interpolation: {
    escapeValue: false,
  },
});

// Načítame uložený jazyk z AsyncStorage (ak existuje)
AsyncStorage.getItem("language").then((savedLanguage) => {
  if (savedLanguage && ["en", "sk", "cz"].includes(savedLanguage)) {
    i18n.changeLanguage(savedLanguage);
  }
});

export default i18n;
