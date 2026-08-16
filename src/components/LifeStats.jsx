import DashboardCard from "./DashboardCard";
import PixelIcon from "./PixelIcon";
import { STATS_PIXELS, STATS_PALETTE } from "../utils/pixelArt";

// Compact dashboard entry point for Life Stats. This is only the visual
// destination card — the actual numbers, most-common-adventure, and
// category breakdown are unchanged and still live in LifeStatsPanel,
// opened via onOpenLifeStats.
function LifeStats({ onOpenLifeStats }) {
  return (
    <DashboardCard
      icon={<PixelIcon pixels={STATS_PIXELS} palette={STATS_PALETTE} />}
      title="LIFE STATS"
      subtitle="Notice the life you're living."
      actionLabel="VIEW STATS →"
      ariaLabel="Open Life Stats"
      onClick={onOpenLifeStats}
      accent="stats"
    />
  );
}

export default LifeStats;