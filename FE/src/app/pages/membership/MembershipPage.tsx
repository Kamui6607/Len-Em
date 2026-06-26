import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useMembershipStore } from "../../../features/membership/store/membership.store";
import { RANK_CONFIGS } from "../../../features/membership/types/membership.types";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { MembershipCard } from "../../components/membership/MembershipCard";
import { BenefitList } from "../../components/membership/BenefitCard";
import { RankTimeline, RankTimelineHorizontal } from "../../components/membership/RankTimeline";
import { MembershipHistory } from "../../components/membership/MembershipHistory";
import { RankPopup } from "../../components/membership/RankPopup";

type TabType = "overview" | "benefits" | "timeline" | "history";

export function MembershipPage() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get("tab") as TabType) || "overview",
  );

  const {
    data,
    history,
    loading,
    error,
    showRankUpPopup,
    previousRank,
    initialize,
    dismissRankUpPopup,
  } = useMembershipStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams(tab === "overview" ? {} : { tab });
  };

  const handleExploreBenefits = () => {
    dismissRankUpPopup();
    handleTabChange("benefits");
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "💎" },
    { key: "benefits", label: "Benefits", icon: "🎁" },
    { key: "timeline", label: "Timeline", icon: "📈" },
    { key: "history", label: "History", icon: "📋" },
  ];

  return (
    <div className="min-h-screen bg-background py-6 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Membership Program</h1>
          <p className="text-sm text-muted-foreground">
            Earn points, level up, and unlock exclusive perks
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={initialize} className="text-sm text-red-600 underline mt-1">
              Retry
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border hover:bg-muted"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-48 bg-muted rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-muted rounded-xl" />
              <div className="h-24 bg-muted rounded-xl" />
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <MembershipCard />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">🎁 Current Benefits</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {(() => {
                        const config = RANK_CONFIGS.find((r) => r.rank === data.rank);
                        return config?.benefits.map((b) => (
                          <div key={b.id} className="flex items-center gap-2 text-xs">
                            <span>{b.icon}</span>
                            <span className="text-muted-foreground truncate">{b.title}</span>
                          </div>
                        ));
                      })()}
                    </div>
                    <button onClick={() => handleTabChange("benefits")} className="text-xs text-primary mt-3 hover:underline">
                      View all benefits →
                    </button>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📋 Recent Transactions</h3>
                    <MembershipHistory history={history} compact />
                    <button onClick={() => handleTabChange("history")} className="text-xs text-primary mt-3 hover:underline">
                      View full history →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "benefits" && (
              <div className="space-y-6">
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">🎁 Your Benefits</h3>
                  <BenefitList benefits={RANK_CONFIGS.flatMap((r) => r.benefits)} currentRank={data.rank} />
                </div>
                {data.rank !== "diamond" && (() => {
                  const nextRank = RANK_CONFIGS.find(
                    (r) => r.rank === (data.rank === "member" ? "silver" : data.rank === "silver" ? "gold" : "diamond"),
                  );
                  if (!nextRank) return null;
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        🔒 Next tier benefits: {nextRank.icon} {nextRank.displayName}
                      </h3>
                      <div className="space-y-2">
                        {nextRank.benefits.filter(
                          (b) => !RANK_CONFIGS.find((r) => r.rank === data.rank)?.benefits.find((cb) => cb.id === b.id),
                        ).map((b) => (
                          <div key={b.id} className="flex items-start gap-2 text-sm">
                            <span>{b.icon}</span>
                            <div>
                              <p className="font-medium">{b.title}</p>
                              <p className="text-xs text-muted-foreground">{b.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="bg-card rounded-2xl border border-border p-5 md:p-8">
                {isMobile ? (
                  <RankTimeline currentRank={data.rank} points={data.points} />
                ) : (
                  <RankTimelineHorizontal currentRank={data.rank} points={data.points} />
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">📋 Point History</h3>
                <MembershipHistory history={history} />
              </div>
            )}
          </>
        )}
      </div>

      {data && (
        <RankPopup
          show={showRankUpPopup}
          oldRank={previousRank}
          newRank={data.rank}
          onDismiss={dismissRankUpPopup}
          onExplore={handleExploreBenefits}
        />
      )}
    </div>
  );
}