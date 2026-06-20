import { create } from "zustand";

interface OrderFilters {
  status: string;
  zone: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  setStatus: (status: string) => void;
  setZone: (zone: string) => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setSearch: (search: string) => void;
  reset: () => void;
}

const initialState = {
  status: "",
  zone: "",
  dateFrom: "",
  dateTo: "",
  search: "",
};

export const useOrderFilters = create<OrderFilters>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setZone: (zone) => set({ zone }),
  setDateFrom: (dateFrom) => set({ dateFrom }),
  setDateTo: (dateTo) => set({ dateTo }),
  setSearch: (search) => set({ search }),
  reset: () => set(initialState),
}));
