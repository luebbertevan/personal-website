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
    label: "HOME",
    chapters: 1,
    shaderColor: [1.0, 0.25, 0.0625] as const,
    cssColor: [255, 103, 49] as const,
  },
  {
    label: "SIGNAL ATLAS",
    chapters: 4,
    shaderColor: [0.025, 0.42, 1.0] as const,
    cssColor: [58, 169, 255] as const,
  },
  {
    label: "VELVET CIRCUIT",
    chapters: 4,
    shaderColor: [1.0, 0.035, 0.48] as const,
    cssColor: [255, 64, 164] as const,
  },
];

const DESTINATION_TRAVEL = 52;
const DESTINATION_DURATION = 7.35;
const CHAPTER_TRAVEL = 13;
const CHAPTER_DURATION = 2.45;
const MANUAL_SCROLL_SCALE = 0.02;
const MANUAL_ARRIVAL_PROGRESS = 0.88;
const MANUAL_EDGE_DISTANCE = 3.2;
const HOME_INTRO_DURATION = 7.2;

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
  const waypointDistanceRef = useRef<HTMLElement>(null);
  const velocityRef = useRef<HTMLElement>(null);
  const travelFillRef = useRef<HTMLElement>(null);
  const navigationCommandRef = useRef<NavigationCommand | null>(null);
  const [paused, setPaused] = useState(false);
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

  useEffect(() => {
    const shell = shellRef.current;
    const mount = mountRef.current;
    if (!mount || !shell) return;

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
    let previousTime = performance.now();
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
      event.preventDefault();
      if (transition || navigationCommandRef.current) return;
      const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(dominantDelta) < 0.5) return;
      homeIntroActive = false;
      const normalizedDelta = THREE.MathUtils.clamp(dominantDelta, -140, 140);
      manualCameraTarget += normalizedDelta * MANUAL_SCROLL_SCALE;
      impulse = Math.min(1, impulse + Math.abs(normalizedDelta) * 0.0015);
    };

    const keydown = (event: KeyboardEvent) => {
      if (transition || navigationCommandRef.current) return;
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "PageDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp"
          ? -1
          : 0;
      if (!direction) return;
      event.preventDefault();
      homeIntroActive = false;
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
      const delta = Math.min(0.04, (now - previousTime) / 1000);
      previousTime = now;
      if (!pausedRef.current) elapsed += delta;
      if (homeIntroActive && !pausedRef.current) {
        homeIntroElapsed = Math.min(HOME_INTRO_DURATION, homeIntroElapsed + delta);
        if (homeIntroElapsed >= HOME_INTRO_DURATION) homeIntroActive = false;
      }
      const homeIntroT = THREE.MathUtils.clamp(homeIntroElapsed / HOME_INTRO_DURATION, 0, 1);
      const chromePresence = homeIntroActive
        ? THREE.MathUtils.smoothstep(homeIntroT, 0.42, 0.54)
        : 1;
      shell.style.setProperty("--chrome-presence", chromePresence.toFixed(3));
      pointer.lerp(pointerTarget, 1.0 - Math.exp(-delta * 5.0));
      impulse *= Math.exp(-delta * 2.3);

      if (!transition && navigationCommandRef.current) {
        const command = navigationCommandRef.current;
        navigationCommandRef.current = null;
        homeIntroActive = false;
        if (command.type === "destination") beginDestination(command.value);
        else if (command.type === "chapter") beginChapter(command.value);
        else beginStep(command.value);
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
      if (homeIntroActive) {
        const homeAssembly = THREE.MathUtils.smoothstep(homeIntroT, 0.42, 0.74);
        particleStructurePresence = homeAssembly;
      }
      if (transition) {
        particleTransitionActive = transition.kind === "destination" ? 1 : 0;
        transition.elapsed = Math.min(transition.duration, transition.elapsed + delta);
        transitionT = transition.elapsed / transition.duration;
        particleTransitionProgress = transitionT;
        particleTravelDirection = Math.sign(transition.toX - transition.fromX) || 1;
        if (transition.kind === "destination") {
          const departureStructure = 1 - THREE.MathUtils.smoothstep(transitionT, 0.12, 0.32);
          const arrivalStructure = THREE.MathUtils.smoothstep(transitionT, 0.38, 0.70);
          particleStructurePresence = transition.manualArrival
            ? arrivalStructure
            : Math.max(departureStructure, arrivalStructure);
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
        shell.style.setProperty("--accent-rgb", cssPalette.join(", "));

        if (transitionT >= 1) {
          currentDestination = transition.targetDestination;
          currentChapter = transition.targetChapter;
          if (transition.kind === "destination") currentAnchorX = transition.toX;
          currentShaderPalette = transition.shaderTo.clone();
          currentCssPalette = [...transition.cssTo];
          carbonUniforms.uPaletteColor.value.copy(currentShaderPalette);
          shell.style.setProperty("--accent-rgb", currentCssPalette.join(", "));
          manualCameraTarget = cameraX;
          transition = null;
          transitionT = 0;
        }
      } else if (manualRoute?.kind === "destination") {
        particleStructurePresence = 1 - THREE.MathUtils.smoothstep(manualRouteProgress, 0.22, 0.48);
      } else {
        carbonUniforms.uPaletteColor.value.copy(currentShaderPalette);
        shell.style.setProperty("--accent-rgb", currentCssPalette.join(", "));
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
          const homeReveal = THREE.MathUtils.smoothstep(homeIntroT, 0.78, 0.91);
          panelOpacity = homeReveal;
          chapterOpacities.fill(0);
          chapterOpacities[0] = homeReveal;
          chapterShifts[0] = 18 * (1 - homeReveal);
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
            panelOpacity = THREE.MathUtils.smoothstep(transitionT, 0.80, 0.985);
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

      const chapterCount = destinations[activeDestinationForUi].chapters;
      const chapterProgress = chapterCount === 1 ? 1 : activeChapterForUi / (chapterCount - 1);
      if (travelFillRef.current) travelFillRef.current.style.transform = `scaleX(${chapterProgress.toFixed(3)})`;
      if (waypointDistanceRef.current) {
        waypointDistanceRef.current.textContent = `${destinations[activeDestinationForUi].label} / ${String(activeChapterForUi + 1).padStart(2, "0")} OF ${String(chapterCount).padStart(2, "0")}`;
      }
      if (velocityRef.current) {
        const currentStopX = currentAnchorX + currentChapter * CHAPTER_TRAVEL;
        const manuallyTraveling = Math.abs(cameraX - currentStopX) > 0.08;
        velocityRef.current.textContent = homeIntroActive
          ? homeIntroT < 0.68 ? "ASSEMBLING HOME SIGNAL" : "HOME SIGNAL ONLINE"
          : transition
          ? transition.kind === "destination" ? "SEAMLESS DESTINATION TRANSFER" : "SNAPPING TO CHAPTER"
          : manuallyTraveling ? "MANUAL STRAND TRAVEL" : "SCROLL · ARROWS · CLICK TABS";
      }

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

      <header className={styles.header}>
        <div>
          <span>PORTFOLIO PROTOTYPE / 04</span>
          <strong>SIGNAL SPINE</strong>
        </div>
        <div className={styles.live}><i /> DYNAMIC ROUTE ONLINE</div>
      </header>

      <nav className={styles.waypoint} aria-label="Portfolio table of contents">
        <span>INDEX / HOME + 02 PROJECTS</span>
        <button type="button" data-destination-nav onClick={() => navigateToDestination(0)}>
          <i>00</i><strong>HOME</strong><small>INTRO</small>
        </button>
        <button type="button" data-destination-nav onClick={() => navigateToDestination(1)}>
          <i>01</i><strong>SIGNAL ATLAS</strong><small>BLUE</small>
        </button>
        <button type="button" data-destination-nav onClick={() => navigateToDestination(2)}>
          <i>02</i><strong>VELVET CIRCUIT</strong><small>PINK</small>
        </button>
        <div><i ref={travelFillRef} /></div>
        <b ref={waypointDistanceRef}>HOME / 01 OF 01</b>
        <em ref={velocityRef}>SCROLL · ARROWS · CLICK TABS</em>
      </nav>

      <article className={`${styles.project} ${styles.homeProject}`} data-destination-panel="0" aria-hidden="false">
        <section className={styles.chapter} data-project-chapter>
          <div className={styles.projectMeta}><span>HOME / PERSONAL INTRODUCTION</span><span>00 / ORIGIN</span></div>
          <p className={styles.eyebrow}>EVAN LUEBBERT / PORTFOLIO</p>
          <h1>Evan<br />Luebbert</h1>
          <p className={styles.homeHeadline}>Designer and creative technologist building expressive digital systems.</p>
          <p className={styles.description}>Placeholder personal copy for the final introduction: who I am, what I make, and the kinds of ambitious problems I like to solve.</p>
        </section>
        <ol className={styles.chapterRail} aria-label="Home sequence">
          <li><button type="button" data-chapter-index onClick={() => navigateToChapter(0)}><span>00</span>HOME</button></li>
        </ol>
      </article>

      <article className={styles.project} data-destination-panel="1" aria-hidden="true">
        <section className={styles.chapter} data-project-chapter>
          <div className={styles.projectMeta}><span>EXAMPLE PROJECT</span><span>01 / INTRODUCTION</span></div>
          <p className={styles.eyebrow}>SIGNAL ATLAS / BLUE SYSTEM</p>
          <h1>Signal Atlas</h1>
          <p className={styles.subtitle}>A test case for attaching a complete portfolio story to a living 3D material.</p>
          <p className={styles.continue}>NEXT / PROJECT MEDIA →</p>
        </section>
        <section className={styles.chapter} data-project-chapter>
          <div className={styles.projectMeta}><span>PROJECT ARTIFACT</span><span>02 / MEDIA</span></div>
          <p className={styles.eyebrow}>VISUAL SYSTEM / PLACEHOLDER</p>
          <h2>The work in motion.</h2>
          <div className={styles.mediaFrame} role="img" aria-label="Placeholder for Signal Atlas imagery or video">
            <span>PROJECT MEDIA / 16:9</span><strong>IMAGE OR VIDEO</strong><i />
          </div>
        </section>
        <section className={styles.chapter} data-project-chapter>
          <div className={styles.projectMeta}><span>PROJECT CONTEXT</span><span>03 / IMPACT</span></div>
          <p className={styles.eyebrow}>DESCRIPTION / CONTRIBUTION</p>
          <h2>Designed to make complexity legible.</h2>
          <p className={styles.description}>This placeholder chapter shows where the problem, approach, personal contribution, and measurable result can be explained without crowding the visual arrival.</p>
          <dl className={styles.facts}><div><dt>ROLE</dt><dd>DESIGN + BUILD</dd></div><div><dt>FORMAT</dt><dd>INTERACTIVE</dd></div><div><dt>OUTCOME</dt><dd>CASE STUDY</dd></div></dl>
        </section>
        <section className={styles.chapter} data-project-chapter>
          <div className={styles.projectMeta}><span>PROJECT DESTINATION</span><span>04 / LAUNCH</span></div>
          <p className={styles.eyebrow}>END OF SIGNAL / EXTERNAL LINK</p>
          <h2>Explore the complete project.</h2>
          <p className={styles.subtitle}>The final chapter converts the visual journey into a clear next action.</p>
          <div className={styles.tags}><span>INTERACTION DESIGN</span><span>CREATIVE DEVELOPMENT</span></div>
          <a href="https://example.com" target="_blank" rel="noreferrer">OPEN EXAMPLE PROJECT <span aria-hidden="true">↗</span></a>
        </section>
        <ol className={styles.chapterRail} aria-label="Signal Atlas sequence">
          {['INTRO', 'MEDIA', 'IMPACT', 'LAUNCH'].map((label, index) => (
            <li key={label}><button type="button" data-chapter-index onClick={() => navigateToChapter(index)}><span>{String(index + 1).padStart(2, '0')}</span>{label}</button></li>
          ))}
        </ol>
      </article>

      <article className={styles.project} data-destination-panel="2" aria-hidden="true">
        <section className={styles.chapter} data-project-chapter>
          <div className={styles.projectMeta}><span>EXAMPLE PROJECT</span><span>01 / INTRODUCTION</span></div>
          <p className={styles.eyebrow}>VELVET CIRCUIT / PINK SYSTEM</p>
          <h1>Velvet Circuit</h1>
          <p className={styles.subtitle}>A second example showing that each project can own its palette and content rhythm.</p>
          <p className={styles.continue}>NEXT / PROJECT MEDIA →</p>
        </section>
        <section className={styles.chapter} data-project-chapter>
          <div className={styles.projectMeta}><span>PROJECT ARTIFACT</span><span>02 / MEDIA</span></div>
          <p className={styles.eyebrow}>IMMERSIVE SYSTEM / PLACEHOLDER</p>
          <h2>A different visual cadence.</h2>
          <div className={`${styles.mediaFrame} ${styles.mediaFramePink}`} role="img" aria-label="Placeholder for Velvet Circuit imagery or video">
            <span>PROJECT MEDIA / 16:9</span><strong>IMAGE OR VIDEO</strong><i />
          </div>
        </section>
        <section className={styles.chapter} data-project-chapter>
          <div className={styles.projectMeta}><span>PROJECT CONTEXT</span><span>03 / IMPACT</span></div>
          <p className={styles.eyebrow}>DESCRIPTION / CONTRIBUTION</p>
          <h2>One framework, unique content.</h2>
          <p className={styles.description}>The structure remains dependable while the project’s typography, media balance, palette, and individual chapters can be tuned to fit its actual story.</p>
          <dl className={styles.facts}><div><dt>ROLE</dt><dd>CREATIVE DIRECTION</dd></div><div><dt>FORMAT</dt><dd>EXPERIENTIAL</dd></div><div><dt>OUTCOME</dt><dd>PROTOTYPE</dd></div></dl>
        </section>
        <section className={styles.chapter} data-project-chapter>
          <div className={styles.projectMeta}><span>PROJECT DESTINATION</span><span>04 / LAUNCH</span></div>
          <p className={styles.eyebrow}>END OF SIGNAL / EXTERNAL LINK</p>
          <h2>Enter Velvet Circuit.</h2>
          <p className={styles.subtitle}>Pink persists across the complete project until another destination is selected.</p>
          <div className={styles.tags}><span>CREATIVE DIRECTION</span><span>EXPERIENTIAL DESIGN</span></div>
          <a href="https://example.com" target="_blank" rel="noreferrer">OPEN EXAMPLE PROJECT <span aria-hidden="true">↗</span></a>
        </section>
        <ol className={styles.chapterRail} aria-label="Velvet Circuit sequence">
          {['INTRO', 'MEDIA', 'IMPACT', 'LAUNCH'].map((label, index) => (
            <li key={label}><button type="button" data-chapter-index onClick={() => navigateToChapter(index)}><span>{String(index + 1).padStart(2, '0')}</span>{label}</button></li>
          ))}
        </ol>
      </article>

      <div className={styles.routeControls} aria-label="Portfolio navigation">
        <button type="button" data-route-previous onClick={() => stepRoute(-1)}><span aria-hidden="true">←</span> PREVIOUS</button>
        <button type="button" data-route-next onClick={() => stepRoute(1)}>NEXT <span aria-hidden="true">→</span></button>
      </div>

      <button className={styles.pause} type="button" onClick={togglePause}>
        <span>{paused ? "PLAY" : "PAUSE"}</span><i>{paused ? "▶" : "Ⅱ"}</i>
      </button>

      <footer className={styles.footer}>
        <span>SCROLL / MANUAL TRAVEL</span><span>ARROWS / NAVIGATE</span><span>POINTER / DISTURB FIELD</span>
        <span className={styles.palette}>AMBER · BLUE · PINK</span>
      </footer>
    </main>
  );
}
