import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function EditLocationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { location } = route.params;

  const [street, setStreet] = useState(location.title);
  const [name, setName] = useState("Alexandra's apartment");

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit location</Text>
      </View>

      {/* INPUTS */}
      <View style={styles.input}>
        <Text style={styles.label}>Country</Text>
        <Text style={styles.value}>Slovakia</Text>
      </View>

      <View style={styles.input}>
        <Text style={styles.label}>Street name and number</Text>
        <TextInput
          value={street}
          onChangeText={setStreet}
          style={styles.textInput}
        />
      </View>

      <View style={styles.input}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.textInput}
        />
      </View>

      <View style={styles.input}>
        <Text style={styles.label}>Type</Text>
        <Text style={styles.value}>Friend home</Text>
      </View>

      {/* SAVE */}
      <TouchableOpacity style={styles.saveBtn}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
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
