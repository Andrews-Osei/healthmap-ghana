export type RiskTier =
  | "Critical Risk" | "High Risk" | "Moderate Risk" | "Low Risk" | "No Data Yet";

export type DataStatus = "scored" | "no_data_yet";

export interface District {
  district_id: string;
  district:    string;
  region:      string;
  rank:        number | null;
  CVI_0_100:   number | null;
  risk_tier:   RiskTier;
  data_status: DataStatus;
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
  pending_no_data: number;
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
  pipeline_version: string;
  generated_at: string;
  facility_count: number;
  district_count: number;
  district_count_scored: number;
  district_count_no_data_yet: number;
  district_count_canonical: number;
  coverage_pct: number;
  region_count:   number;
  tier_counts:    Record<string, number>;
  orphaned_districts: string[];
  weights:        Record<string, unknown>;
  data_sources:   Record<string, string>;
}

export interface CoverageEntry {
  ts: string;
  pipeline_version: string;
  scored: number;
  no_data_yet: number;
  canonical: number;
  coverage_pct: number;
  facilities: number;
}
