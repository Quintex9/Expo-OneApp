// EditLocationScreen: obrazovka profilovej sekcie.
// Zodpovednost: renderuje UI, obsluhuje udalosti a lokalny stav obrazovky.
// Vstup/Vystup: pracuje s navigation params, hookmi a volaniami akcii.

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function EditLocationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { location } = route.params;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [street, setStreet] = useState(location.title);
  const [name, setName] = useState(t("locationNameExample"));

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* HEADER */}
      <View style={[styles.header, { marginTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("editLocationTitle")}</Text>
      </View>

      {/* INPUTS */}
      <View style={styles.input}>
        <Text style={styles.label}>{t("country")}</Text>
        <Text style={styles.value}>{t("slovakia")}</Text>
      </View>

      <View style={styles.input}>
        <Text style={styles.label}>{t("streetNameAndNumber")}</Text>
        <TextInput
          value={street}
          onChangeText={setStreet}
          style={styles.textInput}
        />
      </View>

      <View style={styles.input}>
        <Text style={styles.label}>{t("name")}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.textInput}
        />
      </View>

      <View style={styles.input}>
        <Text style={styles.label}>{t("type")}</Text>
        <Text style={styles.value}>{t("friendHome")}</Text>
      </View>

      {/* SAVE */}
      <TouchableOpacity style={[styles.saveBtn, { marginBottom: insets.bottom + 12 }]}>
        <Text style={styles.saveText}>{t("save")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },

  label: {
    fontSize: 12,
    color: "#71717A",
    marginBottom: 6,
  },

  value: {
    fontSize: 14,
    fontWeight: "500",
  },

  textInput: {
    fontSize: 14,
    padding: 0,
  },

  saveBtn: {
    marginTop: "auto",
    backgroundColor: "#E5E7EB",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A1A1AA",
  },
});
