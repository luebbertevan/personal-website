import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";

const SIMULATION_SIZE = 128;

const positionShader = /* glsl */ `
  uniform float uDelta;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 positionState = texture2D(texturePosition, uv);
    vec3 velocity = texture2D(textureVelocity, uv).xyz;
    positionState.xyz += velocity * uDelta;
    gl_FragColor = positionState;
  }
`;

const velocityShader = /* glsl */ `
  uniform float uDelta;
  uniform float uTime;
  uniform float uTransitionActive;
  uniform float uTransitionProgress;
  uniform float uTravelDirection;
  uniform float uCameraVelocity;
  uniform float uImpulse;
  uniform vec2 uPointer;
  uniform vec2 uAnchor;
  uniform vec2 uStrandTangent;
  uniform vec4 uPanelBounds;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec2 frameTarget(float selector, float lane) {
    float left = uPanelBounds.x;
    float right = uPanelBounds.y;
    float bottom = uPanelBounds.z;
    float top = uPanelBounds.w;
    float edge = fract(lane * 4.0);
    float side = floor(fract(selector * 7.17) * 4.0);

    vec2 target = vec2(left, mix(bottom, top, edge));
    if (side > 0.5 && side < 1.5) target = vec2(mix(left, right, edge), top);
    if (side > 1.5 && side < 2.5) target = vec2(right, mix(top, bottom, edge));
    if (side > 2.5) target = vec2(mix(right, left, edge), bottom);

    float rail = step(0.78, fract(selector * 13.31));
    float railY = mix(top - 0.055, bottom + 0.07, step(0.5, fract(selector * 21.7)));
    target = mix(target, vec2(mix(left + 0.02, right - 0.14, edge), railY), rail);
    return target;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 positionState = texture2D(texturePosition, uv);
    vec3 velocity = texture2D(textureVelocity, uv).xyz;
    vec2 position = positionState.xy;
    float seed = positionState.w;
    float lane = hash12(uv * 91.73 + seed * 17.0);
    float phase = hash12(uv.yx * 47.11 + seed * 39.0);

    vec2 tangent = normalize(uStrandTangent + vec2(0.0001, 0.0));
    vec2 normal = vec2(-tangent.y, tangent.x);
    float along = (lane - 0.5) * 1.45;
    float orbit = sin(uTime * (0.32 + phase * 0.34) + phase * 18.0);
    float orbitWide = cos(uTime * 0.21 + lane * 25.0);
    vec2 ambientTarget = uAnchor
      + tangent * (along + 0.055 * orbitWide)
      + normal * (orbit * (0.035 + 0.105 * phase));

    vec2 structureTarget = frameTarget(seed + uv.x, lane);
    structureTarget += normal * sin(uTime * 0.42 + seed * 31.0) * 0.0025;
    float structureGroup = smoothstep(0.56, 0.68, seed);
    vec2 settledTarget = mix(ambientTarget, structureTarget, structureGroup);

    float collapse = smoothstep(0.02, 0.32, uTransitionProgress) * uTransitionActive;
    float assemble = smoothstep(0.62, 0.98, uTransitionProgress) * uTransitionActive;
    float inTransit = collapse * (1.0 - assemble);
    vec2 streamTarget = uAnchor
      + tangent * ((lane - 0.5) * 1.75 - uTravelDirection * (0.10 + phase * 0.18))
      + normal * sin(uTime * 1.15 + seed * 41.0) * (0.045 + 0.07 * phase);
    vec2 target = mix(settledTarget, streamTarget, inTransit);

    vec2 toTarget = target - position;
    float spring = mix(3.6, 7.8, structureGroup);
    spring += inTransit * 2.8;
    vec2 acceleration = toTarget * spring;

    float field = sin(position.x * 10.0 + uTime * 0.55 + seed * 27.0)
      + cos(position.y * 13.0 - uTime * 0.43 + phase * 19.0);
    acceleration += normal * field * mix(0.012, 0.045, 1.0 - structureGroup);

    vec2 pointerDelta = position - uPointer;
    float pointerDistance = length(pointerDelta);
    float influenceRadius = 0.19 + phase * 0.08;
    float pointerInfluence = 1.0 - smoothstep(0.0, influenceRadius, pointerDistance);
    vec2 pointerDirection = pointerDelta / max(pointerDistance, 0.018);
    acceleration += pointerDirection * pointerInfluence * (1.2 + 2.2 * uImpulse) * (0.65 + phase);
    acceleration += normal * pointerInfluence * uImpulse * (phase - 0.5) * 1.8;

    acceleration += tangent * clamp(uCameraVelocity * 0.003, -0.12, 0.12) * (0.25 + phase);
    velocity.xy += acceleration * uDelta;
    velocity.xy *= exp(-mix(2.25, 3.4, structureGroup) * uDelta);
    float speed = length(velocity.xy);
    if (speed > 0.72) velocity.xy *= 0.72 / speed;
    velocity.z = mix(velocity.z, orbit * 0.08, 1.0 - exp(-uDelta * 1.8));
    gl_FragColor = vec4(velocity, 1.0);
  }
`;

