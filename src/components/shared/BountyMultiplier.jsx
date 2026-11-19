export default function BountyMultiplier({ state }) {
  if (!state?.doubleBountyNextRound) return null;
  return (
    <div className="comic-panel-sm inline-block px-3 py-1.5 ds-label text-primary">
      x2 Bounty
    </div>
  );
}