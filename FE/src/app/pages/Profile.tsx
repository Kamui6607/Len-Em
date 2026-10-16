import { useState, useCallback, useRef, type ReactNode } from "react";
import { useAuth } from "../../shared/hooks/useAuth";
import { useMembershipStore } from "../../features/membership/store/membership.store";
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  ChevronRight,
  Pencil,
  ShieldCheck,
  KeyRound,
  LogOut,
  Eye,
  EyeOff,
  Loader as Loader2,
  Camera,
  Check,
  Copy,
  X,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  UserRound,
  Package,
  Heart,
  Flag,
  Crown,
  Circle,
  type LucideIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { authService } from "../../shared/api/authService";
import {
  userService,
  type UpdateUserRequest,
} from "../../features/users/services/user.service";
import { MembershipCard } from "../../shared/components/membership/MembershipCard";
import { RankBadge } from "../../shared/components/membership/RankBadge";
import { normalizeApiUserProfile } from "../../shared/types/auth.types";
import { useAuthStore } from "../../shared/store/auth.store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../shared/components/ui/dialog";
import { useLanguage } from "../../shared/contexts/LanguageContext";
import { DatePicker } from "../../shared/components/ui/DatePicker";
import { isoToUsDisplayDate } from "../../lib/dateInput";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import {
  AddressSelector,
  isPickComplete,
  isPickStarted,
  pickToLocation,
  sameLocation,
  type AddressPick,
} from "../../shared/components/address/AddressSelector";
import type { User } from "../../shared/types/auth.types";
import "../../styles/craft.css";
import "../../styles/profile.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Date of birth → mm/dd/yyyy cho form/display. DOB là field DUY NHẤT form
 * đăng ký gửi theo thứ tự month-first (xem src/lib/dateInput.ts) và form
 * admin cũng hiển thị mm/dd/yyyy — profile phải khớp cả hai.
 */
function formatDateForInput(iso: string): string {
  return isoToUsDisplayDate(iso);
}

function formatDateForDisplay(iso: string): string {
  return isoToUsDisplayDate(iso);
}

