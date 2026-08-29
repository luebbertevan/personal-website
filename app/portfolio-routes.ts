export type PortfolioRoute = {
  destination: number;
  chapter: number;
};

export const destinations = [
  {
    label: "ABOUT",
    description: "What I build and why.",
    chapters: 1,
    title: "About",
    slug: "",
    chapterLabels: ["OVERVIEW"],
    chapterSlugs: ["overview"],
    shaderColor: [1.0, 0.25, 0.0625] as const,
    cssColor: [255, 103, 49] as const,
  },
  {
    label: "FOSTY",
    description: "An operations platform for animal rescue foster care.",
    chapters: 5,
    title: "Fosty",
    slug: "fosty",
    chapterLabels: ["ORIGIN", "PRODUCT", "DESIGN", "ENGINEERING", "OUTCOME"],
    chapterSlugs: ["origin", "product", "design", "engineering", "outcome"],
    shaderColor: [0.925, 0.282, 0.6] as const,
    cssColor: [236, 72, 153] as const,
  },
  {
    label: "CRUX VISION",
    description: "A video analysis tool for understanding climbing movement.",
    chapters: 5,
    title: "Crux Vision",
    slug: "crux-vision",
    chapterLabels: ["ORIGIN", "MOVEMENT REVIEW", "VISUAL OVERLAY", "ENGINEERING", "OUTLOOK"],
    chapterSlugs: ["origin", "movement-review", "visual-overlay", "engineering", "outlook"],
    shaderColor: [0.561, 0.902, 0.376] as const,
    cssColor: [143, 230, 96] as const,
  },
  {
    label: "VAL",
    description: "Product ownership and full stack development for a live recovery care platform.",
    chapters: 3,
    title: "Val",
    slug: "val",
    chapterLabels: ["EXPERIENCE", "CONTRIBUTIONS", "PRODUCTION"],
    chapterSlugs: ["experience", "contributions", "production"],
    shaderColor: [0.839, 0.157, 0.157] as const,
    cssColor: [214, 40, 40] as const,
  },
  {
    label: "INHERITANCE",
    description: "A motion capture retargeting pipeline for ML training datasets.",
    chapters: 4,
    title: "Inheritance",
    slug: "inheritance",
    chapterLabels: ["EXPERIENCE", "CHALLENGE", "ENGINEERING", "IMPACT"],
    chapterSlugs: ["experience", "challenge", "engineering", "impact"],
    shaderColor: [0.31, 0.68, 1.0] as const,
    cssColor: [79, 173, 255] as const,
  },
] as const;

export const HOME_ROUTE: PortfolioRoute = { destination: 0, chapter: 0 };

export function getPortfolioPath(route: PortfolioRoute): string {
  const destination = destinations[route.destination];
  if (!destination || route.destination === 0) return "/";
  if (route.chapter <= 0) return `/${destination.slug}`;
  const chapterSlug = destination.chapterSlugs[route.chapter];
  return chapterSlug ? `/${destination.slug}/${chapterSlug}` : `/${destination.slug}`;
}

export function getPortfolioTitle(route: PortfolioRoute): string {
  const destination = destinations[route.destination] ?? destinations[0];
  if (route.destination === 0) return "Evan Luebbert";
  if (route.chapter <= 0) return `${destination.title} — Evan Luebbert`;
  const chapter = destination.chapterLabels[route.chapter];
  return chapter
    ? `${chapter} — ${destination.title} — Evan Luebbert`
    : `${destination.title} — Evan Luebbert`;
}

export function resolvePortfolioRoute(
  projectSlug?: string,
  chapterSegments: string[] = [],
): PortfolioRoute | null {
  if (!projectSlug) return chapterSegments.length === 0 ? HOME_ROUTE : null;
  if (chapterSegments.length > 1) return null;

  const destination = destinations.findIndex((item) => item.slug === projectSlug.toLowerCase());
  if (destination <= 0) return null;
  if (chapterSegments.length === 0) return { destination, chapter: 0 };

  const chapterSlugs: readonly string[] = destinations[destination].chapterSlugs;
  const chapter = chapterSlugs.indexOf(chapterSegments[0].toLowerCase());
  return chapter >= 0 ? { destination, chapter } : null;
}

export function parsePortfolioPathname(pathname: string): PortfolioRoute | null {
  const segments = pathname.split("/").filter(Boolean).map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
  if (segments.length === 0) return HOME_ROUTE;
  return resolvePortfolioRoute(segments[0], segments.slice(1));
}

export function getAdjacentPortfolioRoute(
  route: PortfolioRoute,
  direction: -1 | 1,
): PortfolioRoute | null {
  const destination = destinations[route.destination];
  if (!destination) return null;

  if (direction > 0) {
    if (route.chapter < destination.chapters - 1) {
      return { destination: route.destination, chapter: route.chapter + 1 };
    }
    return route.destination < destinations.length - 1
      ? { destination: route.destination + 1, chapter: 0 }
      : null;
  }

  if (route.chapter > 0) {
    return { destination: route.destination, chapter: route.chapter - 1 };
  }
  if (route.destination <= 0) return null;
  return { destination: route.destination - 1, chapter: 0 };
}
