import { Platform, useWindowDimensions } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Mapbox from "@rnmapbox/maps";
import type { Camera } from "@rnmapbox/maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type BottomSheet from "@gorhom/bottom-sheet";
import type { BranchData, DiscoverCategory, DiscoverMapMarker, Location } from "../lib/interfaces";
import DiscoverMap from "../components/discover/DiscoverMap";
import DiscoverTopControls from "../components/discover/DiscoverTopControls";
import DiscoverSearchSheet from "../components/discover/DiscoverSearchSheet";
import DiscoverFilterSheet from "../components/discover/DiscoverFilterSheet";
import DiscoverBranchOverlay from "../components/discover/DiscoverBranchOverlay";
import { styles } from "../components/discover/discoverStyles";
import { DUMMY_BRANCH } from "../lib/constants/discover";
import { useDataSource } from "../lib/data/useDataSource";

let lastDiscoverCameraState: { center: [number, number]; zoom: number } | null = null;
let preserveDiscoverCamera = false;
const NITRA_CENTER: [number, number] = [18.091, 48.3069];
const FILTER_OPTIONS: DiscoverCategory[] = ["Fitness", "Gastro", "Relax", "Beauty"];
const FILTER_ICONS: Record<DiscoverCategory, any> = {
  Fitness: require("../images/icons/fitness/Fitness.png"),
  Gastro: require("../images/icons/gastro/Gastro.png"),
  Relax: require("../images/icons/relax/Relax.png"),
  Beauty: require("../images/icons/beauty/Beauty.png"),
};
const MULTI_MARKER_ICON = require("../images/icons/multi/multi.png");

const SUBCATEGORIES = ["Vegan", "Coffee", "Asian", "Pizza", "Sushi", "Fast Food", "Seafood", "Beer"];
const RATING_VALUES = [4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0];

const getRatingForId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return RATING_VALUES[hash % RATING_VALUES.length];
};

