import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  BookOpen,
  ChevronRight,
  Clapperboard,
  Coins,
  Gift,
  History,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Route,
  ScrollText,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useMembershipStore } from "../../../features/membership/store/membership.store";
import { COIN_RULES, getRankConfig, POINT_RULES } from "../../../features/membership/types/membership.types";
import { formatPrice } from "../../../lib/formatPrice";
import { cn } from "../../../shared/components/ui/utils";
import { MembershipCard, MembershipCardSkeleton } from "../../../shared/components/membership/MembershipCard";
import { BenefitCard, RankLadder } from "../../../shared/components/membership/BenefitCard";
import { RankJourney } from "../../../shared/components/membership/RankTimeline";
import { MembershipHistory } from "../../../shared/components/membership/MembershipHistory";
import { CoinHistory } from "../../../shared/components/membership/CoinHistory";
import "../../../styles/craft.css";
import "../../../styles/membership.css";

type TabType = "overview" | "benefits" | "timeline" | "history";

const TABS: { key: TabType; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "Tổng quan", icon: LayoutGrid },
  { key: "benefits", label: "Quyền lợi", icon: Gift },
  { key: "timeline", label: "Hành trình", icon: Route },
  { key: "history", label: "Lịch sử", icon: History },
];

const isTab = (value: string | null): value is TabType => TABS.some((t) => t.key === value);

