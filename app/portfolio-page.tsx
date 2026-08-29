import type { CSSProperties } from "react";
import { SignalPrototypeV4 } from "./signal-prototype-v4";
import { destinations, type PortfolioRoute } from "./portfolio-routes";

type PortfolioPageProps = {
  initialRoute: PortfolioRoute;
};

export function PortfolioPage({ initialRoute }: PortfolioPageProps) {
  const accent = destinations[initialRoute.destination]?.cssColor ?? destinations[0].cssColor;
  const style = { "--accent-rgb": accent.join(", ") } as CSSProperties;

  return (
    <div
      className="site-root"
      data-site-root
      data-direct-entry={initialRoute.destination > 0 ? "" : undefined}
      style={style}
    >
      <div className="site-identity">
        <strong>Evan Luebbert</strong>
        <span>Software Engineer</span>
      </div>
      <SignalPrototypeV4 initialRoute={initialRoute} />
    </div>
  );
}
