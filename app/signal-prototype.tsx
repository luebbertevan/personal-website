"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import styles from "./signal-prototype.module.css";

type AudioRig = {
  context: AudioContext;
  analyser: AnalyserNode;
  master: GainNode;
  sources: AudioNode[];
  element?: HTMLAudioElement;
  objectUrl?: string;
};

type ViewMode = "home" | "project";

const screenVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const carbonFragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uTime;
  uniform float uTravel;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  uniform float uImpulse;
  uniform float uProject;
  uniform float uChapter;

  #define PI 3.14159265359
  #define MAX_STEPS 76

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
          mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
          mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z
    );
  }

  float fbm(vec3 p) {
    float f = 0.0;
    float a = 0.52;
    mat3 m = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
    for (int i = 0; i < 5; i++) {
      f += a * noise3(p);
      p = m * p * 2.02 + vec3(1.7, 2.1, -1.3);
      a *= 0.48;
    }
    return f;
  }

  mat2 rotate2(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
  }

  vec2 path(float z) {
    float slow = z * 0.22;
    return vec2(
      sin(slow * 1.43 + sin(slow * 0.37) * 1.4) * 1.20 + sin(z * 0.61) * 0.12,
      cos(slow * 1.17 + 0.7) * 0.72 + sin(z * 0.47) * 0.20
    );
  }

  float carbonField(vec3 p) {
    vec3 q = p;
    q.xy -= path(p.z);
    q.xy = rotate2(p.z * 0.38 + sin(p.z * 0.31) * 0.7) * q.xy;
    float angle = atan(q.y, q.x);
    float coarse = fbm(vec3(q.xy * 2.1, p.z * 0.48) + vec3(0.0, 0.0, uTime * 0.035));
    float folded = abs(fbm(vec3(q.xy * 5.0, p.z * 0.85) - uTime * 0.025) - 0.52);
    float crust = fbm(vec3(q.xy * 11.0, p.z * 1.8) + 6.0);
    float radius = 0.62 + sin(p.z * 1.7 + coarse * 5.0) * 0.065;
    radius += (coarse - 0.48) * 0.34;
    radius += sin(angle * 3.0 + p.z * 1.35 + coarse * 4.0) * 0.065;
    float porous = smoothstep(0.52, 0.82, crust) * (0.035 + folded * 0.065);
    return length(q.xy * vec2(0.92, 1.07)) - radius + folded * 0.095 + porous;
  }

  vec3 normalAt(vec3 p) {
    float e = 0.0035;
    vec2 h = vec2(e, 0.0);
    return normalize(vec3(
      carbonField(p + h.xyy) - carbonField(p - h.xyy),
      carbonField(p + h.yxy) - carbonField(p - h.yxy),
      carbonField(p + h.yyx) - carbonField(p - h.yyx)
    ));
  }

  float softShadow(vec3 ro, vec3 rd) {
    float shade = 1.0;
    float t = 0.04;
    for (int i = 0; i < 20; i++) {
      float h = carbonField(ro + rd * t);
      shade = min(shade, 14.0 * h / t);
      t += clamp(h, 0.025, 0.18);
      if (h < 0.001 || t > 4.0) break;
    }
    return clamp(shade, 0.12, 1.0);
  }

  float ambientOcclusion(vec3 p, vec3 n) {
    float occ = 0.0;
    float weight = 1.0;
    for (int i = 1; i < 6; i++) {
      float d = float(i) * 0.055;
      occ += (d - carbonField(p + n * d)) * weight;
      weight *= 0.62;
    }
    return clamp(1.0 - occ * 2.7, 0.18, 1.0);
  }

  vec3 gridConstellation(vec2 uv, vec3 rd) {
    vec2 p = uv;
    p += uPointer * 0.018 / (0.35 + length(p - uPointer * 0.42));
    vec2 cell = floor(p * 15.0);
    vec2 local = fract(p * 15.0) - 0.5;
    float star = 0.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 id = cell + vec2(float(x), float(y));
        vec2 offset = vec2(hash21(id), hash21(id + 41.7)) - 0.5;
        vec2 delta = local - vec2(float(x), float(y)) - offset * 0.72;
        float pulse = 0.62 + 0.38 * sin(uTime * (0.45 + hash21(id + 8.0)) + hash21(id) * 20.0);
        star += exp(-length(delta) * 34.0) * pulse * step(0.72, hash21(id + 4.0));
      }
    }
    vec2 fine = abs(fract(p * 30.0) - 0.5);
    float grid = (smoothstep(0.495, 0.475, fine.x) + smoothstep(0.495, 0.475, fine.y));
    float horizon = pow(max(0.0, 1.0 - abs(rd.y + 0.08)), 12.0);
    float wake = exp(-length(uv - uPointer * vec2(0.55, 0.35)) * 4.8);
    vec3 cool = vec3(0.07, 0.24, 0.34) * grid * (0.025 + wake * 0.12);
    cool += vec3(0.24, 0.68, 0.78) * star * (0.18 + uHigh * 0.3);
    cool += vec3(0.12, 0.20, 0.24) * horizon * 0.08;
    return cool;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;
    uv.y *= -1.0;

    float z = uTravel;
    vec3 center = vec3(path(z), z);
    vec3 ahead = vec3(path(z + 1.25), z + 1.25);
    vec3 tangent = normalize(ahead - center);
    vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), tangent));
    vec3 up = normalize(cross(tangent, side));

    float chapterEase = smoothstep(0.0, 1.0, uChapter);
    float orbit = 0.38 * sin(z * 0.43) + chapterEase * (uChapter - 0.5) * 1.75;
    float distanceFromSpine = mix(2.55, 2.05 + sin(uChapter * PI) * 0.65, uProject);
    vec3 ro = center + side * cos(orbit) * distanceFromSpine + up * sin(orbit) * distanceFromSpine;
    ro -= tangent * mix(0.90, 0.42, uProject);
    ro += (side * uPointer.x + up * uPointer.y) * 0.09;
    vec3 ta = vec3(path(z + mix(1.65, 0.80, uProject)), z + mix(1.65, 0.80, uProject));

    vec3 forward = normalize(ta - ro);
    vec3 right = normalize(cross(forward, up));
    vec3 cameraUp = cross(right, forward);
    float focal = mix(1.42, 1.62, uProject);
    vec3 rd = normalize(forward * focal + right * uv.x + cameraUp * uv.y);

    float t = 0.0;
    float halo = 0.0;
    float hit = 0.0;
    vec3 p = ro;
    for (int i = 0; i < MAX_STEPS; i++) {
      p = ro + rd * t;
      float d = carbonField(p);
      float proximity = exp(-abs(d) * 18.0);
      float emberProbe = smoothstep(0.54, 0.83, fbm(p * 2.35 + vec3(0.0, 0.0, -uTime * 0.06)));
      halo += proximity * emberProbe * 0.0045;
      if (d < 0.0015 + t * 0.00045) {
        hit = 1.0;
        break;
      }
      t += max(0.012, d * 0.62);
      if (t > 10.0) break;
    }

    vec3 color = vec3(0.005, 0.006, 0.008);
    color += gridConstellation(uv, rd);
    color += vec3(1.0, 0.18, 0.025) * halo * (1.2 + uBass * 2.2 + uImpulse);

    if (hit > 0.5) {
      vec3 n = normalAt(p);
      vec3 view = normalize(ro - p);
      vec3 lightDir = normalize(vec3(-0.55, 0.72, -0.35));
      vec3 warmDir = normalize(vec3(0.65, -0.15, -0.45));
      float diffuse = max(dot(n, lightDir), 0.0);
      float warmDiffuse = max(dot(n, warmDir), 0.0);
      float shadow = softShadow(p + n * 0.012, lightDir);
      float ao = ambientOcclusion(p, n);
      float fresnel = pow(1.0 - max(dot(n, view), 0.0), 3.2);
      vec3 halfDir = normalize(lightDir + view);
      float spec = pow(max(dot(n, halfDir), 0.0), 76.0) * shadow;
      float broadSpec = pow(max(dot(reflect(-view, n), lightDir), 0.0), 8.0);

      float mineral = fbm(p * 3.05 + vec3(0.0, 0.0, uTime * 0.025));
      float veins = fbm(p * 7.2 - vec3(0.0, 0.0, uTime * 0.045));
      float molten = smoothstep(0.58 - uBass * 0.08, 0.79, mineral + veins * 0.19);
      molten *= smoothstep(0.08, 0.48, 1.0 - diffuse + veins * 0.3);
      float pulse = 0.72 + 0.28 * sin(p.z * 2.8 - uTime * (1.1 + uBass));

      vec3 carbon = mix(vec3(0.006, 0.007, 0.009), vec3(0.10, 0.105, 0.11), diffuse * ao);
      carbon += vec3(0.52, 0.58, 0.62) * broadSpec * 0.48;
      carbon += vec3(1.35, 1.45, 1.52) * spec * (0.68 + uHigh);
      carbon += vec3(0.36, 0.44, 0.48) * fresnel * (0.35 + ao * 0.5);
      carbon *= ao;

      vec3 ember = mix(vec3(0.42, 0.012, 0.002), vec3(1.85, 0.29, 0.018), mineral);
      ember += vec3(1.45, 0.72, 0.18) * pow(molten, 3.0);
      vec3 cyanAccent = vec3(0.05, 0.65, 0.86) * fresnel * uImpulse * (0.4 + pulse);
      color = carbon + ember * molten * pulse * (0.8 + uBass * 1.8) + cyanAccent;

      float fog = smoothstep(4.0, 9.5, t);
      color = mix(color, vec3(0.008, 0.006, 0.006), fog * 0.72);
    }

    float vignette = 1.0 - smoothstep(0.42, 1.42, length(uv * vec2(0.72, 0.92)));
    color *= 0.55 + vignette * 0.58;
    color = color / (1.0 + color * 0.34);
    color = pow(color, vec3(0.88));
    gl_FragColor = vec4(color, 1.0);
  }
