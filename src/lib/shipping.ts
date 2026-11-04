/** Nigeria shipping zones and rates (NGN). */

export const FREE_SHIPPING_MIN = 50_000;

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

/** Flat rates in NGN by zone */
const ZONE_RATES: Record<ShippingZone, number> = {
  lagos: 2_500,
  abuja: 3_500,
  south_west: 4_000,
  south_south: 5_000,
  south_east: 5_000,
  north_central: 5_500,
  north_west: 6_000,
  north_east: 6_500,
  other: 7_500,
};

export function zoneForState(
  stateName: string | number | null | undefined
): ShippingZone {
  const name = String(stateName ?? "").trim().toLowerCase();
  if (!name) return "other";
  const found = NIGERIA_STATES.find((s) => s.name.toLowerCase() === name);
  return found?.zone ?? "other";
}

function formatNgn(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

export function calcShipping(
  subtotal: number,
  stateName: string
): {
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
      label: `Free shipping (orders ${formatNgn(FREE_SHIPPING_MIN)}+)`,
    };
  }
  const zone = zoneForState(stateName);
  const shipping = ZONE_RATES[zone];
  return {
    shipping,
    zone,
    free: false,
    label: `Shipping to ${String(stateName || "Nigeria")} (${zone.replace(/_/g, " ")})`,
  };
}

/** Basic NG phone check: 11 digits starting with 0, or +234 */
export function isValidNgPhone(phone: string): boolean {
  const p = String(phone || "").replace(/\s|-/g, "");
  if (/^0[789]\d{9}$/.test(p)) return true;
  if (/^\+?234[789]\d{9}$/.test(p)) return true;
  return p.length >= 10 && p.length <= 15;
}
