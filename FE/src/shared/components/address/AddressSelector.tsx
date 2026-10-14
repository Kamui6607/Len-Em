// ============================================================
// AddressSelector — chọn khu vực Tỉnh/Quận/Phường, dùng chung cho
// Checkout (/order) và form "Chỉnh sửa hồ sơ".
//   - "dropdown": 3 dropdown GHN (getProvinces/getDistricts/getWards) → đủ ID + tên
//   - "map":      MapPicker → tên + toạ độ; thử /ghn/map-address để lấy thêm ID
// Component tự quản lý state, chỉ báo ra ngoài một AddressPick đã chuẩn hoá.
// Ô "Địa chỉ chi tiết" do trang cha render (mỗi trang có form riêng).
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { List, Map as MapIcon, MapPin } from "lucide-react";
import { toast } from "sonner";
import { ghnApi } from "../../api/ghnService";
import { useLanguage } from "../../contexts/LanguageContext";
import { MapPicker } from "../map/MapPicker";
import type { GHNDistrict, GHNProvince, GHNWard } from "../../types/ghn.types";
import type { AddressLocation, ReverseGeocodeResult } from "../../types/address.types";
import "../../../styles/checkout.css";

export type AddressMode = "dropdown" | "map";

/** Lựa chọn hiện tại — tên luôn là string ("" = chưa chọn), ID/toạ độ null khi không có. */
export interface AddressPick {
  mode: AddressMode;
  provinceName: string;
  districtName: string;
  wardName: string;
  provinceId: number | null;
  districtId: number | null;
  wardCode: string | null;
  lat: number | null;
  lng: number | null;
}

type GhnIds = Pick<AddressPick, "provinceId" | "districtId" | "wardCode">;
type MapSpot = Pick<AddressPick, "provinceName" | "districtName" | "wardName"> & {
  lat: number;
  lng: number;
};

export function isPickComplete(pick: AddressPick): boolean {
  return Boolean(pick.provinceName && pick.districtName && pick.wardName);
}

/** Người dùng đã bắt đầu chọn gì chưa (một tên bất kỳ, hoặc đã ghim bản đồ). */
export function isPickStarted(pick: AddressPick): boolean {
  return Boolean(pick.provinceName || pick.districtName || pick.wardName || pick.lat !== null);
}

/**
 * AddressPick → AddressLocation đúng contract PATCH /users (Joi từ chối key lạ):
 * chỉ các key cho phép, bỏ hẳn key không có giá trị. null khi chưa chọn gì.
 */
export function pickToLocation(pick: AddressPick): AddressLocation | null {
  if (!isPickStarted(pick)) return null;
  const loc: AddressLocation = {
    provinceName: pick.provinceName,
    districtName: pick.districtName,
    wardName: pick.wardName,
  };
  if (pick.provinceId !== null) loc.provinceId = pick.provinceId;
  if (pick.districtId !== null) loc.districtId = pick.districtId;
  if (pick.wardCode !== null) loc.wardCode = pick.wardCode;
  if (pick.lat !== null && pick.lng !== null) {
    loc.lat = pick.lat;
    loc.lng = pick.lng;
  }
  return loc;
}

const LOCATION_KEYS = [
  "provinceName",
  "districtName",
  "wardName",
  "provinceId",
  "districtId",
  "wardCode",
  "lat",
  "lng",
] as const;

/** So sánh từng field; undefined / null / "" coi như nhau (user cũ không có field). */
export function sameLocation(
  a: AddressLocation | null | undefined,
  b: AddressLocation | null | undefined,
): boolean {
  const norm = (v: string | number | null | undefined) => (v === undefined || v === "" ? null : v);
  return LOCATION_KEYS.every((key) => norm(a?.[key]) === norm(b?.[key]));
}

const hasCoords = (loc?: AddressLocation | null): loc is AddressLocation & { lat: number; lng: number } =>
  typeof loc?.lat === "number" && typeof loc?.lng === "number";

const normName = (s: string) => s.normalize("NFC").trim().toLowerCase();

/** Tìm mục theo ID trước, không có thì theo tên trùng khớp (không phân biệt hoa thường). */
function findByIdOrName<T>(
  list: T[],
  id: number | string | null | undefined,
  getId: (item: T) => number | string,
  name: string | undefined,
  getName: (item: T) => string,
): T | undefined {
  if (id !== null && id !== undefined) {
    const byId = list.find((item) => getId(item) === id);
    if (byId) return byId;
  }
  if (!name) return undefined;
  const target = normName(name);
  return list.find((item) => normName(getName(item)) === target);
}

