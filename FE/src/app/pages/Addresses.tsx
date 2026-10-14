// ============================================================
// Address Management Page — route /addresses
// Manage shipping addresses with GHN cascading dropdowns
// With map pin integration for lat/lng
// Giao diện theo ngôn ngữ "craft" (xem craft.css + addresses.css)
// ============================================================

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  BookUser,
  Check,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Pencil,
  Phone,
  Plus,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import { addressApi } from "../../shared/api/addressService";
import { ghnApi } from "../../shared/api/ghnService";
import { MapPicker } from "../../shared/components/map/MapPicker";
import type { Address, CreateAddressRequest, ReverseGeocodeResult } from "../../shared/types/address.types";
import type { GHNProvince, GHNDistrict, GHNWard } from "../../shared/types/ghn.types";
import "../../styles/craft.css";
import "../../styles/checkout.css";
import "../../styles/addresses.css";

type AddressFormData = {
  fullName: string;
  phone: string;
  address: string;
  isDefault: boolean;
};

const PHONE_PATTERN = /^(0|\+84)\d{9,10}$/;

/** Xóa cần bấm lần hai trong 3s — không hoàn tác được. */
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(id);
  }, [armed]);

  return (
    <button
      type="button"
      className="adr-act is-delete"
      data-armed={armed}
      aria-live="polite"
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        setArmed(false);
        onConfirm();
      }}
    >
      <Trash2 className="size-4" />
      {armed ? "Bấm lần nữa" : "Xóa"}
    </button>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  onEdit: (a: Address) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const hasPin = address.lat !== undefined && address.lng !== undefined && address.lat !== null;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`adr-card${address.isDefault ? " is-default" : ""}`}
    >
      {address.isDefault && (
        <span className="adr-ribbon">
          <Star className="size-3" fill="currentColor" />
          Mặc định
        </span>
      )}

      <div className="adr-card-head">
        <span className="adr-card-icon" aria-hidden="true">
          <MapPin className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <h3 className="adr-card-name">{address.fullName}</h3>
          <p className="adr-card-phone">
            <Phone className="size-3.5" />
            {address.phone}
          </p>
        </div>
      </div>

      <div className="adr-card-body">
        <p className="adr-card-line">{address.address}</p>
        <p className="adr-card-area">
          {address.wardName}, {address.districtName}, {address.provinceName}
        </p>
        {hasPin && (
          <span className="craft-tag adr-pin-tag">
            <MapPinned className="size-3" />
            Đã ghim bản đồ
          </span>
        )}
      </div>

      <div className="adr-card-foot">
        {!address.isDefault && (
          <button type="button" className="adr-act is-primary" onClick={() => onSetDefault(address._id)}>
            <Check className="size-4" />
            Đặt mặc định
          </button>
        )}
        <div className="adr-card-foot-end">
          <button type="button" className="adr-act" onClick={() => onEdit(address)}>
            <Pencil className="size-4" />
            Sửa
          </button>
          <DeleteButton onConfirm={() => onDelete(address._id)} />
        </div>
      </div>
    </motion.li>
  );
}

