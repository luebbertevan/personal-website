"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type SyntheticEvent,
  type TouchEvent,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import * as THREE from "three";
import { createEmberLoom } from "./ember-loom";
import {
  carbonPassShader,
  depthOfFieldShader,
  getSignalCameraDistance,
  screenVertexShader,
} from "./signal-prototype";
import {
  destinations,
  getAdjacentPortfolioRoute,
  getPortfolioPath,
  getPortfolioTitle,
  parsePortfolioPathname,
  type PortfolioRoute,
} from "./portfolio-routes";
import {
  estimateInitialVisualQuality,
  getNextLowerVisualQuality,
  isVisualQualityTier,
  visualQualityProfiles,
  visualQualityTiers,
  type VisualQualityTier,
} from "./visual-quality";
import styles from "./signal-prototype.module.css";

const fostyProductMedia = [
  {
    title: "FOSTERS NEEDED",
    description: "The Fosters Needed page gives volunteers one place to see animals waiting for a foster home. Essential details are visible at a glance, helping volunteers quickly understand where they can help.",
    src: "/images/fosty-fosters-needed.webp",
    alt: "Fosty’s Fosters Needed page showing a searchable grid of cats waiting for foster homes.",
    width: 2254,
    height: 1712,
  },
  {
    title: "ANIMAL DETAILS",
    description: "Each animal profile brings care needs and history into one clear record. Volunteers can understand the level of care required before offering to foster, helping rescues make better matches.",
    src: "/images/fosty-animal-details.webp",
    alt: "Fosty’s coordinator view of an animal profile with status, age, care needs, photos, and adoption information.",
    width: 1628,
    height: 1540,
  },
  {
    title: "GROUP DETAILS",
    description: "Animals that should stay together, such as a litter of kittens, can be managed as a group. Shared care information stays consistent while each animal keeps an individual record.",
    src: "/images/fosty-group-details.webp",
    alt: "Fosty’s coordinator view of a two-kitten group with shared details and individual animal cards.",
    width: 1632,
    height: 1514,
  },
  {
    title: "INTAKE",
    description: "Intake is designed for the unpredictable flow of rescue work. Staff can enter animals in batches and create useful records even when details are incomplete, so care is not delayed by missing information.",
    src: "/images/fosty-intake.webp",
    alt: "Fosty’s Create New Animal intake form with optional fields, status controls, and photo tools.",
    width: 1632,
    height: 1558,
  },
  {
    title: "REQUEST",
    description: "Volunteers can request an animal or group directly from its profile. This turns interest into a clear, trackable step instead of another message staff must piece together.",
    src: "/images/fosty-animal-request.webp",
    alt: "Fosty’s Request to Foster dialog for sending a foster request with an optional message.",
    width: 996,
    height: 782,
  },
  {
    title: "ASSIGNMENT",
    description: "Staff can review every request in one place and match animals with the right foster homes. Decisions stay visible, reducing confusion and helping animals move into care faster.",
    src: "/images/fosty-assignment.webp",
    alt: "Fosty’s Pending Foster Requests page showing animals and groups awaiting assignment.",
    width: 2314,
    height: 1144,
  },
  {
    title: "COMMUNICATION",
    description: "Each foster home has a dedicated group chat with rescue staff, so questions can reach the right person without leaving anyone out of the loop. Animal and group tags, requests and assignments updates, and shared photos keep each conversation connected to the care it supports.",
    src: "/images/fosty-communication.webp",
    alt: "A Fosty group chat between a foster volunteer and rescue staff with shared animal cards and photos.",
    width: 2330,
    height: 1548,
  },
] as const;

const fostyDesignMedia = {
  title: "USABILITY REVIEW",
  description: "A live usability review focused on friction, discoverability, and efficiency across core foster workflows.",
  src: "/images/fosty-usability-review.webp",
  alt: "A Fosty usability review call showing a structured workflow checklist alongside participants in Google Meet.",
  width: 1600,
  height: 918,
} as const;

type FostyMedia = (typeof fostyProductMedia)[number] | typeof fostyDesignMedia;

const cruxMovementMedia = [
  {
    title: "ANALYSIS RANGE",
    src: "/images/crux-vision-analyze-range.webp",
    alt: "Crux Vision’s clip analysis controls showing a 12.5-second range selected for on-device pose analysis.",
    width: 780,
    height: 714,
  },
  {
    title: "CHECKPOINTS",
    src: "/images/crux-vision-checkpoints.webp",
    alt: "Crux Vision’s checkpoint controls with named Crux Start and Fall review marks.",
    width: 748,
    height: 606,
  },
  {
    title: "PRECISION PLAYBACK",
    src: "/images/crux-vision-playback-controls.webp",
    alt: "Crux Vision’s slow-motion, looping, and analyzed-frame navigation controls.",
    width: 770,
    height: 260,
  },
  {
    title: "OVERLAY SOURCES",
    src: "/images/crux-vision-overlay-settings.webp",
    alt: "Crux Vision’s overlay settings with shoulder midpoint, right elbow, and right knee trails selected.",
    width: 764,
    height: 1274,
  },
  {
    title: "TRAIL APPEARANCE",
    src: "/images/crux-vision-trail-appearance.webp",
    alt: "Crux Vision’s advanced trail editor for changing a joint trail’s color, width, opacity, and duration.",
    width: 698,
    height: 1348,
  },
] as const;

type CruxMovementMedia = (typeof cruxMovementMedia)[number];

const cruxEngineeringMedia = [
  {
    title: "COMPARE DERIVED VIEWS",
    src: "/images/crux-vision-calibration-overview.webp",
    alt: "Crux Vision’s advanced pose-quality calibration workspace showing preview controls, quality metrics, and body-group coverage.",
    width: 674,
    height: 1606,
  },
  {
    title: "CONFIDENCE THRESHOLDS",
    src: "/images/crux-vision-confidence-controls.webp",
    alt: "Crux Vision’s global confidence and body-group override controls for visibility and presence thresholds.",
    width: 612,
    height: 988,
  },
  {
    title: "CONTINUITY CONTROLS",
    src: "/images/crux-vision-continuity-smoothing.webp",
    alt: "Crux Vision’s advanced controls for confidence hysteresis, temporal plausibility checks, One Euro smoothing, and centered smoothing radius.",
    width: 612,
    height: 1422,
  },
] as const;

type CruxMedia = CruxMovementMedia | (typeof cruxEngineeringMedia)[number];

const DESTINATION_TRAVEL = 52;
const DESTINATION_DURATION = 7.35;
const CHAPTER_TRAVEL = 13;
const CHAPTER_DURATION = 2.45;
const MOBILE_DESTINATION_TRAVEL = 34;
const MOBILE_CHAPTER_TRAVEL = 8;
const MANUAL_ARRIVAL_PROGRESS = 0.88;
const MANUAL_EDGE_DISTANCE = 3.2;
const HOME_OPENING_DURATION = 4.75;
const MOBILE_DESTINATION_DURATION = DESTINATION_DURATION;
const MOBILE_CHAPTER_DURATION = 1.55;
const MOBILE_HOME_OPENING_DURATION = 2.15;
const MOBILE_SWIPE_DISTANCE = 56;
const MOBILE_SWIPE_MAX_DURATION = 800;
const MOBILE_SWIPE_DIRECTION_RATIO = 1.25;
const DIRECT_ENTRY_DURATION = 0.72;
const PARTICLE_ARRIVAL_START = 0.38;
const PARTICLE_ARRIVAL_END = 0.70;
const PARTICLE_DISTURBANCE_START = 0.02;
const PARTICLE_DISTURBANCE_END = 0.98;
const PANEL_ARRIVAL_START = 0.80;
const PANEL_ARRIVAL_END = 0.985;

type NavigationCommand = { type: "route"; route: PortfolioRoute };

type RouteTransition = {
  kind: "destination" | "chapter";
  elapsed: number;
  duration: number;
  fromX: number;
  toX: number;
  sourceDestination: number;
  targetDestination: number;
  sourceChapter: number;
  targetChapter: number;
  shaderFrom: THREE.Vector3;
  shaderTo: THREE.Vector3;
  cssFrom: number[];
  cssTo: number[];
  manualArrival: boolean;
  panelHeightFrom?: number;
  panelHeightTo?: number;
};

type ManualRoute = {
  kind: "destination" | "chapter";
  direction: -1 | 1;
  targetX: number;
  distance: number;
  targetDestination: number;
  targetChapter: number;
};

function MediaExpandIcon() {
  return <span aria-hidden="true" className={styles.expandIcon}>⛶</span>;
}

function MediaLoadingIndicator() {
  return <span aria-hidden="true" className={styles.mediaLoadingIndicator} />;
}

function setMediaLoadingState(media: HTMLElement, isLoading: boolean) {
  const frame = media.closest<HTMLElement>("[data-media-frame]");
  if (frame) frame.dataset.mediaLoading = isLoading ? "true" : "false";
}

function handleMediaReady(event: SyntheticEvent<HTMLImageElement | HTMLVideoElement>) {
  setMediaLoadingState(event.currentTarget, false);
}

function activateDeferredVideo(video: HTMLVideoElement) {
  const source = video.dataset.src;
  if (!source) return;
  if (video.getAttribute("src") === source) {
    setMediaLoadingState(video, video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA);
    return;
  }
  setMediaLoadingState(video, true);
  video.src = source;
  video.load();
}

function deactivateDeferredVideo(video: HTMLVideoElement) {
  video.pause();
  setMediaLoadingState(video, false);
  if (!video.hasAttribute("src")) return;
  video.removeAttribute("src");
  video.load();
}

type SignalPrototypeV4Props = {
  initialRoute: PortfolioRoute;
};

type VisualDiagnostics = {
  state: "loading" | "ready" | "fallback";
  tier: VisualQualityTier;
  mode: "auto" | "forced";
  fps: number | null;
  reason: string;
};

function getPortfolioUrlWithVisualSettings(route: PortfolioRoute) {
  const path = getPortfolioPath(route);
  const currentParams = new URLSearchParams(window.location.search);
  const nextParams = new URLSearchParams();
  ["visual-debug", "visual-quality", "visual-fallback"].forEach((key) => {
    const value = currentParams.get(key);
    if (value !== null) nextParams.set(key, value);
  });
  const query = nextParams.toString();
  return query ? `${path}?${query}` : path;
}

function syncBrowserRoute(route: PortfolioRoute, push: boolean) {
  const path = getPortfolioPath(route);
  if (push && window.location.pathname !== path) {
    window.history.pushState(
      { portfolioRoute: route },
      "",
      getPortfolioUrlWithVisualSettings(route),
    );
  }
}

