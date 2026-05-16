export type RiskTier =
  | "Critical Risk" | "High Risk" | "Moderate Risk" | "Low Risk";

export interface District {
  district_id: string;
  district:    string;
  region:      string;
  rank:        number;
  CVI_0_100:   number;
  risk_tier:   RiskTier;
  total_facilities:    number;
  hospitals_clinics:   number;
  pharmacies:          number;
  type_diversity:      number;
  median_nn_km_hosp:   number | null;
  hosp_per_100k:       number;
  pharm_per_100k:      number;
  facilities_per_100k: number;
  district_pop_proxy:  number;
  region_population_2021: number;
  is_urban:    number;
  lat_centroid: number;
  lon_centroid: number;
}

export interface Recommendation {
  id: string;
  title: string;
  rationale: string;
  priority_score: number;
}

export interface DistrictDetail extends District {
  recommendations: Recommendation[];
}

export interface RegionSummary {
  region: string;
  districts: number;
  total_facilities: number;
  mean_facilities_per_100k: number;
  mean_hosp_per_100k: number;
  mean_CVI: number;
  population_2021: number;
  critical_count: number;
  high_count: number;
}

export interface Facility {
  id: string;
  name: string | null;
  amenity: string;
  healthcare: string | null;
  region: string | null;
  district: string | null;
  lat: number;
  lon: number;
}

export interface ForecastRow {
  district: string;
  region:   string;
  year:     number;
  projected_pop: number;
  current_facilities:    number;
  required_facilities:   number;
  projected_shortfall:   number;
}

export interface Manifest {
  generated_at: string;
  facility_count: number;
  district_count: number;
  region_count:   number;
  tier_counts:    Record<string, number>;
  weights:        Record<string, unknown>;
  data_sources:   Record<string, string>;
}
