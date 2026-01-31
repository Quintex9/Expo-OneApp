import React, { memo, useMemo } from "react";
import { View, StyleSheet, ImageBackground, Image, Text, TouchableOpacity, Platform, useWindowDimensions, FlatList } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import BranchCard from "../components/BranchCard";

const REELS = [
    {
        id: "reel-1",
        background: require("../assets/gym1.jpg"),
        branch: {
            title: "RED ROYAL GYM",
            image: require("../assets/365.jpg"),
            rating: 4.6,
            distance: "1.7 km",
            hours: "9:00 - 21:00",
            category: "Fitness",
            discount: "20% discount on first entry",
            offers: ["20% discount on first entry", "1 Free entry for friend"],
        },
    },
    {
        id: "reel-2",
        background: require("../assets/gym2.jpg"),
        branch: {
            title: "GYM KLUB",
            image: require("../assets/klub.jpg"),
            rating: 4.7,
            distance: "2.1 km",
            hours: "8:00 - 22:00",
            category: "Fitness",
            discount: "Free entry for friend",
            offers: ["Free entry for friend", "10% off monthly pass"],
        },
    },
    {
        id: "reel-3",
        background: require("../assets/gym3.jpg"),
        branch: {
            title: "DIAMOND GYM",
            image: require("../assets/royal.jpg"),
            rating: 4.4,
            distance: "1.3 km",
            hours: "7:00 - 20:00",
            category: "Fitness",
            discount: "15% discount today",
            offers: ["15% discount today", "2 entries for the price of 1"],
        },
    },
];

const ReelItem = memo(
    ({
        item,
        height,
        actionsBottom,
        insetsTop,
        tabBarHeight,
        insetsBottom,
    }: {
        item: typeof REELS[number];
        height: number;
        actionsBottom: number;
        insetsTop: number;
        tabBarHeight: number;
        insetsBottom: number;
    }) => {
        const { t } = useTranslation();
        return (
            <View style={[styles.reel, { height }]}>
                <ImageBackground source={item.background} style={styles.hero} resizeMode="cover">
                    {/* Top bar - posunuta pod notch */}
                    <View style={[styles.topBar, { marginTop: insetsTop + 16 }]}>
                        <View style={styles.card}>
                            <TouchableOpacity style={styles.row} activeOpacity={0.85}>
                                <Image source={require("../images/pin.png")} style={styles.rowIcon} resizeMode="contain" />
                                <Text style={styles.rowTextBold} numberOfLines={1}>
                                    {t("yourLocation")}
                                </Text>
                                <Image source={require("../images/options.png")} style={styles.caret} resizeMode="contain" />
                            </TouchableOpacity>
                        </View>

                    </View>

                    {/* Like/Share buttons */}
                    <View style={[styles.actionsColumn, { bottom: actionsBottom }]}>
                        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                            <Image source={require("../images/feed/heart.png")} style={styles.actionIcon} resizeMode="contain" />
                            <Text style={styles.actionLabel}>{t("like")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                            <Image source={require("../images/feed/share.png")} style={styles.actionIcon} resizeMode="contain" />
                            <Text style={styles.actionLabel}>{t("share")}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Branch card */}
                    <View
                        style={[
                            styles.branchCardWrap,
                            { marginBottom: 16 },
                        ]}
                    >
                        <BranchCard
                            title={item.branch.title}
                            image={item.branch.image}
                            rating={item.branch.rating}
                            distance={item.branch.distance}
                            hours={item.branch.hours}
                            category={item.branch.category}
                            discount={item.branch.discount}
                            offers={item.branch.offers}
                        />
                    </View>
                </ImageBackground>
            </View>
        );
    }
);

export default function FeedScreen() {
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();
    const { height: screenHeight } = useWindowDimensions();
    const actionsBottom = useMemo(
        () => Math.max(120, Math.round(screenHeight * 0.22)),
        [screenHeight]
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={REELS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ReelItem
                        item={item}
                        height={screenHeight}
                        actionsBottom={actionsBottom}
                        insetsTop={insets.top}
                        tabBarHeight={tabBarHeight}
                        insetsBottom={insets.bottom}
                    />
                )}
                showsVerticalScrollIndicator={false}
                pagingEnabled
                snapToInterval={screenHeight}
                snapToAlignment="start"
                decelerationRate="fast"
                getItemLayout={(_, index) => ({
                    length: screenHeight,
                    offset: screenHeight * index,
                    index,
                })}
                style={{ height: screenHeight }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    reel: {
        width: "100%",
    },
    hero: {
        flex: 1,
        justifyContent: "space-between",
    },
    topBar: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingHorizontal: 16,
    },
    card: {
        flex: 1,
        maxWidth: 200,
        marginRight: 24,
        backgroundColor: "white",
        borderRadius: 18,
        overflow: "hidden",
        ...(Platform.OS === "web"
            ? { boxShadow: "0 6px 12px rgba(0, 0, 0, 0.14)" }
            : {
                shadowColor: "#000",
                shadowOpacity: 0.14,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 10,
            }),
    },
    row: {
        height: 44,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    rowIcon: { width: 18, height: 18 },
    rowTextBold: { flex: 1, fontWeight: "700" },
    caret: { width: 16, height: 16, opacity: 0.7 },
    actionsColumn: {
        position: "absolute",
        right: 16,
        alignItems: "center",
        gap: 20,
    },
    actionBtn: {
        alignItems: "center",
        gap: 4,
    },
    actionIcon: {
        width: 32,
        height: 32,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#fff",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    branchCardWrap: {
        paddingHorizontal: 16,
    },
});
