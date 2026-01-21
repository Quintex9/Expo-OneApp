import React from "react";
import { View, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  topInset: number;
  onBack: () => void;
};

export function HeroActions({ topInset, onBack }: Props) {
  return (
    <>
      {/* Šípka späť */}
      <View style={[styles.topLeft, { top: topInset + 14 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Srdce, zvonček, zdieľať */}
      <View style={[styles.topRight, { top: topInset + 14 }]}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="heart-outline" size={15} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="notifications-outline" size={15} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social-outline" size={15} color="#000" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topLeft: {
    position: "absolute",
    left: 16,
  },
  topRight: {
    position: "absolute",
    right: 16,
    gap: 6,
  },
  backBtn: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtn: {
    width: 30,
    height: 30,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
