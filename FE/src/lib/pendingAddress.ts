// ============================================================
// Pending address — địa chỉ nhập lúc đăng ký.
// Đăng ký xong chưa có token nên chưa gọi được POST /addresses → lưu tạm
// vào localStorage, lần đăng nhập đầu tiên của đúng tài khoản đó sẽ tạo nó
// thành địa chỉ mặc định trong sổ địa chỉ.
// ============================================================

import { addressApi } from "../shared/api/addressService";
import type { CreateAddressRequest } from "../shared/types/address.types";

const KEY = "lenEm_pendingAddress";

interface PendingAddress {
  /** username + email (lowercase) của tài khoản vừa đăng ký */
  owners: string[];
  address: CreateAddressRequest;
}

type Owner = { username?: string; email?: string };

const ownerKeys = (owner: Owner) =>
  [owner.username, owner.email].filter((v): v is string => Boolean(v?.trim())).map((v) => v.trim().toLowerCase());

export function savePendingAddress(owner: Owner, address: CreateAddressRequest) {
  try {
    const value: PendingAddress = { owners: ownerKeys(owner), address };
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Storage bị chặn → user tự thêm ở /addresses.
  }
}

function readPending(): PendingAddress | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingAddress) : null;
  } catch {
    return null;
  }
}

function clearPending() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

let flushing = false;

/** Gọi sau khi đăng nhập: tạo địa chỉ chờ nếu thuộc user này và sổ địa chỉ đang trống. */
export async function flushPendingAddress(user: Owner) {
  const pending = readPending();
  if (!pending || flushing) return;
  const mine = ownerKeys(user);
  if (!pending.owners.some((o) => mine.includes(o))) return;

  flushing = true;
  try {
    const { data } = await addressApi.getAddresses();
    if ((data.data?.addresses ?? []).length === 0) {
      await addressApi.createAddress({ ...pending.address, isDefault: true });
    }
    clearPending();
  } catch (err) {
    // 4xx (dữ liệu không hợp lệ) → bỏ hẳn; lỗi mạng/5xx → thử lại lần đăng nhập sau.
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status && status >= 400 && status < 500 && status !== 401) clearPending();
  } finally {
    flushing = false;
  }
}