interface AddressSelectorProps {
  /** Tiền tố id cho label/input — phải duy nhất trên trang. */
  idPrefix: string;
  /** Giá trị điền sẵn, chỉ đọc lúc mount (đổi `key` để điền lại). */
  initialValue?: AddressLocation | null;
  /** Dòng địa chỉ chi tiết đã có — chỉ để hiển thị trong thẻ kết quả của bản đồ. */
  initialStreet?: string;
  onChange: (pick: AddressPick) => void;
  /** Gọi với `street` của điểm vừa ghim trên bản đồ (nếu có). */
  onStreetSuggest?: (street: string) => void;
  /** Hiện dấu * bắt buộc trên các dropdown. */
  required?: boolean;
  mapHint?: string;
  /** Class cho label của dropdown (mặc định kiểu Checkout). */
  labelClassName?: string;
}

export function AddressSelector({
  idPrefix,
  initialValue,
  initialStreet,
  onChange,
  onStreetSuggest,
  required = false,
  mapHint,
  labelClassName = "co-label",
}: AddressSelectorProps) {
  const { t } = useLanguage();

  // Toàn bộ giá trị ban đầu chụp một lần lúc mount.
  const [initial] = useState(() => initialValue ?? null);

  const [mode, setMode] = useState<AddressMode>(hasCoords(initial) ? "map" : "dropdown");

  const [provinces, setProvinces] = useState<GHNProvince[]>([]);
  const [districts, setDistricts] = useState<GHNDistrict[]>([]);
  const [wards, setWards] = useState<GHNWard[]>([]);
  const [province, setProvince] = useState<GHNProvince | null>(null);
  const [district, setDistrict] = useState<GHNDistrict | null>(null);
  const [ward, setWard] = useState<GHNWard | null>(null);
  // Đang điền sẵn từ ID/tên đã lưu → dropdown chưa có danh sách; trong lúc đó
  // pick dùng thẳng giá trị đã lưu để trang cha (vd. tính phí ship) chạy ngay.
  const [prefilling, setPrefilling] = useState(() => Boolean(initial && !hasCoords(initial)));

  // Chế độ map: điểm đã ghim + ID GHN khớp được cho điểm đó (tách riêng với
  // dropdown để ID cũ của dropdown không bị gán nhầm cho điểm mới).
  const [spot, setSpot] = useState<MapSpot | null>(() =>
    hasCoords(initial)
      ? {
          provinceName: initial.provinceName,
          districtName: initial.districtName,
          wardName: initial.wardName,
          lat: initial.lat,
          lng: initial.lng,
        }
      : null,
  );
  const [spotIds, setSpotIds] = useState<GhnIds | null>(() =>
    hasCoords(initial)
      ? {
          provinceId: initial.provinceId ?? null,
          districtId: initial.districtId ?? null,
          wardCode: initial.wardCode ?? null,
        }
      : null,
  );
  // Kết quả của điểm đang ghim — đưa lại cho MapPicker khi nó mount lại (đổi
  // chế độ) để không phải reverse-geocode lại cùng một điểm.
  const [mapResult, setMapResult] = useState<ReverseGeocodeResult | null>(() =>
    hasCoords(initial)
      ? {
          fullAddress: "",
          street: initialStreet ?? "",
          provinceName: initial.provinceName,
          districtName: initial.districtName,
          wardName: initial.wardName,
          countryCode: "VN",
          lat: initial.lat,
          lng: initial.lng,
        }
      : null,
  );

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);
  // Chỉ phản hồi mới nhất được ghi vào dropdown (chọn nhanh liên tiếp / ghim nhiều lần).
  const districtReqRef = useRef(0);
  const wardReqRef = useRef(0);
  const mapReqRef = useRef(0);

  const fetchDistricts = useCallback(async (provinceId: number) => {
    const res = await ghnApi.getDistricts(provinceId);
    return res.data?.data?.districts ?? [];
  }, []);
  const fetchWards = useCallback(async (districtId: number) => {
    const res = await ghnApi.getWards(districtId);
    return res.data?.data?.wards ?? [];
  }, []);

  /**
   * Chọn sẵn chuỗi tỉnh → huyện → xã. Tải danh sách TRƯỚC rồi mới set cả ba
   * selection một lượt, nên không có bước nào reset mất giá trị của bước sau.
   */
  const applyChain = useCallback(
    async (
      provinceList: GHNProvince[],
      target: { provinceId?: number | null; districtId?: number | null; wardCode?: string | null; provinceName?: string; districtName?: string; wardName?: string },
    ) => {
      const dReq = ++districtReqRef.current;
      const wReq = ++wardReqRef.current;
      const stale = () => !aliveRef.current || dReq !== districtReqRef.current || wReq !== wardReqRef.current;

      const p = findByIdOrName(provinceList, target.provinceId, (x) => x.provinceId, target.provinceName, (x) => x.provinceName);
      if (!p) return false;
      const districtList = await fetchDistricts(p.provinceId);
      if (stale()) return false;
      const d = findByIdOrName(districtList, target.districtId, (x) => x.districtId, target.districtName, (x) => x.districtName);
      const wardList = d ? await fetchWards(d.districtId) : [];
      if (stale()) return false;
      const w = d
        ? findByIdOrName(wardList, target.wardCode, (x) => x.wardCode, target.wardName, (x) => x.wardName)
        : undefined;

      setProvince(p);
      setDistricts(districtList);
      setDistrict(d ?? null);
      setWards(wardList);
      setWard(w ?? null);
      return Boolean(d && w);
    },
    [fetchDistricts, fetchWards],
  );

  // Mount: tải tỉnh/thành rồi điền sẵn dropdown từ giá trị đã lưu (nếu có).
  useEffect(() => {
    (async () => {
      let list: GHNProvince[] = [];
      try {
        const res = await ghnApi.getProvinces();
        list = res.data?.data?.provinces ?? [];
        if (!aliveRef.current) return;
        setProvinces(list);
      } catch {
        toast.error(t("addressSelector.loadProvincesError"));
        return;
      }
      if (!initial || hasCoords(initial)) {
        if (initial) await applyChain(list, initial).catch(() => false);
        return;
      }
      // Chỉ thôi dùng giá trị đã lưu khi cả 3 cấp đã được chọn lại đầy đủ.
      // Nếu không khớp được (ID cũ, lỗi mạng) thì pick vẫn giữ nguyên giá trị
      // đã lưu cho tới khi người dùng tự chọn → lưu hồ sơ không vô tình xoá nó.
      const resolved = await applyChain(list, initial).catch(() => {
        toast.error(t("addressSelector.loadDistrictsError"));
        return false;
      });
      if (resolved && aliveRef.current) setPrefilling(false);
    })();
    // Chỉ chạy một lần lúc mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Dropdown handlers — load danh sách con ngay tại đây thay vì qua effect ──
  const handleProvinceChange = async (provinceId: number) => {
    const p = provinces.find((x) => x.provinceId === provinceId) ?? null;
    const req = ++districtReqRef.current;
    ++wardReqRef.current;
    setPrefilling(false);
    setProvince(p);
    setDistrict(null);
    setWard(null);
    setDistricts([]);
    setWards([]);
    if (!p) return;
    try {
      const list = await fetchDistricts(p.provinceId);
      if (aliveRef.current && req === districtReqRef.current) setDistricts(list);
    } catch {
      toast.error(t("addressSelector.loadDistrictsError"));
    }
  };

  const handleDistrictChange = async (districtId: number) => {
    const d = districts.find((x) => x.districtId === districtId) ?? null;
    const req = ++wardReqRef.current;
    setPrefilling(false);
    setDistrict(d);
    setWard(null);
    setWards([]);
    if (!d) return;
    try {
      const list = await fetchWards(d.districtId);
      if (aliveRef.current && req === wardReqRef.current) setWards(list);
    } catch {
      toast.error(t("addressSelector.loadWardsError"));
    }
  };

  const handleWardChange = (wardCode: string) => {
    setPrefilling(false);
    setWard(wards.find((x) => x.wardCode === wardCode) ?? null);
  };

  // ── Map: lưu tên + toạ độ ngay; thử /ghn/map-address để lấy thêm ID GHN ──
  const handleLocationSelect = async (result: ReverseGeocodeResult) => {
    const req = ++mapReqRef.current;
    const provinceName = result.provinceName?.trim() || "";
    const districtName = result.districtName?.trim() || "";
    const wardName = result.wardName?.trim() || "";
    setSpot({ provinceName, districtName, wardName, lat: result.lat, lng: result.lng });
    setMapResult(result);
    setSpotIds(null);
    if (result.street?.trim()) onStreetSuggest?.(result.street.trim());

    if (!provinceName && !districtName && !wardName) return;
    try {
      const mapRes = await ghnApi.mapAddress({
        provinceName,
        districtName,
        wardName,
        lat: result.lat,
        lng: result.lng,
      });
      if (!aliveRef.current || req !== mapReqRef.current) return;
      const match = mapRes.data.data.match;
      if (!match.success || !match.provinceId) return;
      setSpotIds({
        provinceId: match.provinceId,
        districtId: match.districtId ?? null,
        wardCode: match.wardCode ?? null,
      });
      // Tiện thể điền luôn dropdown để chuyển sang chế độ "Chọn địa chỉ" là thấy.
      setPrefilling(false);
      await applyChain(provinces, match);
    } catch (error) {
      console.error("Map address mapping failed:", error);
      if (!aliveRef.current || req !== mapReqRef.current) return;
      // Fallback: chọn tỉnh gần đúng theo tên (huyện/xã để trống)
      const lower = provinceName.toLowerCase();
      const fuzzy =
        lower &&
        provinces.find(
          (p) => p.provinceName.toLowerCase().includes(lower) || lower.includes(p.provinceName.toLowerCase()),
        );
      if (fuzzy) void handleProvinceChange(fuzzy.provinceId);
    }
  };

  // ── Pick hiện tại → báo ra ngoài mỗi khi nội dung đổi ──
  const pick: AddressPick =
    mode === "map"
      ? {
          mode,
          provinceName: spot?.provinceName ?? "",
          districtName: spot?.districtName ?? "",
          wardName: spot?.wardName ?? "",
          provinceId: spotIds?.provinceId ?? null,
          districtId: spotIds?.districtId ?? null,
          wardCode: spotIds?.wardCode ?? null,
          lat: spot?.lat ?? null,
          lng: spot?.lng ?? null,
        }
      : prefilling && initial
        ? {
            mode,
            provinceName: initial.provinceName ?? "",
            districtName: initial.districtName ?? "",
            wardName: initial.wardName ?? "",
            provinceId: initial.provinceId ?? null,
            districtId: initial.districtId ?? null,
            wardCode: initial.wardCode ?? null,
            lat: null,
            lng: null,
          }
        : {
            mode,
            provinceName: province?.provinceName ?? "",
            districtName: district?.districtName ?? "",
            wardName: ward?.wardName ?? "",
            provinceId: province?.provinceId ?? null,
            districtId: district?.districtId ?? null,
            wardCode: ward?.wardCode ?? null,
            lat: null,
            lng: null,
          };
  const pickKey = JSON.stringify(pick);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current(JSON.parse(pickKey) as AddressPick);
  }, [pickKey]);

  const label = (text: string) => (
    <>
      {text}
      {required && <span className="co-req">*</span>}
    </>
  );

  return (
    <div className="grid gap-4">
      <div className="co-seg !mb-0" role="group" aria-label={t("addressSelector.modeGroupLabel")}>
        {(
          [
            { value: "dropdown", text: t("addressSelector.modeDropdown"), Icon: List },
            { value: "map", text: t("addressSelector.modeMap"), Icon: MapIcon },
          ] as const
        ).map(({ value, text, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            className="co-seg-btn"
            onClick={() => setMode(value)}
          >
            {mode === value && (
              <motion.span
                layoutId={`${idPrefix}-seg-patch`}
                className="co-seg-patch"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon className="size-4" />
            {text}
          </button>
        ))}
      </div>

      {mode === "dropdown" ? (
        <div className="co-grid cols-3">
          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-province`} className={labelClassName}>
              {label(t("addressSelector.provinceLabel"))}
            </label>
            <select
              id={`${idPrefix}-province`}
              value={province?.provinceId ?? ""}
              onChange={(e) => void handleProvinceChange(Number(e.target.value))}
              className="co-select"
            >
              <option value="">{t("addressSelector.provincePlaceholder")}</option>
              {provinces.map((p) => (
                <option key={p.provinceId} value={p.provinceId}>
                  {p.provinceName}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-district`} className={labelClassName}>
              {label(t("addressSelector.districtLabel"))}
            </label>
            <select
              id={`${idPrefix}-district`}
              value={district?.districtId ?? ""}
              onChange={(e) => void handleDistrictChange(Number(e.target.value))}
              disabled={!province}
              className="co-select"
            >
              <option value="">{t("addressSelector.districtPlaceholder")}</option>
              {districts.map((d) => (
                <option key={d.districtId} value={d.districtId}>
                  {d.districtName}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-ward`} className={labelClassName}>
              {label(t("addressSelector.wardLabel"))}
            </label>
            <select
              id={`${idPrefix}-ward`}
              value={ward?.wardCode ?? ""}
              onChange={(e) => handleWardChange(e.target.value)}
              disabled={!district}
              className="co-select"
            >
              <option value="">{t("addressSelector.wardPlaceholder")}</option>
              {wards.map((w) => (
                <option key={w.wardCode} value={w.wardCode}>
                  {w.wardName}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <p className="co-hint !mt-0 flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-[var(--primary)]" />
            {mapHint ?? t("addressSelector.mapHint")}
          </p>
          <MapPicker
            initialLat={spot?.lat}
            initialLng={spot?.lng}
            initialResult={mapResult}
            onLocationSelect={handleLocationSelect}
          />
        </div>
      )}
    </div>
  );
}
