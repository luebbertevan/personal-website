"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createEmberLoom } from "./ember-loom";
import {
  carbonPassShader,
  depthOfFieldShader,
  getSignalCameraDistance,
  screenVertexShader,
} from "./signal-prototype";
import styles from "./signal-prototype.module.css";

const destinations = [
  {
    label: "ABOUT",
    chapters: 1,
    shaderColor: [1.0, 0.25, 0.0625] as const,
    cssColor: [255, 103, 49] as const,
  },
  {
    label: "FOSTY",
    chapters: 5,
    shaderColor: [0.925, 0.282, 0.6] as const,
    cssColor: [236, 72, 153] as const,
  },
  {
    label: "CRUX VISION",
    chapters: 1,
    shaderColor: [0.737, 1.0, 0.439] as const,
    cssColor: [188, 255, 112] as const,
  },
];

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

const DESTINATION_TRAVEL = 52;
const DESTINATION_DURATION = 7.35;
const CHAPTER_TRAVEL = 13;
const CHAPTER_DURATION = 2.45;
const MANUAL_ARRIVAL_PROGRESS = 0.88;
const MANUAL_EDGE_DISTANCE = 3.2;
const HOME_OPENING_DURATION = 4.75;
const PARTICLE_ARRIVAL_START = 0.38;
const PARTICLE_ARRIVAL_END = 0.70;
const PARTICLE_DISTURBANCE_START = 0.02;
const PARTICLE_DISTURBANCE_END = 0.98;
const PANEL_ARRIVAL_START = 0.80;
const PANEL_ARRIVAL_END = 0.985;

type NavigationCommand =
  | { type: "destination"; value: number }
  | { type: "chapter"; value: number }
  | { type: "step"; value: -1 | 1 };

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
};

type ManualRoute = {
  kind: "destination" | "chapter";
  direction: -1 | 1;
  targetX: number;
  distance: number;
  targetDestination: number;
  targetChapter: number;
};

