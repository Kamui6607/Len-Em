import { useState } from "react";
import {
  AtSign,
  BadgeCheck,
  CalendarDays,
  ContactRound,
  IdCard,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User as UserIcon,
  UserPen,
  UserPlus,
  VenusAndMars,
  X,
} from "lucide-react";
import type { ApiUser } from "../../users/services/user.service";
import type { AdminUsersController } from "../hooks/useAdminUsers";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import {
  formatDateOfBirth,
  getRoleBadgeClass,
  getStatusBadgeClass,
  initialsOf,
  statusLabel,
} from "../utils/adminUsersFormat";

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="admin-dialog-overlay" onClick={onClose}>
      <div
        className="admin-dialog-content max-h-[90vh] w-full max-w-2xl overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function FieldShell({
  icon: Icon,
  label,
  required,
  error,
  children,
}: {
  /** Small icon shown before the label (matches the detail tiles). */
  icon?: React.ElementType;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      <span className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

/** Modal header: leading slot (icon chip / avatar) + close button. */
function DialogHeader({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="admin-dialog-header flex items-start justify-between gap-4">
      {children}
      <button
        type="button"
        onClick={onClose}
        className="admin-action-btn shrink-0"
        style={{ color: "var(--foreground-muted)" }}
        aria-label={t("admin.users.closeButton")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Full-width section heading inside the two-column form grid. */
function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <h3 className="col-span-full flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-4 w-4" />
      {children}
    </h3>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  type = "text",
  required,
  error,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <FieldShell icon={icon} label={label} required={required} error={error}>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`input w-full ${error ? "border-destructive" : ""}`}
      />
    </FieldShell>
  );
}

function SelectField({
  icon,
  label,
  value,
  onChange,
  options,
  required,
  error,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  error?: string;
}) {
  return (
    <FieldShell icon={icon} label={label} required={required} error={error}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`input w-full ${error ? "border-destructive" : ""}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Read-only label + value tile used by the user detail dialog. */
function DetailItem({
  icon: Icon,
  label,
  value,
  span,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  /** Let the tile take the full width of the two-column grid. */
  span?: boolean;
  /** Monospace value (ids). */
  mono?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${span ? "sm:col-span-2" : ""}`}
      style={{ background: "var(--surface)", borderColor: "var(--border-light)" }}
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </p>
      <p className={`mt-1 break-words text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function ViewUserDialog({
  user,
  roleName,
  onClose,
}: {
  user: ApiUser;
  roleName: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const status = user.status ?? "ACTIVE";
  const initials = initialsOf(user.fullName || user.username || "?");
  const genderLabel =
    user.gender === "MALE"
      ? t("admin.users.genderMale")
      : user.gender === "FEMALE"
        ? t("admin.users.genderFemale")
        : t("admin.users.genderOther");
  const dateOfBirth = formatDateOfBirth(user.dateOfBirth);

  return (
    <Overlay onClose={onClose}>
      {/* Identity block first: avatar, name and the two badges an admin looks
          for, so the fields below only carry the details. */}
      <div className="admin-dialog-header flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">
              {user.fullName || user.username || "—"}
            </h2>
            {user.username && (
              <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`badge ${getRoleBadgeClass(roleName)}`}>{roleName}</span>
              <span className={`badge ${getStatusBadgeClass(status)}`}>
                {statusLabel(status, t)}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="admin-action-btn shrink-0"
          style={{ color: "var(--foreground-muted)" }}
          aria-label={t("admin.users.closeButton")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="admin-dialog-body">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.users.accountInfo")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem icon={Mail} label={t("admin.users.emailLabel")} value={user.email ?? ""} />
          <DetailItem icon={Phone} label={t("admin.users.phoneLabel")} value={user.phone ?? ""} />
          <DetailItem
            icon={VenusAndMars}
            label={t("admin.users.genderLabel")}
            value={genderLabel}
          />
          <DetailItem
            icon={CalendarDays}
            label={t("admin.users.dateOfBirth")}
            value={dateOfBirth}
          />
          <DetailItem
            icon={MapPin}
            label={t("admin.users.addressLabel")}
            value={user.address ?? ""}
            span
          />
          <DetailItem icon={IdCard} label={t("admin.users.userId")} value={user.userId} span mono />
        </div>
      </div>

      <div className="admin-dialog-footer">
        <button type="button" onClick={onClose} className="btn-modal-primary">
          {t("admin.users.closeButton")}
        </button>
      </div>
    </Overlay>
  );
}

/** Phone format the backend enforces: /^0[0-9]{9}$/ */
const normalizePhone = (value: string) => value.replace(/[\s.\-()]/g, "");

const GENDER_OPTIONS: Array<{ value: "MALE" | "FEMALE" | "OTHER"; key: string }> = [
  { value: "MALE", key: "admin.users.genderMale" },
  { value: "FEMALE", key: "admin.users.genderFemale" },
  { value: "OTHER", key: "admin.users.genderOther" },
];

function UpdateUserDialog({
  user,
  loading,
  fieldErrors,
  onClearFieldError,
  onCancel,
  onConfirm,
}: {
  user: ApiUser;
  loading: boolean;
  /** Server-side validation errors of the last attempt, keyed by field. */
  fieldErrors: Record<string, string>;
  onClearFieldError: (field: string) => void;
  onCancel: () => void;
  onConfirm: (data: Record<string, unknown>) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    username: user.username ?? "",
    email: user.email ?? "",
    fullName: user.fullName ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    gender: user.gender ?? "OTHER",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const errorOf = (field: keyof typeof form): string =>
    localErrors[field] || fieldErrors[field] || "";

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalErrors((current) => (current[key] ? { ...current, [key]: "" } : current));
    onClearFieldError(key);
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) errors.fullName = t("admin.users.fullNameRequired");
    if (!form.username.trim()) errors.username = t("admin.users.usernameRequired");
    else if (!/^[a-zA-Z0-9_]{3,}$/.test(form.username.trim()))
      errors.username = t("admin.users.usernameInvalid");
    if (!form.email.trim()) errors.email = t("admin.users.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errors.email = t("admin.users.emailInvalid");
    // Phone/address stay optional here (an admin often only renames an account),
    // but a phone that is filled in must match what the backend accepts.
    if (form.phone.trim() && !/^0[0-9]{9}$/.test(normalizePhone(form.phone)))
      errors.phone = t("admin.users.phoneInvalid");
    return errors;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validate();
    setLocalErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onConfirm({
      ...form,
      phone: form.phone.trim() ? normalizePhone(form.phone) : "",
    });
  };

  const fields = Object.keys(form) as Array<keyof typeof form>;
  const hasErrors = fields.some((field) => Boolean(errorOf(field)));
  const genderOptions = GENDER_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.key),
  }));

  return (
    <Overlay onClose={onCancel}>
      <DialogHeader onClose={onCancel}>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {initialsOf(user.fullName || user.username || "?")}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">
              {user.fullName || user.username || t("admin.users.updateUser")}
            </h2>
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <UserPen className="h-3.5 w-3.5 shrink-0" />
              {t("admin.users.updateUser")} · @{user.username}
            </p>
          </div>
        </div>
      </DialogHeader>
      <form className="admin-dialog-body admin-dialog-grid" onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p
            className="col-span-full rounded-md border px-3 py-2 text-xs font-medium"
            style={{ borderColor: "var(--destructive)", color: "var(--destructive)" }}
            role="alert"
          >
            {t("admin.users.fixErrorsBelow")}
          </p>
        )}

        <SectionTitle icon={ShieldCheck}>{t("admin.users.accountInfo")}</SectionTitle>
        <Field
          icon={UserIcon}
          label={t("admin.users.fullName")}
          value={form.fullName}
          onChange={set("fullName")}
          required
          error={errorOf("fullName")}
        />
        <Field
          icon={AtSign}
          label={t("admin.users.userName")}
          value={form.username}
          onChange={set("username")}
          required
          error={errorOf("username")}
        />
        <Field
          icon={Mail}
          label={t("admin.users.email")}
          value={form.email}
          onChange={set("email")}
          type="email"
          required
          error={errorOf("email")}
        />
        <SectionTitle icon={ContactRound}>{t("admin.users.contactInfo")}</SectionTitle>
        <Field
          icon={Phone}
          label={t("admin.users.phoneLabel")}
          value={form.phone}
          onChange={set("phone")}
          type="tel"
          error={errorOf("phone")}
        />
        <SelectField
          icon={VenusAndMars}
          label={t("admin.users.gender")}
          value={form.gender}
          onChange={set("gender")}
          options={genderOptions}
          error={errorOf("gender")}
        />
        <Field
          icon={CalendarDays}
          label={t("admin.users.dateOfBirth")}
          value={form.dateOfBirth}
          onChange={set("dateOfBirth")}
          type="date"
          error={errorOf("dateOfBirth")}
        />
        <Field
          icon={MapPin}
          label={t("admin.users.addressLabel")}
          value={form.address}
          onChange={set("address")}
          error={errorOf("address")}
        />

        <div className="admin-dialog-footer col-span-full">
          <button type="button" onClick={onCancel} className="btn-modal-cancel">
            {t("admin.users.cancelButton")}
          </button>
          <button type="submit" disabled={loading} className="btn-modal-primary">
            {loading ? t("admin.users.updatingButton") : t("admin.users.updateUserButton")}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function CreateUserDialog({
  controller,
}: {
  controller: AdminUsersController;
}) {
  const { t } = controller;
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phone: "",
    address: "",
    gender: "OTHER",
    dateOfBirth: "",
    roleId: controller.roleDropdownOptions[0]?.value ?? "",
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  // Errors returned by the backend (duplicated email, invalid phone…) for the
  // last submit attempt — cleared per field as soon as the admin edits it.
  const serverErrors = controller.createFieldErrors;

  const errorOf = (field: keyof typeof form): string =>
    localErrors[field] || serverErrors[field] || "";

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalErrors((current) => (current[key] ? { ...current, [key]: "" } : current));
    controller.clearCreateFieldError(key);
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) errors.fullName = t("admin.users.fullNameRequired");
    if (!form.username.trim()) errors.username = t("admin.users.usernameRequired");
    else if (!/^[a-zA-Z0-9_]{3,}$/.test(form.username.trim()))
      errors.username = t("admin.users.usernameInvalid");
    if (!form.email.trim()) errors.email = t("admin.users.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errors.email = t("admin.users.emailInvalid");
    if (!form.password) errors.password = t("admin.users.passwordRequired");
    else if (form.password.length < 8) errors.password = t("admin.users.passwordMinLength");
    if (!form.phone.trim()) errors.phone = t("admin.users.phoneRequired");
    else if (!/^0[0-9]{9}$/.test(normalizePhone(form.phone)))
      errors.phone = t("admin.users.phoneInvalid");
    if (!form.address.trim()) errors.address = t("admin.users.addressRequired");
    if (!form.gender) errors.gender = t("admin.users.genderRequired");
    if (!form.roleId) errors.roleId = t("admin.users.roleRequired");
    return errors;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validate();
    setLocalErrors(errors);
    if (Object.keys(errors).length > 0) return;
    void controller.handleCreateUser({ ...form, phone: normalizePhone(form.phone) });
  };

  const fields = Object.keys(form) as Array<keyof typeof form>;
  const hasErrors = fields.some((field) => Boolean(errorOf(field)));
  const close = () => controller.setShowCreateModal(false);

  return (
    <Overlay onClose={close}>
      <DialogHeader onClose={close}>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            <UserPlus className="h-5 w-5" />
          </span>
          <h2 className="truncate text-lg font-semibold">{t("admin.users.createUser")}</h2>
        </div>
      </DialogHeader>
      <form className="admin-dialog-body admin-dialog-grid" onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p
            className="col-span-full rounded-md border px-3 py-2 text-xs font-medium"
            style={{ borderColor: "var(--destructive)", color: "var(--destructive)" }}
            role="alert"
          >
            {t("admin.users.fixErrorsBelow")}
          </p>
        )}

        <SectionTitle icon={ShieldCheck}>{t("admin.users.accountInfo")}</SectionTitle>
        <Field
          icon={UserIcon}
          label={t("admin.users.fullName")}
          value={form.fullName}
          onChange={set("fullName")}
          required
          error={errorOf("fullName")}
        />
        <Field
          icon={AtSign}
          label={t("admin.users.userName")}
          value={form.username}
          onChange={set("username")}
          required
          error={errorOf("username")}
        />
        <Field
          icon={Mail}
          label={t("admin.users.email")}
          value={form.email}
          onChange={set("email")}
          type="email"
          required
          error={errorOf("email")}
        />
        <Field
          icon={KeyRound}
          label={t("admin.users.password")}
          value={form.password}
          onChange={set("password")}
          type="password"
          required
          error={errorOf("password")}
        />
        <SelectField
          icon={BadgeCheck}
          label={t("admin.users.role")}
          value={form.roleId}
          onChange={set("roleId")}
          options={controller.roleDropdownOptions}
          required
          error={errorOf("roleId")}
        />

        <SectionTitle icon={ContactRound}>{t("admin.users.contactInfo")}</SectionTitle>
        <Field
          icon={Phone}
          label={t("admin.users.phoneLabel")}
          value={form.phone}
          onChange={set("phone")}
          type="tel"
          required
          error={errorOf("phone")}
        />
        <Field
          icon={MapPin}
          label={t("admin.users.addressLabel")}
          value={form.address}
          onChange={set("address")}
          required
          error={errorOf("address")}
        />
        <SelectField
          icon={VenusAndMars}
          label={t("admin.users.gender")}
          value={form.gender}
          onChange={set("gender")}
          required
          error={errorOf("gender")}
          options={GENDER_OPTIONS.map((option) => ({ value: option.value, label: t(option.key) }))}
        />
        <Field
          icon={CalendarDays}
          label={t("admin.users.dateOfBirth")}
          value={form.dateOfBirth}
          onChange={set("dateOfBirth")}
          type="date"
          error={errorOf("dateOfBirth")}
        />
        <div className="admin-dialog-footer col-span-full">
          <button type="button" onClick={close} className="btn-modal-cancel">
            {t("admin.users.cancelButton")}
          </button>
          <button type="submit" disabled={controller.creating} className="btn-modal-primary">
            {controller.creating ? t("admin.users.creatingButton") : t("admin.users.createUser")}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

export function AdminUsersDialogs({
  controller,
}: {
  controller: AdminUsersController;
}) {
  return (
    <>
      {controller.selectedUser && (
        <ViewUserDialog
          user={controller.selectedUser}
          roleName={
            typeof controller.selectedUser.roleId === "string"
              ? (controller.roleNameMap[controller.selectedUser.roleId] ??
                "User")
              : (controller.selectedUser.roleId?.roleName ?? "User")
          }
          onClose={() => controller.setSelectedUser(null)}
        />
      )}
      {controller.userToUpdate && (
        <UpdateUserDialog
          user={controller.userToUpdate}
          loading={controller.updating}
          fieldErrors={controller.updateFieldErrors}
          onClearFieldError={controller.clearUpdateFieldError}
          onCancel={() => controller.setUserToUpdate(null)}
          onConfirm={(data) =>
            void controller.handleUpdateUser(
              controller.userToUpdate!.userId,
              data,
            )
          }
        />
      )}
      {controller.showCreateModal && (
        <CreateUserDialog controller={controller} />
      )}
    </>
  );
}
