import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function LanguageScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Language</Text>
      </View>

      {/* SUBTITLE */}
      <Text style={styles.subtitle}>
        Change the language in the application
      </Text>

      {/* LANGUAGE CARD */}
      <View style={styles.card}>
        <LanguageItem flag="🇬🇧" label="English" />
        <Divider />
        <LanguageItem flag="🇸🇰" label="Slovak" />
        <Divider />
        <LanguageItem flag="🇨🇿" label="Czech" />
      </View>
    </ScrollView>
  );
}

function LanguageItem({
  flag,
  label,
}: {
  flag: string;
  label: string;
}) {
  return (
    <TouchableOpacity style={styles.item}>
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
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
  },

  subtitle: {
    fontSize: 14,
    color: "#777",
    marginBottom: 16,
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

  flag: {
    fontSize: 22,
  },

  itemText: {
    fontSize: 15,
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginLeft: 16,
  },
});
