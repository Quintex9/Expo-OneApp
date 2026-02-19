import React from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
};

/**
 * SignInPromptSheet: Zobrazuje modal výzvu na prihlásenie pri akcii, ktorá vyžaduje účet.
 *
 * Prečo: Používateľ dostane jasný ďalší krok namiesto tichej chyby alebo nefunkčného tlačidla.
 */
export default function SignInPromptSheet({ visible, onClose, onSignIn }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Image
            source={require("../images/diamond.png")}
            style={styles.icon}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            {t("signInToSeeMore", "Sign in to see more")}
          </Text>

          <Text style={styles.subtitle}>
            {t(
              "needAccountToDiscoverDeals",
              "You need an account to discover places and deals around you."
            )}
          </Text>

          <TouchableOpacity style={styles.signInButton} onPress={onSignIn} activeOpacity={0.85}>
            <Text style={styles.signInText}>{t("signIn")}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.noThanksText}>{t("noThanks")}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: "center",
  },
  icon: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  title: {
    width: "100%",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    width: "100%",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "500",
    color: "rgba(0, 0, 0, 0.5)",
    textAlign: "center",
    marginBottom: 22,
  },
  signInButton: {
    width: "100%",
    height: 48,
    borderRadius: 999,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  signInText: {
    color: "#FAFAFA",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  noThanksText: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "700",
    color: "#000000",
  },
});

