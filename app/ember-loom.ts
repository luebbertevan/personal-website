import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";

const positionShader = /* glsl */ `
  uniform float uDelta;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 positionState = texture2D(texturePosition, uv);
    vec3 velocity = texture2D(textureVelocity, uv).xyz;
    positionState.xy += velocity.xy * uDelta;
    gl_FragColor = positionState;
  }
`;

const velocityShader = /* glsl */ `
  uniform float uDelta;
  uniform float uTime;
  uniform float uTransitionActive;
  uniform float uTransitionProgress;
  uniform float uStructurePresence;
  uniform float uStructureDisturbance;
  uniform float uTravelDirection;
  uniform float uCameraX;
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

    return target;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 positionState = texture2D(texturePosition, uv);
    vec3 velocity = texture2D(textureVelocity, uv).xyz;
    float seed = positionState.w;
    float lane = hash12(uv * vec2(137.17, 211.73) + seed * 53.1);
    float phase = hash12(uv.yx * vec2(73.91, 149.37) + seed * 31.7);
    float orbitSeed = hash12(uv * vec2(319.17, 97.31) + seed * 19.3);

    vec2 tangent = normalize(uStrandTangent + vec2(0.0001, 0.0));
    vec2 normal = vec2(-tangent.y, tangent.x);
    float worldProgress = fract(lane - uCameraX * 0.0125);
    float along = (worldProgress - 0.5) * 2.82;
    vec2 basePosition = uAnchor + tangent * along;

    float orbitSpeed = 0.16 + 0.31 * hash12(uv * 181.9 + seed * 7.7);
    float orbitAngle = phase * 6.2831853 - uTime * orbitSpeed;
    orbitAngle += sin(uTime * (0.047 + orbitSeed * 0.034) + seed * 43.0) * 0.34;
    float cameraOrbit = 0.32 * sin(uCameraX * 0.11) + 0.92 * sin(uCameraX * 0.027);
    float viewOrbitAngle = orbitAngle - cameraOrbit;
    float orbitRadius = 0.082 + 0.58 * pow(orbitSeed, 0.72);
    orbitRadius *= 0.88 + 0.18 * sin(uTime * 0.09 + seed * 61.0);
    vec2 ambientOffset = normal * sin(viewOrbitAngle) * orbitRadius;
    ambientOffset += tangent * cos(viewOrbitAngle) * orbitRadius * (0.08 + phase * 0.11);
    ambientOffset += tangent * sin(uTime * 0.071 + seed * 79.0) * (0.018 + phase * 0.055);
    vec2 actualPosition = basePosition + positionState.xy;

    float structureSelector = seed + uv.x;
    vec2 structureTarget = frameTarget(structureSelector, lane);
    float structureSide = floor(fract(structureSelector * 7.17) * 4.0);
    vec2 structureFlow = structureSide < 0.5 || (structureSide > 1.5 && structureSide < 2.5)
      ? vec2(0.0, 1.0)
      : vec2(1.0, 0.0);
    vec2 structureNormal = vec2(-structureFlow.y, structureFlow.x);
    float structureDrift = sin(uTime * (0.64 + phase * 0.48) + seed * 67.0) * (0.007 + phase * 0.011);
    float structureBreath = cos(uTime * (0.72 + orbitSeed * 0.32) + seed * 41.0) * (0.0008 + phase * 0.0016);
    structureTarget += structureFlow * structureDrift + structureNormal * structureBreath;
    float structureGroup = smoothstep(0.12, 0.28, seed);

    float collapse = smoothstep(0.03, 0.34, uTransitionProgress) * uTransitionActive;
    float assemble = uStructurePresence;
    float formationSeed = hash12(uv * vec2(421.7, 193.3) + seed * 117.0);
    float formationShape = hash12(uv.yx * vec2(287.1, 613.9) + seed * 59.0);
    float formationStart = formationSeed * 0.52;
    float formationEnd = min(0.98, formationStart + 0.34 + formationShape * 0.10);
    float localAssemble = smoothstep(formationStart, formationEnd, assemble);
    float formationArc = 4.0 * localAssemble * (1.0 - localAssemble);
    vec2 approachDirection = normalize(vec2(
      hash12(uv * vec2(733.1, 101.7) + seed * 23.0) - 0.5,
      hash12(uv.yx * vec2(359.3, 887.1) + seed * 37.0) - 0.5
    ) + vec2(0.001));
    vec2 cloudTarget = structureTarget
      + approachDirection * formationArc * (0.080 + formationShape * 0.120);
    float disturbancePulse = uStructureDisturbance * (0.72 + 0.28 * sin(uTime * 1.7 + seed * 73.0));
    vec2 disturbanceDirection = normalize(vec2(
      hash12(uv * vec2(947.3, 263.1) + seed * 43.0) - 0.5,
      hash12(uv.yx * vec2(173.9, 659.7) + seed * 89.0) - 0.5
    ) + vec2(0.001));
    cloudTarget += disturbanceDirection * disturbancePulse * (0.045 + formationShape * 0.095);
    cloudTarget += structureNormal
      * sin(uTime * (1.1 + phase * 0.8) + seed * 109.0)
      * uStructureDisturbance
      * (0.012 + phase * 0.026);
    float inTransit = collapse * (1.0 - assemble);
    vec2 streamTarget = uAnchor
      + tangent * ((worldProgress - 0.5) * 2.20 - uTravelDirection * (0.14 + phase * 0.24))
      + normal * sin(uTime * 0.88 + seed * 41.0) * (0.10 + 0.19 * phase);
    vec2 targetOffset = mix(ambientOffset, streamTarget - basePosition, inTransit);
    targetOffset = mix(targetOffset, cloudTarget - basePosition, structureGroup * localAssemble);

    vec2 toTarget = targetOffset - positionState.xy;
    float spring = mix(5.4, 8.2, structureGroup);
    spring += inTransit * 2.0;
    vec2 acceleration = toTarget * spring;

    float field = sin(actualPosition.x * 10.0 + uTime * 0.41 + seed * 27.0)
      + cos(actualPosition.y * 13.0 - uTime * 0.37 + phase * 19.0);
    acceleration += normal * field * mix(0.018, 0.052, 1.0 - structureGroup);

    vec2 pointerDelta = actualPosition - uPointer;
    float pointerDistance = length(pointerDelta);
    float influenceRadius = 0.29 + phase * 0.16;
    float pointerInfluence = 1.0 - smoothstep(0.0, influenceRadius, pointerDistance);
    vec2 pointerDirection = pointerDelta / max(pointerDistance, 0.018);
    acceleration += pointerDirection * pointerInfluence * (1.78 + 2.8 * uImpulse) * (0.72 + phase);
    acceleration += normal * pointerInfluence * uImpulse * (phase - 0.5) * 2.2;

    velocity.xy += acceleration * uDelta;
    velocity.xy *= exp(-mix(2.55, 3.65, structureGroup) * uDelta);
    float speed = length(velocity.xy);
    if (speed > 0.82) velocity.xy *= 0.82 / speed;
    velocity.z = 0.0;
    gl_FragColor = vec4(velocity, 1.0);
  }
`;

