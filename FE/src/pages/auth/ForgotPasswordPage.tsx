import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, ArrowLeft, CircleCheck as CheckCircle2, Loader as Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../services/auth.service";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authService.sendForgotPasswordEmail(email);
      setSent(true);
    } catch {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
              <span className="text-2xl">🧶</span>
            </div>
            <span className="text-2xl font-semibold">Len&Em</span>
          </Link>

          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl mb-2">Check your email</h2>
            <p className="text-muted-foreground text-sm mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
              <span className="text-2xl">🧶</span>
            </div>
            <span className="text-2xl font-semibold">Len&Em</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-5">
          <div className="text-center">
            <h2 className="text-xl mb-1">Forgot password?</h2>
            <p className="text-sm text-muted-foreground">
              No worries. Enter your email and we'll send you a reset link.
            </p>
          </div>

          <div>
            <label className="block text-sm mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-full hover:bg-primary/90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </button>

          <p className="text-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}