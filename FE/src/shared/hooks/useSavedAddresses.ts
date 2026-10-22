// ============================================================
// useSavedAddresses — sổ địa chỉ của user hiện tại (GET /addresses)
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { addressApi } from "../api/addressService";
import { sortAddresses } from "../components/address/addressBook";
import type { Address } from "../types/address.types";

export function useSavedAddresses(enabled = true) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(enabled);
  const reqRef = useRef(0);

  const reload = useCallback(async () => {
    const req = ++reqRef.current;
    setLoading(true);
    try {
      const response = await addressApi.getAddresses();
      if (req === reqRef.current) setAddresses(sortAddresses(response.data.data?.addresses ?? []));
    } catch {
      // Lỗi HTTP đã được axios interceptor báo — giữ danh sách cũ.
    } finally {
      if (req === reqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void reload();
    } else {
      reqRef.current++;
      setAddresses([]);
      setLoading(false);
    }
  }, [enabled, reload]);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  return { addresses, defaultAddress, loading, reload };
}
