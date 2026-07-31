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
    chapters: 1,
    shaderColor: [0.925, 0.282, 0.6] as const,
    cssColor: [236, 72, 153] as const,
  },
];

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
  const navigationCommandRef = useRef<NavigationCommand | null>(null);
  const [paused, setPaused] = useState(false);
  const [emailCopyStatus, setEmailCopyStatus] = useState<"idle" | "copied" | "selected">("idle");
  const pausedRef = useRef(false);

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  const navigateToDestination = (index: number) => {
    navigationCommandRef.current = { type: "destination", value: index };
  };

  const navigateToChapter = (index: number) => {
    navigationCommandRef.current = { type: "chapter", value: index };
  };

  const stepRoute = (direction: -1 | 1) => {
    navigationCommandRef.current = { type: "step", value: direction };
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
    let currentCssPalette = [...destinations[0].cssColor];
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
      const shouldScaleAboutPanel = window.matchMedia(
        "(min-width: 2048px) and (min-height: 1152px)",
      ).matches;
      const aboutScale = shouldScaleAboutPanel && aboutPanel && fostyPanel
        ? fostyPanel.offsetWidth / Math.max(aboutPanel.offsetWidth, 1)
        : 1;
      aboutPanel?.style.setProperty("--about-panel-scale", aboutScale.toFixed(4));
      if (aboutPanel && width > 860) {
        const renderedAboutHeight = aboutPanel.offsetHeight * aboutScale;
        const centeredAboutTop = (height - renderedAboutHeight) / 2;
        aboutPanel.style.setProperty("--about-panel-top", `${centeredAboutTop.toFixed(1)}px`);
        fostyPanel?.style.setProperty("--reference-panel-top", `${centeredAboutTop.toFixed(1)}px`);
        fostyPanel?.style.setProperty("--reference-panel-height", `${renderedAboutHeight.toFixed(1)}px`);
      } else {
        aboutPanel?.style.removeProperty("--about-panel-top");
        fostyPanel?.style.removeProperty("--reference-panel-top");
        fostyPanel?.style.removeProperty("--reference-panel-height");
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

    const wheel = (event: WheelEvent) => {
      const verticalNavigation = Math.abs(event.deltaY) >= Math.abs(event.deltaX);
      const chapter = (event.target as Element | null)?.closest<HTMLElement>("[data-project-chapter]");
      const canScrollChapter = chapter && verticalNavigation && (
        event.deltaY > 0
          ? chapter.scrollTop + chapter.clientHeight < chapter.scrollHeight - 1
          : chapter.scrollTop > 1
      );
      if (canScrollChapter) return;
      event.preventDefault();
      if (homeIntroActive) return;
      if (transition || navigationCommandRef.current) return;
      const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(dominantDelta) < 2) return;
      navigationCommandRef.current = { type: "step", value: dominantDelta > 0 ? 1 : -1 };
      impulse = Math.min(1, impulse + 0.16);
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

      panelBundles.forEach((bundle, destinationIndex) => {
        let panelOpacity = destinationIndex === currentDestination ? 1 : 0;
        const chapterOpacities = bundle.chapters.map((_, chapterIndex) => (
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
          button.disabled = Boolean(transition);
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
    shell.addEventListener("wheel", wheel, { passive: false });
    animationFrame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keydown);
      shell.removeEventListener("pointermove", move);
      shell.removeEventListener("pointerdown", excite);
      shell.removeEventListener("wheel", wheel);
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
      </nav>

      <article className={`${styles.project} ${styles.homeProject}`} data-destination-panel="0" aria-hidden="false">
        <section className={`${styles.chapter} ${styles.homeIntroduction} ${styles.aboutSinglePanel}`} data-project-chapter>
          <div className={styles.projectMeta}><span>ABOUT</span></div>
          <div className={styles.aboutLayout}>
            <div className={styles.aboutMain}>
              <div className={styles.introductionHeading}>
                <h1 className={styles.introductionTitle}>I’m a passion first software engineer and designer.</h1>
                <p className={styles.introductionSubtitle}>I build software I believe in.</p>
                <p className={styles.availability}>Based in New York City. Open to full-time roles and freelance projects.</p>
              </div>
              <section className={styles.aboutApproach} aria-labelledby="about-approach-title">
                <p className={styles.cardLabel} id="about-approach-title">APPROACH</p>
                <div className={styles.approachCopy}>
                  <p>Engineering is my superpower. It enables me to wield technology to build a better world.</p>
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
                <a href="https://github.com/luebbertevan" target="_blank" rel="noreferrer">GitHub <i aria-hidden="true">↗</i></a>
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
          <div className={styles.projectMeta}><span>FOSTY / CASE STUDY</span><span>01 OF 05 / ORIGIN</span></div>
          <div className={styles.fostyLayout}>
            <div className={styles.fostyMain}>
              <div className={styles.fostyHeading}>
                <p className={styles.cardLabel}>FOUNDER · FULL-STACK ENGINEER · PRODUCT DESIGNER</p>
                <h1>Fosty</h1>
                <p className={styles.fostyDate}>2025 TO PRESENT</p>
              </div>
              <h2 className={styles.fostyStatement}>A project that is deeply meaningful to me and represents my character.</h2>
              <div className={styles.fostyCopy}>
                <p>Fosty is a foster coordination platform I founded and built for animal shelters and rescues. Before moving to NYC, I fostered 34 kittens through Colorado Kitty Coalition. I watched their team struggle with urgent care coordination split across texts, email chains, Instagram DMs, and messy Google Sheets.</p>
                <p>In rescue, that friction can have a serious impact on outcomes. An animal in a critical condition deserves timely intervention, and disorganized communication can have tragic consequences. I reached out to the rescue with the proposal for Fosty, and they were ecstatic. I will always remember the response I got: <strong>“We need you!”</strong> So, I became their engineering and design partner.</p>
              </div>
            </div>
            <aside className={styles.fostySidebar} aria-label="Fosty origin highlights">
              <div className={styles.fostyMetric}>
                <span>BEFORE FOSTY</span>
                <strong>34</strong>
                <p>KITTENS FOSTERED</p>
              </div>
              <div className={styles.fostySignal}>
                <span>THE RESPONSE</span>
                <blockquote>“We need you!”</blockquote>
                <p>COLORADO KITTY COALITION</p>
              </div>
              <div className={styles.fostyActions}>
                <a href="https://www.fosty.us/" target="_blank" rel="noreferrer">OPEN FOSTY <i aria-hidden="true">↗</i></a>
                <a href="https://www.cokittycoalition.com/" target="_blank" rel="noreferrer">VISIT COLORADO KITTY COALITION <i aria-hidden="true">↗</i></a>
              </div>
            </aside>
          </div>
        </section>
        <ol className={`${styles.chapterRail} ${styles.fostyChapterRail}`} aria-label="Fosty case study chapters">
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(0)}>ORIGIN</button></li>
          {['PRODUCT', 'DESIGN', 'ENGINEERING', 'OUTCOME'].map((label) => (
            <li key={label}><span aria-disabled="true">{label}</span></li>
          ))}
        </ol>
      </article>

      <div className={styles.routeControls} aria-label="Portfolio navigation">
        <button type="button" data-route-previous onClick={() => stepRoute(-1)}><span aria-hidden="true">←</span> PREVIOUS</button>
        <button type="button" data-route-next onClick={() => stepRoute(1)}>NEXT <span aria-hidden="true">→</span></button>
      </div>

      <button className={styles.pause} type="button" onClick={togglePause} aria-pressed={paused}>
        <span>{paused ? "RESUME VISUALS" : "PAUSE VISUALS"}</span><i>{paused ? "▶" : "Ⅱ"}</i>
      </button>
    </main>
  );
}
