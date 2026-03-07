import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

const isAppStateActive = (state?: AppStateStatus | null): boolean =>
  state == null || state === "active";

export const useAppStateActive = (): boolean => {
  const [active, setActive] = useState<boolean>(isAppStateActive(AppState.currentState));

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      setActive(isAppStateActive(nextState));
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return active;
};
