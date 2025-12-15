import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BranchCardProps {
  title: string;
  image: any; // require(...) alebo { uri }
  rating: number;
  distance: string;
  hours: string;
  discount?: string;
  moreCount?: number;
  onPress?: () => void;
}

export default function BranchCard({
  title,
  image,
  rating,
  distance,
  hours,
  discount,
  moreCount,
  onPress,
}: BranchCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.branchCard}
    >
      {/* IMAGE */}
      <Image source={image} style={styles.branchImage} resizeMode="cover" />

      {/* CONTENT */}
      <View style={styles.branchContent}>
        <Text style={styles.branchTitle}>{title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={14} color="#F5A623" />
          <Text style={styles.metaText}>{rating}</Text>

          <Ionicons name="location-outline" size={14} />
          <Text style={styles.metaText}>{distance}</Text>

          <Ionicons name="time-outline" size={14} />
          <Text style={styles.metaText}>{hours}</Text>
        </View>

        {(discount || moreCount) && (
          <View style={styles.bottomRow}>
            {discount && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{discount}</Text>
              </View>
            )}
            {moreCount && (
              <Text style={styles.moreText}>+{moreCount} more</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  branchCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  branchImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },

  branchContent: {
    flex: 1,
    justifyContent: "center",
  },

  branchTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },

  metaText: {
    fontSize: 13,
    color: "#444",
    marginRight: 6,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  badge: {
    backgroundColor: "#F7931E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  moreText: {
    fontSize: 11,
    color: "#666",
  },
});
