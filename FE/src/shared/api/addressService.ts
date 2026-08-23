// ============================================================
// Address Service â€” API wrapper for address endpoints
// ============================================================

import axiosClient from "../../lib/axiosClient";
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
   * GET /addresses â€” Get all addresses for current user
   */
  getAddresses: () =>
    axiosClient.get<AddressApiResponse<AddressesListResponse>>(ADDRESSES_BASE),

  /**
   * GET /addresses/:id â€” Get address by ID
   */
  getAddressById: (addressId: string) =>
    axiosClient.get<AddressApiResponse<{ address: Address }>>(`${ADDRESSES_BASE}/${addressId}`),

  /**
   * POST /addresses â€” Create new address
   */
  createAddress: (data: CreateAddressRequest) =>
    axiosClient.post<AddressApiResponse<{ address: Address }>>(ADDRESSES_BASE, data),

  /**
   * PATCH /addresses/:id â€” Update address
   */
  updateAddress: (addressId: string, data: UpdateAddressRequest) =>
    axiosClient.patch<AddressApiResponse<{ address: Address }>>(`${ADDRESSES_BASE}/${addressId}`, data),

  /**
   * DELETE /addresses/:id â€” Delete address
   */
  deleteAddress: (addressId: string) =>
    axiosClient.delete<AddressApiResponse<{ deleted: boolean }>>(`${ADDRESSES_BASE}/${addressId}`),

  /**
   * PATCH /addresses/:id/set-default â€” Set address as default
   */
  setDefault: (addressId: string) =>
    axiosClient.patch<AddressApiResponse<{ address: Address }>>(`${ADDRESSES_BASE}/${addressId}/set-default`, {}),
};