export const LISTING_TYPES = [
  { value: "buy_property", label: "Buy Property" },
  { value: "buy_land", label: "Buy land to build homestay" },
  { value: "buy_airbnb_profile", label: "Buy Airbnb Profile" },
  { value: "buy_airbnb_business", label: "Buy Airbnb Business" },
] as const;

export const LISTING_TYPE_VALUES = LISTING_TYPES.map((t) => t.value) as [
  (typeof LISTING_TYPES)[number]["value"],
  ...(typeof LISTING_TYPES)[number]["value"][],
];

