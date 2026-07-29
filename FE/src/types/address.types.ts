// ============================================================
// Address Types — user shipping addresses
// ============================================================

export interface Address {
  _id: string;
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  wardCode: string;
  wardName: string;
  districtId: number;
  districtName: string;
  provinceId: number;
  provinceName: string;
  isDefault: boolean;
  /** Latitude from map pin */
  lat?: number;
  /** Longitude from map pin */
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  fullName: string;
  phone: string;
  address: string;
  wardCode: string;
  wardName: string;
  districtId: number;
  districtName: string;
  provinceId: number;
  provinceName: string;
  isDefault?: boolean;
  /** Latitude from map pin */
  lat?: number;
  /** Longitude from map pin */
  lng?: number;
}

export interface UpdateAddressRequest {
  fullName?: string;
  phone?: string;
  address?: string;
  wardCode?: string;
  wardName?: string;
  districtId?: number;
  districtName?: string;
  provinceId?: number;
  provinceName?: string;
  isDefault?: boolean;
  /** Latitude from map pin */
  lat?: number;
  /** Longitude from map pin */
  lng?: number;
}

export interface AddressesListResponse {
  addresses: Address[];
  total: number;
}

export interface AddressApiResponse<T> {
  status?: "success" | "error";
  data?: T;
  message?: string;
}

// ============================================================
// Reverse Geocode — result from Mapbox/Google Maps client-side
// ============================================================

export interface ReverseGeocodeResult {
  /** Full formatted address string from map API */
  fullAddress: string;
  /** Street address, house number, building */
  street: string;
  wardName: string;
  districtName: string;
  provinceName: string;
  /** ISO country code */
  countryCode: string;
  /** Latitude from map pin */
  lat: number;
  /** Longitude from map pin */
  lng: number;
}