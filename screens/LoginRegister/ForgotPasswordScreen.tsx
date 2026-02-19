/**
 * ForgotPasswordScreen: Obrazovka obnovy hesla odosiela reset pokyn na e-mail používateľa.
 *
 * Prečo: Samostatná obnova hesla znižuje frustráciu pri strate prístupu a udrží bezpečný auth proces.
 */

import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");

    const navigation = useNavigation<any>();

    const { t } = useTranslation();

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.form}>
                        {/* Header */}
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={22} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.title}>{t("forgotPassword")}</Text>
                        <Text style={styles.subtitle}>{t("forgotSubtitle")}</Text>

                        {/* Email input */}
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} style={styles.inputIcon} />
                            <TextInput
                                placeholder={t("email")}
                                placeholderTextColor="#71717A"
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                returnKeyType="done"
                            />
                        </View>

                        {/* Continue button */}
                        <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>{t("continue")}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    flex: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 32,
    },
    form: {
        width: "100%",
        maxWidth: 420,
        alignSelf: "center",
    },
    backButton: {
        width: 32,
        height: 32,
        alignSelf: "flex-start",
        alignItems: "flex-start",
        justifyContent: "center",
        marginBottom: 12,
    },
    title: {
        fontSize: 27,
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
        color: "#000",
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 18,
        color: "rgba(0, 0, 0, 0.5)",
        marginBottom: 28,
        textAlign: "center",
    },
    inputWrapper: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        height: 50,
        borderWidth: 1,
        borderColor: "#E4E4E7",
        borderRadius: 999,
        paddingHorizontal: 12,
        backgroundColor: "#FFFFFF",
        marginBottom: 20,
        gap: 10,
    },
    inputIcon: {
        color: "#71717A",
    },
    input: {
        flex: 1,
        paddingVertical: 0,
        fontSize: 14,
        color: "#000",
        backgroundColor: "transparent",
    },
    button: {
        width: "100%",
        backgroundColor: "#EB8100",
        height: 48,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
    },
    buttonText: {
        color: "#FAFAFA",
        fontSize: 18,
        fontWeight: "600",
    },
});
