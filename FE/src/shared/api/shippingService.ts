// ============================================================
// Shipping Service â€” API wrapper for shipping endpoints
// ============================================================

import axiosClient from "../../lib/axiosClient";

const SHIPPING_BASE = "/shipping";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ShippingOptionsRequest {
  /** Either send lat/lng OR provinceName/districtName/wardName */
  lat?: number;
  lng?: number;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
  /** Cart items for weight/volume calculation */
  items?: {
    productId: string;
    variantId: string;
    quantity: number;
  }[];
  /** Kits to include in shipping calculation */
  kits?: {
    kitId: string;
    quantity: number;
  }[];
}

export interface ShippingOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  eta: string;
  estimatedDays: number;
  provider: "GHN" | "HOA_TOC" | "OTHER";
}

export interface ShippingOptionsResponse {
  status: string;
  data: {
    options: ShippingOption[];
  };
}

export interface GeocodeRequest {
  address: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

export interface GeocodeResponse {
  status: string;
  data: GeocodeResult;
}

// â”€â”€â”€ Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const shippingApi = {
  /**
   * POST /shipping/options
   * Get available shipping methods with price and ETA.
   * Send lat/lng OR provinceName/districtName/wardName.
   */
  getOptions: (data: ShippingOptionsRequest) =>
    axiosClient.post<ShippingOptionsResponse>(`${SHIPPING_BASE}/options`, data),

  /**
   * POST /shipping/geocode
   * Convert a text address to lat/lng coordinates.
   */
  geocode: (data: GeocodeRequest) =>
    axiosClient.post<GeocodeResponse>(`${SHIPPING_BASE}/geocode`, data),
};