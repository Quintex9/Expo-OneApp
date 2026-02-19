/**
 * mockBranchMenu: Menu modul mock Branch Menu poskytuje fallback položky menu alebo cenníka pre detail podniku.
 *
 * Prečo: Fallback obsah v mockBranchMenu drží konzistentný zážitok aj pri nekompletných backend dátach.
 */

import type { DiscoverCategory, BranchMenuLabelMode } from "../../interfaces";
import type { BranchMenuItemDto } from "../models";

const normalizeCategory = (value?: string | null): DiscoverCategory => {
  const key = String(value ?? "").trim().toLowerCase();
  if (key === "gastro" || key === "food" || key === "jedlo") return "Gastro";
  if (key === "relax" || key === "wellness") return "Relax";
  if (key === "beauty" || key === "krasa" || key === "kozmetika") return "Beauty";
  return "Fitness";
};

const FITNESS_MENU: BranchMenuItemDto[] = [
  {
    id: "f-1",
    name: "businessMenuFitnessItem1Name",
    details: "businessMenuFitnessItem1Details",
    price: "9 EUR",
  },
  {
    id: "f-2",
    name: "businessMenuFitnessItem2Name",
    details: "businessMenuFitnessItem2Details",
    price: "25 EUR",
  },
  {
    id: "f-3",
    name: "businessMenuFitnessItem3Name",
    details: "businessMenuFitnessItem3Details",
    price: "39 EUR",
  },
  {
    id: "f-4",
    name: "businessMenuFitnessItem4Name",
    details: "businessMenuFitnessItem4Details",
    price: "59 EUR",
  },
];

const GASTRO_MENU: BranchMenuItemDto[] = [
  {
    id: "g-1",
    name: "businessMenuGastroItem1Name",
    details: "businessMenuGastroItem1Details",
    price: "11.90 EUR",
  },
  {
    id: "g-2",
    name: "businessMenuGastroItem2Name",
    details: "businessMenuGastroItem2Details",
    price: "8.20 EUR",
  },
  {
    id: "g-3",
    name: "businessMenuGastroItem3Name",
    details: "businessMenuGastroItem3Details",
    price: "6.90 EUR",
  },
  {
    id: "g-4",
    name: "businessMenuGastroItem4Name",
    details: "businessMenuGastroItem4Details",
    price: "6.50 EUR",
  },
];

const RELAX_MENU: BranchMenuItemDto[] = [
  {
    id: "r-1",
    name: "businessMenuRelaxItem1Name",
    details: "businessMenuRelaxItem1Details",
    price: "39 EUR",
  },
  {
    id: "r-2",
    name: "businessMenuRelaxItem2Name",
    details: "businessMenuRelaxItem2Details",
    price: "18 EUR",
  },
  {
    id: "r-3",
    name: "businessMenuRelaxItem3Name",
    details: "businessMenuRelaxItem3Details",
    price: "29 EUR",
  },
  {
    id: "r-4",
    name: "businessMenuRelaxItem4Name",
    details: "businessMenuRelaxItem4Details",
    price: "24 EUR",
  },
];

const BEAUTY_MENU: BranchMenuItemDto[] = [
  {
    id: "b-1",
    name: "businessMenuBeautyItem1Name",
    details: "businessMenuBeautyItem1Details",
    price: "26 EUR",
  },
  {
    id: "b-2",
    name: "businessMenuBeautyItem2Name",
    details: "businessMenuBeautyItem2Details",
    price: "24 EUR",
  },
  {
    id: "b-3",
    name: "businessMenuBeautyItem3Name",
    details: "businessMenuBeautyItem3Details",
    price: "35 EUR",
  },
  {
    id: "b-4",
    name: "businessMenuBeautyItem4Name",
    details: "businessMenuBeautyItem4Details",
    price: "29 EUR",
  },
];

const MENU_BY_CATEGORY: Record<DiscoverCategory, BranchMenuItemDto[]> = {
  Fitness: FITNESS_MENU,
  Gastro: GASTRO_MENU,
  Relax: RELAX_MENU,
  Beauty: BEAUTY_MENU,
};

export const resolveBranchMenuLabelMode = (category?: string | null): BranchMenuLabelMode =>
  normalizeCategory(category) === "Gastro" ? "menu" : "pricelist";

export const getMockBranchMenuItems = (category?: string | null): BranchMenuItemDto[] =>
  MENU_BY_CATEGORY[normalizeCategory(category)];

