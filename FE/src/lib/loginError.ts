// ============================================================
// Login error → Vietnamese banner text + tone.
// ============================================================
// The backend answers failed logins in English, e.g.
//   "Invalid password. 2 attempt(s) left before your account is locked for 10 minute(s)."
//   "Account locked due to multiple failed attempts. Try again in 5 minute(s)."
// Older deployments say "Invalid password. 2 attempt(s) remaining." /
// "Please try again after 12 minutes!" — both forms are recognised here.
// Unknown messages are shown as-is.
// ============================================================

export interface LoginErrorView {
  text: string;
  /** "warning" when the user is about to be locked out (≤ 2 attempts left). */
  tone: "error" | "warning";
}

/** Attempts left at or below which the banner turns into a warning. */
const WARN_AT = 2;

const WRONG_PASSWORD = "Mật khẩu không đúng.";
const WRONG_ID = "Email/tên đăng nhập không đúng hoặc tài khoản chưa được kích hoạt.";

/** "10 minute(s)" / "2 hours" → "10 phút" / "2 giờ" */
function waitText(amount: string, unit: string) {
  return `${amount} ${unit.startsWith("hour") ? "giờ" : "phút"}`;
}

export function describeLoginError(message: string | undefined): LoginErrorView {
  const raw = (message ?? "").trim();
  if (!raw) return { text: "Đăng nhập thất bại. Vui lòng thử lại.", tone: "error" };

  const isPassword = /invalid password/i.test(raw);
  const prefix = isPassword ? WRONG_PASSWORD : WRONG_ID;

  // Warning before the lock: "N attempt(s) left before … is locked for X minute(s)."
  const left = raw.match(/(\d+) attempt\(s\) left before (.+?) is locked for (\d+) (minute|hour)/i);
  if (left) {
    const n = Number(left[1]);
    const target = /account/i.test(left[2]) ? "tài khoản bị khoá" : "bị tạm khoá đăng nhập";
    return {
      text: `${prefix} Còn ${n} lần thử trước khi ${target} ${waitText(left[3], left[4])}.`,
      tone: n <= WARN_AT ? "warning" : "error",
    };
  }

  // Older backend: "N attempt(s) remaining."
  const remaining = raw.match(/(\d+) attempt\(s\) remaining/i);
  if (remaining) {
    const n = Number(remaining[1]);
    return {
      text: `${prefix} Còn ${n} lần thử trước khi bị tạm khoá.`,
      tone: n <= WARN_AT ? "warning" : "error",
    };
  }

  if (/contact support/i.test(raw)) {
    return { text: "Tài khoản đã bị khoá. Vui lòng liên hệ bộ phận hỗ trợ.", tone: "error" };
  }

  // Locked: "Try again in 5 minute(s)." / "try again after 12 minutes!"
  const wait = raw.match(/try again (?:in|after) (\d+) (minute|hour)/i);
  if (wait) {
    const subject = /too many failed login/i.test(raw)
      ? "Bạn đã nhập sai quá nhiều lần."
      : "Tài khoản đang bị tạm khoá do nhập sai nhiều lần.";
    return { text: `${subject} Vui lòng thử lại sau ${waitText(wait[1], wait[2])}.`, tone: "error" };
  }

  if (/invalid or account is inactive/i.test(raw)) return { text: WRONG_ID, tone: "error" };
  if (isPassword) return { text: WRONG_PASSWORD, tone: "error" };

  return { text: raw, tone: "error" };
}
