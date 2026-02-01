import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/AuthContext";


export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { signOut } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      t("logOut") || "Logout",
      t("logoutConfirm") || "Are you sure you want to logout?",
      [
        {
          text: t("cancel") || "Cancel",
          style: "cancel",
        },
        {
          text: t("logOut") || "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
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
      <View style={[styles.header, { marginTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
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

      {/* BENEFITS */}
      <Text style={styles.sectionTitle}>{t("Benefits")}</Text>
      <View style={styles.card}>
        <SettingsItem
          icon="gift-outline"
          label={t("myBenefits")}
          onPress={() => navigation.navigate("Benefits")}
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
      <TouchableOpacity style={[styles.logout, { marginBottom: insets.bottom + 12 }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="rgba(0, 0, 0, 0.6)" />
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
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
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
  sectionTitle: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.5)",
    marginBottom: 8,
    marginTop: 12,
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
  logout: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.6)",
    fontWeight: "700",
  },
});
