import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LocationActionsModal from "../../components/LocationActionModal";
import { useTranslation } from "react-i18next";

const MOCK_LOCATIONS = [
    { id: "1", title: "Hlavná 12", city: "Nitra" },
    { id: "2", title: "Pod hájom 1091/68", city: "Dubnica nad Váhom" },
    { id: "3", title: "Boženy Slančíkovej 1", city: "Nitra" },
    { id: "4", title: "Jána Halašu 16", city: "Trenčín" },
];

export default function SavedLocationsScreen() {
    const navigation = useNavigation<any>();
    const [selected, setSelected] = useState<any>(null);
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* HEADER */}
                <View style={[styles.header, { marginTop: insets.top + 6 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{t("savedLocations")}</Text>
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
                            <Image source={require("../../images/pin.png")} style={styles.pinIcon} />

                            <View style={styles.textWrap}>
                                <Text style={styles.address}>{item.title}</Text>
                                <Text style={styles.city}>{item.city}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.ellipsisButton}
                                onPress={() => setSelected(item)}
                            >
                                <Image source={require("../../images/dots.png")} style={styles.dotsIcon} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
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
        paddingHorizontal: 16,
    },
    content: {
        width: "100%",
        maxWidth: 420,
        alignSelf: "center",
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

    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        borderWidth: 0.5,
        borderColor: "#E4E4E7",
        paddingVertical: 22,
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

    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 10,
    },

    divider: {
        borderBottomWidth: 1,
        borderBottomColor: "#E4E4E7",
    },

    textWrap: {
        flex: 1,
    },

    address: {
        fontSize: 14,
        fontWeight: "500",
        color: "#000",
    },

    city: {
        fontSize: 13,
        color: "#71717A",
        marginTop: 2,
    },
    ellipsisButton: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.8,
        borderColor: "rgba(0, 0, 0, 0.5)",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    pinIcon: {
        width: 23,
        height: 23,
        resizeMode: "contain",
    },
    dotsIcon: {
        width: 10,
        height: 10,
        resizeMode: "contain",
        tintColor: "rgba(0, 0, 0, 0.5)",
    },

});
