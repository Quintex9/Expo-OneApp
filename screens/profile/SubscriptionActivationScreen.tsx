import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import SelectableCard from "../../components/SelectableCard";
import type { PlanId } from "../../lib/interfaces";
import { useTranslation } from "react-i18next";

export default function SubscriptionActivationScreen() {
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>("medium");
  const insets = useSafeAreaInsets();

  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { marginTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("subscriptionActivation")}</Text>
      </View>

      <Text style={styles.subtitle}>{t("subsScreenDesc")}</Text>

      <SelectableCard
        id="starter"
        title={t("starter")}
        price="5.99"
        description={t("starterDesc")}
        selected={selectedPlan === "starter"}
        onPress={setSelectedPlan}
      />

      <SelectableCard
        id="medium"
        title={t("medium")}
        price="9.99"
        popular
        description={t("mediumDesc")}
        selected={selectedPlan === "medium"}
        onPress={setSelectedPlan}
      />

      <SelectableCard
        id="gold"
        title={t("gold")}
        price="15.99"
        description={t("goldDesc")}
        selected={selectedPlan === "gold"}
        onPress={setSelectedPlan}
      />

      <TouchableOpacity
        style={[styles.button, !selectedPlan && styles.buttonDisabled]}
        disabled={!selectedPlan}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>{t("continue")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#000" },
  subtitle: {
    fontSize: 13,
    lineHeight: 16,
    color: "rgba(0, 0, 0, 0.5)",
    marginTop: 10,
    marginBottom: 22,
  },
  button: {
    marginTop: "auto",
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#FAFAFA", fontSize: 18, fontWeight: "700" },
});
