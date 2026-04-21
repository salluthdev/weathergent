export interface CityConfig {
  slug: string;
  name: string;
  station: string;
  icao: string;
  timezone: string;
  polySlug: string;
}

export const CITIES: CityConfig[] = [
  {
    slug: "new-york",
    name: "New York",
    station: "KLGA:9:US",
    icao: "KLGA",
    timezone: "America/New_York",
    polySlug: "nyc",
  },
  {
    slug: "london",
    name: "London",
    station: "EGLC:9:GB",
    icao: "EGLC",
    timezone: "Europe/London",
    polySlug: "london",
  },
];

export const getCityBySlug = (slug: string) => {
  return CITIES.find((c) => c.slug === slug);
};
