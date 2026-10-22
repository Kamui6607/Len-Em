// ============================================================
// Address book helpers — chuyển đổi giữa AddressPick (AddressSelector),
// Address (sổ địa chỉ /addresses) và AddressLocation.
// Sổ địa chỉ là nguồn duy nhất cho địa chỉ giao hàng (đăng ký, hồ sơ, đặt hàng).
// ============================================================

import type { Address, AddressLocation, CreateAddressRequest } from "../../types/address.types";
import type { AddressPick } from "./AddressSelector";

type AreaFields = Pick<
  CreateAddressRequest,
  "provinceId" | "provinceName" | "districtId" | "districtName" | "wardCode" | "wardName" | "lat" | "lng"
>;

/** POST /addresses bắt buộc đủ ID GHN — chọn bằng bản đồ cũng phải khớp được ID. */
export function hasGhnIds(pick: AddressPick | null | undefined): pick is AddressPick & {
  provinceId: number;
  districtId: number;
  wardCode: string;
} {
  return Boolean(pick && pick.provinceId !== null && pick.districtId !== null && pick.wardCode);
}

/** Lỗi hiển thị khi khu vực chưa đủ để lưu vào sổ địa chỉ (null = hợp lệ). */
export function pickAreaError(pick: AddressPick | null | undefined): string | null {
  if (hasGhnIds(pick) && pick.provinceName && pick.districtName && pick.wardName) return null;
  if (pick?.mode === "map") {
    return pick.lat === null
      ? "Vui lòng ghim vị trí nhận hàng trên bản đồ"
      : "Chưa xác định được khu vực của vị trí đã ghim — hãy ghim lại hoặc chuyển sang Chọn khu vực";
  }
  return "Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã";
}

/** AddressPick (đã qua pickAreaError) → các field khu vực của CreateAddressRequest. */
export function pickToAddressFields(pick: AddressPick): AreaFields {
  return {
    provinceId: pick.provinceId ?? 0,
    provinceName: pick.provinceName,
    districtId: pick.districtId ?? 0,
    districtName: pick.districtName,
    wardCode: pick.wardCode ?? "",
    wardName: pick.wardName,
    // Toạ độ chỉ mô tả điểm ghim — không gắn cho địa chỉ chọn bằng dropdown.
    ...(pick.mode === "map" && pick.lat !== null && pick.lng !== null ? { lat: pick.lat, lng: pick.lng } : {}),
  };
}

const hasCoords = (a: Pick<Address, "lat" | "lng">) => typeof a.lat === "number" && typeof a.lng === "number";

/** Address đã lưu → giá trị điền sẵn cho AddressSelector. */
export function addressToLocation(address: Address): AddressLocation {
  return {
    provinceId: address.provinceId,
    provinceName: address.provinceName,
    districtId: address.districtId,
    districtName: address.districtName,
    wardCode: address.wardCode,
    wardName: address.wardName,
    ...(hasCoords(address) ? { lat: address.lat, lng: address.lng } : {}),
  };
}

/** Address đã lưu → AddressPick (dùng để tính phí ship / tạo đơn). */
export function addressToPick(address: Address): AddressPick {
  const coords = hasCoords(address);
  return {
    mode: coords ? "map" : "dropdown",
    provinceName: address.provinceName,
    districtName: address.districtName,
    wardName: address.wardName,
    provinceId: address.provinceId ?? null,
    districtId: address.districtId ?? null,
    wardCode: address.wardCode ?? null,
    lat: coords ? address.lat! : null,
    lng: coords ? address.lng! : null,
  };
}

export function formatAddressArea(address: Pick<Address, "wardName" | "districtName" | "provinceName">): string {
  return [address.wardName, address.districtName, address.provinceName].filter(Boolean).join(", ");
}

export function formatFullAddress(address: Pick<Address, "address" | "wardName" | "districtName" | "provinceName">): string {
  return [address.address, formatAddressArea(address)].filter(Boolean).join(", ");
}

/** Mặc định lên đầu, còn lại giữ thứ tự từ server. */
export function sortAddresses(addresses: Address[]): Address[] {
  return [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}
