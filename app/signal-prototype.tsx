"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import styles from "./signal-prototype.module.css";

const screenVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const carbonPassShader = /* glsl */ `
  precision highp float;

  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uTime;
  uniform float uImpulse;
  varying vec2 vUv;

  float bounce;

  float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
  }

  void rotatePlane(inout vec2 p, float a) {
    p = cos(a) * p + sin(a) * vec2(p.y, -p.x);
  }

  float noise3(vec3 p) {
    vec3 ip = floor(p);
    p -= ip;
    vec3 s = vec3(7.0, 157.0, 113.0);
    vec4 h = vec4(0.0, s.y, s.z, s.y + s.z) + dot(ip, s);
    p = p * p * (3.0 - 2.0 * p);
    h = mix(fract(sin(h) * 43758.5), fract(sin(h + s.x) * 43758.5), p.x);
    h.xy = mix(h.xz, h.yw, p.y);
    return mix(h.x, h.y, p.z);
  }

  float mapCarbon(vec3 p) {
    p.z -= 1.0;
    p *= 0.9;
    rotatePlane(p.yz, bounce + 0.4 * p.x + uPointer.x * 0.045);
    float body = sdBox(
      p + vec3(0.0, sin(1.6 * uTime) * 0.92 + uPointer.y * 0.035, 0.0),
      vec3(20.0, 0.05, 1.2)
    );
    float fracture = 0.4 * noise3(8.0 * p + 3.0 * bounce);
    return body - fracture;
  }

  vec3 normalAt(vec3 p) {
    float e = 0.00012;
    float d = mapCarbon(p);
    return normalize(vec3(
      mapCarbon(p + vec3(e, 0.0, 0.0)) - d,
      mapCarbon(p + vec3(0.0, e, 0.0)) - d,
      mapCarbon(p + vec3(0.0, 0.0, e)) - d
    ));
  }

  float traceCarbon(vec3 ro, vec3 rd) {
    float functionSign = mapCarbon(ro) < 0.0 ? -1.0 : 1.0;
    float epsilon = 0.00012;
    float h = epsilon * 2.0;
    float t = 0.0;
    for (int i = 0; i < 120; i++) {
      if (abs(h) < epsilon || t > 12.0) break;
      h = functionSign * mapCarbon(ro + rd * t);
      t += h;
    }
    return t;
  }

  float traceRefraction(
    vec3 pos,
    vec3 lightDirection,
    vec3 direction,
    vec3 normal,
    float ratio,
    out float insideDistance,
    out vec3 exitNormal
  ) {
    float h = 0.0;
    insideDistance = 2.0;
    vec3 refractedDirection = refract(direction, normal, ratio);
    for (int i = 0; i < 50; i++) {
      if (abs(h) > 3.0) break;
      h = mapCarbon(pos + refractedDirection * insideDistance);
      insideDistance -= h;
    }
    exitNormal = normalAt(pos + refractedDirection * insideDistance);
    float transmission = 0.5 * clamp(dot(-lightDirection, exitNormal), 0.0, 1.0);
    float innerSpecular = pow(max(dot(reflect(refractedDirection, exitNormal), lightDirection), 0.0), 8.0);
    return transmission + innerSpecular;
  }

  float softShadow(vec3 ro, vec3 rd) {
    float shadow = 1.0;
    float t = 0.02;
    for (int i = 0; i < 22; i++) {
      if (t > 20.0) continue;
      float h = mapCarbon(ro + rd * t);
      shadow = min(shadow, 4.0 * h / t);
      t += h;
    }
    return shadow;
  }

  void main() {
    float time = uTime * 0.72;
    bounce = abs(fract(0.05 * time) - 0.5) * 20.0;

    vec2 fragCoord = vUv * uResolution;
    float beatWindow = step(0.90, fract(0.1 * (time - 1.0)));
    float wobble = beatWindow * fract(-time) * 0.1 * sin(30.0 * time);

    vec3 rayDirection = normalize(vec3(2.0 * fragCoord - uResolution, uResolution.y));
    vec3 rayOrigin = vec3(0.0, 2.0 * wobble + uPointer.y * 0.055, -3.0);

    vec3 surfaceLight = vec3(0.0);
    vec3 volumeLight = vec3(0.0);
    float surfaceDistance = traceCarbon(rayOrigin, rayDirection);
    vec3 surfacePosition = rayOrigin + rayDirection * surfaceDistance;
    vec3 surfaceNormal = normalAt(surfacePosition);
    vec3 lightDirection = normalize(vec3(0.2 + uPointer.x * 0.18, 6.0, 0.5));
    float depth = clamp(1.0 - 0.09 * surfaceDistance, 0.0, 1.0);
    vec3 exitNormal = vec3(0.0);

    if (surfaceDistance < 12.0) {
      float diffuse = max(dot(lightDirection, surfaceNormal), 0.0);
      float specular = pow(max(dot(reflect(rayDirection, surfaceNormal), lightDirection), 0.0), 16.0);
      surfaceLight = vec3(diffuse + specular);
      surfaceLight *= clamp(softShadow(surfacePosition, lightDirection), 0.0, 1.0);
      float insideDistance = 0.0;
      surfaceLight += traceRefraction(
        surfacePosition,
        lightDirection,
        rayDirection,
        surfaceNormal,
        0.9,
        insideDistance,
        exitNormal
      ) * depth;
      surfaceLight -= clamp(0.1 * insideDistance, 0.0, 1.0);
    }

    float transmittance = 1.0;
    float intensity = 0.1 * -sin(0.209 * time + 1.0) + 0.052 + uImpulse * 0.018;
    vec3 volumePosition = rayOrigin;
    for (int i = 0; i < 128; i++) {
      float nebula = noise3(volumePosition + bounce);
      float density = intensity - mapCarbon(volumePosition + 0.5 * exitNormal) * nebula;
      if (density > 0.0) {
        float absorption = density / 128.0;
        transmittance *= 1.0 - absorption * 100.0;
        if (transmittance <= 0.0) break;
      }
      volumePosition += rayDirection * 0.078;
    }

    vec3 absorptionColor = vec3(1.0, 0.25, 0.0625);
    transmittance = clamp(transmittance, 0.0, 1.5);
    volumeLight += absorptionColor * exp(4.0 * (0.5 - transmittance) - 0.8);
    surfaceLight *= depth;
    surfaceLight += (1.0 - depth) * noise3(6.0 * rayDirection + 0.3 * time) * 0.1;

    vec3 finalColor = (volumeLight + 0.8 * surfaceLight) * 1.3;
    float focusRadius = abs(0.67 - depth) * 2.0 + 4.0 * wobble;
    gl_FragColor = vec4(finalColor, focusRadius);
  }
`;

const depthOfFieldShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uSource;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uTime;
  uniform float uImpulse;
  varying vec2 vUv;

  const float GOLDEN_ANGLE = 2.39996323;

  mat2 rotation(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, s, -s, c);
  }

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec2 uv = vUv;
    float focus = texture2D(uSource, uv).a;
    vec2 pixel = vec2(0.002 * uResolution.y / uResolution.x, 0.002);
    vec2 angle = vec2(0.0, focus);
    mat2 rot = rotation(GOLDEN_ANGLE);
    float radius = 1.0;
    vec3 accumulation = vec3(0.0);

    for (int i = 0; i < 64; i++) {
      radius += 1.0 / radius;
      angle = rot * angle;
      vec2 offset = pixel * (radius - 1.0) * angle;
      vec3 sampleColor = texture2D(uSource, uv + offset).rgb;
      accumulation += sampleColor;
    }
    accumulation /= 64.0;

    vec2 centered = uv * 2.0 - 1.0;
    centered.x *= uResolution.x / uResolution.y;
    float vignette = 1.0 - smoothstep(0.45, 1.45, length(centered) * 0.72);
    float grain = hash21(gl_FragCoord.xy + floor(uTime * 24.0)) - 0.5;

    vec3 color = accumulation;
    color *= 0.68 + vignette * 0.44;
    color += grain * 0.009;
    color = color / (1.0 + color * 0.28);
    color = pow(max(color, 0.0), vec3(0.88));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function SignalPrototype() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

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

    let renderTarget = new THREE.WebGLRenderTarget(1, 1, {
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

    const pointer = new THREE.Vector2(0, 0);
    const pointerTarget = new THREE.Vector2(0, 0);
    let impulse = 0;
    let elapsed = 0;
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
      const studyScale = width > 1600 ? 0.54 : width > 900 ? 0.66 : 0.74;
      const targetWidth = Math.max(1, Math.floor(pixelWidth * studyScale));
      const targetHeight = Math.max(1, Math.floor(pixelHeight * studyScale));
      renderTarget.setSize(targetWidth, targetHeight);
      carbonUniforms.uResolution.value.set(targetWidth, targetHeight);
      finalUniforms.uResolution.value.set(pixelWidth, pixelHeight);
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

    const animate = (now: number) => {
      if (disposed) return;
      const delta = Math.min(0.04, (now - previousTime) / 1000);
      previousTime = now;
      if (!pausedRef.current) elapsed += delta;
      pointer.lerp(pointerTarget, 1.0 - Math.exp(-delta * 5.0));
      impulse *= Math.exp(-delta * 2.3);

      carbonUniforms.uTime.value = elapsed;
      carbonUniforms.uPointer.value.copy(pointer);
      carbonUniforms.uImpulse.value = impulse;
      finalUniforms.uTime.value = elapsed;
      finalUniforms.uPointer.value.copy(pointer);
      finalUniforms.uImpulse.value = impulse;

      renderer.setRenderTarget(renderTarget);
      renderer.render(carbonScene, camera);
      renderer.setRenderTarget(null);
      renderer.render(finalScene, camera);
      animationFrame = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    mount.addEventListener("pointermove", move);
    mount.addEventListener("pointerdown", excite);
    animationFrame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      mount.removeEventListener("pointermove", move);
      mount.removeEventListener("pointerdown", excite);
      renderTarget.dispose();
      carbonMaterial.dispose();
      finalMaterial.dispose();
      geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <main className={styles.shell}>
      <div ref={mountRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <header className={styles.header}>
        <div>
          <span>MATERIAL STUDY / 03</span>
          <strong>LIQUID CARBON</strong>
        </div>
        <div className={styles.live}><i /> TWO-PASS RENDER</div>
      </header>

      <aside className={styles.method}>
        <span>01 / SPHERETRACE</span>
        <span>02 / INNER REFRACTION</span>
        <span>03 / VOLUME ABSORPTION</span>
        <span>04 / DEPTH OF FIELD</span>
      </aside>

      <button className={styles.pause} type="button" onClick={togglePause}>
        <span>{paused ? "PLAY" : "PAUSE"}</span>
        <i>{paused ? "▶" : "Ⅱ"}</i>
      </button>

      <footer className={styles.footer}>
        <span>MOVE / BEND LIGHT</span>
        <span>CLICK / EXCITE CORE</span>
        <a href="https://www.shadertoy.com/view/llK3Dy" target="_blank" rel="noreferrer">
          REFERENCE / RHODIUM BY VIRGILL ↗
        </a>
      </footer>
    </main>
  );
}
