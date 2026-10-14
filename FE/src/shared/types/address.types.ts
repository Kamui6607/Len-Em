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
// AddressLocation — khu vực hành chính (+ toạ độ) lưu trên User.
// Khớp đúng Joi schema của PATCH /users/:userId → KHÔNG thêm key nào khác.
// ============================================================

export interface AddressLocation {
  provinceName: string;
  districtName: string;
  wardName: string;
  /** GHN IDs — có khi chọn bằng dropdown (hoặc map khớp được /ghn/map-address) */
  provinceId?: number | null;
  districtId?: number | null;
  wardCode?: string | null;
  /** Toạ độ ghim trên bản đồ — lat và lng luôn đi cùng nhau */
  lat?: number | null;
  lng?: number | null;
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