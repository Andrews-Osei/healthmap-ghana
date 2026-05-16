import { create } from "zustand";
import type { District, RegionSummary, Facility } from "@/lib/types";

type Filters = {
  region:    string | "All";
  amenity:   string | "All";
  riskTier:  string | "All";
  urbanRural: "All" | "Urban" | "Rural";
};

interface State {
  // data
  districts:  District[];
  regions:    RegionSummary[];
  facilities: Facility[];
  loading: boolean;
  error: string | null;

  // ui
  selected:  District | null;
  filters:   Filters;

  // actions
  setData: (d: { districts: District[]; regions: RegionSummary[];
                 facilities: Facility[] }) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  select:    (d: District | null) => void;
  setFilter: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  reset:     () => void;
}

const initialFilters: Filters = {
  region: "All", amenity: "All", riskTier: "All", urbanRural: "All",
};

export const useDashboard = create<State>((set) => ({
  districts: [], regions: [], facilities: [],
  loading: true, error: null,
  selected: null, filters: initialFilters,

  setData:    (d)  => set({ ...d, loading: false }),
  setLoading: (v)  => set({ loading: v }),
  setError:   (v)  => set({ error: v, loading: false }),
  select:     (d)  => set({ selected: d }),
  setFilter:  (k,v) => set(s => ({ filters: { ...s.filters, [k]: v } })),
  reset:      ()   => set({ filters: initialFilters, selected: null }),
}));