export function SignalPrototypeV4({ initialRoute }: SignalPrototypeV4Props) {
  const initialRouteRef = useRef(initialRoute);
  const shellRef = useRef<HTMLElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLElement>(null);
  const outlookEmailRef = useRef<HTMLElement>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const cruxVideoRef = useRef<HTMLVideoElement>(null);
  const cruxMovementVideoRef = useRef<HTMLVideoElement>(null);
  const cruxComparisonVideoRef = useRef<HTMLVideoElement>(null);
  const inheritanceVideoRef = useRef<HTMLVideoElement>(null);
  const inheritanceWalkingVideoRef = useRef<HTMLVideoElement>(null);
  const navigationCommandRef = useRef<NavigationCommand | null>(null);
  const qualityCommandRef = useRef<VisualQualityTier | "auto" | null>(null);
  const visualFallbackRef = useRef(false);
  const activeDestinationRef = useRef(initialRoute.destination);
  const activeChapterRef = useRef(initialRoute.chapter);
  const prefersReducedMotionRef = useRef(false);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  const mobileSwipeStartRef = useRef<{ x: number; y: number; startedAt: number } | null>(null);
  const [emailCopyStatus, setEmailCopyStatus] = useState<"idle" | "copied" | "selected">("idle");
  const [expandedMedia, setExpandedMedia] = useState<FostyMedia | null>(null);
  const [expandedCruxMedia, setExpandedCruxMedia] = useState<CruxMedia | null>(null);
  const [inheritanceImageExpanded, setInheritanceImageExpanded] = useState(false);
  const [activeRoute, setActiveRoute] = useState(initialRoute);
  const [pendingMediaRoute, setPendingMediaRoute] = useState<PortfolioRoute | null>(null);
  const [mobileOverlay, setMobileOverlay] = useState<"projects" | "chapters" | null>(null);
  const [expandedMenuProject, setExpandedMenuProject] = useState(initialRoute.destination);
  const [visualDiagnostics, setVisualDiagnostics] = useState<VisualDiagnostics | null>(null);
  const [portalTarget] = useState<HTMLElement | null>(() => (
    typeof document === "undefined"
      ? null
      : document.querySelector<HTMLElement>("[data-site-root]") ?? document.body
  ));

  useEffect(() => {
    if (!mobileOverlay) return;
    const dialog = mobileDialogRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusableSelector = "button:not([disabled]), a[href]";
    const focusDialog = window.requestAnimationFrame(() => {
      dialog?.querySelector<HTMLElement>(focusableSelector)?.focus();
    });
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOverlay(null);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDialogKeys);
    return () => {
      window.cancelAnimationFrame(focusDialog);
      window.removeEventListener("keydown", handleDialogKeys);
      previouslyFocused?.focus();
    };
  }, [mobileOverlay]);

  useEffect(() => {
    if (
      !expandedMedia
      && !expandedCruxMedia
      && !inheritanceImageExpanded
    ) return;

    const dialog = lightboxCloseRef.current?.closest<HTMLElement>("[role='dialog']") ?? null;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusDialog = window.requestAnimationFrame(() => {
      lightboxCloseRef.current?.focus();
    });
    const closeLightbox = () => {
      setExpandedMedia(null);
      setExpandedCruxMedia(null);
      setInheritanceImageExpanded(false);
    };
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])",
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleDialogKeys);
    return () => {
      window.cancelAnimationFrame(focusDialog);
      window.removeEventListener("keydown", handleDialogKeys);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [expandedCruxMedia, expandedMedia, inheritanceImageExpanded]);

  const requestRoute = (route: PortfolioRoute, push = true) => {
    setExpandedMedia(null);
    setExpandedCruxMedia(null);
    setInheritanceImageExpanded(false);
    if (visualFallbackRef.current) {
      window.location.assign(getPortfolioUrlWithVisualSettings(route));
      return;
    }
    setPendingMediaRoute(route);
    syncBrowserRoute(route, push);
    navigationCommandRef.current = { type: "route", route };
  };

  const setDiagnosticVisualMode = (mode: VisualQualityTier | "auto" | "fallback") => {
    if (mode === "fallback" || visualFallbackRef.current) {
      const url = new URL(window.location.href);
      url.searchParams.set("visual-debug", "1");
      if (mode === "fallback") {
        url.searchParams.set("visual-fallback", "1");
        url.searchParams.delete("visual-quality");
      } else {
        url.searchParams.delete("visual-fallback");
        if (mode === "auto") url.searchParams.delete("visual-quality");
        else url.searchParams.set("visual-quality", mode);
      }
      window.location.replace(url);
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("visual-debug", "1");
    url.searchParams.delete("visual-fallback");
    if (mode === "auto") url.searchParams.delete("visual-quality");
    else url.searchParams.set("visual-quality", mode);
    window.history.replaceState(window.history.state, "", url);
    qualityCommandRef.current = mode;
  };

  const navigateToDestination = (index: number) => {
    requestRoute({ destination: index, chapter: 0 });
  };

  const navigateToChapter = (index: number) => {
    requestRoute({ destination: activeDestinationRef.current, chapter: index });
  };

  const stepRoute = (direction: -1 | 1) => {
    const target = getAdjacentPortfolioRoute({
      destination: activeDestinationRef.current,
      chapter: activeChapterRef.current,
    }, direction);
    if (target) requestRoute(target);
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = parsePortfolioPathname(window.location.pathname);
      if (!route) return;
      setMobileOverlay(null);
      setExpandedMenuProject(route.destination);
      requestRoute(route, false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  });

  useEffect(() => {
    const destination = destinations[activeRoute.destination];
    const title = getPortfolioTitle(activeRoute);
    const url = `${window.location.origin}${getPortfolioPath(activeRoute)}`;
    document.title = title;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", destination.description);
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.setAttribute("href", url);
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')
      ?.setAttribute("content", title);
    document.querySelector<HTMLMetaElement>('meta[property="og:description"]')
      ?.setAttribute("content", destination.description);
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
      ?.setAttribute("content", url);
    document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')
      ?.setAttribute("content", title);
    document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')
      ?.setAttribute("content", destination.description);
  }, [activeRoute]);

  const handleMobileSwipeStart = (event: TouchEvent<HTMLElement>) => {
    mobileSwipeStartRef.current = null;
    if (
      window.matchMedia("(min-width: 861px)").matches
      || mobileOverlay
      || expandedMedia
      || expandedCruxMedia
      || inheritanceImageExpanded
      || event.touches.length !== 1
    ) return;

    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("button, a, input, textarea, select, video, [role='dialog'], [role='slider']")) return;

    const touch = event.touches[0];
    mobileSwipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      startedAt: event.timeStamp,
    };
  };

  const handleMobileSwipeEnd = (event: TouchEvent<HTMLElement>) => {
    const start = mobileSwipeStartRef.current;
    mobileSwipeStartRef.current = null;
    if (!start || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const horizontalDistance = Math.abs(deltaX);
    if (
      event.timeStamp - start.startedAt > MOBILE_SWIPE_MAX_DURATION
      || horizontalDistance < MOBILE_SWIPE_DISTANCE
      || horizontalDistance < Math.abs(deltaY) * MOBILE_SWIPE_DIRECTION_RATIO
    ) return;

    stepRoute(deltaX < 0 ? 1 : -1);
  };

  const navigateToMobileRoute = (destination: number, chapter: number) => {
    setMobileOverlay(null);
    setExpandedMenuProject(destination);
    requestRoute({ destination, chapter });
  };

  const openVideoFullscreen = (video: HTMLVideoElement | null) => {
    if (!video) return;

    [
      cruxVideoRef.current,
      cruxMovementVideoRef.current,
      cruxComparisonVideoRef.current,
      inheritanceVideoRef.current,
      inheritanceWalkingVideoRef.current,
    ].forEach((candidate) => {
      if (candidate && candidate !== video) candidate.pause();
    });

    activateDeferredVideo(video);

    const nativeVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    const playFullscreenVideo = () => void video.play().catch(() => undefined);
    const resetInlineControls = () => {
      video.controls = false;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      video.removeEventListener("webkitendfullscreen", resetInlineControls);
    };
    const handleFullscreenChange = () => {
      if (document.fullscreenElement !== video) resetInlineControls();
    };
    const enterWebkitFullscreen = () => {
      if (typeof nativeVideo.webkitEnterFullscreen !== "function") return false;
      video.addEventListener("webkitendfullscreen", resetInlineControls, { once: true });
      nativeVideo.webkitEnterFullscreen();
      playFullscreenVideo();
      return true;
    };

    video.controls = true;
    if (!document.fullscreenEnabled && enterWebkitFullscreen()) return;

    if (typeof video.requestFullscreen === "function") {
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      void video.requestFullscreen()
        .then(playFullscreenVideo)
        .catch(() => {
          document.removeEventListener("fullscreenchange", handleFullscreenChange);
          if (!enterWebkitFullscreen()) resetInlineControls();
        });
      return;
    }

    if (!enterWebkitFullscreen()) resetInlineControls();
  };

  const copyEmailValue = async (emailElement: HTMLElement | null) => {
    const email = "luebbertevan@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
      setEmailCopyStatus("copied");
    } catch {
      if (!emailElement) return;
      const range = document.createRange();
      range.selectNodeContents(emailElement);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      setEmailCopyStatus("selected");
    }
    window.setTimeout(() => setEmailCopyStatus("idle"), 1800);
  };

  const copyEmail = () => copyEmailValue(emailRef.current);
  const copyOutlookEmail = () => copyEmailValue(outlookEmailRef.current);

  useEffect(() => {
    const initialRenderRoute = initialRouteRef.current;
    const shell = shellRef.current;
    const mount = mountRef.current;
    if (!mount || !shell) return;
    prefersReducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileViewportQuery = window.matchMedia("(max-width: 860px)");
    let isMobileViewport = mobileViewportQuery.matches;
    let destinationTravel = isMobileViewport ? MOBILE_DESTINATION_TRAVEL : DESTINATION_TRAVEL;
    let chapterTravel = isMobileViewport ? MOBILE_CHAPTER_TRAVEL : CHAPTER_TRAVEL;
    let destinationDuration = isMobileViewport ? MOBILE_DESTINATION_DURATION : DESTINATION_DURATION;
    let chapterDuration = isMobileViewport ? MOBILE_CHAPTER_DURATION : CHAPTER_DURATION;
    let homeOpeningDuration = isMobileViewport ? MOBILE_HOME_OPENING_DURATION : HOME_OPENING_DURATION;
    const siteRoot = shell.closest<HTMLElement>("[data-site-root]");
    const setAccentPalette = (palette: number[]) => {
      const value = palette.join(", ");
      shell.style.setProperty("--accent-rgb", value);
      siteRoot?.style.setProperty("--accent-rgb", value);
    };

    const searchParams = new URLSearchParams(window.location.search);
    const diagnosticsEnabled = searchParams.get("visual-debug") === "1";
    const forcedQualityParam = searchParams.get("visual-quality");
    const forcedQuality = isVisualQualityTier(forcedQualityParam) ? forcedQualityParam : null;
    const forceFallback = diagnosticsEnabled && searchParams.get("visual-fallback") === "1";
    const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
    let qualityMode: "auto" | "forced" = forcedQuality ? "forced" : "auto";
    let activeQualityTier = forcedQuality ?? estimateInitialVisualQuality({
      isMobile: isMobileViewport,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigatorWithMemory.deviceMemory,
    });
    let activeQualityProfile = visualQualityProfiles[activeQualityTier];
    let diagnosticFps: number | null = null;
    let diagnosticReason = forcedQuality ? "diagnostic override" : "initial capability estimate";

    const publishDiagnostics = (state: VisualDiagnostics["state"]) => {
      shell.dataset.visualState = state;
      shell.dataset.visualQuality = activeQualityTier;
      shell.dataset.visualQualityMode = qualityMode;
      if (!diagnosticsEnabled) return;
      setVisualDiagnostics({
        state,
        tier: activeQualityTier,
        mode: qualityMode,
        fps: diagnosticFps,
        reason: diagnosticReason,
      });
    };

    const revealRouteWithoutVisuals = (route: PortfolioRoute) => {
      shell.style.setProperty("--chrome-presence", "1");
      const panels = Array.from(shell.querySelectorAll<HTMLElement>("[data-destination-panel]"));
      panels.forEach((panel, destinationIndex) => {
        const panelActive = destinationIndex === route.destination;
        panel.style.setProperty("--entry-presence", panelActive ? "1" : "0");
        panel.style.setProperty("--entry-shift", "0px");
        panel.inert = !panelActive;
        panel.setAttribute("aria-hidden", panelActive ? "false" : "true");
        const chapters = Array.from(panel.querySelectorAll<HTMLElement>("[data-project-chapter]"));
        chapters.forEach((chapter, chapterIndex) => {
          const chapterActive = panelActive && chapterIndex === route.chapter;
          chapter.style.setProperty("--chapter-presence", chapterActive ? "1" : "0");
          chapter.style.setProperty("--chapter-shift", "0px");
          chapter.style.setProperty("--chapter-wipe", chapterActive ? "0%" : "100%");
          chapter.style.setProperty("--chapter-blur", "0px");
          chapter.inert = !chapterActive;
          chapter.setAttribute("aria-hidden", chapterActive ? "false" : "true");
        });
      });
    };

    const activateFallback = (reason: string) => {
      visualFallbackRef.current = true;
      diagnosticReason = reason;
      const fallbackRoute = {
        destination: activeDestinationRef.current,
        chapter: activeChapterRef.current,
      };
      setAccentPalette([...destinations[fallbackRoute.destination].cssColor]);
      revealRouteWithoutVisuals(fallbackRoute);
      publishDiagnostics("fallback");
    };

    publishDiagnostics("loading");
    if (forceFallback) {
      activateFallback("forced emergency fallback");
      return;
    }
    if (prefersReducedMotionRef.current) {
      activateFallback("reduced motion preference");
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      });
    } catch {
      activateFallback("WebGL renderer unavailable");
      return;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    mount.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
    camera.position.z = 2;
    const geometry = new THREE.PlaneGeometry(2, 2);

    const carbonUniforms = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uImpulse: { value: 0 },
      uCameraX: { value: 0 },
      uScrollVelocity: { value: 0 },
      uProjectPresence: { value: 1 },
      uMobileComposition: { value: isMobileViewport ? 1 : 0 },
      uPaletteColor: { value: new THREE.Vector3(...destinations[initialRenderRoute.destination].shaderColor) },
    };
    const carbonMaterial = new THREE.ShaderMaterial({
      uniforms: carbonUniforms,
      vertexShader: screenVertexShader,
      fragmentShader: carbonPassShader,
      depthTest: false,
      depthWrite: false,
    });
    const carbonScene = new THREE.Scene();
    const carbonQuad = new THREE.Mesh(geometry, carbonMaterial);
    carbonQuad.frustumCulled = false;
    carbonScene.add(carbonQuad);

    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    });

    const finalUniforms = {
      uSource: { value: renderTarget.texture },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uImpulse: { value: 0 },
      uFocalDepth: { value: 0.5 },
      uPostProcessingEnabled: { value: activeQualityProfile.postProcessingEnabled ? 1 : 0 },
    };
    const finalMaterial = new THREE.ShaderMaterial({
      uniforms: finalUniforms,
      vertexShader: screenVertexShader,
      fragmentShader: depthOfFieldShader,
      depthTest: false,
      depthWrite: false,
    });
    const finalScene = new THREE.Scene();
    const finalQuad = new THREE.Mesh(geometry, finalMaterial);
    finalQuad.frustumCulled = false;
    finalScene.add(finalQuad);
    const particleSimulationCapacity = diagnosticsEnabled
      ? visualQualityProfiles.full.particleSimulationSize
      : activeQualityProfile.particleSimulationSize;
    const emberLoom = createEmberLoom(
      renderer,
      renderTarget.texture,
      particleSimulationCapacity,
    );
    emberLoom?.setParticleCount(activeQualityProfile.particleSimulationSize ** 2);

    const panelBundles = Array.from(shell.querySelectorAll<HTMLElement>("[data-destination-panel]"))
      .sort((a, b) => Number(a.dataset.destinationPanel) - Number(b.dataset.destinationPanel))
      .map((panel) => ({
        panel,
        chapters: Array.from(panel.querySelectorAll<HTMLElement>("[data-project-chapter]")),
        chapterButtons: Array.from(panel.querySelectorAll<HTMLButtonElement>("[data-chapter-index]")),
      }));
    const destinationButtons = Array.from(shell.querySelectorAll<HTMLButtonElement>("[data-destination-nav]"));
    const previousButton = shell.querySelector<HTMLButtonElement>("[data-route-previous]");
    const nextButton = shell.querySelector<HTMLButtonElement>("[data-route-next]");

    const pointer = new THREE.Vector2(0, 0);
    const pointerTarget = new THREE.Vector2(0, 0);
    const strandAnchor = new THREE.Vector2(-0.28, 0);
    const strandTangent = new THREE.Vector2(1, 0);
    const panelBounds = new THREE.Vector4(0.05, 0.92, -0.72, 0.72);
    const framePalette = new THREE.Vector3();
    let impulse = 0;
    let elapsed = 0;
    let cameraX = initialRenderRoute.chapter * chapterTravel;
    let manualCameraTarget = cameraX;
    let cameraVelocity = 0;
    let currentDestination = initialRenderRoute.destination;
    let currentChapter = initialRenderRoute.chapter;
    let currentAnchorX = 0;
    let currentShaderPalette = new THREE.Vector3(...destinations[currentDestination].shaderColor);
    let currentCssPalette: number[] = [...destinations[currentDestination].cssColor];
    let transition: RouteTransition | null = null;
    let homeIntroElapsed = 0;
    let homeIntroActive = initialRenderRoute.destination === 0;
    let directEntryElapsed = 0;
    let directEntryActive = initialRenderRoute.destination > 0 && !prefersReducedMotionRef.current;
    let queuedRouteAfterDestination: PortfolioRoute | null = null;
    let previousTime: number | null = null;
    let lastRenderedFrameAt = 0;
    let animationFrame = 0;
    let contentMeasureFrame = 0;
    let performanceSamples: number[] = [];
    let consecutiveSlowWindows = 0;
    let qualityWarmupUntil = 0;
    let contextLost = false;
    let firstFrameRendered = false;
    let disposed = false;
    visualFallbackRef.current = false;
    if (!emberLoom) diagnosticReason = "particle simulation unavailable; strand preserved";
    setAccentPalette(currentCssPalette);

    const getProjectVideos = () => [
      cruxVideoRef.current,
      cruxMovementVideoRef.current,
      cruxComparisonVideoRef.current,
      inheritanceVideoRef.current,
      inheritanceWalkingVideoRef.current,
    ];

    const getActiveProjectVideo = (destinationIndex: number, chapterIndex: number) => {
      if (destinationIndex === 2) {
        if (chapterIndex === 0) return cruxVideoRef.current;
        if (chapterIndex === 1) return cruxMovementVideoRef.current;
        if (chapterIndex === 2) return cruxComparisonVideoRef.current;
      }
      if (destinationIndex === 4) {
        if (chapterIndex === 0) return inheritanceVideoRef.current;
        if (chapterIndex === 2) return inheritanceWalkingVideoRef.current;
      }
      return null;
    };

    const syncActiveProjectVideo = (destinationIndex: number, chapterIndex: number) => {
      const activeVideo = getActiveProjectVideo(destinationIndex, chapterIndex);
      getProjectVideos().forEach((video) => {
        if (!video) return;
        if (video === activeVideo) video.pause();
        else deactivateDeferredVideo(video);
      });
      if (
        !activeVideo
        || prefersReducedMotionRef.current
        || activeQualityTier === "reduced"
      ) {
        if (activeVideo) deactivateDeferredVideo(activeVideo);
        return;
      }

      activateDeferredVideo(activeVideo);
      activeVideo.muted = true;
      void activeVideo.play().catch(() => undefined);
    };

    const updatePanelBounds = (destinationIndex = currentDestination) => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      const panel = panelBundles[destinationIndex]?.panel ?? panelBundles[0]?.panel;
      if (!panel) return;

      const shellRect = shell.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const renderedEntryShift = Number.parseFloat(
        getComputedStyle(panel).getPropertyValue("--entry-shift"),
      ) || 0;
      const correctedLeft = panelRect.left - (isMobileViewport ? 0 : renderedEntryShift);
      const correctedRight = panelRect.right - (isMobileViewport ? 0 : renderedEntryShift);
      const correctedTop = panelRect.top - (isMobileViewport ? renderedEntryShift : 0);
      const correctedBottom = panelRect.bottom - (isMobileViewport ? renderedEntryShift : 0);
      const left = ((correctedLeft - shellRect.left) / width) * 2 - 1;
      const right = ((correctedRight - shellRect.left) / width) * 2 - 1;
      const top = 1 - ((correctedTop - shellRect.top) / height) * 2;
      const bottom = 1 - ((correctedBottom - shellRect.top) / height) * 2;
      const horizontalParticleGap = 8 / width;
      const verticalParticleGap = 8 / height;
      panelBounds.set(
        left - horizontalParticleGap,
        right + horizontalParticleGap,
        bottom - verticalParticleGap,
        top + verticalParticleGap,
      );
    };

    const getPanelScale = (panel: HTMLElement) => (
      Number.parseFloat(getComputedStyle(panel).getPropertyValue("--content-panel-scale")) || 1
    );

    const getMeasurableChildren = (element: HTMLElement): HTMLElement[] => (
      Array.from(element.children).flatMap((child) => {
        if (!(child instanceof HTMLElement)) return [];
        return getComputedStyle(child).display === "contents"
          ? getMeasurableChildren(child)
          : [child];
      })
    );

    const getChapterContentHeight = (chapter: HTMLElement) => {
      const chapterStyle = getComputedStyle(chapter);
      const paddingBottom = Number.parseFloat(chapterStyle.paddingBottom) || 0;
      const contentBottom = getMeasurableChildren(chapter).reduce((maximumBottom, child) => {
        const childStyle = getComputedStyle(child);
        const marginBottom = Number.parseFloat(childStyle.marginBottom) || 0;
        return Math.max(maximumBottom, child.offsetTop + child.offsetHeight + marginBottom);
      }, Number.parseFloat(chapterStyle.paddingTop) || 0);
      return Math.ceil(contentBottom + paddingBottom);
    };

    const getTargetPanelHeight = (destinationIndex: number, chapterIndex: number) => {
      const bundle = panelBundles[destinationIndex];
      const chapter = bundle?.chapters[chapterIndex];
      if (!bundle || !chapter) return 0;

      const viewportHeight = Math.max(1, mount.clientHeight);
      const panelScale = getPanelScale(bundle.panel);
      const minimumPanelMargin = Math.max(24, Math.min(56, viewportHeight * 0.05));
      const maximumPanelHeight = Math.max(300, (viewportHeight - minimumPanelMargin * 2) / panelScale);
      const chapterRailHeight = destinationIndex === 0
        ? 0
        : Number.parseFloat(getComputedStyle(shell).getPropertyValue("--chapter-rail-height")) || 0;
      const contentBreathingRoom = destinationIndex === 0
        ? 0
        : Math.max(16, Math.min(28, viewportHeight * 0.025));
      const minimumPanelHeight = Math.min(
        maximumPanelHeight,
        destinationIndex === 0 ? 360 : chapterRailHeight + 360,
      );
      const measuredPanelHeight = getChapterContentHeight(chapter) + chapterRailHeight + contentBreathingRoom;
      return THREE.MathUtils.clamp(measuredPanelHeight, minimumPanelHeight, maximumPanelHeight);
    };

    const applyPanelHeight = (destinationIndex: number, panelHeight: number) => {
      const panel = panelBundles[destinationIndex]?.panel;
      if (!panel || isMobileViewport || panelHeight <= 0) return;
      const renderedPanelHeight = panelHeight * getPanelScale(panel);
      const panelTop = (Math.max(1, mount.clientHeight) - renderedPanelHeight) / 2;
      panel.style.setProperty("--dynamic-panel-height", `${panelHeight.toFixed(1)}px`);
      panel.style.setProperty("--dynamic-panel-top", `${panelTop.toFixed(1)}px`);
    };

    const syncPanelHeight = (destinationIndex: number, chapterIndex: number) => {
      applyPanelHeight(destinationIndex, getTargetPanelHeight(destinationIndex, chapterIndex));
    };

    const syncAllPanelHeights = () => {
      if (isMobileViewport) {
        panelBundles.forEach(({ panel }) => {
          panel.style.removeProperty("--dynamic-panel-height");
          panel.style.removeProperty("--dynamic-panel-top");
        });
        return;
      }
      panelBundles.forEach((_, destinationIndex) => {
        const chapterIndex = destinationIndex === currentDestination ? currentChapter : 0;
        syncPanelHeight(destinationIndex, chapterIndex);
      });
    };

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      const dprCap = isMobileViewport
        ? activeQualityProfile.mobilePixelRatioCap
        : activeQualityProfile.desktopPixelRatioCap;
      const dpr = Math.min(window.devicePixelRatio, dprCap);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);

      const pixelWidth = Math.max(1, Math.floor(width * dpr));
      const pixelHeight = Math.max(1, Math.floor(height * dpr));
      const studyScale = isMobileViewport
        ? activeQualityProfile.mobileStudyScale
        : activeQualityProfile.desktopStudyScale(width);
      const targetWidth = Math.max(1, Math.floor(pixelWidth * studyScale));
      const targetHeight = Math.max(1, Math.floor(pixelHeight * studyScale));
      renderTarget.setSize(targetWidth, targetHeight);
      carbonUniforms.uResolution.value.set(targetWidth, targetHeight);
      finalUniforms.uResolution.value.set(pixelWidth, pixelHeight);
      emberLoom?.resize(pixelWidth, pixelHeight);

      const aboutPanel = shell.querySelector<HTMLElement>('[data-destination-panel="0"]');
      const fostyPanel = shell.querySelector<HTMLElement>('[data-destination-panel="1"]');
      const cruxPanel = shell.querySelector<HTMLElement>('[data-destination-panel="2"]');
      const valPanel = shell.querySelector<HTMLElement>('[data-destination-panel="3"]');
      const inheritancePanel = shell.querySelector<HTMLElement>('[data-destination-panel="4"]');
      const referencePanels = [fostyPanel, cruxPanel, inheritancePanel, valPanel].filter(
        (panel): panel is HTMLElement => Boolean(panel),
      );
      const contentPanelScale = Number.parseFloat(
        getComputedStyle(fostyPanel ?? cruxPanel ?? inheritancePanel ?? valPanel ?? aboutPanel ?? shell).getPropertyValue("--content-panel-scale"),
      ) || 1;
      const shouldScaleAboutPanel = window.matchMedia(
        "(min-width: 2048px) and (min-height: 1152px)",
      ).matches;
      const aboutScale = shouldScaleAboutPanel && aboutPanel && fostyPanel
        ? fostyPanel.offsetWidth / Math.max(aboutPanel.offsetWidth, 1)
        : 1;
      aboutPanel?.style.setProperty(
        "--content-panel-scale",
        (contentPanelScale * aboutScale).toFixed(4),
      );
      const aboutReferenceLabel = aboutPanel?.querySelector<HTMLElement>("[data-about-reference-label]");
      const aboutReferenceTitle = aboutPanel?.querySelector<HTMLElement>("[data-about-reference-title]");
      const aboutReferenceLink = aboutPanel?.querySelector<HTMLElement>("[data-about-reference-link]");
      if (referencePanels.length > 0 && aboutReferenceLabel && aboutReferenceTitle && aboutReferenceLink) {
        const labelSize = Number.parseFloat(getComputedStyle(aboutReferenceLabel).fontSize) * aboutScale;
        const titleSize = Number.parseFloat(getComputedStyle(aboutReferenceTitle).fontSize) * aboutScale;
        const linkSize = Number.parseFloat(getComputedStyle(aboutReferenceLink).fontSize) * aboutScale;
        referencePanels.forEach((panel) => {
          panel.style.setProperty("--about-reference-label-size", `${labelSize.toFixed(2)}px`);
          panel.style.setProperty("--about-reference-title-size", `${titleSize.toFixed(2)}px`);
          panel.style.setProperty("--about-reference-link-size", `${linkSize.toFixed(2)}px`);
        });
      }
      syncAllPanelHeights();

      strandAnchor.set(isMobileViewport ? 0 : -0.54 * height / width, 0);
      updatePanelBounds();
    };

    const applyQualityTier = (tier: VisualQualityTier, reason: string) => {
      diagnosticReason = reason;
      if (tier !== activeQualityTier) {
        const nextProfile = visualQualityProfiles[tier];
        emberLoom?.setParticleCount(nextProfile.particleSimulationSize ** 2);
        activeQualityTier = tier;
        activeQualityProfile = nextProfile;
        finalUniforms.uPostProcessingEnabled.value = nextProfile.postProcessingEnabled ? 1 : 0;
        if (tier === "reduced") {
          cruxVideoRef.current?.pause();
          cruxMovementVideoRef.current?.pause();
          cruxComparisonVideoRef.current?.pause();
          inheritanceVideoRef.current?.pause();
          inheritanceWalkingVideoRef.current?.pause();
        }
        performanceSamples = [];
        consecutiveSlowWindows = 0;
        qualityWarmupUntil = performance.now() + 4000;
        resize();
        syncActiveProjectVideo(currentDestination, currentChapter);
      }
      publishDiagnostics(firstFrameRendered ? "ready" : "loading");
    };

    const handleMobileViewportChange = (event: MediaQueryListEvent) => {
      isMobileViewport = event.matches;
      destinationTravel = isMobileViewport ? MOBILE_DESTINATION_TRAVEL : DESTINATION_TRAVEL;
      chapterTravel = isMobileViewport ? MOBILE_CHAPTER_TRAVEL : CHAPTER_TRAVEL;
      destinationDuration = isMobileViewport ? MOBILE_DESTINATION_DURATION : DESTINATION_DURATION;
      chapterDuration = isMobileViewport ? MOBILE_CHAPTER_DURATION : CHAPTER_DURATION;
      homeOpeningDuration = isMobileViewport ? MOBILE_HOME_OPENING_DURATION : HOME_OPENING_DURATION;
      carbonUniforms.uMobileComposition.value = isMobileViewport ? 1 : 0;
      siteRoot?.toggleAttribute("data-live-mobile-transition", isMobileViewport);
      const estimatedTier = estimateInitialVisualQuality({
        isMobile: isMobileViewport,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigatorWithMemory.deviceMemory,
      });
      if (
        qualityMode === "auto"
        && visualQualityTiers.indexOf(estimatedTier) > visualQualityTiers.indexOf(activeQualityTier)
      ) {
        applyQualityTier(estimatedTier, "viewport capability estimate");
      } else {
        resize();
      }
    };

    const move = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointerTarget.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
    };

    const excite = () => {
      impulse = 1;
    };

    const keydown = (event: KeyboardEvent) => {
      if (homeIntroActive || directEntryActive) return;
      if (transition || navigationCommandRef.current) return;
      const eventTarget = event.target instanceof Element ? event.target : null;
      if (
        eventTarget
        && eventTarget !== document.body
        && eventTarget !== document.documentElement
        && eventTarget !== shell
      ) return;
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "PageDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp"
          ? -1
          : 0;
      if (!direction) return;
      event.preventDefault();
      setExpandedMedia(null);
      setExpandedCruxMedia(null);
      const target = getAdjacentPortfolioRoute({
        destination: currentDestination,
        chapter: currentChapter,
      }, direction as -1 | 1);
      if (target) {
        if (visualFallbackRef.current) {
          window.location.assign(getPortfolioUrlWithVisualSettings(target));
          return;
        }
        syncBrowserRoute(target, true);
        navigationCommandRef.current = { type: "route", route: target };
      }
      impulse = Math.min(1, impulse + 0.16);
    };

    const beginDestination = (
      index: number,
      arrival?: { toX: number; duration: number; manualArrival: boolean },
    ) => {
      const targetDestination = THREE.MathUtils.clamp(index, 0, destinations.length - 1);
      panelBundles[targetDestination]?.chapters[0]?.scrollTo({ top: 0 });
      if (!isMobileViewport) syncPanelHeight(targetDestination, 0);
      if (targetDestination === currentDestination) {
        beginChapter(0);
        return;
      }
      const direction = targetDestination > currentDestination ? 1 : -1;
      manualCameraTarget = cameraX;
      transition = {
        kind: "destination",
        elapsed: 0,
        duration: arrival?.duration ?? destinationDuration,
        fromX: cameraX,
        toX: arrival?.toX ?? cameraX + direction * destinationTravel,
        sourceDestination: currentDestination,
        targetDestination,
        sourceChapter: currentChapter,
        targetChapter: 0,
        shaderFrom: currentShaderPalette.clone(),
        shaderTo: new THREE.Vector3(...destinations[targetDestination].shaderColor),
        cssFrom: [...currentCssPalette],
        cssTo: [...destinations[targetDestination].cssColor],
        manualArrival: arrival?.manualArrival ?? false,
      };
    };

    const beginChapter = (
      index: number,
      arrival?: { toX: number; duration: number; manualArrival: boolean },
    ) => {
      const targetChapter = THREE.MathUtils.clamp(index, 0, destinations[currentDestination].chapters - 1);
      panelBundles[currentDestination]?.chapters[targetChapter]?.scrollTo({ top: 0 });
      if (targetChapter === currentChapter) return;
      const panelHeightFrom = isMobileViewport
        ? undefined
        : getTargetPanelHeight(currentDestination, currentChapter);
      const panelHeightTo = isMobileViewport
        ? undefined
        : getTargetPanelHeight(currentDestination, targetChapter);
      manualCameraTarget = cameraX;
      transition = {
        kind: "chapter",
        elapsed: 0,
        duration: arrival?.duration ?? chapterDuration,
        fromX: cameraX,
        toX: arrival?.toX ?? currentAnchorX + targetChapter * chapterTravel,
        sourceDestination: currentDestination,
        targetDestination: currentDestination,
        sourceChapter: currentChapter,
        targetChapter,
        shaderFrom: currentShaderPalette.clone(),
        shaderTo: currentShaderPalette.clone(),
        cssFrom: [...currentCssPalette],
        cssTo: [...currentCssPalette],
        manualArrival: arrival?.manualArrival ?? false,
        panelHeightFrom,
        panelHeightTo,
      };
    };

    const getManualRoute = (direction: -1 | 1): ManualRoute | null => {
      const chapterCount = destinations[currentDestination].chapters;
      const currentStopX = currentAnchorX + currentChapter * chapterTravel;
      if (direction > 0) {
        if (currentChapter < chapterCount - 1) {
          return {
            kind: "chapter",
            direction,
            targetX: currentAnchorX + (currentChapter + 1) * chapterTravel,
            distance: chapterTravel,
            targetDestination: currentDestination,
            targetChapter: currentChapter + 1,
          };
        }
        if (currentDestination < destinations.length - 1) {
          return {
            kind: "destination",
            direction,
            targetX: currentStopX + destinationTravel,
            distance: destinationTravel,
            targetDestination: currentDestination + 1,
            targetChapter: 0,
          };
        }
      } else {
        if (currentChapter > 0) {
          return {
            kind: "chapter",
            direction,
            targetX: currentAnchorX + (currentChapter - 1) * chapterTravel,
            distance: chapterTravel,
            targetDestination: currentDestination,
            targetChapter: currentChapter - 1,
          };
        }
        if (currentDestination > 0) {
          return {
            kind: "destination",
            direction,
            targetX: currentStopX - destinationTravel,
            distance: destinationTravel,
            targetDestination: currentDestination - 1,
            targetChapter: 0,
          };
        }
      }
      return null;
    };

    const beginManualArrival = (route: ManualRoute) => {
      const remaining = Math.abs(route.targetX - cameraX);
      syncBrowserRoute({
        destination: route.targetDestination,
        chapter: route.targetChapter,
      }, true);
      if (route.kind === "destination") {
        beginDestination(route.targetDestination, {
          toX: route.targetX,
          duration: Math.max(isMobileViewport ? 1.2 : 1.45, destinationDuration * remaining / destinationTravel),
          manualArrival: true,
        });
      } else {
        beginChapter(route.targetChapter, {
          toX: route.targetX,
          duration: Math.max(isMobileViewport ? 0.75 : 0.85, chapterDuration * remaining / chapterTravel),
          manualArrival: true,
        });
      }
    };

    const animate = (now: number) => {
      if (disposed || contextLost || document.hidden) return;
      if (qualityWarmupUntil === 0) qualityWarmupUntil = now + 6000;

      const qualityCommand = qualityCommandRef.current;
      if (qualityCommand) {
        qualityCommandRef.current = null;
        if (qualityCommand === "auto") {
          qualityMode = "auto";
          const estimatedTier = estimateInitialVisualQuality({
            isMobile: isMobileViewport,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigatorWithMemory.deviceMemory,
          });
          applyQualityTier(estimatedTier, "diagnostic return to auto");
        } else {
          qualityMode = "forced";
          applyQualityTier(qualityCommand, "diagnostic override");
        }
      }

      if (
        activeQualityProfile.minimumFrameInterval > 0
        && lastRenderedFrameAt > 0
        && now - lastRenderedFrameAt < activeQualityProfile.minimumFrameInterval - 1
      ) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const rawFrameInterval = previousTime === null ? 0 : now - previousTime;
      const delta = previousTime === null ? 0 : Math.min(0.04, rawFrameInterval / 1000);
      previousTime = now;
      lastRenderedFrameAt = now;
      elapsed += delta;
      if (homeIntroActive) {
        homeIntroElapsed = Math.min(homeOpeningDuration, homeIntroElapsed + delta);
        if (homeIntroElapsed >= homeOpeningDuration) homeIntroActive = false;
      }
      if (directEntryActive) {
        directEntryElapsed = Math.min(DIRECT_ENTRY_DURATION, directEntryElapsed + delta);
        if (directEntryElapsed >= DIRECT_ENTRY_DURATION) directEntryActive = false;
      }
      const homeOpeningT = THREE.MathUtils.clamp(homeIntroElapsed / homeOpeningDuration, 0, 1);
      const directEntryT = THREE.MathUtils.clamp(directEntryElapsed / DIRECT_ENTRY_DURATION, 0, 1);
      const pageContentPresence = THREE.MathUtils.smoothstep(
        homeOpeningT,
        PANEL_ARRIVAL_START,
        PANEL_ARRIVAL_END,
      );
      const chromePresence = homeIntroActive ? pageContentPresence : 1;
      shell.style.setProperty("--chrome-presence", chromePresence.toFixed(3));
      pointer.lerp(pointerTarget, 1.0 - Math.exp(-delta * 5.0));
      impulse *= Math.exp(-delta * 2.3);

      if (!transition && !homeIntroActive && !directEntryActive && navigationCommandRef.current) {
        const command = navigationCommandRef.current;
        navigationCommandRef.current = null;
        queuedRouteAfterDestination = null;
        if (command.route.destination === currentDestination) {
          beginChapter(command.route.chapter);
        } else {
          if (command.route.chapter > 0) queuedRouteAfterDestination = command.route;
          beginDestination(command.route.destination);
        }
      } else if (
        !transition
        && queuedRouteAfterDestination
        && queuedRouteAfterDestination.destination === currentDestination
      ) {
        const queuedRoute = queuedRouteAfterDestination;
        queuedRouteAfterDestination = null;
        beginChapter(queuedRoute.chapter);
      }

      const previousCameraX = cameraX;
      let manualRoute: ManualRoute | null = null;
      let manualRouteProgress = 0;
      if (!transition) {
        const currentStopX = currentAnchorX + currentChapter * chapterTravel;
        const targetOffset = manualCameraTarget - currentStopX;
        const manualDirection: -1 | 1 = targetOffset >= 0 ? 1 : -1;
        manualRoute = getManualRoute(manualDirection);
        if (manualRoute) {
          manualCameraTarget = manualDirection > 0
            ? Math.min(manualCameraTarget, manualRoute.targetX)
            : Math.max(manualCameraTarget, manualRoute.targetX);
        } else if (Math.abs(targetOffset) > MANUAL_EDGE_DISTANCE) {
          manualCameraTarget = currentStopX + manualDirection * MANUAL_EDGE_DISTANCE;
        }
        cameraX = THREE.MathUtils.lerp(
          cameraX,
          manualCameraTarget,
          1 - Math.exp(-delta * 5.2),
        );
        if (manualRoute) {
          manualRouteProgress = THREE.MathUtils.clamp(
            Math.abs(cameraX - currentStopX) / manualRoute.distance,
            0,
            1,
          );
        }
        if (manualRoute && manualRouteProgress >= MANUAL_ARRIVAL_PROGRESS) {
          manualCameraTarget = cameraX;
          beginManualArrival(manualRoute);
        }
      }
      let transitionT = 0;
      let particleTransitionActive = 0;
      let particleTransitionProgress = 0;
      let particleTravelDirection = 1;
      let particleStructurePresence = 1;
      let particleStructureDisturbance = 0;
      if (homeIntroActive) {
        particleTransitionActive = 1;
        particleTransitionProgress = homeOpeningT;
        particleStructurePresence = THREE.MathUtils.smoothstep(
          homeOpeningT,
          PARTICLE_ARRIVAL_START,
          PARTICLE_ARRIVAL_END,
        );
        particleStructureDisturbance = Math.sin(Math.PI * THREE.MathUtils.smoothstep(
          homeOpeningT,
          PARTICLE_DISTURBANCE_START,
          PARTICLE_DISTURBANCE_END,
        ));
      } else if (directEntryActive) {
        particleTransitionActive = 1;
        particleTransitionProgress = directEntryT;
        particleStructurePresence = THREE.MathUtils.smoothstep(directEntryT, 0.08, 0.72);
        particleStructureDisturbance = 1 - THREE.MathUtils.smoothstep(directEntryT, 0.12, 0.92);
      }
      if (transition) {
        particleTransitionActive = transition.kind === "destination" ? 1 : 0;
        transition.elapsed = Math.min(transition.duration, transition.elapsed + delta);
        transitionT = transition.elapsed / transition.duration;
        if (
          transition.kind === "chapter"
          && !isMobileViewport
          && transition.panelHeightFrom !== undefined
          && transition.panelHeightTo !== undefined
        ) {
          const grows = transition.panelHeightTo >= transition.panelHeightFrom;
          const panelHeightProgress = grows
            ? THREE.MathUtils.smoothstep(transitionT, 0.04, 0.62)
            : THREE.MathUtils.smoothstep(transitionT, 0.34, 0.92);
          applyPanelHeight(
            transition.sourceDestination,
            THREE.MathUtils.lerp(
              transition.panelHeightFrom,
              transition.panelHeightTo,
              panelHeightProgress,
            ),
          );
          updatePanelBounds();
        }
        particleTransitionProgress = transitionT;
        particleTravelDirection = Math.sign(transition.toX - transition.fromX) || 1;
        if (transition.kind === "destination") {
          const departureStructure = 1 - THREE.MathUtils.smoothstep(transitionT, 0.12, 0.32);
          const arrivalStructure = THREE.MathUtils.smoothstep(
            transitionT,
            PARTICLE_ARRIVAL_START,
            PARTICLE_ARRIVAL_END,
          );
          particleStructurePresence = transition.manualArrival
            ? arrivalStructure
            : Math.max(departureStructure, arrivalStructure);
          particleStructureDisturbance = transition.manualArrival
            ? 1 - THREE.MathUtils.smoothstep(transitionT, 0.18, 0.88)
            : Math.sin(Math.PI * THREE.MathUtils.smoothstep(
              transitionT,
              PARTICLE_DISTURBANCE_START,
              PARTICLE_DISTURBANCE_END,
            ));
        } else {
          particleStructureDisturbance = transition.manualArrival
            ? 1 - THREE.MathUtils.smoothstep(transitionT, 0.16, 0.92)
            : Math.sin(Math.PI * THREE.MathUtils.smoothstep(transitionT, 0.04, 0.96));
        }
        const easedTravel = transitionT < 0.5
          ? 4 * transitionT * transitionT * transitionT
          : 1 - Math.pow(-2 * transitionT + 2, 3) / 2;
        cameraX = THREE.MathUtils.lerp(transition.fromX, transition.toX, easedTravel);
        const paletteT = THREE.MathUtils.smoothstep(transitionT, 0.08, 0.92);
        framePalette.lerpVectors(transition.shaderFrom, transition.shaderTo, paletteT);
        carbonUniforms.uPaletteColor.value.copy(framePalette);

        const cssPalette = transition.cssFrom.map((channel, index) => (
          Math.round(THREE.MathUtils.lerp(channel, transition!.cssTo[index], paletteT))
        ));
        setAccentPalette(cssPalette);

        if (transitionT >= 1) {
          currentDestination = transition.targetDestination;
          currentChapter = transition.targetChapter;
          if (transition.kind === "destination") currentAnchorX = transition.toX;
          currentShaderPalette = transition.shaderTo.clone();
          currentCssPalette = [...transition.cssTo];
          carbonUniforms.uPaletteColor.value.copy(currentShaderPalette);
          setAccentPalette(currentCssPalette);
          manualCameraTarget = cameraX;
          updatePanelBounds(currentDestination);
          transition = null;
          transitionT = 0;
        }
      } else if (!homeIntroActive && manualRoute?.kind === "destination" && manualRouteProgress > 0) {
        particleStructurePresence = 1 - THREE.MathUtils.smoothstep(manualRouteProgress, 0.22, 0.48);
        particleStructureDisturbance = THREE.MathUtils.smoothstep(manualRouteProgress, 0.10, 0.36);
      } else if (!homeIntroActive && manualRoute?.kind === "chapter" && manualRouteProgress > 0) {
        particleStructureDisturbance = THREE.MathUtils.smoothstep(manualRouteProgress, 0.05, 0.34);
      } else {
        carbonUniforms.uPaletteColor.value.copy(currentShaderPalette);
        setAccentPalette(currentCssPalette);
      }

      const instantaneousVelocity = delta > 0 ? (cameraX - previousCameraX) / delta : 0;
      cameraVelocity = THREE.MathUtils.lerp(cameraVelocity, instantaneousVelocity, 0.16);
      carbonUniforms.uTime.value = elapsed;
      carbonUniforms.uPointer.value.copy(pointer);
      carbonUniforms.uImpulse.value = impulse;
      carbonUniforms.uCameraX.value = cameraX;
      carbonUniforms.uScrollVelocity.value = cameraVelocity;
      carbonUniforms.uProjectPresence.value = 1;
      finalUniforms.uTime.value = elapsed;
      finalUniforms.uPointer.value.copy(pointer);
      finalUniforms.uImpulse.value = impulse;
      finalUniforms.uFocalDepth.value = THREE.MathUtils.clamp(
        1 - 0.09 * getSignalCameraDistance(cameraX, 1),
        0,
        1,
      );

      const activeDestinationForUi = transition?.kind === "destination" && transitionT > 0.5
        ? transition.targetDestination
        : currentDestination;
      const activeChapterForUi = transition?.kind === "chapter" && transitionT > 0.5
        ? transition.targetChapter
        : transition?.kind === "destination" && transitionT > 0.5
          ? 0
          : currentChapter;

      if (
        activeDestinationRef.current !== activeDestinationForUi
        || activeChapterRef.current !== activeChapterForUi
      ) {
        activeDestinationRef.current = activeDestinationForUi;
        activeChapterRef.current = activeChapterForUi;
        setActiveRoute({ destination: activeDestinationForUi, chapter: activeChapterForUi });
        setPendingMediaRoute(null);
        updatePanelBounds(activeDestinationForUi);
        syncActiveProjectVideo(activeDestinationForUi, activeChapterForUi);
      }

      panelBundles.forEach((bundle, destinationIndex) => {
        let panelOpacity = destinationIndex === currentDestination ? 1 : 0;
        const chapterOpacities: number[] = bundle.chapters.map((_, chapterIndex) => (
          destinationIndex === currentDestination && chapterIndex === currentChapter ? 1 : 0
        ));
        const chapterShifts = bundle.chapters.map(() => 0);

        if (homeIntroActive && destinationIndex === 0 && !transition) {
          const homeReveal = pageContentPresence;
          panelOpacity = homeReveal;
          chapterOpacities.fill(0);
          chapterOpacities[0] = homeReveal;
          chapterShifts[0] = 18 * (1 - homeOpeningT);
        }

        if (directEntryActive && destinationIndex === currentDestination && !transition) {
          const directPanelPresence = THREE.MathUtils.smoothstep(directEntryT, 0.34, 0.96);
          panelOpacity = directPanelPresence;
          chapterOpacities.fill(0);
          chapterOpacities[currentChapter] = directPanelPresence;
          chapterShifts[currentChapter] = 18 * (1 - directEntryT);
        }

        if (transition?.kind === "destination") {
          panelOpacity = 0;
          if (destinationIndex === transition.sourceDestination) {
            panelOpacity = transition.manualArrival
              ? 0
              : 1 - THREE.MathUtils.smoothstep(transitionT, 0.02, 0.12);
            chapterOpacities.fill(0);
            chapterOpacities[transition.sourceChapter] = panelOpacity;
            chapterShifts[transition.sourceChapter] = -18 * transitionT;
          }
          if (destinationIndex === transition.targetDestination) {
            panelOpacity = THREE.MathUtils.smoothstep(
              transitionT,
              PANEL_ARRIVAL_START,
              PANEL_ARRIVAL_END,
            );
            chapterOpacities.fill(0);
            chapterOpacities[0] = panelOpacity;
            chapterShifts[0] = 18 * (1 - transitionT);
          }
        } else if (transition?.kind === "chapter" && destinationIndex === currentDestination) {
          panelOpacity = 1;
          chapterOpacities.fill(0);
          const chapterCrossfade = THREE.MathUtils.smoothstep(transitionT, 0.12, 0.88);
          chapterOpacities[transition.sourceChapter] = 1 - chapterCrossfade;
          chapterOpacities[transition.targetChapter] = chapterCrossfade;
          chapterShifts[transition.sourceChapter] = -12 * chapterCrossfade;
          chapterShifts[transition.targetChapter] = 12 * (1 - chapterCrossfade);
        } else if (manualRoute && manualRouteProgress > 0 && destinationIndex === currentDestination) {
          if (manualRoute.kind === "destination") {
            panelOpacity = 1 - THREE.MathUtils.smoothstep(manualRouteProgress, 0.08, 0.22);
            chapterOpacities.fill(0);
            chapterOpacities[currentChapter] = panelOpacity;
            chapterShifts[currentChapter] = -18 * manualRoute.direction * manualRouteProgress;
          } else {
            panelOpacity = 1;
            chapterOpacities.fill(0);
            chapterOpacities[currentChapter] = 1;
            chapterShifts[currentChapter] = 0;
          }
        }

        bundle.panel.style.setProperty("--entry-presence", panelOpacity.toFixed(3));
        bundle.panel.style.setProperty("--entry-shift", `${((1 - panelOpacity) * 34).toFixed(1)}px`);
        bundle.panel.inert = panelOpacity < 0.55;
        bundle.panel.setAttribute("aria-hidden", panelOpacity < 0.35 ? "true" : "false");

        bundle.chapters.forEach((chapter, chapterIndex) => {
          const chapterOpacity = chapterOpacities[chapterIndex];
          chapter.style.setProperty("--chapter-presence", chapterOpacity.toFixed(3));
          chapter.style.setProperty("--chapter-shift", `${chapterShifts[chapterIndex].toFixed(1)}px`);
          chapter.style.setProperty("--chapter-wipe", `${((1 - chapterOpacity) * 100).toFixed(1)}%`);
          chapter.style.setProperty("--chapter-blur", `${((1 - chapterOpacity) * 5).toFixed(1)}px`);
          chapter.inert = chapterOpacity < 0.75;
          chapter.setAttribute("aria-hidden", chapterOpacity < 0.5 ? "true" : "false");
        });

        bundle.chapterButtons.forEach((button, chapterIndex) => {
          const isActive = destinationIndex === activeDestinationForUi && chapterIndex === activeChapterForUi;
          button.toggleAttribute("data-active", isActive);
          button.disabled = Boolean(transition) || button.hasAttribute("data-future-chapter");
          if (isActive) button.setAttribute("aria-current", "step");
          else button.removeAttribute("aria-current");
        });
      });

      destinationButtons.forEach((button, index) => {
        const isActive = index === activeDestinationForUi;
        button.toggleAttribute("data-active", isActive);
        if (isActive) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      });

      const atRouteStart = currentDestination === 0 && currentChapter === 0;
      const atRouteEnd = currentDestination === destinations.length - 1
        && currentChapter === destinations[currentDestination].chapters - 1;
      if (previousButton) previousButton.disabled = Boolean(transition) || atRouteStart;
      if (nextButton) nextButton.disabled = Boolean(transition) || atRouteEnd;

      const rawCameraRoll = 1.46 * Math.sin(cameraX * 0.055) + 0.34 * Math.sin(cameraX * 0.017);
      const cameraRoll = isMobileViewport ? rawCameraRoll * 0.38 : rawCameraRoll;
      strandTangent.set(
        Math.cos(cameraRoll) * mount.clientHeight / Math.max(mount.clientWidth, 1),
        -Math.sin(cameraRoll),
      ).normalize();
      emberLoom?.update({
        delta,
        time: elapsed,
        pointer,
        impulse,
        anchor: strandAnchor,
        strandTangent,
        panelBounds,
        palette: carbonUniforms.uPaletteColor.value,
        transitionActive: particleTransitionActive,
        transitionProgress: particleTransitionProgress,
        structurePresence: particleStructurePresence,
        structureDisturbance: particleStructureDisturbance,
        travelDirection: particleTravelDirection,
        cameraX,
      });

      renderer.setRenderTarget(renderTarget);
      renderer.render(carbonScene, camera);
      renderer.setRenderTarget(null);
      renderer.render(finalScene, camera);
      if (emberLoom) {
        renderer.autoClear = false;
        renderer.render(emberLoom.scene, camera);
        renderer.autoClear = true;
      }

      if (!firstFrameRendered) {
        firstFrameRendered = true;
        publishDiagnostics("ready");
        syncActiveProjectVideo(currentDestination, currentChapter);
      }

      if (rawFrameInterval > 0 && rawFrameInterval < 100) {
        performanceSamples.push(rawFrameInterval);
        if (performanceSamples.length >= 90) {
          const averageFrameInterval = performanceSamples.reduce((sum, sample) => sum + sample, 0)
            / performanceSamples.length;
          const sortedSamples = [...performanceSamples].sort((a, b) => a - b);
          const percentile75 = sortedSamples[Math.floor(sortedSamples.length * 0.75)];
          diagnosticFps = Math.round(1000 / averageFrameInterval);
          performanceSamples = [];

          if (
            qualityMode === "auto"
            && now >= qualityWarmupUntil
            && activeQualityTier !== "reduced"
          ) {
            const slowFrameThreshold = activeQualityTier === "full" ? 22 : 25;
            if (averageFrameInterval > slowFrameThreshold || percentile75 > slowFrameThreshold + 2) {
              consecutiveSlowWindows += 1;
            } else {
              consecutiveSlowWindows = Math.max(0, consecutiveSlowWindows - 1);
            }
            if (consecutiveSlowWindows >= 2) {
              applyQualityTier(
                getNextLowerVisualQuality(activeQualityTier),
                `sustained ${diagnosticFps} FPS`,
              );
            } else {
              publishDiagnostics("ready");
            }
          } else {
            publishDiagnostics("ready");
          }
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        previousTime = null;
        lastRenderedFrameAt = 0;
        return;
      }
      if (!disposed && !contextLost && animationFrame === 0) {
        qualityWarmupUntil = performance.now() + 2000;
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      activateFallback("WebGL context lost; waiting for recovery");
    };

    const handleContextRestored = () => {
      if (disposed) return;
      contextLost = false;
      visualFallbackRef.current = false;
      previousTime = null;
      lastRenderedFrameAt = 0;
      firstFrameRendered = false;
      qualityWarmupUntil = performance.now() + 4000;
      diagnosticReason = "WebGL context restored";
      publishDiagnostics("loading");
      resize();
      if (!document.hidden && animationFrame === 0) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const panelResizeObserver = new ResizeObserver(() => updatePanelBounds());
    panelResizeObserver.observe(shell);
    panelBundles.forEach(({ panel }) => panelResizeObserver.observe(panel));

    const contentResizeObserver = new ResizeObserver((entries) => {
      if (isMobileViewport || transition) return;
      cancelAnimationFrame(contentMeasureFrame);
      contentMeasureFrame = requestAnimationFrame(() => {
        if (disposed || isMobileViewport || transition) return;
        const routesToMeasure = new Set<string>();
        entries.forEach(({ target }) => {
          const chapter = target.closest<HTMLElement>("[data-project-chapter]");
          if (!chapter) return;
          panelBundles.forEach((bundle, destinationIndex) => {
            const chapterIndex = bundle.chapters.indexOf(chapter);
            const expectedChapter = destinationIndex === currentDestination ? currentChapter : 0;
            if (chapterIndex === expectedChapter) routesToMeasure.add(`${destinationIndex}:${chapterIndex}`);
          });
        });
        routesToMeasure.forEach((route) => {
          const [destinationIndex, chapterIndex] = route.split(":").map(Number);
          syncPanelHeight(destinationIndex, chapterIndex);
        });
        updatePanelBounds();
      });
    });
    panelBundles.forEach(({ chapters }) => {
      chapters.forEach((chapter) => {
        getMeasurableChildren(chapter).forEach((child) => contentResizeObserver.observe(child));
      });
    });

    resize();
    mobileViewportQuery.addEventListener("change", handleMobileViewportChange);
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", keydown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    shell.addEventListener("pointermove", move);
    shell.addEventListener("pointerdown", excite);
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", handleContextRestored);
    if (!document.hidden) animationFrame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(contentMeasureFrame);
      panelResizeObserver.disconnect();
      contentResizeObserver.disconnect();
      mobileViewportQuery.removeEventListener("change", handleMobileViewportChange);
      siteRoot?.removeAttribute("data-live-mobile-transition");
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keydown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      shell.removeEventListener("pointermove", move);
      shell.removeEventListener("pointerdown", excite);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", handleContextRestored);
      renderTarget.dispose();
      emberLoom?.dispose();
      carbonMaterial.dispose();
      finalMaterial.dispose();
      geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const activeDestination = destinations[activeRoute.destination];
  const activeChapterLabel = activeDestination.chapterLabels[activeRoute.chapter];
  const shouldLoadChapterMedia = (destination: number, chapter: number) => (
    (activeRoute.destination === destination && activeRoute.chapter === chapter)
    || (pendingMediaRoute?.destination === destination && pendingMediaRoute.chapter === chapter)
  );
  const isFirstRoute = activeRoute.destination === 0 && activeRoute.chapter === 0;
  const isLastRoute = activeRoute.destination === destinations.length - 1
    && activeRoute.chapter === activeDestination.chapters - 1;
  return (
    <main
      ref={shellRef}
      className={styles.shell}
      style={{
        "--accent-rgb": destinations[initialRoute.destination].cssColor.join(", "),
        "--chrome-presence": initialRoute.destination > 0 ? 1 : 0,
      } as CSSProperties}
      data-initial-destination={initialRoute.destination}
      data-initial-chapter={initialRoute.chapter}
      data-visual-state="loading"
      data-mobile-project-menu-open={mobileOverlay === "projects" ? "" : undefined}
      onTouchStart={handleMobileSwipeStart}
      onTouchEnd={handleMobileSwipeEnd}
      onTouchCancel={() => { mobileSwipeStartRef.current = null; }}
    >
      <div ref={mountRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      {visualDiagnostics && (
        <aside className={styles.visualDiagnostics} aria-label="Visual rendering diagnostics" aria-live="polite">
          <div>
            <span>{visualDiagnostics.state}</span>
            <strong>{visualDiagnostics.mode} · {visualDiagnostics.tier}</strong>
            <small>{visualDiagnostics.fps ? `${visualDiagnostics.fps} FPS · ` : ""}{visualDiagnostics.reason}</small>
          </div>
          <nav aria-label="Force a visual rendering tier">
            <button type="button" onClick={() => setDiagnosticVisualMode("auto")}>AUTO</button>
            {visualQualityTiers.map((tier) => (
              <button key={tier} type="button" onClick={() => setDiagnosticVisualMode(tier)}>
                {tier.toUpperCase()}
              </button>
            ))}
            <button type="button" onClick={() => setDiagnosticVisualMode("fallback")}>EMERGENCY</button>
          </nav>
        </aside>
      )}

      <noscript>
        <nav className={styles.noScriptNavigation} aria-label="Portfolio pages">
          <Link href="/">ABOUT</Link>
          {destinations.slice(1).map((destination, destinationIndex) => (
            <span key={destination.slug}>
              <Link href={getPortfolioPath({ destination: destinationIndex + 1, chapter: 0 })}>
                {destination.label}
              </Link>
              {destination.chapterLabels.slice(1).map((chapter, chapterIndex) => (
                <Link
                  key={chapter}
                  href={getPortfolioPath({ destination: destinationIndex + 1, chapter: chapterIndex + 1 })}
                >
                  {chapter}
                </Link>
              ))}
            </span>
          ))}
        </nav>
      </noscript>

      <header className={styles.mobileHeader}>
        <div className={styles.mobileIdentityLockup}>
          <strong>EVAN LUEBBERT</strong>
          <i aria-hidden="true" />
          <span>{activeDestination.label}</span>
        </div>
        <div className={styles.mobileHeaderActions}>
          <nav className={styles.mobileLandscapeRouteControls} aria-label="Landscape mobile portfolio navigation">
            <button type="button" onClick={() => stepRoute(-1)} aria-label="Previous chapter or project" disabled={isFirstRoute}>
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" onClick={() => stepRoute(1)} aria-label="Next chapter or project" disabled={isLastRoute}>
              <span aria-hidden="true">→</span>
            </button>
          </nav>
          <button
            className={styles.mobileMenuButton}
            type="button"
            aria-label="Open portfolio menu"
            aria-expanded={mobileOverlay === "projects"}
            onClick={() => {
              setExpandedMenuProject(activeRoute.destination);
              setMobileOverlay("projects");
            }}
          >
            <i aria-hidden="true" />
            <i aria-hidden="true" />
          </button>
        </div>
      </header>

      <nav className={styles.waypoint} aria-label="Portfolio table of contents">
        {destinations.map((destination, index) => (
          <button key={destination.label} type="button" data-destination-nav onClick={() => navigateToDestination(index)}>
            <strong>{destination.label}</strong>
            <span className={styles.waypointDescription}>{destination.description}</span>
          </button>
        ))}
      </nav>

      <article className={`${styles.project} ${styles.homeProject}`} data-destination-panel="0" aria-hidden={initialRoute.destination !== 0}>
        <section className={`${styles.chapter} ${styles.homeIntroduction} ${styles.aboutSinglePanel}`} data-project-chapter>
          <div className={styles.projectMeta} data-about-reference-label><span>ABOUT</span></div>
          <div className={styles.aboutLayout}>
            <div className={styles.aboutMain}>
              <div className={styles.introductionHeading}>
                <h1 className={styles.introductionTitle} data-about-reference-title>
                  <span className={styles.introductionTitleLine}>I build software</span>{" "}
                  <span className={styles.introductionTitleLine}>I believe in.</span>
                </h1>
                <p className={styles.availability}>NYC · Open to full-time and freelance work.</p>
              </div>
              <section className={styles.aboutApproach} aria-labelledby="about-approach-title">
                <p className={styles.cardLabel} id="about-approach-title">APPROACH</p>
                <div className={styles.approachCopy}>
                  <p>Software engineering and design is my superpower. It enables me to wield technology to build a better world.</p>
                  <div className={styles.approachPrinciples}>
                    <p>Being able to solve my own problems is a luxury.</p>
                    <p>The ability to craft solutions for others is a privilege.</p>
                  </div>
                  <p>I’m devoted to making well-designed tools to tackle complicated problems. I embrace curiosity, explore creative solutions, and fill the gaps where software can make a difference. Everyone has used frustrating and poorly designed software. I can fix that. I build clear, seamless workflows around the way people actually work, so software can be an asset instead of a liability.</p>
                </div>
              </section>
              <section className={styles.aboutInterests} aria-labelledby="about-interests-title">
                <p className={styles.cardLabel} id="about-interests-title">I LOVE BUILDING</p>
                <ul className={styles.interestList}>
                  <li>Full-stack applications for complicated workflows</li>
                  <li>Intuitive and satisfying interfaces delivering polished UX</li>
                  <li>Innovative technology for projects with a positive impact</li>
                  <li>Data-heavy tools and visualizations</li>
                  <li>Software where reliability and trust matter</li>
                </ul>
              </section>
            </div>
            <aside className={styles.aboutSidebar} aria-label="Profile details">
              <figure
                className={styles.headshot}
                data-media-frame=""
                data-media-loading={shouldLoadChapterMedia(0, 0) ? "true" : "false"}
              >
                {/* The source is pre-cropped and optimized, so native image loading is intentional. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shouldLoadChapterMedia(0, 0) ? "/images/evan-luebbert-headshot.webp" : undefined}
                  alt="Evan Luebbert smiling outdoors."
                  width="480"
                  height="600"
                  onLoad={handleMediaReady}
                  onError={handleMediaReady}
                />
                <MediaLoadingIndicator />
              </figure>
              <div className={styles.personalNote}>
                <p className={styles.cardLabel}>OUTSIDE OF SOFTWARE</p>
                <p>Outside of software, I’m usually rock climbing, fostering cats, playing tabletop RPGs, and obsessing over strategy games.</p>
              </div>
            </aside>
            <footer className={styles.aboutContact}>
              <p>Working on something interesting? Send me an email or find me on LinkedIn.</p>
              <nav className={styles.minimalContactLinks} aria-label="Contact links">
                <a href="https://github.com/luebbertevan" target="_blank" rel="noreferrer" data-about-reference-link>GitHub <i aria-hidden="true">↗</i></a>
                <a href="https://www.linkedin.com/in/evan-luebbert/" target="_blank" rel="noreferrer">LinkedIn <i aria-hidden="true">↗</i></a>
                <a href="/documents/evan-luebbert-resume-2026.pdf" download="Evan-Luebbert-Resume-2026.pdf">Resume <i aria-hidden="true">↓</i></a>
                <button type="button" onClick={copyEmail} aria-live="polite">
                  <span ref={emailRef}>luebbertevan@gmail.com</span>
                  <i aria-hidden="true">{emailCopyStatus === "copied" ? "✓" : "⧉"}</i>
                  <span className={styles.srOnly}>{emailCopyStatus === "copied" ? "Email copied" : emailCopyStatus === "selected" ? "Email selected" : "Copy email"}</span>
                </button>
              </nav>
            </footer>
          </div>
        </section>
      </article>

      <article className={`${styles.project} ${styles.fostyProject}`} data-destination-panel="1" aria-hidden={initialRoute.destination !== 1}>
        <section className={`${styles.chapter} ${styles.fostyOrigin}`} data-project-chapter>
          <div className={styles.projectMeta}><span>FOSTY</span></div>
          <div className={styles.fostyLayout}>
            <div className={styles.fostyHeading}>
              <p className={styles.cardLabel}>
                <span>FOUNDER ·</span>{" "}
                <span>FULL-STACK ENGINEER ·</span>{" "}
                <span>PRODUCT DESIGNER</span>
              </p>
              <div className={styles.fostyTitleRow}>
                <h1>Fosty</h1>
                <p className={styles.fostyDate}>2025 TO PRESENT</p>
              </div>
            </div>
            <h2 className={styles.fostyStatement}>Built for animals in need and the people devoted to helping them.</h2>
            <div className={styles.fostyStory}>
              <div className={styles.fostyCopy}>
                <p>Fosty is a foster coordination platform I founded and built for animal shelters and rescues. Before moving to NYC, I fostered 34 kittens through Colorado Kitty Coalition. I watched their team struggle with urgent care coordination split across texts, emails, DMs, and messy Google Sheets.</p>
                <p>That friction can have a serious impact on outcomes. An animal in a critical condition deserves timely intervention, and disorganized communication can have tragic consequences. I saw a broken system and I knew I could build them something better. I was inspired to create Fosty, a custom platform to organize foster communication and record keeping. I reached out to the rescue with the proposal for Fosty, and they were ecstatic. I will always remember their response:</p>
                <blockquote className={styles.fostyQuote}>“We need you!”</blockquote>
              </div>
              <nav className={`${styles.minimalContactLinks} ${styles.fostyLinks}`} aria-label="Fosty links">
                <a href="https://www.fosty.us/" target="_blank" rel="noreferrer">Demo Fosty <i aria-hidden="true">↗</i></a>
                <a href="https://github.com/luebbertevan/animal-shelter-management-platform" target="_blank" rel="noreferrer">GitHub <i aria-hidden="true">↗</i></a>
                <a href="https://www.cokittycoalition.com/" target="_blank" rel="noreferrer">Colorado Kitty Coalition <i aria-hidden="true">↗</i></a>
              </nav>
            </div>
            <figure
              className={styles.fostyPhoto}
              data-media-frame=""
              data-media-loading={shouldLoadChapterMedia(1, 0) ? "true" : "false"}
            >
              {/* The source is optimized for this compact editorial crop. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shouldLoadChapterMedia(1, 0) ? "/images/evan-fostering-kitten.webp" : undefined}
                alt="Evan holding a foster kitten."
                width="1040"
                height="1384"
                onLoad={handleMediaReady}
                onError={handleMediaReady}
              />
              <MediaLoadingIndicator />
            </figure>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.fostyProductChapter}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>FOSTY</span>
            <span>THE PRODUCT</span>
          </div>
          <div className={styles.fostyProductLayout}>
            <header className={styles.fostyProductIntro}>
              <div className={styles.fostyChapterHeading}>
                <h2>A dedicated platform for foster care</h2>
              </div>
              <p>
                Animal rescues coordinate care across staff and volunteer foster homes. Fosty brings intake,
                records, foster requests, assignments, and real-time communication into one place, so teams can
                spend less time piecing together information and more time caring for animals.
              </p>
            </header>
            <ol className={styles.productVisualList} aria-label="Fosty product screens">
              {fostyProductMedia.map((item) => (
                <li key={item.title}>
                  <figure className={styles.productVisual}>
                    <button
                      className={styles.productScreenshot}
                      type="button"
                      data-media-frame=""
                      data-media-loading={shouldLoadChapterMedia(1, 1) ? "true" : "false"}
                      onClick={() => setExpandedMedia(item)}
                      aria-label={`Expand the ${item.title.toLowerCase()} screenshot`}
                    >
                      {/* These are product screenshots, so native image loading preserves the authored pixels. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shouldLoadChapterMedia(1, 1) ? item.src : undefined}
                        alt={item.alt}
                        width={item.width}
                        height={item.height}
                        loading="lazy"
                        onLoad={handleMediaReady}
                        onError={handleMediaReady}
                      />
                      <MediaLoadingIndicator />
                      <MediaExpandIcon />
                    </button>
                    <figcaption className={styles.productCaption}>
                      <span>{item.title}</span>
                      <p>{item.description}</p>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.fostyDesignChapter}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>FOSTY</span>
            <span>DESIGN</span>
          </div>
          <div className={styles.fostyDesignLayout}>
            <header className={styles.fostyChapterHeading}>
              <h2>Designed with the rescue team</h2>
            </header>
            <div className={styles.fostyDesignBody}>
              <figure className={styles.fostyDesignArtifact}>
                <button
                  className={styles.productScreenshot}
                  type="button"
                  data-media-frame=""
                  data-media-loading={shouldLoadChapterMedia(1, 2) ? "true" : "false"}
                  onClick={() => setExpandedMedia(fostyDesignMedia)}
                  aria-label="Expand the Fosty usability review screenshot"
                >
                  {/* This process artifact is kept at its authored aspect ratio. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shouldLoadChapterMedia(1, 2) ? fostyDesignMedia.src : undefined}
                    alt={fostyDesignMedia.alt}
                    width={fostyDesignMedia.width}
                    height={fostyDesignMedia.height}
                    loading="lazy"
                    onLoad={handleMediaReady}
                    onError={handleMediaReady}
                  />
                  <MediaLoadingIndicator />
                  <MediaExpandIcon />
                </button>
                <figcaption>
                  <span>{fostyDesignMedia.title}</span>
                  <p>{fostyDesignMedia.description}</p>
                </figcaption>
              </figure>
              <p>
                The goal of Fosty is to provide features and workflows that fit naturally into existing rescue
                operations, reducing administrative chaos and helping teams make faster, clearer care decisions. There
                was no existing animal foster-care platform to use as a blueprint, so I had to invent the product
                model, workflows, and interaction patterns for this problem space, translating CKC’s fragmented
                real-world process into a structured, coherent system.
              </p>
              <p>
                The platform serves two distinct user groups: coordinators who need operational visibility across
                many volunteers, and foster caregivers who need to see their assignments and stay in contact with
                staff. I worked directly with the rescue team to identify pain points, define requirements, and scope
                solutions that could be built and tested.
              </p>
              <p>
                Fosty’s data model is designed around the core relationships in rescue operations. Animals can belong
                to groups such as litters, move through placement states, carry care and medical histories, and stay
                linked to relevant conversations. I designed an interface around that model that feels natural to both
                coordinators and foster caregivers. I tested and refined the workflows through usability reviews with
                the rescue team, foster volunteer test users, designer colleagues, and UX advisors.
              </p>
            </div>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.fostyEngineeringChapter}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>FOSTY</span>
            <span>ENGINEERING</span>
          </div>
          <div className={styles.fostyEngineeringLayout}>
            <header className={styles.fostyChapterHeading}>
              <h2>A platform animal rescues can trust</h2>
            </header>
            <div className={styles.fostyEngineeringFlow}>
              <div className={styles.fostyCopy}>
                <p>
                  Building software for a cause I care about means its quality reflects my values, not just my
                  skills. I architected the full-stack application around two roles: coordinators manage animal
                  records and coordinate the entire placement pipeline, while volunteers see fostering opportunities
                  and make requests.
                </p>
                <p>
                  Messaging is part of the coordination model rather than a separate inbox. Animal and group tags
                  carry record context into each foster’s shared conversation with staff, keeping updates anchored to
                  the care they support.
                </p>
                <p>
                  I designed reliability into the workflows rescue teams depend on. For request approvals, a
                  transactional PostgreSQL function locks the request and updates assignment, status, and visibility
                  records together. Row-level security and organization-scoped permissions isolate each rescue’s data.
                  Fosty was engineered to be secure, reliable, and trusted.
                </p>
              </div>
              <div className={styles.fostyEngineeringDetails}>
                <section className={styles.fostyEngineeringSection}>
                  <p className={`${styles.cardLabel} ${styles.technicalHighlightsLabel}`}>TECHNICAL HIGHLIGHTS</p>
                  <ul className={styles.fostyEngineeringHighlights}>
                    <li>Role-specific coordinator and foster workflows</li>
                    <li>Animal lifecycle, group and placement management</li>
                    <li>Transactional request-approval workflows with assignment conflict safeguards</li>
                    <li>Contextual, real-time messaging with animal and group tags</li>
                    <li>Organization-scoped permissions and row-level security</li>
                  </ul>
                </section>
                <section className={styles.fostyEngineeringSection}>
                  <p className={styles.cardLabel}>TECHNOLOGY</p>
                  <ul className={styles.fostyTechnologyTags} aria-label="Fosty technology">
                    {[
                      "React",
                      "TypeScript",
                      "Vite",
                      "TanStack Query",
                      "React Router",
                      "Supabase",
                      "PostgreSQL",
                    ].map((technology) => <li key={technology}>{technology}</li>)}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.fostyOutcomeChapter}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>FOSTY</span>
            <span>OUTCOME</span>
          </div>
          <div className={styles.fostyOutcomeLayout}>
            <header className={styles.fostyChapterHeading}>
              <h2>The future of Fosty</h2>
            </header>
            <h2 className={styles.fostyOutcomeSubtitle}>Providing relief to rescues everywhere.</h2>
            <div className={styles.fostyCopy}>
              <p>
                I am actively rolling out Fosty with Colorado Kitty Coalition as my pilot partner. My primary
                objective is to ensure Fosty works reliably in their day-to-day environment. The next benchmark is
                full adoption by CKC, with the platform tailored to fulfill their foster-management needs.
              </p>
              <p>
                The broken system extends beyond CKC. Once Fosty is proven in a rescue environment, I plan to find
                more partners and reach out to rescues and shelters interested in Fosty. I believe Fosty can fill a
                missing piece in animal rescue management and that shelters deserve a dedicated platform for foster
                operations.
              </p>
              <p>
                Every design decision has a real user on the other end caring for a living animal. My personal
                connection to the problem, the organization, and the animals means I’m never satisfied. I am building
                an app that I would use myself. I am devoted to making product and technical decisions that improve
                the lives of the animals I love.
              </p>
              <p>
                Fosty represents who I am as a designer and engineer. I like to build software close to users,
                grounded in real operations, and engineered for trust in high-stakes environments.
              </p>
              <p>
                If you want to help with the Fosty mission or follow the journey, please reach out. There is always a
                demand for foster volunteers, so if you are interested in fostering, connect with your local animal
                shelter. I made Fosty to serve a community that I am passionate about, and I hope I inspire others to
                explore projects that make the world a better place.
              </p>
            </div>
          </div>
        </section>
        <ol className={`${styles.chapterRail} ${styles.fostyChapterRail}`} aria-label="Fosty case study chapters">
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(0)}>ORIGIN</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(1)}>PRODUCT</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(2)}>DESIGN</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(3)}>ENGINEERING</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(4)}>OUTCOME</button></li>
        </ol>
        {expandedMedia && portalTarget && createPortal(
          <div
            className={styles.mediaLightbox}
            data-media-frame=""
            data-media-loading="true"
            role="dialog"
            aria-modal="true"
            aria-label={`Expanded ${expandedMedia.title.toLowerCase()} screenshot`}
            onClick={() => setExpandedMedia(null)}
          >
            <button
              ref={lightboxCloseRef}
              type="button"
              aria-label="Close expanded screenshot"
              onClick={() => setExpandedMedia(null)}
            >
              <span aria-hidden="true">×</span>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expandedMedia.src}
              alt={expandedMedia.alt}
              width={expandedMedia.width}
              height={expandedMedia.height}
              onClick={(event) => event.stopPropagation()}
              onLoad={handleMediaReady}
              onError={handleMediaReady}
            />
            <MediaLoadingIndicator />
          </div>,
          portalTarget,
        )}
      </article>

      <article className={`${styles.project} ${styles.cruxProject}`} data-destination-panel="2" aria-hidden={initialRoute.destination !== 2}>
        <section className={`${styles.chapter} ${styles.cruxOrigin}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>CRUX VISION</span>
            <span>ORIGIN</span>
          </div>
          <div className={styles.cruxLayout}>
            <header className={styles.cruxHeading}>
              <p className={styles.cardLabel}>PRODUCT DESIGNER · FULL-STACK ENGINEER</p>
              <div className={styles.cruxTitleRow}>
                <h1>Crux Vision</h1>
                <p className={styles.cruxDate}>2025 TO PRESENT</p>
              </div>
            </header>
            <div className={styles.cruxBody}>
              <section className={styles.cruxNarrative} tabIndex={0} aria-label="Read the Crux Vision origin story">
                <p className={styles.cruxOriginLead}>
                  Crux Vision is a movement-review tool I created to turn climbing footage into a workspace for
                  examining motion and technique. It uses pose data to create video overlays that reveal new layers
                  of visual information, helping climbers examine movement holistically and magnify subtleties that
                  ordinary playback can obscure.
                </p>
                <div className={styles.cruxOriginFeature}>
                  <figure
                    className={styles.cruxOriginScreenshot}
                    data-media-frame=""
                    data-media-loading={shouldLoadChapterMedia(2, 0) ? "true" : "false"}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shouldLoadChapterMedia(2, 0) ? "/images/crux-vision-find-the-move.webp" : undefined}
                      alt="Crux Vision introduction reading Find the move that matters and See your climbing in motion."
                      width={604}
                      height={504}
                      onLoad={handleMediaReady}
                      onError={handleMediaReady}
                    />
                    <MediaLoadingIndicator />
                  </figure>
                  <nav className={`${styles.minimalContactLinks} ${styles.cruxMediaActions}`} aria-label="Crux Vision links">
                    <a href="https://crux-vision-rebuild.vercel.app/" target="_blank" rel="noreferrer">
                      Public beta <i aria-hidden="true">↗</i>
                    </a>
                    <a href="https://github.com/luebbertevan/crux-vision" target="_blank" rel="noreferrer">
                      GitHub <i aria-hidden="true">↗</i>
                    </a>
                  </nav>
                </div>
                <div className={styles.cruxStoryScroll}>
                  <p>
                    Climbers are always trying to improve, whether we are building strength, refining our technique,
                    or working to complete a route at the edge of our ability. We are constantly looking to learn and
                    grow, which makes analysis, technique, and movement comprehension central to the sport. It is
                    also one reason climbing is so social: we learn from one another and work together to overcome
                    challenges.
                  </p>
                  <p>
                    While climbing, you experience everything from a first-person perspective. You are limited to
                    what you can see and feel, and you cannot observe your own body completely. Sometimes that means
                    missing the bigger picture: how your body moves through the full sequence of a route. Watching
                    another climber, or reviewing footage of yourself, reveals details and relationships that are
                    difficult to recognize while you are on the wall.
                  </p>
                  <p>
                    Video extends that collaborative process by giving climbers an outside perspective they can
                    revisit. Crux Vision complements video investigation by creating a container for deeper analysis.
                    Movement trails can reveal the path of the hips, the timing of a foot swing, the arc of a reach,
                    or the relationship between different parts of the body.
                  </p>
                  <p>
                    Using Crux Vision, I have experienced the satisfaction of seeing technical theory represented
                    visually. It has confirmed ideas I had about why a move was or was not working, exposed
                    relationships I had missed, and directed my attention toward things I would not have thought to
                    examine.
                  </p>
                  <p>
                    Crux Vision cannot replace the intuition and experience of a climber. It complements the practice
                    of analyzing movement and technique. It is a microscope for video analysis: a way to investigate
                    movement, magnify subtleties, and build stronger connections between what we see and what we feel
                    on the wall. The current public beta is only the beginning, with significant room to explore new
                    visualizations, comparisons, and meaningful measurements.
                  </p>
                </div>
              </section>
              <aside className={styles.cruxMediaColumn} aria-label="Crux Vision movement overlay demonstration">
                <figure
                  className={`${styles.cruxVideoFrame} ${styles.cruxOriginVideoFrame}`}
                  data-media-frame=""
                  data-media-loading="false"
                >
                  <video
                    ref={cruxVideoRef}
                    data-src="/videos/crux-vision-origin-overlay.mp4"
                    poster={shouldLoadChapterMedia(2, 0) ? "/images/crux-vision-origin-overlay-poster.webp" : undefined}
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-label="A portrait climbing video with a synchronized pose skeleton and movement trails"
                    onLoadedData={handleMediaReady}
                    onError={handleMediaReady}
                  >
                    Your browser does not support embedded video.
                  </video>
                  <MediaLoadingIndicator />
                  <div className={styles.cruxVideoControls}>
                    <button type="button" onClick={() => openVideoFullscreen(cruxVideoRef.current)} aria-label="View the Crux Vision overlay video fullscreen">
                      <MediaExpandIcon />
                    </button>
                  </div>
                </figure>
              </aside>
            </div>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.cruxMovementChapter}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>CRUX VISION</span>
            <span>MOVEMENT REVIEW</span>
          </div>
          <div className={styles.cruxMovementLayout}>
            <header className={styles.cruxMovementIntro}>
              <div className={styles.cruxMovementIntroColumn}>
                <div className={styles.cruxMovementIntroCopy}>
                  <h2>Review the crux</h2>
                  <p>
                    Crux Vision combines focused pose analysis with precision playback controls, making it easier to
                    isolate a move and investigate a specific question. Select the short segment that contains the
                    movement you want to understand, then move fluidly between ordinary video review and pose-based
                    overlays.
                  </p>
                </div>
                <section className={`${styles.cruxMovementFeature} ${styles.cruxMovementIntroFeature}`}>
                  <div className={styles.cruxFeatureMedia}>
                    <button
                      className={styles.productScreenshot}
                      type="button"
                      data-media-frame=""
                      data-media-loading={shouldLoadChapterMedia(2, 1) ? "true" : "false"}
                      onClick={() => setExpandedCruxMedia(cruxMovementMedia[0])}
                      aria-label="Expand the analysis range screenshot"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shouldLoadChapterMedia(2, 1) ? cruxMovementMedia[0].src : undefined}
                        alt={cruxMovementMedia[0].alt}
                        width={cruxMovementMedia[0].width}
                        height={cruxMovementMedia[0].height}
                        loading="lazy"
                        onLoad={handleMediaReady}
                        onError={handleMediaReady}
                      />
                      <MediaLoadingIndicator />
                      <MediaExpandIcon />
                    </button>
                  </div>
                  <div className={styles.productCaption}>
                    <span>ISOLATE THE CRUX</span>
                    <p>
                      Select the section that contains the move you want to understand, often the hardest move, a
                      recurring fall, or a place where two methods differ. A focused range keeps analysis centered on
                      relevant climbing and lets the on-device pose model return results much faster.
                    </p>
                  </div>
                </section>
              </div>
              <figure
                className={`${styles.cruxVideoFrame} ${styles.cruxMovementVideoFrame}`}
                data-media-frame=""
                data-media-loading="false"
              >
                <video
                  ref={cruxMovementVideoRef}
                  data-src="/videos/crux-vision-movement-review.mp4"
                  poster={shouldLoadChapterMedia(2, 1) ? "/images/crux-vision-movement-review-poster.webp" : undefined}
                  muted
                  loop
                  playsInline
                  preload="none"
                  aria-label="A climbing move reviewed at quarter speed with three joint trails"
                  onLoadedData={handleMediaReady}
                  onError={handleMediaReady}
                >
                  Your browser does not support embedded video.
                </video>
                <MediaLoadingIndicator />
                <div className={styles.cruxVideoControls}>
                  <button
                    type="button"
                    onClick={() => openVideoFullscreen(cruxMovementVideoRef.current)}
                    aria-label="View the slow-motion Crux Vision review video fullscreen"
                  >
                    <MediaExpandIcon />
                  </button>
                </div>
              </figure>
            </header>

            <ol className={styles.cruxMovementFeatureList} aria-label="Crux Vision movement-review features">
              <li className={styles.cruxMovementFeature}>
                <div className={styles.cruxFeatureMedia}>
                  <button
                    className={styles.productScreenshot}
                    type="button"
                    data-media-frame=""
                    data-media-loading={shouldLoadChapterMedia(2, 1) ? "true" : "false"}
                    onClick={() => setExpandedCruxMedia(cruxMovementMedia[1])}
                    aria-label="Expand the checkpoints screenshot"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shouldLoadChapterMedia(2, 1) ? cruxMovementMedia[1].src : undefined}
                      alt={cruxMovementMedia[1].alt}
                      width={cruxMovementMedia[1].width}
                      height={cruxMovementMedia[1].height}
                      loading="lazy"
                      onLoad={handleMediaReady}
                      onError={handleMediaReady}
                    />
                    <MediaLoadingIndicator />
                    <MediaExpandIcon />
                  </button>
                </div>
                <div className={styles.cruxPrecisionDetails}>
                  <div className={styles.productCaption}>
                    <span>REVIEW WITH PRECISION</span>
                    <p>
                      Loop the selected range, slow down playback, step through analyzed frames, and create named
                      checkpoints for important positions. Repeat a movement, inspect individual moments, and return
                      quickly to the parts of an attempt that deserve closer attention.
                    </p>
                  </div>
                  <button
                    className={styles.productScreenshot}
                    type="button"
                    data-media-frame=""
                    data-media-loading={shouldLoadChapterMedia(2, 1) ? "true" : "false"}
                    onClick={() => setExpandedCruxMedia(cruxMovementMedia[2])}
                    aria-label="Expand the precision playback screenshot"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shouldLoadChapterMedia(2, 1) ? cruxMovementMedia[2].src : undefined}
                      alt={cruxMovementMedia[2].alt}
                      width={cruxMovementMedia[2].width}
                      height={cruxMovementMedia[2].height}
                      loading="lazy"
                      onLoad={handleMediaReady}
                      onError={handleMediaReady}
                    />
                    <MediaLoadingIndicator />
                    <MediaExpandIcon />
                  </button>
                </div>
              </li>

              <li className={`${styles.cruxMovementFeature} ${styles.cruxMovementFeatureWide}`}>
                <div className={`${styles.cruxFeatureMedia} ${styles.cruxFeatureMediaTall}`}>
                  {[cruxMovementMedia[3], cruxMovementMedia[4]].map((item) => (
                    <button
                      key={item.title}
                      className={styles.productScreenshot}
                      type="button"
                      data-media-frame=""
                      data-media-loading={shouldLoadChapterMedia(2, 1) ? "true" : "false"}
                      onClick={() => setExpandedCruxMedia(item)}
                      aria-label={`Expand the ${item.title.toLowerCase()} screenshot`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shouldLoadChapterMedia(2, 1) ? item.src : undefined}
                        alt={item.alt}
                        width={item.width}
                        height={item.height}
                        loading="lazy"
                        onLoad={handleMediaReady}
                        onError={handleMediaReady}
                      />
                      <MediaLoadingIndicator />
                      <MediaExpandIcon />
                    </button>
                  ))}
                </div>
                <div className={styles.productCaption}>
                  <span>FOCUS THE INVESTIGATION</span>
                  <p>
                    Choose the body part that matches the question you are asking. Focus on an ankle generating
                    momentum, or examine a hip, shoulder, wrist, knee, or elbow. Each selected trail turns a movement
                    path obscured through time into something visible. This can help confirm an observation, reveal a
                    new detail, or explain the movement to another climber.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.cruxVisualChapter}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>CRUX VISION</span>
            <span>VISUAL OVERLAY</span>
          </div>
          <div className={styles.cruxVisualLayout}>
            <header className={styles.cruxVisualIntro}>
              <h2>Movement made visible</h2>
              <p>
                Movement trails trace parts of your body through space, preserving the complete shape of a movement
                as a persistent visual path. For this comparison, I selected my left ankle, hip midpoint, and
                shoulder midpoint to investigate two attempts at the same dynamic move.
              </p>
            </header>

            <figure className={styles.cruxComparisonFigure}>
              <div
                className={`${styles.cruxVideoFrame} ${styles.cruxComparisonVideoFrame}`}
                data-media-frame=""
                data-media-loading="false"
              >
                <video
                  ref={cruxComparisonVideoRef}
                  data-src="/videos/crux-vision-fail-vs-success.mp4"
                  poster={shouldLoadChapterMedia(2, 2) ? "/images/crux-vision-fail-vs-success-poster.webp" : undefined}
                  muted
                  loop
                  playsInline
                  preload="none"
                  aria-label="Two attempts at the same dynamic climbing move compared with ankle, hip, and shoulder movement trails"
                  onLoadedData={handleMediaReady}
                  onError={handleMediaReady}
                >
                  Your browser does not support embedded video.
                </video>
                <MediaLoadingIndicator />
                <div className={styles.cruxVideoControls}>
                  <button
                    type="button"
                    onClick={() => openVideoFullscreen(cruxComparisonVideoRef.current)}
                    aria-label="View the Crux Vision movement-trail comparison video fullscreen"
                  >
                    <MediaExpandIcon />
                  </button>
                </div>
              </div>
            </figure>

            <div className={styles.cruxVisualSupport}>
              <aside
                className={styles.cruxTrailLegend}
                data-media-frame=""
                data-media-loading={shouldLoadChapterMedia(2, 2) ? "true" : "false"}
                aria-label="Selected movement trails"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shouldLoadChapterMedia(2, 2) ? "/images/crux-vision-trail-legend.webp" : undefined}
                  alt="Hip midpoint in orange, shoulder midpoint in cyan, and left ankle in magenta."
                  width={352}
                  height={316}
                  loading="lazy"
                  onLoad={handleMediaReady}
                  onError={handleMediaReady}
                />
                <MediaLoadingIndicator />
              </aside>
              <section className={styles.cruxVisualSection} aria-labelledby="crux-visual-move">
                <h3 id="crux-visual-move">THE MOVE</h3>
                <div>
                  <p>
                    The move begins from a poor foothold: a flat, sideways-facing surface that is difficult to jump
                    from without slipping. The destination holds are two opposing side-pulls. To stay on the wall, I
                    need to catch them with enough height to keep my arms bent, create compression through my upper
                    body, and press my foot into the flat wall.
                  </p>
                  <p>
                    It is a quick, coordinated movement, and the momentum, body position, and timing all have to come
                    together within a fraction of a second.
                  </p>
                </div>
              </section>
            </div>

            <section className={`${styles.cruxVisualSection} ${styles.cruxTrailReading}`} aria-labelledby="crux-reading-trails">
              <h3 id="crux-reading-trails">READING THE TRAILS</h3>
              <div>
                <p>
                  In the unsuccessful attempt, I try to power directly through the move by pulling on the sloped
                  handholds and jumping. My chest and shoulders lead while my hips follow behind. I arrive with my
                  arms extended and my body stretched away from the wall, without enough leverage or any support
                  from my feet to hold the position.
                </p>
                <p>
                  In the successful attempt, I generate momentum differently. I swing my left leg backward, then
                  drive it forward and upward. The ankle trail makes that larger arc immediately visible. The swing
                  carries my hips through the movement, allowing them to lead rather than trail behind my shoulders.
                  The hip and shoulder trajectories rise higher, and I arrive more centered beneath the holds, with
                  bent arms and a foot pressing into the wall to take weight off my arms.
                </p>
                <p>
                  My climbing experience gave me a theory about why one attempt worked and the other did not. Crux
                  Vision gave that theory a visible form. Isolating the move and comparing trails pulled attention
                  toward the timing and relationships that ordinary playback spreads across a fraction of a second.
                </p>
                <p>
                  The overlay does not replace the experience of a climber. It complements that knowledge, providing
                  an intuitive surface for individuals, groups, and coaches to examine movement, make nuanced
                  observations, confirm theories, and explain complex technique to one another.
                </p>
              </div>
            </section>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.cruxEngineeringChapter}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>CRUX VISION</span>
            <span>ENGINEERING</span>
          </div>
          <div className={styles.cruxEngineeringLayout}>
            <header className={styles.cruxEngineeringIntro}>
              <h2>Building visuals from video</h2>
            </header>

            <div className={styles.cruxEngineeringOverview}>
              <p className={styles.cruxEngineeringLead}>
                Drawing a skeleton is straightforward compared with deciding when its data is trustworthy enough
                to show. Climbing gives a pose model difficult input: crossed limbs, occlusion, motion blur, and
                unusual body positions the model was not trained for. Sometimes these conditions result in
                MediaPipe output with missing data or detection errors. The engineering challenge was to preserve
                the movement without disguising that uncertainty.
              </p>
              <section className={styles.cruxEngineeringDetails} aria-labelledby="crux-technical-highlights-heading">
                <h3 id="crux-technical-highlights-heading">TECHNICAL HIGHLIGHTS</h3>
                <ul className={styles.cruxEngineeringHighlights}>
                  <li>Progressive, on-device pose analysis in a module worker</li>
                  <li>Presentation-timestamp synchronization for live overlays</li>
                  <li>Immutable raw pose data with derived, inspectable views</li>
                  <li>Confidence-aware filtering and gap-bounded smoothing</li>
                </ul>
              </section>
            </div>

            <section className={styles.cruxTechnology} aria-labelledby="crux-technology-heading">
              <h3 id="crux-technology-heading">TECHNOLOGY</h3>
              <ul className={styles.fostyTechnologyTags} aria-label="Crux Vision technology">
                {["React", "TypeScript", "Vite", "MediaPipe Pose", "MediaBunny", "Canvas 2D", "Web Workers"].map(
                  (technology) => <li key={technology}>{technology}</li>,
                )}
              </ul>
            </section>

            <div className={styles.cruxEngineeringCopy}>
              <section aria-labelledby="crux-video-to-overlay">
                <h3 id="crux-video-to-overlay">FROM VIDEO TO OVERLAY</h3>
                <p>
                  A climber imports a local video and selects only the range they want to study, keeping the analysis
                  focused and reducing processing time. MediaPipe analyzes that range progressively in a worker,
                  drawing the overlay as results arrive so the climber can begin reviewing the movement while the
                  source video remains playable. Each pose sample keeps its presentation timestamp, and live Canvas
                  layers use the same display transform as the video, keeping overlays aligned across portrait and
                  landscape footage without uploading or re-encoding the clip.
                </p>
              </section>
              <section aria-labelledby="crux-preserving-uncertainty">
                <h3 id="crux-preserving-uncertainty">PRESERVING UNCERTAINTY</h3>
                <p>
                  Raw pose results remain immutable. Confidence, body-scale plausibility, and motion over time
                  determine which joints enter a derived view. Implausible jumps and unreliable positions are
                  rejected; smoothing stays inside valid segments. When a joint disappears behind the climber or
                  wall, Crux Vision shows an honest gap instead of inventing a continuous path.
                </p>
              </section>
            </div>

            <section className={styles.cruxQualitySection} aria-labelledby="crux-quality-heading">
              <div className={styles.cruxQualityIntro}>
                <h3 id="crux-quality-heading">CONTINUITY IS A TRADEOFF</h3>
                <p>
                  The ordinary interface reduces a large calibration system to three understandable approaches.
                  More continuous data can be useful, but it is not automatically more accurate.
                </p>
              </div>
              <ul className={styles.cruxQualityProfiles}>
                <li>
                  <div className={styles.cruxQualityTrack} aria-hidden="true"><i /></div>
                  <strong>BALANCED</strong>
                  <span>
                    Uses moderate confidence and motion cutoffs to balance useful continuity against false
                    positions.
                  </span>
                </li>
                <li>
                  <div className={styles.cruxQualityTrack} aria-hidden="true"><i /></div>
                  <strong>STRICT</strong>
                  <span>
                    Uses higher confidence cutoffs and tighter motion limits, creating more gaps to avoid false
                    limbs.
                  </span>
                </li>
                <li>
                  <div className={styles.cruxQualityTrack} aria-hidden="true"><i /></div>
                  <strong>PERMISSIVE</strong>
                  <span>
                    Uses lower confidence cutoffs and looser motion limits to preserve more data, with a greater
                    risk of questionable positions.
                  </span>
                </li>
              </ul>
            </section>

            <section className={styles.cruxCalibrationIntro} aria-labelledby="crux-calibration-heading">
              <h3 id="crux-calibration-heading">CALIBRATION BY ITERATION</h3>
              <div>
                <p>
                  Calibration is an iterative process rather than a search for one universally correct filter. I
                  compare raw, accepted, rejected, One Euro, and centered views against the same cached MediaPipe
                  results, isolating each policy or filter change from a new inference run. Coverage, rejection, gap,
                  and smoothing metrics reveal how a setting changes the data, but visual review determines whether
                  the resulting body positions still make sense.
                </p>
                <p>
                  The public beta exposes this deeper workspace for advanced manual calibration. Thresholds,
                  continuity rules, smoothing behavior, and preview modes can be adjusted while the original pose
                  samples remain immutable. Most climbers only need the Balanced, Strict, and Permissive presets; the
                  advanced controls make the reasoning behind those presets inspectable and give me a controlled
                  surface for developing better defaults.
                </p>
                <p>
                  Calibration remains ongoing. I am continuing to test across static positions, explosive dynamic
                  moves, overhangs and occlusion, crossed limbs, varied camera angles, and different styles of
                  climbing. A change should improve more than one kind of movement without creating a new failure
                  somewhere else.
                </p>
              </div>
            </section>

            <div className={styles.cruxCalibrationStack}>
              <div className={styles.cruxCalibrationRow}>
                <figure className={styles.cruxCalibrationFigure}>
                  <button
                    type="button"
                    className={`${styles.productScreenshot} ${styles.cruxCalibrationScreenshot}`}
                    data-media-frame=""
                    data-media-loading={shouldLoadChapterMedia(2, 3) ? "true" : "false"}
                    onClick={() => setExpandedCruxMedia(cruxEngineeringMedia[0])}
                    aria-label="Expand compare derived views screenshot"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shouldLoadChapterMedia(2, 3) ? cruxEngineeringMedia[0].src : undefined}
                      alt={cruxEngineeringMedia[0].alt}
                      width={cruxEngineeringMedia[0].width}
                      height={cruxEngineeringMedia[0].height}
                      loading="lazy"
                      onLoad={handleMediaReady}
                      onError={handleMediaReady}
                    />
                    <MediaLoadingIndicator />
                    <MediaExpandIcon />
                  </button>
                </figure>

                <section className={styles.cruxCalibrationSection} aria-labelledby="crux-smoothing-heading">
                  <h3 id="crux-smoothing-heading">SMOOTHING RECORDED MOVEMENT</h3>
                  <p>
                    Even accepted pose landmarks can shift slightly from frame to frame. That noise makes a skeleton
                    appear to jitter and turns a movement trail into a jagged path. Smoothing produces more visually
                    stable poses and cleaner overlays and trails, but every smoother must trade some immediate
                    responsiveness for visual continuity.
                  </p>
                  <p>
                    The <strong>One Euro filter</strong> is adaptive and causal: it uses the current and earlier
                    accepted samples, applying more smoothing to slow or nearly still movement and responding more
                    quickly as movement speed increases. Because it does not look ahead, it follows the chronology of
                    the incoming pose track, but it can still visibly trail a fast, dynamic move.
                  </p>
                  <p>
                    The <strong>centered offline smoother</strong> uses accepted samples before and after each
                    timestamp. Its symmetric window avoids the same systematic trailing and produced the most useful
                    display for recorded dynamic movement while still removing substantial jitter, so it became the
                    display default. Looking forward creates a different risk: movement can appear to begin slightly
                    early. Both smoothers stay inside accepted segments and reset at missing or rejected data rather
                    than blending across a gap. Accepted raw retains the original model output.
                  </p>
                </section>
              </div>

              <div className={styles.cruxCalibrationRow}>
                <figure className={styles.cruxCalibrationFigure}>
                  <button
                    type="button"
                    className={`${styles.productScreenshot} ${styles.cruxCalibrationScreenshot}`}
                    data-media-frame=""
                    data-media-loading={shouldLoadChapterMedia(2, 3) ? "true" : "false"}
                    onClick={() => setExpandedCruxMedia(cruxEngineeringMedia[1])}
                    aria-label="Expand confidence threshold controls screenshot"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shouldLoadChapterMedia(2, 3) ? cruxEngineeringMedia[1].src : undefined}
                      alt={cruxEngineeringMedia[1].alt}
                      width={cruxEngineeringMedia[1].width}
                      height={cruxEngineeringMedia[1].height}
                      loading="lazy"
                      onLoad={handleMediaReady}
                      onError={handleMediaReady}
                    />
                    <MediaLoadingIndicator />
                    <MediaExpandIcon />
                  </button>
                </figure>

                <section className={styles.cruxCalibrationSection} aria-labelledby="crux-confidence-heading">
                  <h3 id="crux-confidence-heading">CONFIDENCE BY SCOPE</h3>
                  <p>
                    MediaPipe attaches two confidence signals to each detected joint. <strong>Visibility</strong>
                    estimates whether the joint is clearly visible rather than hidden by the body, wall, or another
                    limb. <strong>Presence</strong> estimates whether the joint is actually within the captured frame.
                    Crux Vision requires both signals to clear their configured thresholds before a joint enters an
                    accepted view.
                  </p>
                  <p>
                    A global threshold establishes the baseline, while body-group overrides can target repeated
                    problems in related joints without over-filtering the entire body. Joint-level overrides provide
                    an even narrower adjustment when needed. Higher thresholds remove more questionable positions,
                    reducing false limbs at the cost of more missing data and broken trails. Lower thresholds preserve
                    more continuous movement, but increase the chance that an uncertain or incorrect position will
                    remain visible.
                  </p>
                </section>
              </div>
            </div>

            <div className={`${styles.cruxCalibrationGrid} ${styles.cruxCalibrationGridSecondary}`}>
              <figure className={`${styles.cruxCalibrationFigure} ${styles.cruxContinuityFigure}`}>
                <button
                  type="button"
                  className={`${styles.productScreenshot} ${styles.cruxCalibrationScreenshot}`}
                  data-media-frame=""
                  data-media-loading={shouldLoadChapterMedia(2, 3) ? "true" : "false"}
                  onClick={() => setExpandedCruxMedia(cruxEngineeringMedia[2])}
                  aria-label="Expand continuity and smoothing controls screenshot"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shouldLoadChapterMedia(2, 3) ? cruxEngineeringMedia[2].src : undefined}
                    alt={cruxEngineeringMedia[2].alt}
                    width={cruxEngineeringMedia[2].width}
                    height={cruxEngineeringMedia[2].height}
                    loading="lazy"
                    onLoad={handleMediaReady}
                    onError={handleMediaReady}
                  />
                  <MediaLoadingIndicator />
                  <MediaExpandIcon />
                </button>
              </figure>

              <div className={styles.cruxCalibrationFinalText}>
                <section className={styles.cruxCalibrationSection} aria-labelledby="crux-plausibility-heading">
                  <h3 id="crux-plausibility-heading">CONTINUITY AND PLAUSIBILITY</h3>
                  <p>
                    Confidence hysteresis uses different requirements for acquiring and retaining a joint, preventing
                    borderline data from blinking on and off at a single cutoff. Timestamp-aware plausibility checks
                    compare joint speed, acceleration, and changes in apparent limb length against body scale,
                    rejecting positions that would require an implausible jump even when the model reports high
                    confidence. The smoothing controls then tune filter responsiveness within the accepted values.
                  </p>
                </section>

                <section className={styles.cruxCalibrationSection} aria-labelledby="crux-limitations-heading">
                  <h3 id="crux-limitations-heading">LIMITATIONS</h3>
                  <p>
                    Filtering and smoothing can reject noise or make accepted movement easier to read, but they cannot
                    recover a joint the model never observed. One Euro can lag fast movement, while centered smoothing
                    can anticipate movement onset. Both remain approximations that need continued comparison against
                    accepted raw data.
                  </p>
                  <p>
                    Movement trails are most useful with a fixed or nearly fixed camera. Camera movement can distort
                    trails because the overlay measures motion within the image, including movement introduced by
                    panning, zooming, or camera shake.
                  </p>
                  <p>
                    Computer vision remains imperfect. Calibration can improve the usefulness of the visual result,
                    but it cannot repair major detection errors or missing data. Crux Vision should not be treated as
                    flawless motion capture or biomechanical truth.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.cruxOutlookChapter}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>CRUX VISION</span>
            <span>OUTLOOK</span>
          </div>
          <div className={styles.cruxOutlookLayout}>
            <header className={styles.cruxOutlookHeader}>
              <h2>An open investigation</h2>
            </header>

            <div className={styles.cruxOutlookVision}>
              <p>
                Crux Vision began with climbing because it is the movement discipline I am familiar with and
                passionate about. Other sports and movement disciplines could benefit from the same concept: visuals
                can create a shared language between what someone feels, what a video shows, and what another person
                can observe.
              </p>
              <p>
                The public beta is the first useful version of that idea. My immediate goal is to make the complete
                workflow comfortable during an ordinary gym session, then let real use guide what comes next. I want
                future features to grow from the questions climbers and coaches bring to the tool, not from adding
                visual complexity for its own sake.
              </p>
            </div>

            <div className={styles.cruxOutlookFuture}>
              <section aria-labelledby="crux-outlook-visual-lenses">
                <h3 id="crux-outlook-visual-lenses">NEW VISUAL LENSES</h3>
                <p>
                  There is substantial room to deepen the investigation. New overlays could show the direction and
                  speed of a movement, preserve earlier positions as ghost poses, or bring several settings together
                  around a question such as hip drive, a leg swing, or the sequence of body positions through a move.
                  Carefully bounded measurements could help examine timing, angles, stillness, and movement paths
                  while remaining honest about missing or uncertain pose data.
                </p>
              </section>
              <section aria-labelledby="crux-outlook-comparison">
                <h3 id="crux-outlook-comparison">COMPARE ATTEMPTS</h3>
                <p>
                  Video comparison is especially valuable. Synchronizing two attempts could make differences in
                  path, timing, body position, and method easier to see. Over time, saved review sessions, editable
                  annotations, and shareable visuals could turn Crux Vision into a richer surface for collaboration
                  between climbers and coaches. The same principles may complement expertise in other movement
                  disciplines, but each brings its own questions. I would want those directions to be explored with
                  the people who understand them.
                </p>
              </section>
            </div>

            <div className={styles.cruxOutlookClosing}>
              <p className={styles.cruxOutlookPurpose}>
                Crux Vision will never pretend to know the correct way to move. Its purpose is to help athletes learn
                something about their technique, give coaches a clearer way to explain an observation, or add a new
                element to an open conversation between climbers.
              </p>
              <div className={styles.cruxOutlookInvitation}>
                <p>
                  Try Crux Vision with your own climbing video. If it helps you notice something—or if you have
                  observations or improvements—I would love to hear about it. I welcome feedback, feature requests,
                  and open conversations about where the project should go next.
                </p>
                <nav className={`${styles.minimalContactLinks} ${styles.cruxOutlookActions}`} aria-label="Crux Vision outlook links">
                  <a href="https://crux-vision-rebuild.vercel.app/" target="_blank" rel="noreferrer">
                    Public beta <i aria-hidden="true">↗</i>
                  </a>
                  <button type="button" onClick={copyOutlookEmail} aria-live="polite">
                    <span ref={outlookEmailRef}>luebbertevan@gmail.com</span>
                    <i aria-hidden="true">{emailCopyStatus === "copied" ? "✓" : "⧉"}</i>
                    <span className={styles.srOnly}>
                      {emailCopyStatus === "copied" ? "Email copied" : emailCopyStatus === "selected" ? "Email selected" : "Copy email"}
                    </span>
                  </button>
                  <a href="https://github.com/luebbertevan/crux-vision" target="_blank" rel="noreferrer">
                    GitHub <i aria-hidden="true">↗</i>
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </section>
        <ol className={`${styles.chapterRail} ${styles.cruxChapterRail}`} aria-label="Crux Vision case study chapters">
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(0)}>ORIGIN</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(1)}>MOVEMENT REVIEW</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(2)}>VISUAL OVERLAY</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(3)}>ENGINEERING</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(4)}>OUTLOOK</button></li>
        </ol>
        {expandedCruxMedia && portalTarget && createPortal(
          <div
            className={styles.mediaLightbox}
            data-media-frame=""
            data-media-loading="true"
            role="dialog"
            aria-modal="true"
            aria-label={`Expanded ${expandedCruxMedia.title.toLowerCase()} screenshot`}
            onClick={() => setExpandedCruxMedia(null)}
          >
            <button
              ref={lightboxCloseRef}
              type="button"
              aria-label="Close expanded screenshot"
              onClick={() => setExpandedCruxMedia(null)}
            >
              <span aria-hidden="true">×</span>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expandedCruxMedia.src}
              alt={expandedCruxMedia.alt}
              width={expandedCruxMedia.width}
              height={expandedCruxMedia.height}
              onClick={(event) => event.stopPropagation()}
              onLoad={handleMediaReady}
              onError={handleMediaReady}
            />
            <MediaLoadingIndicator />
          </div>,
          portalTarget,
        )}
      </article>

      <article className={`${styles.project} ${styles.inheritanceProject}`} data-destination-panel="4" aria-hidden={initialRoute.destination !== 4}>
        <section className={`${styles.chapter} ${styles.inheritanceExperience}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>INHERITANCE</span>
            <span>EXPERIENCE</span>
          </div>
          <div className={styles.inheritanceLayout}>
            <header className={styles.inheritanceHeading}>
              <p className={styles.cardLabel}>MACHINE LEARNING &amp; MOTION CAPTURE ENGINEERING INTERN</p>
              <div className={styles.inheritanceTitleRow}>
                <h1>Inheritance</h1>
                <p className={styles.inheritanceDate}>FALL 2025</p>
              </div>
            </header>
            <section className={styles.inheritanceIntro} aria-labelledby="inheritance-intro-title">
              <h2 className={styles.inheritanceStatement} id="inheritance-intro-title">Motion Data for Machine Learning</h2>
              <p>
                At <a href="https://www.inheritance.ai/" target="_blank" rel="noreferrer">Inheritance</a>, I built a Python and Blender pipeline that converted the entire <a href="https://amass.is.tue.mpg.de/" target="_blank" rel="noreferrer">AMASS</a> research
                dataset into standardized skeletal animation for machine learning training in Unreal Engine. The
                pipeline processed <strong>11,265 motions</strong> from 344 subjects, representing more than 65 hours
                of motion capture. The team estimated that around 90% could support
                training, saving roughly <strong>three months</strong> of data generation and <strong>$70,000</strong> in
                equivalent motion capture production.
              </p>
            </section>
            <div className={styles.inheritanceShowcase}>
              <dl className={styles.inheritanceMetrics} aria-label="Project impact">
                <div><dt>11,265</dt><dd><strong>NEW MOTIONS AVAILABLE</strong></dd></div>
                <div><dt>3 MONTHS</dt><dd><strong>DATA GENERATION SAVED</strong></dd></div>
                <div><dt>$70K</dt><dd><strong>MOTION CAPTURE VALUE</strong></dd></div>
              </dl>
              <figure className={styles.inheritanceVideoFrame}>
                <div
                  className={styles.inheritanceVideoMedia}
                  data-media-frame=""
                  data-media-loading="false"
                >
                  <video
                    ref={inheritanceVideoRef}
                    data-src="/videos/inheritance-motion-collection.mp4"
                    poster={shouldLoadChapterMedia(4, 0) ? "/images/inheritance-motion-collection-poster.webp" : undefined}
                    muted
                    loop
                    playsInline
                    preload="none"
                    width="1600"
                    height="886"
                    aria-label="A collection of retargeted motion capture animations playing in Blender"
                    onLoadedData={handleMediaReady}
                    onError={handleMediaReady}
                  >
                    Your browser does not support embedded video.
                  </video>
                  <MediaLoadingIndicator />
                  <div className={styles.cruxVideoControls}>
                    <button
                      type="button"
                      onClick={() => openVideoFullscreen(inheritanceVideoRef.current)}
                      aria-label="View the retargeted motion capture sample video fullscreen"
                    >
                      <MediaExpandIcon />
                    </button>
                  </div>
                </div>
                <figcaption>A sample of retargeted motion capture animations.</figcaption>
              </figure>
            </div>
            <section className={styles.inheritanceStory}>
              <p>
                During my internship, Inheritance operated under the name <a href="https://kikitora.com/" target="_blank" rel="noreferrer">KikiTora</a>.
                The company turned ordinary video into detailed human motion, with a longer-term goal of making
                recorded behavior available as structured data for machine learning.
              </p>
              <p>
                The training workflow ran in reverse: known motion drove standardized characters in Unreal, where
                controlled camera, lighting, and rendering variations created many video-to-motion pairs. Compatible
                motion capture was the limiting factor, which made this pipeline especially valuable.
              </p>
            </section>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.inheritanceChallenge}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>INHERITANCE</span>
            <span>CHALLENGE</span>
          </div>
          <div className={styles.inheritanceChallengeLayout}>
            <header className={styles.inheritanceChallengeHeading}>
              <h2>The Motion Data Bottleneck</h2>
              <p>
                Training a model to generate motion capture from video requires matched examples of both: a video
                input and the exact 3D motion behind it. Producing enough of these pairs at the scale required for
                machine learning is difficult and expensive.
              </p>
            </header>

            <div className={styles.inheritanceChallengeCopy}>
              <p>
                Collecting video and motion pairs directly was not practical at the scale the model required.
                Instead, we started with known motion capture and used it to generate the matching video. The
                animations drove standardized characters in Unreal Engine environments, where the same performance
                could be rendered from different camera angles with different lighting, character meshes, image
                quality, and levels of occlusion. Every render remained paired with the original animation, giving
                the model both its visual input and the correct 3D motion.
              </p>
              <p>
                This may seem backwards when our goal is to turn real video into motion capture. However, starting
                from motion solved the problem of obtaining an exact label for every frame. It also made video
                variation effectively unlimited. One performance could produce countless training examples, but
                every example still depended on the same underlying movement. The number and diversity of available
                motion capture performances remained the main constraint.
              </p>
              <p>
                At the time, Inheritance produced much of its own training motion capture. This was a costly
                operation requiring a capture stage, performers, and production staff. Existing animation data is
                difficult to license for machine learning, while new capture sessions are expensive and
                time-consuming. Expanding the motion library meant either producing more performances or finding
                another source the company could use.
              </p>
            </div>

            <div className={styles.inheritanceAmassRow}>
              <div className={styles.inheritanceChallengeCopy}>
                <p>
                  <a href="https://amass.is.tue.mpg.de/" target="_blank" rel="noreferrer">AMASS</a>, short for Archive of Motion Capture <strong>as Surface Shapes</strong>, offered another
                  source. It is a large research archive that combines motion capture from many academic datasets
                  into a shared human-body format. The archive contained more than 65 hours of motion across 11,265
                  animations and 344 subjects.
                </p>
                <p>
                  The <strong>as Surface Shapes</strong> part of the name captures the compatibility problem. AMASS
                  represented motion through SMPL-H body-model parameters that produce a rigged human surface mesh.
                  Inheritance needed conventional animation keyed onto its exact production skeleton, ready to move
                  through Blender, GLB, and Unreal. In other words, the source was organized around a deformable body
                  surface and its parameters, while the destination was organized around animation keys on a
                  specific skeleton. The motion had to be reconstructed in 3D, aligned with the target hierarchy,
                  rest pose, proportions, and coordinate spaces, and exported in the required format.
                </p>
              </div>

              <figure className={styles.inheritanceAmassFigure}>
                <button
                  type="button"
                  className={styles.inheritanceAmassButton}
                  data-media-frame=""
                  data-media-loading={shouldLoadChapterMedia(4, 1) ? "true" : "false"}
                  onClick={() => setInheritanceImageExpanded(true)}
                  aria-label="Expand the AMASS motion and body diversity image"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shouldLoadChapterMedia(4, 1) ? "/images/inheritance-amass-diversity.webp" : undefined}
                    alt="A wide collection of AMASS body models showing varied poses, movements, and body shapes."
                    width="1554"
                    height="1074"
                    loading="lazy"
                    onLoad={handleMediaReady}
                    onError={handleMediaReady}
                  />
                  <MediaLoadingIndicator />
                  <MediaExpandIcon />
                </button>
                <figcaption>THE MOTION AND BODY DIVERSITY REPRESENTED IN AMASS.</figcaption>
              </figure>
            </div>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.inheritanceEngineering}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>INHERITANCE</span>
            <span>ENGINEERING</span>
          </div>
          <div className={styles.inheritanceEngineeringLayout}>
            <div className={styles.inheritanceEngineeringHero}>
              <header className={styles.inheritanceEngineeringIntro}>
                <h2>Rebuilding Motion in 3D</h2>
                <p>
                  AMASS offers thousands of motions, but making them usable required a complex engineering solution.
                  I built an automated Python and Blender pipeline that reconstructed each sequence from SMPL-H
                  parameters, transferred it onto Inheritance&apos;s fixed production armature, and exported consistent
                  GLB animations for Unreal Engine.
                </p>
                <p>
                  Ordinary retargeting starts with two complete skeletons. Here, the source files did not contain a
                  conventional keyed armature. They stored joint rotations and root movement inside a parametric
                  human-body mesh model. The pipeline first had to recover where every joint moved in three
                  dimensions, then turn those trajectories into animation on a skeleton with a different rest pose,
                  proportions, hierarchy, and coordinate spaces.
                </p>
              </header>

              <figure className={styles.inheritanceEngineeringFigure}>
                <button
                  type="button"
                  className={styles.inheritanceEngineeringMediaButton}
                  data-media-frame=""
                  data-media-loading="false"
                  onClick={() => openVideoFullscreen(inheritanceWalkingVideoRef.current)}
                  aria-label="View the AMASS and production armature walking comparison video fullscreen"
                >
                  <video
                    ref={inheritanceWalkingVideoRef}
                    data-src="/videos/inheritance-walking-comparison.mp4"
                    poster={shouldLoadChapterMedia(4, 2) ? "/images/inheritance-walking-comparison-poster.webp" : undefined}
                    muted
                    loop
                    playsInline
                    preload="none"
                    width={1372}
                    height={1552}
                    aria-label="A synchronized comparison of AMASS surface motion and the rebuilt production armature animation"
                    onLoadedData={handleMediaReady}
                    onError={handleMediaReady}
                  >
                    Your browser does not support embedded video.
                  </video>
                  <MediaLoadingIndicator />
                  <MediaExpandIcon />
                </button>
                <figcaption>AMASS MOTION, REBUILT ON A PRODUCTION ARMATURE.</figcaption>
              </figure>
            </div>

            <section className={styles.inheritanceTechnology} aria-labelledby="inheritance-technology-heading">
              <h3 id="inheritance-technology-heading">TECHNOLOGY</h3>
              <ul className={styles.fostyTechnologyTags} aria-label="Inheritance engineering technology">
                {["Python", "Blender", "NumPy", "SMPL-H", "glTF / GLB", "Unreal Engine"].map(
                  (technology) => <li key={technology}>{technology}</li>,
                )}
              </ul>
            </section>

            <section className={styles.inheritancePipeline} aria-labelledby="inheritance-pipeline-heading">
              <div className={styles.inheritancePipelineLead}>
                <h3 id="inheritance-pipeline-heading">CORE PIPELINE</h3>
                <p>
                  Each frame contained rotations for 52 SMPL-H joints plus the movement of the root joint. I used
                  forward kinematics to reconstruct the body&apos;s world-space joint positions through the parent-child
                  hierarchy. Those positions then drove Inheritance&apos;s standardized armature in Blender, where the
                  evaluated motion was baked into keyframes and exported as an animated GLB.
                </p>
              </div>
              <div className={styles.inheritancePipelineSteps}>
                <p>The pipeline for each animation:</p>
                <ol>
                  <li>Read the joint rotations, root movement, and source frame rate.</li>
                  <li>Reconstructed every joint&apos;s position through the SMPL-H hierarchy.</li>
                  <li>Aligned the motion with the target armature and coordinate system.</li>
                  <li>Drove and baked the standardized skeleton in Blender.</li>
                  <li>Exported consistent animated GLBs for the Unreal ML workflow.</li>
                </ol>
              </div>
            </section>

            <section className={styles.inheritanceEngineeringHighlights} aria-labelledby="inheritance-highlights-heading">
              <h3
                className={`${styles.inheritanceHighlightsLabel} ${styles.technicalHighlightsLabel}`}
                id="inheritance-highlights-heading"
              >
                ENGINEERING HIGHLIGHTS
              </h3>
              <div className={styles.inheritanceHighlightGrid}>
                <article>
                  <h4>RECONCILING REST POSES</h4>
                  <p>
                    AMASS baked in the SMPL-H template T-pose, while the production pipeline depended on a
                    standardized base A-pose for calibration, mesh weight painting, and other downstream character
                    setup. I calculated the transforms required to convert the motion from the source pose into the
                    production pose so every animation used the same armature without changing the intended motion.
                  </p>
                </article>
                <article>
                  <h4>BALANCING PROPORTIONS AND MOTION</h4>
                  <p>
                    The reconstructed joint paths came from parametric bodies whose proportions did not match the
                    production rig. Forcing every target bone to reach those positions exactly caused the skeleton to
                    stretch, preserving the coordinates but distorting the body and the character of the movement.
                    The solve was to treat the joint paths as motion guides rather than literal bone dimensions, then
                    use Blender constraints and baking to transfer their timing and trajectories onto the standardized
                    armature. This preserved the production skeleton&apos;s proportions while retaining the recognizable
                    intent of each performance.
                  </p>
                </article>
                <article className={styles.inheritanceRotationHighlight}>
                  <h4>TRANSLATING THREE ROTATION SYSTEMS</h4>
                  <div>
                    <p>
                      The motion had to pass through three mathematical representations because each one served a
                      different part of the pipeline. AMASS stored each joint rotation in axis-angle form, a compact
                      three-value encoding suited to a large dataset but not to composing an entire skeletal
                      hierarchy. I converted those values into rotation matrices with Rodrigues&apos; formula so parent
                      and child transforms could be combined through forward kinematics and evaluated across local
                      and world coordinate spaces. The baked animation ultimately entered Blender and GLB&apos;s
                      quaternion-based representation, which supports stable rotation and interpolation in animation
                      tools.
                    </p>
                    <p>
                      Although all three representations encode orientation, they are not interchangeable without
                      conversion. Every rotation had to remain in the correct coordinate frame as it moved from
                      compact source data, through hierarchical calculations, and into the exported animation. Errors
                      could turn joints around the wrong axis, reverse a limb, or allow small errors to accumulate
                      through the hierarchy.
                    </p>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.inheritanceImpact}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>INHERITANCE</span>
            <span>IMPACT</span>
          </div>
          <div className={styles.inheritanceImpactLayout}>
            <header className={styles.inheritanceImpactHeader}>
              <h2>Accelerating the Data Roadmap</h2>
              <div className={styles.inheritanceImpactLead}>
                <p>
                  The AMASS retargeting pipeline gave Inheritance a large, usable motion library without requiring
                  equivalent new motion capture sessions. It processed all <strong>11,265 animations</strong> available
                  to the company, with approximately 90% qualifying as useful for training. The pipeline provided
                  thousands of performances across <strong>344 subjects</strong> and greatly expanded the team&apos;s
                  capacity to generate paired video and motion for training.
                </p>
                <p>
                  Astrid Wilde, CEO of Inheritance, estimated that the pipeline accelerated the company&apos;s
                  data-generation roadmap by approximately <strong>three months</strong> and avoided roughly{" "}
                  <strong>$70,000</strong> in equivalent stage, performer, and production costs. It also
                  broadened the foundation of human motion available for controlled training renders.
                </p>
              </div>
            </header>

            <section className={styles.inheritanceImpactMission} aria-labelledby="inheritance-impact-mission-heading">
              <div className={styles.inheritanceImpactMissionCopy}>
                <h3 id="inheritance-impact-mission-heading">FROM MOTION CAPTURE TO PHYSICAL AI</h3>
                <p>
                  At <a href="https://kikitora.com/" target="_blank" rel="noreferrer">KikiTora</a>, the immediate goal
                  was to recover detailed human motion from ordinary video. <a href="https://www.inheritance.ai/about" target="_blank" rel="noreferrer">Inheritance</a> now
                  frames that idea more broadly, converting video into structured representations of behavior,
                  contact, and action that robots and world models can use for training. The opportunity extends
                  beyond animation. For computer vision, it means moving from recognizing what appears in a frame
                  toward recovering how people move and interact with the physical world over time.
                </p>
                <p>
                  At scale, that approach could allow robotics teams to draw from recorded human behavior instead of
                  recreating every demonstration for each task, environment, or machine. A growing body of structured
                  examples could help models generalize across a wider range of conditions.
                </p>
              </div>

              <section
                className={styles.inheritanceImpactConclusion}
                aria-labelledby="inheritance-impact-conclusion-heading"
              >
                <h3 id="inheritance-impact-conclusion-heading">TURNING RESEARCH INTO IMPACT</h3>
                <p>
                  Developing the AMASS retargeting pipeline was especially rewarding because it tangibly accelerated
                  the mission by introducing thousands of motions into the ML training workflow. My work addressed a
                  serious production constraint and gave new life to data beyond its original research setting.
                </p>
                <p>
                  I was able to draw from several areas of my experience, from data infrastructure and 3D math to
                  computer vision and Blender automation. The project brought together model training, computer
                  graphics, and animation production, and I enjoyed figuring out how to make those systems work
                  together. The result was a reliable pipeline that delivered measurable value to Inheritance while
                  pointing to a much larger opportunity for structured motion data across computer vision,
                  animation, robotics, and physical AI.
                </p>
              </section>
            </section>
          </div>
        </section>
        <ol className={`${styles.chapterRail} ${styles.inheritanceChapterRail}`} aria-label="Inheritance case study chapters">
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(0)}>EXPERIENCE</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(1)}>CHALLENGE</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(2)}>ENGINEERING</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(3)}>IMPACT</button></li>
        </ol>
        {inheritanceImageExpanded && portalTarget && createPortal(
          <div
            className={styles.mediaLightbox}
            data-media-frame=""
            data-media-loading="true"
            role="dialog"
            aria-modal="true"
            aria-label="Expanded AMASS motion and body diversity image"
            onClick={() => setInheritanceImageExpanded(false)}
          >
            <button
              ref={lightboxCloseRef}
              type="button"
              aria-label="Close expanded AMASS image"
              onClick={() => setInheritanceImageExpanded(false)}
            >
              <span aria-hidden="true">×</span>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/inheritance-amass-diversity.webp"
              alt="A wide collection of AMASS body models showing varied poses, movements, and body shapes."
              width="1554"
              height="1074"
              onClick={(event) => event.stopPropagation()}
              onLoad={handleMediaReady}
              onError={handleMediaReady}
            />
            <MediaLoadingIndicator />
          </div>,
          portalTarget,
        )}
      </article>

      <article className={`${styles.project} ${styles.valProject}`} data-destination-panel="3" aria-hidden={initialRoute.destination !== 3}>
        <section className={`${styles.chapter} ${styles.valExperience}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>VAL</span>
            <span>EXPERIENCE</span>
          </div>
          <div className={styles.valLayout}>
            <header className={styles.valHeading}>
              <p className={styles.cardLabel}>FULL-STACK ENGINEER (CONTRACT)</p>
              <div className={styles.valTitleRow}>
                <h1>Val</h1>
                <p className={styles.valDate}>MARCH 2026 TO JUNE 2026</p>
              </div>
            </header>
            <section className={styles.valIntroduction} aria-labelledby="val-experience-title">
              <h2 className={styles.valStatement} id="val-experience-title">Owning a recovery platform from product decisions to production releases</h2>
              <div className={styles.valBody}>
                <p>
                  At <a href="https://val.care/" target="_blank" rel="noreferrer">Val</a>, I shaped and shipped a live recovery and post-discharge platform used by behavioral-health providers and people continuing their care. My work spanned product decisions, full-stack development, quality assurance, and production releases. I joined while the product was still early but already in production with a treatment provider and real users and that combination required that I deliver immediate impact. The platform had an important mission, active use, and the usability and reliability problems that come with software developing quickly.
                </p>
                <p>
                  I worked closely with the founders and technical leadership in a small early-stage team. I was given broad ownership over what to investigate and freedom to deliver solutions with the highest impact. I evaluated which problems were most important, scoped solutions, worked across the web application, backend, and database, and carried changes through release. Priorities came from user feedback, the workflows people depended on most, requests from the team, and opportunities I identified through my own investigation.
                </p>
                <p>
                  I was drawn to Val because it offered the responsibility and freedom of early-stage product development and a mission that inspired me. Technology plays an important role in healthcare, but it has not always been designed around the people who rely on it. Continuing care after treatment is a difficult transition, and software should make support easier to reach rather than introduce another barrier. At Val, improving usability and reliability was connected to a larger purpose: helping people remain engaged with their care and recovery communities.
                </p>
                <p>
                  This experience is a strong demonstration of how I work as a software engineer. I collaborated closely with a team while exercising independent judgment, owned features from idea through release, moved across the full stack, and took responsibility for delivering reliable software to production.
                </p>
              </div>
            </section>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.valContributions}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>VAL</span>
            <span>CONTRIBUTIONS</span>
          </div>
          <div className={styles.valContributionsLayout}>
            <header className={styles.valContributionsHeader}>
              <h2 className={styles.valContributionsTitle}>Product decisions and full-stack delivery</h2>
              <p>
                Working on an early product requires moving between new features, user experience, production issues, and technical foundations. User feedback showed us where people were struggling, and as I worked across the application, I uncovered additional problems and opportunities. I had the freedom to investigate those needs, propose solutions, and focus on the work that would make Val more useful and dependable.
              </p>
            </header>

            <section className={styles.valTextSection} aria-labelledby="val-product-judgment-title">
              <h3 id="val-product-judgment-title">PRODUCT JUDGMENT</h3>
              <p>
                I prioritized work through user feedback, product usage, founder input, and direct investigation of the application. Some needs were urgent production problems while others were workflows that had outgrown their first implementation. I learned to balance immediate fixes with improvements that would remain useful as the product developed.
              </p>
            </section>

            <section className={styles.valTextSection} aria-labelledby="val-user-experience-title">
              <h3 id="val-user-experience-title">USER EXPERIENCE</h3>
              <p>
                I improved experiences across both sides of the platform: the application used by people continuing their recovery and the tools used by treatment providers and care partners. My work touched dashboards, journaling, daily reflections, announcements, client management, and alumni-to-coach calling workflows. I removed friction and made the product more usable across user roles, devices and configurations.
              </p>
            </section>

            <section className={styles.valTextSection} aria-labelledby="val-full-stack-delivery-title">
              <h3 id="val-full-stack-delivery-title">FULL-STACK DELIVERY</h3>
              <p>
                Owning a feature meant owning the system behind it. A change that began in the interface could require new data models, backend logic, permissions, migrations, or release changes before it worked reliably for users. I followed those dependencies across the stack and carried the work through production. That continuity allowed me to deliver complete solutions and fix the cause of a problem, not just its most visible symptom.
              </p>
            </section>

            <section className={styles.valFeatureSpotlight} aria-labelledby="val-meeting-finder-title">
              <p className={styles.cardLabel}>FEATURE SPOTLIGHT</p>
              <h3 id="val-meeting-finder-title">Bringing meeting discovery into Val</h3>
              <div className={styles.valFeatureCopy}>
                <p>
                  One of the clearest examples of my product ownership was Val&apos;s AA and NA meeting finder. The existing experience sent users to a third-party website through a built-in browser. It technically offered access to meeting information, but it was fragmented, inconsistent, and not a strong long-term experience for a product intended to support continuing care.
                </p>
                <p>
                  I researched the public meeting-data ecosystem and proposed bringing discovery directly into Val. The challenge was that meeting information was spread across regional organizations using different feeds, fields, formats, and levels of completeness. I designed and built a full-stack system that aggregated more than 5,500 meetings from 19 regional AA and NA sources and normalized them into one consistent experience. The system was built to grow with Val, allowing new AA intergroups and NA service bodies to be added as the platform expanded to more locations and treatment partners.
                </p>
                <p>
                  Users could search meetings and filter by day, time, attendance format, and distance. Location-aware sorting helped them find relevant options nearby, while online and hybrid meetings remained available when geography was not the deciding factor. Supabase Edge Functions fetched the regional data, a shared model reconciled the source formats, and a layered caching and scheduled warming process kept the experience responsive without placing unnecessary load on upstream services.
                </p>
                <p>
                  The meeting finder began as an opportunity I identified independently and became one of the product&apos;s most valued features. Val&apos;s founders informed me it was a meaningful draw for the platform, and users reported relying on it daily to find meetings in their area and support their continuing aftercare. It is an explicit testiment of the broader contribution I made at Val. I am a high agency, high impact engineer who can carry a better experience across research, product decisions, engineering, and production.
                </p>
              </div>
            </section>
          </div>
        </section>
        <section className={`${styles.chapter} ${styles.valProduction}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>VAL</span>
            <span>PRODUCTION</span>
          </div>
          <div className={styles.valContributionsLayout}>
            <header className={styles.valContributionsHeader}>
              <h2 className={styles.valContributionsTitle}>Carrying changes safely into production</h2>
              <p>
                I regularly carried changes from development through production across Val&apos;s web application, backend services, and database. The work required understanding the dependencies between application code, customer configuration, data, and infrastructure. It also required evaluating release risk and responding when one part of the process failed.
              </p>
            </header>

            <section className={styles.valFeatureSpotlight} aria-labelledby="val-regression-testing-title">
              <p className={styles.cardLabel}>QUALITY ASSURANCE</p>
              <h3 id="val-regression-testing-title">Building a regression-testing foundation</h3>
              <div className={styles.valFeatureCopy}>
                <p>
                  Val was moving quickly without enough automated protection around its core patient and provider workflows. I established an end-to-end regression suite in Playwright and integrated it with GitLab CI against a containerized Supabase environment.
                </p>
                <p>
                  I made the tests repeatable by creating seeded application states and consistent local and CI environments. The automated environment also exposed authentication timing and loading-state problems that I traced and resolved. The suite gave us dependable checks for important workflows before production and clearer diagnostics when a test failed.
                </p>
              </div>
            </section>

            <section className={styles.valTextSection} aria-labelledby="val-reliability-title">
              <h3 id="val-reliability-title">RELIABILITY AND DATA ACCESS</h3>
              <p>
                Production reliability required work beyond the visible interface. I corrected asset caching that could leave users on stale application versions after a release. In PostgreSQL, I fixed Row-Level Security policies, grants, and ownership issues that blocked legitimate workflows or caused recursive queries.
              </p>
            </section>

            <section className={styles.valTextSection} aria-labelledby="val-production-releases-title">
              <h3 id="val-production-releases-title">PRODUCTION RELEASES</h3>
              <div className={styles.valFeatureCopy}>
                <p>
                  Val&apos;s releases crossed customer-specific web builds, database changes, and cloud services. I regularly coordinated builds, pending Supabase and PostgreSQL migrations, Git-SHA-versioned backend containers, front-end publishing through AWS, and final verification.
                </p>
                <p>
                  Alongside this work, I consolidated staging and release procedures, strengthened migration handling, and turned recurring operational steps into reusable tooling. This created a clearer release path with explicit checkpoints for halting, diagnosing, and recovering when something failed.
                </p>
              </div>
            </section>

            <section className={`${styles.valTextSection} ${styles.valTechnology}`} aria-labelledby="val-technology-title">
              <h3 id="val-technology-title">TECHNOLOGY</h3>
              <ul className={styles.fostyTechnologyTags} aria-label="Val technology">
                {["React", "TypeScript", "Next.js", "Capacitor", "TanStack Query", "Supabase", "PostgreSQL", "Playwright", "GitLab CI", "Docker", "Nx", "Terraform", "AWS"].map(
                  (technology) => <li key={technology}>{technology}</li>,
                )}
              </ul>
            </section>
          </div>
        </section>
        <ol className={`${styles.chapterRail} ${styles.valChapterRail}`} aria-label="Val case study chapters">
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(0)}>EXPERIENCE</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(1)}>CONTRIBUTIONS</button></li>
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(2)}>PRODUCTION</button></li>
        </ol>
      </article>

      <div className={styles.routeControls} aria-label="Portfolio navigation">
        <button type="button" data-route-previous onClick={() => stepRoute(-1)} aria-label="Previous"><span aria-hidden="true">←</span></button>
        <button type="button" data-route-next onClick={() => stepRoute(1)} aria-label="Next"><span aria-hidden="true">→</span></button>
      </div>

      <nav className={styles.mobileDock} aria-label="Mobile portfolio navigation">
        <button type="button" onClick={() => stepRoute(-1)} aria-label="Previous chapter or project" disabled={isFirstRoute}>
          <span aria-hidden="true">←</span>
        </button>
        <button
          className={styles.mobileRoutePicker}
          type="button"
          aria-label={`Choose a chapter. Current chapter: ${activeChapterLabel} in ${activeDestination.label}`}
          aria-expanded={mobileOverlay === "chapters"}
          onClick={() => setMobileOverlay("chapters")}
        >
          <strong>{activeChapterLabel}</strong>
        </button>
        <button type="button" onClick={() => stepRoute(1)} aria-label="Next chapter or project" disabled={isLastRoute}>
          <span aria-hidden="true">→</span>
        </button>
      </nav>

      {mobileOverlay === "projects" && (
        <div className={`${styles.mobileOverlay} ${styles.mobileProjectOverlay}`}>
          <div ref={mobileDialogRef} className={styles.mobileMenu} role="dialog" aria-modal="true" aria-label="Portfolio menu">
            <header className={styles.mobileMenuHeader}>
              <div className={styles.mobileIdentityLockup}>
                <strong>EVAN LUEBBERT</strong>
                <i aria-hidden="true" />
                <span>SOFTWARE ENGINEER</span>
              </div>
              <button type="button" aria-label="Close portfolio menu" onClick={() => setMobileOverlay(null)}>
                <span aria-hidden="true">×</span>
              </button>
            </header>
            <nav className={styles.mobileProjectIndex} aria-label="Projects and case study chapters">
              {destinations.map((destination, destinationIndex) => {
                const isExpanded = expandedMenuProject === destinationIndex;
                return (
                  <section key={destination.label} data-active={activeRoute.destination === destinationIndex || undefined}>
                    <div className={styles.mobileProjectRow}>
                      <button type="button" onClick={() => navigateToMobileRoute(destinationIndex, 0)}>
                        <strong>{destination.label}</strong>
                      </button>
                      <button
                        type="button"
                        aria-label={`${isExpanded ? "Hide" : "Show"} ${destination.label} chapters`}
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedMenuProject(isExpanded ? -1 : destinationIndex)}
                      >
                        <span aria-hidden="true">⌄</span>
                      </button>
                    </div>
                    <p>{destination.description}</p>
                    {isExpanded && (
                      <ol>
                        {destination.chapterLabels.map((chapter, chapterIndex) => (
                          <li key={chapter}>
                            <button
                              type="button"
                              data-active={activeRoute.destination === destinationIndex && activeRoute.chapter === chapterIndex || undefined}
                              onClick={() => navigateToMobileRoute(destinationIndex, chapterIndex)}
                            >
                              <span>{String(chapterIndex + 1).padStart(2, "0")}</span>
                              {chapter}
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                );
              })}
            </nav>
            <footer className={styles.mobileMenuFooter}>
              <nav className={styles.mobileUtilityLinks} aria-label="Profile links">
                <a href="https://github.com/luebbertevan" target="_blank" rel="noreferrer">GitHub <i aria-hidden="true">↗</i></a>
                <a href="https://www.linkedin.com/in/evan-luebbert/" target="_blank" rel="noreferrer">LinkedIn <i aria-hidden="true">↗</i></a>
                <a href="/documents/evan-luebbert-resume-2026.pdf" download="Evan-Luebbert-Resume-2026.pdf">Resume <i aria-hidden="true">↓</i></a>
              </nav>
            </footer>
          </div>
        </div>
      )}

      {mobileOverlay === "chapters" && (
        <div className={`${styles.mobileOverlay} ${styles.mobileChapterOverlay}`} onClick={() => setMobileOverlay(null)}>
          <div
            ref={mobileDialogRef}
            className={styles.mobileChapterSheet}
            role="dialog"
            aria-modal="true"
            aria-label={`${activeDestination.label} chapters`}
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>CHAPTERS</span>
                <strong>{activeDestination.label}</strong>
              </div>
              <button type="button" aria-label="Close chapter picker" onClick={() => setMobileOverlay(null)}>
                <span aria-hidden="true">×</span>
              </button>
            </header>
            <ol>
              {activeDestination.chapterLabels.map((chapter, chapterIndex) => (
                <li key={chapter}>
                  <button
                    type="button"
                    data-active={activeRoute.chapter === chapterIndex || undefined}
                    onClick={() => navigateToMobileRoute(activeRoute.destination, chapterIndex)}
                  >
                    <span>{String(chapterIndex + 1).padStart(2, "0")}</span>
                    {chapter}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </main>
  );
}
