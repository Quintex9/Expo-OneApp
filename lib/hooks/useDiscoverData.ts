/**
 * useDiscoverData: Hook use Discover Data zapúzdruje stav a udalosti pre svoju časť aplikačného flowu.
 *
 * Prečo: Presun stavovej logiky do hooku useDiscoverData znižuje komplexitu obrazoviek a uľahčuje opakované použitie.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageSourcePropType } from "react-native";
import type { DiscoverMapMarker } from "../interfaces";
import { useDataSource } from "../data/useDataSource";
import { AppConfig } from "../config/AppConfig";
import type {
  BranchDto,
  BranchViewModel,
  MarkerDto,
  MarkerViewModel,
} from "../data/models";
import {
  buildBranchFromMarkerViewModel,
  createMapperContext,
  groupMarkersByLocation,
  mapBranchDtoToViewModel,
  mapMarkerDtoToViewModel,
} from "../data/mappers";
import type { GroupedMarkerBucket } from "../data/mappers";
import type { MarkerBranchOverride } from "../data/config/markerOverrides";
import { getRatingForId } from "../data/normalizers";
import { normalizeCenter } from "../maps/camera";
import i18n from "../../i18n";

export interface UseDiscoverDataReturn {
  branches: BranchViewModel[];
  markers: MarkerViewModel[];
  groupedMarkers: GroupedMarkerBucket[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchBranchForMarker: (marker: MarkerViewModel) => Promise<BranchViewModel>;
  buildBranchFromMarker: (marker: MarkerViewModel) => BranchViewModel;
}

interface UseDiscoverDataOptions {
  t: (key: string) => string;
  markerBranchOverrides?: Record<string, MarkerBranchOverride>;
  enabled?: boolean;
  includeBranches?: boolean;
  includeMarkers?: boolean;
  includeGroupedMarkers?: boolean;
}

const EMPTY_BRANCHES: BranchViewModel[] = [];
const EMPTY_MARKERS: MarkerViewModel[] = [];
const EMPTY_GROUPED_MARKERS: GroupedMarkerBucket[] = [];
const EMPTY_BRANCH_DTOS: BranchDto[] = [];
const EMPTY_MARKER_DTOS: MarkerDto[] = [];

type AsyncCacheEntry<T> = {
  value: T | null;
  promise: Promise<T> | null;
};

type DiscoverDataSnapshot = {
  branches: BranchViewModel[];
  markers: MarkerViewModel[];
  groupedMarkers: GroupedMarkerBucket[];
};

const branchDtoCache = new Map<string, AsyncCacheEntry<BranchDto[]>>();
const markerDtoCache = new Map<string, AsyncCacheEntry<MarkerDto[]>>();
const discoverSnapshotCache = new Map<string, DiscoverDataSnapshot>();
const branchViewModelCache = new Map<string, BranchViewModel>();

const getAsyncCacheEntry = <T>(
  store: Map<string, AsyncCacheEntry<T>>,
  key: string
): AsyncCacheEntry<T> => {
  const existing = store.get(key);
  if (existing) {
    return existing;
  }

  const created: AsyncCacheEntry<T> = { value: null, promise: null };
  store.set(key, created);
  return created;
};

const loadCachedValue = async <T>(
  store: Map<string, AsyncCacheEntry<T>>,
  key: string,
  loader: () => Promise<T>,
  bypassCache: boolean
): Promise<T> => {
  const entry = getAsyncCacheEntry(store, key);

  if (!bypassCache && entry.value) {
    return entry.value;
  }

  if (!bypassCache && entry.promise) {
    return entry.promise;
  }

  const promise = loader()
    .then((value) => {
      entry.value = value;
      return value;
    })
    .finally(() => {
      if (entry.promise === promise) {
        entry.promise = null;
      }
    });

  entry.promise = promise;
  return promise;
};

const clearDiscoverDataCaches = (sourceKey: string) => {
  branchDtoCache.delete(sourceKey);
  markerDtoCache.delete(sourceKey);

  const sourcePrefix = `${sourceKey}|`;

  Array.from(discoverSnapshotCache.keys()).forEach((key) => {
    if (key.startsWith(sourcePrefix)) {
      discoverSnapshotCache.delete(key);
    }
  });

  Array.from(branchViewModelCache.keys()).forEach((key) => {
    if (key.startsWith(sourcePrefix)) {
      branchViewModelCache.delete(key);
    }
  });
};

const buildDiscoverSnapshot = ({
  branchDtos,
  markerDtos,
  mapperContext,
  includeBranches,
  includeMarkers,
  includeGroupedMarkers,
}: {
  branchDtos: BranchDto[];
  markerDtos: MarkerDto[];
  mapperContext: ReturnType<typeof createMapperContext>;
  includeBranches: boolean;
  includeMarkers: boolean;
  includeGroupedMarkers: boolean;
}): DiscoverDataSnapshot => {
  const markers = includeMarkers
    ? markerDtos.map((dto) => mapMarkerDtoToViewModel(dto, mapperContext))
    : EMPTY_MARKERS;
  const branches = includeBranches
    ? branchDtos.map((dto) => mapBranchDtoToViewModel(dto, mapperContext))
    : EMPTY_BRANCHES;

  return {
    branches,
    markers,
    groupedMarkers:
      includeMarkers && includeGroupedMarkers
        ? groupMarkersByLocation(markers)
        : EMPTY_GROUPED_MARKERS,
  };
};

export const useDiscoverData = ({
  t,
  markerBranchOverrides,
  enabled = true,
  includeBranches = true,
  includeMarkers = true,
  includeGroupedMarkers = true,
}: UseDiscoverDataOptions): UseDiscoverDataReturn => {
  const dataSource = useDataSource();
  const sourceCacheKey = AppConfig.dataSource;
  const localeKey = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const canUseSnapshotCache = markerBranchOverrides == null;
  const mapperContext = useMemo(
    () => createMapperContext({ t, markerBranchOverrides }),
    [markerBranchOverrides, t]
  );
  const snapshotCacheKey = useMemo(
    () =>
      canUseSnapshotCache
        ? `${sourceCacheKey}|${localeKey}|b${includeBranches ? 1 : 0}|m${
            includeMarkers ? 1 : 0
          }|g${includeGroupedMarkers ? 1 : 0}`
        : null,
    [
      canUseSnapshotCache,
      includeBranches,
      includeGroupedMarkers,
      includeMarkers,
      localeKey,
      sourceCacheKey,
    ]
  );
  const initialSnapshot =
    enabled && snapshotCacheKey ? discoverSnapshotCache.get(snapshotCacheKey) ?? null : null;

  const [branches, setBranches] = useState<BranchViewModel[]>(
    () => initialSnapshot?.branches ?? EMPTY_BRANCHES
  );
  const [markers, setMarkers] = useState<MarkerViewModel[]>(
    () => initialSnapshot?.markers ?? EMPTY_MARKERS
  );
  const [groupedMarkers, setGroupedMarkers] = useState<GroupedMarkerBucket[]>(
    () => initialSnapshot?.groupedMarkers ?? EMPTY_GROUPED_MARKERS
  );
  const [loading, setLoading] = useState(() => enabled && !initialSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let active = true;

    if (!enabled) {
      setBranches(EMPTY_BRANCHES);
      setMarkers(EMPTY_MARKERS);
      setGroupedMarkers(EMPTY_GROUPED_MARKERS);
      setError(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    if (snapshotCacheKey && fetchKey === 0) {
      const cachedSnapshot = discoverSnapshotCache.get(snapshotCacheKey);
      if (cachedSnapshot) {
        setBranches(cachedSnapshot.branches);
        setMarkers(cachedSnapshot.markers);
        setGroupedMarkers(cachedSnapshot.groupedMarkers);
        setError(null);
        setLoading(false);
        return () => {
          active = false;
        };
      }
    }

    setLoading(true);
    setError(null);

    Promise.all([
      includeBranches
        ? loadCachedValue(
            branchDtoCache,
            sourceCacheKey,
            () => dataSource.getBranches(),
            fetchKey > 0
          )
        : Promise.resolve(EMPTY_BRANCH_DTOS),
      includeMarkers
        ? loadCachedValue(
            markerDtoCache,
            sourceCacheKey,
            () => dataSource.getMarkers(),
            fetchKey > 0
          )
        : Promise.resolve(EMPTY_MARKER_DTOS),
    ])
      .then(([branchDtos, markerDtos]) => {
        if (!active) {
          return;
        }

        let snapshot =
          snapshotCacheKey && fetchKey === 0
            ? discoverSnapshotCache.get(snapshotCacheKey) ?? null
            : null;

        if (!snapshot) {
          snapshot = buildDiscoverSnapshot({
            branchDtos,
            markerDtos,
            mapperContext,
            includeBranches,
            includeMarkers,
            includeGroupedMarkers,
          });

          if (snapshotCacheKey) {
            discoverSnapshotCache.set(snapshotCacheKey, snapshot);
          }
        }

        setBranches(snapshot.branches);
        setMarkers(snapshot.markers);
        setGroupedMarkers(snapshot.groupedMarkers);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setError(loadError?.message ?? "Nepodarilo sa nacitat data");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    dataSource,
    enabled,
    fetchKey,
    includeBranches,
    includeGroupedMarkers,
    includeMarkers,
    mapperContext,
    snapshotCacheKey,
    sourceCacheKey,
  ]);

  const refetch = useCallback(() => {
    clearDiscoverDataCaches(sourceCacheKey);
    setFetchKey((current) => current + 1);
  }, [sourceCacheKey]);

  const buildBranchFromMarker = useCallback(
    (marker: MarkerViewModel) => {
      const cacheKey =
        canUseSnapshotCache && marker.id
          ? `${sourceCacheKey}|${localeKey}|branch|${marker.id}`
          : null;
      if (cacheKey) {
        const cached = branchViewModelCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const branch = buildBranchFromMarkerViewModel(marker, mapperContext);
      if (cacheKey) {
        branchViewModelCache.set(cacheKey, branch);
      }
      return branch;
    },
    [canUseSnapshotCache, localeKey, mapperContext, sourceCacheKey]
  );

  const fetchBranchForMarker = useCallback(
    async (marker: MarkerViewModel) => {
      const cacheKey =
        canUseSnapshotCache && marker.id
          ? `${sourceCacheKey}|${localeKey}|branch|${marker.id}`
          : null;
      if (cacheKey) {
        const cached = branchViewModelCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const branchDto = await dataSource.getBranchById(marker.id);
      const branch = branchDto
        ? mapBranchDtoToViewModel(branchDto, mapperContext)
        : buildBranchFromMarkerViewModel(marker, mapperContext);

      if (cacheKey) {
        branchViewModelCache.set(cacheKey, branch);
      }

      return branch;
    },
    [canUseSnapshotCache, dataSource, localeKey, mapperContext, sourceCacheKey]
  );

  return useMemo(
    () => ({
      branches,
      markers,
      groupedMarkers,
      loading,
      error,
      refetch,
      fetchBranchForMarker,
      buildBranchFromMarker,
    }),
    [
      branches,
      buildBranchFromMarker,
      error,
      fetchBranchForMarker,
      groupedMarkers,
      loading,
      markers,
      refetch,
    ]
  );
};

export const useSavedLocationMarkers = (
  locations: Array<{
    label: string;
    coord?: [number, number];
    isSaved?: boolean;
    image: ImageSourcePropType;
    markerImage?: ImageSourcePropType;
  }>
): DiscoverMapMarker[] => {
  return useMemo(
    () =>
      locations
        .filter(
          (item) =>
            item.isSaved &&
            Array.isArray(item.coord) &&
            Number.isFinite(item.coord[0]) &&
            Number.isFinite(item.coord[1])
        )
        .map((item, index) => {
          const coord = item.coord as [number, number];
          const [lng, lat] = normalizeCenter(coord);
          const id = `saved-${index}-${lng}-${lat}`;
          const rating = getRatingForId(id);

          return {
            id,
            title: item.label,
            coord: { lng, lat },
            icon: item.markerImage ?? item.image,
            useNativePin: true,
            rating,
            category: "Multi" as const,
            ratingFormatted: rating.toFixed(1),
          };
        }),
    [locations]
  );
};
