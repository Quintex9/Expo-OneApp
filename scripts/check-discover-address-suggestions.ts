import assert from "node:assert/strict";
import type { BranchData, Location } from "../lib/interfaces";
import { buildMockBranchAddress } from "../lib/data/utils/mockAddress";
import {
  buildDiscoverAddressSuggestions,
  filterDiscoverAddressSuggestions,
} from "../lib/discover/discoverSearchUtils";

const branches: BranchData[] = [
  {
    id: "branch-1",
    title: "Piano Cafe",
    image: 1,
    coordinates: [18.08731, 48.30882],
    rating: 4.8,
    distance: "0.4 km",
    hours: "8-20",
    address: "Hlavna 12, Nitra",
  },
  {
    id: "branch-2",
    title: "Wellness House",
    image: 1,
    coordinates: [18.0878, 48.3091],
    rating: 4.6,
    distance: "0.8 km",
    hours: "9-21",
    address: "Hlavna 12, Nitra",
  },
  {
    id: "branch-3",
    title: "Salon Mostna",
    image: 1,
    coordinates: [18.0901, 48.3076],
    rating: 4.7,
    distance: "1.2 km",
    hours: "10-18",
    address: "Mostna 42, Nitra",
  },
];

const locations: Location[] = [
  {
    image: 1,
    label: "Hlavna 12, Nitra",
    coord: [18.08731, 48.30882],
    isSaved: true,
    markerImage: 1,
  },
];

const allSuggestions = buildDiscoverAddressSuggestions({ branches, locations });
assert.equal(allSuggestions.length, 2, "duplicate branch addresses should be deduped");

const hlavna = allSuggestions.find((item) => item.label === "Hlavna 12, Nitra");
assert.ok(hlavna, "expected Hlavna 12, Nitra suggestion");
assert.equal(hlavna?.isSaved, true, "existing saved location should mark the suggestion as saved");

const filtered = filterDiscoverAddressSuggestions(allSuggestions, "mostna");
assert.equal(filtered.length, 1, "query should narrow suggestions");
assert.equal(filtered[0]?.label, "Mostna 42, Nitra");

const diacriticInsensitive = filterDiscoverAddressSuggestions(allSuggestions, "hlavna 12");
assert.equal(diacriticInsensitive.length, 1, "normalized query should match plain-text address");

const generatedAddressA = buildMockBranchAddress("mock_branch_alpha");
const generatedAddressB = buildMockBranchAddress("mock_branch_beta");
assert.notEqual(generatedAddressA, generatedAddressB, "generated mock addresses should be stable and unique");
assert.match(generatedAddressA, /, Nitra$/, "generated mock addresses should look like city addresses");
assert.equal(
  buildMockBranchAddress("gym_365"),
  "Štúrova 1434/18, Nitra",
  "known mock businesses should use static real-address overrides"
);

console.log("discover address suggestions: ok");
