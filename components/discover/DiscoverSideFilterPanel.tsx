import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  PanResponder,
} from "react-native";
import Svg, { Path, Line } from "react-native-svg";

interface Props {
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  filterOptions: readonly string[];
  appliedFilter: string | null;
  setAppliedFilter: (c: string | null) => void;
  rating: Set<string>;
  setRating: React.Dispatch<React.SetStateAction<Set<string>>>;
  setAppliedRatings: React.Dispatch<React.SetStateAction<Set<string>>>;
  subcategories: string[];
  sub: Set<string>;
  toggleSubcategory: (s: string) => void;
}

// Emoji ikony pre kategórie
const CATEGORY_EMOJIS: Record<string, string> = {
  Fitness: "💪",
  Relax: "🧖‍♀️",
  Beauty: "💄",
  Gastro: "🍽️",
};

// Emoji ikony pre subcategories
const SUBCATEGORY_EMOJIS: Record<string, string> = {
  Vegan: "🌱",
  Coffee: "☕",
  Seafood: "🦐",
  Pizza: "🍕",
  Sushi: "🍣",
  "Fast Food": "🍟",
  Asian: "🥢",
  Beer: "🍺",
  Gym: "🏋️",
  "Personal Training": "💪",
  "Group Classes": "👥",
  Yoga: "🧘",
  Haircut: "✂️",
  Manicure: "💅",
  Pedicure: "🦶",
  Facial: "✨",
  Massage: "💆",
  Spa: "🧖",
  Wellness: "🌿",
  Sauna: "🔥",
};

// Mapovanie subcategories na kategórie
const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  Gastro: ["Vegan", "Coffee", "Seafood", "Pizza", "Sushi", "Fast Food", "Asian", "Beer"],
  Fitness: ["Gym", "Personal Training", "Group Classes", "Yoga"],
  Beauty: ["Haircut", "Manicure", "Pedicure", "Facial", "Massage"],
  Relax: ["Spa", "Wellness", "Massage", "Sauna"],
};

