import { useState, useCallback, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
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
  Bell,
  LogOut,
  Eye,
  EyeOff,
  Loader as Loader2,
  Camera,
  Check,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { authService } from "../../services/auth.service";
import { userService } from "../../features/users/services/user.service";
import { MembershipCard } from "../components/membership/MembershipCard";
import { RankBadge } from "../components/membership/RankBadge";
import { normalizeApiUserProfile } from "../../types/auth.types";
import { useAuthStore } from "../../store/auth.store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { useLanguage } from "../../context/LanguageContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateForInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function formatDateForDisplay(iso: string): string {
  if (!iso) return "Not set";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
        payload.dateOfBirth = editForm.dateOfBirth;
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
  }, [user, editForm, setUser]);

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
  }, [user, pwdForm]);

  // ── Logout ──
  const handleLogout = useCallback(() => {
    signOut();
    navigate("/auth/login", { replace: true });
  }, [signOut, navigate]);

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
      value: formatDateForDisplay(user.dateOfBirth),
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
          <h1 className="text-xl font-bold md:text-2xl">{t("profile.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isDashboardUser ? t("profile.subtitleAdmin") : t("profile.subtitleUser")}
          </p>
        </div>

        {/* On mobile: stacked. On lg: side-by-side */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* ── Left column ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Avatar card */}
            <div className="glass-panel-solid rounded-2xl overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-shadow">
              {/* Banner */}
              <div className="h-24 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent relative overflow-hidden">
                <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(400px 160px at 20% 0%, var(--glow-primary), transparent 70%)" }} />
              </div>

              {/* Avatar + name row */}
              <div className="px-5 pb-5">
                <div className="flex items-end justify-between -mt-10 mb-3">
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    className="relative w-20 h-20 rounded-2xl bg-primary/15 border-4 border-card flex items-center justify-center text-xl font-bold text-primary shadow-[var(--shadow-card-elevated)] overflow-hidden group cursor-pointer hover:scale-[1.03] transition-transform"
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
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-muted-foreground mb-0.5"
                  >
                    <Pencil className="w-3 h-3" />
                    {t("profile.editButton")}
                  </button>
                </div>

                <h2 className="text-base font-bold leading-tight">
                  {user.fullName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-muted rounded-full">
                    {user.roleId}
                  </span>
                  {!isDashboardUser && data && (
                    <RankBadge rank={data.rank} size="sm" showLabel />
                  )}
                </div>
              </div>
            </div>

            {/* Info card */}
            <div className="glass-panel-solid rounded-2xl overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("profile.personalInfo")}
                </h3>
              </div>
              <div className="px-3 pb-3 space-y-0.5">
                {infoRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${row.color}`}
                    >
                      {row.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground leading-none mb-0.5">
                        {row.label}
                      </p>
                      <p className="text-sm font-medium truncate">
                        {row.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-2">
            {!isDashboardUser ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("profile.membership")}
                  </h3>
                  <Link
                    to="/my-account/membership"
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    {t("profile.viewDetails")} <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <MembershipCard
                  onViewHistory={() =>
                    (window.location.href =
                      "/my-account/membership?tab=history")
                  }
                  onViewBenefits={() =>
                    (window.location.href =
                      "/my-account/membership?tab=benefits")
                  }
                  onViewTimeline={() =>
                    (window.location.href =
                      "/my-account/membership?tab=timeline")
                  }
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Role card */}
                <div className="glass-panel-solid rounded-2xl overflow-hidden">
                  <div className="px-5 pt-4 pb-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("profile.roleAccess")}
                    </h3>
                  </div>
                  <div className="px-5 pb-5 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground leading-none mb-0.5">
                          {t("profile.currentRole")}
                        </p>
                        <p className="text-sm font-semibold capitalize">
                          {user.roleId}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {user.roleId === "admin"
                        ? t("profile.adminDescription")
                        : t("profile.staffDescription")}
                    </p>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="glass-panel-solid rounded-2xl overflow-hidden">
                  <div className="px-5 pt-4 pb-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("profile.accountActions")}
                    </h3>
                  </div>
                  <div className="px-3 pb-3 space-y-0.5">
                    {/* Change password */}
                    <button
                      type="button"
                      onClick={() => setPwdOpen(true)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors group cursor-pointer text-left"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-primary bg-primary/10">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <span className="flex-1 text-sm font-medium">
                        {t("profile.changePassword")}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                    </button>

                    {/* Notification settings */}
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors group cursor-pointer text-left"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-secondary bg-secondary/10">
                        <Bell className="w-4 h-4" />
                      </div>
                      <span className="flex-1 text-sm font-medium">
                        {t("profile.notificationSettings")}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                    </button>

                    {/* Sign out */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors group cursor-pointer text-left"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-rose-500 bg-rose-500/10">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-rose-500">
                        {t("profile.signOut")}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md glass-panel-solid">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t("profile.editProfileTitle")}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("profile.editProfileDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("profile.fullNameLabel")}
              </label>
              <input
                type="text"
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, fullName: e.target.value }))
                }
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder={t("profile.fullNamePlaceholder")}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("profile.phoneLabel")}
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder={t("profile.phonePlaceholder")}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("profile.addressLabel")}
              </label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, address: e.target.value }))
                }
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder={t("profile.addressPlaceholder")}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("profile.genderLabel")}
              </label>
              <select
                value={editForm.gender}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    gender: e.target.value as "MALE" | "FEMALE" | "OTHER",
                  }))
                }
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="MALE">{t("profile.maleOption")}</option>
                <option value="FEMALE">{t("profile.femaleOption")}</option>
                <option value="OTHER">{t("profile.otherOption")}</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("profile.dobLabelLong")}
              </label>
              <input
                type="text"
                value={editForm.dateOfBirth}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, dateOfBirth: e.target.value }))
                }
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder={t("profile.dobPlaceholder")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--surface-secondary)] transition-all text-muted-foreground font-medium"
              disabled={saving}
            >
              {t("profile.cancelButton")}
            </button>
            <button
              type="button"
              onClick={handleEditSubmit}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
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
                  className="w-full px-4 py-3 pr-10 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                  className="w-full px-4 py-3 pr-10 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
