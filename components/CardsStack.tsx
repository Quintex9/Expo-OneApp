import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CardsScreen from "../screens/CardsScreen";
import CardsAddScreen from "../screens/CardsAddScreen";

const Stack = createNativeStackNavigator();

export default function CardsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CardsList" component={CardsScreen} />
      <Stack.Screen name="CardsAdd" component={CardsAddScreen} />
    </Stack.Navigator>
  );
}