const particleVertexShader = /* glsl */ `
  uniform sampler2D texturePosition;
  uniform sampler2D textureVelocity;
  uniform vec2 uResolution;
  uniform vec2 uAnchor;
  uniform vec2 uStrandTangent;
  uniform float uCameraX;
  uniform float uTime;
  uniform float uTransitionActive;
  uniform float uTransitionProgress;
  uniform float uStructurePresence;
  attribute vec2 particleUv;
  attribute float particleSeed;
  varying vec2 vParticleUv;
  varying float vSpeed;
  varying float vSeed;
  varying float vTrail;
  varying float vBehind;
  varying float vEdgeFade;
  varying float vLight;
  varying float vStructureGain;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec4 positionState = texture2D(texturePosition, particleUv);
    vec3 velocity = texture2D(textureVelocity, particleUv).xyz;
    float speed = length(velocity.xy);
    float lane = hash12(particleUv * vec2(137.17, 211.73) + particleSeed * 53.1);
    float phase = hash12(particleUv.yx * vec2(73.91, 149.37) + particleSeed * 31.7);
    float orbitSeed = hash12(particleUv * vec2(319.17, 97.31) + particleSeed * 19.3);
    vec2 tangent = normalize(uStrandTangent + vec2(0.0001, 0.0));
    float worldProgress = fract(lane - uCameraX * 0.0125);
    vec2 basePosition = uAnchor + tangent * ((worldProgress - 0.5) * 2.82);
    vec2 center = basePosition + positionState.xy;
    vec2 direction = normalize(velocity.xy + tangent * 0.0025);
    vec2 normal = vec2(-direction.y, direction.x);
    float orbitSpeed = 0.16 + 0.31 * hash12(particleUv * 181.9 + particleSeed * 7.7);
    float orbitAngle = phase * 6.2831853 - uTime * orbitSpeed;
    orbitAngle += sin(uTime * (0.047 + orbitSeed * 0.034) + particleSeed * 43.0) * 0.34;
    float cameraOrbit = 0.32 * sin(uCameraX * 0.11) + 0.92 * sin(uCameraX * 0.027);
    float orbitDepth = cos(orbitAngle - cameraOrbit);
    float depthScale = 0.72 + 0.36 * (orbitDepth * 0.5 + 0.5);
    float trailClass = 0.0;
    float sizeSeed = hash12(particleUv * vec2(227.3, 419.1) + particleSeed * 71.0);
    float sparkClass = smoothstep(0.84, 0.965, sizeSeed);
    float heroClass = smoothstep(0.975, 0.998, sizeSeed);
    float emberWidth = 0.0035 + sizeSeed * 0.0046 + sparkClass * 0.0088 + heroClass * 0.0115;
    float trailWidth = 0.0036 + particleSeed * 0.0012;
    float width = mix(emberWidth, trailWidth, trailClass) * depthScale;
    float emberLength = emberWidth;
    float orbitLength = 0.024 + min(speed * 0.15, 0.042);
    float trail = mix(emberLength, orbitLength, trailClass) * depthScale;
    vec2 offset = direction * position.x * trail + normal * position.y * width;
    offset.x *= uResolution.y / max(uResolution.x, 1.0);

    gl_Position = vec4(center + offset, 0.0, 1.0);
    vParticleUv = uv;
    vSpeed = speed;
    vSeed = particleSeed;
    vTrail = trailClass;
    float assemble = uStructurePresence;
    float structureGroup = smoothstep(0.12, 0.28, particleSeed);
    float formationSeed = hash12(particleUv * vec2(421.7, 193.3) + particleSeed * 117.0);
    float formationShape = hash12(particleUv.yx * vec2(287.1, 613.9) + particleSeed * 59.0);
    float formationStart = formationSeed * 0.52;
    float formationEnd = min(0.98, formationStart + 0.34 + formationShape * 0.10);
    float localAssemble = smoothstep(formationStart, formationEnd, assemble);
    vBehind = (1.0 - smoothstep(-0.12, 0.12, orbitDepth)) * (1.0 - structureGroup * localAssemble);
    vEdgeFade = smoothstep(0.0, 0.075, min(worldProgress, 1.0 - worldProgress));
    vLight = pow(hash12(particleUv * vec2(593.1, 271.7) + particleSeed * 97.0), 2.15);
    vStructureGain = mix(1.0, mix(0.10, 1.08, localAssemble), structureGroup);
  }
`;

