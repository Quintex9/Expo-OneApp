import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import LocationActionsModal from "../../components/LocationActionModal";

const MOCK_LOCATIONS = [
    { id: "1", title: "Hlavná 12", city: "Nitra" },
    { id: "2", title: "Pod hájom 1091/68", city: "Dubnica nad Váhom" },
    { id: "3", title: "Boženy Slančíkovej 1", city: "Nitra" },
    { id: "4", title: "Jána Halašu 16", city: "Trenčín" },
];

export default function SavedLocationsScreen() {
    const navigation = useNavigation<any>();
    const [selected, setSelected] = useState<any>(null);

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} />
                </TouchableOpacity>
                <Text style={styles.title}>Saved locations</Text>
            </View>

            {/* CARD */}
            <View style={styles.card}>
                {MOCK_LOCATIONS.map((item, index) => (
                    <View
                        key={item.id}
                        style={[
                            styles.row,
                            index !== MOCK_LOCATIONS.length - 1 && styles.divider,
                        ]}
                    >
                        <Ionicons name="location-outline" size={28} />

                        <View style={styles.textWrap}>
                            <Text style={styles.address}>{item.title}</Text>
                            <Text style={styles.city}>{item.city}</Text>
                        </View>

                        <TouchableOpacity style={styles.ellipsisButton} onPress={() => setSelected(item)}>
                            <Ionicons
                                name="ellipsis-horizontal"
                                size={16}
                                color="#71717A"
                            />
                        </TouchableOpacity>

                    </View>
                ))}
            </View>

            {selected && (
                <LocationActionsModal
                    location={selected}
                    onClose={() => setSelected(null)}
                    onEdit={() => {
                        setSelected(null); // zavrie modal
                        navigation.navigate("EditLocation", {
                            location: selected, // pošle sa konkretna location
                        });
                    }}
                    onDelete={() => setSelected(null)}
                />
            )}

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

    card: {
        backgroundColor: "#fff",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#EEE",
        paddingHorizontal: 16,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        gap: 12,
    },

    divider: {
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
    },

    textWrap: {
        flex: 1,
    },

    address: {
        fontSize: 14,
        fontWeight: "800",
    },

    city: {
        fontSize: 13,
        color: "#71717A",
        marginTop: 2,
    },
    ellipsisButton: {
        width: 22,
        height: 22,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#71717A",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },

});
