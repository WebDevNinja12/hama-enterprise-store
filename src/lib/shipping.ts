/** Nigeria shipping rules for HAMA ENTERPRISE NG (amounts in USD to match store). */

export const FREE_SHIPPING_MIN = 500;

export type ShippingZone =
  | "lagos"
  | "abuja"
  | "south_west"
  | "south_south"
  | "south_east"
  | "north_central"
  | "north_west"
  | "north_east"
  | "other";

export const NIGERIA_STATES: { name: string; zone: ShippingZone }[] = [
  { name: "Lagos", zone: "lagos" },
  { name: "FCT - Abuja", zone: "abuja" },
  { name: "Ogun", zone: "south_west" },
  { name: "Oyo", zone: "south_west" },
  { name: "Osun", zone: "south_west" },
  { name: "Ondo", zone: "south_west" },
  { name: "Ekiti", zone: "south_west" },
  { name: "Edo", zone: "south_south" },
  { name: "Delta", zone: "south_south" },
  { name: "Rivers", zone: "south_south" },
  { name: "Bayelsa", zone: "south_south" },
  { name: "Akwa Ibom", zone: "south_south" },
  { name: "Cross River", zone: "south_south" },
  { name: "Anambra", zone: "south_east" },
  { name: "Enugu", zone: "south_east" },
  { name: "Imo", zone: "south_east" },
  { name: "Abia", zone: "south_east" },
  { name: "Ebonyi", zone: "south_east" },
  { name: "Kogi", zone: "north_central" },
  { name: "Kwara", zone: "north_central" },
  { name: "Niger", zone: "north_central" },
  { name: "Plateau", zone: "north_central" },
  { name: "Benue", zone: "north_central" },
  { name: "Nasarawa", zone: "north_central" },
  { name: "Kaduna", zone: "north_west" },
  { name: "Kano", zone: "north_west" },
  { name: "Katsina", zone: "north_west" },
  { name: "Sokoto", zone: "north_west" },
  { name: "Kebbi", zone: "north_west" },
  { name: "Zamfara", zone: "north_west" },
  { name: "Jigawa", zone: "north_west" },
  { name: "Bauchi", zone: "north_east" },
  { name: "Borno", zone: "north_east" },
  { name: "Yobe", zone: "north_east" },
  { name: "Adamawa", zone: "north_east" },
  { name: "Gombe", zone: "north_east" },
  { name: "Taraba", zone: "north_east" },
];

const ZONE_RATES: Record<ShippingZone, number> = {
  lagos: 8,
  abuja: 12,
  south_west: 15,
  south_south: 18,
  south_east: 18,
  north_central: 20,
  north_west: 22,
  north_east: 25,
  other: 30,
};

export function zoneForState(stateName: string): ShippingZone {
  const found = NIGERIA_STATES.find(
    (s) => s.name.toLowerCase() === stateName.trim().toLowerCase()
  );
  return found?.zone ?? "other";
}

export function calcShipping(subtotal: number, stateName: string): {
  shipping: number;
  zone: ShippingZone;
  free: boolean;
  label: string;
} {
  if (subtotal <= 0) {
    return { shipping: 0, zone: "other", free: true, label: "No items" };
  }
  if (subtotal >= FREE_SHIPPING_MIN) {
    return {
      shipping: 0,
      zone: zoneForState(stateName),
      free: true,
      label: `Free shipping (orders $${FREE_SHIPPING_MIN}+)`,
    };
  }
  const zone = zoneForState(stateName);
  const shipping = ZONE_RATES[zone];
  return {
    shipping,
    zone,
    free: false,
    label: `Standard delivery — ${stateName || "Nigeria"}`,
  };
}

/** Simple NG phone check: 10–14 digits after stripping spaces */
export function isValidNgPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  // 0803… (11) or 234803… (13–14)
  return digits.length >= 10 && digits.length <= 14;
}