const particleFragmentShader = /* glsl */ `
  uniform vec3 uPaletteColor;
  uniform float uOpacity;
  uniform sampler2D uCarbonDepth;
  uniform vec2 uResolution;
  varying vec2 vParticleUv;
  varying float vSpeed;
  varying float vSeed;
  varying float vTrail;
  varying float vBehind;
  varying float vEdgeFade;
  varying float vLight;
  varying float vStructureGain;

  void main() {
    vec2 p = vParticleUv - 0.5;
    float radius = length(p);
    float halo = 1.0 - smoothstep(0.10, 0.50, radius);
    float core = 1.0 - smoothstep(0.018, 0.18, radius);
    float heat = smoothstep(0.018, 0.24, vSpeed);
    vec3 saturated = uPaletteColor * (0.84 + vSeed * 0.34);
    vec3 hotColor = mix(saturated, vec3(1.0), 0.035 + heat * 0.10);
    vec3 color = mix(saturated, hotColor, heat * 0.32 + core * 0.06);

    float emberAlpha = halo * 0.10 + core * (0.48 + heat * 0.18);
    float trailBody = (1.0 - smoothstep(0.035, 0.30, abs(p.y)))
      * smoothstep(0.0, 0.88, vParticleUv.x);
    float trailHead = 1.0 - smoothstep(0.025, 0.20, length(vec2((vParticleUv.x - 0.84) * 0.72, p.y)));
    float trailAlpha = trailBody * 0.22 + trailHead * 0.66;
    vec2 screenUv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    vec2 maskRadius = vec2(0.010 * uResolution.y / max(uResolution.x, 1.0), 0.010);
    float strandDepth = texture2D(uCarbonDepth, screenUv).a;
    strandDepth = max(strandDepth, texture2D(uCarbonDepth, screenUv + vec2(maskRadius.x, 0.0)).a);
    strandDepth = max(strandDepth, texture2D(uCarbonDepth, screenUv - vec2(maskRadius.x, 0.0)).a);
    strandDepth = max(strandDepth, texture2D(uCarbonDepth, screenUv + vec2(0.0, maskRadius.y)).a);
    strandDepth = max(strandDepth, texture2D(uCarbonDepth, screenUv - vec2(0.0, maskRadius.y)).a);
    strandDepth = max(strandDepth, texture2D(uCarbonDepth, screenUv + maskRadius * 0.72).a);
    strandDepth = max(strandDepth, texture2D(uCarbonDepth, screenUv - maskRadius * 0.72).a);
    strandDepth = max(strandDepth, texture2D(uCarbonDepth, screenUv + vec2(maskRadius.x, -maskRadius.y) * 0.72).a);
    strandDepth = max(strandDepth, texture2D(uCarbonDepth, screenUv + vec2(-maskRadius.x, maskRadius.y) * 0.72).a);
    float strandCoverage = smoothstep(0.008, 0.065, strandDepth);
    float occlusion = strandCoverage * vBehind;
    if (vBehind > 0.48 && strandCoverage > 0.08) discard;
    color *= mix(1.0, 0.72, vBehind);
    color *= 0.72 + vLight * 1.28;
    float alpha = mix(emberAlpha, trailAlpha, vTrail) * uOpacity * vEdgeFade * vStructureGain;
    alpha *= 0.72 + vLight * 0.72;
    alpha *= 1.0 - occlusion * 0.97;
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(color, alpha);
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
  structurePresence: number;
  structureDisturbance: number;
  travelDirection: number;
  cameraX: number;
};

export type EmberLoom = {
  scene: THREE.Scene;
  update: (frame: EmberLoomFrame) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

export function createEmberLoom(
  renderer: THREE.WebGLRenderer,
  carbonDepthTexture: THREE.Texture,
  simulationSize = 160,
): EmberLoom | null {
  const safeSimulationSize = Math.max(32, Math.floor(simulationSize));
  const gpuCompute = new GPUComputationRenderer(safeSimulationSize, safeSimulationSize, renderer);
  const positionTexture = gpuCompute.createTexture();
  const velocityTexture = gpuCompute.createTexture();
  const positionData = positionTexture.image.data;
  const velocityData = velocityTexture.image.data;
  const particleCount = safeSimulationSize * safeSimulationSize;

  for (let i = 0; i < particleCount; i += 1) {
    const offset = i * 4;
    const seed = (Math.sin(i * 91.371) * 43758.5453) % 1;
    const normalizedSeed = seed < 0 ? seed + 1 : seed;
    const initialPhase = ((Math.sin(i * 17.713 + normalizedSeed * 83.17) * 43758.5453) % 1 + 1) % 1;
    const initialOrbitSeed = ((Math.sin(i * 53.117 + normalizedSeed * 29.41) * 24634.6345) % 1 + 1) % 1;
    const initialAngle = initialPhase * Math.PI * 2;
    const initialRadius = 0.082 + 0.58 * Math.pow(initialOrbitSeed, 0.72);
    positionData[offset] = Math.cos(initialAngle) * initialRadius * (0.08 + initialPhase * 0.11);
    positionData[offset + 1] = Math.sin(initialAngle) * initialRadius;
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
  velocityVariable.material.uniforms.uStructurePresence = { value: 0 };
  velocityVariable.material.uniforms.uStructureDisturbance = { value: 0 };
  velocityVariable.material.uniforms.uTravelDirection = { value: 1 };
  velocityVariable.material.uniforms.uCameraX = { value: 0 };
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
    particleUvs[i * 2] = (i % safeSimulationSize + 0.5) / safeSimulationSize;
    particleUvs[i * 2 + 1] = (Math.floor(i / safeSimulationSize) + 0.5) / safeSimulationSize;
    particleSeeds[i] = positionData[i * 4 + 3];
  }
  geometry.setAttribute("particleUv", new THREE.InstancedBufferAttribute(particleUvs, 2));
  geometry.setAttribute("particleSeed", new THREE.InstancedBufferAttribute(particleSeeds, 1));
  geometry.instanceCount = particleCount;

  const renderUniforms = {
    texturePosition: { value: gpuCompute.getCurrentRenderTarget(positionVariable).texture },
    textureVelocity: { value: gpuCompute.getCurrentRenderTarget(velocityVariable).texture },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uAnchor: { value: new THREE.Vector2(-0.28, 0) },
    uStrandTangent: { value: new THREE.Vector2(1, 0) },
    uCameraX: { value: 0 },
    uTime: { value: 0 },
    uTransitionActive: { value: 0 },
    uTransitionProgress: { value: 0 },
    uStructurePresence: { value: 0 },
    uPaletteColor: { value: new THREE.Vector3(1, 0.25, 0.0625) },
    uOpacity: { value: 0.74 },
    uCarbonDepth: { value: carbonDepthTexture },
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
      velocityVariable.material.uniforms.uStructurePresence.value = frame.structurePresence;
      velocityVariable.material.uniforms.uStructureDisturbance.value = frame.structureDisturbance;
      velocityVariable.material.uniforms.uTravelDirection.value = frame.travelDirection;
      velocityVariable.material.uniforms.uCameraX.value = frame.cameraX;
      velocityVariable.material.uniforms.uImpulse.value = frame.impulse;
      velocityVariable.material.uniforms.uPointer.value.copy(frame.pointer);
      velocityVariable.material.uniforms.uAnchor.value.copy(frame.anchor);
      velocityVariable.material.uniforms.uStrandTangent.value.copy(frame.strandTangent);
      velocityVariable.material.uniforms.uPanelBounds.value.copy(frame.panelBounds);
      renderUniforms.uAnchor.value.copy(frame.anchor);
      renderUniforms.uStrandTangent.value.copy(frame.strandTangent);
      renderUniforms.uCameraX.value = frame.cameraX;
      renderUniforms.uTime.value = frame.time;
      renderUniforms.uTransitionActive.value = frame.transitionActive;
      renderUniforms.uTransitionProgress.value = frame.transitionProgress;
      renderUniforms.uStructurePresence.value = frame.structurePresence;
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
