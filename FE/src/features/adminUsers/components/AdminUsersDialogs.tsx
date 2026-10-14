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
  UserPlus,
  VenusAndMars,
} from "lucide-react";
import type { ApiUser } from "../../users/services/user.service";
import type { AdminUsersController } from "../hooks/useAdminUsers";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { DatePicker } from "../../../shared/components/ui/DatePicker";
import {
  AdminDetailGrid,
  AdminDetailItem,
  AdminDialogSection,
  AdminField,
  AdminModal,
} from "../../../shared/components/admin/AdminModal";
import { isFutureDate, isoToUsDisplayDate, usDisplayToIso } from "../../../lib/dateInput";
import {
  formatDateOfBirth,
  getRoleBadgeClass,
  getStatusBadgeClass,
  initialsOf,
  statusLabel,
} from "../utils/adminUsersFormat";

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
    <AdminField icon={icon} label={label} required={required} error={error}>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input w-full"
      />
    </AdminField>
  );
}
/**
 * Date of birth field — calendar picker shown in MM/DD/YYYY, i.e. exactly the
 * order the signup form sends `dateOfBirth` in (see src/lib/dateInput.ts), so a
 * user created by an admin and one created by the signup form store the same
 * format and an existing date can be corrected without guessing its order.
 * Nothing has to be typed and the format never follows the browser locale.
 */
