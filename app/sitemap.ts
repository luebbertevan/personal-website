import type { MetadataRoute } from "next";
import { destinations, getPortfolioPath } from "./portfolio-routes";

const siteUrl = "https://evanluebbert.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return destinations.flatMap((destination, destinationIndex) => {
    if (destinationIndex === 0) return [{ url: siteUrl, priority: 1 }];

    return Array.from({ length: destination.chapters }, (_, chapter) => ({
      url: `${siteUrl}${getPortfolioPath({ destination: destinationIndex, chapter })}`,
      priority: chapter === 0 ? 0.9 : 0.7,
    }));
  });
}
