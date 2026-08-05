// ============================================================
// Checkout Page — route /order
// Form nhập shippingAddress + chọn paymentMethod + tóm tắt giỏ hàng
// With GHN integration for address dropdowns and shipping fee calculation
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { Check, QrCode, ArrowLeft, ChevronDown, List, Map as MapIcon } from "lucide-react";
import { useCart } from "../../../context/CartContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuthStore } from "../../../store/auth.store";
import { orderApi } from "../../../api/orderService";
import { ghnApi } from "../../../api/ghnService";
import type {
  ShippingFeePreviewRequest,
} from "../../../features/orders/types/order.types";
import { MapPicker } from "../../../components/map/MapPicker";
import { formatPrice } from "../../../lib/formatPrice";
import { ColorSwatch } from "../../components/ui/ColorSwatch";
import { CoinUsage } from "../../components/membership/CoinUsage";
import type { CreateOrderRequest } from "../../../features/orders/types/order.types";
import type { GHNProvince, GHNDistrict, GHNWard } from "../../../types/ghn.types";
import type { ReverseGeocodeResult } from "../../../types/address.types";
import "./Checkout.css";

// ── Validation schema ──
const shippingSchema = yup.object({
  fullName: yup.string().required("Vui lòng nhập họ tên"),
  phone: yup
    .string()
    .required("Vui lòng nhập số điện thoại")
    .matches(/^(0|\+84)[3-9][0-9]{8}$/, "Số điện thoại không hợp lệ"),
  address: yup.string().required("Vui lòng nhập địa chỉ chi tiết"),
});

type ShippingFormData = yup.InferType<typeof shippingSchema>;

// ── Payment method config ──
const PAYMENT_METHODS = [
  {
    value: "COD" as const,
    label: "COD",
    icon: Check,
    description: "Thanh toán khi nhận hàng (COD)",
  },
  {
    value: "VNPAY" as const,
    label: "VNPAY",
    icon: QrCode,
    description: "Thanh toán qua VNPAY",
  },
  {
    value: "MOMO" as const,
    label: "MoMo",
    icon: QrCode,
    description: "Thanh toán qua MoMo",
  },
];