`;

const pointVertexShader = /* glsl */ `
  attribute float aEnergy;
  uniform float uPixelRatio;
  varying float vEnergy;
  void main() {
    vEnergy = aEnergy;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = min(18.0, (1.6 + aEnergy * 9.0) * uPixelRatio);
    gl_Position = projectionMatrix * mv;
  }
`;

const pointFragmentShader = /* glsl */ `
  varying float vEnergy;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    float core = smoothstep(0.38, 0.01, d);
    float halo = exp(-d * 8.0);
    vec3 cool = vec3(0.18, 0.70, 0.92);
    vec3 hot = vec3(2.3, 0.24, 0.035);
    vec3 color = mix(cool, hot, clamp(vEnergy * 1.2, 0.0, 1.0));
    gl_FragColor = vec4(color * (core + halo * 0.65), core * 0.88);
  }
`;

function averageBand(data: Uint8Array, from: number, to: number) {
  let sum = 0;
  const end = Math.min(data.length, to);
  for (let i = from; i < end; i += 1) sum += data[i];
  return sum / Math.max(1, end - from) / 255;
}

export function SignalPrototype() {
  const mountRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioRig | null>(null);
  const mutedRef = useRef(false);
  const viewRef = useRef<ViewMode>("home");
  const destinationRef = useRef(0);
  const entryProgressRef = useRef(0);
  const [view, setView] = useState<ViewMode>("home");
  const [entryProgress, setEntryProgress] = useState(0);
  const [audioOpen, setAudioOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [awake, setAwake] = useState(false);
  const [audioLabel, setAudioLabel] = useState("Curated signal");

  const stopAudio = useCallback(() => {
    const rig = audioRef.current;
    if (!rig) return;
    rig.element?.pause();
    rig.sources.forEach((source) => {
      if ("stop" in source && typeof source.stop === "function") {
        try { source.stop(); } catch { /* already stopped */ }
      }
      try { source.disconnect(); } catch { /* already disconnected */ }
    });
    if (rig.objectUrl) URL.revokeObjectURL(rig.objectUrl);
    void rig.context.close();
    audioRef.current = null;
  }, []);

  const startScore = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.context.resume();
      setAwake(true);
      return;
    }
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    const master = context.createGain();
    master.gain.value = mutedRef.current ? 0 : 0.30;
    master.connect(analyser);
    analyser.connect(context.destination);

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 720;
    filter.Q.value = 2.2;
    filter.connect(master);
    const sources: AudioNode[] = [master, analyser, filter];
    [48.99, 73.42, 98.0, 146.83].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index < 2 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index % 2 ? 7 : -5;
      gain.gain.value = index === 0 ? 0.19 : 0.045;
      oscillator.connect(gain).connect(filter);
      oscillator.start();
      sources.push(oscillator, gain);
    });

    const pulse = context.createOscillator();
    const pulseGain = context.createGain();
    pulse.type = "sine";
    pulse.frequency.value = 0.11;
    pulseGain.gain.value = 0.025;
    pulse.connect(pulseGain).connect(master);
    pulse.start();
    sources.push(pulse, pulseGain);

    audioRef.current = { context, analyser, master, sources };
    await context.resume();
    setAwake(true);
  }, []);

  const loadTrack = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    stopAudio();
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    const master = context.createGain();
    master.gain.value = mutedRef.current ? 0 : 0.58;
    master.connect(analyser);
    analyser.connect(context.destination);
    const objectUrl = URL.createObjectURL(file);
    const element = new Audio(objectUrl);
    element.loop = true;
    const source = context.createMediaElementSource(element);
    source.connect(master);
    audioRef.current = { context, analyser, master, sources: [source, master, analyser], element, objectUrl };
    await context.resume();
    await element.play();
    setAudioLabel(file.name);
    setAwake(true);
    setAudioOpen(false);
  };

  const toggleMute = async () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (!audioRef.current) await startScore();
    if (audioRef.current) {
      audioRef.current.master.gain.setTargetAtTime(next ? 0 : 0.3, audioRef.current.context.currentTime, 0.08);
    }
  };

  const selectView = (next: ViewMode) => {
    viewRef.current = next;
    setView(next);
    if (next === "project") {
      destinationRef.current = 9.2;
      entryProgressRef.current = 0;
      setEntryProgress(0);
    } else {
      destinationRef.current = 0;
    }
    void startScore();
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 20);
    camera.position.z = 4;

    const uniforms = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uBass: { value: 0.12 },
      uMid: { value: 0.08 },
      uHigh: { value: 0.06 },
      uImpulse: { value: 0 },
      uProject: { value: 0 },
      uChapter: { value: 0 },
    };

    const screenMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: screenVertexShader,
      fragmentShader: carbonFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), screenMaterial);
    screen.frustumCulled = false;
    screen.renderOrder = -10;
    scene.add(screen);

    const particleCount = window.innerWidth < 700 ? 170 : 320;
    const positions = new Float32Array(particleCount * 3);
    const origins = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const energies = new Float32Array(particleCount);
    const seed = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 0.20 + Math.pow(Math.random(), 0.75) * 0.88;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.66;
      positions[i * 3] = origins[i * 3] = x;
      positions[i * 3 + 1] = origins[i * 3 + 1] = y;
      positions[i * 3 + 2] = origins[i * 3 + 2] = 1;
      seed[i] = Math.random();
    }
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute("aEnergy", new THREE.BufferAttribute(energies, 1));
    const pointMaterial = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: 1 } },
      vertexShader: pointVertexShader,
      fragmentShader: pointFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pointsGeometry, pointMaterial);
    points.renderOrder = 5;
    scene.add(points);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.48, 0.72, 0.58);
    composer.addPass(bloom);

    const pointer = new THREE.Vector2(0, 0);
    const pointerTarget = new THREE.Vector2(0, 0);
    let travel = 0;
    let impulse = 0;
    let lastTime = performance.now();
    let animationFrame = 0;
    let disposed = false;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      const quality = width > 1500 ? 0.86 : width < 700 ? 0.72 : 1;
      const dpr = Math.min(window.devicePixelRatio, 1.25) * quality;
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      composer.setPixelRatio(dpr);
      composer.setSize(width, height);
      uniforms.uResolution.value.set(width * dpr, height * dpr);
      const aspect = width / height;
      camera.left = -aspect;
      camera.right = aspect;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
      pointMaterial.uniforms.uPixelRatio.value = dpr;
    };

    const move = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointerTarget.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
    };

    const press = () => {
      impulse = 1;
      void startScore();
    };

    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const normalized = Math.sign(event.deltaY) * Math.min(Math.abs(event.deltaY), 120);
      if (viewRef.current === "project") {
        const next = THREE.MathUtils.clamp(entryProgressRef.current + normalized * 0.0018, 0, 1);
        entryProgressRef.current = next;
        setEntryProgress(next);
        destinationRef.current = 9.2 + (next - 0.5) * 2.6;
      } else {
        destinationRef.current += normalized * 0.009;
      }
      impulse = Math.min(1, impulse + Math.abs(normalized) * 0.006);
      void startScore();
    };

    const keydown = (event: KeyboardEvent) => {
      const direction = event.key === "ArrowDown" || event.key === "PageDown" || event.key === " "
        ? 1
        : event.key === "ArrowUp" || event.key === "PageUp"
          ? -1
          : 0;
      if (!direction) return;
      event.preventDefault();
      if (viewRef.current === "project") {
        const next = THREE.MathUtils.clamp(entryProgressRef.current + direction * 0.24, 0, 1);
        entryProgressRef.current = next;
        setEntryProgress(next);
        destinationRef.current = 9.2 + (next - 0.5) * 2.6;
      } else {
        destinationRef.current += direction * 0.9;
      }
      impulse = Math.min(1, impulse + 0.42);
      void startScore();
    };

    const animate = (now: number) => {
      if (disposed) return;
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;
      const seconds = now / 1000;
      pointer.lerp(pointerTarget, 1 - Math.exp(-dt * 8));
      travel = THREE.MathUtils.lerp(travel, destinationRef.current, 1 - Math.exp(-dt * 4.8));
      impulse *= Math.exp(-dt * 2.8);

      let bass = 0.10 + Math.sin(seconds * 1.15) * 0.025;
      let mid = 0.07 + Math.sin(seconds * 1.83 + 1.1) * 0.018;
      let high = 0.05 + Math.sin(seconds * 3.3) * 0.014;
      const rig = audioRef.current;
      if (rig) {
        const data = new Uint8Array(rig.analyser.frequencyBinCount);
        rig.analyser.getByteFrequencyData(data);
        bass = averageBand(data, 0, 8);
        mid = averageBand(data, 8, 28);
        high = averageBand(data, 28, 68);
      }
      uniforms.uTime.value = seconds;
      uniforms.uTravel.value = travel;
      uniforms.uPointer.value.copy(pointer);
      uniforms.uBass.value = THREE.MathUtils.lerp(uniforms.uBass.value, bass, 0.12);
      uniforms.uMid.value = THREE.MathUtils.lerp(uniforms.uMid.value, mid, 0.10);
      uniforms.uHigh.value = THREE.MathUtils.lerp(uniforms.uHigh.value, high, 0.10);
      uniforms.uImpulse.value = impulse;
      uniforms.uProject.value = THREE.MathUtils.lerp(uniforms.uProject.value, viewRef.current === "project" ? 1 : 0, 0.065);
      uniforms.uChapter.value = THREE.MathUtils.lerp(uniforms.uChapter.value, entryProgressRef.current, 0.08);

      const aspect = mount.clientWidth / Math.max(1, mount.clientHeight);
      for (let i = 0; i < particleCount; i += 1) {
        const j = i * 3;
        const ox = origins[j] * aspect;
        const oy = origins[j + 1];
        const idleX = Math.sin(seconds * (0.13 + seed[i] * 0.16) + seed[i] * 20) * 0.018;
        const idleY = Math.cos(seconds * (0.11 + seed[i] * 0.13) + seed[i] * 17) * 0.014;
        velocities[j] += (ox + idleX - positions[j]) * 0.045;
        velocities[j + 1] += (oy + idleY - positions[j + 1]) * 0.045;
        const dx = positions[j] - pointer.x * aspect;
        const dy = positions[j + 1] - pointer.y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < 0.11) {
          const force = (0.11 - distanceSq) / (distanceSq + 0.016);
          velocities[j] += dx * force * 0.028;
          velocities[j + 1] += dy * force * 0.028;
          energies[i] = Math.min(1, energies[i] + force * 0.06);
        }
        velocities[j] *= 0.91;
        velocities[j + 1] *= 0.91;
        positions[j] += velocities[j];
        positions[j + 1] += velocities[j + 1];
        energies[i] *= 0.94;
      }
      (pointsGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (pointsGeometry.attributes.aEnergy as THREE.BufferAttribute).needsUpdate = true;

      composer.render();
      animationFrame = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", keydown);
    mount.addEventListener("pointermove", move);
    mount.addEventListener("pointerdown", press);
    mount.addEventListener("wheel", wheel, { passive: false });
    animationFrame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keydown);
      mount.removeEventListener("pointermove", move);
      mount.removeEventListener("pointerdown", press);
      mount.removeEventListener("wheel", wheel);
      pointsGeometry.dispose();
      pointMaterial.dispose();
      screen.geometry.dispose();
      screenMaterial.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [startScore]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const chapter = entryProgress < 0.28 ? "TITLE" : entryProgress < 0.68 ? "STORY" : "LINK";

  return (
    <main className={styles.shell}>
      <div ref={mountRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.vignette} />

      <header className={styles.header}>
        <div className={styles.ident}>
          <span>EVAN / PORTFOLIO POC</span>
          <span className={styles.status}><i /> LIVE SIGNAL</span>
        </div>
        <div className={styles.audioArea}>
          <button
            className={`${styles.noteButton} ${awake && !muted ? styles.noteActive : ""}`}
            type="button"
            aria-label="Open audio controls"
            aria-expanded={audioOpen}
            onClick={() => { setAudioOpen((open) => !open); void startScore(); }}
          >
            <span aria-hidden="true">♫</span>
          </button>
          {audioOpen && (
            <div className={styles.audioPanel}>
              <div><span>NOW REACTING TO</span><strong>{audioLabel}</strong><small>Starts with your first gesture</small></div>
              <button type="button" onClick={toggleMute}>{muted ? "Unmute score" : "Mute score"}</button>
              <label>Choose your own track<input type="file" accept="audio/*" onChange={loadTrack} /></label>
            </div>
          )}
        </div>
      </header>

      <nav className={styles.index} aria-label="Portfolio index">
        <p>SELECT / JUMP</p>
        <button type="button" className={view === "home" ? styles.selected : ""} onClick={() => selectView("home")}>
          <span>00</span><strong>ORIGIN</strong><i>HOME</i>
        </button>
        <button type="button" className={view === "project" ? styles.selected : ""} onClick={() => selectView("project")}>
          <span>01</span><strong>LUMEN INDEX</strong><i>REALTIME SYSTEM</i>
        </button>
        <div className={styles.future}><span>02—04</span><strong>MORE SIGNALS</strong><i>AVAILABLE HERE</i></div>
      </nav>

      <section className={`${styles.homeCopy} ${view === "home" ? styles.visible : ""}`} aria-hidden={view !== "home"}>
        <p>CREATIVE TECHNOLOGIST / DIGITAL DESIGNER</p>
        <h1>EVAN<br /><em>LUEBBERT</em></h1>
        <div className={styles.rule} />
        <p className={styles.dek}>Interactive systems, spatial interfaces, and work that makes complex ideas feel inevitable.</p>
      </section>

      <article className={`${styles.projectCard} ${view === "project" ? styles.visible : ""}`} aria-hidden={view !== "project"}>
        <div className={styles.projectMeta}><span>PROJECT 01 / 2026</span><span>{chapter}</span></div>
        <div className={`${styles.projectStage} ${entryProgress < 0.46 ? styles.stageVisible : ""}`}>
          <p>REALTIME ENVIRONMENTAL SYSTEM</p>
          <h2>LUMEN<br />INDEX</h2>
          <span className={styles.projectSub}>A living interface for the invisible conditions around us.</span>
        </div>
        <div className={`${styles.projectStage} ${entryProgress >= 0.28 && entryProgress < 0.82 ? styles.stageVisible : ""}`}>
          <p>THE WORK</p>
          <h3>DATA THAT<br />BEHAVES LIKE WEATHER.</h3>
          <p className={styles.projectBody}>Lumen Index turns live air, light, and movement data into a spatial instrument. I designed the visual language, interaction model, and realtime rendering system—making a dense stream of measurements legible through motion.</p>
        </div>
        <div className={`${styles.projectStage} ${entryProgress >= 0.65 ? styles.stageVisible : ""}`}>
          <p>EXPLORE THE OUTCOME</p>
          <h3>ENTER THE<br />FULL SIGNAL.</h3>
          <a href="#project-01" onClick={(event) => event.preventDefault()}>VIEW CASE STUDY <span>↗</span></a>
        </div>
      </article>

      <aside className={styles.telemetry}>
        <span>{view === "home" ? "FREE TRAVEL" : `ENTRY ${String(Math.round(entryProgress * 100)).padStart(2, "0")}%`}</span>
        <div><i style={{ transform: `scaleX(${view === "home" ? 0.18 : Math.max(0.025, entryProgress)})` }} /></div>
        <b>SCROLL</b>
      </aside>

      <footer className={styles.footer}>
        <span>MOVE / DISRUPT</span><span>SCROLL / TRAVEL</span><span>CLICK / EXCITE</span>
        <strong>{view === "home" ? "CHOOSE A SIGNAL AT LEFT" : "PROJECT ANCHOR 09.2"}</strong>
      </footer>
    </main>
  );
}
