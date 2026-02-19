import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CardsScreen from "../screens/CardsScreen";
import CardsAddChooseScreen from "../screens/CardsAddChooseScreen";
import CardsAddNewCardScreen from "../screens/CardsAddNewCardScreen";
import CardsAddEnterManuallyScreen from "../screens/CardsAddEnterManuallyScreen";
import CardsAddOtherCardNameScreen from "../screens/CardsAddOtherCardNameScreen";
import QRScreen from "../screens/QRScreen";
import LoyaltyCardDetailScreen from "../screens/LoyaltyCardDetailScreen";

const Stack = createNativeStackNavigator();

/**
 * CardsStack: Definuje stack flow pre sekciu kariet (zoznam, pridanie, sken a detailné kroky).
 *
 * Prečo: Oddelený stack drží vlastnú históriu kariet bez ovplyvnenia zvyšku tab navigácie.
 */
export default function CardsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CardsList" component={CardsScreen} />
      <Stack.Screen name="CardsAddChoose" component={CardsAddChooseScreen} />
      <Stack.Screen name="CardsAddNewCard" component={CardsAddNewCardScreen} />
      <Stack.Screen name="CardsAddEnterManually" component={CardsAddEnterManuallyScreen} />
      <Stack.Screen name="CardsAddOtherCardName" component={CardsAddOtherCardNameScreen} />
      <Stack.Screen
        name="CardsUserQR"
        component={QRScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen name="CardsSelectedCard" component={LoyaltyCardDetailScreen} />
    </Stack.Navigator>
  );
}