export function MembershipPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabType = isTab(tabParam) ? tabParam : "overview";
  const [historyView, setHistoryView] = useState<"points" | "coins">("points");

  const {
    data,
    history,
    coinTransactions,
    hasMoreHistory,
    loadingMoreHistory,
    hasMoreCoins,
    loadingMoreCoins,
    loading,
    error,
    initialize,
    refresh,
    loadMoreHistory,
    loadMoreCoins,
  } = useMembershipStore();

  // The store is loaded on login (App.tsx); re-fetch quietly on open so
  // points / coin / history reflect orders delivered since then.
  useEffect(() => {
    if (!useMembershipStore.getState().loading) refresh();
  }, [refresh]);

  const handleTabChange = (tab: TabType) => {
    setSearchParams(tab === "overview" ? {} : { tab }, { replace: true });
  };

  const rank = data ? getRankConfig(data.rank) : null;

  return (
    <div className="mb-page">
      <div className="mb-wrap">
        {/* ── Hero: lời chào + thẻ thành viên ── */}
        <section className="craft-hero craft-rise">
          <div className="mb-hero-grid">
            <div>
              <span className="craft-eyebrow">Len&amp;em Club</span>
              <h1 className="craft-title">
                Thẻ thành viên <em>của bạn</em>
              </h1>
              <div className="craft-stitch" aria-hidden="true" />
              <p className="craft-subtitle">
                Mỗi mũi len bạn mua, mỗi bài DIY bạn chia sẻ đều được ghi lại thành điểm — tích đủ để lên
                hạng, nhận coin và mở thêm quyền lợi.
              </p>
              <div className="craft-stats">
                <HeroStat
                  icon={Sparkles}
                  value={rank ? `${rank.coinRewardPercent}%` : "—"}
                  label="hoàn coin mỗi đơn"
                />
                <HeroStat icon={Coins} value={`${COIN_RULES.maxUsagePercent}%`} label="tiền hàng trả bằng coin" />
                <HeroStat icon={RefreshCw} value={`${COIN_RULES.expiryMonths} tháng`} label="hạn dùng coin" />
              </div>
            </div>
            <div className="mb-hero-card">
              {error && !data ? (
                <div className="mb-card-error">
                  <p>{error}</p>
                  <button type="button" onClick={initialize} className="craft-btn-ghost mt-3">
                    <RefreshCw size={15} aria-hidden="true" /> Thử lại
                  </button>
                </div>
              ) : loading || !data ? (
                <MembershipCardSkeleton />
              ) : (
                <MembershipCard
                  onViewHistory={() => handleTabChange("history")}
                  onViewBenefits={() => handleTabChange("benefits")}
                  onViewTimeline={() => handleTabChange("timeline")}
                />
              )}
            </div>
          </div>
        </section>

        {/* ── Tabs ── */}
        <div className="craft-seg mb-tabs" role="tablist" aria-label="Thành viên">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn("craft-seg-btn", activeTab === tab.key && "is-active")}
              >
                <Icon size={15} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading && !data && (
          <div className="mb-grid-2" aria-busy="true">
            <div className="craft-skeleton h-64 rounded-[24px]" />
            <div className="craft-skeleton h-64 rounded-[24px]" />
          </div>
        )}

        {data && rank && (
          <div key={activeTab} className="craft-rise">
            {activeTab === "overview" && (
              <div className="grid gap-[18px]">
                <div className="mb-grid-2">
                  <section className="mb-panel">
                    <PanelHead icon={Gift} title="Quyền lợi đang có" sub={`Hạng ${rank.displayName}`} />
                    {rank.benefits.map((b) => (
                      <BenefitCard key={b.id} benefit={b} currentRank={data.rank} />
                    ))}
                    <button type="button" className="mb-link" onClick={() => handleTabChange("benefits")}>
                      So sánh các hạng <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </section>
                  <section className="mb-panel">
                    <PanelHead icon={ScrollText} title="Hoạt động gần đây" sub="Điểm cộng và chờ cộng" />
                    <MembershipHistory history={history} compact />
                    {history.length > 0 && (
                      <button type="button" className="mb-link" onClick={() => handleTabChange("history")}>
                        Xem toàn bộ lịch sử <ChevronRight size={14} aria-hidden="true" />
                      </button>
                    )}
                  </section>
                </div>

                <section className="mb-panel">
                  <PanelHead icon={Sparkles} title="Cách nhận điểm" sub="Điểm cộng vào thẻ khi hoạt động hoàn tất" />
                  <div className="mb-earn">
                    <EarnItem
                      icon={ShoppingBag}
                      title="Mua sắm"
                      desc={`1 điểm cho mỗi ${formatPrice(POINT_RULES.vndPerPoint)} tiền hàng, cộng khi đơn giao thành công.`}
                    />
                    <EarnItem
                      icon={Coins}
                      title="Hoàn coin"
                      desc={`Mỗi đơn giao thành công hoàn ${rank.coinRewardPercent}% Coin theo hạng của bạn.`}
                    />
                    <EarnItem
                      icon={Clapperboard}
                      title="Chia sẻ bài DIY"
                      desc="Bài DIY được duyệt nhận thêm điểm và coin thưởng."
                    />
                    <EarnItem
                      icon={BookOpen}
                      title="Hoàn thành khoá học"
                      desc="Học xong một khoá — nhận điểm thưởng vào thẻ."
                    />
                  </div>
                </section>
              </div>
            )}

            {activeTab === "benefits" && <RankLadder currentRank={data.rank} points={data.points} />}

            {activeTab === "timeline" && (
              <section className="mb-panel">
                <PanelHead icon={Route} title="Hành trình hạng" sub="Mỗi nút thắt là một hạng mới" />
                <div className="py-2 md:py-6">
                  <RankJourney currentRank={data.rank} points={data.points} />
                </div>
              </section>
            )}

            {activeTab === "history" && (
              <section className="mb-panel">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <PanelHead
                    icon={historyView === "points" ? ScrollText : Coins}
                    title={historyView === "points" ? "Lịch sử điểm" : "Lịch sử coin"}
                    sub={
                      historyView === "points"
                        ? "Điểm “chờ giao hàng” chưa được cộng vào tổng"
                        : `Coin nhận được có hạn ${COIN_RULES.expiryMonths} tháng`
                    }
                    flush
                  />
                  <div className="craft-seg" role="tablist" aria-label="Loại lịch sử">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={historyView === "points"}
                      className={cn("craft-seg-btn", historyView === "points" && "is-active")}
                      onClick={() => setHistoryView("points")}
                    >
                      Điểm
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={historyView === "coins"}
                      className={cn("craft-seg-btn", historyView === "coins" && "is-active")}
                      onClick={() => setHistoryView("coins")}
                    >
                      Coin
                    </button>
                  </div>
                </div>

                {historyView === "points" ? (
                  <>
                    <MembershipHistory history={history} />
                    {hasMoreHistory && <LoadMoreButton loading={loadingMoreHistory} onClick={loadMoreHistory} />}
                  </>
                ) : (
                  <>
                    <CoinHistory transactions={coinTransactions} />
                    {hasMoreCoins && <LoadMoreButton loading={loadingMoreCoins} onClick={loadMoreCoins} />}
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HeroStat({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="craft-stat">
      <span className="craft-stat-icon">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div>
        <div className="craft-stat-num">{value}</div>
        <div className="craft-stat-label">{label}</div>
      </div>
    </div>
  );
}

function PanelHead({
  icon: Icon,
  title,
  sub,
  flush = false,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  flush?: boolean;
}) {
  return (
    <div className={cn("craft-section-head", flush && "!mb-0")}>
      <span className="craft-section-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <h2 className="craft-section-title">{title}</h2>
        {sub && <p className="craft-section-sub">{sub}</p>}
      </div>
      {!flush && <span className="craft-section-thread" aria-hidden="true" />}
    </div>
  );
}

function EarnItem({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="mb-earn-item">
      <span className="mb-earn-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <p className="mb-earn-title">{title}</p>
        <p className="mb-earn-desc">{desc}</p>
      </div>
    </div>
  );
}

function LoadMoreButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className="mb-more">
      {loading ? (
        <>
          <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Đang tải…
        </>
      ) : (
        "Xem thêm"
      )}
    </button>
  );
}