const particleVertexShader = /* glsl */ `
  uniform sampler2D texturePosition;
  uniform sampler2D textureVelocity;
  uniform vec2 uResolution;
  uniform vec2 uStrandTangent;
  attribute vec2 particleUv;
  attribute float particleSeed;
  varying vec2 vParticleUv;
  varying float vSpeed;
  varying float vSeed;

  void main() {
    vec4 positionState = texture2D(texturePosition, particleUv);
    vec3 velocity = texture2D(textureVelocity, particleUv).xyz;
    float speed = length(velocity.xy);
    vec2 direction = normalize(velocity.xy + normalize(uStrandTangent) * 0.0025);
    vec2 normal = vec2(-direction.y, direction.x);
    float depthScale = 0.72 + 0.50 * positionState.z;
    float width = (0.0021 + particleSeed * 0.0018) * depthScale;
    float trail = (0.0045 + min(speed * 0.13, 0.040)) * depthScale;
    vec2 offset = direction * position.x * trail + normal * position.y * width;
    offset.x *= uResolution.y / max(uResolution.x, 1.0);

    gl_Position = vec4(positionState.xy + offset, 0.0, 1.0);
    vParticleUv = uv;
    vSpeed = speed;
    vSeed = particleSeed;
  }
`;

const particleFragmentShader = /* glsl */ `
  uniform vec3 uPaletteColor;
  uniform float uOpacity;
  varying vec2 vParticleUv;
  varying float vSpeed;
  varying float vSeed;

  void main() {
    vec2 p = vParticleUv - 0.5;
    float radius = length(vec2(p.x * 0.66, p.y));
    float halo = 1.0 - smoothstep(0.12, 0.52, radius);
    float core = 1.0 - smoothstep(0.02, 0.17, radius);
    float heat = smoothstep(0.012, 0.18, vSpeed);
    vec3 hotColor = mix(vec3(1.0, 0.84, 0.62), vec3(0.92, 0.98, 1.0), step(uPaletteColor.b, uPaletteColor.r));
    vec3 color = mix(uPaletteColor * (0.72 + vSeed * 0.42), hotColor, heat * 0.82 + core * 0.12);
    float alpha = (halo * 0.16 + core * (0.48 + heat * 0.52)) * uOpacity;
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

export type EmberLoomFrame = {
  delta: number;
  time: number;
  pointer: THREE.Vector2;
  impulse: number;
  anchor: THREE.Vector2;
  strandTangent: THREE.Vector2;
  panelBounds: THREE.Vector4;
  palette: THREE.Vector3;
  transitionActive: number;
  transitionProgress: number;
  travelDirection: number;
  cameraVelocity: number;
};

export type EmberLoom = {
  scene: THREE.Scene;
  update: (frame: EmberLoomFrame) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

export function createEmberLoom(renderer: THREE.WebGLRenderer): EmberLoom | null {
  const gpuCompute = new GPUComputationRenderer(SIMULATION_SIZE, SIMULATION_SIZE, renderer);
  const positionTexture = gpuCompute.createTexture();
  const velocityTexture = gpuCompute.createTexture();
  const positionData = positionTexture.image.data;
  const velocityData = velocityTexture.image.data;
  const particleCount = SIMULATION_SIZE * SIMULATION_SIZE;

  for (let i = 0; i < particleCount; i += 1) {
    const offset = i * 4;
    const seed = (Math.sin(i * 91.371) * 43758.5453) % 1;
    const normalizedSeed = seed < 0 ? seed + 1 : seed;
    const angle = normalizedSeed * Math.PI * 2;
    const radius = 0.08 + ((i * 17) % 97) / 97 * 0.62;
    positionData[offset] = -0.28 + Math.cos(angle) * radius;
    positionData[offset + 1] = Math.sin(angle) * radius * 0.32;
    positionData[offset + 2] = ((i * 43) % 101) / 100;
    positionData[offset + 3] = normalizedSeed;
    velocityData[offset] = 0;
    velocityData[offset + 1] = 0;
    velocityData[offset + 2] = 0;
    velocityData[offset + 3] = 1;
  }

  const positionVariable = gpuCompute.addVariable("texturePosition", positionShader, positionTexture);
  const velocityVariable = gpuCompute.addVariable("textureVelocity", velocityShader, velocityTexture);
  gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);
  gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);

  positionVariable.material.uniforms.uDelta = { value: 0.016 };
  velocityVariable.material.uniforms.uDelta = { value: 0.016 };
  velocityVariable.material.uniforms.uTime = { value: 0 };
  velocityVariable.material.uniforms.uTransitionActive = { value: 0 };
  velocityVariable.material.uniforms.uTransitionProgress = { value: 0 };
  velocityVariable.material.uniforms.uTravelDirection = { value: 1 };
  velocityVariable.material.uniforms.uCameraVelocity = { value: 0 };
  velocityVariable.material.uniforms.uImpulse = { value: 0 };
  velocityVariable.material.uniforms.uPointer = { value: new THREE.Vector2() };
  velocityVariable.material.uniforms.uAnchor = { value: new THREE.Vector2(-0.28, 0) };
  velocityVariable.material.uniforms.uStrandTangent = { value: new THREE.Vector2(1, 0) };
  velocityVariable.material.uniforms.uPanelBounds = { value: new THREE.Vector4(0.05, 0.92, -0.72, 0.72) };

  const initError = gpuCompute.init();
  if (initError) {
    positionTexture.dispose();
    velocityTexture.dispose();
    return null;
  }

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -1, -1, 0,
    1, -1, 0,
    1, 1, 0,
    -1, 1, 0,
  ], 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute([
    0, 0,
    1, 0,
    1, 1,
    0, 1,
  ], 2));

  const particleUvs = new Float32Array(particleCount * 2);
  const particleSeeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i += 1) {
    particleUvs[i * 2] = (i % SIMULATION_SIZE + 0.5) / SIMULATION_SIZE;
    particleUvs[i * 2 + 1] = (Math.floor(i / SIMULATION_SIZE) + 0.5) / SIMULATION_SIZE;
    particleSeeds[i] = positionData[i * 4 + 3];
  }
  geometry.setAttribute("particleUv", new THREE.InstancedBufferAttribute(particleUvs, 2));
  geometry.setAttribute("particleSeed", new THREE.InstancedBufferAttribute(particleSeeds, 1));
  geometry.instanceCount = particleCount;

  const renderUniforms = {
    texturePosition: { value: gpuCompute.getCurrentRenderTarget(positionVariable).texture },
    textureVelocity: { value: gpuCompute.getCurrentRenderTarget(velocityVariable).texture },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uStrandTangent: { value: new THREE.Vector2(1, 0) },
    uPaletteColor: { value: new THREE.Vector3(1, 0.25, 0.0625) },
    uOpacity: { value: 0.88 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms: renderUniforms,
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);

  return {
    scene,
    update(frame) {
      const delta = Math.min(frame.delta, 0.033);
      positionVariable.material.uniforms.uDelta.value = delta;
      velocityVariable.material.uniforms.uDelta.value = delta;
      velocityVariable.material.uniforms.uTime.value = frame.time;
      velocityVariable.material.uniforms.uTransitionActive.value = frame.transitionActive;
      velocityVariable.material.uniforms.uTransitionProgress.value = frame.transitionProgress;
      velocityVariable.material.uniforms.uTravelDirection.value = frame.travelDirection;
      velocityVariable.material.uniforms.uCameraVelocity.value = frame.cameraVelocity;
      velocityVariable.material.uniforms.uImpulse.value = frame.impulse;
      velocityVariable.material.uniforms.uPointer.value.copy(frame.pointer);
      velocityVariable.material.uniforms.uAnchor.value.copy(frame.anchor);
      velocityVariable.material.uniforms.uStrandTangent.value.copy(frame.strandTangent);
      velocityVariable.material.uniforms.uPanelBounds.value.copy(frame.panelBounds);
      renderUniforms.uStrandTangent.value.copy(frame.strandTangent);
      renderUniforms.uPaletteColor.value.copy(frame.palette);
      gpuCompute.compute();
      renderUniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
      renderUniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget(velocityVariable).texture;
    },
    resize(width, height) {
      renderUniforms.uResolution.value.set(width, height);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      positionTexture.dispose();
      velocityTexture.dispose();
      positionVariable.renderTargets.forEach((target) => target.dispose());
      velocityVariable.renderTargets.forEach((target) => target.dispose());
    },
  };
}
