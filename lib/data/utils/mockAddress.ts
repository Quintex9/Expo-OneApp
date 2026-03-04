import { normalizeId } from "./id";

const MOCK_BRANCH_ADDRESS_OVERRIDES: Record<string, string> = {
  top_sport_gym: "Hollého, Nitra",
  gym_365: "Štúrova 1434/18, Nitra",
  diamond_gym: "Štúrova 1441/46, Nitra",
  gym_klub: "Kremnická, Nitra",
  kelo_gym: "Hattalova 430/19, Nitra",
  pizza_nitra: "Čajkovského, Nitra",
  pko_nitra: "Janka Kráľa 1048/4, Nitra",
  staromestska_pivaren: "Štefánikova trieda 73/48, Nitra",
  tardis_cokina: "Mlynská 120/3, Nitra",
  misap_thai_massage: "Kmeťova 4501/13, Nitra",
  wellness_zoborska: "Dolnozoborská 13/8, Nitra",
  diamond_barbershop: "Mostná, Nitra",
  beauty_style: "Mostná 207/15, Nitra",
  kadernictvo_kozmetika: "Za Ferenitkou 138/29, Nitra",
  kozmetika_lussy: "Ďurková, Nitra",
  kozmetika_solarium_kadernictvo: "Štúrova, Nitra",
  bodyworld_fitness: "Chrenovská 1661/30, Nitra",
  biotechusa: "Chrenovská 1661/30, Nitra",
  fabrique_fitness: "Jelenecká 4815/50, Nitra",
  posilnovna_chalupkova: "Chalupkova, Nitra",
  fyzio_romy: "Jelenecká, Nitra",
  bistro_maurus: "Beethovenova 655/20, Nitra",
  bistro_u_havrana: "Družstevná, Nitra",
  cafe_bistro_medic: "Čajkovského, Nitra",
  kebab_bistro_chrenovska: "Chrenovská 5152/34, Nitra",
  kadernictvo_affinage: "Štefánikova trieda 77/54, Nitra",
  kadernictvo_pelikan: "Staničná, Nitra",
  nechtove_studio_kremnicka: "Kremnická, Nitra",
  soy_beauty: "Kasalova 578/21, Nitra",
  kozmeticky_salon_lenka: "Ďumbierska, Nitra",
  cajdolska_viecha: "Šúdolská, Nitra",
  dinero_pizza_drazovce: "Kultúrna 132/2, Nitra",
  fitcentrum_linia: "Kúpeľná, Nitra",
  vita_verde: "Podzámska, Nitra",
  aero_bistro_janikovce: "Dlhá, Nitra",
  bar_u_dvoch_sestier: "Dlhá 487/106, Nitra",
  bistro_harley: "K rieke, Nitra",
  tayberr_massage: "Farská 2888/45, Nitra",
  fit_club_olympia: "Chrenovská 22/16, Nitra",
  restauracia_naj_krskany: "Novozámocká, Nitra",
  tantal_mlynarce: "Bratislavská, Nitra",
  parovske_haje_center: "Sv. Huberta 5282/1, Nitra",
  bc_burger: "Hviezdoslavova trieda, Nitra",
  salon_shine: "Novomeského, Nitra",
  artin_restaurant: "Svätourbanská 2565/49, Nitra",
  kadernictvo_katarina: "Tatarkova, Nitra",
  fit_bar_nitra: "Chalupkova, Nitra",
  sport_caffe_nitra: "Dolnočermánska, Nitra",
  sportisimo_galeria_nitra: "Dolnočermánska 818/70, Nitra",
  sportisimo_centro_nitra: "Akademická, Nitra",
  intersport_mlyny_nitra: "Štúrova, Nitra",
  intersport_promenada_nitra: "Lomnická 51, Nitra",
  city_sports_nitra: "Palárikova, Nitra",
  exisport_centro_nitra: "Akademická, Nitra",
  for_sport_nitra: "Staré Mesto 2641, Nitra",
  mcdonalds_chrenova: "Štúrova, Nitra",
  media_cafe_restaurant: "Fraňa Mojtu, Nitra",
  la_marina_nitra: "Kupecká, Nitra",
  pizza_diamo_nitra: "Trieda Andreja Hlinku, Nitra",
  riverside_nitra: "Nábrežie mládeže, Nitra",
  u_zlatej_svini: "Dolnozoborská, Nitra",
  ceska_hospudka_u_slovaka: "Dolnozoborská, Nitra",
  karla_restaurant_nitra: "Wilsonovo nábrežie 162/88, Nitra",
  sakura_nitra_central: "Štefánikova trieda 36/63, Nitra",
  cajovna_dobrych_ludi: "Pri synagóge 1387/3, Nitra",
  cajovna_epicure: "Mlynská 122/2, Nitra",
  cajovna_uno_nitra: "Podzámska, Nitra",
  chill_cafe_nitra: "Družstevná, Nitra",
  piano_cafe_nitra: "Farská 1340/46, Nitra",
  caffe_comfort_nitra: "Farská 1339/44, Nitra",
  castellum_cafe_nitra: "Námestie Jána Pavla II., Nitra",
  coffee_tree_friends: "Palárikova, Nitra",
  park_espresso_nitra: "Dopravné ihrisko, Nitra",
  salon_maria_nitra: "Kúpeľná, Nitra",
  fashion_k_z_nitra: "Kremnická, Nitra",
  kadernictvo_klier_centro: "Trieda Andreja Hlinku, Nitra",
  kadernictvo_klier_promenada: "Lomnická, Nitra",
  salon_krasy_xoxo: "Nová, Nitra",
  viet_nails_nitra: "Štúrova, Nitra",
  natali_hair_nitra: "Výstavná, Nitra",
  kadernictvo_naty_nitra: "Ďurková 1180/20, Nitra",
  balance_beauty_nitra: "Nedbalova, Nitra",
  "diamond gym": "Jána Mrvu 1699/44, Nitra",
  "diamond barber": "Jána Mrvu 1699/44, Nitra",
  center_stack_bistro: "Akademická, Nitra",
  center_stack_beauty: "Akademická, Nitra",
  center_stack_relax: "Akademická, Nitra",
  marianska_stack_gastro: "Mlynská 2670/4A, Nitra",
  marianska_stack_gastro_2: "Mlynská 2670/4A, Nitra",
};

const MOCK_STREETS = [
  "Stefanikova trieda",
  "Mostna",
  "Farska",
  "Kupecka",
  "Piaristicka",
  "Schurmannova",
  "Coboriho",
  "Mlynska",
  "Dlha",
  "Braneckeho",
  "Nabrezie mladeze",
  "Akademicka",
  "Krizna",
  "Mikoviniho",
  "Benkova",
  "Jelenecka",
  "Sturova",
  "Pallova",
  "Razusova",
  "Sikarska",
] as const;

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export const buildMockBranchAddress = (id: string, city = "Nitra"): string => {
  const canonical = normalizeId(id) || "mock-branch";
  const override = MOCK_BRANCH_ADDRESS_OVERRIDES[canonical];
  if (override) {
    return override;
  }
  const hash = hashString(canonical);
  const street = MOCK_STREETS[hash % MOCK_STREETS.length] ?? "Hlavna";
  const houseNumber = (hash % 97) + 1;
  return `${street} ${houseNumber}, ${city}`;
};
