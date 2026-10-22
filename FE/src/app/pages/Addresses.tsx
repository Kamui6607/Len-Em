// ============================================================
// Address Management Page — route /addresses
// Sổ địa chỉ — nguồn địa chỉ cho đăng ký, hồ sơ và đặt hàng.
// Khu vực: chọn tỉnh/quận/phường (GHN) HOẶC ghim bản đồ; luôn kèm địa chỉ chi tiết.
// Giao diện theo ngôn ngữ "craft" (xem craft.css + addresses.css)
// ============================================================

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  BookUser,
  Check,
  List,
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
import { AddressSelector, type AddressMode, type AddressPick } from "../../shared/components/address/AddressSelector";
import {
  addressToLocation,
  formatAddressArea,
  pickAreaError,
  pickToAddressFields,
} from "../../shared/components/address/addressBook";
import type { Address, AddressLocation, CreateAddressRequest } from "../../shared/types/address.types";
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
        <p className="adr-card-area">{formatAddressArea(address)}</p>
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

  // Khu vực: chọn tỉnh/quận/phường HOẶC ghim bản đồ — AddressSelector báo lên.
  const [addressPick, setAddressPick] = useState<AddressPick | null>(null);
  const [initialLocation, setInitialLocation] = useState<AddressLocation | null>(null);
  const [areaError, setAreaError] = useState<string | null>(null);
  // Tăng mỗi lần mở form → AddressSelector mount lại với giá trị điền sẵn mới.
  const [formSession, setFormSession] = useState(0);
  // Nút "Thêm" nào được bấm → AddressSelector mở sẵn chế độ đó.
  const [createMode, setCreateMode] = useState<AddressMode>("dropdown");

  const formRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      isDefault: false,
    },
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  // Cuộn tới form khi mở
  useEffect(() => {
    if (showForm) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm, editingId]);

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

  const handlePickChange = (pick: AddressPick) => {
    setAddressPick(pick);
    setAreaError(null);
  };

  const onSubmit = async (data: AddressFormData) => {
    const areaProblem = pickAreaError(addressPick);
    if (areaProblem || !addressPick) {
      setAreaError(areaProblem);
      toast.error(areaProblem);
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateAddressRequest = {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        ...pickToAddressFields(addressPick),
        isDefault: data.isDefault,
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

  const openForm = (values: AddressFormData, location: AddressLocation | null, id: string | null) => {
    reset(values);
    setEditingId(id);
    setInitialLocation(location);
    setAddressPick(null);
    setAreaError(null);
    setFormSession((n) => n + 1);
    setShowForm(true);
  };

  // Địa chỉ đầu tiên luôn là mặc định
  const openCreate = (mode: AddressMode) => {
    setCreateMode(mode);
    openForm({ fullName: "", phone: "", address: "", isDefault: addresses.length === 0 }, null, null);
  };

  // Hai lối thêm địa chỉ — dùng ở đầu trang và ở trạng thái trống
  const addButtons = (
    <div className="adr-add-actions">
      <button type="button" onClick={() => openCreate("dropdown")} className="craft-btn">
        <List className="size-4" />
        Chọn khu vực
      </button>
      <button type="button" onClick={() => openCreate("map")} className="craft-btn-ghost">
        <MapIcon className="size-4" />
        Ghim trên bản đồ
      </button>
    </div>
  );

  const handleEdit = (address: Address) =>
    openForm(
      {
        fullName: address.fullName,
        phone: address.phone,
        address: address.address,
        isDefault: address.isDefault,
      },
      addressToLocation(address),
      address._id,
    );

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
    setInitialLocation(null);
    setAddressPick(null);
    setAreaError(null);
  };

  // Mặc định lên đầu
  const sortedAddresses = [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  const pinnedCount = addresses.filter((a) => a.lat !== undefined && a.lat !== null).length;

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

            {!showForm && !loading && addresses.length > 0 && addButtons}
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

                {/* Địa chỉ: chọn khu vực HOẶC ghim bản đồ — cả hai đều cần địa chỉ chi tiết */}
                <fieldset className="adr-fieldset">
                  <legend className="adr-legend">
                    <MapPin className="size-3.5" />
                    Địa chỉ nhận hàng
                  </legend>
                  <AddressSelector
                    key={formSession}
                    idPrefix="adr"
                    initialValue={initialLocation}
                    initialMode={createMode}
                    initialStreet={initialLocation ? getValues("address") : undefined}
                    onChange={handlePickChange}
                    onStreetSuggest={(street) => {
                      if (!getValues("address").trim()) setValue("address", street, { shouldValidate: true });
                    }}
                    mapHint="Chạm vào bản đồ để ghim nơi nhận hàng — khu vực sẽ được tự xác định."
                    required
                  />
                  {areaError && <p className="co-error">{areaError}</p>}

                  <div className="mt-3.5">
                    <label htmlFor="adr-line" className="co-label">
                      Địa chỉ chi tiết<span className="co-req">*</span>
                    </label>
                    <input
                      id="adr-line"
                      {...register("address", {
                        validate: (v) => v.trim().length > 0 || "Vui lòng nhập số nhà, tên đường",
                      })}
                      placeholder="Số nhà, tên đường, toà nhà"
                      autoComplete="street-address"
                      className={`co-input${errors.address ? " is-invalid" : ""}`}
                    />
                    {errors.address ? (
                      <p className="co-error">{errors.address.message}</p>
                    ) : (
                      <p className="co-hint">Không cần nhập lại phường/xã, quận/huyện, tỉnh/thành.</p>
                    )}
                  </div>
                </fieldset>

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
              <img src="/mascot-sheep.png" alt="" aria-hidden="true" className="adr-empty-mascot" draggable={false} />
              <p className="craft-empty-title">Chưa có địa chỉ nào</p>
              <p className="craft-empty-desc">Thêm địa chỉ giao hàng để thuận tiện khi đặt hàng.</p>
              {addButtons}
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
