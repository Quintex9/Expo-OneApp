type DiscoverDebugGlobal = typeof globalThis & {
  __ONEAPP_DISCOVER_DEBUG__?: boolean;
};

export const isDiscoverDebugEnabled = (): boolean =>
  __DEV__ && Boolean((globalThis as DiscoverDebugGlobal).__ONEAPP_DISCOVER_DEBUG__);

export const discoverDebugLog = (...args: unknown[]): void => {
  if (!isDiscoverDebugEnabled()) {
    return;
  }

  console.log(...args);
};
