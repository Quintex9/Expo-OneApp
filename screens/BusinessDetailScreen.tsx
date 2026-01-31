import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, ScrollView, StyleSheet, useWindowDimensions, TouchableOpacity, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import BottomSheet from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";

import { HeroCarousel } from "../components/discover/HeroCarousel";
import { TabMenu } from "../components/discover/TabMenu";
import { NewsSection } from "../components/discover/NewsSection";
import { BenefitsSection } from "../components/discover/BenefitsSection";
import { BenefitsBottomSheet } from "../components/discover/BenefitsBottomSheet";
import { HeroActions } from "../components/discover/HeroActions";
import { HeroInfo } from "../components/discover/HeroInfo";
import { InfoSection } from "../components/discover/InfoSection";
import { ReviewsSection } from "../components/discover/ReviewsSection";
import { normalizeBranch } from "../lib/data/normalizers";
import { useAuth } from "../lib/AuthContext";

export default function BusinessDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuth();
    const { t } = useTranslation();
    const branchParam = route.params?.branch;
    const branch = normalizeBranch(branchParam ?? {});

    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    type TabKey = "news" | "benefits" | "info" | "reviews";
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [activeTab, setActiveTab] =
        useState<TabKey>("benefits");

    const scrollViewRef = useRef<ScrollView>(null);
    const lastScrollY = useRef(0);
    const prevScrollY = useRef(0);
    const scrollDirection = useRef<"up" | "down" | null>(null);
    const isStickyRef = useRef(false);
    const [isSticky, setIsSticky] = useState(false);
    const scrollPositionsRef = useRef(new Map<string, number>());
    const prevBranchKey = useRef<string | null>(null);
    const prevTabKey = useRef<string | null>(null);

    const sheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["15%", "35%"], []);

    // Memoizované hodnoty - prepočítajú sa len keď sa zmení width
    const heroHeight = useMemo(
        () => Math.min(360, Math.max(240, Math.round(width * 0.7))),
        [width]
    );
    const menuGap = 10;
    const snapThreshold = 24;
    const sidePadding = 15;
    const menu = useMemo<TabKey[]>(() => ["news", "benefits", "info", "reviews"], []);

    const menuItemWidth = useMemo(
        () => Math.min(88, Math.floor((width - sidePadding * 2 - menu.length * 5) / menu.length)),
        [width, menu.length]
    );

    // Memoizované štýly - nevytvárajú sa nanovo pri každom rendereri
    const heroContainerStyle = useMemo(
        () => ({ height: heroHeight }),
        [heroHeight]
    );

    const menuWrapperStyle = useMemo(
        () => [styles.menuWrapper, { paddingHorizontal: sidePadding }],
        [sidePadding]
    );

    const scrollContentStyle = useMemo(
        () => [styles.scrollContent, { paddingBottom: insets.bottom + 2 }],
        [insets.bottom]
    );

    const sectionWrapperStyle = useMemo(
        () => [styles.sectionWrapper, { paddingHorizontal: sidePadding }],
        [sidePadding]
    );

    const qrButtonStyle = useMemo(
        () => [styles.qrButton, { bottom: insets.bottom + 20 }],
        [insets.bottom]
    );

    const snapOffset = useMemo(
        () => heroHeight + menuGap,
        [heroHeight, menuGap]
    );
    const branchKey = useMemo(
        () => String(branch?.id ?? branch?.title ?? "unknown"),
        [branch?.id, branch?.title]
    );
    const positionKey = useCallback(
        (key: string, tab: string) => `${key}:${tab}`,
        []
    );

    const safeBranch = branch ?? {
        title: "",
        rating: 0,
        distance: "",
        hours: "",
        category: "",
        image: require("../assets/365.jpg"),
        address: "",
        phone: "",
        email: "",
        website: "",
    };

    const images = [
        { id: "1", image: safeBranch.image },
    ];

    const reviews = useMemo(() => [
        {
            id: "1",
            name: "Martin Kováč",
            rating: 5,
            text: t("reviewText1"),
            daysAgo: 2,
        },
        {
            id: "2",
            name: "Peter Horváth",
            rating: 4,
            text: t("reviewText2"),
            daysAgo: 5,
        },
    ], [t]);

    // Memoizované handlery - nevytvárajú sa nanovo pri každom rendereri
    const handleBack = useCallback(() => navigation.goBack(), [navigation]);
    
    const handleTabChange = useCallback(
        (val: string) => setActiveTab(val as TabKey),
        []
    );

    const handleActivateBenefit = useCallback(() => {
        if (user) {
            navigation.navigate("Benefits");
        } else {
            sheetRef.current?.expand();
        }
    }, [user, navigation]);

    const handleQrPress = useCallback(() => {
        if (user) {
            navigation.navigate("Benefits");
        } else {
            navigation.navigate("Login");
        }
    }, [user, navigation]);

    const handleLogin = useCallback(
        () => navigation.navigate("Login"),
        [navigation]
    );

    const handleSnap = useCallback(() => {
        if (snapOffset <= 0) return;
        const y = lastScrollY.current;
        const direction = scrollDirection.current;
        if (y > 0 && y < snapOffset) {
            const snapTo = direction === "up" ? 0 : (y >= snapThreshold ? snapOffset : 0);
            if (Math.abs(y - snapTo) > 1) {
                scrollViewRef.current?.scrollTo({ y: snapTo, animated: true });
            }
        }
    }, [snapOffset, snapThreshold]);

    const setStickyFromOffset = useCallback((y: number) => {
        const shouldStick = y >= snapOffset - 1;
        if (shouldStick !== isStickyRef.current) {
            isStickyRef.current = shouldStick;
            setIsSticky(shouldStick);
        }
    }, [snapOffset]);

    const handleScroll = useCallback((event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        lastScrollY.current = y;

        if (y > prevScrollY.current) {
            scrollDirection.current = "down";
        } else if (y < prevScrollY.current) {
            scrollDirection.current = "up";
        }
        prevScrollY.current = y;

        setStickyFromOffset(y);
    }, [setStickyFromOffset]);

    const restoreScroll = useCallback((offset: number) => {
        lastScrollY.current = offset;
        prevScrollY.current = offset;
        scrollDirection.current = null;
        setStickyFromOffset(offset);
        requestAnimationFrame(() => {
            scrollViewRef.current?.scrollTo({ y: offset, animated: false });
        });
    }, [setStickyFromOffset]);

    React.useEffect(() => {
        const previousBranch = prevBranchKey.current;
        const previousTab = prevTabKey.current;
        const sameBranch = previousBranch === branchKey;

        if (previousBranch && previousTab && (previousBranch !== branchKey || previousTab !== activeTab)) {
            scrollPositionsRef.current.set(
                positionKey(previousBranch, previousTab),
                lastScrollY.current
            );
        }

        const savedOffset = scrollPositionsRef.current.get(positionKey(branchKey, activeTab)) ?? 0;
        const keepSticky = sameBranch
            ? lastScrollY.current >= snapOffset - 1
            : savedOffset >= snapOffset - 1;
        const targetOffset = keepSticky ? Math.max(savedOffset, snapOffset) : savedOffset;

        prevBranchKey.current = branchKey;
        prevTabKey.current = activeTab;
        restoreScroll(targetOffset);
    }, [branchKey, activeTab, positionKey, restoreScroll, snapOffset]);

    // Memoizované dáta pre InfoSection
    const hoursData = useMemo(() => [
        { day: "Monday", time: safeBranch.hours },
        { day: "Tuesday", time: safeBranch.hours },
        { day: "Wednesday", time: safeBranch.hours, isToday: true },
        { day: "Thursday", time: safeBranch.hours },
        { day: "Friday", time: safeBranch.hours },
        { day: "Saturday", time: "7:00 - 20:00" },
        { day: "Sunday", time: "7:00 - 20:00" },
    ], [safeBranch.hours]);

    return (
        <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
            {/* CONTENT */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={scrollContentStyle}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[1]}
                scrollEventThrottle={16}
                onScroll={handleScroll}
                onScrollEndDrag={handleSnap}
                onMomentumScrollEnd={handleSnap}
            >
                <View style={[heroContainerStyle, { marginBottom: menuGap }]}>
                    <HeroCarousel
                        data={images}
                        height={heroHeight}
                        width={width}
                        index={carouselIndex}
                        onIndexChange={setCarouselIndex}
                    />

                    <HeroActions
                        topInset={insets.top}
                        onBack={handleBack}
                    />

                    <HeroInfo
                        title={safeBranch.title}
                        rating={safeBranch.rating}
                        ratingCount={reviews.length}
                        distance={safeBranch.distance}
                        hours={safeBranch.hours}
                        category={safeBranch.category}
                    />
                </View>

                <View style={menuWrapperStyle}>
                    {isSticky && <View style={{ height: insets.top }} />}
                    <TabMenu
                        items={menu}
                        active={activeTab}
                        onChange={handleTabChange}
                        width={menuItemWidth}
                    />
                </View>

                <View style={sectionWrapperStyle}>
                {activeTab === "news" && (
                    <NewsSection title={safeBranch.title} />
                )}

                {activeTab === "benefits" && (
                    <BenefitsSection onActivate={handleActivateBenefit} />
                )}

                {activeTab === "info" && (
                    <InfoSection
                        hours={hoursData}
                        address={safeBranch.address ?? ""}
                        phone={safeBranch.phone ?? ""}
                        email={safeBranch.email ?? ""}
                        website={safeBranch.website ?? ""}
                    />
                )}

                {activeTab === "reviews" && (
                    <ReviewsSection
                        rating={safeBranch.rating}
                        total={reviews.length}
                        reviews={reviews}
                    />
                )}

                </View>
            </ScrollView>

            {/* BOTTOM SHEET - len pre neprihlásených */}
            {activeTab === "benefits" && !user && (
                <BenefitsBottomSheet
                    sheetRef={sheetRef}
                    snapPoints={snapPoints}
                    onLogin={handleLogin}
                />
            )}

            {/* Floating QR tlačidlo */}
            <TouchableOpacity
                style={qrButtonStyle}
                onPress={handleQrPress}
                activeOpacity={0.85}
            >
                <Image source={require("../images/qr.png")} style={styles.qrIcon} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    menuWrapper: {
        paddingTop: 10,
        paddingBottom: 12,
        backgroundColor: "#fff",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 0,
    },
    sectionWrapper: {
        paddingTop: 12,
    },
    qrButton: {
        position: "absolute",
        right: 16,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    qrIcon: {
        width: 48,
        height: 48,
    },
});