export function SignalPrototypeV4() {
  const shellRef = useRef<HTMLElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLElement>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const cruxVideoRef = useRef<HTMLVideoElement>(null);
  const cruxExpandedVideoRef = useRef<HTMLVideoElement>(null);
  const navigationCommandRef = useRef<NavigationCommand | null>(null);
  const activeDestinationRef = useRef(0);
  const cruxVideoManuallyPausedRef = useRef(false);
  const cruxVideoExpandedRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [emailCopyStatus, setEmailCopyStatus] = useState<"idle" | "copied" | "selected">("idle");
  const [expandedMedia, setExpandedMedia] = useState<FostyMedia | null>(null);
  const [cruxVideoPaused, setCruxVideoPaused] = useState(true);
  const [cruxVideoExpanded, setCruxVideoExpanded] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!expandedMedia && !cruxVideoExpanded) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setExpandedMedia(null);
      if (cruxVideoExpandedRef.current) {
        cruxVideoExpandedRef.current = false;
        setCruxVideoExpanded(false);
        if (
          activeDestinationRef.current === 2
          && !cruxVideoManuallyPausedRef.current
          && !prefersReducedMotionRef.current
        ) {
          window.requestAnimationFrame(() => {
            void cruxVideoRef.current?.play().catch(() => undefined);
            setCruxVideoPaused(false);
          });
        }
      }
    };

    lightboxCloseRef.current?.focus();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [cruxVideoExpanded, expandedMedia]);

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  const navigateToDestination = (index: number) => {
    setExpandedMedia(null);
    cruxVideoExpandedRef.current = false;
    setCruxVideoExpanded(false);
    navigationCommandRef.current = { type: "destination", value: index };
  };

  const navigateToChapter = (index: number) => {
    setExpandedMedia(null);
    cruxVideoExpandedRef.current = false;
    setCruxVideoExpanded(false);
    navigationCommandRef.current = { type: "chapter", value: index };
  };

  const stepRoute = (direction: -1 | 1) => {
    setExpandedMedia(null);
    cruxVideoExpandedRef.current = false;
    setCruxVideoExpanded(false);
    navigationCommandRef.current = { type: "step", value: direction };
  };

  const toggleCruxVideo = () => {
    const video = cruxVideoRef.current;
    if (!video) return;
    if (video.paused) {
      cruxVideoManuallyPausedRef.current = false;
      void video.play().then(() => setCruxVideoPaused(false)).catch(() => undefined);
    } else {
      cruxVideoManuallyPausedRef.current = true;
      video.pause();
      setCruxVideoPaused(true);
    }
  };

  const openCruxVideo = () => {
    cruxVideoRef.current?.pause();
    cruxVideoExpandedRef.current = true;
    setCruxVideoExpanded(true);
  };

  const closeCruxVideo = () => {
    cruxVideoExpandedRef.current = false;
    setCruxVideoExpanded(false);
    if (
      activeDestinationRef.current === 2
      && !cruxVideoManuallyPausedRef.current
      && !prefersReducedMotionRef.current
    ) {
      window.requestAnimationFrame(() => {
        void cruxVideoRef.current?.play().catch(() => undefined);
        setCruxVideoPaused(false);
      });
    }
  };

  const copyEmail = async () => {
    const email = "luebbertevan@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
      setEmailCopyStatus("copied");
    } catch {
      const emailElement = emailRef.current;
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

  useEffect(() => {
    const shell = shellRef.current;
    const mount = mountRef.current;
    if (!mount || !shell) return;
    prefersReducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotionRef.current) setCruxVideoPaused(true);
    const siteRoot = shell.closest<HTMLElement>("[data-site-root]");
    const setAccentPalette = (palette: number[]) => {
      const value = palette.join(", ");
      shell.style.setProperty("--accent-rgb", value);
      siteRoot?.style.setProperty("--accent-rgb", value);
    };

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
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
      uPaletteColor: { value: new THREE.Vector3(...destinations[0].shaderColor) },
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
    const emberLoom = createEmberLoom(renderer, renderTarget.texture);

    const panelBundles = Array.from(shell.querySelectorAll<HTMLElement>("[data-destination-panel]")).map((panel) => ({
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
    let cameraX = 0;
    let manualCameraTarget = 0;
    let cameraVelocity = 0;
    let currentDestination = 0;
    let currentChapter = 0;
    let currentAnchorX = 0;
    let currentShaderPalette = new THREE.Vector3(...destinations[0].shaderColor);
    let currentCssPalette: number[] = [...destinations[0].cssColor];
    let transition: RouteTransition | null = null;
    let homeIntroElapsed = 0;
    let homeIntroActive = true;
    let previousTime: number | null = null;
    let animationFrame = 0;
    let disposed = false;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      const dpr = Math.min(window.devicePixelRatio, 1.15);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);

      const pixelWidth = Math.max(1, Math.floor(width * dpr));
      const pixelHeight = Math.max(1, Math.floor(height * dpr));
      const studyScale = width > 1600 ? 0.62 : width > 900 ? 0.74 : 0.78;
      const targetWidth = Math.max(1, Math.floor(pixelWidth * studyScale));
      const targetHeight = Math.max(1, Math.floor(pixelHeight * studyScale));
      renderTarget.setSize(targetWidth, targetHeight);
      carbonUniforms.uResolution.value.set(targetWidth, targetHeight);
      finalUniforms.uResolution.value.set(pixelWidth, pixelHeight);
      emberLoom?.resize(pixelWidth, pixelHeight);

      const aboutPanel = shell.querySelector<HTMLElement>('[data-destination-panel="0"]');
      const fostyPanel = shell.querySelector<HTMLElement>('[data-destination-panel="1"]');
      const cruxPanel = shell.querySelector<HTMLElement>('[data-destination-panel="2"]');
      const referencePanels = [fostyPanel, cruxPanel].filter(
        (panel): panel is HTMLElement => Boolean(panel),
      );
      const contentPanelScale = Number.parseFloat(
        getComputedStyle(fostyPanel ?? cruxPanel ?? aboutPanel ?? shell).getPropertyValue("--content-panel-scale"),
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
      if (aboutPanel && width > 860) {
        const renderedAboutHeight = aboutPanel.offsetHeight * aboutScale * contentPanelScale;
        const minimumPanelMargin = Math.max(24, Math.min(56, height * 0.05));
        const maximumRenderedPanelHeight = Math.max(360, height - minimumPanelMargin * 2);
        const renderedPanelHeight = Math.min(renderedAboutHeight, maximumRenderedPanelHeight);
        const centeredAboutTop = (height - renderedPanelHeight) / 2;
        aboutPanel.style.setProperty("--about-panel-top", `${centeredAboutTop.toFixed(1)}px`);
        referencePanels.forEach((panel) => {
          panel.style.setProperty("--reference-panel-top", `${centeredAboutTop.toFixed(1)}px`);
          panel.style.setProperty(
            "--reference-panel-height",
            `${(renderedPanelHeight / contentPanelScale).toFixed(1)}px`,
          );
        });
      } else {
        aboutPanel?.style.removeProperty("--about-panel-top");
        referencePanels.forEach((panel) => {
          panel.style.removeProperty("--reference-panel-top");
          panel.style.removeProperty("--reference-panel-height");
        });
      }

      strandAnchor.set(-0.54 * height / width, 0);
      const panel = shell.querySelector<HTMLElement>("[data-destination-panel]");
      if (panel) {
        const shellRect = shell.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const renderedEntryShift = Number.parseFloat(
          getComputedStyle(panel).getPropertyValue("--entry-shift"),
        ) || 0;
        const left = ((panelRect.left - renderedEntryShift - shellRect.left) / width) * 2 - 1;
        const right = ((panelRect.right - renderedEntryShift - shellRect.left) / width) * 2 - 1;
        const top = 1 - ((panelRect.top - shellRect.top) / height) * 2;
        const bottom = 1 - ((panelRect.bottom - shellRect.top) / height) * 2;
        const horizontalParticleGap = 8 / width;
        const verticalParticleGap = 8 / height;
        panelBounds.set(
          left - horizontalParticleGap,
          right + horizontalParticleGap,
          bottom - verticalParticleGap,
          top + verticalParticleGap,
        );
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
      if (homeIntroActive) return;
      if (transition || navigationCommandRef.current) return;
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "PageDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp"
          ? -1
          : 0;
      if (!direction) return;
      event.preventDefault();
      setExpandedMedia(null);
      cruxVideoExpandedRef.current = false;
      setCruxVideoExpanded(false);
      navigationCommandRef.current = { type: "step", value: direction as -1 | 1 };
      impulse = Math.min(1, impulse + 0.16);
    };

    const beginDestination = (
      index: number,
      arrival?: { toX: number; duration: number; manualArrival: boolean },
    ) => {
      const targetDestination = THREE.MathUtils.clamp(index, 0, destinations.length - 1);
      if (targetDestination === currentDestination) {
        beginChapter(0);
        return;
      }
      const direction = targetDestination > currentDestination ? 1 : -1;
      manualCameraTarget = cameraX;
      transition = {
        kind: "destination",
        elapsed: 0,
        duration: arrival?.duration ?? DESTINATION_DURATION,
        fromX: cameraX,
        toX: arrival?.toX ?? cameraX + direction * DESTINATION_TRAVEL,
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
      if (targetChapter === currentChapter) return;
      manualCameraTarget = cameraX;
      transition = {
        kind: "chapter",
        elapsed: 0,
        duration: arrival?.duration ?? CHAPTER_DURATION,
        fromX: cameraX,
        toX: arrival?.toX ?? currentAnchorX + targetChapter * CHAPTER_TRAVEL,
        sourceDestination: currentDestination,
        targetDestination: currentDestination,
        sourceChapter: currentChapter,
        targetChapter,
        shaderFrom: currentShaderPalette.clone(),
        shaderTo: currentShaderPalette.clone(),
        cssFrom: [...currentCssPalette],
        cssTo: [...currentCssPalette],
        manualArrival: arrival?.manualArrival ?? false,
      };
    };

    const beginStep = (direction: -1 | 1) => {
      const chapterCount = destinations[currentDestination].chapters;
      if (direction > 0) {
        if (currentChapter < chapterCount - 1) beginChapter(currentChapter + 1);
        else if (currentDestination < destinations.length - 1) beginDestination(currentDestination + 1);
      } else if (currentChapter > 0) {
        beginChapter(currentChapter - 1);
      } else if (currentDestination > 0) {
        beginDestination(currentDestination - 1);
      }
    };

    const getManualRoute = (direction: -1 | 1): ManualRoute | null => {
      const chapterCount = destinations[currentDestination].chapters;
      const currentStopX = currentAnchorX + currentChapter * CHAPTER_TRAVEL;
      if (direction > 0) {
        if (currentChapter < chapterCount - 1) {
          return {
            kind: "chapter",
            direction,
            targetX: currentAnchorX + (currentChapter + 1) * CHAPTER_TRAVEL,
            distance: CHAPTER_TRAVEL,
            targetDestination: currentDestination,
            targetChapter: currentChapter + 1,
          };
        }
        if (currentDestination < destinations.length - 1) {
          return {
            kind: "destination",
            direction,
            targetX: currentStopX + DESTINATION_TRAVEL,
            distance: DESTINATION_TRAVEL,
            targetDestination: currentDestination + 1,
            targetChapter: 0,
          };
        }
      } else {
        if (currentChapter > 0) {
          return {
            kind: "chapter",
            direction,
            targetX: currentAnchorX + (currentChapter - 1) * CHAPTER_TRAVEL,
            distance: CHAPTER_TRAVEL,
            targetDestination: currentDestination,
            targetChapter: currentChapter - 1,
          };
        }
        if (currentDestination > 0) {
          return {
            kind: "destination",
            direction,
            targetX: currentStopX - DESTINATION_TRAVEL,
            distance: DESTINATION_TRAVEL,
            targetDestination: currentDestination - 1,
            targetChapter: 0,
          };
        }
      }
      return null;
    };

    const beginManualArrival = (route: ManualRoute) => {
      const remaining = Math.abs(route.targetX - cameraX);
      if (route.kind === "destination") {
        beginDestination(route.targetDestination, {
          toX: route.targetX,
          duration: Math.max(1.45, DESTINATION_DURATION * remaining / DESTINATION_TRAVEL),
          manualArrival: true,
        });
      } else {
        beginChapter(route.targetChapter, {
          toX: route.targetX,
          duration: Math.max(0.85, CHAPTER_DURATION * remaining / CHAPTER_TRAVEL),
          manualArrival: true,
        });
      }
    };

    const animate = (now: number) => {
      if (disposed) return;
      const delta = previousTime === null ? 0 : Math.min(0.04, (now - previousTime) / 1000);
      previousTime = now;
      if (!pausedRef.current) elapsed += delta;
      if (homeIntroActive && !pausedRef.current) {
        homeIntroElapsed = Math.min(HOME_OPENING_DURATION, homeIntroElapsed + delta);
        if (homeIntroElapsed >= HOME_OPENING_DURATION) homeIntroActive = false;
      }
      const homeOpeningT = THREE.MathUtils.clamp(homeIntroElapsed / HOME_OPENING_DURATION, 0, 1);
      const pageContentPresence = THREE.MathUtils.smoothstep(
        homeOpeningT,
        PANEL_ARRIVAL_START,
        PANEL_ARRIVAL_END,
      );
      const chromePresence = homeIntroActive ? pageContentPresence : 1;
      shell.style.setProperty("--chrome-presence", chromePresence.toFixed(3));
      pointer.lerp(pointerTarget, 1.0 - Math.exp(-delta * 5.0));
      impulse *= Math.exp(-delta * 2.3);

      if (!transition && navigationCommandRef.current) {
        const command = navigationCommandRef.current;
        navigationCommandRef.current = null;
        if (!homeIntroActive) {
          if (command.type === "destination") beginDestination(command.value);
          else if (command.type === "chapter") beginChapter(command.value);
          else beginStep(command.value);
        }
      }

      const previousCameraX = cameraX;
      let manualRoute: ManualRoute | null = null;
      let manualRouteProgress = 0;
      if (!transition) {
        const currentStopX = currentAnchorX + currentChapter * CHAPTER_TRAVEL;
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
      }
      if (transition) {
        particleTransitionActive = transition.kind === "destination" ? 1 : 0;
        transition.elapsed = Math.min(transition.duration, transition.elapsed + delta);
        transitionT = transition.elapsed / transition.duration;
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

      if (activeDestinationRef.current !== activeDestinationForUi) {
        activeDestinationRef.current = activeDestinationForUi;
        const cruxVideo = cruxVideoRef.current;
        const shouldPlayCruxVideo = activeDestinationForUi === 2
          && !cruxVideoManuallyPausedRef.current
          && !cruxVideoExpandedRef.current
          && !prefersReducedMotionRef.current;
        if (shouldPlayCruxVideo) {
          void cruxVideo?.play().then(() => setCruxVideoPaused(false)).catch(() => undefined);
        } else {
          cruxVideo?.pause();
          if (activeDestinationForUi === 2) setCruxVideoPaused(true);
        }
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

      const cameraRoll = 1.46 * Math.sin(cameraX * 0.055) + 0.34 * Math.sin(cameraX * 0.017);
      strandTangent.set(
        Math.cos(cameraRoll) * mount.clientHeight / Math.max(mount.clientWidth, 1),
        -Math.sin(cameraRoll),
      ).normalize();
      emberLoom?.update({
        delta: pausedRef.current ? 0 : delta,
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
      animationFrame = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", keydown);
    shell.addEventListener("pointermove", move);
    shell.addEventListener("pointerdown", excite);
    animationFrame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keydown);
      shell.removeEventListener("pointermove", move);
      shell.removeEventListener("pointerdown", excite);
      renderTarget.dispose();
      emberLoom?.dispose();
      carbonMaterial.dispose();
      finalMaterial.dispose();
      geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <main ref={shellRef} className={styles.shell}>
      <div ref={mountRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <nav className={styles.waypoint} aria-label="Portfolio table of contents">
        <button type="button" data-destination-nav onClick={() => navigateToDestination(0)}>
          <strong>ABOUT</strong>
        </button>
        <button type="button" data-destination-nav onClick={() => navigateToDestination(1)}>
          <strong>FOSTY</strong>
        </button>
        <button type="button" data-destination-nav onClick={() => navigateToDestination(2)}>
          <strong>CRUX VISION</strong>
        </button>
      </nav>

      <article className={`${styles.project} ${styles.homeProject}`} data-destination-panel="0" aria-hidden="false">
        <section className={`${styles.chapter} ${styles.homeIntroduction} ${styles.aboutSinglePanel}`} data-project-chapter>
          <div className={styles.projectMeta} data-about-reference-label><span>ABOUT</span></div>
          <div className={styles.aboutLayout}>
            <div className={styles.aboutMain}>
              <div className={styles.introductionHeading}>
                <h1 className={styles.introductionTitle} data-about-reference-title>I build software I believe in.</h1>
                <p className={styles.availability}>Based in New York City. Open to full-time roles and freelance projects.</p>
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
                  <li>Innovative solutions for noble causes</li>
                  <li>Full-stack applications for complicated workflows</li>
                  <li>Data-heavy tools and visualizations</li>
                  <li>Intuitive and satisfying interfaces</li>
                  <li>Software where reliability and trust matter</li>
                </ul>
              </section>
            </div>
            <aside className={styles.aboutSidebar} aria-label="Profile details">
              <figure className={styles.headshot}>
                {/* The source is pre-cropped and optimized, so native image loading is intentional. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/evan-luebbert-headshot.webp"
                  alt="Evan Luebbert smiling outdoors."
                  width="480"
                  height="600"
                />
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
                <a href="/documents/evan-luebbert-resume-2026.pdf" download="Evan-Luebbert-Resume-2026.pdf">Résumé <i aria-hidden="true">↓</i></a>
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

      <article className={`${styles.project} ${styles.fostyProject}`} data-destination-panel="1" aria-hidden="true">
        <section className={`${styles.chapter} ${styles.fostyOrigin}`} data-project-chapter>
          <div className={styles.projectMeta}><span>FOSTY</span></div>
          <div className={styles.fostyLayout}>
            <div className={styles.fostyHeading}>
              <p className={styles.cardLabel}>FOUNDER · FULL-STACK ENGINEER · PRODUCT DESIGNER</p>
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
            <figure className={styles.fostyPhoto}>
              {/* The source is optimized for this compact editorial crop. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/evan-fostering-kitten.webp"
                alt="Evan holding a foster kitten."
                width="1040"
                height="1384"
              />
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
                      onClick={() => setExpandedMedia(item)}
                      aria-label={`Expand the ${item.title.toLowerCase()} screenshot`}
                    >
                      {/* These are product screenshots, so native image loading preserves the authored pixels. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.src}
                        alt={item.alt}
                        width={item.width}
                        height={item.height}
                        loading="lazy"
                      />
                      <span>EXPAND <i aria-hidden="true">↗</i></span>
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
                  onClick={() => setExpandedMedia(fostyDesignMedia)}
                  aria-label="Expand the Fosty usability review screenshot"
                >
                  {/* This process artifact is kept at its authored aspect ratio. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fostyDesignMedia.src}
                    alt={fostyDesignMedia.alt}
                    width={fostyDesignMedia.width}
                    height={fostyDesignMedia.height}
                    loading="lazy"
                  />
                  <span>EXPAND <i aria-hidden="true">↗</i></span>
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
                model, workflows, and interaction patterns for this problem space—translating CKC’s fragmented
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
                  The goal was not a prototype that looked convincing in a demo, but a platform teams could trust with
                  time-sensitive information.
                </p>
              </div>
              <div className={styles.fostyEngineeringDetails}>
                <section className={styles.fostyEngineeringSection}>
                  <p className={styles.cardLabel}>TECHNICAL HIGHLIGHTS</p>
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
        {expandedMedia && (
          <div
            className={styles.mediaLightbox}
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
            />
          </div>
        )}
      </article>

      <article className={`${styles.project} ${styles.cruxProject}`} data-destination-panel="2" aria-hidden="true">
        <section className={`${styles.chapter} ${styles.cruxOrigin}`} data-project-chapter>
          <div className={styles.projectMeta}>
            <span>CRUX VISION</span>
            <span>ORIGIN</span>
          </div>
          <div className={styles.cruxLayout}>
            <header className={styles.cruxHeading}>
              <p className={styles.cardLabel}>PERSONAL PROJECT · CREATOR &amp; FULL-STACK ENGINEER</p>
              <div className={styles.cruxTitleRow}>
                <h1>Crux Vision</h1>
                <p className={styles.cruxDate}>2025 TO PRESENT</p>
              </div>
            </header>
            <div className={styles.cruxBody}>
              <section className={styles.cruxNarrative} aria-label="Crux Vision origin story">
                <p className={styles.cruxLead}>
                  Crux Vision is a movement-review tool I created to turn climbing footage into a workspace for
                  examining motion and technique. It uses pose data to create video overlays that reveal new layers
                  of visual information, helping climbers examine movement holistically and magnify subtleties that
                  ordinary playback can obscure.
                </p>
                <div className={styles.cruxStoryScroll} tabIndex={0} aria-label="Continue reading the Crux Vision origin story">
                  <p>
                    Climbers are always trying to improve—whether we are building strength, refining our technique,
                    or working to complete a route at the edge of our ability. We are constantly looking to learn and
                    grow, which makes analysis, technique, and movement comprehension central to the sport. It is
                    also one reason climbing is so social: we learn from one another and work together to overcome
                    challenges.
                  </p>
                  <p>
                    While climbing, you experience everything from a first-person perspective. You are limited to
                    what you can see and feel, and you cannot observe your own body completely. That often means
                    missing the bigger picture: how your body moves through the full sequence of a route. Watching
                    another climber—or reviewing footage of yourself—reveals details and relationships that are
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
                    visually. It has confirmed ideas I had about why a move was—or was not—working, exposed
                    relationships I had missed, and directed my attention toward things I would not have thought to
                    examine.
                  </p>
                  <p>
                    Crux Vision is not meant to tell climbers the correct answer. It is a microscope for video
                    analysis: a way to investigate movement, magnify subtleties, and build stronger connections
                    between what we see and what we feel on the wall. The current public beta is only the beginning,
                    with significant room to explore new visualizations, comparisons, and meaningful measurements.
                  </p>
                </div>
              </section>
              <aside className={styles.cruxMediaColumn} aria-label="Crux Vision movement overlay demonstration">
                <figure className={styles.cruxVideoFrame}>
                  <video
                    ref={cruxVideoRef}
                    src="/videos/crux-vision-origin-overlay.mp4"
                    poster="/images/crux-vision-origin-overlay-poster.webp"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="A portrait climbing video with a synchronized pose skeleton and movement trails"
                  >
                    Your browser does not support embedded video.
                  </video>
                  <figcaption>MOVEMENT OVERLAY · LIVE POSE</figcaption>
                  <div className={styles.cruxVideoControls}>
                    <button
                      type="button"
                      onClick={toggleCruxVideo}
                      aria-label={cruxVideoPaused ? "Play the Crux Vision overlay video" : "Pause the Crux Vision overlay video"}
                      aria-pressed={!cruxVideoPaused}
                    >
                      <span aria-hidden="true">{cruxVideoPaused ? "▶" : "Ⅱ"}</span>
                      {cruxVideoPaused ? "PLAY" : "PAUSE"}
                    </button>
                    <button type="button" onClick={openCruxVideo} aria-label="Expand the Crux Vision overlay video">
                      EXPAND <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </figure>
                <nav className={styles.cruxMediaActions} aria-label="Crux Vision links">
                  <a href="https://crux-vision-rebuild.vercel.app/" target="_blank" rel="noreferrer">
                    Try the public beta <i aria-hidden="true">↗</i>
                  </a>
                  <a href="https://github.com/luebbertevan/crux-vision" target="_blank" rel="noreferrer">
                    GitHub <i aria-hidden="true">↗</i>
                  </a>
                </nav>
              </aside>
            </div>
          </div>
        </section>
        <ol className={`${styles.chapterRail} ${styles.cruxChapterRail}`} aria-label="Crux Vision case study chapters">
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(0)}>ORIGIN</button></li>
          <li><button type="button" data-chapter-index data-future-chapter disabled>MOVEMENT REVIEW</button></li>
          <li><button type="button" data-chapter-index data-future-chapter disabled>VISUAL OVERLAY</button></li>
          <li><button type="button" data-chapter-index data-future-chapter disabled>ENGINEERING AND DESIGN</button></li>
        </ol>
        {cruxVideoExpanded && (
          <div
            className={`${styles.mediaLightbox} ${styles.cruxVideoLightbox}`}
            role="dialog"
            aria-modal="true"
            aria-label="Expanded Crux Vision movement overlay video"
            onClick={closeCruxVideo}
          >
            <button
              ref={lightboxCloseRef}
              type="button"
              aria-label="Close expanded video"
              onClick={closeCruxVideo}
            >
              <span aria-hidden="true">×</span>
            </button>
            <video
              ref={cruxExpandedVideoRef}
              src="/videos/crux-vision-origin-overlay.mp4"
              poster="/images/crux-vision-origin-overlay-poster.webp"
              autoPlay
              muted
              loop
              playsInline
              controls
              onClick={(event) => event.stopPropagation()}
            >
              Your browser does not support embedded video.
            </video>
          </div>
        )}
      </article>

      <div className={styles.routeControls} aria-label="Portfolio navigation">
        <button type="button" data-route-previous onClick={() => stepRoute(-1)} aria-label="Previous"><span aria-hidden="true">←</span></button>
        <button type="button" data-route-next onClick={() => stepRoute(1)} aria-label="Next"><span aria-hidden="true">→</span></button>
      </div>

      <button className={styles.pause} type="button" onClick={togglePause} aria-pressed={paused}>
        <span>{paused ? "RESUME VISUALS" : "PAUSE VISUALS"}</span><i>{paused ? "▶" : "Ⅱ"}</i>
      </button>
    </main>
  );
}
