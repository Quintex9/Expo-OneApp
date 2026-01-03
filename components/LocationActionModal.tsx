import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function LocationActionsModal({
  location,
  onClose,
  onEdit,
  onDelete,
}: any) {
  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />

      <View style={styles.modal}>
        <Text style={styles.title}>{location.title}</Text>

        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modal: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  editBtn: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  editText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "#DC2626",
    padding: 14,
    borderRadius: 14,
  },
  deleteText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});
