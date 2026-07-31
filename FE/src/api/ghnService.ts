// ============================================================
// GHN Service — API wrapper for GHN master data endpoints
// ============================================================

import axiosClient from "../lib/axiosClient";
import type {
  GHNProvincesResponse,
  GHNDistrictsResponse,
  GHNWardsResponse,
  MapAddressRequest,
  MapAddressResponse,
} from "../types/ghn.types";

const GHN_BASE = "/ghn";

export const ghnApi = {
  /**
   * GET /ghn/provinces
   * Get all provinces/cities from GHN master data
   */
  getProvinces: () =>
    axiosClient.get<GHNProvincesResponse>(`${GHN_BASE}/provinces`),

  /**
   * GET /ghn/districts?provinceId=269
   * Get all districts by province ID
   */
  getDistricts: (provinceId: number) =>
    axiosClient.get<GHNDistrictsResponse>(`${GHN_BASE}/districts`, {
      params: { provinceId },
    }),

  /**
   * GET /ghn/wards?districtId=1442
   * Get all wards by district ID
   */
  getWards: (districtId: number) =>
    axiosClient.get<GHNWardsResponse>(`${GHN_BASE}/wards`, {
      params: { districtId },
    }),

  /**
   * POST /ghn/map-address
   * Map string address to GHN IDs (provinceId, districtId, wardCode)
   * Takes provinceName, districtName, wardName from reverse geocode result
   */
  mapAddress: (data: MapAddressRequest) =>
    axiosClient.post<MapAddressResponse>(`${GHN_BASE}/map-address`, data),
};
