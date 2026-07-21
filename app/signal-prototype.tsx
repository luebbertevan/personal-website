"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import styles from "./signal-prototype.module.css";

type AudioRig = {
  context: AudioContext;
  analyser: AnalyserNode;
  master: GainNode;
  interval: number | null;
  synthNodes: AudioNode[];
  mediaElement?: HTMLAudioElement;
  objectUrl?: string;
};

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  uniform float uImpulse;
  uniform vec2 uPointer;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying float vPulse;

  void main() {
    vUv = uv;
    vec3 p = position;
    float along = uv.x;
    float wave = sin(along * 34.0 - uTime * 2.4) * (0.035 + uMid * 0.12);
    float braid = sin(along * 13.0 + uTime * 0.7) * cos(along * 21.0 - uTime) * 0.07;
    float pointerBand = exp(-pow(along - (uPointer.x * 0.34 + 0.5), 2.0) * 35.0);
    float radiusKick = (uBass * 0.15 + uImpulse * 0.22) * sin(uv.y * 6.28318 + uTime * 2.0);
    p += normal * (wave + braid * (0.25 + uBass) + pointerBand * (uPointer.y * 0.12 + radiusKick));
    p.y += sin(along * 9.0 + uTime * 0.4) * uBass * 0.07;

    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vPulse = smoothstep(0.16, 0.0, abs(fract(along * 1.65 - uTime * (0.1 + uBass * 0.14)) - 0.5));
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  uniform float uImpulse;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying float vPulse;

  vec3 palette(float t) {
    vec3 a = vec3(0.04, 0.055, 0.09);
    vec3 b = vec3(0.45, 0.43, 0.55);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.50, 0.16, 0.03);
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormalW))), 2.4);
    float micro = sin(vUv.x * 230.0 + sin(vUv.y * 21.0 + uTime) * 3.0);
    float filament = smoothstep(0.94, 1.0, micro) * (0.35 + uHigh * 1.8);
    vec3 spectral = palette(vUv.x * 1.4 + fresnel * 0.3 + uTime * 0.025);
    vec3 blackGlass = vec3(0.004, 0.008, 0.018) + spectral * fresnel * (0.75 + uMid);
    vec3 cyan = vec3(0.28, 1.5, 1.8);
    vec3 coral = vec3(2.1, 0.18, 0.48);
    vec3 emission = cyan * vPulse * (0.35 + uBass * 1.8);
    emission += coral * filament * (0.25 + uHigh);
    emission += spectral * uImpulse * fresnel * 1.6;
    gl_FragColor = vec4(blackGlass + emission, 1.0);
  }
`;

const gridFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uImpulse;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float lineGrid(vec2 p, float scale, float width) {
    vec2 q = abs(fract(p * scale - 0.5) - 0.5) / fwidth(p * scale);
    return 1.0 - min(min(q.x, q.y) / width, 1.0);
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(1.7, 1.0);
    float r = length(p);
    float a = atan(p.y, p.x);
    p += vec2(sin(a * 6.0 + uTime * 0.18), cos(a * 4.0 - uTime * 0.13)) * 0.016 * (1.0 + uMid);
    float g1 = lineGrid(p + sin(p.yx * 9.0) * 0.012, 8.0, 1.25);
    float g2 = lineGrid(p * mat2(0.707, -0.707, 0.707, 0.707), 17.0, 0.8);
    float g3 = lineGrid(p + sin(p.yx * 17.0 + uTime * 0.2) * 0.008, 35.0, 0.45);
    float rings = pow(max(0.0, sin(r * 66.0 - uTime * 0.55)), 16.0) * 0.2;
    vec2 cursor = uPointer * vec2(0.85, 0.5);
    float wake = exp(-length(p - cursor) * (4.2 - uBass * 1.4));
    float cells = g1 * 0.34 + g2 * 0.17 + g3 * 0.08 + rings;
    float mask = smoothstep(0.86, 0.08, r) * (0.16 + wake * 0.85 + uImpulse * 0.32);
    vec3 color = mix(vec3(0.11, 0.20, 0.55), vec3(0.23, 1.25, 1.55), wake);
    color += vec3(0.65, 0.10, 0.82) * g2 * uMid;
    gl_FragColor = vec4(color * cells * mask, cells * mask * 0.68);
  }
`;

const gridVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const pointVertexShader = /* glsl */ `
  attribute float aEnergy;
  uniform float uPixelRatio;
  varying float vEnergy;
  void main() {
    vEnergy = aEnergy;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = min(15.0, (1.5 + aEnergy * 8.0) * uPixelRatio * (5.2 / -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;

const pointFragmentShader = /* glsl */ `
  varying float vEnergy;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    float core = smoothstep(0.5, 0.02, d);
    float halo = exp(-d * 7.5);
    vec3 cool = vec3(0.16, 0.52, 1.2);
    vec3 hot = vec3(1.8, 0.22, 0.78);
    vec3 color = mix(cool, hot, clamp(vEnergy, 0.0, 1.0));
    gl_FragColor = vec4(color * (core + halo * (0.6 + vEnergy)), core * 0.84);
  }
`;

function makeCurve() {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 15; i += 1) {
    const t = i / 14;
    const z = THREE.MathUtils.lerp(-4.6, 3.5, t);
    const x = Math.sin(t * Math.PI * 3.4) * (1.3 + Math.sin(t * 7.0) * 0.24);
    const y = Math.cos(t * Math.PI * 4.2) * 0.72 + Math.sin(t * 11.0) * 0.18;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.52);
}

function bandAverage(data: Uint8Array, from: number, to: number) {
  let total = 0;
  const end = Math.min(data.length, to);
  for (let i = from; i < end; i += 1) total += data[i];
  return total / Math.max(1, end - from) / 255;
}

export function SignalPrototype() {
  const mountRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioRig | null>(null);
  const audioBandsRef = useRef({ bass: 0.18, mid: 0.12, high: 0.08 });
  const mutedRef = useRef(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audioLabel, setAudioLabel] = useState("Prototype score");
  const [awake, setAwake] = useState(false);

  const stopAudioRig = () => {
    const rig = audioRef.current;
    if (!rig) return;
    if (rig.interval !== null) window.clearInterval(rig.interval);
    rig.mediaElement?.pause();
    rig.synthNodes.forEach((node) => {
      if ("stop" in node && typeof node.stop === "function") {
        try {
          node.stop();
        } catch {
          // Already stopped.
        }
      }
      try {
        node.disconnect();
      } catch {
        // Already disconnected.
      }
    });
    if (rig.objectUrl) URL.revokeObjectURL(rig.objectUrl);
    void rig.context.close();
    audioRef.current = null;
  };

  const startPrototypeScore = async () => {
    if (audioRef.current) {
      await audioRef.current.context.resume();
      return;
    }

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.76;
    const master = context.createGain();
    master.gain.value = mutedRef.current ? 0 : 0.36;
    master.connect(analyser);
    analyser.connect(context.destination);
    const synthNodes: AudioNode[] = [master, analyser];

    const padBus = context.createGain();
    padBus.gain.value = 0.08;
    const lowPass = context.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 680;
    lowPass.Q.value = 1.7;
    padBus.connect(lowPass).connect(master);
    synthNodes.push(padBus, lowPass);

    [55, 82.41, 110, 164.81].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index < 2 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index % 2 === 0 ? -5 : 6;
      gain.gain.value = index === 0 ? 0.55 : 0.18;
      oscillator.connect(gain).connect(padBus);
      oscillator.start();
      synthNodes.push(oscillator, gain);
    });

    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 0.085;
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(lowPass.frequency);
    lfo.start();
    synthNodes.push(lfo, lfoGain);

    const scheduleBeat = () => {
      if (context.state !== "running") return;
      const now = context.currentTime;
      const kick = context.createOscillator();
      const kickGain = context.createGain();
      kick.type = "sine";
      kick.frequency.setValueAtTime(92, now);
      kick.frequency.exponentialRampToValueAtTime(38, now + 0.19);
      kickGain.gain.setValueAtTime(0.0001, now);
      kickGain.gain.exponentialRampToValueAtTime(0.42, now + 0.012);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      kick.connect(kickGain).connect(master);
      kick.start(now);
      kick.stop(now + 0.34);

      const ping = context.createOscillator();
      const pingGain = context.createGain();
      const pingFilter = context.createBiquadFilter();
      ping.type = "sine";
      ping.frequency.value = Math.random() > 0.5 ? 659.25 : 493.88;
      pingFilter.type = "bandpass";
      pingFilter.frequency.value = 900;
      pingFilter.Q.value = 4;
      pingGain.gain.setValueAtTime(0.0001, now + 0.16);
      pingGain.gain.exponentialRampToValueAtTime(0.055, now + 0.18);
      pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.82);
      ping.connect(pingFilter).connect(pingGain).connect(master);
      ping.start(now + 0.16);
      ping.stop(now + 0.84);
    };

    scheduleBeat();
    const interval = window.setInterval(scheduleBeat, 780);
    audioRef.current = { context, analyser, master, interval, synthNodes };
    await context.resume();
    setAwake(true);
    setAudioLabel("Prototype score");
  };

  const useUploadedTrack = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    stopAudioRig();

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.74;
    const master = context.createGain();
    master.gain.value = mutedRef.current ? 0 : 0.78;
    const objectUrl = URL.createObjectURL(file);
    const mediaElement = new Audio(objectUrl);
    mediaElement.loop = true;
    mediaElement.crossOrigin = "anonymous";
    const source = context.createMediaElementSource(mediaElement);
    source.connect(master).connect(analyser).connect(context.destination);
    audioRef.current = {
      context,
      analyser,
      master,
      interval: null,
      synthNodes: [source, master, analyser],
      mediaElement,
      objectUrl,
    };
    await context.resume();
    await mediaElement.play();
    setAudioLabel(file.name.replace(/\.[^.]+$/, ""));
    setAwake(true);
    setAudioOpen(false);
  };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    const rig = audioRef.current;
    if (rig) {
      rig.master.gain.setTargetAtTime(next ? 0 : rig.mediaElement ? 0.78 : 0.36, rig.context.currentTime, 0.06);
    }
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02030a);
    scene.fog = new THREE.FogExp2(0x02030a, 0.052);
    const camera = new THREE.PerspectiveCamera(47, 1, 0.1, 60);
    camera.position.set(0, 0.1, 7.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.setClearColor(0x02030a, 1);
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.08, 0.72, 0.24);
    composer.addPass(bloom);

    const group = new THREE.Group();
    scene.add(group);

    const tubeUniforms = {
      uTime: { value: 0 },
      uBass: { value: 0.15 },
      uMid: { value: 0.1 },
      uHigh: { value: 0.08 },
      uImpulse: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
    };
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(makeCurve(), reducedMotion ? 120 : 260, 0.29, reducedMotion ? 10 : 18, false),
      new THREE.ShaderMaterial({
        uniforms: tubeUniforms,
        vertexShader,
        fragmentShader,
      }),
    );
    tube.rotation.set(-0.09, -0.2, 0.08);
    group.add(tube);

    const gridUniforms = {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uImpulse: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
    };
    const grid = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 11, 1, 1),
      new THREE.ShaderMaterial({
        uniforms: gridUniforms,
        vertexShader: gridVertexShader,
        fragmentShader: gridFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    grid.position.z = -2.7;
    scene.add(grid);

    const particleCount = reducedMotion ? 280 : 760;
    const homes = new Float32Array(particleCount * 3);
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const energies = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i += 1) {
      const angle = i * 2.399963 + Math.sin(i) * 0.12;
      const shell = 1.65 + (i % 47) / 47 * 2.6;
      const x = Math.cos(angle) * shell * (1.2 + Math.sin(i * 0.17) * 0.13);
      const y = Math.sin(angle) * shell * 0.68;
      const z = -0.7 + Math.sin(i * 0.41) * 2.1 - shell * 0.18;
      homes[i * 3] = positions[i * 3] = x;
      homes[i * 3 + 1] = positions[i * 3 + 1] = y;
      homes[i * 3 + 2] = positions[i * 3 + 2] = z;
      energies[i] = Math.random() * 0.18;
    }
    const particleGeometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.BufferAttribute(positions, 3);
    const energyAttribute = new THREE.BufferAttribute(energies, 1);
    particleGeometry.setAttribute("position", positionAttribute);
    particleGeometry.setAttribute("aEnergy", energyAttribute);
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } },
      vertexShader: pointVertexShader,
      fragmentShader: pointFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    const pointer = new THREE.Vector2(0, 0);
    const pointerTarget = new THREE.Vector2(0, 0);
    const pointerWorld = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let impulse = 0;
    let scrollEnergy = 0;
    let journey = 0;
    let journeyTarget = 0;
    let frame = 0;
    let lastPointer = new THREE.Vector2();
    let pointerSpeed = 0;
    const frequencyData = new Uint8Array(256);

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = mount.getBoundingClientRect();
      pointerTarget.set(((clientX - rect.left) / rect.width) * 2 - 1, -(((clientY - rect.top) / rect.height) * 2 - 1));
      pointerSpeed = Math.min(1, pointerTarget.distanceTo(lastPointer) * 3.5);
      lastPointer.copy(pointerTarget);
    };

    const onPointerMove = (event: PointerEvent) => updatePointer(event.clientX, event.clientY);
    const onPointerDown = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY);
      impulse = 1;
      void startPrototypeScore();
    };
    const onWheel = (event: WheelEvent) => {
      journeyTarget += event.deltaY * 0.00072;
      scrollEnergy = Math.min(1, scrollEnergy + Math.abs(event.deltaY) * 0.002);
      impulse = Math.min(1, impulse + Math.abs(event.deltaY) * 0.001);
      void startPrototypeScore();
    };
    const onKey = () => void startPrototypeScore();
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey, { once: true });

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, width < 700 ? 1.35 : 1.8);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      composer.setPixelRatio(dpr);
      composer.setSize(width, height);
      particleMaterial.uniforms.uPixelRatio.value = dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let animationId = 0;
    const animate = () => {
      animationId = window.requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      frame += 1;
      pointer.lerp(pointerTarget, reducedMotion ? 0.035 : 0.085);
      journey += (journeyTarget - journey) * 0.045;
      scrollEnergy *= 0.92;
      impulse *= 0.925;
      pointerSpeed *= 0.89;

      const rig = audioRef.current;
      if (rig) {
        rig.analyser.getByteFrequencyData(frequencyData);
        const rawBass = bandAverage(frequencyData, 1, 8);
        const rawMid = bandAverage(frequencyData, 8, 31);
        const rawHigh = bandAverage(frequencyData, 31, 96);
        const bands = audioBandsRef.current;
        bands.bass += (rawBass - bands.bass) * (rawBass > bands.bass ? 0.34 : 0.075);
        bands.mid += (rawMid - bands.mid) * (rawMid > bands.mid ? 0.26 : 0.065);
        bands.high += (rawHigh - bands.high) * (rawHigh > bands.high ? 0.38 : 0.12);
      }
      const { bass, mid, high } = audioBandsRef.current;

      tubeUniforms.uTime.value = time;
      tubeUniforms.uBass.value = bass + scrollEnergy * 0.22;
      tubeUniforms.uMid.value = mid + pointerSpeed * 0.25;
      tubeUniforms.uHigh.value = high;
      tubeUniforms.uImpulse.value = impulse;
      tubeUniforms.uPointer.value.copy(pointer);
      gridUniforms.uTime.value = time;
      gridUniforms.uBass.value = bass;
      gridUniforms.uMid.value = mid;
      gridUniforms.uImpulse.value = impulse;
      gridUniforms.uPointer.value.copy(pointer);

      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(interactionPlane, pointerWorld);
      const repulseRadius = 1.1 + bass * 1.3 + impulse * 0.8;
      for (let i = 0; i < particleCount; i += 1) {
        const i3 = i * 3;
        let x = positions[i3];
        let y = positions[i3 + 1];
        let z = positions[i3 + 2];
        let vx = velocities[i3];
        let vy = velocities[i3 + 1];
        let vz = velocities[i3 + 2];
        const dx = x - pointerWorld.x;
        const dy = y - pointerWorld.y;
        const distance = Math.sqrt(dx * dx + dy * dy) + 0.001;
        if (distance < repulseRadius) {
          const force = (1 - distance / repulseRadius) * (0.028 + pointerSpeed * 0.085 + impulse * 0.06);
          vx += (dx / distance) * force;
          vy += (dy / distance) * force;
          vz += force * 0.25;
        }
        vx += (homes[i3] - x) * 0.0065;
        vy += (homes[i3 + 1] - y) * 0.0065;
        vz += (homes[i3 + 2] - z) * 0.0065;
        vx *= 0.925;
        vy *= 0.925;
        vz *= 0.925;
        x += vx;
        y += vy;
        z += vz;
        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
        velocities[i3] = vx;
        velocities[i3 + 1] = vy;
        velocities[i3 + 2] = vz;
        const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
        energies[i] += (Math.min(1, speed * 24 + high * 0.7 + (i % 41 === frame % 41 ? bass : 0)) - energies[i]) * 0.16;
      }
      positionAttribute.needsUpdate = true;
      energyAttribute.needsUpdate = true;

      group.rotation.y = Math.sin(time * 0.1) * 0.06 + pointer.x * 0.07 + journey * 0.18;
      group.rotation.x = pointer.y * 0.035 + Math.sin(journey * 0.6) * 0.025;
      camera.position.x += (pointer.x * 0.32 - camera.position.x) * 0.025;
      camera.position.y += (pointer.y * 0.18 + Math.sin(time * 0.18) * 0.06 - camera.position.y) * 0.025;
      camera.position.z = 7.1 + Math.sin(journey * 0.4) * 0.35 - bass * 0.12;
      camera.lookAt(0, 0, 0);
      bloom.strength = 0.9 + bass * 0.7 + impulse * 0.38;
      bloom.radius = 0.62 + mid * 0.24;
      composer.render();
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationId);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
      tube.geometry.dispose();
      (tube.material as THREE.Material).dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      composer.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // The audio rig intentionally lives outside the render lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => stopAudioRig(), []);

  return (
    <main className={styles.shell}>
      <div ref={mountRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.ident}>
          <span className={styles.kicker}>VISUAL SYSTEM / PROOF 01</span>
          <span className={styles.status}><i /> REALTIME</span>
        </div>
        <div className={styles.audioArea}>
          <button
            className={`${styles.noteButton} ${awake && !muted ? styles.noteActive : ""}`}
            type="button"
            aria-label="Audio controls"
            aria-expanded={audioOpen}
            onClick={() => setAudioOpen((value) => !value)}
          >
            {muted ? "×" : "♫"}
          </button>
          {audioOpen && (
            <div className={styles.audioPanel}>
              <div>
                <span>NOW REACTING TO</span>
                <strong>{audioLabel}</strong>
              </div>
              <button type="button" onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</button>
              <button type="button" onClick={() => { stopAudioRig(); void startPrototypeScore(); setAudioOpen(false); }}>
                Prototype score
              </button>
              <label>
                Choose your track
                <input type="file" accept="audio/*" onChange={useUploadedTrack} />
              </label>
              <small>Selected files stay in this browser session.</small>
            </div>
          )}
        </div>
      </header>

      <section className={styles.titleBlock} aria-label="Signal Spine visual prototype">
        <p>LIQUID LIGHT / PARTICLE MEMORY / RECURSIVE SPACE</p>
        <h1>SIGNAL<br /><em>SPINE</em></h1>
        <div className={styles.rule} />
        <p className={styles.dek}>A reactive study for a portfolio world.<br />Move through it. Disturb it. Turn it up.</p>
      </section>

      <aside className={styles.readout} aria-hidden="true">
        <span>MATTER</span>
        <b>→</b>
        <span>SIGNAL</span>
        <b>→</b>
        <span>PARTICLE</span>
      </aside>

      <footer className={styles.footer}>
        <div className={styles.instructions}>
          <span>MOVE</span><span>CLICK</span><span>SCROLL</span>
        </div>
        <p>{awake ? "SOUND ONLINE" : "SOUND WAKES WITH FIRST INTERACTION"}</p>
      </footer>
    </main>
  );
}