function DateField({
  icon,
  label,
  value,
  onChange,
  error,
  placeholder = "mm/dd/yyyy",
}: {
  icon?: React.ElementType;
  label: string;
  /** Display text (mm/dd/yyyy). */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <AdminField icon={icon} label={label} error={error}>
      <DatePicker
        value={value}
        onChange={onChange}
        error={error}
        placeholder={placeholder}
        format="mm/dd/yyyy"
      />
    </AdminField>
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
    <AdminField icon={icon} label={label} required={required} error={error}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input w-full"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </AdminField>
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
    <AdminModal
      variant="view"
      onClose={onClose}
      title={user.fullName || user.username || "—"}
      subtitle={user.username ? `@${user.username}` : undefined}
      // Identity first: avatar, name and the two badges an admin looks for,
      // so the tiles below only carry the details.
      media={<span className="adm-dlg-avatar">{initials}</span>}
      badges={
        <>
          <span className={`badge ${getRoleBadgeClass(roleName)}`}>{roleName}</span>
          <span className={`badge ${getStatusBadgeClass(status)}`}>{statusLabel(status, t)}</span>
        </>
      }
      footer={
        <button type="button" onClick={onClose} className="btn-modal-primary">
          {t("admin.users.closeButton")}
        </button>
      }
    >
      <div className="admin-dialog-body">
        <AdminDialogSection icon={ShieldCheck}>{t("admin.users.accountInfo")}</AdminDialogSection>
        <AdminDetailGrid>
          <AdminDetailItem icon={Mail} label={t("admin.users.emailLabel")}>
            {user.email}
          </AdminDetailItem>
          <AdminDetailItem icon={Phone} label={t("admin.users.phoneLabel")}>
            {user.phone}
          </AdminDetailItem>
          <AdminDetailItem icon={VenusAndMars} label={t("admin.users.genderLabel")}>
            {genderLabel}
          </AdminDetailItem>
          <AdminDetailItem icon={CalendarDays} label={t("admin.users.dateOfBirth")}>
            {dateOfBirth}
          </AdminDetailItem>
          <AdminDetailItem icon={MapPin} label={t("admin.users.addressLabel")} span>
            {user.address}
          </AdminDetailItem>
          <AdminDetailItem icon={IdCard} label={t("admin.users.userId")} span mono>
            {user.userId}
          </AdminDetailItem>
        </AdminDetailGrid>
      </div>
    </AdminModal>
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
    // mm/dd/yyyy display text — sent to the API in that same order.
    dateOfBirth: isoToUsDisplayDate(user.dateOfBirth),
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
    // DOB is optional, but when filled in it must be a real mm/dd/yyyy date.
    if (form.dateOfBirth.trim()) {
      const iso = usDisplayToIso(form.dateOfBirth);
      if (!iso || isFutureDate(iso)) errors.dateOfBirth = t("admin.users.dateOfBirthInvalid");
    }
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
      // The API receives mm/dd/yyyy — the same order the signup form sends.
      dateOfBirth: form.dateOfBirth.trim(),
    });
  };

  const fields = Object.keys(form) as Array<keyof typeof form>;
  const hasErrors = fields.some((field) => Boolean(errorOf(field)));
  const genderOptions = GENDER_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.key),
  }));

  return (
    <AdminModal
      variant="edit"
      onClose={onCancel}
      title={user.fullName || user.username || t("admin.users.updateUser")}
      eyebrow={t("admin.users.updateUser")}
      subtitle={user.username ? `@${user.username}` : undefined}
      media={<span className="adm-dlg-avatar">{initialsOf(user.fullName || user.username || "?")}</span>}
      footer={
        <>
          <button type="button" onClick={onCancel} className="btn-modal-cancel">
            {t("admin.users.cancelButton")}
          </button>
          <button type="submit" form="admin-user-update-form" disabled={loading} className="btn-modal-primary">
            {loading ? t("admin.users.updatingButton") : t("admin.users.updateUserButton")}
          </button>
        </>
      }
    >
      <form id="admin-user-update-form" className="admin-dialog-body admin-dialog-grid" onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p className="adm-dlg-alert" role="alert">
            {t("admin.users.fixErrorsBelow")}
          </p>
        )}

        <AdminDialogSection icon={ShieldCheck}>{t("admin.users.accountInfo")}</AdminDialogSection>
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
        <AdminDialogSection icon={ContactRound}>{t("admin.users.contactInfo")}</AdminDialogSection>
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
        <DateField
          icon={CalendarDays}
          label={t("admin.users.dateOfBirth")}
          value={form.dateOfBirth}
          onChange={set("dateOfBirth")}
          error={errorOf("dateOfBirth")}
          placeholder={t("admin.users.dateOfBirthPlaceholder")}
        />
        <Field
          icon={MapPin}
          label={t("admin.users.addressLabel")}
          value={form.address}
          onChange={set("address")}
          error={errorOf("address")}
        />

      </form>
    </AdminModal>
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
    // DOB is optional, but when filled in it must be a real mm/dd/yyyy date.
    if (form.dateOfBirth.trim()) {
      const iso = usDisplayToIso(form.dateOfBirth);
      if (!iso || isFutureDate(iso)) errors.dateOfBirth = t("admin.users.dateOfBirthInvalid");
    }
    return errors;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validate();
    setLocalErrors(errors);
    if (Object.keys(errors).length > 0) return;
    void controller.handleCreateUser({
      ...form,
      phone: normalizePhone(form.phone),
      // The API receives mm/dd/yyyy — the same order the signup form sends.
      dateOfBirth: form.dateOfBirth.trim(),
    });
  };

  const fields = Object.keys(form) as Array<keyof typeof form>;
  const hasErrors = fields.some((field) => Boolean(errorOf(field)));
  const close = () => controller.setShowCreateModal(false);

  return (
    <AdminModal
      variant="create"
      icon={UserPlus}
      onClose={close}
      title={t("admin.users.createUser")}
      footer={
        <>
          <button type="button" onClick={close} className="btn-modal-cancel">
            {t("admin.users.cancelButton")}
          </button>
          <button type="submit" form="admin-user-create-form" disabled={controller.creating} className="btn-modal-primary">
            {controller.creating ? t("admin.users.creatingButton") : t("admin.users.createUser")}
          </button>
        </>
      }
    >
      <form id="admin-user-create-form" className="admin-dialog-body admin-dialog-grid" onSubmit={handleSubmit} noValidate>
        {hasErrors && (
          <p className="adm-dlg-alert" role="alert">
            {t("admin.users.fixErrorsBelow")}
          </p>
        )}

        <AdminDialogSection icon={ShieldCheck}>{t("admin.users.accountInfo")}</AdminDialogSection>
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

        <AdminDialogSection icon={ContactRound}>{t("admin.users.contactInfo")}</AdminDialogSection>
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
        <DateField
          icon={CalendarDays}
          label={t("admin.users.dateOfBirth")}
          value={form.dateOfBirth}
          onChange={set("dateOfBirth")}
          error={errorOf("dateOfBirth")}
          placeholder={t("admin.users.dateOfBirthPlaceholder")}
        />
      </form>
    </AdminModal>
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
