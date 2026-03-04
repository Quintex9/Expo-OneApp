/**
 * branchDtos: Fixture branch Dtos poskytuje lokálne testovacie dáta pre vývojové scenáre.
 *
 * Prečo: Stabilné mock dáta v branchDtos umožňujú rýchle overenie UI bez závislosti od backendu.
 */

import type { BranchDto } from "../data/models";
import { getMockBranchSearchMetadata } from "../data/search/mockBranchSearchMetadata";

// Kluce pre ponuky (prekladaju sa az vo ViewModel vrstve).
const OFFER_KEYS = {
  discount20: "offer_discount20",
  freeEntryFriend: "offer_freeEntryFriend",
  discount15Today: "offer_discount15Today",
  firstMonthFree: "offer_firstMonthFree",
};

const withSearchMetadata = (branch: BranchDto): BranchDto => ({
  ...branch,
  ...getMockBranchSearchMetadata(branch.id, branch.category, branch.title),
});

// Mock DTO data pripraveny pre backend kontrakt.
const baseBranchDtos: BranchDto[] = [
  {
    id: "gym_365",
    title: "365 GYM Nitra",
    category: "Fitness",
    coordinates: [18.0802065, 48.3093],
    rating: 4.6,
    distance: "1.7 km",
    hours: "9:00 - 21:00",
    discountKey: OFFER_KEYS.discount20,
    offersKeys: [OFFER_KEYS.discount20, OFFER_KEYS.freeEntryFriend],
    moreCount: 2,
    address: "Štúrova 1434/18, Nitra",
    phone: "+421903776925",
    email: "info@365gym.sk",
    website: "https://365gym.sk",
  },
  {
    id: "royal_gym",
    title: "RED ROYAL GYM",
    category: "Fitness",
    coordinates: [18.103917, 48.317241],
    rating: 4.6,
    distance: "1.7 km",
    hours: "9:00 - 21:00",
    discountKey: OFFER_KEYS.discount15Today,
    offersKeys: [OFFER_KEYS.discount15Today, OFFER_KEYS.freeEntryFriend],
    moreCount: 3,
    address: "Chrenovská 1661/30, Nitra",
    phone: "+421911222333",
    email: "info@redroyal.sk",
    website: "https://redroyal.sk",
  },
  {
    id: "gym_klub",
    title: "GYM KLUB",
    category: "Fitness",
    coordinates: [18.1088033, 48.3102871],
    rating: 4.6,
    distance: "1.7 km",
    hours: "9:00 - 21:00",
    discountKey: OFFER_KEYS.firstMonthFree,
    offersKeys: [OFFER_KEYS.firstMonthFree, OFFER_KEYS.freeEntryFriend],
    moreCount: 5,
    address: "Kremnická, Nitra",
    phone: "+421904555666",
    email: "kontakt@gymklub.sk",
    website: "https://gymklub.sk",
  },
  {
    id: "Diamond gym",
    title: "Diamond Gym",
    category: "Fitness",
    coordinates: [18.0668, 48.2923],
    rating: 4.4,
    distance: "1.5 km",
    hours: "9:00 - 21:00",
    discountKey: OFFER_KEYS.discount20,
    offersKeys: [OFFER_KEYS.discount20],
    address: "Jána Mrvu 1699/44, Nitra",
  },
  {
    id: "Diamond barber",
    title: "Diamond Barber",
    category: "Beauty",
    coordinates: [18.0668, 48.2923],
    rating: 4.6,
    distance: "1.5 km",
    hours: "9:00 - 21:00",
    discountKey: OFFER_KEYS.discount20,
    offersKeys: [OFFER_KEYS.discount20],
    address: "Jána Mrvu 1699/44, Nitra",
  },
];

export const branchDtosFixture: BranchDto[] = baseBranchDtos.map(withSearchMetadata);