export function Addresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [areaError, setAreaError] = useState(false);

  const [provinces, setProvinces] = useState<GHNProvince[]>([]);
  const [districts, setDistricts] = useState<GHNDistrict[]>([]);
  const [wards, setWards] = useState<GHNWard[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<GHNProvince | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<GHNDistrict | null>(null);
  const [selectedWard, setSelectedWard] = useState<GHNWard | null>(null);

  // Map state
  const [showMap, setShowMap] = useState(false);
  const [mapLat, setMapLat] = useState<number | undefined>(undefined);
  const [mapLng, setMapLng] = useState<number | undefined>(undefined);

  const formRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      isDefault: false,
    },
  });

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
    loadAddresses();
  }, []);

  // Cuộn tới form khi mở
  useEffect(() => {
    if (showForm) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm, editingId]);

  const loadProvinces = async () => {
    try {
      const response = await ghnApi.getProvinces();
      setProvinces(response.data.data.provinces);
    } catch {
      toast.error("Không thể tải danh sách tỉnh/thành phố");
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await addressApi.getAddresses();
      if (response.data.data) {
        setAddresses(response.data.data.addresses);
      }
    } catch {
      toast.error("Không thể tải danh sách địa chỉ");
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (provinceId: number) => {
    try {
      const response = await ghnApi.getDistricts(provinceId);
      const list = response.data.data.districts;
      setDistricts(list);
      return list;
    } catch {
      toast.error("Không thể tải danh sách quận/huyện");
      return [];
    }
  };

  const fetchWards = async (districtId: number) => {
    try {
      const response = await ghnApi.getWards(districtId);
      const list = response.data.data.wards;
      setWards(list);
      return list;
    } catch {
      toast.error("Không thể tải danh sách phường/xã");
      return [];
    }
  };

  // User đổi tỉnh → xóa quận/phường, tải lại quận
  const handleProvinceChange = (province: GHNProvince | null) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setAreaError(false);
    if (province) fetchDistricts(province.provinceId);
  };

  // User đổi quận → xóa phường, tải lại phường
  const handleDistrictChange = (district: GHNDistrict | null) => {
    setSelectedDistrict(district);
    setSelectedWard(null);
    setWards([]);
    setAreaError(false);
    if (district) fetchWards(district.districtId);
  };

  /** Điền sẵn tỉnh → quận → phường theo id (dùng khi sửa địa chỉ / chọn trên bản đồ). */
  const applyArea = async (provinceId?: number, districtId?: number, wardCode?: string) => {
    const province = provinces.find((p) => p.provinceId === provinceId);
    if (!province) return false;
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setWards([]);
    setAreaError(false);

    const districtList = await fetchDistricts(province.provinceId);
    const district = districtList.find((d) => d.districtId === districtId);
    if (!district) return true;
    setSelectedDistrict(district);

    const wardList = await fetchWards(district.districtId);
    const ward = wardList.find((w) => w.wardCode === wardCode);
    if (ward) setSelectedWard(ward);
    return true;
  };

  // Handle map location selection
  const handleLocationSelect = async (result: ReverseGeocodeResult) => {
    setMapLat(result.lat);
    setMapLng(result.lng);

    // Only call /ghn/map-address if we have at least province name
    const province = result.provinceName?.trim();
    const district = result.districtName?.trim();
    const ward = result.wardName?.trim();
    if (!province && !district && !ward) return;

    try {
      const mapRes = await ghnApi.mapAddress({
        provinceName: province || "",
        districtName: district || "",
        wardName: ward || "",
      });
      const match = mapRes.data.data.match;
      if (match.success && match.provinceId) {
        await applyArea(match.provinceId, match.districtId, match.wardCode);
      }
    } catch (error) {
      console.error("Map address mapping failed:", error);
      // Fallback: try fuzzy match on province name
      if (province) {
        const needle = province.toLowerCase();
        const matchedProvince = provinces.find(
          (p) =>
            p.provinceName.toLowerCase().includes(needle) || needle.includes(p.provinceName.toLowerCase())
        );
        if (matchedProvince) handleProvinceChange(matchedProvince);
      }
    }
  };

  const onSubmit = async (data: AddressFormData) => {
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      setAreaError(true);
      toast.error("Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateAddressRequest = {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        wardCode: selectedWard.wardCode,
        wardName: selectedWard.wardName,
        districtId: selectedDistrict.districtId,
        districtName: selectedDistrict.districtName,
        provinceId: selectedProvince.provinceId,
        provinceName: selectedProvince.provinceName,
        isDefault: data.isDefault,
        // Include lat/lng from map if available
        ...(mapLat !== undefined && mapLng !== undefined ? { lat: mapLat, lng: mapLng } : {}),
      };

      if (editingId) {
        await addressApi.updateAddress(editingId, payload);
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        await addressApi.createAddress(payload);
        toast.success("Thêm địa chỉ mới thành công");
      }

      resetForm();
      loadAddresses();
    } catch {
      toast.error(editingId ? "Không thể cập nhật địa chỉ" : "Không thể thêm địa chỉ mới");
    } finally {
      setSubmitting(false);
    }
  };

  const openCreate = () => {
    resetForm();
    // Địa chỉ đầu tiên luôn là mặc định
    reset({ fullName: "", phone: "", address: "", isDefault: addresses.length === 0 });
    setShowForm(true);
  };

  const handleEdit = (address: Address) => {
    setEditingId(address._id);
    setShowForm(true);
    setShowMap(false);
    setMapLat(address.lat ?? undefined);
    setMapLng(address.lng ?? undefined);
    reset({
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      isDefault: address.isDefault,
    });
    applyArea(address.provinceId, address.districtId, address.wardCode);
  };

  const handleDelete = async (addressId: string) => {
    try {
      await addressApi.deleteAddress(addressId);
      toast.success("Xóa địa chỉ thành công");
      if (editingId === addressId) resetForm();
      loadAddresses();
    } catch {
      toast.error("Không thể xóa địa chỉ");
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await addressApi.setDefault(addressId);
      toast.success("Đặt làm địa chỉ mặc định thành công");
      loadAddresses();
    } catch {
      toast.error("Không thể đặt làm địa chỉ mặc định");
    }
  };

  const resetForm = () => {
    reset({ fullName: "", phone: "", address: "", isDefault: false });
    setShowForm(false);
    setEditingId(null);
    setAreaError(false);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setShowMap(false);
    setMapLat(undefined);
    setMapLng(undefined);
  };

  // Mặc định lên đầu
  const sortedAddresses = [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  const pinnedCount = addresses.filter((a) => a.lat !== undefined && a.lat !== null).length;
  const hasPin = mapLat !== undefined && mapLng !== undefined;

  return (
    <div className="adr-page">
      <div className="adr-wrap">
        {/* ── Hero ── */}
        <section className="craft-hero craft-rise adr-hero">
          <div className="adr-hero-row">
            <div>
              <span className="craft-eyebrow">Sổ địa chỉ của bạn</span>
              <h1 className="craft-title">
                Địa chỉ <em>giao hàng</em>
              </h1>
              <div className="craft-stitch" aria-hidden="true" />
              <p className="craft-subtitle">Lưu sẵn nơi nhận để mỗi cuộn len về đúng nhà, nhanh hơn khi thanh toán.</p>
              {!loading && addresses.length > 0 && (
                <div className="craft-stats">
                  <div className="craft-stat">
                    <span className="craft-stat-icon">
                      <BookUser className="size-4" />
                    </span>
                    <div>
                      <p className="craft-stat-num">{addresses.length}</p>
                      <p className="craft-stat-label">địa chỉ đã lưu</p>
                    </div>
                  </div>
                  <div className="craft-stat">
                    <span className="craft-stat-icon">
                      <MapPinned className="size-4" />
                    </span>
                    <div>
                      <p className="craft-stat-num">{pinnedCount}</p>
                      <p className="craft-stat-label">đã ghim bản đồ</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!showForm && !loading && addresses.length > 0 && (
              <button type="button" onClick={openCreate} className="craft-btn">
                <Plus className="size-4" />
                Thêm địa chỉ
              </button>
            )}
          </div>
        </section>

        {/* ── Form ── */}
        <AnimatePresence initial={false}>
          {showForm && (
            <motion.div
              key="form"
              ref={formRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="adr-panel"
            >
              <div className="adr-panel-head">
                <div className="craft-section-head">
                  <span className="craft-section-icon">
                    {editingId ? <Pencil className="size-[18px]" /> : <Plus className="size-[18px]" />}
                  </span>
                  <div>
                    <h2 className="craft-section-title">{editingId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}</h2>
                    <p className="craft-section-sub">Các trường có dấu * là bắt buộc</p>
                  </div>
                </div>
                <button type="button" className="adr-close" onClick={resetForm} aria-label="Đóng">
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="adr-form" noValidate>
                {/* Người nhận */}
                <fieldset className="adr-fieldset">
                  <legend className="adr-legend">
                    <User className="size-3.5" />
                    Người nhận
                  </legend>
                  <div className="co-grid cols-2">
                    <div>
                      <label htmlFor="adr-name" className="co-label">
                        Họ tên<span className="co-req">*</span>
                      </label>
                      <input
                        id="adr-name"
                        {...register("fullName", {
                          validate: (v) => v.trim().length > 0 || "Vui lòng nhập họ tên",
                        })}
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                        className={`co-input${errors.fullName ? " is-invalid" : ""}`}
                      />
                      {errors.fullName && <p className="co-error">{errors.fullName.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="adr-phone" className="co-label">
                        Số điện thoại<span className="co-req">*</span>
                      </label>
                      <input
                        id="adr-phone"
                        type="tel"
                        inputMode="tel"
                        {...register("phone", {
                          required: "Vui lòng nhập số điện thoại",
                          validate: (v) =>
                            PHONE_PATTERN.test(v.trim().replace(/\s/g, "")) || "Số điện thoại không hợp lệ",
                        })}
                        placeholder="0901234567"
                        autoComplete="tel"
                        className={`co-input${errors.phone ? " is-invalid" : ""}`}
                      />
                      {errors.phone && <p className="co-error">{errors.phone.message}</p>}
                    </div>
                  </div>
                </fieldset>

                {/* Khu vực */}
                <fieldset className="adr-fieldset">
                  <legend className="adr-legend">
                    <MapPin className="size-3.5" />
                    Khu vực
                  </legend>
                  <div className="co-grid cols-3">
                    <div>
                      <label htmlFor="adr-province" className="co-label">
                        Tỉnh/Thành phố<span className="co-req">*</span>
                      </label>
                      <select
                        id="adr-province"
                        value={selectedProvince?.provinceId || ""}
                        onChange={(e) =>
                          handleProvinceChange(provinces.find((p) => p.provinceId === Number(e.target.value)) || null)
                        }
                        className={`co-select${areaError && !selectedProvince ? " is-invalid" : ""}`}
                      >
                        <option value="">Chọn tỉnh/thành phố</option>
                        {provinces.map((province) => (
                          <option key={province.provinceId} value={province.provinceId}>
                            {province.provinceName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="adr-district" className="co-label">
                        Quận/Huyện<span className="co-req">*</span>
                      </label>
                      <select
                        id="adr-district"
                        value={selectedDistrict?.districtId || ""}
                        onChange={(e) =>
                          handleDistrictChange(districts.find((d) => d.districtId === Number(e.target.value)) || null)
                        }
                        disabled={!selectedProvince}
                        className={`co-select${areaError && selectedProvince && !selectedDistrict ? " is-invalid" : ""}`}
                      >
                        <option value="">Chọn quận/huyện</option>
                        {districts.map((district) => (
                          <option key={district.districtId} value={district.districtId}>
                            {district.districtName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="adr-ward" className="co-label">
                        Phường/Xã<span className="co-req">*</span>
                      </label>
                      <select
                        id="adr-ward"
                        value={selectedWard?.wardCode || ""}
                        onChange={(e) => {
                          setSelectedWard(wards.find((w) => w.wardCode === e.target.value) || null);
                          setAreaError(false);
                        }}
                        disabled={!selectedDistrict}
                        className={`co-select${areaError && selectedDistrict && !selectedWard ? " is-invalid" : ""}`}
                      >
                        <option value="">Chọn phường/xã</option>
                        {wards.map((ward) => (
                          <option key={ward.wardCode} value={ward.wardCode}>
                            {ward.wardName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {areaError && <p className="co-error">Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã</p>}

                  <div className="mt-3.5">
                    <label htmlFor="adr-line" className="co-label">
                      Địa chỉ chi tiết<span className="co-req">*</span>
                    </label>
                    <input
                      id="adr-line"
                      {...register("address", {
                        validate: (v) => v.trim().length > 0 || "Vui lòng nhập số nhà, tên đường",
                      })}
                      placeholder="Số nhà, tên đường"
                      autoComplete="street-address"
                      className={`co-input${errors.address ? " is-invalid" : ""}`}
                    />
                    {errors.address && <p className="co-error">{errors.address.message}</p>}
                  </div>
                </fieldset>

                {/* Bản đồ */}
                <div className="adr-map-block" data-open={showMap}>
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="adr-map-toggle"
                    aria-expanded={showMap}
                  >
                    <span className="adr-map-toggle-icon">
                      <MapIcon className="size-4" />
                    </span>
                    <span className="flex-1 text-left">
                      <span className="adr-map-toggle-title">
                        {showMap ? "Ẩn bản đồ" : "Ghim vị trí trên bản đồ"}
                      </span>
                      <span className="adr-map-toggle-sub">
                        {hasPin
                          ? `Đã ghim · ${mapLat!.toFixed(4)}, ${mapLng!.toFixed(4)}`
                          : "Không bắt buộc — giúp shipper tìm đúng nhà và tự điền khu vực"}
                      </span>
                    </span>
                    {hasPin && <Check className="size-4 text-primary" />}
                  </button>

                  {showMap && (
                    <div className="adr-map">
                      <MapPicker initialLat={mapLat} initialLng={mapLng} onLocationSelect={handleLocationSelect} />
                    </div>
                  )}
                </div>

                {/* Mặc định */}
                <label className="adr-default">
                  <input type="checkbox" {...register("isDefault")} className="adr-default-input" />
                  <span className="adr-default-track" aria-hidden="true" />
                  <span>
                    <span className="adr-default-title">Đặt làm địa chỉ mặc định</span>
                    <span className="adr-default-sub">Tự chọn sẵn khi thanh toán</span>
                  </span>
                </label>

                <div className="adr-form-actions">
                  <button type="button" onClick={resetForm} className="craft-btn-ghost">
                    Hủy
                  </button>
                  <button type="submit" disabled={submitting} className="craft-btn">
                    {submitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm địa chỉ"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Danh sách ── */}
        {loading ? (
          <ul className="adr-grid" aria-busy="true">
            {[0, 1].map((i) => (
              <li key={i} className="craft-skeleton adr-skeleton" />
            ))}
          </ul>
        ) : addresses.length === 0 ? (
          !showForm && (
            <div className="craft-empty craft-rise">
              <img src="/mascot.png" alt="" aria-hidden="true" className="adr-empty-mascot" draggable={false} />
              <p className="craft-empty-title">Chưa có địa chỉ nào</p>
              <p className="craft-empty-desc">Thêm địa chỉ giao hàng để thuận tiện khi đặt hàng.</p>
              <button type="button" onClick={openCreate} className="craft-btn">
                <Plus className="size-4" />
                Thêm địa chỉ đầu tiên
              </button>
            </div>
          )
        ) : (
          <section>
            <div className="craft-section-head">
              <span className="craft-section-icon">
                <BookUser className="size-[18px]" />
              </span>
              <h2 className="craft-section-title">Địa chỉ đã lưu</h2>
              <span className="craft-section-thread" aria-hidden="true" />
            </div>
            <ul className="adr-grid">
              <AnimatePresence initial={false}>
                {sortedAddresses.map((address) => (
                  <AddressCard
                    key={address._id}
                    address={address}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSetDefault={handleSetDefault}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