export default function DiscoverScreen() {

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const sheetRef = useRef<BottomSheet>(null);
  const filterRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%", "85%"], []);

  const { t } = useTranslation();

  const [branches, setBranches] = useState<BranchData[]>([]);
  const [markers, setMarkers] = useState<DiscoverMapMarker[]>([]);

  const [location, setLocation] = useState<Location[]>([
    { image: require("../images/home.png"), label: "home" },
    { image: require("../images/business.png"), label: "business" },
    { image: require("../images/pin.png"), label: "nitra", coord: NITRA_CENTER },
  ]
  );

  const [open, setOpen] = useState(false);
  const [option, setOption] = useState<string>("yourLocation");
  const [text, setText] = useState("");
  const [o, setO] = useState<boolean>(true)
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchSheetIndex, setSearchSheetIndex] = useState(-1);
  const [filter, setFilter] = useState("Gastro")
  const [appliedFilter, setAppliedFilter] = useState<string | null>(null);
  const [sub, setSub] = useState<Set<string>>(() => new Set());
  const [ratingFilter, setRatingFilter] = useState<Set<string>>(() => new Set());
  const [appliedRatings, setAppliedRatings] = useState<Set<string>>(() => new Set());
  const [userCoord, setUserCoord] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(NITRA_CENTER);
  const [didInitialCenter, setDidInitialCenter] = useState(false);
  const [mapZoom, setMapZoom] = useState(14);

  const [selectedGroup, setSelectedGroup] = useState<{
    coord: { lng: number; lat: number };
    items: DiscoverMapMarker[];
  } | null>(null);

  const dataSource = useDataSource();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([dataSource.getBranches(), dataSource.getMarkers()])
      .then(([branchData, markerData]) => {
        if (!active) return;
        const translated = branchData.map((branch) => ({
          ...branch,
          title: t(branch.title),
          distance: t(branch.distance),
          hours: t(branch.hours),
        }));
        setBranches(translated);
        setMarkers(markerData);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message ?? "Failed to load data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t, dataSource]);
  
  const cameraRef = useRef<Camera>(null);

  const toggle = (name: string) => {
    setSub(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };


  useEffect(() => {
    if (Platform.OS === "android") {
      Mapbox.requestAndroidLocationPermissions();
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: isSheetOpen ? "none" : "flex" },
    });
  }, [navigation, isSheetOpen]);

  const searchExpandedIndex = snapPoints.length > 1 ? 1 : 0;
  useFocusEffect(
    useCallback(() => {
      if (route.name === "Search") {
        setSearchSheetIndex(searchExpandedIndex);
        const target = lastDiscoverCameraState?.center ?? userCoord ?? NITRA_CENTER;
        const zoomLevel = lastDiscoverCameraState?.zoom ?? 14;
        cameraRef.current?.setCamera({
          centerCoordinate: target,
          zoomLevel,
          animationDuration: 0,
        });
        return;
      }
      if (preserveDiscoverCamera) {
        if (lastDiscoverCameraState) {
          cameraRef.current?.setCamera({
            centerCoordinate: lastDiscoverCameraState.center,
            zoomLevel: lastDiscoverCameraState.zoom,
            animationDuration: 0,
          });
        }
        setDidInitialCenter(true);
        preserveDiscoverCamera = false;
      }
    }, [route.name, searchExpandedIndex, userCoord])
  );

  useEffect(() => {
    if (route.name === "Search") {
      return;
    }
    if (!userCoord || didInitialCenter || preserveDiscoverCamera) {
      return;
    }
    cameraRef.current?.setCamera({
      centerCoordinate: userCoord,
      zoomLevel: 14,
      animationDuration: 800,
    });
    setDidInitialCenter(true);
  }, [userCoord, didInitialCenter, route.name]);

  const groupedMarkers = useMemo(() => {
    const map = new Map<
      string,
      { id: string; lng: number; lat: number; items: DiscoverMapMarker[] }
    >();

    markers.forEach((item) => {
      const key = item.groupId ?? item.id;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          lng: item.coord.lng,
          lat: item.coord.lat,
          items: [],
        });
      }

      map.get(key)!.items.push(item);
    });

    return Array.from(map.values());
  }, [markers]);


  const subcategoryChipWidth = Math.max(96, Math.floor((screenWidth - 16 * 2 - 12 * 2) / 3));
  const branchCardWidth = Math.max(280, Math.min(340, screenWidth - 48));
  const ratingThreshold = useMemo(() => {
    const values = Array.from(appliedRatings)
      .map((value) => Number(value))
      .filter((value) => !Number.isNaN(value));
    if (values.length === 0) {
      return null;
    }
    return Math.max(...values);
  }, [appliedRatings]);
  const query = text.trim().toLowerCase();
  const ratingFilteredBranches =
    ratingThreshold === null
      ? branches
      : branches.filter((branch) => branch.rating >= ratingThreshold);
  const filteredBranches = appliedFilter
    ? ratingFilteredBranches.filter((branch) => branch.category === appliedFilter)
    : ratingFilteredBranches;
  const filtered = query
    ? filteredBranches.filter((branch) => branch.title.toLowerCase().includes(query))
    : filteredBranches;
  const filterCount = sub.size + ratingFilter.size;
  const markerItems = useMemo<DiscoverMapMarker[]>(() => {
    return groupedMarkers.map((group) => {
      // skupina s 1 položkou → normálny pin
      if (group.items.length === 1) {
        return group.items[0];
      }

      // skupina s viacerými položkami → LEN 1 čierny multi-pin
      return {
        id: group.id,
        coord: { lng: group.lng, lat: group.lat },
        icon: MULTI_MARKER_ICON,
        rating: Math.max(...group.items.map((i) => i.rating)),
        category: "Multi",
      };
    });
  }, [groupedMarkers]);

  const ratingFilteredMarkers =
    ratingThreshold === null
      ? markerItems
      : markerItems.filter((item) => item.rating >= ratingThreshold);

  const filteredMarkers = appliedFilter
    ? ratingFilteredMarkers.filter((item) => item.category === appliedFilter)
    : ratingFilteredMarkers;

  const selectedOptionCoord = useMemo(() => {
    const selected = location.find((item) => item.label === option && item.coord);
    return selected?.coord ?? null;
  }, [location, option]);

  const savedLocationMarkers = useMemo<DiscoverMapMarker[]>(
    () =>
      location
        .filter((item) => item.isSaved && item.coord)
        .map((item, index) => {
          const id = `saved-${index}-${item.coord![0]}-${item.coord![1]}`;
          return {
            id,
            coord: { lng: item.coord![0], lat: item.coord![1] },
            icon: item.markerImage ?? item.image,
            rating: getRatingForId(id),
            category: "Multi",
          };
        }),
    [location]
  );

  const hasActiveFilter = Boolean(appliedFilter) || appliedRatings.size > 0;

  const mapMarkers = useMemo(
    () => (hasActiveFilter ? filteredMarkers : [...filteredMarkers, ...savedLocationMarkers]),
    [hasActiveFilter, filteredMarkers, savedLocationMarkers]
  );

  const handleSearchSheetChange = (index: number) => {
    setSearchSheetIndex(index);
    setO(index === -1);
    setIsSheetOpen(index !== -1);
    if (index === -1 && route.name === "Search") {
      preserveDiscoverCamera = true;
      navigation.navigate(t("Discover"));
    }
  };

  const handleFilterSheetChange = (index: number) => {
    setO(index === -1);
    setIsSheetOpen(index !== -1);
  };

  const handleLocationSheetChange = (index: number) => {
    setO(index === -1);
    setIsSheetOpen(index !== -1);
  };

  const handleUserLocationUpdate = (coord: [number, number]) => {
    setUserCoord(coord);
  };

  const formatTitleFromId = useCallback((id: string) => {
    return id
      .replace(/[_-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, []);

  const categoryPlaceholderImages: Record<DiscoverCategory, any> = {
    Fitness: require("../assets/365.jpg"),
    Gastro: require("../assets/royal.jpg"),
    Relax: require("../assets/klub.jpg"),
    Beauty: require("../assets/royal.jpg"),
  };

  const markerBranchOverrides: Record<string, Partial<BranchData>> = useMemo(
    () => ({
      gym_365: { title: t("365 GYM Nitra"), image: require("../assets/365.jpg"), category: "Fitness" },
      gym_klub: { title: t("GYM KLUB"), image: require("../assets/klub.jpg"), category: "Fitness" },
      "Diamond gym": { title: t("Diamond Gym"), image: require("../assets/klub.jpg"), category: "Fitness" },
      "Diamond barber": { title: t("Diamond Barber"), image: require("../assets/royal.jpg"), category: "Beauty" },
    }),
    [t]
  );

  const buildBranchFromMarker = useCallback(
    (marker: DiscoverMapMarker): BranchData => {
      const override = markerBranchOverrides[marker.id] ?? {};
      const title = override.title ?? formatTitleFromId(marker.id);
      const category = override.category ?? (marker.category === "Multi" ? "" : marker.category);
      const resolvedCategory: DiscoverCategory | undefined =
        category && category !== "Multi" ? (category as DiscoverCategory) : undefined;
      const image =
        override.image ??
        (resolvedCategory ? categoryPlaceholderImages[resolvedCategory] : undefined) ??
        DUMMY_BRANCH.image;
      return {
        ...DUMMY_BRANCH,
        ...override,
        title,
        category: resolvedCategory ?? DUMMY_BRANCH.category ?? "Fitness",
        rating: marker.rating,
        distance: `${(Math.random() * 2 + 0.5).toFixed(1)} km`,
        hours: override?.hours ?? DUMMY_BRANCH.hours,
        image,
      };
    },
    [formatTitleFromId, markerBranchOverrides, categoryPlaceholderImages]
  );

  const fetchBranchForMarker = useCallback(
    async (marker: DiscoverMapMarker) => {
      const branch = await dataSource.getBranchById(marker.id);
      return branch ?? buildBranchFromMarker(marker);
    },
    [buildBranchFromMarker, dataSource]
  );

  const handleCameraChanged = useCallback(
    (center: [number, number], zoom: number, isUserGesture?: boolean) => {
      setMapZoom(zoom);
      if (route.name === "Search") {
        return;
      }
      setMapCenter(center);
      lastDiscoverCameraState = { center, zoom };
      if (!isUserGesture || !selectedOptionCoord) {
        return;
      }
      const [selectedLng, selectedLat] = selectedOptionCoord;
      const [centerLng, centerLat] = center;
      const distance = Math.hypot(selectedLng - centerLng, selectedLat - centerLat);
      if (distance > 0.0005) {
        setOption("yourLocation");
      }
    },
    [route.name, selectedOptionCoord]
  );

  const handleMarkerPress = (id: string) => {
    if (loading || error) return;
    if (!id || id === "") {
      setSelectedGroup(null);
      return;
    }

    const group = groupedMarkers.find((g) => g.id === id);
    if (!group) return;

    // Cierny PIN
    if (group.items.length > 1) {
      setSelectedGroup({
        coord: { lng: group.lng, lat: group.lat },
        items: group.items,
      });
      return;
    }

    // Klasicky PIN
    setSelectedGroup(null);

    const marker = group.items[0];
    fetchBranchForMarker(marker).then((branch) => {
      navigation.navigate("BusinessDetailScreen", {
        branch,
      });
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <DiscoverMap
        cameraRef={cameraRef}
        filteredMarkers={mapMarkers}
        onMarkerPress={handleMarkerPress}
        selectedGroup={selectedGroup}
        categoryIcons={FILTER_ICONS}
        onUserLocationUpdate={handleUserLocationUpdate}
        onCameraChanged={handleCameraChanged}
        mapZoom={mapZoom}
        cityCenter={NITRA_CENTER}
        isFilterActive={hasActiveFilter}
      />

      <DiscoverTopControls
        insetsTop={insets.top}
        open={open}
        setOpen={setOpen}
        location={location}
        setLocation={setLocation}
        option={option}
        setOption={setOption}
        o={o}
        sheetRef={sheetRef}
        filterRef={filterRef}
        userCoord={userCoord}
        mainMapCenter={mapCenter}
        cameraRef={cameraRef}
        t={t}
        onLocationSheetChange={handleLocationSheetChange}
      />
      <DiscoverSearchSheet
        sheetRef={sheetRef}
        snapPoints={snapPoints}
        onSheetChange={handleSearchSheetChange}
        sheetIndex={searchSheetIndex}
        text={text}
        setText={setText}
        filtered={filtered}
        t={t}
      />
      <DiscoverFilterSheet
        filterRef={filterRef}
        snapPoints={snapPoints}
        onSheetChange={handleFilterSheetChange}
        insetsBottom={insets.bottom}
        filter={filter}
        setFilter={setFilter}
        rating={ratingFilter}
        setRating={setRatingFilter}
        filterOptions={FILTER_OPTIONS}
        filterIcons={FILTER_ICONS}
        subcategories={SUBCATEGORIES}
        sub={sub}
        toggle={toggle}
        count={filterCount}
        setAppliedFilter={setAppliedFilter}
        setAppliedRatings={setAppliedRatings}
        setSub={setSub}
        subcategoryChipWidth={subcategoryChipWidth}
        t={t}
      />
      {!isSheetOpen && (
        <DiscoverBranchOverlay
          insetsBottom={insets.bottom}
          categoriesOpen={categoriesOpen}
          setCategoriesOpen={setCategoriesOpen}
          filterOptions={FILTER_OPTIONS}
          filterIcons={FILTER_ICONS}
          appliedFilter={appliedFilter}
          setAppliedFilter={setAppliedFilter}
          setFilter={setFilter}
          branches={filteredBranches}
          branchCardWidth={branchCardWidth}
          t={t}
        />
      )}
    </SafeAreaView>
  );
}
