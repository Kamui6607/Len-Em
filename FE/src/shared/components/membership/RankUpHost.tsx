import { useNavigate } from "react-router";
import { useMembershipStore } from "../../../features/membership/store/membership.store";
import { RankPopup } from "./RankPopup";

/**
 * App-wide rank-up popup. BE raises the rank when an order is delivered (not
 * when the user does something here), so the store flags the change on the
 * next load/refresh and this shows it once, on whatever page the user is on.
 */
export function RankUpHost() {
  const navigate = useNavigate();
  const data = useMembershipStore((s) => s.data);
  const show = useMembershipStore((s) => s.showRankUpPopup);
  const previousRank = useMembershipStore((s) => s.previousRank);
  const dismiss = useMembershipStore((s) => s.dismissRankUpPopup);

  if (!data) return null;

  return (
    <RankPopup
      show={show}
      oldRank={previousRank}
      newRank={data.rank}
      onDismiss={dismiss}
      onExplore={() => {
        dismiss();
        navigate("/my-account/membership?tab=benefits");
      }}
    />
  );
}
