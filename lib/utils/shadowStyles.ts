// shadowStyles: helpery pre jednotne tiene v UI.
// Zodpovednost: drzat opakovane shadow hodnoty na jednom mieste.
// Vstup/Vystup: export style objektov pre iOS/Android tiene.

import { Platform, ViewStyle } from "react-native";

interface ShadowProps {
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  shadowOffset?: { width: number; height: number };
  elevation?: number;
}

/**
 * Creates platform-appropriate shadow styles
 * Uses boxShadow for web, shadow* props for native
 */
export function createShadowStyle(props: ShadowProps): ViewStyle {
  if (Platform.OS === "web") {
    const { shadowColor = "#000", shadowOpacity = 0.3, shadowRadius = 0, shadowOffset = { width: 0, height: 0 } } = props;
    const color = shadowColor || "#000";
    const opacity = shadowOpacity || 0.3;
    const radius = shadowRadius || 0;
    const offsetX = shadowOffset?.width || 0;
    const offsetY = shadowOffset?.height || 0;
    
    // Convert rgba color if needed
    let rgbaColor = color;
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${rgbaColor}`,
    };
  }
  
  return {
    shadowColor: props.shadowColor,
    shadowOpacity: props.shadowOpacity,
    shadowRadius: props.shadowRadius,
    shadowOffset: props.shadowOffset,
    elevation: props.elevation,
  };
}