export function Checkout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { cartItems, cartKits, totalItems, totalPrice } = useCart();
  const user = useAuthStore((s) => s.user);
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY" | "MOMO" | "COD">("VNPAY");
  const [submitting, setSubmitting] = useState(false);
  const [coinDiscount, setCoinDiscount] = useState(0);
  const [calculatingFee, setCalculatingFee] = useState(false);

  // GHN address data
  const [provinces, setProvinces] = useState<GHNProvince[]>([]);
  const [districts, setDistricts] = useState<GHNDistrict[]>([]);
  const [wards, setWards] = useState<GHNWard[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<GHNProvince | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<GHNDistrict | null>(null);
  const [selectedWard, setSelectedWard] = useState<GHNWard | null>(null);

  // Address mode: "dropdown" (GHN API dropdowns) or "map" (map picker + map-address API)
  const [addressMode, setAddressMode] = useState<"dropdown" | "map">("dropdown");

  // Map state — coordinates + raw address names from map picker
  const [mapLat, setMapLat] = useState<number | undefined>(undefined);
  const [mapLng, setMapLng] = useState<number | undefined>(undefined);
  const [mapProvinceName, setMapProvinceName] = useState("");
  const [mapDistrictName, setMapDistrictName] = useState("");
  const [mapWardName, setMapWardName] = useState("");

  const subtotal = totalPrice;
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const grandTotal = Math.max(0, subtotal + (deliveryFee ?? 0) - coinDiscount);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: yupResolver(shippingSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
    },
  });

  // Pre-fill form with current user data
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user, reset]);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    try {
      const response = await ghnApi.getProvinces();
      setProvinces(response.data.data.provinces);
    } catch {
      toast.error("Không thể tải danh sách tỉnh/thành phố");
    }
  };

  // When province changes, load districts
  useEffect(() => {
    if (selectedProvince) {
      loadDistricts(selectedProvince.provinceId);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setWards([]);
      setDeliveryFee(null); // Reset delivery fee when province changes
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
      setDeliveryFee(null); // Reset delivery fee when district changes
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
  // The map picker returns raw address names + lat/lng. These are stored
  // directly and sent to POST /orders/shipping-fee for fee calculation —
  // the backend accepts name strings + coordinates, no GHN IDs needed.
  const handleLocationSelect = async (result: ReverseGeocodeResult) => {
    setMapLat(result.lat);
    setMapLng(result.lng);
    setMapProvinceName(result.provinceName?.trim() || "");
    setMapDistrictName(result.districtName?.trim() || "");
    setMapWardName(result.wardName?.trim() || "");

    // Bonus: try to auto-fill the GHN dropdowns via /ghn/map-address.
    // This does NOT block shipping fee calculation — fee is computed
    // directly from the map names + coordinates in the map-mode effect.
    const province = result.provinceName?.trim();
    const district = result.districtName?.trim();
    const ward = result.wardName?.trim();

    if (province || district || ward) {
      try {
        const mapRes = await ghnApi.mapAddress({
          provinceName: province || "",
          districtName: district || "",
          wardName: ward || "",
          // Include lat/lng so backend can use coordinate-based lookup
          ...(result.lat !== undefined && result.lng !== undefined
            ? { lat: result.lat, lng: result.lng }
            : {}),
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
        // Fallback: try fuzzy match on province name only (dropdowns remain empty)
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

  // ── Shared shipping fee calculator ──
  // Sends items + address names (+ optional lat/lng) to POST /orders/shipping-fee.
  const fetchShippingFee = async (
    provinceName: string,
    districtName: string,
    wardName: string,
    lat?: number,
    lng?: number
  ) => {
    if (cartItems.length === 0 && cartKits.length === 0) return;

    setCalculatingFee(true);
    try {
      // Build items array for shipping calculation
      // Include both individual cart items and kit products
      const itemsForShipping: ShippingFeePreviewRequest["items"] = [];
      
      // Add individual cart items
      cartItems.forEach((item) => {
        itemsForShipping.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        });
      });
      
      // Add kit products (expand kits into individual products for shipping calculation)
      cartKits.forEach((kit) => {
        kit.products.forEach((product) => {
          itemsForShipping.push({
            productId: product.productId,
            variantId: product.variantId,
            quantity: 1, // Each product in kit counts as 1 for shipping
          });
        });
      });

      // If still no items, skip calculation
      if (itemsForShipping.length === 0) {
        setDeliveryFee(null);
        return;
      }

      const payload: ShippingFeePreviewRequest = {
        items: itemsForShipping,
        provinceName,
        districtName,
        wardName,
        // Include lat/lng when available (map mode)
        ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
      };

      console.log("[Checkout] Calculating shipping fee with payload:", payload);
      const response = await orderApi.previewShippingFee(payload);
      const data = response.data;
      // Backend returns { subtotal, shippingFee, total }
      console.log("[Checkout] Shipping fee response:", data);
      setDeliveryFee(data.shippingFee ?? 0);
    } catch (error) {
      console.error("[Checkout] Failed to calculate shipping fee:", error);
      // Show a toast with the error so the user knows what happened
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errMsg = axiosError?.response?.data?.message;
      toast.error(errMsg || "Không thể tính phí vận chuyển. Vui lòng thử lại sau.");
    } finally {
      setCalculatingFee(false);
    }
  };

  // ── Effect 1: Dropdown mode — calculate fee when all 3 GHN dropdowns selected ──
  useEffect(() => {
    if (addressMode !== "dropdown") return;
    if (!selectedProvince || !selectedDistrict || !selectedWard) return;

    fetchShippingFee(
      selectedProvince.provinceName,
      selectedDistrict.districtName,
      selectedWard.wardName
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWard, selectedProvince, selectedDistrict, addressMode, cartItems, cartKits]);

  // ── Effect 2: Map mode — calculate fee directly from map result names + lat/lng ──
  // This does NOT depend on GHN dropdowns or /ghn/map-address. As soon as
  // the map picker returns provinceName/districtName/wardName + coordinates,
  // we send them straight to /orders/shipping-fee.
  useEffect(() => {
    if (addressMode !== "map") return;
    if (!mapProvinceName || !mapDistrictName || !mapWardName) return;
    if (mapLat === undefined || mapLng === undefined) return;

    fetchShippingFee(mapProvinceName, mapDistrictName, mapWardName, mapLat, mapLng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapProvinceName, mapDistrictName, mapWardName, mapLat, mapLng, addressMode, cartItems, cartKits]);

  const onSubmit = async (data: ShippingFormData) => {
    if (cartItems.length === 0 && cartKits.length === 0) {
      toast.error(t("checkout.cartEmpty"));
      setSubmitting(false);
      return;
    }

    // In map mode: use the raw names from the map picker directly.
    // In dropdown mode: use the GHN dropdown selections.
    const isMapMode = addressMode === "map";
    if (isMapMode) {
      if (!mapProvinceName || !mapDistrictName || !mapWardName) {
        toast.error("Vui lòng chọn vị trí trên bản đồ");
        return;
      }
    } else {
      if (!selectedProvince || !selectedDistrict || !selectedWard) {
        toast.error("Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        ...(cartKits.length > 0 ? {
          kits: cartKits.map((kit) => ({
            kitId: kit.kitId,
            quantity: kit.quantity,
          })),
        } : {}),
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          // Use map names in map mode, GHN dropdown names in dropdown mode
          wardName: isMapMode ? mapWardName : selectedWard!.wardName,
          districtName: isMapMode ? mapDistrictName : selectedDistrict!.districtName,
          provinceName: isMapMode ? mapProvinceName : selectedProvince!.provinceName,
          // Include lat/lng from map if available
          ...(mapLat !== undefined && mapLng !== undefined
            ? { lat: mapLat, lng: mapLng }
            : {}),
        },
        paymentMethod,
        ...(coinDiscount > 0 ? { coinUsed: coinDiscount } : {}),
      };

      const response = await orderApi.createOrder(payload);
      const result = response.data;

      // NOTE: Do NOT clear cart here! For VNPAY/MOMO, the user is redirected
      // to the payment gateway. If they press Back or payment fails, the cart
      // must still be intact. The cart is cleared on /order/success only after
      // payment is confirmed (or for COD, when the order is created successfully).

      if (result.payUrl) {
        // VNPAY/MOMO: redirect to payment gateway
        window.location.href = result.payUrl;
        return;
      }

      // For COD: navigate to /order/success so the cart is cleared
      // only after the order is confirmed. For other payment methods
      // without redirect, also go to success page.
      if (paymentMethod === "COD") {
        toast.success("Đặt hàng thành công! Vui lòng chuẩn bị tiền khi nhận hàng.");
        navigate(`/order/success?orderId=${result.order?._id ?? ""}`);
      } else {
        toast.success("Đặt hàng thành công!");
        navigate(`/order/success?orderId=${result.order?._id ?? ""}`);
      }
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const errData = axiosError?.response?.data;
      if (errData?.message) {
        toast.error(errData.message);
        if (errData.errors) {
          Object.entries(errData.errors).forEach(([key, msgs]) => {
            msgs.forEach((msg) => toast.error(`${key}: ${msg}`));
          });
        }
      } else {
        toast.error(t("checkout.orderFailed"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0 && cartKits.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-3">Giỏ hàng trống</h2>
          <p className="text-muted-foreground mb-6">
            Vui lòng thêm sản phẩm vào giỏ trước khi đặt hàng.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-colors font-medium"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 pb-[calc(env(safe-area-inset-bottom)+90px)] md:pb-0">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại giỏ hàng
        </Link>

        <h1 className="text-3xl font-semibold mb-6">Đặt hàng</h1>

        {/* ── Thread rail: tiến trình đặt hàng ── */}
        <div className="checkout-rail mb-8">
          <div className="checkout-rail-step">
            <div className="checkout-rail-dot is-done">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline text-xs font-medium text-foreground">
              Giỏ hàng
            </span>
          </div>
          <div className="checkout-rail-thread is-done" />
          <div className="checkout-rail-step">
            <div className="checkout-rail-dot is-current">2</div>
            <span className="hidden sm:inline text-xs font-semibold text-primary">
              Giao hàng & thanh toán
            </span>
          </div>
          <div className="checkout-rail-thread" />
          <div className="checkout-rail-step">
            <div className="checkout-rail-dot is-upcoming">3</div>
            <span className="hidden sm:inline text-xs font-medium text-muted-foreground">
              Hoàn tất
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-5 gap-8">
            {/* ── Left: Shipping Form + Payment ── */}
            <div className="lg:col-span-3 space-y-6">
              {/* Shipping Address */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">
                  Thông tin giao hàng
                </h2>

                {/* ── Address mode toggle: segmented pill ── */}
                <div className="checkout-segment flex rounded-xl border border-border bg-muted/40 p-1 mb-5">
                  <div
                    className={`checkout-segment-pill ${addressMode === "map" ? "is-right" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setAddressMode("dropdown")}
                    className={`checkout-segment-btn flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      addressMode === "dropdown"
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <List className="w-4 h-4" />
                    Chọn địa chỉ
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressMode("map")}
                    className={`checkout-segment-btn flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      addressMode === "map"
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MapIcon className="w-4 h-4" />
                    Chọn từ bản đồ
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Họ tên <span className="text-destructive">*</span>
                      </label>
                      <input
                        {...register("fullName")}
                        placeholder="Nguyễn Văn A"
                        className={`w-full px-4 py-3 bg-card border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base shadow-sm ${
                          errors.fullName
                            ? "border-destructive"
                            : "border-border/70 hover:border-primary/40"
                        }`}
                      />
                      {errors.fullName && (
                        <p className="text-destructive text-xs mt-1">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Số điện thoại <span className="text-destructive">*</span>
                      </label>
                      <input
                        {...register("phone")}
                        placeholder="0901234567"
                        className={`w-full px-4 py-3 bg-card border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base shadow-sm ${
                          errors.phone
                            ? "border-destructive"
                            : "border-border/70 hover:border-primary/40"
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-destructive text-xs mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ── Mode 1: Dropdown (GHN API) — 3 cột trên desktop ── */}
                  {addressMode === "dropdown" && (
                    <div className="grid sm:grid-cols-3 gap-4">
                      {/* Province Dropdown */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          Tỉnh/Thành phố <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={selectedProvince?.provinceId || ""}
                            onChange={(e) => {
                              const province = provinces.find(
                                (p) => p.provinceId === Number(e.target.value)
                              );
                              setSelectedProvince(province || null);
                            }}
                            className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
                          >
                            <option value="">Chọn tỉnh/thành phố</option>
                            {provinces.map((province) => (
                              <option
                                key={province.provinceId}
                                value={province.provinceId}
                              >
                                {province.provinceName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {/* District Dropdown */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          Quận/Huyện <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={selectedDistrict?.districtId || ""}
                            onChange={(e) => {
                              const district = districts.find(
                                (d) => d.districtId === Number(e.target.value)
                              );
                              setSelectedDistrict(district || null);
                            }}
                            disabled={!selectedProvince}
                            className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">Chọn quận/huyện</option>
                            {districts.map((district) => (
                              <option
                                key={district.districtId}
                                value={district.districtId}
                              >
                                {district.districtName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {/* Ward Dropdown */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          Phường/Xã <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={selectedWard?.wardCode || ""}
                            onChange={(e) => {
                              const ward = wards.find(
                                (w) => w.wardCode === e.target.value
                              );
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
                    </div>
                  )}

                  {/* ── Mode 2: Map picker + /ghn/map-address ── */}
                  {addressMode === "map" && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Click vào bản đồ để chọn vị trí giao hàng. Hệ thống sẽ tự động xác định tỉnh/thành, quận/huyện, phường/xã.
                      </p>
                      <MapPicker
                        initialLat={mapLat}
                        initialLng={mapLng}
                        onLocationSelect={handleLocationSelect}
                      />
                      {(mapProvinceName || mapDistrictName || mapWardName) && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1">
                          <p className="text-sm font-medium text-primary">Địa chỉ đã chọn:</p>
                          <p className="text-sm text-muted-foreground">
                            {[mapWardName, mapDistrictName, mapProvinceName].filter(Boolean).join(", ") || "Đang xác định..."}
                          </p>
                          {mapLat !== undefined && mapLng !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              Tọa độ: {mapLat.toFixed(6)}, {mapLng.toFixed(6)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detailed Address */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Địa chỉ chi tiết <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register("address")}
                      placeholder="Ví dụ: 123 Nguyễn Văn Linh, P. Tân Phong, Q.7"
                      className={`w-full px-4 py-3 bg-card border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base shadow-sm ${
                        errors.address
                          ? "border-destructive"
                          : "border-border/70 hover:border-primary/40"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Nhập số nhà, tên đường, tòa nhà (không cần nhập lại phường/xã, quận/huyện, tỉnh/thành)
                    </p>
                    {errors.address && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">
                  Phương thức thanh toán
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const selected = paymentMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all ${
                          selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {selected && (
                          <span className="checkout-payment-check absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                            selected ? "bg-primary/15" : "bg-muted"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <span className="text-xs font-semibold text-center">
                          {method.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coin Usage */}
              <div>
                <CoinUsage
                  orderTotal={subtotal}
                  onCoinApplied={setCoinDiscount}
                  onCoinRemoved={() => setCoinDiscount(0)}
                />
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-24">
                <h3 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h3>

                {/* Cart items (read-only) */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {/* Kits */}
                  {cartKits.map((kit) => (
                    <div
                      key={kit.kitId}
                      className="flex items-start gap-3 py-2 border-b border-border/70"
                    >
                      <img
                        src={kit.thumbnail}
                        alt={kit.name}
                        className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = "true";
                            target.src = `https://picsum.photos/seed/${kit.kitId}/100/100`;
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {kit.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {kit.productCount} products included
                        </p>
                      </div>
                      <p className="text-sm font-medium flex-shrink-0">
                        {formatPrice(kit.price)}
                      </p>
                    </div>
                  ))}

                  {cartItems.map((item) => (
                    <div
                      key={`${item.productId}-${item.color}`}
                      className="flex items-start gap-3 py-2 border-b border-border/70 last:border-0"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = "true";
                            target.src = `https://picsum.photos/seed/${item.productId}/100/100`;
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <ColorSwatch
                            hexCode={item.hexCode}
                            colorName={item.color}
                            size="sm"
                          />
                          <span className="text-xs text-muted-foreground">
                            {item.color}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          SL: {item.quantity} x {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="text-sm font-medium flex-shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── Đường chỉ khâu ngăn cách ── */}
                <div className="checkout-stitch-divider mb-3" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Tạm tính ({totalItems} sản phẩm)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>
                      {calculatingFee
                        ? "Đang tính phí vận chuyển..."
                        : "Phí vận chuyển"}
                    </span>
                    <span>
                      {deliveryFee !== null
                        ? deliveryFee > 0
                          ? formatPrice(deliveryFee)
                          : "Miễn phí"
                        : calculatingFee
                        ? "..."
                        : "Chưa tính"}
                    </span>
                  </div>
                  {coinDiscount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Giảm giá Coin</span>
                      <span>-{formatPrice(coinDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-3 mt-1 border-t border-border">
                    <span>Tổng cộng</span>
                    <span className="text-primary">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || calculatingFee || deliveryFee === null}
                  className="w-full mt-6 bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ background: "var(--cta-gradient)", boxShadow: "var(--cta-shadow)" }}
                >
                  {submitting
                    ? "Đang xử lý..."
                    : calculatingFee
                    ? "Đang tính phí vận chuyển..."
                    : "Đặt hàng"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}