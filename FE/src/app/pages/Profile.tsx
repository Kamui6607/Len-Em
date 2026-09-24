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
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { authService } from "../../shared/api/authService";
import { userService } from "../../features/users/services/user.service";
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

/** Style input / select / date-trigger dùng chung cho các modal của Profile. */
const fieldInputClass =
  "w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm transition-all placeholder:text-muted-foreground/60 hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

/** Tiêu đề section đồng bộ cho mọi panel profile — chấm primary phát sáng + slot action bên phải. */
function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-5 pt-4 pb-1 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span
          className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--glow-primary)]"
          aria-hidden
        />
        {children}
      </h3>
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
  const rowBase =
    "group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:translate-x-0.5 active:scale-[0.98] cursor-pointer";
  return (
    <section className="glass-panel-solid rounded-2xl border border-[var(--border)]/60 overflow-hidden transition-all duration-300 hover:border-primary/25 hover:shadow-[var(--shadow-card-hover)]">
      <SectionTitle>{t("profile.accountActions")}</SectionTitle>
      <div className="px-3 pb-3 pt-1 space-y-0.5">
        <button
          type="button"
          onClick={onChangePassword}
          className={`${rowBase} hover:bg-[var(--surface-secondary)]`}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-primary bg-primary/10 transition-all duration-200 group-hover:scale-110 group-hover:-rotate-6">
            <KeyRound className="w-4 h-4" />
          </div>
          <span className="flex-1 text-sm font-medium">{t("profile.changePassword")}</span>
          <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </button>
        <button type="button" onClick={onSignOut} className={`${rowBase} hover:bg-rose-500/10`}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-rose-500 bg-rose-500/10 transition-all duration-200 group-hover:scale-110 group-hover:rotate-6">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="flex-1 text-sm font-medium text-rose-500">{t("profile.signOut")}</span>
          <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-rose-500" />
        </button>
      </div>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ProfileProps {
  embedded?: boolean;
}

export function Profile({ embedded = false }: ProfileProps) {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { data } = useMembershipStore();
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
  const avatarImgRef = useRef<HTMLImageElement | null>(null);
  const CROP_SIZE = 280;

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
    setEditOpen(true);
  }, [user]);

  // ── Submit edit profile (sends only changed fields) ──
  const handleEditSubmit = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (editForm.fullName !== user.fullName)
        payload.fullName = editForm.fullName;
      if (editForm.phone !== user.phone) payload.phone = editForm.phone;
      if (editForm.address !== user.address) payload.address = editForm.address;
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
  }, [user, editForm, setUser, t]);

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
    setAvatarZoom(1);
    setAvatarOffset({ x: 0, y: 0 });
  }, []);

  const handleAvatarConfirm = useCallback(async () => {
    if (!avatarSrc || !user || !avatarImgRef.current) return;

    setUploadingAvatar(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = avatarImgRef.current;
      const naturalSize = img.naturalWidth;
      const displayedSizeVal = img.width;
      const scale = naturalSize / displayedSizeVal;

      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;

      const sx = (CROP_SIZE / 2 - avatarOffset.x) * scale / avatarZoom;
      const sy = (CROP_SIZE / 2 - avatarOffset.y) * scale / avatarZoom;
      const sSize = CROP_SIZE * scale / avatarZoom;

      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, CROP_SIZE, CROP_SIZE);

      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          const cropFile = new File([blob], "avatar.png", { type: "image/png" });

          try {
            const { data: res } = await userService.uploadAvatar(
              user.userId,
              cropFile
            );
            const avatarUrl = res.data.updatedUser.avatar.url;
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
  }, [avatarSrc, avatarOffset, avatarZoom, user, setUser, t, handleAvatarCancel]);

  const displayedSize = useCallback(() => {
    if (!avatarImgRef.current) return { width: 0, height: 0 };
    const natural = avatarImgRef.current.naturalWidth;
    const zoomed = natural * avatarZoom;
    return { width: zoomed, height: zoomed };
  }, [avatarZoom]);

  const handleAvatarImgLoad = useCallback(() => {
    if (!avatarImgRef.current) return;
    const img = avatarImgRef.current;
    const containerSize = CROP_SIZE;
    const naturalSize = img.naturalWidth;
    const initialDisplaySize = naturalSize;
    const scale = containerSize / initialDisplaySize;
    const newZoom = scale;
    setAvatarZoom(newZoom);
  }, []);

  const handleZoomChange = useCallback((z: number) => {
    setAvatarZoom(z);
  }, []);

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
      setAvatarOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
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

  const infoRows = [
    {
      icon: <Mail className="w-4 h-4" />,
      label: t("profile.emailLabel"),
      value: user.email,
      color: "text-primary bg-primary/10",
    },
    {
      icon: <Phone className="w-4 h-4" />,
      label: t("profile.phoneLabel"),
      value: user.phone || t("profile.notSet"),
      color: "text-secondary-foreground bg-secondary",
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      label: t("profile.addressLabel"),
      value: user.address || t("profile.notSet"),
      color: "text-warm bg-warm/10",
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: t("profile.dobLabel"),
      value: formatDateForDisplay(user.dateOfBirth) || t("profile.notSet"),
      color: "text-info-foreground bg-info",
    },
  ];

  return (
    <div
      className={
        embedded
          ? "w-full"
          : "min-h-screen bg-background py-6 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:py-8 md:px-6 md:pb-8"
      }
    >
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="flex items-center gap-3 text-xl font-bold md:text-2xl">
            <span
              className="h-6 w-1 rounded-full bg-gradient-to-b from-primary to-primary/40"
              aria-hidden
            />
            {t("profile.title")}
          </h1>
          <p className="mt-1 pl-4 text-sm text-muted-foreground">
            {isDashboardUser ? t("profile.subtitleAdmin") : t("profile.subtitleUser")}
          </p>
        </div>

        {/* On mobile: stacked. On lg: side-by-side */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* ── Left column ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Identity card */}
            <section className="glass-panel-solid rounded-2xl border border-[var(--border)]/60 overflow-hidden transition-all duration-300 hover:border-primary/25 hover:shadow-[var(--shadow-card-hover)]">
              {/* Banner — gradient ấm + vệt chỉ chạy (brand seam) ở đáy */}
              <div className="h-28 bg-gradient-to-br from-primary/30 via-primary/12 to-transparent relative overflow-hidden">
                <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(400px 160px at 20% 0%, var(--glow-primary), transparent 70%)" }} />
                <div
                  className="absolute inset-x-6 bottom-0 h-px opacity-40"
                  aria-hidden
                  style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--primary) 0 6px, transparent 6px 12px)" }}
                />
              </div>

              {/* Avatar + name row */}
              <div className="px-5 pb-5">
                <div className="flex items-end justify-between -mt-10 mb-3">
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    className="group relative w-20 h-20 rounded-2xl bg-primary/15 border-4 border-card flex items-center justify-center text-xl font-bold text-primary shadow-[var(--shadow-card-elevated)] overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_10px_28px_rgba(107,63,160,0.35)] active:scale-95"
                    title={t("profile.changeAvatar")}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={openEditModal}
                    className="group/edit mb-0.5 flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:shadow-primary/25 active:scale-95"
                  >
                    <Pencil className="w-3 h-3 transition-transform duration-200 group-hover/edit:rotate-12" />
                    {t("profile.editButton")}
                  </button>
                </div>

                <h2 className="text-lg font-bold leading-tight">
                  {user.fullName}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`capitalize rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      isDashboardUser
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {user.roleId}
                  </span>
                  {!isDashboardUser && data && (
                    <RankBadge rank={data.rank} size="sm" showLabel />
                  )}
                </div>
              </div>
            </section>

            {/* Info card — click vào hàng để sao chép giá trị */}
            <section className="glass-panel-solid rounded-2xl border border-[var(--border)]/60 overflow-hidden transition-all duration-300 hover:border-primary/25 hover:shadow-[var(--shadow-card-hover)]">
              <SectionTitle>{t("profile.personalInfo")}</SectionTitle>
              <div className="space-y-0.5 px-3 pb-3 pt-1">
                {infoRows.map((row) => {
                  const empty = row.value === t("profile.notSet");
                  return (
                    <button
                      key={row.label}
                      type="button"
                      disabled={empty}
                      onClick={() => handleCopy(row.value)}
                      className={`group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:translate-x-0.5 active:scale-[0.99] ${
                        empty
                          ? "cursor-default"
                          : "cursor-pointer hover:bg-[var(--surface-secondary)]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:-rotate-6 ${row.color}`}
                      >
                        {row.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground leading-none mb-0.5">
                          {row.label}
                        </p>
                        <p className="text-sm font-medium truncate">{row.value}</p>
                      </div>
                      {!empty && (
                        <Copy className="w-3.5 h-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── Right column — /profile: Thành viên + Thao tác · admin/staff: Vai trò + Thao tác ── */}
          <div className="lg:col-span-2 space-y-4">
            {!isDashboardUser ? (
              <>
                {/* Membership — giữ cho /profile, đóng khung đồng bộ các panel */}
                <section className="glass-panel-solid rounded-2xl border border-[var(--border)]/60 overflow-hidden transition-all duration-300 hover:border-primary/25 hover:shadow-[var(--shadow-card-hover)]">
                  <SectionTitle
                    action={
                      <Link
                        to="/my-account/membership"
                        className="flex items-center gap-1 text-xs font-medium text-primary transition-all hover:underline"
                      >
                        {t("profile.viewDetails")} <ChevronRight className="w-3 h-3" />
                      </Link>
                    }
                  >
                    {t("profile.membership")}
                  </SectionTitle>
                  <div className="px-4 pb-4 pt-1">
                    <MembershipCard
                      onViewHistory={() => navigate("/my-account/membership?tab=history")}
                      onViewBenefits={() => navigate("/my-account/membership?tab=benefits")}
                      onViewTimeline={() => navigate("/my-account/membership?tab=timeline")}
                    />
                  </div>
                </section>

                <AccountActions
                  onChangePassword={() => setPwdOpen(true)}
                  onSignOut={handleLogout}
                />
              </>
            ) : (
              <>
                {/* Role card — CHỈ admin/staff (không đưa xuống /profile) */}
                <section className="glass-panel-solid rounded-2xl border border-[var(--border)]/60 overflow-hidden transition-all duration-300 hover:border-primary/25 hover:shadow-[var(--shadow-card-hover)]">
                  <SectionTitle>{t("profile.roleAccess")}</SectionTitle>
                  <div className="space-y-3 px-5 pb-5 pt-1">
                    <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/10 to-primary/5 p-3.5 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(107,63,160,0.12)]">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-110 hover:-rotate-6">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground leading-none mb-1">
                          {t("profile.currentRole")}
                        </p>
                        <p className="text-sm font-semibold capitalize">{user.roleId}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {user.roleId === "admin"
                        ? t("profile.adminDescription")
                        : t("profile.staffDescription")}
                    </p>
                  </div>
                </section>

                <AccountActions
                  onChangePassword={() => setPwdOpen(true)}
                  onSignOut={handleLogout}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="glass-panel-solid sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Pencil className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-lg font-semibold leading-tight">
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

            {/* Phone | Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("profile.addressLabel")}
              </label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, address: e.target.value }))
                }
                className={fieldInputClass}
                placeholder={t("profile.addressPlaceholder")}
              />
            </div>

            {/* Gender | Date of Birth */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-[var(--surface-secondary)] hover:text-foreground active:scale-95"
              disabled={saving}
            >
              {t("profile.cancelButton")}
            </button>
            <button
              type="button"
              onClick={handleEditSubmit}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/35 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
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
            <DialogTitle className="text-xl font-bold">{t("profile.changePasswordTitle")}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("profile.changePasswordDesc")}
            </DialogDescription>
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
          </div>

          <DialogFooter className="items-center gap-2">
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
              className="px-5 py-2.5 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--surface-secondary)] transition-all text-muted-foreground font-medium"
              disabled={changingPwd}
            >
              {t("profile.cancelButton")}
            </button>
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={changingPwd}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
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
            <DialogTitle className="text-lg font-bold">{t("profile.cropModalTitle")}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("profile.cropModalDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-5 py-2">
            <div
              className="relative overflow-hidden rounded-full border-4 border-[var(--card)] shadow-[var(--shadow-card-elevated)] cursor-grab active:cursor-grabbing touch-none select-none"
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
                    ...displayedSize(),
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

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={handleAvatarCancel}
              disabled={uploadingAvatar}
              className="px-5 py-2.5 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--surface-secondary)] transition-all text-muted-foreground font-medium flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              {t("profile.cancelButton")}
            </button>
            <button
              type="button"
              onClick={handleAvatarConfirm}
              disabled={uploadingAvatar}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20 ml-auto"
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
