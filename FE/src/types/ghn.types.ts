// ============================================================
// GHN Types — matches GHN API master data responses
// ============================================================

export interface GHNProvince {
  provinceId: number;
  provinceName: string;
}

export interface GHNDistrict {
  districtId: number;
  districtName: string;
  provinceId: number;
}

export interface GHNWard {
  wardCode: string;
  wardName: string;
  districtId: number;
}

export interface GHNProvincesResponse {
  status: string;
  data: {
    provinces: GHNProvince[];
  };
}

export interface GHNDistrictsResponse {
  status: string;
  data: {
    districts: GHNDistrict[];
  };
}

export interface GHNWardsResponse {
  status: string;
  data: {
    wards: GHNWard[];
  };
}

export interface ShippingFeeRequest {
  items: {
    productId: string;
    quantity: number;
    color?: string;
    hexCode?: string;
  }[];
  addressId?: string;
  districtId: number;
  wardCode: string;
}

export interface ShippingFeeResponse {
  shipping_fee: number;
  service_id: number | null;
  address: {
    district: string;
    ward: string;
  };
}
