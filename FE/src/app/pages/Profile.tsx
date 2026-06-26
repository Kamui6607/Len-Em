import { useAuth } from "../../hooks/useAuth";
import { useMembershipStore } from "../../features/membership/store/membership.store";
import { Mail, Phone, Calendar, MapPin, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { MembershipCard } from "../components/membership/MembershipCard";
import { RankBadge } from "../components/membership/RankBadge";

export function Profile() {
  const { user } = useAuth();
  const { data, initialize } = useMembershipStore();

  if (!user) return null;

  const avatarUrl = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=E09F7D&color=fff`
    : "";

  return (
    <div className="min-h-screen bg-background py-8 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account and membership</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* ── Left: Personal Info ── */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 flex items-center gap-5">
                <img
                  src={avatarUrl}
                  alt={user.fullName}
                  className="w-20 h-20 rounded-full border-4 border-card shadow-lg"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{user.fullName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground capitalize">{user.roleId}</span>
                    {data && <RankBadge rank={data.rank} size="sm" showLabel />}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3.5 bg-muted/40 rounded-xl">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3.5 bg-muted/40 rounded-xl">
                    <div className="w-9 h-9 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{user.phone || "Not set"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3.5 bg-muted/40 rounded-xl">
                    <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm font-medium truncate">{user.address || "Not set"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3.5 bg-muted/40 rounded-xl">
                    <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="text-sm font-medium">May 2026</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                <button className="w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-semibold hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: Membership Card ── */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Membership
                </h3>
                <Link
                  to="/my-account/membership"
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                  View details <ChevronRight className="size-3" />
                </Link>
              </div>
              <MembershipCard
                onViewHistory={() => window.location.href = "/my-account/membership?tab=history"}
                onViewBenefits={() => window.location.href = "/my-account/membership?tab=benefits"}
                onViewTimeline={() => window.location.href = "/my-account/membership?tab=timeline"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
