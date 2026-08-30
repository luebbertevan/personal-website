export const visualQualityTiers = ["full", "balanced", "reduced"] as const;

export type VisualQualityTier = (typeof visualQualityTiers)[number];

export type VisualQualityProfile = {
  particleSimulationSize: number;
  desktopPixelRatioCap: number;
  mobilePixelRatioCap: number;
  desktopStudyScale: (width: number) => number;
  mobileStudyScale: number;
  postProcessingEnabled: boolean;
  minimumFrameInterval: number;
};

export type VisualCapabilityHints = {
  isMobile: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
};

export const visualQualityProfiles: Record<VisualQualityTier, VisualQualityProfile> = {
  full: {
    particleSimulationSize: 160,
    desktopPixelRatioCap: 1.15,
    mobilePixelRatioCap: 0.9,
    desktopStudyScale: (width) => width > 1600 ? 0.62 : width > 900 ? 0.74 : 0.78,
    mobileStudyScale: 0.66,
    postProcessingEnabled: true,
    minimumFrameInterval: 0,
  },
  balanced: {
    particleSimulationSize: 128,
    desktopPixelRatioCap: 1,
    mobilePixelRatioCap: 0.78,
    desktopStudyScale: (width) => width > 1600 ? 0.54 : width > 900 ? 0.62 : 0.66,
    mobileStudyScale: 0.56,
    postProcessingEnabled: true,
    minimumFrameInterval: 0,
  },
  reduced: {
    particleSimulationSize: 96,
    desktopPixelRatioCap: 0.8,
    mobilePixelRatioCap: 0.68,
    desktopStudyScale: (width) => width > 1600 ? 0.46 : width > 900 ? 0.52 : 0.56,
    mobileStudyScale: 0.5,
    postProcessingEnabled: false,
    minimumFrameInterval: 1000 / 30,
  },
};

export function isVisualQualityTier(value: string | null): value is VisualQualityTier {
  return visualQualityTiers.some((tier) => tier === value);
}

export function estimateInitialVisualQuality({
  isMobile,
  hardwareConcurrency,
  deviceMemory,
}: VisualCapabilityHints): VisualQualityTier {
  if (
    (typeof deviceMemory === "number" && deviceMemory <= 2)
    || (typeof hardwareConcurrency === "number" && hardwareConcurrency <= 2)
  ) {
    return "reduced";
  }

  if (
    isMobile
    || (typeof deviceMemory === "number" && deviceMemory <= 3)
    || (typeof hardwareConcurrency === "number" && hardwareConcurrency <= 3)
  ) {
    return "balanced";
  }

  return "full";
}

export function getNextLowerVisualQuality(tier: VisualQualityTier): VisualQualityTier {
  if (tier === "full") return "balanced";
  return "reduced";
}
