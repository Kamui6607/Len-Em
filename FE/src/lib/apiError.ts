// ============================================================
// API Error helpers — turn backend error payloads into readable,
// field-scoped messages.
// ============================================================
// The backend (Node/Express + Joi) answers validation problems with one of:
//   { status: "error", message: '"email" must be a valid email' }
//   { status: "error", message: "...", errors: { email: ["..."] } }
//   { status: "error", errors: [{ field: "email", message: "..." }] }
// Raw Joi text ("\"phone\" with value \"abc\" fails to match the required
// pattern: /^0[0-9]{9}$/") is unreadable, so this module detects which form
// field failed and rewrites the rule into a short sentence.
// ============================================================

export type FieldErrorMap = Record<string, string>;

export interface ParsedApiError {
  /** HTTP status of the failed request, when available. */
  status?: number;
  /**
   * Backend message that is NOT tied to a single field
   * (e.g. "Quá nhiều lần thử đăng nhập/đăng ký"). May be "".
   */
  message: string;
  /** Readable messages keyed by form field name (e.g. `phone`). */
  fieldErrors: FieldErrorMap;
  /** True when at least one field-scoped error was found. */
  hasFieldErrors: boolean;
}

/** Normalized field key → the name used by the frontend forms. */
const CANONICAL_FIELDS: Record<string, string> = {
  fullname: "fullName",
  username: "username",
  email: "email",
  password: "password",
  confirmpassword: "confirmPassword",
  phone: "phone",
  address: "address",
  gender: "gender",
  dateofbirth: "dateOfBirth",
  roleid: "roleId",
  status: "status",
  subscription: "subscription",
  description: "description",
};

/** Human labels used when rewriting a validation rule into a sentence. */
const FIELD_LABELS: Record<string, string> = {
  fullname: "Full name",
  username: "Username",
  email: "Email",
  password: "Password",
  confirmpassword: "Confirm password",
  phone: "Phone",
  address: "Address",
  gender: "Gender",
  dateofbirth: "Date of birth",
  roleid: "Role",
  status: "Status",
  subscription: "Subscription",
  description: "Description",
};

/** "Full_Name" | "FullName" | "fullname" → "fullName" (null when unknown). */
function canonicalField(rawField: string): string | null {
  if (!rawField) return null;
  const normalized = rawField.toLowerCase().replace(/[\s_-]+/g, "");
  return CANONICAL_FIELDS[normalized] ?? null;
}

function labelFor(field: string): string {
  return (
    FIELD_LABELS[field.toLowerCase().replace(/[\s_-]+/g, "")] ??
    field.charAt(0).toUpperCase() + field.slice(1)
  );
}

/**
 * Joi/validator messages start with the field name — either quoted
 * (`"email" must be a valid email`) or as a bare word
 * (`username must be at least 3 characters long`). Returns the canonical
 * field name only when that first token really is a known field, so
 * unrelated messages ("Something went wrong") stay field-agnostic.
 */
export function fieldFromMessage(message: string): string | null {
  const firstToken = message.trim().split(/[\s:]+/)[0]?.replace(/"/g, "") ?? "";
  return canonicalField(firstToken);
}


/**
 * Turn a raw validator message into something a user can act on.
 * Unknown rules fall back to the original wording, prefixed with the label.
 */
export function humanizeFieldError(field: string, raw: string): string {
  const message = (raw ?? "").trim();
  const label = labelFor(field);
  const key = field.toLowerCase().replace(/[\s_-]+/g, "");
  if (!message) return `${label} is invalid.`;

  if (/is required|is not allowed to be empty|is not allowed to be null/i.test(message)) {
    return `${label} is required.`;
  }
  if (/valid email/i.test(message)) return "Enter a valid email address.";

  const minChars = /(?:at least|minimum(?: of)?)\s+(\d+)\s+characters?/i.exec(message);
  if (minChars) return `${label} must be at least ${minChars[1]} characters.`;
  const maxChars = /(?:at most|maximum(?: of)?)\s+(\d+)\s+characters?/i.exec(message);
  if (maxChars) return `${label} must be at most ${maxChars[1]} characters.`;

  if (/fails? to match the required pattern/i.test(message)) {
    if (key === "phone") return "Phone must be 10 digits and start with 0 (e.g. 0912345678).";
    if (key === "username") return "Username may only contain letters, numbers and underscores.";
    if (key === "password") {
      return "Password must include an uppercase letter, a lowercase letter, a number and a special character.";
    }
    return `${label} format is invalid.`;
  }

  if (/must be a valid date|must be in timestamp|must be a valid iso date/i.test(message)) {
    return "Enter a valid date.";
  }

  const oneOf = /must be one of\s*\[?([^\]]+)\]?/i.exec(message);
  if (oneOf) return `${label} must be one of: ${oneOf[1].replace(/"/g, "").trim()}.`;

  if (/must be a valid/i.test(message)) return `${label} is invalid.`;
  if (/is not allowed/i.test(message)) return `${label} is not allowed.`;

  // Unknown rule → keep the backend wording, minus the redundant field prefix.
  // Custom messages often already name the field ("Email already exists") —
  // then keep the sentence instead of prefixing the label a second time.
  if (message.toLowerCase().startsWith(label.toLowerCase())) {
    return `${message.charAt(0).toUpperCase()}${message.slice(1).replace(/\.$/, "")}.`;
  }
  const stripped = message.replace(new RegExp(`^"?${field}"?\\s*`, "i"), "").trim() || message;
  return `${label}: ${stripped.replace(/\.$/, "")}.`;
}


function readStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | undefined)?.response?.status;
}

function readPayload(error: unknown): Record<string, unknown> | undefined {
  const data = (error as { response?: { data?: unknown } } | undefined)?.response?.data;
  return data && typeof data === "object" ? (data as Record<string, unknown>) : undefined;
}

function firstText(value: unknown): string {
  if (Array.isArray(value)) return String(value.find((item) => String(item ?? "").trim()) ?? "");
  return value === undefined || value === null ? "" : String(value);
}

/**
 * Parse any backend error payload into readable, field-scoped messages.
 * Never throws and never falls back to Axios' technical message
 * ("Request failed with status code 400").
 */
export function parseApiError(error: unknown): ParsedApiError {
  const status = readStatus(error);
  const payload = readPayload(error);
  const nested =
    payload?.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : undefined;
  const fieldErrors: FieldErrorMap = {};

  const addFieldError = (rawField: unknown, rawMessage: unknown): void => {
    const field = canonicalField(String(rawField ?? ""));
    if (!field) return;
    const text = firstText(rawMessage);
    if (!text.trim() || fieldErrors[field]) return;
    fieldErrors[field] = humanizeFieldError(field, text);
  };

  const rawErrors = payload?.errors ?? nested?.errors;

  if (Array.isArray(rawErrors)) {
    rawErrors.forEach((item) => {
      if (typeof item === "string") {
        const field = fieldFromMessage(item);
        if (field) addFieldError(field, item);
        return;
      }
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const field = record.field ?? record.path ?? record.param ?? record.property;
        const text = record.message ?? record.msg ?? record.error;
        if (field) addFieldError(field, text);
        else {
          const guessed = fieldFromMessage(String(text ?? ""));
          if (guessed) addFieldError(guessed, text);
        }
      }
    });
  } else if (rawErrors && typeof rawErrors === "object") {
    Object.entries(rawErrors as Record<string, unknown>).forEach(([key, value]) =>
      addFieldError(key, value),
    );
  }

  // Flat Joi message: { message: '"phone" is required' }
  const backendMessage = firstText(payload?.message) || firstText(payload?.error);
  if (backendMessage) {
    const field = fieldFromMessage(backendMessage);
    if (field) addFieldError(field, backendMessage);
  }

  const fields = Object.keys(fieldErrors);
  const genericMessage =
    backendMessage && !fieldFromMessage(backendMessage) ? backendMessage.trim() : "";

  return {
    status,
    message: genericMessage || (fields.length > 0 ? fieldErrors[fields[0]] : ""),
    fieldErrors,
    hasFieldErrors: fields.length > 0,
  };
}

/**
 * Readable message for error toasts. Returns the backend wording when it is
 * meaningful ("Too many requests…", "Email already exists") or the humanized
 * field error, and "" when the payload has nothing useful.
 */
export function extractApiErrorMessage(error: unknown): string {
  return parseApiError(error).message;
}

/** Per-field readable messages (empty object when the error is not field-scoped). */
export function extractFieldErrors(error: unknown): FieldErrorMap {
  return parseApiError(error).fieldErrors;
}