export default function DiscoverSideFilterPanel({
  visible,
  onOpen,
  onClose,
  filterOptions,
  appliedFilter,
  setAppliedFilter,
  rating,
  setRating,
  setAppliedRatings,
  subcategories,
  sub,
  toggleSubcategory,
}: Props) {
  const { width, height } = useWindowDimensions();
  const PANEL_WIDTH = Math.min(width * 0.75, 380);

  // Animácie
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const pullHandleOpacity = useRef(new Animated.Value(visible ? 0 : 1)).current;

  // Pan responder pre zatvorenie panelu (swipe doprava)
  const closePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 && gestureState.dx > 0;
      },
      onPanResponderGrant: () => {
        translateX.setOffset((translateX as any)._value || 0);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = Math.max(0, Math.min(PANEL_WIDTH, gestureState.dx));
        translateX.setValue(dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        if (gestureState.dx > PANEL_WIDTH / 3 || gestureState.vx > 0.5) {
          closePanel();
        } else {
          openPanel();
        }
      },
    })
  ).current;

  // Pan responder pre otvorenie panelu (swipe zľava doprava z handle)
  const openPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 && gestureState.dx < 0;
      },
      onPanResponderGrant: () => {
        const currentValue = (translateX as any)._value || PANEL_WIDTH;
        translateX.setOffset(currentValue);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = Math.max(-PANEL_WIDTH, Math.min(0, gestureState.dx));
        translateX.setValue(dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        if (Math.abs(gestureState.dx) > PANEL_WIDTH / 3 || gestureState.vx < -0.5) {
          onOpen();
        } else {
          translateX.setValue(PANEL_WIDTH);
        }
      },
    })
  ).current;

  const openPanel = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pullHandleOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePanel = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: PANEL_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pullHandleOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      openPanel();
    } else {
      closePanel();
    }
  }, [visible]);

  useEffect(() => {
    pullHandleOpacity.setValue(visible ? 0 : 1);
  }, []);

  useEffect(() => {
    if (!visible) {
      translateX.setValue(PANEL_WIDTH);
      backdropOpacity.setValue(0);
      pullHandleOpacity.setValue(1);
    }
  }, [PANEL_WIDTH]);

  return (
    <>
      {/* Pull Handle - viditeľný keď panel nie je otvorený */}
      {!visible && (
        <Animated.View
          style={[
            styles.pullHandleContainer,
            {
              opacity: pullHandleOpacity,
              top: height / 2 - 36,
            },
          ]}
          {...openPanResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.pullHandle}
            onPress={onOpen}
            activeOpacity={0.7}
          >
            <Svg width="24" height="72" viewBox="0 0 18 54" fill="none">
              <Path
                d="M0 18C0 8.05887 8.05888 0 18 0V54C8.05888 54 0 45.9411 0 36V18Z"
                fill="white"
              />
              <Line
                x1="5.5"
                y1="38.9941"
                x2="5.5"
                y2="15.5002"
                stroke="#AEAEAE"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View
        style={[
          styles.overlay,
          { pointerEvents: visible ? "auto" : "none" },
        ]}
      >
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
              pointerEvents: visible ? "auto" : "none",
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={closePanel}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            {
              width: PANEL_WIDTH,
              transform: [{ translateX }],
            },
          ]}
        >
          {/* HANDLE - pre swipe gesture na zatvorenie - zobrazuje sa len keď je panel viditeľný */}
          {visible && (
            <View
              style={styles.handleWrapper}
              {...closePanResponder.panHandlers}
            >
              <Svg width="18" height="54" viewBox="0 0 18 54" fill="none">
                <Path
                  d="M0 18C0 8.05887 8.05888 0 18 0V54C8.05888 54 0 45.9411 0 36V18Z"
                  fill="white"
                />
                <Line
                  x1="5.5"
                  y1="38.9941"
                  x2="5.5"
                  y2="15.5002"
                  stroke="#AEAEAE"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          )}

          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
          </View>

          <View style={styles.contentContainer}>
            {/* Left Column - Categories */}
            <View style={styles.leftColumn}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Categories</Text>
                  <View style={styles.chips}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        !appliedFilter && styles.chipActive,
                      ]}
                      onPress={() => setAppliedFilter(null)}
                    >
                      <Text
                        style={
                          !appliedFilter
                            ? styles.chipTextActive
                            : styles.chipText
                        }
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {filterOptions.map((cat) => {
                      const isActive = appliedFilter === cat;
                      const emoji = CATEGORY_EMOJIS[cat] || "";
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.chip, isActive && styles.chipActive]}
                          onPress={() =>
                            setAppliedFilter(isActive ? null : cat)
                          }
                        >
                          <Text
                            style={
                              isActive
                                ? styles.chipTextActive
                                : styles.chipText
                            }
                          >
                            {emoji} {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Right Column - Rating & Subcategories */}
            <View style={styles.rightColumn}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                 {/* Rating */}
                 <View style={styles.sectionContainer}>
                   <Text style={styles.sectionTitle}>Rating</Text>
                   <View style={styles.chips}>
                     {["4.7", "4.5", "4.0", "3.5", "3.0"].map((r) => {
                       const isActive = rating.has(r);
                       return (
                         <TouchableOpacity
                           key={r}
                           style={[styles.chip, isActive && styles.chipActive]}
                           onPress={() => {
                             setRating((prev) => {
                               const next = new Set(prev);
                               if (next.has(r)) {
                                 next.delete(r);
                               } else {
                                 next.add(r);
                               }
                               return next;
                             });
                             setAppliedRatings((prev) => {
                               const next = new Set(prev);
                               if (next.has(r)) {
                                 next.delete(r);
                               } else {
                                 next.add(r);
                               }
                               return next;
                             });
                           }}
                         >
                           <Text
                             style={
                               isActive ? styles.chipTextActive : styles.chipText
                             }
                           >
                             {"⭐"} {r}
                           </Text>
                         </TouchableOpacity>
                       );
                     })}
                   </View>
                 </View>

                {/* Subcategories - zobrazujú sa len pre vybranú kategóriu */}
                {appliedFilter && CATEGORY_SUBCATEGORIES[appliedFilter] && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Subcategories</Text>
                    <View style={styles.chips}>
                      {CATEGORY_SUBCATEGORIES[appliedFilter].map((s) => {
                        const isActive = sub.has(s);
                        const emoji = SUBCATEGORY_EMOJIS[s] || "";
                        return (
                          <TouchableOpacity
                            key={s}
                            style={[styles.chip, isActive && styles.chipActive]}
                            onPress={() => toggleSubcategory(s)}
                          >
                            <Text
                              style={
                                isActive
                                  ? styles.chipTextActive
                                  : styles.chipText
                              }
                            >
                              {emoji} {s}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    flexDirection: "row",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  panel: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  handleWrapper: {
    position: "absolute",
    left: -24,
    top: "50%",
    width: 40,
    height: 88,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },
  header: {
    marginBottom: 20,
    paddingRight: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
  },
  leftColumn: {
    flex: 1,
    paddingRight: 8,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: 8,
  },
  divider: {
    width: 1,
    backgroundColor: "#E0E0E0",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,

  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: "#FF7A00",
    borderColor: "#FF7A00",
  },
  chipText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  chipTextActive: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  pullHandleContainer: {
    position: "absolute",
    right: 0,
    width: 24,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9998,
    pointerEvents: "auto",
  },
  pullHandle: {
    width: 24,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
});
