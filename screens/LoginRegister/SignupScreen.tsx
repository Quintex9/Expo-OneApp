// SignupScreen: obrazovka autentifikacneho flow.
// Zodpovednost: renderuje UI, obsluhuje udalosti a lokalny stav obrazovky.
// Vstup/Vystup: pracuje s navigation params, hookmi a volaniami akcii.

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabaseClient";

export default function SignupScreen() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);
    const confirmPasswordInputRef = useRef<TextInput>(null);

    const navigation = useNavigation<any>();
    const { t } = useTranslation();

    const handleSignup = async () => {
        // Validácia
        if (!email || !password || !confirmPassword) {
            Alert.alert(t("error") || "Error", t("fillAllFields") || "Please fill all fields");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(t("error") || "Error", t("passwordsDoNotMatch") || "Passwords do not match");
            return;
        }

        if (password.length < 6) {
            Alert.alert(t("error") || "Error", t("passwordTooShort") || "Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            // Registrácia používateľa - len email a heslo
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
            });

            if (error) {
                console.error("Signup error:", error);
                throw error;
            }

            if (data.user) {
                // Po úspešnej registrácii navigovať na onboarding
                // Ak používateľ potrebuje overiť email, najprv sa zobrazí alert
                const needsEmailVerification = !data.session;
                
                if (needsEmailVerification) {
                    Alert.alert(
                        t("success") || "Success",
                        t("signupSuccess") || "Account created successfully! Please check your email to verify your account.",
                        [
                            {
                                text: "OK",
                                onPress: () => navigation.navigate("Login"),
                            },
                        ]
                    );
                } else {
                    // Ak je automaticky prihlásený (napr. OAuth), ísť na onboarding
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "Onboarding" }],
                    });
                }
            }
        } catch (error: any) {
            console.error("Signup catch error:", error);
            const errorMessage = error?.message || error?.error_description || t("signupError") || "An error occurred during signup";
            Alert.alert(
                t("signupFailed") || "Signup Failed",
                errorMessage
            );
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error: any) {
            Alert.alert(t("error") || "Error", error.message);
        }
    };

    const handleAppleSignup = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'apple',
            });
            if (error) throw error;
        } catch (error: any) {
            Alert.alert(t("error") || "Error", error.message);
        }
    };

    const handleFacebookSignup = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'facebook',
            });
            if (error) throw error;
        } catch (error: any) {
            Alert.alert(t("error") || "Error", error.message);
        }
    };

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
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.navigate("Tabs", { screen: "Discover" })}
                        >
                            <Ionicons name="arrow-back" size={22} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.title}>{t("createAccount")}</Text>
                        <Text style={styles.subtitle}>{t("createSubtitle")}</Text>

                        {/* Full Name */}
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} style={styles.inputIcon} />
                            <TextInput
                                placeholder={t("fullName", "Full Name")}
                                placeholderTextColor="#71717A"
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => emailInputRef.current?.focus()}
                                editable={!loading}
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} style={styles.inputIcon} />
                            <TextInput
                                placeholder={t("email")}
                                placeholderTextColor="#71717A"
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                ref={emailInputRef}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                                editable={!loading}
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} style={styles.inputIcon} />
                            <TextInput
                                placeholder={t("password")}
                                placeholderTextColor="#71717A"
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                ref={passwordInputRef}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    style={styles.eyeIcon}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} style={styles.inputIcon} />
                            <TextInput
                                placeholder={t("confirmPassword")}
                                placeholderTextColor="#71717A"
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                ref={confirmPasswordInputRef}
                                returnKeyType="done"
                                onSubmitEditing={handleSignup}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Ionicons
                                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    style={styles.eyeIcon}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Create Account Button */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>{t("createAccount")}</Text>
                            )}
                        </TouchableOpacity>

                        {/* Sign in link */}
                        <TouchableOpacity onPress={() => navigation.navigate("Login")} disabled={loading}>
                            <Text style={styles.signin}>
                                {t("already")}{" "}
                                <Text style={styles.signinLink}>{t("sign")}</Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.divider} />
                            <Text style={styles.or}>{t("or")}</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Social signup */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignup} disabled={loading}>
                                <Image
                                    source={{ uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png" }}
                                    style={styles.socialIcon}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignup} disabled={loading}>
                                <Image
                                    source={{ uri: "https://cdn-icons-png.flaticon.com/512/0/747.png" }}
                                    style={styles.socialIcon}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.socialButton} onPress={handleFacebookSignup} disabled={loading}>
                                <Image
                                    source={{ uri: "https://cdn-icons-png.flaticon.com/512/5968/5968764.png" }}
                                    style={styles.socialIcon}
                                />
                            </TouchableOpacity>
                        </View>
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
    input: {
        flex: 1,
        paddingVertical: 0,
        fontSize: 14,
        color: "#000",
    },
    button: {
        width: "100%",
        backgroundColor: "#EB8100",
        height: 48,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#FAFAFA",
        fontSize: 18,
        fontWeight: "600",
    },
    signin: {
        textAlign: "center",
        marginBottom: 18,
        color: "rgba(0, 0, 0, 0.5)",
        fontSize: 14,
    },
    signinLink: {
        color: "#000",
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    dividerRow: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: "#E4E4E7",
    },
    or: {
        marginHorizontal: 10,
        fontSize: 13,
        color: "rgba(0, 0, 0, 0.5)",
    },
    socialRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        gap: 24,
    },
    socialButton: {
        width: 55,
        height: 55,
        borderRadius: 100,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
    },
    socialIcon: {
        width: 30,
        height: 30,
        resizeMode: "contain",
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
    eyeIcon: {
        color: "#A6A6A6",
    },
});
