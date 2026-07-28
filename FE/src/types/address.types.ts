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