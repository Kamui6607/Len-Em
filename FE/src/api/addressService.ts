// ============================================================
// Address Service — API wrapper for address endpoints
// ============================================================

import axiosClient from "../lib/axiosClient";
import type {
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
  AddressesListResponse,
  AddressApiResponse,
} from "../types/address.types";

const ADDRESSES_BASE = "/addresses";

export const addressApi = {
  /**
   * GET /addresses — Get all addresses for current user
   */
  getAddresses: () =>
    axiosClient.get<AddressApiResponse<AddressesListResponse>>(ADDRESSES_BASE),

  /**
   * GET /addresses/:id — Get address by ID
   */
  getAddressById: (addressId: string) =>
    axiosClient.get<AddressApiResponse<{ address: Address }>>(`${ADDRESSES_BASE}/${addressId}`),

  /**
   * POST /addresses — Create new address
   */
  createAddress: (data: CreateAddressRequest) =>
    axiosClient.post<AddressApiResponse<{ address: Address }>>(ADDRESSES_BASE, data),

  /**
   * PATCH /addresses/:id — Update address
   */
  updateAddress: (addressId: string, data: UpdateAddressRequest) =>
    axiosClient.patch<AddressApiResponse<{ address: Address }>>(`${ADDRESSES_BASE}/${addressId}`, data),

  /**
   * DELETE /addresses/:id — Delete address
   */
  deleteAddress: (addressId: string) =>
    axiosClient.delete<AddressApiResponse<{ deleted: boolean }>>(`${ADDRESSES_BASE}/${addressId}`),

  /**
   * PATCH /addresses/:id/set-default — Set address as default
   */
  setDefault: (addressId: string) =>
    axiosClient.patch<AddressApiResponse<{ address: Address }>>(`${ADDRESSES_BASE}/${addressId}/set-default`, {}),
};