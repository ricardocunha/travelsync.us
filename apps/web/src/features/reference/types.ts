export type Region = {
  id: number;
  name: string;
};

export type Country = {
  id: number;
  name: string;
  iso_code: string;
  alt_code: string;
};

export type Airport = {
  id: number;
  name: string;
  city: string;
  country_id: number;
  iata_code: string;
  icao_code: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timezone_offset: number;
  timezone_code: string;
  type: string;
};

export type Destination = {
  id: number;
  name: string;
  country_id: number;
  region_id: number;
  latitude: number;
  longitude: number;
  timezone: string;
  is_active: boolean;
};
