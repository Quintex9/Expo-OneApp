import BranchCard from "../components/BranchCard";
import { useNavigation } from "@react-navigation/native";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FavoriteBranchesScreen() {
    const navigation = useNavigation();

    return (
        <ScrollView style={styles.container}>
            <BranchCard
                title="365 GYM Nitra"
                image={require("../assets/365.jpg")}
                rating={4.6}
                distance="1.7 km"
                hours="9:00 – 21:00"
                discount="20% discount on first entry"
                moreCount={2}
                onPress={() => console.log("Open detail")}
            />

            <BranchCard
                title="RED ROYAL GYM"
                image={require("../assets/royal.jpg")}
                rating={4.6}
                distance="1.7 km"
                hours="9:00 – 21:00"
                discount="20% discount on first entry"
                moreCount={3}
            />

            <BranchCard
                title="GYM KLUB"
                image={require("../assets/klub.jpg")}
                rating={4.6}
                distance="1.7 km"
                hours="9:00 - 21:00"
                discount="20% discount on first entry"
                moreCount={5}
            />
        </ScrollView>
    );
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
        marginBottom: 20,
    },

    title: {
        fontSize: 18,
        fontWeight: "600",
    },
});
