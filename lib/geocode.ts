type NominatimAddress = {
  pub?: string;
  bar?: string;
  amenity?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
};

// Nominatim/OpenStreetMap: gratuito, senza chiave API, limite ~1 richiesta/sec —
// adatto al traffico basso di un'app tra amici.
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18`,
    );
    if (!res.ok) return null;
    const data: { name?: string; display_name?: string; address?: NominatimAddress } =
      await res.json();
    const a = data.address ?? {};
    const place = data.name || a.pub || a.bar || a.amenity || a.road;
    const city = a.city || a.town || a.village || a.suburb;

    if (place && city && place !== city) return `${place}, ${city}`;
    if (place) return place;
    if (city) return city;
    return data.display_name?.split(",").slice(0, 2).join(",").trim() ?? null;
  } catch {
    return null;
  }
}
