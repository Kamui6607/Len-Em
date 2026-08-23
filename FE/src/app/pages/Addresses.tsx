// ============================================================
// Address Management Page — route /addresses
// Manage shipping addresses with GHN cascading dropdowns
// With map pin integration for lat/lng
// ============================================================

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, MapPin, Trash2, Check, ChevronDown } from "lucide-react";
import { addressApi } from "../../shared/api/addressService";
import { ghnApi } from "../../shared/api/ghnService";
import { MapPicker } from "../../shared/components/map/MapPicker";
import type { Address, CreateAddressRequest, ReverseGeocodeResult } from "../../shared/types/address.types";
import type { GHNProvince, GHNDistrict, GHNWard } from "../../shared/types/ghn.types";

type AddressFormData = {
  fullName: string;
  phone: string;
  address: string;
  provinceId: number;
  districtId: number;
  wardCode: string;
  isDefault: boolean;
};

export function Addresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      provinceId: 0,
      districtId: 0,
      wardCode: "",
      isDefault: false,
    },
  });

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
    loadAddresses();
  }, []);

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

  // When province changes, load districts
  useEffect(() => {
    if (selectedProvince) {
      loadDistricts(selectedProvince.provinceId);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setWards([]);
    }
  }, [selectedProvince]);

  const loadDistricts = async (provinceId: number) => {
    try {
      const response = await ghnApi.getDistricts(provinceId);
      setDistricts(response.data.data.districts);
    } catch {
      toast.error("Không thể tải danh sách quận/huyện");
    }
  };

  // When district changes, load wards
  useEffect(() => {
    if (selectedDistrict) {
      loadWards(selectedDistrict.districtId);
      setSelectedWard(null);
    }
  }, [selectedDistrict]);

  const loadWards = async (districtId: number) => {
    try {
      const response = await ghnApi.getWards(districtId);
      setWards(response.data.data.wards);
    } catch {
      toast.error("Không thể tải danh sách phường/xã");
    }
  };

  // Handle map location selection
  const handleLocationSelect = async (result: ReverseGeocodeResult) => {
    setMapLat(result.lat);
    setMapLng(result.lng);

    // Only call /ghn/map-address if we have at least province name
    const province = result.provinceName?.trim();
    const district = result.districtName?.trim();
    const ward = result.wardName?.trim();

    if (province || district || ward) {
      try {
        const mapRes = await ghnApi.mapAddress({
          provinceName: province || "",
          districtName: district || "",
          wardName: ward || "",
        });
        const match = mapRes.data.data.match;
        if (match.success && match.provinceId) {
          // Auto-fill province
          const matchedProvince = provinces.find(
            (p) => p.provinceId === match.provinceId
          );
          if (matchedProvince) {
            setSelectedProvince(matchedProvince);

            // Auto-fill district
            if (match.districtId) {
              // Load districts first, then find and select
              const distRes = await ghnApi.getDistricts(match.provinceId);
              setDistricts(distRes.data.data.districts);
              const matchedDistrict = distRes.data.data.districts.find(
                (d) => d.districtId === match.districtId
              );
              if (matchedDistrict) {
                setSelectedDistrict(matchedDistrict);

                // Auto-fill ward
                if (match.wardCode) {
                  const wardRes = await ghnApi.getWards(match.districtId);
                  setWards(wardRes.data.data.wards);
                  const matchedWard = wardRes.data.data.wards.find(
                    (w) => w.wardCode === match.wardCode
                  );
                  if (matchedWard) {
                    setSelectedWard(matchedWard);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Map address mapping failed:", error);
        // Fallback: try fuzzy match on province name
        if (result.provinceName) {
          const matchedProvince = provinces.find(
            (p) =>
              p.provinceName.toLowerCase().includes(result.provinceName.toLowerCase()) ||
              result.provinceName.toLowerCase().includes(p.provinceName.toLowerCase())
          );
          if (matchedProvince) {
            setSelectedProvince(matchedProvince);
          }
        }
      }
    }
  };

  const onSubmit = async (data: AddressFormData) => {
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      toast.error("Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateAddressRequest = {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        wardCode: selectedWard.wardCode,
        wardName: selectedWard.wardName,
        districtId: selectedDistrict.districtId,
        districtName: selectedDistrict.districtName,
        provinceId: selectedProvince.provinceId,
        provinceName: selectedProvince.provinceName,
        isDefault: data.isDefault,
        // Include lat/lng from map if available
        ...(mapLat !== undefined && mapLng !== undefined
          ? { lat: mapLat, lng: mapLng }
          : {}),
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

  const handleEdit = (address: Address) => {
    setEditingId(address._id);
    setShowForm(true);

    // Find and set province
    const province = provinces.find((p) => p.provinceId === address.provinceId);
    if (province) setSelectedProvince(province);

    // Find and set district
    const district = districts.find((d) => d.districtId === address.districtId);
    if (district) setSelectedDistrict(district);

    // Find and set ward
    const ward = wards.find((w) => w.wardCode === address.wardCode);
    if (ward) setSelectedWard(ward);

    // Set map coordinates if available
    if (address.lat && address.lng) {
      setMapLat(address.lat);
      setMapLng(address.lng);
    }

    reset({
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      provinceId: address.provinceId,
      districtId: address.districtId,
      wardCode: address.wardCode,
      isDefault: address.isDefault,
    });
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;

    try {
      await addressApi.deleteAddress(addressId);
      toast.success("Xóa địa chỉ thành công");
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
    reset();
    setShowForm(false);
    setEditingId(null);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setShowMap(false);
    setMapLat(undefined);
    setMapLng(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Địa chỉ giao hàng</h1>
            <p className="text-muted-foreground">Quản lý địa chỉ giao hàng của bạn</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Thêm địa chỉ
            </button>
          )}
        </div>

        {/* Address Form */}
        {showForm && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Họ tên <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register("fullName")}
                    placeholder="Nguyễn Văn A"
                    className={`w-full px-4 py-3 bg-card border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                      errors.fullName ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-destructive text-xs mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Số điện thoại <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register("phone")}
                    placeholder="0901234567"
                    className={`w-full px-4 py-3 bg-card border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                      errors.phone ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tỉnh/Thành phố <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedProvince?.provinceId || ""}
                    onChange={(e) => {
                      const province = provinces.find((p) => p.provinceId === Number(e.target.value));
                      setSelectedProvince(province || null);
                    }}
                    className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
                  >
                    <option value="">Chọn tỉnh/thành phố</option>
                    {provinces.map((province) => (
                      <option key={province.provinceId} value={province.provinceId}>
                        {province.provinceName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Quận/Huyện <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedDistrict?.districtId || ""}
                    onChange={(e) => {
                      const district = districts.find((d) => d.districtId === Number(e.target.value));
                      setSelectedDistrict(district || null);
                    }}
                    disabled={!selectedProvince}
                    className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districts.map((district) => (
                      <option key={district.districtId} value={district.districtId}>
                        {district.districtName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phường/Xã <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedWard?.wardCode || ""}
                    onChange={(e) => {
                      const ward = wards.find((w) => w.wardCode === e.target.value);
                      setSelectedWard(ward || null);
                    }}
                    disabled={!selectedDistrict}
                    className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn phường/xã</option>
                    {wards.map((ward) => (
                      <option key={ward.wardCode} value={ward.wardCode}>
                        {ward.wardName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Địa chỉ chi tiết <span className="text-destructive">*</span>
                </label>
                <input
                  {...register("address")}
                  placeholder="Số nhà, tên đường"
                  className={`w-full px-4 py-3 bg-card border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                    errors.address ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.address && (
                  <p className="text-destructive text-xs mt-1">{errors.address.message}</p>
                )}
              </div>

              {/* Map Picker Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  {showMap ? "Ẩn bản đồ" : "Chọn vị trí trên bản đồ"}
                  {mapLat !== undefined && mapLng !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ({mapLat.toFixed(4)}, {mapLng.toFixed(4)})
                    </span>
                  )}
                </button>

                {showMap && (
                  <div className="mt-3">
                    <MapPicker
                      initialLat={mapLat}
                      initialLng={mapLng}
                      onLocationSelect={handleLocationSelect}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  {...register("isDefault")}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-full hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  {submitting ? "Đang xử lý..." : editingId ? "Cập nhật" : "Thêm địa chỉ"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border-2 border-border rounded-full hover:bg-muted transition-colors font-medium"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address List */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có địa chỉ nào</h3>
              <p className="text-muted-foreground mb-6">
                Thêm địa chỉ giao hàng để thuận tiện khi đặt hàng
              </p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Thêm địa chỉ đầu tiên
                </button>
              )}
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address._id}
                className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{address.fullName}</h3>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{address.phone}</span>
                      {address.isDefault && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{address.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.wardName}, {address.districtName}, {address.provinceName}
                    </p>
                    {address.lat && address.lng && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tọa độ: {address.lat.toFixed(4)}, {address.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address._id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Đặt làm mặc định"
                      >
                        <Check className="w-5 h-5 text-primary" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <MapPin className="w-5 h-5 text-primary" />
                    </button>
                    <button
                      onClick={() => handleDelete(address._id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-5 h-5 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}