/** "12 Lê Lợi, Phường Bến Nghé, Quận 1, Hồ Chí Minh" — bỏ phần trống. */
function formatFullAddress(user: Pick<User, "address" | "addressLocation">): string {
  const loc = user.addressLocation;
  return [user.address, loc?.wardName, loc?.districtName, loc?.provinceName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

/** Label của các field trong modal Profile. */
const fieldLabelClass = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/** Style input / select / date-trigger dùng chung cho các modal của Profile. */
const fieldInputClass =
  "w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm transition-all placeholder:text-muted-foreground/60 hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

/** Tiêu đề panel theo craft: ô icon nghiêng + tên + đường chỉ kéo dài (+ action bên phải). */
function PanelHead({
  icon: Icon,
  title,
  sub,
  action,
}: {
  icon: LucideIcon;
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="craft-section-head">
      <span className="craft-section-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="craft-section-title">{title}</h2>
        {sub && <p className="craft-section-sub">{sub}</p>}
      </div>
      <span className="craft-section-thread" aria-hidden="true" />
      {action}
    </div>
  );
}

/** Thao tác tài khoản — dùng chung cho /profile và profile admin (đổi mật khẩu, đăng xuất). */
function AccountActions({
  onChangePassword,
  onSignOut,
}: {
  onChangePassword: () => void;
  onSignOut: () => void;
}) {
  const { t } = useLanguage();
  return (
    <section className="pf-panel">
      <PanelHead icon={ShieldCheck} title={t("profile.accountActions")} />
      <div className="pf-actions">
        <button type="button" onClick={onChangePassword} className="pf-action">
          <span className="pf-action-icon">
            <KeyRound size={17} aria-hidden="true" />
          </span>
          <span>
            {t("profile.changePassword")}
            <span className="pf-action-sub">{t("profile.changePasswordSub")}</span>
          </span>
          <ChevronRight size={16} className="pf-action-chev" aria-hidden="true" />
        </button>
        <button type="button" onClick={onSignOut} className="pf-action is-danger">
          <span className="pf-action-icon">
            <LogOut size={17} aria-hidden="true" />
          </span>
          <span>
            {t("profile.signOut")}
            <span className="pf-action-sub">{t("profile.signOutSub")}</span>
          </span>
          <ChevronRight size={16} className="pf-action-chev" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

/** Lời chào theo giờ trong ngày. */
function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 11) return "profile.greetingMorning";
  if (h < 18) return "profile.greetingAfternoon";
  return "profile.greetingEvening";
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ProfileProps {
  embedded?: boolean;
}

export function Profile({ embedded = false }: ProfileProps) {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { data, loading: membershipLoading } = useMembershipStore();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  // ── Edit Profile Modal ──
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    gender: "OTHER" as "MALE" | "FEMALE" | "OTHER",
    dateOfBirth: "",
  });
  // Khu vực tỉnh/huyện/xã (± toạ độ) đang chọn trong modal — AddressSelector báo lên.
  const [addressPick, setAddressPick] = useState<AddressPick | null>(null);
  // Tăng mỗi lần mở modal → AddressSelector mount lại và điền sẵn từ user mới nhất.
  const [editSession, setEditSession] = useState(0);

  // ── Change Password Modal ──
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  // ── File input ref for avatar ──
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Avatar crop state ──
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // Kích thước gốc của ảnh đang cắt (0 khi ảnh chưa load xong)
  const [avatarNatural, setAvatarNatural] = useState({ w: 0, h: 0 });
  const avatarImgRef = useRef<HTMLImageElement | null>(null);
  const CROP_SIZE = 280;
  // Ảnh xuất ra nét hơn khung cắt trên màn hình
  const AVATAR_OUTPUT_SIZE = 512;
  // Ở zoom = 1 ảnh vừa phủ kín khung tròn (cạnh ngắn = CROP_SIZE)
  const avatarBaseScale =
    avatarNatural.w && avatarNatural.h ? CROP_SIZE / Math.min(avatarNatural.w, avatarNatural.h) : 1;

  const isDashboardUser = user?.roleId === "admin" || user?.roleId === "staff";

  // ── Open edit modal with pre-filled data ──
  const openEditModal = useCallback(() => {
    if (!user) return;
    setEditForm({
      fullName: user.fullName || "",
      phone: user.phone || "",
      address: user.address || "",
      gender: user.gender || "OTHER",
      dateOfBirth: formatDateForInput(user.dateOfBirth),
    });
    setAddressPick(null);
    setEditSession((n) => n + 1);
    setEditOpen(true);
  }, [user]);

  // ── Submit edit profile (sends only changed fields) ──
  const handleEditSubmit = useCallback(async () => {
    if (!user) return;

    // Đã bắt đầu chọn khu vực thì phải đủ cả 3 cấp; bỏ trống cả 3 = xoá khu vực.
    if (addressPick && isPickStarted(addressPick) && !isPickComplete(addressPick)) {
      toast.error(t("profile.toastAddressIncomplete"));
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateUserRequest = {};
      if (editForm.fullName !== user.fullName)
        payload.fullName = editForm.fullName;
      if (editForm.phone !== user.phone) payload.phone = editForm.phone;
      if (editForm.address !== user.address) payload.address = editForm.address;
      if (addressPick) {
        const nextLocation = pickToLocation(addressPick);
        if (!sameLocation(nextLocation, user.addressLocation)) {
          payload.addressLocation = nextLocation;
        }
      }
      if (editForm.gender !== user.gender) payload.gender = editForm.gender;
      if (editForm.dateOfBirth !== formatDateForInput(user.dateOfBirth)) {
        // The API receives MM/DD/YYYY — the exact order the signup form sends
        // and the admin edit form forwards (see AdminUsersDialogs). Sending an
        // ISO string (yyyy-mm-dd) here made PATCH /users/{id} reject the whole
        // update with400, so pass the display value through unchanged.
        payload.dateOfBirth = editForm.dateOfBirth.trim();
      }

      if (Object.keys(payload).length === 0) {
        toast.info(t("profile.toastNoChanges"));
        setSaving(false);
        setEditOpen(false);
        return;
      }

      await userService.updateUser(user.userId, payload);

      // Refetch user profile
      const { data: profileRes } = await authService.getCurrentUser();
      const updatedUser = normalizeApiUserProfile(profileRes.data.userProfile);
      setUser(updatedUser);

      toast.success(t("profile.toastProfileSuccess"));
      setEditOpen(false);
    } catch {
      // Error toast is handled by axiosClient interceptor
    } finally {
      setSaving(false);
    }
  }, [user, editForm, addressPick, setUser, t]);

  // ── Avatar crop logic ──
  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        toast.error(t("profile.toastAvatarTypeError"));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setAvatarSrc(reader.result as string);
        setAvatarNatural({ w: 0, h: 0 });
        setAvatarZoom(1);
        setAvatarOffset({ x: 0, y: 0 });
        setAvatarModalOpen(true);
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [t],
  );

  const handleAvatarCancel = useCallback(() => {
    setAvatarModalOpen(false);
    setAvatarSrc(null);
    setAvatarNatural({ w: 0, h: 0 });
    setAvatarZoom(1);
    setAvatarOffset({ x: 0, y: 0 });
  }, []);

  /** Giữ ảnh luôn phủ kín khung tròn — không kéo lộ khoảng trống. */
  const clampAvatarOffset = useCallback(
    (offset: { x: number; y: number }, zoom: number) => {
      const maxX = Math.max(0, (avatarNatural.w * avatarBaseScale * zoom - CROP_SIZE) / 2);
      const maxY = Math.max(0, (avatarNatural.h * avatarBaseScale * zoom - CROP_SIZE) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, offset.x)),
        y: Math.min(maxY, Math.max(-maxY, offset.y)),
      };
    },
    [avatarNatural, avatarBaseScale],
  );

  const handleAvatarConfirm = useCallback(async () => {
    if (!avatarSrc || !user || !avatarImgRef.current || !avatarNatural.w) return;

    setUploadingAvatar(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setUploadingAvatar(false);
        return;
      }

      canvas.width = AVATAR_OUTPUT_SIZE;
      canvas.height = AVATAR_OUTPUT_SIZE;

      // Số px màn hình ứng với 1 px ảnh gốc. Tâm ảnh nằm ở tâm khung + offset,
      // nên góc trên-trái khung cắt (theo px gốc) = tâm ảnh - (nửa khung + offset) / scale.
      const scale = avatarBaseScale * avatarZoom;
      const sSize = CROP_SIZE / scale;
      const sx = avatarNatural.w / 2 - (CROP_SIZE / 2 + avatarOffset.x) / scale;
      const sy = avatarNatural.h / 2 - (CROP_SIZE / 2 + avatarOffset.y) / scale;

      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(avatarImgRef.current, sx, sy, sSize, sSize, 0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setUploadingAvatar(false);
            return;
          }
          const cropFile = new File([blob], "avatar.png", { type: "image/png" });

          try {
            const { data: res } = await userService.uploadAvatar(
              user.userId,
              cropFile
            );
            const avatarUrl = resolveAvatarUrl(res.data.updatedUser.avatar);
            setUser({ ...user, avatar: avatarUrl });
            toast.success(t("profile.toastAvatarSuccess"));
            handleAvatarCancel();
          } catch {
            // Error toast handled by axiosClient
          } finally {
            setUploadingAvatar(false);
          }
        },
        "image/png",
        1.0
      );
    } catch {
      setUploadingAvatar(false);
    }
  }, [avatarSrc, avatarNatural, avatarBaseScale, avatarOffset, avatarZoom, user, setUser, t, handleAvatarCancel]);

  const handleAvatarImgLoad = useCallback(() => {
    const img = avatarImgRef.current;
    if (!img) return;
    setAvatarNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setAvatarZoom(1);
    setAvatarOffset({ x: 0, y: 0 });
  }, []);

  const handleZoomChange = useCallback(
    (z: number) => {
      setAvatarZoom(z);
      // Thu nhỏ có thể làm lộ mép ảnh → kéo offset về trong giới hạn mới
      setAvatarOffset((prev) => clampAvatarOffset(prev, z));
    },
    [clampAvatarOffset],
  );

  const onAvatarPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      setDragStart({ x: e.clientX - avatarOffset.x, y: e.clientY - avatarOffset.y });
    },
    [avatarOffset]
  );

  const onAvatarPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setAvatarOffset(
        clampAvatarOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }, avatarZoom),
      );
    },
    [isDragging, dragStart, avatarZoom, clampAvatarOffset]
  );

  const onAvatarPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ── Change password ──
  const handleChangePassword = useCallback(async () => {
    if (!user) return;

    if (
      !pwdForm.oldPassword ||
      !pwdForm.newPassword ||
      !pwdForm.confirmNewPassword
    ) {
      toast.error(t("profile.toastPasswordRequired"));
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      toast.error(t("profile.toastPasswordMinLength"));
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmNewPassword) {
      toast.error(t("profile.toastPasswordMismatch"));
      return;
    }

    setChangingPwd(true);
    try {
      await authService.changePassword({
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword,
        email: user.email,
      });
      toast.success(t("profile.toastPasswordSuccess"));
      setPwdOpen(false);
      setPwdForm({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch {
      // Error toast handled by axiosClient
    } finally {
      setChangingPwd(false);
    }
  }, [user, pwdForm, t]);

  // ── Logout ──
  const handleLogout = useCallback(() => {
    signOut();
    navigate("/auth/login", { replace: true });
  }, [signOut, navigate]);

  // ── Click-to-copy trên các hàng thông tin cá nhân ──
  const handleCopy = useCallback(
    async (value: string) => {
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        toast.success(t("profile.copied"));
      } catch {
        // Clipboard bị chặn (insecure context / permission) — im lặng.
      }
    },
    [t],
  );

  if (!user) return null;

  const initials =
    user.fullName
      ?.split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const genderLabel: Record<User["gender"], string> = {
    MALE: t("profile.maleOption"),
    FEMALE: t("profile.femaleOption"),
    OTHER: t("profile.otherOption"),
  };
  const fullAddress = formatFullAddress(user);
  const dob = formatDateForDisplay(user.dateOfBirth);

  const infoRows: { icon: LucideIcon; label: string; value: string; wide?: boolean }[] = [
    { icon: Mail, label: t("profile.emailLabel"), value: user.email },
    { icon: Phone, label: t("profile.phoneLabel"), value: user.phone },
    { icon: Calendar, label: t("profile.dobLabel"), value: dob },
    { icon: UserRound, label: t("profile.genderLabel"), value: user.gender ? genderLabel[user.gender] : "" },
    { icon: MapPin, label: t("profile.addressLabel"), value: fullAddress, wide: true },
  ];

  // Hồ sơ hoàn thiện: ảnh đại diện, SĐT, địa chỉ đầy đủ, ngày sinh.
  const completeness = [
    Boolean(user.avatar),
    Boolean(user.phone?.trim()),
    Boolean(user.address?.trim() && user.addressLocation?.wardName),
    Boolean(dob),
  ];
  const completePercent = Math.round((completeness.filter(Boolean).length / completeness.length) * 100);

  // Tên gọi (từ cuối) tô màu primary: "Nguyễn Thị *Lan*".
  const nameParts = (user.fullName || "").trim().split(/\s+/);
  const givenName = nameParts.length > 1 ? nameParts.pop() : null;

  const shortcuts: { icon: LucideIcon; label: string; sub: string; to: string }[] = [
    { icon: Package, label: t("profile.shortcutOrders"), sub: t("profile.shortcutOrdersSub"), to: "/purchased" },
    { icon: Heart, label: t("profile.shortcutLove"), sub: t("profile.shortcutLoveSub"), to: "/love" },
    { icon: MapPin, label: t("profile.shortcutAddresses"), sub: t("profile.shortcutAddressesSub"), to: "/addresses" },
    { icon: Flag, label: t("profile.shortcutReports"), sub: t("profile.shortcutReportsSub"), to: "/orders/reports" },
  ];

  return (
    <div className="pf-page" data-embedded={embedded}>
      <div className="pf-wrap">
        {/* ── Hero: avatar + lời chào + thao tác chính ── */}
        <section className="craft-hero craft-rise" aria-label={t("profile.title")}>
          <div className="pf-hero-grid">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="pf-avatar"
              title={t("profile.changeAvatar")}
              aria-label={t("profile.changeAvatar")}
            >
              <span className="pf-avatar-inner">
                {user.avatar ? <img src={user.avatar} alt="" /> : initials}
              </span>
              <span className="pf-avatar-cam" aria-hidden="true">
                <Camera size={15} />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div className="min-w-0">
              <span className="craft-eyebrow">{t(greetingKey())}</span>
              <h1 className="pf-hero-name">
                {givenName ? (
                  <>
                    {nameParts.join(" ")} <em>{givenName}</em>
                  </>
                ) : (
                  user.fullName
                )}
              </h1>
              <div className="pf-hero-meta">
                {isDashboardUser && (
                  <span className="pf-chip is-role">
                    <ShieldCheck size={13} aria-hidden="true" />
                    {user.roleId}
                  </span>
                )}
                {!isDashboardUser && membershipLoading && (
                  <span className="craft-skeleton h-7 w-28 rounded-full" aria-hidden="true" />
                )}
                {!isDashboardUser && !membershipLoading && data && (
                  <Link to="/my-account/membership" className="pf-chip is-rank">
                    <RankBadge rank={data.rank} size="sm" showLabel />
                  </Link>
                )}
                <span className="pf-chip">
                  <Mail size={13} aria-hidden="true" />
                  {user.email}
                </span>
              </div>
              <p className="craft-subtitle mt-3">
                {isDashboardUser ? t("profile.subtitleAdmin") : t("profile.subtitleUser")}
              </p>
            </div>

            <div className="pf-hero-actions">
              <button type="button" onClick={openEditModal} className="craft-btn">
                <Pencil size={15} aria-hidden="true" />
                {t("profile.editButton")}
              </button>
              <button type="button" onClick={() => setPwdOpen(true)} className="craft-btn-ghost">
                <KeyRound size={15} aria-hidden="true" />
                {t("profile.changePassword")}
              </button>
            </div>
          </div>
        </section>

        <div className="pf-layout">
          {/* ── Cột trái: thông tin + lối tắt ── */}
          <div className="pf-col">
            <section className="pf-panel craft-rise" style={{ animationDelay: "60ms" }}>
              <PanelHead
                icon={UserRound}
                title={t("profile.personalInfo")}
                sub={t("profile.personalInfoSub")}
                action={
                  <button type="button" onClick={openEditModal} className="pf-panel-link">
                    <Pencil size={13} aria-hidden="true" /> {t("profile.editButton")}
                  </button>
                }
              />
              <div className="pf-info">
                {infoRows.map((row) => {
                  const Icon = row.icon;
                  const empty = !row.value?.trim();
                  return (
                    <button
                      key={row.label}
                      type="button"
                      disabled={empty}
                      onClick={() => handleCopy(row.value)}
                      className={`pf-info-item${row.wide ? " is-wide" : ""}${empty ? " is-empty" : ""}`}
                      title={empty ? undefined : t("profile.copyHint")}
                    >
                      <span className="pf-info-icon" aria-hidden="true">
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="pf-info-label block">{row.label}</span>
                        <span className="pf-info-value block">{empty ? t("profile.notSet") : row.value}</span>
                      </span>
                      {!empty && <Copy size={13} className="pf-info-copy" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>

              <div className="pf-complete">
                <span className="pf-complete-num">{completePercent}%</span>
                <div className="pf-complete-body">
                  <p className="pf-complete-title">
                    {completePercent === 100 ? t("profile.completeDone") : t("profile.completeTitle")}
                  </p>
                  {completePercent < 100 && <p className="pf-complete-hint">{t("profile.completeHint")}</p>}
                  <div
                    className="pf-complete-track"
                    role="progressbar"
                    aria-valuenow={completePercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t("profile.completeTitle")}
                  >
                    <div className="pf-complete-fill" style={{ width: `${completePercent}%` }} />
                  </div>
                </div>
                {completePercent < 100 && (
                  <button type="button" onClick={openEditModal} className="pf-complete-btn">
                    {t("profile.completeAction")}
                  </button>
                )}
              </div>
            </section>

            {!isDashboardUser && (
              <section className="pf-panel craft-rise" style={{ animationDelay: "120ms" }}>
                <PanelHead icon={Package} title={t("profile.shortcuts")} />
                <div className="pf-shortcuts">
                  {shortcuts.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.to} to={item.to} className="pf-shortcut">
                        <span className="pf-shortcut-icon" aria-hidden="true">
                          <Icon size={18} />
                        </span>
                        <span className="pf-shortcut-label">{item.label}</span>
                        <span className="pf-shortcut-sub">{item.sub}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* ── Cột phải — /profile: Thành viên + Thao tác · admin/staff: Vai trò + Thao tác ── */}
          <div className="pf-col">
            {!isDashboardUser ? (
              <section className="pf-panel craft-rise" style={{ animationDelay: "90ms" }}>
                <PanelHead
                  icon={Crown}
                  title={t("profile.membership")}
                  action={
                    <Link to="/my-account/membership" className="pf-panel-link">
                      {t("profile.viewDetails")} <ChevronRight size={14} aria-hidden="true" />
                    </Link>
                  }
                />
                <MembershipCard
                  onViewHistory={() => navigate("/my-account/membership?tab=history")}
                  onViewBenefits={() => navigate("/my-account/membership?tab=benefits")}
                  onViewTimeline={() => navigate("/my-account/membership?tab=timeline")}
                />
              </section>
            ) : (
              /* Role card — CHỈ admin/staff (không đưa xuống /profile) */
              <section className="pf-panel craft-rise" style={{ animationDelay: "90ms" }}>
                <PanelHead icon={ShieldCheck} title={t("profile.roleAccess")} />
                <div className="pf-role">
                  <span className="pf-info-icon" aria-hidden="true">
                    <ShieldCheck size={17} />
                  </span>
                  <div>
                    <p className="pf-info-label">{t("profile.currentRole")}</p>
                    <p className="pf-info-value capitalize">{user.roleId}</p>
                  </div>
                </div>
                <p className="pf-role-desc">
                  {user.roleId === "admin" ? t("profile.adminDescription") : t("profile.staffDescription")}
                </p>
              </section>
            )}

            <AccountActions onChangePassword={() => setPwdOpen(true)} onSignOut={handleLogout} />
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="glass-panel-solid max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <div className="pf-modal-head">
              <span className="pf-modal-icon">
                <Pencil className="size-4" />
              </span>
              <div>
                <DialogTitle className="pf-modal-title">
                  {t("profile.editProfileTitle")}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  {t("profile.editProfileDesc")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Grid2 cột trên sm+: họ tên full-width, các field ngắn xếp cặp cho gọn */}
          <div className="grid grid-cols-1 gap-4 py-1 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("profile.fullNameLabel")}
              </label>
              <input
                type="text"
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, fullName: e.target.value }))
                }
                className={fieldInputClass}
                placeholder={t("profile.fullNamePlaceholder")}
              />
            </div>

            {/* Phone | Gender */}
            <div className="space-y-1.5">
              <label className={fieldLabelClass}>
                {t("profile.phoneLabel")}
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
                className={fieldInputClass}
                placeholder={t("profile.phonePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <label className={fieldLabelClass}>
                {t("profile.genderLabel")}
              </label>
              <div className="relative">
                <select
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      gender: e.target.value as "MALE" | "FEMALE" | "OTHER",
                    }))
                  }
                  className={`${fieldInputClass} appearance-none pr-10`}
                >
                  <option value="MALE">{t("profile.maleOption")}</option>
                  <option value="FEMALE">{t("profile.femaleOption")}</option>
                  <option value="OTHER">{t("profile.otherOption")}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className={fieldLabelClass}>
                {t("profile.dobLabelLong")}
              </label>
              <DatePicker
                value={editForm.dateOfBirth}
                onChange={(value) =>
                  setEditForm((f) => ({ ...f, dateOfBirth: value }))
                }
                format="mm/dd/yyyy"
                placeholder={t("profile.dobPlaceholder")}
                triggerClassName={`${fieldInputClass} flex items-center justify-between gap-2 text-left`}
              />
            </div>

            {/* Address — khu vực (dropdown GHN / bản đồ) + dòng chi tiết */}
            <fieldset className="min-w-0 space-y-3 sm:col-span-2">
              <legend className={`${fieldLabelClass} mb-1.5`}>
                {t("profile.addressLabel")}
              </legend>
              <AddressSelector
                key={editSession}
                idPrefix="profile-address"
                initialValue={user.addressLocation}
                initialStreet={user.address}
                onChange={setAddressPick}
                onStreetSuggest={(street) =>
                  setEditForm((f) => (f.address.trim() ? f : { ...f, address: street }))
                }
                labelClassName={`${fieldLabelClass} mb-1.5 block`}
              />
              <div className="space-y-1.5">
                <label htmlFor="profile-address-detail" className={fieldLabelClass}>
                  {t("profile.addressDetailLabel")}
                </label>
                <input
                  id="profile-address-detail"
                  type="text"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className={fieldInputClass}
                  placeholder={t("profile.addressDetailPlaceholder")}
                  autoComplete="street-address"
                />
                <p className="text-xs text-muted-foreground">
                  {t("profile.addressDetailHint")}
                </p>
              </div>
            </fieldset>
          </div>

          <DialogFooter className="pf-modal-foot gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="craft-btn-ghost"
              disabled={saving}
            >
              {t("profile.cancelButton")}
            </button>
            <button
              type="button"
              onClick={handleEditSubmit}
              disabled={saving}
              className="craft-btn"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? t("profile.savingButton") : t("profile.saveChanges")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Password Modal ── */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent className="sm:max-w-md glass-panel-solid">
          <DialogHeader>
            <div className="pf-modal-head">
              <span className="pf-modal-icon">
                <KeyRound className="size-4" />
              </span>
              <div>
                <DialogTitle className="pf-modal-title">{t("profile.changePasswordTitle")}</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  {t("profile.changePasswordDesc")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Old Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("profile.currentPasswordLabel")}
              </label>
              <div className="relative">
                <input
                  type={showOldPwd ? "text" : "password"}
                  value={pwdForm.oldPassword}
                  onChange={(e) =>
                    setPwdForm((f) => ({ ...f, oldPassword: e.target.value }))
                  }
                  className={`${fieldInputClass} pr-10`}
                  placeholder={t("profile.currentPasswordPlaceholder")}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPwd((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showOldPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("profile.newPasswordLabel")}
              </label>
              <div className="relative">
                <input
                  type={showNewPwd ? "text" : "password"}
                  value={pwdForm.newPassword}
                  onChange={(e) =>
                    setPwdForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  className={`${fieldInputClass} pr-10`}
                  placeholder={t("profile.newPasswordPlaceholder")}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNewPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("profile.confirmNewPasswordLabel")}
              </label>
              <input
                type="password"
                value={pwdForm.confirmNewPassword}
                onChange={(e) =>
                  setPwdForm((f) => ({
                    ...f,
                    confirmNewPassword: e.target.value,
                  }))
                }
                className={fieldInputClass}
                placeholder={t("profile.confirmNewPasswordPlaceholder")}
              />
            </div>

            <div className="pf-pwd-checks" aria-live="polite">
              {[
                { ok: pwdForm.newPassword.length >= 6, label: t("profile.pwdRuleLength") },
                {
                  ok: Boolean(pwdForm.confirmNewPassword) && pwdForm.newPassword === pwdForm.confirmNewPassword,
                  label: t("profile.pwdRuleMatch"),
                },
              ].map((rule) => (
                <span key={rule.label} className={`pf-pwd-check${rule.ok ? " is-ok" : ""}`}>
                  {rule.ok ? <Check className="size-3.5" /> : <Circle className="size-3" />}
                  {rule.label}
                </span>
              ))}
            </div>
          </div>

          <DialogFooter className="pf-modal-foot items-center gap-2">
            <Link
              to="/auth/forgot-password"
              onClick={() => setPwdOpen(false)}
              className="text-xs text-primary hover:underline mr-auto"
            >
              {t("profile.forgotPassword")}
            </Link>
            <button
              type="button"
              onClick={() => {
                setPwdOpen(false);
                setPwdForm({
                  oldPassword: "",
                  newPassword: "",
                  confirmNewPassword: "",
                });
              }}
              className="craft-btn-ghost"
              disabled={changingPwd}
            >
              {t("profile.cancelButton")}
            </button>
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={changingPwd}
              className="craft-btn"
            >
              {changingPwd && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {changingPwd ? t("profile.changingButton") : t("profile.changePasswordButton")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Avatar Crop Modal ── */}
      <Dialog open={avatarModalOpen} onOpenChange={(open) => !open && handleAvatarCancel()}>
        <DialogContent className="sm:max-w-sm glass-panel-solid">
          <DialogHeader>
            <div className="pf-modal-head">
              <span className="pf-modal-icon">
                <Camera className="size-4" />
              </span>
              <div>
                <DialogTitle className="pf-modal-title">{t("profile.cropModalTitle")}</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  {t("profile.cropModalDesc")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col items-center gap-5 py-2">
            <div
              className="relative overflow-hidden rounded-full border-4 border-[var(--card)] shadow-[var(--shadow-card-elevated)] outline-2 outline-offset-4 outline-dashed outline-[color-mix(in_srgb,var(--primary)_40%,transparent)] cursor-grab active:cursor-grabbing touch-none select-none"
              style={{ width: CROP_SIZE, height: CROP_SIZE, background: "var(--muted)" }}
              onPointerDown={onAvatarPointerDown}
              onPointerMove={onAvatarPointerMove}
              onPointerUp={onAvatarPointerUp}
              onPointerLeave={onAvatarPointerUp}
            >
              {avatarSrc && (
                <img
                  ref={avatarImgRef}
                  src={avatarSrc}
                  alt="Avatar preview"
                  onLoad={handleAvatarImgLoad}
                  draggable={false}
                  className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
                  style={{
                    width: avatarNatural.w * avatarBaseScale || undefined,
                    height: avatarNatural.h * avatarBaseScale || undefined,
                    visibility: avatarNatural.w ? "visible" : "hidden",
                    transform: `translate(-50%, -50%) translate(${avatarOffset.x}px, ${avatarOffset.y}px) scale(${avatarZoom})`,
                  }}
                />
              )}
              <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/25" />
            </div>

            <div className="flex w-full items-center gap-3 px-1">
              <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={avatarZoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </div>

          <DialogFooter className="pf-modal-foot gap-2">
            <button
              type="button"
              onClick={handleAvatarCancel}
              disabled={uploadingAvatar}
              className="craft-btn-ghost"
            >
              <X className="w-3.5 h-3.5" />
              {t("profile.cancelButton")}
            </button>
            <button
              type="button"
              onClick={handleAvatarConfirm}
              disabled={uploadingAvatar}
              className="craft-btn sm:ml-auto"
            >
              {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {uploadingAvatar ? t("profile.savingButton") : t("profile.cropModalConfirm")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
