// ============================================================
// Date input helpers — the UI shows dd/mm/yyyy while the API
// stores/receives ISO (yyyy-mm-dd).
//
// Why: a native <input type="date"> renders in the BROWSER locale,
// so on an en-US browser a Vietnamese UI showed MM/DD/YYYY.
//
// ONE EXCEPTION — `dateOfBirth` is stored in MONTH-first order (MM/DD/YYYY)
// because that is the order the signup form sends, so the admin user forms
// show/collect MM/DD/YYYY too (see the *Us* helpers at the bottom).
// ============================================================

const DMY_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const MDY_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** Real calendar date check (rejects 31/02, month 13, year 1899…). */
export function isValidYmd(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Tolerant parse of a date coming from the API → ISO "yyyy-mm-dd".
 * Accepts ISO (with or without a time part) and dd/mm/yyyy (also d/m/yyyy).
 * Returns "" when the value is missing or not a valid date.
 */
export function toIsoDate(value?: string | null): string {
  if (!value) return "";
  const raw = String(value).trim();

  // 2000-05-20 | 2000-05-20T00:00:00.000Z
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return isValidYmd(+y, +m, +d) ? `${y}-${pad(+m)}-${pad(+d)}` : "";
  }

  // 20/05/2000 | 20-05-2000 | 20.05.2000 (day first — the app's own format)
  const loose = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (loose) {
    const [, d, m, y] = loose;
    if (isValidYmd(+y, +m, +d)) return `${y}-${pad(+m)}-${pad(+d)}`;
    // Not a valid dd/mm/yyyy → fall through to the legacy month-first parse.
  }

  // Legacy rows saved as MM/DD/YYYY (the old register form) — JS parses those
  // month-first, which is exactly what we want to recover here.
  const legacy = new Date(raw);
  if (!Number.isNaN(legacy.getTime())) {
    return `${legacy.getFullYear()}-${pad(legacy.getMonth() + 1)}-${pad(legacy.getDate())}`;
  }

  return "";
}

/** ISO → "dd/mm/yyyy" for display ("" when missing/unusable). */
export function isoToDisplayDate(iso?: string | null): string {
  const value = toIsoDate(iso);
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Tolerant parse of a date stored in MONTH-first order (MM/DD/YYYY) — the order
 * the signup form sends for `dateOfBirth`, so it is what older profile rows
 * hold. ISO values are accepted untouched, and a day-first value that cannot be
 * month-first (e.g. "20/05/2000") is recovered as dd/mm/yyyy.
 * Returns "" when the value is missing or not a valid date.
 */
export function toIsoDateMonthFirst(value?: string | null): string {
  if (!value) return "";
  const raw = String(value).trim();

  // 2000-05-20 | 2000-05-20T00:00:00.000Z
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return isValidYmd(+y, +m, +d) ? `${y}-${pad(+m)}-${pad(+d)}` : "";
  }

  // 05/20/2000 | 5-20-2000 (month first — the signup/register order)
  const loose = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (loose) {
    const [, m, d, y] = loose;
    if (isValidYmd(+y, +m, +d)) return `${y}-${pad(+m)}-${pad(+d)}`;
    // A "month" above 12 means the value is day-first after all (20/05/2000).
    if (isValidYmd(+y, +d, +m)) return `${y}-${pad(+d)}-${pad(+m)}`;
  }

  // Anything else (a full timestamp, a localized string…) → let JS parse it.
  const fallback = new Date(raw);
  if (!Number.isNaN(fallback.getTime())) {
    return `${fallback.getFullYear()}-${pad(fallback.getMonth() + 1)}-${pad(fallback.getDate())}`;
  }

  return "";
}

/** ISO → "MM/DD/YYYY" for display ("" when missing/unusable). */
export function isoToUsDisplayDate(iso?: string | null): string {
  const value = toIsoDateMonthFirst(iso);
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${m}/${d}/${y}`;
}

/** "MM/DD/YYYY" → ISO, or null when the text is incomplete/invalid. */
export function usDisplayToIso(text: string): string | null {
  const match = (text ?? "").trim().match(MDY_PATTERN);
  if (!match) return null;
  const [, m, d, y] = match;
  return isValidYmd(+y, +m, +d) ? `${y}-${pad(+m)}-${pad(+d)}` : null;
}

/**
 * Progressive typing mask: keeps digits and inserts the slashes, so the admin
 * always types (and sees) dd/mm/yyyy. Separators the user typed/pasted are
 * respected ("1/2/2000" stays as is, "20052000" becomes "20/05/2000").
 */
export function maskDateTyping(raw: string): string {
  const value = raw ?? "";

  if (/[/.-]/.test(value)) {
    const groups = value.split(/[/.-]/).map((part) => part.replace(/\D/g, ""));
    const [d = "", m = "", y = ""] = groups;
    let out = d.slice(0, 2);
    if (groups.length > 1) out = `${out}/${m.slice(0, 2)}`;
    if (groups.length > 2) out = `${out}/${y.slice(0, 4)}`;
    return out;
  }

  const digits = value.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join("/");
}

/** "dd/mm/yyyy" → ISO, or null when the text is incomplete/invalid. */
export function displayToIso(text: string): string | null {
  const match = (text ?? "").trim().match(DMY_PATTERN);
  if (!match) return null;
  const [, d, m, y] = match;
  return isValidYmd(+y, +m, +d) ? `${y}-${pad(+m)}-${pad(+d)}` : null;
}

/** Local Date → ISO "yyyy-mm-dd" (no timezone shifting). */
export function dateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** ISO "yyyy-mm-dd" → local Date at midnight, or null when unusable. */
export function isoToLocalDate(iso?: string | null): Date | null {
  const value = toIsoDate(iso);
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** True when the date is in the future (a DOB must not be). */
export function isFutureDate(iso: string): boolean {
  if (!iso) return false;
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return iso > todayIso;
}
