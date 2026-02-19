/**
 * feedReels: Fixture feed Reels poskytuje lokálne testovacie dáta pre vývojové scenáre.
 *
 * Prečo: Stabilné mock dáta v feedReels umožňujú rýchle overenie UI bez závislosti od backendu.
 */

export type ReelType = "image" | "video";

export const FEED_OFFER_KEYS = {
  discount20: "offer_discount20",
  freeEntryFriend: "offer_freeEntryFriend",
  discount10Monthly: "offer_discount10Monthly",
  discount15Today: "offer_discount15Today",
  twoForOne: "offer_twoForOne",
  firstMonthFree: "offer_firstMonthFree",
  personalTrainer: "offer_personalTrainer",
  discount25Weekend: "offer_discount25Weekend",
  freeTowel: "offer_freeTowel",
} as const;

export type FeedOfferKey = (typeof FEED_OFFER_KEYS)[keyof typeof FEED_OFFER_KEYS];

export const FEED_OFFER_DESCRIPTION_KEYS: Record<FeedOfferKey, string> = {
  [FEED_OFFER_KEYS.discount20]: "feedOfferDescDiscount20",
  [FEED_OFFER_KEYS.freeEntryFriend]: "feedOfferDescFreeEntryFriend",
  [FEED_OFFER_KEYS.discount10Monthly]: "feedOfferDescDiscount10Monthly",
  [FEED_OFFER_KEYS.discount15Today]: "feedOfferDescDiscount15Today",
  [FEED_OFFER_KEYS.twoForOne]: "feedOfferDescTwoForOne",
  [FEED_OFFER_KEYS.firstMonthFree]: "feedOfferDescFirstMonthFree",
  [FEED_OFFER_KEYS.personalTrainer]: "feedOfferDescPersonalTrainer",
  [FEED_OFFER_KEYS.discount25Weekend]: "feedOfferDescDiscount25Weekend",
  [FEED_OFFER_KEYS.freeTowel]: "feedOfferDescFreeTowel",
};

export const FEED_OFFER_DESCRIPTION_DEFAULTS: Record<FeedOfferKey, string> = {
  [FEED_OFFER_KEYS.discount20]: "Get 20% off your first entry when you activate this offer.",
  [FEED_OFFER_KEYS.freeEntryFriend]: "Bring your friend for free and train together today.",
  [FEED_OFFER_KEYS.discount10Monthly]: "Save 10% on your monthly pass this week.",
  [FEED_OFFER_KEYS.discount15Today]: "Use this offer today and get 15% off your purchase.",
  [FEED_OFFER_KEYS.twoForOne]: "Buy one entry and get the second one free.",
  [FEED_OFFER_KEYS.firstMonthFree]: "Start now and enjoy your first month free.",
  [FEED_OFFER_KEYS.personalTrainer]: "Get a guided session with a personal trainer included.",
  [FEED_OFFER_KEYS.discount25Weekend]: "Get 25% off selected services during the weekend.",
  [FEED_OFFER_KEYS.freeTowel]: "Receive a free towel service with your visit.",
};

export interface FeedReelItem {
  id: string;
  type: ReelType;
  background?: any;
  video?: any;
  poster?: any;
  branch: {
    title: string;
    image: any;
    images?: any[];
    rating: number;
    distance: string;
    hours: string;
    category: string;
    offerKeys: FeedOfferKey[];
  };
}

const FITNESS_GALLERY = [
  require("../../assets/gallery/fitness/fitness_1.jpg"),
  require("../../assets/gallery/fitness/fitness_2.jpg"),
  require("../../assets/gallery/fitness/fitness_3.jpg"),
  require("../../assets/gallery/fitness/fitness_4.jpg"),
];

export const FEED_REELS_DATA: FeedReelItem[] = [
  {
    id: "reel-1",
    type: "video",
    video: require("../../assets/stock/15859732.mp4"),
    poster: require("../../assets/feed1.jpg"),
    branch: {
      title: "RED ROYAL GYM",
      image: require("../../assets/365.jpg"),
      images: [require("../../assets/365.jpg"), ...FITNESS_GALLERY],
      rating: 4.6,
      distance: "1.7 km",
      hours: "9:00 - 21:00",
      category: "Fitness",
      offerKeys: [FEED_OFFER_KEYS.discount20, FEED_OFFER_KEYS.freeEntryFriend],
    },
  },
  {
    id: "reel-2",
    type: "video",
    video: require("../../assets/stock/10740030.mp4"),
    poster: require("../../assets/feed1.jpg"),
    branch: {
      title: "GYM KLUB",
      image: require("../../assets/klub.jpg"),
      images: [require("../../assets/klub.jpg"), ...FITNESS_GALLERY],
      rating: 4.7,
      distance: "2.1 km",
      hours: "8:00 - 22:00",
      category: "Fitness",
      offerKeys: [FEED_OFFER_KEYS.freeEntryFriend, FEED_OFFER_KEYS.discount10Monthly],
    },
  },
  {
    id: "reel-3",
    type: "video",
    video: require("../../assets/vertical1.mp4"),
    poster: require("../../assets/feed2.jpg"),
    branch: {
      title: "DIAMOND GYM",
      image: require("../../assets/royal.jpg"),
      images: [require("../../assets/royal.jpg"), ...FITNESS_GALLERY],
      rating: 4.4,
      distance: "1.3 km",
      hours: "7:00 - 20:00",
      category: "Fitness",
      offerKeys: [FEED_OFFER_KEYS.discount15Today, FEED_OFFER_KEYS.twoForOne],
    },
  },
  {
    id: "reel-4",
    type: "video",
    video: require("../../assets/stock/15859732.mp4"),
    poster: require("../../assets/feed2.jpg"),
    branch: {
      title: "FLEX FITNESS",
      image: require("../../assets/klub.jpg"),
      images: [require("../../assets/klub.jpg"), ...FITNESS_GALLERY],
      rating: 4.8,
      distance: "0.9 km",
      hours: "6:00 - 23:00",
      category: "Fitness",
      offerKeys: [FEED_OFFER_KEYS.firstMonthFree, FEED_OFFER_KEYS.personalTrainer],
    },
  },
  {
    id: "reel-5",
    type: "video",
    video: require("../../assets/stock/10740030.mp4"),
    poster: require("../../assets/feed3.jpg"),
    branch: {
      title: "POWER ZONE",
      image: require("../../assets/royal.jpg"),
      images: [require("../../assets/royal.jpg"), ...FITNESS_GALLERY],
      rating: 4.5,
      distance: "3.2 km",
      hours: "7:00 - 22:00",
      category: "Fitness",
      offerKeys: [FEED_OFFER_KEYS.discount25Weekend, FEED_OFFER_KEYS.freeTowel],
    },
  },
];
