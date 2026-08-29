import { PortfolioPage } from "./portfolio-page";
import { HOME_ROUTE } from "./portfolio-routes";

export default function Home() {
  return <PortfolioPage initialRoute={HOME_ROUTE} />;
}
