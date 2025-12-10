import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CustomTabBar from "./components/CustomTabBar";
import { TextEncoder, TextDecoder } from "text-encoding";

// Polyfill TextEncoder/TextDecoder for libraries (e.g., QR code) that expect them in React Native
// @ts-ignore
if (typeof global.TextEncoder === "undefined") {
  // @ts-ignore
  global.TextEncoder = TextEncoder;
}
// @ts-ignore
if (typeof global.TextDecoder === "undefined") {
  // @ts-ignore
  global.TextDecoder = TextDecoder;
}

import HomeScreen from "./screens/HomeScreen";
import BenefitsScreen from "./screens/BenefitsScreen";
import DiscoverScreen from "./screens/DiscoverScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="QR" component={HomeScreen} />
        <Tab.Screen name="Benefits" component={BenefitsScreen} />
        <Tab.Screen name="Discover" component={DiscoverScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
