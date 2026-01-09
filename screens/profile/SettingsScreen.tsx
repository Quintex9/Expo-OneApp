import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useAuth } from "../../lib/AuthContext";


export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const { signOut, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      t("logOut") || "Logout",
      t("logoutConfirm") || "Are you sure you want to logout?",
      [
        {
          text: t("cancel") || "Cancel",
          style: "cancel",
          onPress: () => setMenuOpen(false),
        },
        {
          text: t("logOut") || "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              setMenuOpen(false);
              // Presmerovanie na Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error: any) {
              console.error("Logout error:", error);
              Alert.alert(
                t("error") || "Error",
                error?.message || t("logoutError") || "Failed to logout"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("settings")}</Text>
      </View>

      {/* USER SETTINGS */}
      <Text style={styles.sectionTitle}>{t("userSettings")}</Text>
      <View style={styles.card}>
        <SettingsItem
          icon="person-outline"
          label={t("userAccount")}
          onPress={() => navigation.navigate("UserAccount")}
        />
        <Divider />
        <SettingsItem
          icon="card-outline"
          label={t("paymentAndSubs")}
          onPress={() => console.log("Payments")}
        />
      </View>

      {/* NASTAVENIA */}
      <Text style={styles.sectionTitle}>{t("appSettings")}</Text>
      <View style={styles.card}>
        <SettingsItem
          icon="language-outline"
          label={t("language")}
          onPress={() => navigation.navigate("Language")}
        />
      </View>

      {/* LOG OUT */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#666" />
        <Text style={styles.logoutText}>{t("logOut")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function SettingsItem({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={20} color="#000" />
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
    paddingVertical: 10,
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 13,
    color: "#888",
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemText: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginLeft: 16,
  },
  logout: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
});
