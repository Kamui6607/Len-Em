// ============================================================
// Address Service â€” API wrapper for address endpoints
// ============================================================

import type { AxiosResponse } from "axios";
import axiosClient from "../../lib/axiosClient";
import type {
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
  AddressesListResponse,
  AddressApiResponse,
} from "../types/address.types";

const ADDRESSES_BASE = "/addresses";

// BE stores the street line as `detailAddress` (required by the Mongoose
// model — sending `address` makes POST /addresses fail with a 500). The FE
// keeps calling it `address`, so rename it here in both directions.
type ApiAddress = Omit<Address, "address"> & { detailAddress?: string; address?: string };

const fromApi = (a: ApiAddress): Address => ({ ...a, address: a.detailAddress ?? a.address ?? "" });

const toApi = <T extends { address?: string }>({ address, ...rest }: T) =>
  address === undefined ? rest : { ...rest, detailAddress: address };

type Res<T> = AxiosResponse<AddressApiResponse<T>>;

const mapOne = (res: Res<{ address: Address }>) => {
  const address = res.data.data?.address;
  if (address) res.data.data = { address: fromApi(address as ApiAddress) };
  return res;
};

const mapList = (res: Res<AddressesListResponse>) => {
  const list = res.data.data;
  if (list?.addresses) list.addresses = list.addresses.map((a) => fromApi(a as ApiAddress));
  return res;
};

export const addressApi = {
  /**
   * GET /addresses â€” Get all addresses for current user
   */
  getAddresses: () =>
    axiosClient.get<AddressApiResponse<AddressesListResponse>>(ADDRESSES_BASE).then(mapList),

  /**
   * GET /addresses/:id â€” Get address by ID
   */
  getAddressById: (addressId: string) =>
    axiosClient.get<AddressApiResponse<{ address: Address }>>(`${ADDRESSES_BASE}/${addressId}`).then(mapOne),

  /**
   * POST /addresses â€” Create new address
   */
  createAddress: (data: CreateAddressRequest) =>
    axiosClient.post<AddressApiResponse<{ address: Address }>>(ADDRESSES_BASE, toApi(data)).then(mapOne),

  /**
   * PATCH /addresses/:id â€” Update address
   */
  updateAddress: (addressId: string, data: UpdateAddressRequest) =>
    axiosClient
      .patch<AddressApiResponse<{ address: Address }>>(`${ADDRESSES_BASE}/${addressId}`, toApi(data))
      .then(mapOne),

  /**
   * DELETE /addresses/:id â€” Delete address
   */
  deleteAddress: (addressId: string) =>
    axiosClient.delete<AddressApiResponse<{ deleted: boolean }>>(`${ADDRESSES_BASE}/${addressId}`),

  /**
   * PATCH /addresses/:id/set-default â€” Set address as default
   */
  setDefault: (addressId: string) =>
    axiosClient
      .patch<AddressApiResponse<{ address: Address }>>(`${ADDRESSES_BASE}/${addressId}/set-default`, {})
      .then(mapOne),
};