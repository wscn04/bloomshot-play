import * as THREE from "./vendor/three.module.js";

window.__bloomshotLoaded = true;

const $ = (selector) => document.querySelector(selector);

const ui = {
  scene: $("#scene"),
  menu: $("#menu"),
  tutorial: $("#tutorial"),
  pause: $("#pause"),
  settings: $("#settings"),
  dailyTransition: $("#daily-transition"),
  results: $("#results"),
  hud: $("#hud"),
  crosshair: $("#crosshair"),
  trackEnergy: $("#track-energy"),
  combo: $("#combo"),
  comboValue: $("#combo-value"),
  score: $("#score"),
  time: $("#time"),
  timeLabel: $("#time-label"),
  timeBar: $("#time-bar"),
  accuracy: $("#accuracy"),
  feedback: $("#feedback"),
  flash: $("#hit-flash"),
  start: $("#start"),
  tutorialStart: $("#tutorial-start"),
  tutorialSkip: $("#tutorial-skip"),
  tutorialModeName: $("#tutorial-mode-name"),
  tutorialSpecialTitle: $("#tutorial-special-title"),
  tutorialSpecialNote: $("#tutorial-special-note"),
  resume: $("#resume"),
  pauseRestart: $("#pause-restart"),
  pauseSettings: $("#pause-settings"),
  pauseModeName: $("#pause-mode-name"),
  quit: $("#quit"),
  retry: $("#retry"),
  home: $("#home"),
  endSession: $("#end-session"),
  modeChip: $("#mode-chip"),
  modeFlick: $("#mode-flick"),
  modeSwitch: $("#mode-switch"),
  modeTrack: $("#mode-track"),
  modeZen: $("#mode-zen"),
  modeName: $("#mode-name"),
  modeDuration: $("#mode-duration"),
  modeTargets: $("#mode-targets"),
  menuModeTitle: $("#menu-mode-title"),
  menuModeTagline: $("#menu-mode-tagline"),
  hallModeIndex: $("#hall-mode-index"),
  hallObjective: $("#hall-objective"),
  previewHit: $("#preview-hit"),
  previewFeedback: $("#preview-feedback"),
  flowLabel: $("#flow-label"),
  bestLabel: $("#best-label"),
  menuBest: $("#menu-best"),
  grade: $("#grade"),
  resultTitle: $("#result-title"),
  resultNote: $("#result-note"),
  finalScore: $("#final-score"),
  finalAccuracy: $("#final-accuracy"),
  finalCombo: $("#final-combo"),
  newBest: $("#new-best"),
  resultScoreLabel: $("#result-score-label"),
  precisionGrade: $("#precision-grade"),
  speedGrade: $("#speed-grade"),
  stabilityGrade: $("#stability-grade"),
  precisionLabel: $("#precision-label"),
  speedLabel: $("#speed-label"),
  stabilityLabel: $("#stability-label"),
  finalSpeed: $("#final-speed"),
  medianSpeed: $("#median-speed"),
  fastestSpeed: $("#fastest-speed"),
  weakZone: $("#weak-zone"),
  resultInsight: $("#result-insight"),
  historyBars: $("#history-bars"),
  historyLabel: $("#history-label"),
  settingsOpen: $("#settings-open"),
  settingsClose: $("#settings-close"),
  settingsReset: $("#settings-reset"),
  settingsSensitivity: $("#settings-sensitivity"),
  settingsSensitivityValue: $("#settings-sens-value"),
  fov: $("#fov"),
  fovValue: $("#fov-value"),
  volume: $("#volume"),
  volumeValue: $("#volume-value"),
  particles: $("#particles"),
  particlesValue: $("#particles-value"),
  flashStrength: $("#flash-strength"),
  flashValue: $("#flash-value"),
  showGun: $("#show-gun"),
  cameraShake: $("#camera-shake"),
  lowGraphics: $("#low-graphics"),
  settingsPreview: $("#settings-preview"),
  settingsPreviewStatus: $("#settings-preview-status"),
  dailyStart: $("#daily-start"),
  dailyStreak: $("#daily-streak"),
  dailyProgress: $("#daily-progress"),
  dailyTitle: $("#daily-title"),
  dailyNote: $("#daily-note"),
  dailyStageScore: $("#daily-stage-score"),
  dailyNext: $("#daily-next"),
  dailyExit: $("#daily-exit"),
};

const SESSION_SECONDS = 45;
const DAILY_SESSION_SECONDS = 30;
const SETTINGS_KEY = "bloomshot-settings-v03";
const LEGACY_SETTINGS_KEY = "bloomshot-settings-v02";
const HISTORY_KEY = "bloomshot-history-v03";
const LEGACY_HISTORY_KEY = "bloomshot-history-v02";
const BEST_KEY = "bloomshot-best-v03";
const DAILY_KEY = "bloomshot-daily-v03";
const DAILY_MODES = ["flick", "switch", "track"];
const TRAINING_MODES = {
  flick: { name: "快速点射", code: "FLICK", duration: 45, targetCount: 3, targetLabel: "动态三靶", tagline: "快速发现 连续命中", objective: "在 45 秒内快速击中连续出现的目标", startLabel: "开始训练", timed: true },
  switch: { name: "目标切换", code: "SWITCH", duration: 45, targetCount: 1, targetLabel: "远距单靶", tagline: "大幅转向 精准落点", objective: "在 45 秒内完成大角度目标切换", startLabel: "开始训练", timed: true },
  track: { name: "平滑追踪", code: "TRACK", duration: 30, targetCount: 1, targetLabel: "移动单靶", tagline: "保持准星 持续跟随", objective: "按住左键持续跟随移动目标", startLabel: "开始训练", timed: true, tracking: true },
  zen: { name: "自由训练", code: "FREEPLAY", duration: Infinity, targetCount: 3, targetLabel: "自适应目标", tagline: "自定节奏 随时结束", objective: "自由练习 按 E 结束本轮", startLabel: "开始自由训练", timed: false, adaptive: true },
};
const MODE_ORDER = { flick: "01 / 04", switch: "02 / 04", track: "03 / 04", zen: "04 / 04" };
const TUTORIAL_MODE_COPY = {
  flick: { title: "连续命中", note: "保持节奏快速击中连续目标" },
  switch: { title: "大角转向", note: "看清目标再完成快速拉枪" },
  track: { title: "按住追踪", note: "保持左键持续跟随移动目标" },
  zen: { title: "自由练习", note: "按自己的节奏持续命中目标" },
};
const defaultSettings = {
  sensitivity: 1,
  fov: 73,
  volume: 0.8,
  particles: 1,
  flash: 0.7,
  showGun: true,
  cameraShake: true,
  lowGraphics: false,
};

function readLocalJson(key, fallback) {
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(key) || "{}") };
  } catch {
    return { ...fallback };
  }
}

const legacySettings = readLocalJson(LEGACY_SETTINGS_KEY, defaultSettings);
const settings = readLocalJson(SETTINGS_KEY, legacySettings);
if (!localStorage.getItem(SETTINGS_KEY) && localStorage.getItem("bloomshot-sensitivity")) {
  settings.sensitivity = Number(localStorage.getItem("bloomshot-sensitivity")) || 1;
}
let history = [];
try {
  history = JSON.parse(localStorage.getItem(HISTORY_KEY) || localStorage.getItem(LEGACY_HISTORY_KEY) || "[]");
  if (!Array.isArray(history)) history = [];
  history = history.map((run) => ({ ...run, mode: run.mode === "standard" ? "flick" : run.mode }));
} catch {
  history = [];
}

const bestScores = readLocalJson(BEST_KEY, {
  flick: Number(localStorage.getItem("bloomshot-best")) || 0,
  switch: 0,
  track: 0,
  zen: 0,
  daily: 0,
});
const dailyRecord = readLocalJson(DAILY_KEY, { lastDate: "", streak: 0, best: 0 });

const state = {
  mode: "menu",
  trainingMode: "flick",
  sessionSeconds: SESSION_SECONDS,
  score: 0,
  shots: 0,
  hits: 0,
  combo: 0,
  bestCombo: 0,
  remaining: SESSION_SECONDS,
  elapsed: 0,
  sensitivity: settings.sensitivity,
  yaw: 0,
  pitch: 0,
  recoil: 0,
  pointerWasLocked: false,
  hitStop: 0,
  reactionTimes: [],
  lastHitAt: 0,
  settingsReturn: "menu",
  difficultyLevel: 1,
  adaptiveHits: 0,
  adaptiveMisses: 0,
  triggerHeld: false,
  trackingSamples: 0,
  trackingOnTarget: 0,
  trackingAccumulator: 0,
  trackingStreak: 0,
  trackingBestStreak: 0,
  trackingMissStreak: 0,
  trackingStarted: false,
  trackingAcquireStartedAt: 0,
  trackingEnergy: 0,
  trackingQuality: 0,
  trackingLostTime: 0,
  trackingBloomPhase: 0,
  trackingRecentSamples: [],
  trackingStage: 0,
  trackingFeedbackTimer: 0,
  trackingFeedbackCount: 0,
  trackingFeedbackCooldown: 0,
  trackingLastFeedback: "",
  shake: 0,
  zoneStats: null,
  dailyActive: false,
  dailyIndex: 0,
  dailyTotals: null,
  resultMode: "flick",
};

let bestScore = bestScores.flick;
ui.menuBest.textContent = bestScore ? bestScore.toLocaleString("zh-CN") : "—";
ui.settingsSensitivity.value = String(settings.sensitivity);
ui.fov.value = String(settings.fov);
ui.volume.value = String(settings.volume);
ui.particles.value = String(settings.particles);
ui.flashStrength.value = String(settings.flash);
ui.showGun.checked = settings.showGun;
ui.cameraShake.checked = settings.cameraShake;
ui.lowGraphics.checked = settings.lowGraphics;

function gradeFor(value, thresholds) {
  if (value >= thresholds[0]) return "S";
  if (value >= thresholds[1]) return "A";
  if (value >= thresholds[2]) return "B";
  if (value >= thresholds[3]) return "C";
  return "D";
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return Math.round(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2);
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function saveBestScores() {
  localStorage.setItem(BEST_KEY, JSON.stringify(bestScores));
  localStorage.setItem("bloomshot-best", String(bestScores.flick || 0));
}

function updateDailyCard() {
  const completedToday = dailyRecord.lastDate === localDateKey();
  ui.dailyStreak.textContent = completedToday ? `今日完成 · ${dailyRecord.streak} 天` : `连续 ${dailyRecord.streak} 天`;
  ui.dailyStart.classList.toggle("is-complete", completedToday);
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  localStorage.setItem("bloomshot-sensitivity", String(settings.sensitivity));
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.lowGraphics ? 1 : 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = !settings.lowGraphics;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
ui.scene.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x160d13);
scene.fog = new THREE.FogExp2(0x21131b, 0.024);

const camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.08, 80);
camera.position.set(0, 1.7, 4.8);
camera.rotation.order = "YXZ";
scene.add(camera);

const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
const activeTargets = [];
const effects = [];
let roomGlow;
let lastSpawnSide = 0;
let sameSideCount = 0;
const lastTargetPosition = new THREE.Vector3(0, 2.2, -10);

const palette = {
  white: 0xfffbfd,
  blush: 0xffdbe8,
  pink: 0xff6ba4,
  hot: 0xff3f88,
  rose: 0xff9ec2,
  ink: 0x3f2b34,
};

const roomPalette = {
  floor: 0x281720,
  back: 0x34202a,
  side: 0x422735,
};

function addRoom() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 36),
    new THREE.MeshLambertMaterial({ color: roomPalette.floor })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -1, -5);
  floor.receiveShadow = true;
  scene.add(floor);

  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 10),
    new THREE.MeshLambertMaterial({ color: roomPalette.back })
  );
  back.position.set(0, 4, -15);
  back.receiveShadow = true;
  scene.add(back);

  const sideMaterial = new THREE.MeshLambertMaterial({
    color: roomPalette.side,
    emissive: 0x2c1420,
    emissiveIntensity: 0.52,
    side: THREE.DoubleSide,
  });
  const left = new THREE.Mesh(new THREE.PlaneGeometry(36, 10), sideMaterial);
  left.rotation.y = Math.PI / 2;
  left.position.set(-9, 4, -4);
  scene.add(left);
  const right = left.clone();
  right.rotation.y = -Math.PI / 2;
  right.position.x = 9;
  scene.add(right);

  const ceilingMaterial = new THREE.MeshLambertMaterial({
    color: roomPalette.side,
    emissive: 0x3a1f2b,
    emissiveIntensity: 0.82,
    side: THREE.DoubleSide,
  });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(22, 36), ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 9, -5);
  scene.add(ceiling);

  const laneMaterial = new THREE.MeshStandardMaterial({ color: palette.pink, emissive: palette.pink, emissiveIntensity: 0.7 });
  [-3.2, 3.2].forEach((x) => {
    const lane = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.018, 23), laneMaterial);
    lane.position.set(x, -0.96, -4.5);
    scene.add(lane);
  });

  const hemi = new THREE.HemisphereLight(0xb47a94, 0x10080d, 1.95);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffe8f2, 2.1);
  key.position.set(-4, 8, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -8;
  scene.add(key);

  roomGlow = new THREE.PointLight(palette.pink, 36, 22, 2);
  roomGlow.position.set(0, 4, -11);
  scene.add(roomGlow);

  const fill = new THREE.PointLight(0xa66d87, 22, 18, 2);
  fill.position.set(0, 2, 3);
  scene.add(fill);

  const sideFill = new THREE.PointLight(0xc06a91, 26, 17, 2);
  sideFill.position.set(-5.8, 3.1, 1.2);
  scene.add(sideFill);
}

function addGun() {
  const gun = new THREE.Group();
  gun.name = "trainer";
  const white = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.28, metalness: 0.03, clearcoat: 0.72 });
  const pink = new THREE.MeshStandardMaterial({ color: palette.pink, emissive: 0xff5f9d, emissiveIntensity: 0.13, roughness: 0.42 });
  const dark = new THREE.MeshStandardMaterial({ color: palette.ink, roughness: 0.55 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.74), white);
  body.rotation.x = -0.04;
  body.castShadow = true;
  gun.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.64), pink);
  top.position.set(0, 0.13, -0.02);
  gun.add(top);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.42, 18), dark);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.48);
  gun.add(barrel);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.48, 0.24), dark);
  grip.rotation.x = -0.18;
  grip.position.set(0, -0.3, 0.13);
  gun.add(grip);
  const petal = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.025, 8, 24), pink);
  petal.position.set(0, 0.02, -0.71);
  gun.add(petal);

  gun.position.set(0.52, -0.42, -0.9);
  gun.rotation.set(-0.03, -0.08, -0.015);
  camera.add(gun);
  return gun;
}

addRoom();
const gun = addGun();

const targetGeometries = {
  body: new THREE.CylinderGeometry(0.62, 0.62, 0.18, 40),
  face: new THREE.CircleGeometry(0.5, 40),
  core: new THREE.CircleGeometry(0.17, 32),
  ring: new THREE.TorusGeometry(0.66, 0.055, 12, 50),
  halo: new THREE.RingGeometry(0.72, 0.78, 48),
};
const targetMaterials = {
  body: new THREE.MeshPhysicalMaterial({ color: palette.pink, roughness: 0.28, clearcoat: 0.82, clearcoatRoughness: 0.16 }),
  face: new THREE.MeshStandardMaterial({ color: palette.white, roughness: 0.66 }),
  core: new THREE.MeshStandardMaterial({ color: palette.hot, emissive: palette.hot, emissiveIntensity: 0.24 }),
  ring: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.18 }),
  halo: new THREE.MeshBasicMaterial({ color: palette.rose, transparent: true, opacity: 0.3, side: THREE.DoubleSide }),
};
const targetPool = [];

function makeTarget() {
  const target = new THREE.Group();
  const body = new THREE.Mesh(targetGeometries.body, targetMaterials.body);
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  target.add(body);

  const face = new THREE.Mesh(targetGeometries.face, targetMaterials.face);
  face.position.z = 0.101;
  target.add(face);
  const core = new THREE.Mesh(targetGeometries.core, targetMaterials.core);
  core.position.z = 0.108;
  target.add(core);
  const ring = new THREE.Mesh(targetGeometries.ring, targetMaterials.ring);
  ring.position.z = 0.122;
  target.add(ring);
  const halo = new THREE.Mesh(targetGeometries.halo, targetMaterials.halo);
  halo.position.z = -0.04;
  target.add(halo);

  target.userData.isTarget = true;
  target.userData.born = performance.now();
  target.userData.phase = Math.random() * Math.PI * 2;
  target.traverse((part) => { part.userData.targetRoot = target; });
  target.scale.setScalar(0.01);
  return target;
}

function acquireTarget() {
  const target = targetPool.pop() || makeTarget();
  target.userData.dead = false;
  target.userData.born = performance.now();
  target.userData.phase = Math.random() * Math.PI * 2;
  target.scale.setScalar(0.01);
  return target;
}

function releaseTarget(target) {
  scene.remove(target);
  if (targetPool.length < 8) targetPool.push(target);
}

function randomTargetPosition() {
  const candidate = new THREE.Vector3();
  if (state.trainingMode === "track") {
    candidate.set(0, 2.45, -10.8);
    return candidate;
  }
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const z = THREE.MathUtils.randFloat(-13.6, -7.4);
    const depthScale = THREE.MathUtils.mapLinear(z, -13.6, -7.4, 1, 0.68);
    let x = THREE.MathUtils.randFloat(-6.3 * depthScale, 6.3 * depthScale);
    const nextSide = Math.sign(x) || 1;
    const sideLimit = state.trainingMode === "switch" ? 1 : 3;
    if (sameSideCount >= sideLimit && nextSide === lastSpawnSide) x *= -1;
    candidate.set(x, THREE.MathUtils.randFloat(0.15, 5.5), z);
    const spacing = state.trainingMode === "switch" ? 14 : 5.2;
    const farFromPrevious = state.trainingMode !== "switch" || candidate.distanceToSquared(lastTargetPosition) > 18;
    const farEnough = farFromPrevious && activeTargets.every((target) => target.position.distanceToSquared(candidate) > spacing);
    if (farEnough) break;
  }
  const chosenSide = Math.sign(candidate.x) || 1;
  sameSideCount = chosenSide === lastSpawnSide ? sameSideCount + 1 : 1;
  lastSpawnSide = chosenSide;
  lastTargetPosition.copy(candidate);
  return candidate.clone();
}

function spawnTarget() {
  const target = acquireTarget();
  target.position.copy(randomTargetPosition());
  target.userData.baseY = target.position.y;
  target.userData.baseX = target.position.x;
  target.userData.pathSpeed = 0.82 + state.difficultyLevel * 0.1;
  target.userData.pathWidth = 2.2 + state.difficultyLevel * 0.28;
  target.userData.pathHeight = 1.1 + state.difficultyLevel * 0.16;
  if (state.trainingMode === "track") target.userData.baseScale = 0.84;
  else if (state.trainingMode === "switch") target.userData.baseScale = 0.92;
  else if (state.trainingMode === "zen") target.userData.baseScale = 1.16 - (state.difficultyLevel - 1) * 0.075;
  else target.userData.baseScale = 1;
  target.lookAt(camera.position);
  scene.add(target);
  activeTargets.push(target);
}

function clearTargets() {
  while (activeTargets.length) releaseTarget(activeTargets.pop());
}

function fillTargets() {
  const targetCount = TRAINING_MODES[state.trainingMode]?.targetCount || 3;
  while (activeTargets.length < targetCount) spawnTarget();
}

const particleGeometry = new THREE.IcosahedronGeometry(0.075, 0);
const trackingWaveGeometry = new THREE.RingGeometry(0.58, 0.64, 48);
const trackingOuterWaveGeometry = new THREE.RingGeometry(0.76, 0.82, 56);
const particleMaterials = [
  new THREE.MeshBasicMaterial({ color: palette.hot }),
  new THREE.MeshBasicMaterial({ color: palette.rose }),
  new THREE.MeshBasicMaterial({ color: 0xffffff }),
];

function createBloom(position, tier = 0) {
  const burst = new THREE.Group();
  burst.position.copy(position);
  const pieces = [];
  const particleCount = Math.max(5, Math.round((settings.lowGraphics ? 8 : 14 + tier * 4) * settings.particles));
  for (let i = 0; i < particleCount; i += 1) {
    const piece = new THREE.Mesh(particleGeometry, particleMaterials[i % particleMaterials.length]);
    const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.28;
    const speed = THREE.MathUtils.randFloat(2.4, 4.8 + tier * 0.7);
    piece.userData.velocity = new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, THREE.MathUtils.randFloat(1.2, 3.6));
    piece.scale.set(1.55, 0.62, 0.72);
    piece.rotation.z = angle;
    burst.add(piece);
    pieces.push(piece);
  }
  scene.add(burst);
  effects.push({ type: "burst", object: burst, pieces, age: 0, duration: 0.55 + tier * 0.05 });

  const material = new THREE.MeshBasicMaterial({ color: palette.hot, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.58, 48), material);
  ring.position.copy(position);
  ring.lookAt(camera.position);
  scene.add(ring);
  effects.push({ type: "ring", object: ring, material, age: 0, duration: 0.38 + tier * 0.04, strength: 3.2 + tier * 0.8 });

  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), glowMaterial);
  glow.position.copy(position);
  glow.lookAt(camera.position);
  scene.add(glow);
  effects.push({ type: "glow", object: glow, material: glowMaterial, age: 0, duration: 0.2 });

  if (tier >= 3 && state.combo % 5 === 0) {
    const waveMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false });
    const wave = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.76, 64), waveMaterial);
    wave.position.copy(position);
    wave.lookAt(camera.position);
    scene.add(wave);
    effects.push({ type: "ring", object: wave, material: waveMaterial, age: 0, duration: 0.7, strength: 7.5 });
  }
}

function createTrackingWave(position, variant = 0) {
  const ringCount = variant === 1 || variant === 3 ? 2 : 1;
  for (let index = 0; index < ringCount; index += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: index === 1 || variant === 1 ? 0xffffff : palette.hot,
      transparent: true,
      opacity: index === 1 ? 0.55 : 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const geometry = index === 1 ? trackingOuterWaveGeometry : trackingWaveGeometry;
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    ring.lookAt(camera.position);
    scene.add(ring);
    effects.push({ type: "ring", object: ring, material, age: 0, duration: 0.55 + index * 0.14, strength: 4.2 + variant * 0.7 + index * 1.1 });
  }

  if (variant >= 2) {
    const burst = new THREE.Group();
    burst.position.copy(position);
    const pieces = [];
    const count = variant === 3 ? 12 : 7;
    for (let index = 0; index < count; index += 1) {
      const piece = new THREE.Mesh(particleGeometry, particleMaterials[index % particleMaterials.length]);
      const angle = (index / count) * Math.PI * 2;
      piece.userData.velocity = new THREE.Vector3(Math.cos(angle) * 2.1, Math.sin(angle) * 2.1, 1.1 + Math.random() * 0.8);
      piece.scale.set(1.15, 0.48, 0.55);
      piece.rotation.z = angle;
      burst.add(piece);
      pieces.push(piece);
    }
    scene.add(burst);
    effects.push({ type: "burst", object: burst, pieces, age: 0, duration: variant === 3 ? 0.7 : 0.52 });
  }
}

let audioContext;
let noiseBuffer;
let audioBus;
let activeAudioVoices = 0;

function ensureAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
    audioBus = audioContext.createDynamicsCompressor();
    audioBus.threshold.value = -20;
    audioBus.knee.value = 18;
    audioBus.ratio.value = 5;
    audioBus.attack.value = 0.004;
    audioBus.release.value = 0.18;
    audioBus.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  if (!noiseBuffer) {
    noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 0.12), audioContext.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
  }
  return audioContext;
}

function tone({ frequency, endFrequency, duration, volume, type = "sine", delay = 0, pan = 0 }) {
  const ctx = ensureAudio();
  if (!ctx || activeAudioVoices >= 24) return;
  const now = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner?.();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, endFrequency), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * settings.volume), now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  if (panner) {
    panner.pan.value = THREE.MathUtils.clamp(pan, -0.35, 0.35);
    oscillator.connect(gain).connect(panner).connect(audioBus);
  } else {
    oscillator.connect(gain).connect(audioBus || ctx.destination);
  }
  activeAudioVoices += 1;
  oscillator.onended = () => { activeAudioVoices = Math.max(0, activeAudioVoices - 1); };
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function noise(duration, volume, frequency, pan = 0) {
  const ctx = ensureAudio();
  if (!ctx || !noiseBuffer) return;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner?.();
  source.buffer = noiseBuffer;
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 0.8;
  gain.gain.setValueAtTime(Math.max(0.0001, volume * settings.volume), ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  if (panner) {
    panner.pan.value = THREE.MathUtils.clamp(pan, -0.35, 0.35);
    source.connect(filter).connect(gain).connect(panner).connect(audioBus);
  } else {
    source.connect(filter).connect(gain).connect(audioBus || ctx.destination);
  }
  source.start();
  source.stop(ctx.currentTime + duration);
}

function playShot() {
  noise(0.045, 0.032, 1700);
  tone({ frequency: 170, endFrequency: 92, duration: 0.055, volume: 0.026, type: "triangle" });
}

let trackingSynth;

function startTrackingSynth() {
  if (trackingSynth) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const lead = ctx.createOscillator();
  const harmonic = ctx.createOscillator();
  const sub = ctx.createOscillator();
  const sparkle = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const leadGain = ctx.createGain();
  const harmonicGain = ctx.createGain();
  const subGain = ctx.createGain();
  const sparkleGain = ctx.createGain();
  const lfoGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const bodyPanner = ctx.createStereoPanner?.();
  const harmonicPanner = ctx.createStereoPanner?.();
  const sparklePanner = ctx.createStereoPanner?.();
  const delay = ctx.createDelay(0.24);
  const feedbackGain = ctx.createGain();
  const wetGain = ctx.createGain();
  const now = ctx.currentTime;

  lead.type = "sine";
  harmonic.type = "sine";
  sub.type = "sine";
  sparkle.type = "triangle";
  lfo.type = "sine";
  lead.frequency.value = 220;
  harmonic.frequency.value = 330;
  sub.frequency.value = 110;
  sparkle.frequency.value = 392;
  lfo.frequency.value = 0.36;
  lfoGain.gain.value = 62;
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.58;
  delay.delayTime.value = 0.105;
  feedbackGain.gain.value = 0.1;
  leadGain.gain.value = 0.0001;
  harmonicGain.gain.value = 0.0001;
  subGain.gain.value = 0.0001;
  sparkleGain.gain.value = 0.0001;
  wetGain.gain.value = 0.0001;

  lead.connect(leadGain).connect(filter);
  sub.connect(subGain).connect(filter);
  harmonic.connect(harmonicGain);
  sparkle.connect(sparkleGain);
  if (harmonicPanner) harmonicGain.connect(harmonicPanner).connect(filter);
  else harmonicGain.connect(filter);
  if (sparklePanner) sparkleGain.connect(sparklePanner).connect(filter);
  else sparkleGain.connect(filter);
  lfo.connect(lfoGain);
  lfoGain.connect(filter.detune);
  if (bodyPanner) filter.connect(bodyPanner).connect(audioBus);
  else filter.connect(audioBus || ctx.destination);
  filter.connect(delay);
  delay.connect(wetGain).connect(audioBus);
  delay.connect(feedbackGain);
  feedbackGain.connect(delay);

  lead.start(now);
  harmonic.start(now);
  sub.start(now);
  sparkle.start(now);
  lfo.start(now);
  trackingSynth = { lead, harmonic, sub, sparkle, lfo, leadGain, harmonicGain, subGain, sparkleGain, filter, bodyPanner, harmonicPanner, sparklePanner, wetGain, feedbackGain };
}

function updateTrackingSynth(active, target, delta) {
  if (!trackingSynth || !audioContext) return;
  const ctx = audioContext;
  const now = ctx.currentTime;
  state.trackingLostTime = active ? 0 : state.trackingLostTime + delta;
  const seamlessGrace = !active && state.trackingLostTime <= 0.15;
  const softGrace = !active && state.trackingLostTime > 0.15 && state.trackingLostTime <= 0.4;
  if (active) state.trackingEnergy = Math.min(100, state.trackingEnergy + delta * 18);
  else if (state.trackingLostTime > 0.4) state.trackingEnergy = Math.max(0, state.trackingEnergy - delta * 28);

  const energy = state.trackingEnergy / 100;
  const recentQuality = state.trackingRecentSamples.length
    ? state.trackingRecentSamples.reduce((sum, value) => sum + value, 0) / state.trackingRecentSamples.length
    : active ? 1 : 0;
  const qualityBlend = 1 - Math.exp(-delta / 0.38);
  state.trackingQuality = THREE.MathUtils.lerp(state.trackingQuality, recentQuality, qualityBlend);
  state.trackingBloomPhase += delta * (Math.PI * 2 / 2.8);

  const bloom = 0.5 + 0.5 * Math.sin(state.trackingBloomPhase);
  const harmonicMix = THREE.MathUtils.smoothstep(energy, 0.22, 0.68);
  const sparkleMix = THREE.MathUtils.smoothstep(energy, 0.58, 0.96);
  const motifIndex = Math.floor(state.trackingBloomPhase / (Math.PI * 2)) % 4;
  const motifFrequency = [330, 392, 440, 392][motifIndex];
  const pan = target ? THREE.MathUtils.clamp(target.position.x / 7, -0.35, 0.35) : 0;
  const stereoWidth = THREE.MathUtils.smoothstep(energy, 0.4, 1) * (0.04 + state.trackingQuality * 0.15);
  const engagedLevel = active ? 1 : seamlessGrace ? 0.82 : softGrace ? 0.44 : 0;
  const volume = settings.volume;
  trackingSynth.lead.frequency.setTargetAtTime(220, now, 0.08);
  trackingSynth.harmonic.frequency.setTargetAtTime(330, now, 0.1);
  trackingSynth.sub.frequency.setTargetAtTime(110, now, 0.12);
  trackingSynth.sparkle.frequency.setTargetAtTime(motifFrequency, now, 0.22);
  trackingSynth.filter.frequency.setTargetAtTime(880 + energy * 480 + state.trackingQuality * 180 + bloom * 70, now, 0.14);

  const leadVolume = (0.017 + energy * 0.006) * (0.86 + state.trackingQuality * 0.14);
  const harmonicVolume = (0.002 + harmonicMix * 0.011) * state.trackingQuality * (0.74 + bloom * 0.26);
  const subVolume = (0.008 + THREE.MathUtils.smoothstep(energy, 0.62, 1) * 0.006) * (0.92 + (1 - bloom) * 0.08);
  const sparkleVolume = sparkleMix * state.trackingQuality * (0.0015 + bloom * 0.006);
  const gainTime = engagedLevel ? seamlessGrace || softGrace ? 0.1 : 0.05 : 0.085;
  trackingSynth.leadGain.gain.setTargetAtTime(Math.max(0.0001, leadVolume * volume * engagedLevel), now, gainTime);
  trackingSynth.harmonicGain.gain.setTargetAtTime(Math.max(0.0001, harmonicVolume * volume * engagedLevel), now, gainTime * 1.2);
  trackingSynth.subGain.gain.setTargetAtTime(Math.max(0.0001, subVolume * volume * engagedLevel), now, gainTime * 1.1);
  trackingSynth.sparkleGain.gain.setTargetAtTime(Math.max(0.0001, sparkleVolume * volume * engagedLevel), now, gainTime * 1.35);
  trackingSynth.wetGain.gain.setTargetAtTime(Math.max(0.0001, (0.016 + energy * 0.055) * engagedLevel), now, 0.14);
  trackingSynth.bodyPanner?.pan.setTargetAtTime(pan, now, 0.07);
  trackingSynth.harmonicPanner?.pan.setTargetAtTime(-stereoWidth * 0.72, now, 0.16);
  trackingSynth.sparklePanner?.pan.setTargetAtTime(stereoWidth * Math.sin(state.trackingBloomPhase * 0.5), now, 0.18);
  document.body.classList.toggle("tracking-locked", active);
  ui.trackEnergy.style.setProperty("--track-energy-angle", `${state.trackingEnergy * 3.6}deg`);
  updateTrackingFeedback(active, target, delta);
}

function stopTrackingSynth(release = 0.11) {
  if (!trackingSynth || !audioContext) {
    trackingSynth = undefined;
    document.body.classList.remove("tracking-locked");
    return;
  }
  const synth = trackingSynth;
  const now = audioContext.currentTime;
  for (const gain of [synth.leadGain, synth.harmonicGain, synth.subGain, synth.sparkleGain, synth.wetGain]) {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0.0001, now, Math.max(0.015, release / 3));
  }
  const stopAt = now + release * 4;
  synth.lead.stop(stopAt);
  synth.harmonic.stop(stopAt);
  synth.sub.stop(stopAt);
  synth.sparkle.stop(stopAt);
  synth.lfo.stop(stopAt);
  synth.feedbackGain.gain.setTargetAtTime(0.0001, now, 0.025);
  trackingSynth = undefined;
  document.body.classList.remove("tracking-locked");
}

function releaseTrigger() {
  state.triggerHeld = false;
  state.trackingEnergy = 0;
  state.trackingQuality = 0;
  state.trackingLostTime = 0;
  state.trackingRecentSamples = [];
  state.trackingStreak = 0;
  state.trackingMissStreak = 0;
  state.trackingStarted = false;
  state.trackingAcquireStartedAt = performance.now();
  state.trackingStage = 0;
  state.trackingFeedbackTimer = 0;
  state.trackingFeedbackCooldown = 0;
  if (state.trainingMode === "track") {
    state.combo = 0;
    state.difficultyLevel = 1;
    document.body.dataset.flow = "0";
    ui.flowLabel.textContent = "FLOW 1";
  }
  ui.trackEnergy.style.setProperty("--track-energy-angle", "0deg");
  document.body.classList.remove("tracking-full");
  stopTrackingSynth();
}

const MAX_PITCH_COMBO = 40;
const BLOOM_SCALE = [0, 2, 4, 7, 9];

function comboFrequency(combo, base = 620) {
  const capped = Math.min(Math.max(combo - 1, 0), MAX_PITCH_COMBO - 1);
  const scalePosition = (capped / (MAX_PITCH_COMBO - 1)) * 8;
  const step = Math.floor(scalePosition);
  const octave = Math.floor(step / BLOOM_SCALE.length);
  const semitone = BLOOM_SCALE[step % BLOOM_SCALE.length] + octave * 12;
  return base * Math.pow(2, semitone / 12);
}

function playHit(combo, pan = 0) {
  const cappedCombo = Math.min(Math.max(combo, 1), MAX_PITCH_COMBO);
  const progress = (cappedCombo - 1) / (MAX_PITCH_COMBO - 1);
  const curvedProgress = Math.pow(progress, 0.82);
  const note = comboFrequency(cappedCombo);
  const shimmer = comboFrequency(cappedCombo, 880);

  tone({ frequency: note * 0.55, endFrequency: note * 0.92, duration: 0.11, volume: 0.073, type: "sine", pan });
  tone({ frequency: note, endFrequency: note * 1.38, duration: 0.17, volume: 0.04, type: "triangle", delay: 0.012, pan });
  tone({ frequency: 108, endFrequency: 58, duration: 0.095, volume: 0.045, type: "sine", pan: pan * 0.35 });
  noise(0.065, 0.028, 3600 + curvedProgress * 1700, pan);

  if (combo >= 5) tone({ frequency: shimmer, endFrequency: shimmer * 1.28, duration: 0.13, volume: 0.017, type: "sine", delay: 0.026, pan: pan * 0.8 });
  if (combo >= 10) tone({ frequency: note * 0.75, endFrequency: note * 1.08, duration: 0.23, volume: 0.025, type: "sine", delay: 0.038, pan: -pan * 0.4 });
  if ([5, 10, 20, 30, 40].includes(combo)) {
    const stageStrength = Math.min(1, combo / 30);
    tone({ frequency: note * 0.72, endFrequency: note * (1.55 + stageStrength * 0.22), duration: 0.3, volume: 0.032, type: "triangle", delay: 0.025, pan });
    tone({ frequency: note * 1.18, endFrequency: note * 1.62, duration: 0.28, volume: 0.018, type: "sine", delay: 0.06, pan: -pan * 0.5 });
  }
  if (combo >= 40 && combo % 5 === 0) {
    tone({ frequency: shimmer * 0.8, endFrequency: shimmer * 1.16, duration: 0.34, volume: 0.02, type: "sine", delay: 0.045, pan: -pan });
  }
}

function playTrackingFeedbackChord(stage, variant = 0, pan = 0) {
  const root = [220, 220, 247, 262, 294][stage] || 220;
  tone({ frequency: root, endFrequency: root * 1.05, duration: 0.34, volume: 0.019, type: "sine", pan });
  if (stage >= 2) tone({ frequency: root * 1.5, endFrequency: root * 1.52, duration: 0.32, volume: 0.01, type: "sine", delay: 0.035, pan: -pan * 0.35 });
  if (stage >= 3) tone({ frequency: root * 0.5, endFrequency: root * 0.58, duration: 0.46, volume: 0.015, type: "sine", delay: 0.02, pan: pan * 0.2 });
  if (stage >= 4) {
    const accent = [330, 392, 440, 392][variant % 4];
    tone({ frequency: accent, endFrequency: accent * 1.04, duration: 0.3, volume: 0.009, type: "triangle", delay: 0.07, pan: variant % 2 ? 0.25 : -0.25 });
    if (variant === 3) tone({ frequency: 660, endFrequency: 550, duration: 0.42, volume: 0.006, type: "sine", delay: 0.12, pan: 0 });
  }
}

function playMiss() {
  tone({ frequency: 168, endFrequency: 118, duration: 0.09, volume: 0.021, type: "triangle" });
}

function retrigger(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function updateHud() {
  const accuracy = state.shots ? Math.round((state.hits / state.shots) * 100) : 100;
  ui.score.textContent = String(state.score).padStart(5, "0");
  if (!TRAINING_MODES[state.trainingMode].timed) {
    ui.time.textContent = "∞";
    ui.timeBar.style.transform = `scaleX(${0.35 + Math.sin(state.elapsed * 1.8) * 0.12})`;
  } else {
    ui.time.textContent = Math.max(0, state.remaining).toFixed(1);
    ui.timeBar.style.transform = `scaleX(${Math.max(0, state.remaining / state.sessionSeconds)})`;
  }
  ui.accuracy.textContent = `${accuracy}%`;
  ui.comboValue.textContent = state.combo;
  ui.flowLabel.textContent = `FLOW ${state.difficultyLevel}`;
}

function getFlowTier() {
  if (state.combo >= 24) return 3;
  if (state.combo >= 12) return 2;
  if (state.combo >= 5) return 1;
  return 0;
}

function refreshFlowLevel() {
  const performanceLevel = Math.min(5, 1 + Math.floor(state.combo / 8));
  if (TRAINING_MODES[state.trainingMode].adaptive) state.difficultyLevel = Math.max(state.difficultyLevel, performanceLevel);
  else state.difficultyLevel = performanceLevel;
}

function updateAdaptiveDifficulty(hit, reaction = 9999) {
  if (!TRAINING_MODES[state.trainingMode].adaptive) return;
  if (hit && reaction < 760) {
    state.adaptiveHits += 1;
    state.adaptiveMisses = 0;
    if (state.adaptiveHits >= 7) {
      state.difficultyLevel = Math.min(5, state.difficultyLevel + 1);
      state.adaptiveHits = 0;
    }
  } else if (!hit) {
    state.adaptiveMisses += 1;
    state.adaptiveHits = Math.max(0, state.adaptiveHits - 2);
    if (state.adaptiveMisses >= 2) {
      state.difficultyLevel = Math.max(1, state.difficultyLevel - 1);
      state.adaptiveMisses = 0;
    }
  }
}

function showHitFeedback(tier) {
  const wordSets = [
    ["命中", "精准", "漂亮"],
    ["很稳", "节奏在线", "继续"],
    ["状态正佳", "保持节奏", "连续命中"],
    ["火力全开", "势不可挡", "完美发挥"],
  ];
  const words = wordSets[tier];
  ui.feedback.textContent = words[Math.floor(Math.random() * words.length)];
  retrigger(ui.feedback, "show");
  if (settings.flash > 0) retrigger(ui.flash, "pop");
  retrigger(ui.crosshair, "hit");
  retrigger(ui.combo, "bump");
  document.body.dataset.flow = String(tier);
  ui.flowLabel.textContent = `FLOW ${state.difficultyLevel}`;
}

function trackingStageForEnergy(energy) {
  if (energy >= 99.5) return 4;
  if (energy >= 70) return 3;
  if (energy >= 35) return 2;
  if (energy >= 12) return 1;
  return 0;
}

function pickTrackingFeedback(pool) {
  const available = pool.filter((word) => word !== state.trackingLastFeedback);
  const choices = available.length ? available : pool;
  const word = choices[state.trackingFeedbackCount % choices.length];
  state.trackingLastFeedback = word;
  return word;
}

function showTrackingFeedback(stage, target, variant = 0, looping = false) {
  if (!target) return;
  const stageWords = {
    1: ["目标锁定", "跟上了"],
    2: ["跟随稳定", "保持准星"],
    3: ["节奏在线", "状态正佳"],
    4: ["完美追踪"],
  };
  const loopWords = ["目标锁定", "跟随稳定", "保持节奏", "完美追踪"];
  const text = pickTrackingFeedback(looping ? loopWords : stageWords[stage] || ["目标锁定"]);
  ui.feedback.textContent = text;
  retrigger(ui.feedback, "show");
  retrigger(ui.crosshair, "hit");
  retrigger(ui.combo, "bump");
  if (variant === 3 && settings.flash > 0) retrigger(ui.flash, "pop");
  createTrackingWave(target.position, variant);
  playTrackingFeedbackChord(stage, variant, THREE.MathUtils.clamp(target.position.x / 7, -0.35, 0.35));
  state.trackingFeedbackCooldown = 0.7;
}

function updateTrackingFeedback(active, target, delta) {
  state.trackingFeedbackCooldown = Math.max(0, state.trackingFeedbackCooldown - delta);
  const nextStage = trackingStageForEnergy(state.trackingEnergy);
  if (nextStage > state.trackingStage && state.trackingFeedbackCooldown <= 0 && target) {
    const variant = nextStage === 4 ? 3 : Math.max(0, nextStage - 1);
    showTrackingFeedback(nextStage, target, variant, false);
    if (nextStage === 4) state.trackingFeedbackTimer = 0;
  }
  state.trackingStage = nextStage;
  state.difficultyLevel = Math.min(5, nextStage + 1);
  document.body.dataset.flow = String(Math.min(3, nextStage));
  document.body.classList.toggle("tracking-full", nextStage === 4);

  if (nextStage === 4 && active && state.trackingQuality >= 0.8) {
    state.trackingFeedbackTimer += delta;
    if (state.trackingFeedbackTimer >= 2.4 && state.trackingFeedbackCooldown <= 0) {
      state.trackingFeedbackTimer -= 2.4;
      state.trackingFeedbackCount += 1;
      const variant = (state.trackingFeedbackCount - 1) % 4;
      showTrackingFeedback(4, target, variant, true);
    }
  } else if (nextStage < 4) {
    state.trackingFeedbackTimer = 0;
  }
}

function zoneForTarget(target) {
  if (target.position.x < -1.4) return "left";
  if (target.position.x > 1.4) return "right";
  return "center";
}

function registerZoneHit(target, reaction) {
  const zone = zoneForTarget(target);
  const stats = state.zoneStats[zone];
  stats.hits += 1;
  stats.totalReaction += reaction;
}

function removeTarget(target) {
  const index = activeTargets.indexOf(target);
  if (index >= 0) activeTargets.splice(index, 1);
  releaseTarget(target);
}

function completeTargetHit(target) {
  if (!target || target.userData.dead) return;
  target.userData.dead = true;
  const age = performance.now() - target.userData.born;
  state.reactionTimes.push(age);
  registerZoneHit(target, age);
  state.lastHitAt = performance.now();
  state.hits += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  refreshFlowLevel();
  updateAdaptiveDifficulty(true, age);
  const speedBonus = Math.max(0, Math.round(64 - age / 19));
  const comboBonus = Math.min(48, Math.max(0, state.combo - 1) * 3);
  const modeBonus = state.trainingMode === "switch" ? 18 : 0;
  state.score += 100 + speedBonus + comboBonus + modeBonus;
  const tier = getFlowTier();
  state.hitStop = 0.026;
  state.shake = settings.cameraShake ? 1 : 0;
  playHit(state.combo, THREE.MathUtils.clamp(target.position.x / 7, -0.35, 0.35));
  showHitFeedback(tier);
  createBloom(target.position, tier);
  removeTarget(target);
  spawnTarget();
}

function shoot() {
  if (state.mode !== "playing" || TRAINING_MODES[state.trainingMode].tracking) return;
  state.shots += 1;
  state.recoil = 1;
  playShot();
  retrigger(ui.crosshair, "shot");

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersections = raycaster.intersectObjects(activeTargets, true);
  const hit = intersections.find((intersection) => intersection.object.userData.targetRoot?.userData.isTarget);

  if (hit) {
    const target = hit.object.userData.targetRoot;
    completeTargetHit(target);
  } else {
    state.combo = 0;
    state.difficultyLevel = TRAINING_MODES[state.trainingMode].adaptive ? state.difficultyLevel : 1;
    updateAdaptiveDifficulty(false);
    if (TRAINING_MODES[state.trainingMode].timed) state.score = Math.max(0, state.score - 15);
    document.body.dataset.flow = "0";
    ui.flowLabel.textContent = `FLOW ${state.difficultyLevel}`;
    playMiss();
  }
  updateHud();
}

function updateTracking(delta) {
  if (state.mode !== "playing" || state.trainingMode !== "track" || !state.triggerHeld) return;
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersection = raycaster.intersectObjects(activeTargets, true)
    .find((item) => item.object.userData.targetRoot?.userData.isTarget);
  const target = intersection?.object.userData.targetRoot;
  updateTrackingSynth(Boolean(target), target, delta);
  state.trackingAccumulator += delta;
  if (state.trackingAccumulator < 0.08) return;
  state.trackingAccumulator -= 0.08;
  state.trackingSamples += 1;
  state.shots += 1;
  state.trackingRecentSamples.push(target ? 1 : 0);
  if (state.trackingRecentSamples.length > 10) state.trackingRecentSamples.shift();
  if (target) {
    if (!state.trackingStarted) {
      const acquisition = performance.now() - state.trackingAcquireStartedAt;
      state.reactionTimes.push(acquisition);
      registerZoneHit(target, acquisition);
      state.trackingStarted = true;
    }
    state.trackingOnTarget += 1;
    state.hits += 1;
    state.trackingStreak += 1;
    state.trackingMissStreak = 0;
    state.trackingBestStreak = Math.max(state.trackingBestStreak, state.trackingStreak);
    state.combo = Math.min(99, Math.floor(state.trackingStreak / 2));
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.score += 12 + state.difficultyLevel * 2;
  } else {
    state.trackingMissStreak += 1;
    if (state.trackingMissStreak >= 3) {
      state.trackingStreak = 0;
      state.combo = 0;
      state.trackingStarted = false;
      state.trackingAcquireStartedAt = performance.now();
    }
  }
  updateHud();
}

function setScreen(name) {
  document.body.dataset.screen = name;
  ui.menu.classList.toggle("is-hidden", name !== "menu");
  ui.tutorial.classList.toggle("is-hidden", name !== "tutorial");
  ui.pause.classList.toggle("is-hidden", name !== "pause");
  ui.settings.classList.toggle("is-hidden", name !== "settings");
  ui.dailyTransition.classList.toggle("is-hidden", name !== "daily");
  ui.results.classList.toggle("is-hidden", name !== "results");
  const inSession = name === "playing" || name === "pause";
  ui.hud.classList.toggle("is-hidden", !inSession);
  ui.crosshair.classList.toggle("is-hidden", !inSession);
  ui.combo.classList.toggle("is-hidden", !inSession);
  ui.endSession.classList.toggle("is-hidden", !(inSession && state.trainingMode === "zen"));
  document.body.classList.toggle("game-active", inSession);
}

function requestAimLock() {
  ensureAudio();
  try {
    const request = renderer.domElement.requestPointerLock?.();
    request?.catch?.(() => {
      // Some embedded browsers deny pointer lock. Absolute mouse aiming remains active.
    });
  } catch {
    // Pointer lock is an enhancement, not a requirement for starting a session.
  }
}

function startGame() {
  document.body.classList.remove("new-best-result");
  const config = TRAINING_MODES[state.trainingMode];
  releaseTrigger();
  state.mode = "playing";
  state.score = 0;
  state.shots = 0;
  state.hits = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.sessionSeconds = state.dailyActive ? DAILY_SESSION_SECONDS : config.duration;
  state.remaining = state.sessionSeconds;
  state.elapsed = 0;
  state.reactionTimes = [];
  state.lastHitAt = 0;
  state.hitStop = 0;
  state.difficultyLevel = 1;
  state.adaptiveHits = 0;
  state.adaptiveMisses = 0;
  state.trackingSamples = 0;
  state.trackingOnTarget = 0;
  state.trackingAccumulator = 0;
  state.trackingStreak = 0;
  state.trackingBestStreak = 0;
  state.trackingMissStreak = 0;
  state.trackingStarted = false;
  state.trackingAcquireStartedAt = performance.now();
  state.trackingEnergy = 0;
  state.trackingQuality = 0;
  state.trackingLostTime = 0;
  state.trackingBloomPhase = 0;
  state.trackingRecentSamples = [];
  state.trackingStage = 0;
  state.trackingFeedbackTimer = 0;
  state.trackingFeedbackCount = 0;
  state.trackingFeedbackCooldown = 0;
  state.trackingLastFeedback = "";
  state.shake = 0;
  state.zoneStats = {
    left: { hits: 0, totalReaction: 0 },
    center: { hits: 0, totalReaction: 0 },
    right: { hits: 0, totalReaction: 0 },
  };
  state.yaw = 0;
  state.pitch = 0;
  state.pointerWasLocked = false;
  document.body.dataset.flow = "0";
  ui.flowLabel.textContent = "FLOW 1";
  ui.timeLabel.textContent = config.tracking ? "追踪时间" : config.timed ? "剩余时间" : "训练时间";
  camera.rotation.set(0, 0, 0);
  clearTargets();
  fillTargets();
  updateHud();
  setScreen("playing");
  requestAimLock();
}

function prepareGame() {
  if (!localStorage.getItem("bloomshot-tutorial-seen")) {
    state.mode = "tutorial";
    setScreen("tutorial");
    return;
  }
  startGame();
}

function resumeGame() {
  state.mode = "playing";
  setScreen("playing");
  requestAimLock();
}

function renderHistory() {
  const historyMode = state.resultMode || state.trainingMode;
  const modeRuns = history.filter((run) => run.mode === historyMode).slice(-5);
  ui.historyBars.replaceChildren();
  const maxScore = Math.max(1, ...modeRuns.map((run) => run.score));
  if (!modeRuns.length) {
    const empty = document.createElement("span");
    empty.className = "history-empty";
    empty.textContent = "完成训练后生成趋势";
    ui.historyBars.appendChild(empty);
    return;
  }
  modeRuns.forEach((run, index) => {
    const bar = document.createElement("i");
    bar.style.setProperty("--bar", `${Math.max(18, (run.score / maxScore) * 100)}%`);
    bar.title = `第 ${index + 1} 局 · ${run.score.toLocaleString("zh-CN")}`;
    const value = document.createElement("b");
    value.textContent = Math.round(run.score / 100) * 100;
    bar.appendChild(value);
    ui.historyBars.appendChild(bar);
  });
}

function getWeakZone(zoneStats) {
  const names = { left: "左侧", center: "中央", right: "右侧" };
  const ranked = Object.entries(zoneStats || {})
    .filter(([, stats]) => stats.hits > 0)
    .map(([zone, stats]) => ({ zone, average: stats.totalReaction / stats.hits }))
    .sort((a, b) => b.average - a.average);
  return ranked.length > 1 ? names[ranked[0].zone] : "继续采样";
}

function summarizeCurrentRun(mode = state.trainingMode) {
  const accuracy = state.shots ? Math.round((state.hits / state.shots) * 100) : 0;
  const averageSpeed = state.reactionTimes.length ? Math.round(state.reactionTimes.reduce((sum, value) => sum + value, 0) / state.reactionTimes.length) : 0;
  const medianSpeed = median(state.reactionTimes);
  const fastestSpeed = state.reactionTimes.length ? Math.round(Math.min(...state.reactionTimes)) : 0;
  const trackingSeconds = state.trackingBestStreak * 0.08;
  const precisionGrade = gradeFor(accuracy, [92, 84, 72, 58]);
  const speedGrade = mode === "track"
    ? gradeFor(state.score / Math.max(1, state.elapsed), [205, 175, 140, 95])
    : gradeFor(Math.max(0, 1000 - averageSpeed), [680, 570, 450, 300]);
  const stabilityGrade = mode === "track"
    ? gradeFor(trackingSeconds, [8, 5.5, 3.5, 1.8])
    : gradeFor(state.bestCombo, [34, 24, 14, 7]);
  const gradePoints = { S: 5, A: 4, B: 3, C: 2, D: 1 };
  const averageGrade = Math.round((gradePoints[precisionGrade] + gradePoints[speedGrade] + gradePoints[stabilityGrade]) / 3);
  const grade = Object.keys(gradePoints).find((key) => gradePoints[key] === averageGrade) || "B";
  return {
    mode,
    score: state.score,
    accuracy,
    speed: averageSpeed,
    medianSpeed,
    fastestSpeed,
    combo: state.bestCombo,
    hits: state.hits,
    shots: state.shots,
    duration: state.elapsed,
    trackingSeconds,
    zoneStats: state.zoneStats,
    weakZone: getWeakZone(state.zoneStats),
    precisionGrade,
    speedGrade,
    stabilityGrade,
    grade,
    date: Date.now(),
  };
}

function storeRun(summary) {
  const previous = [...history].reverse().find((run) => run.mode === summary.mode);
  const isBest = summary.score > (bestScores[summary.mode] || 0);
  if (isBest) {
    bestScores[summary.mode] = summary.score;
    saveBestScores();
  }
  history.push(summary);
  history = history.slice(-40);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return { previous, isBest };
}

function renderResult(summary, previous, isBest) {
  state.mode = "results";
  state.resultMode = summary.mode;
  document.exitPointerLock?.();
  setScreen("results");
  document.body.classList.toggle("new-best-result", isBest);
  const isTrack = summary.mode === "track";
  const isZen = summary.mode === "zen";
  const isDaily = summary.mode === "daily";
  ui.grade.textContent = isZen ? "∞" : summary.grade;
  ui.resultTitle.textContent = isDaily ? "今日训练完成" : isZen ? "训练结束" : summary.grade === "S" ? "完美发挥" : summary.grade === "A" ? "状态正佳" : summary.grade === "B" ? "渐入状态" : "再来一轮";
  ui.resultScoreLabel.textContent = isZen ? "命中目标" : isDaily ? "综合得分" : "最终得分";
  ui.finalScore.textContent = (isZen ? summary.hits : summary.score).toLocaleString("zh-CN");
  ui.precisionLabel.textContent = isTrack ? "跟随" : "精准";
  ui.speedLabel.textContent = isTrack ? "平滑" : "速度";
  ui.stabilityLabel.textContent = isTrack ? "持续" : "稳定";
  ui.precisionGrade.textContent = summary.precisionGrade;
  ui.speedGrade.textContent = summary.speedGrade;
  ui.stabilityGrade.textContent = summary.stabilityGrade;
  ui.finalAccuracy.textContent = `${summary.accuracy}%`;
  ui.finalSpeed.textContent = isTrack ? `${Math.round(summary.score / Math.max(1, summary.duration))}/s` : summary.speed ? `${summary.speed}ms` : "—";
  ui.finalCombo.textContent = isTrack ? `${summary.trackingSeconds.toFixed(1)} 秒` : `${summary.combo} 连击`;
  ui.medianSpeed.textContent = summary.medianSpeed ? `${summary.medianSpeed}ms` : "—";
  ui.fastestSpeed.textContent = summary.fastestSpeed ? `${summary.fastestSpeed}ms` : "—";
  ui.weakZone.textContent = summary.weakZone;
  ui.newBest.classList.toggle("show", isBest);
  ui.resultNote.textContent = isDaily ? `三项训练全部完成 · 连续 ${dailyRecord.streak} 天` : isZen ? `本轮命中 ${summary.hits} 次` : summary.accuracy >= 85 ? "准心稳 节奏快 这局很干净" : summary.accuracy >= 65 ? "手感起来了 再冲一轮" : "放松手腕 瞄准目标中心";
  if (!previous) ui.resultInsight.textContent = summary.weakZone === "继续采样" ? "第一局已记录，下一局开始显示进步" : `${summary.weakZone}反应稍慢 · 下一局注意提前回正`;
  else if (isZen) ui.resultInsight.textContent = summary.hits >= previous.hits ? `比上次多命中 ${summary.hits - previous.hits} 个目标` : `再命中 ${previous.hits - summary.hits + 1} 个就能超过上次`;
  else {
    const scoreDelta = summary.score - previous.score;
    const accuracyDelta = summary.accuracy - previous.accuracy;
    ui.resultInsight.textContent = `${scoreDelta >= 0 ? "得分 +" : "得分 "}${scoreDelta.toLocaleString("zh-CN")} · 命中率 ${accuracyDelta >= 0 ? "+" : ""}${accuracyDelta}%`;
  }
  ui.historyLabel.textContent = summary.mode === "daily" ? "DAILY" : TRAINING_MODES[summary.mode]?.code || "TRAINING";
  renderHistory();
  updateModeBest();
}

function createDailyTotals() {
  return { score: 0, hits: 0, shots: 0, combo: 0, duration: 0, reactions: [], trackingSeconds: 0, zoneStats: {
    left: { hits: 0, totalReaction: 0 }, center: { hits: 0, totalReaction: 0 }, right: { hits: 0, totalReaction: 0 },
  } };
}

function addDailySummary(summary) {
  const totals = state.dailyTotals;
  totals.score += summary.score;
  totals.hits += summary.hits;
  totals.shots += summary.shots;
  totals.combo = Math.max(totals.combo, summary.combo);
  totals.duration += summary.duration;
  totals.trackingSeconds = Math.max(totals.trackingSeconds, summary.trackingSeconds);
  totals.reactions.push(...state.reactionTimes);
  for (const zone of ["left", "center", "right"]) {
    totals.zoneStats[zone].hits += summary.zoneStats[zone].hits;
    totals.zoneStats[zone].totalReaction += summary.zoneStats[zone].totalReaction;
  }
}

function dailySummary() {
  const totals = state.dailyTotals;
  const accuracy = totals.shots ? Math.round((totals.hits / totals.shots) * 100) : 0;
  const speed = totals.reactions.length ? Math.round(totals.reactions.reduce((sum, value) => sum + value, 0) / totals.reactions.length) : 0;
  const precisionGrade = gradeFor(accuracy, [90, 82, 70, 56]);
  const speedGrade = gradeFor(Math.max(0, 1000 - speed), [660, 550, 430, 280]);
  const stabilityGrade = gradeFor(totals.combo, [30, 21, 13, 6]);
  const points = { S: 5, A: 4, B: 3, C: 2, D: 1 };
  const gradePoint = Math.round((points[precisionGrade] + points[speedGrade] + points[stabilityGrade]) / 3);
  const grade = Object.keys(points).find((key) => points[key] === gradePoint) || "B";
  return { mode: "daily", score: totals.score, accuracy, speed, medianSpeed: median(totals.reactions), fastestSpeed: totals.reactions.length ? Math.round(Math.min(...totals.reactions)) : 0, combo: totals.combo, hits: totals.hits, shots: totals.shots, duration: totals.duration, trackingSeconds: totals.trackingSeconds, zoneStats: totals.zoneStats, weakZone: getWeakZone(totals.zoneStats), precisionGrade, speedGrade, stabilityGrade, grade, date: Date.now() };
}

function updateDailyRecord() {
  const today = localDateKey();
  if (dailyRecord.lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    dailyRecord.streak = dailyRecord.lastDate === localDateKey(yesterday) ? dailyRecord.streak + 1 : 1;
    dailyRecord.lastDate = today;
  }
  dailyRecord.best = Math.max(dailyRecord.best || 0, state.dailyTotals.score);
  localStorage.setItem(DAILY_KEY, JSON.stringify(dailyRecord));
  updateDailyCard();
}

function showDailyTransition(summary) {
  state.mode = "daily";
  document.exitPointerLock?.();
  setScreen("daily");
  const nextMode = TRAINING_MODES[DAILY_MODES[state.dailyIndex + 1]];
  ui.dailyTitle.textContent = `第 ${state.dailyIndex + 1} 项完成`;
  ui.dailyNote.textContent = "调整呼吸，准备进入下一项";
  ui.dailyStageScore.textContent = summary.score.toLocaleString("zh-CN");
  ui.dailyNext.querySelector("span").textContent = `下一项：${nextMode.name}`;
  [...ui.dailyProgress.children].forEach((item, index) => item.classList.toggle("done", index <= state.dailyIndex));
}

function endGame() {
  releaseTrigger();
  const summary = summarizeCurrentRun();
  const stored = storeRun(summary);
  if (state.dailyActive) {
    addDailySummary(summary);
    if (state.dailyIndex < DAILY_MODES.length - 1) {
      showDailyTransition(summary);
      return;
    }
    updateDailyRecord();
    const combined = dailySummary();
    const dailyStored = storeRun(combined);
    state.dailyActive = false;
    renderResult(combined, dailyStored.previous, dailyStored.isBest);
    return;
  }
  renderResult(summary, stored.previous, stored.isBest);
}

function goHome() {
  document.body.classList.remove("new-best-result");
  state.dailyActive = false;
  releaseTrigger();
  state.mode = "menu";
  document.exitPointerLock?.();
  setScreen("menu");
  clearTargets();
  fillTargets();
  state.yaw = 0;
  state.pitch = 0;
  state.combo = 0;
  document.body.dataset.flow = "0";
}

let menuPreviewHits = 0;
let menuPreviewResetTimer;
let menuPreviewMoveTimer;
let menuPreviewPosition = { x: 0, y: 0 };

function moveStaticMenuPreview(mode, reset = false) {
  const target = ui.previewHit.querySelector(".preview-target-wrap");
  if (!target) return;
  if (reset || mode === "track") {
    menuPreviewPosition = { x: 0, y: 0 };
  } else {
    const ranges = {
      flick: { x: 34, y: 20 },
      switch: { x: 72, y: 16 },
      zen: { x: 48, y: 28 },
    };
    const range = ranges[mode] || ranges.flick;
    let next;
    do {
      next = {
        x: Math.round((Math.random() * 2 - 1) * range.x),
        y: Math.round((Math.random() * 2 - 1) * range.y),
      };
    } while (Math.hypot(next.x - menuPreviewPosition.x, next.y - menuPreviewPosition.y) < 22);
    menuPreviewPosition = next;
  }
  target.style.setProperty("--preview-x", `${menuPreviewPosition.x}px`);
  target.style.setProperty("--preview-y", `${menuPreviewPosition.y}px`);
}

function playMenuPreview() {
  if (state.mode !== "menu") return;
  const words = ["正中", "漂亮", "精准", "好节奏"];
  menuPreviewHits = (menuPreviewHits % 8) + 1;
  ui.previewFeedback.textContent = words[(menuPreviewHits - 1) % words.length];
  retrigger(ui.previewHit, "is-hit");
  playHit(menuPreviewHits, 0);
  clearTimeout(menuPreviewMoveTimer);
  if (state.trainingMode !== "track") {
    menuPreviewMoveTimer = window.setTimeout(() => moveStaticMenuPreview(state.trainingMode), 180);
  }
  clearTimeout(menuPreviewResetTimer);
  menuPreviewResetTimer = window.setTimeout(() => {
    ui.previewHit.classList.remove("is-hit");
    ui.previewFeedback.textContent = "再点一下 感受连击变化";
  }, 760);
}

function selectTrainingMode(mode) {
  const config = TRAINING_MODES[mode];
  state.trainingMode = mode;
  document.body.dataset.mode = mode;
  for (const [key, button] of Object.entries({ flick: ui.modeFlick, switch: ui.modeSwitch, track: ui.modeTrack, zen: ui.modeZen })) {
    button.classList.toggle("is-active", key === mode);
  }
  ui.modeName.textContent = config.code;
  ui.modeDuration.textContent = config.timed ? `00:${String(config.duration).padStart(2, "0")}` : "∞";
  ui.modeTargets.textContent = config.targetLabel;
  ui.menuModeTitle.textContent = config.name;
  ui.menuModeTagline.textContent = config.tagline;
  ui.hallModeIndex.textContent = MODE_ORDER[mode];
  ui.hallObjective.textContent = config.objective;
  ui.tutorialModeName.textContent = config.name;
  ui.pauseModeName.textContent = config.name;
  ui.tutorialSpecialTitle.textContent = TUTORIAL_MODE_COPY[mode].title;
  ui.tutorialSpecialNote.textContent = TUTORIAL_MODE_COPY[mode].note;
  ui.modeChip.innerHTML = `<span></span> ${MODE_ORDER[mode]} · ${config.timed ? `${config.duration} 秒` : "不限时间"}`;
  ui.start.querySelector("span").textContent = config.startLabel;
  ui.bestLabel.textContent = "最佳成绩";
  clearTimeout(menuPreviewMoveTimer);
  moveStaticMenuPreview(mode, true);
  updateModeBest();
  if (state.mode === "menu") {
    clearTargets();
    fillTargets();
  }
}

function updateModeBest() {
  bestScore = bestScores[state.trainingMode] || 0;
  ui.menuBest.textContent = bestScore ? bestScore.toLocaleString("zh-CN") : "—";
}

function startDaily() {
  state.dailyActive = true;
  state.dailyIndex = 0;
  state.dailyTotals = createDailyTotals();
  selectTrainingMode(DAILY_MODES[0]);
  state.dailyActive = true;
  prepareGame();
}

function nextDailyStage() {
  state.dailyIndex += 1;
  selectTrainingMode(DAILY_MODES[state.dailyIndex]);
  state.dailyActive = true;
  startGame();
}

function openSettings() {
  if (state.mode === "playing" || state.mode === "pause") {
    releaseTrigger();
    if (state.mode === "playing") document.exitPointerLock?.();
    state.mode = "pause";
    state.settingsReturn = "pause";
  } else {
    state.settingsReturn = state.mode === "results" || state.mode === "daily" ? state.mode : "menu";
  }
  setScreen("settings");
}

function closeSettings() {
  state.mode = state.settingsReturn;
  setScreen(state.settingsReturn);
}

ui.start.addEventListener("click", prepareGame);
ui.retry.addEventListener("click", () => {
  if (state.resultMode === "daily") startDaily();
  else {
    selectTrainingMode(state.resultMode);
    startGame();
  }
});
ui.resume.addEventListener("click", resumeGame);
ui.pauseRestart.addEventListener("click", startGame);
ui.pauseSettings.addEventListener("click", openSettings);
ui.quit.addEventListener("click", goHome);
ui.home.addEventListener("click", goHome);
ui.endSession.addEventListener("click", endGame);
ui.modeFlick.addEventListener("click", () => selectTrainingMode("flick"));
ui.modeSwitch.addEventListener("click", () => selectTrainingMode("switch"));
ui.modeTrack.addEventListener("click", () => selectTrainingMode("track"));
ui.modeZen.addEventListener("click", () => selectTrainingMode("zen"));
ui.previewHit.addEventListener("click", playMenuPreview);
ui.dailyStart.addEventListener("click", startDaily);
ui.dailyNext.addEventListener("click", nextDailyStage);
ui.dailyExit.addEventListener("click", goHome);
ui.tutorialStart.addEventListener("click", () => {
  localStorage.setItem("bloomshot-tutorial-seen", "1");
  startGame();
});
ui.tutorialSkip.addEventListener("click", () => {
  localStorage.setItem("bloomshot-tutorial-seen", "1");
  startGame();
});
ui.settingsOpen.addEventListener("click", openSettings);
ui.settingsClose.addEventListener("click", closeSettings);
ui.settingsReset.addEventListener("click", () => {
  Object.assign(settings, defaultSettings);
  applySettingsToUi();
  applySettings();
});

function applySettingsToUi() {
  ui.settingsSensitivity.value = String(settings.sensitivity);
  ui.settingsSensitivityValue.textContent = Number(settings.sensitivity).toFixed(2);
  ui.fov.value = String(settings.fov);
  ui.fovValue.textContent = `${settings.fov}°`;
  ui.volume.value = String(settings.volume);
  ui.volumeValue.textContent = `${Math.round(settings.volume * 100)}%`;
  ui.particles.value = String(settings.particles);
  ui.particlesValue.textContent = `${Math.round(settings.particles * 100)}%`;
  ui.flashStrength.value = String(settings.flash);
  ui.flashValue.textContent = `${Math.round(settings.flash * 100)}%`;
  ui.showGun.checked = settings.showGun;
  ui.cameraShake.checked = settings.cameraShake;
  ui.lowGraphics.checked = settings.lowGraphics;
  const fovProgress = (Number(settings.fov) - 55) / 45;
  ui.settingsPreview.style.setProperty("--preview-scale", String(0.9 + fovProgress * 0.18));
  ui.settingsPreview.style.setProperty("--preview-glow", String(0.18 + Number(settings.flash) * 0.72));
  ui.settingsPreview.style.setProperty("--preview-blur", `${Math.round(12 + Number(settings.flash) * 34)}px`);
  ui.settingsPreviewStatus.textContent = settings.lowGraphics
    ? "性能优先"
    : Number(settings.flash) > 0.82 || Number(settings.particles) > 1.15
      ? "强反馈"
      : Number(settings.volume) < 0.4
        ? "轻量反馈"
        : "标准配置";
}

function applySettings() {
  state.sensitivity = Number(settings.sensitivity);
  camera.fov = Number(settings.fov);
  camera.updateProjectionMatrix();
  gun.visible = Boolean(settings.showGun);
  renderer.shadowMap.enabled = !settings.lowGraphics;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.lowGraphics ? 1 : 1.75));
  document.documentElement.style.setProperty("--flash-strength", String(settings.flash));
  saveSettings();
  applySettingsToUi();
}

function bindSetting(input, key, parser = Number) {
  input.addEventListener("input", () => {
    settings[key] = parser(input.type === "checkbox" ? input.checked : input.value);
    applySettings();
  });
}

bindSetting(ui.settingsSensitivity, "sensitivity");
bindSetting(ui.fov, "fov");
bindSetting(ui.volume, "volume");
bindSetting(ui.particles, "particles");
bindSetting(ui.flashStrength, "flash");
bindSetting(ui.showGun, "showGun", Boolean);
bindSetting(ui.cameraShake, "cameraShake", Boolean);
bindSetting(ui.lowGraphics, "lowGraphics", Boolean);

renderer.domElement.addEventListener("mousedown", (event) => {
  if (event.button !== 0 || state.mode !== "playing") return;
  if (state.trainingMode === "track") {
    if (state.triggerHeld) return;
    state.triggerHeld = true;
    state.recoil = 0.45;
    if (!state.trackingStarted) state.trackingAcquireStartedAt = performance.now();
    startTrackingSynth();
  } else shoot();
});
document.addEventListener("mouseup", (event) => {
  if (event.button === 0) releaseTrigger();
});
window.addEventListener("blur", releaseTrigger);
renderer.domElement.addEventListener("click", () => {
  if (state.mode === "pause") resumeGame();
});

document.addEventListener("mousemove", (event) => {
  if (state.mode !== "playing") return;
  if (document.pointerLockElement === renderer.domElement) {
    const factor = state.sensitivity * 0.00165;
    state.yaw -= event.movementX * factor;
    state.pitch -= event.movementY * factor;
    state.pitch = THREE.MathUtils.clamp(state.pitch, -1.22, 1.18);
  } else {
    const horizontal = event.clientX / window.innerWidth - 0.5;
    const vertical = event.clientY / window.innerHeight - 0.5;
    state.yaw = -horizontal * 1.75 * state.sensitivity;
    state.pitch = THREE.MathUtils.clamp(-vertical * 1.22 * state.sensitivity, -1.12, 1.08);
  }
  camera.rotation.set(state.pitch, state.yaw, 0, "YXZ");
});

document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === renderer.domElement;
  if (locked) {
    state.pointerWasLocked = true;
  }
  if (locked && state.mode === "pause") {
    state.mode = "playing";
    setScreen("playing");
  } else if (!locked && state.pointerWasLocked && state.mode === "playing") {
    releaseTrigger();
    state.pointerWasLocked = false;
    state.mode = "pause";
    setScreen("pause");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.mode === "pause") {
    resumeGame();
    return;
  }
  if (event.code === "KeyE" && state.mode === "playing" && state.trainingMode === "zen") {
    endGame();
    return;
  }
  if (event.key === "Escape" && state.mode === "playing" && document.pointerLockElement !== renderer.domElement) {
    releaseTrigger();
    state.mode = "pause";
    setScreen("pause");
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.lowGraphics ? 1 : 1.75));
});

function updateTargets(time) {
  for (const target of activeTargets) {
    const birthProgress = Math.min(1, (performance.now() - target.userData.born) / 190);
    const elastic = birthProgress === 1 ? 1 : 1 - Math.pow(2, -10 * birthProgress) * Math.cos((birthProgress * 10 - 0.75) * (2 * Math.PI / 3));
    const pulse = 1 + Math.sin(time * 2.1 + target.userData.phase) * 0.018;
    target.scale.setScalar(elastic * pulse * (target.userData.baseScale || 1));
    if (state.trainingMode === "track") {
      const speed = target.userData.pathSpeed;
      target.position.x = target.userData.baseX + Math.sin(time * speed + target.userData.phase) * target.userData.pathWidth;
      target.position.y = target.userData.baseY + Math.sin(time * speed * 1.43 + target.userData.phase * 0.7) * target.userData.pathHeight;
    } else {
      target.position.y = target.userData.baseY + Math.sin(time * 0.85 + target.userData.phase) * 0.08;
    }
    target.lookAt(camera.position);
  }
}

function updateEffects(delta) {
  for (let i = effects.length - 1; i >= 0; i -= 1) {
    const effect = effects[i];
    effect.age += delta;
    const progress = effect.age / effect.duration;
    if (effect.type === "burst") {
      for (const piece of effect.pieces) {
        piece.position.addScaledVector(piece.userData.velocity, delta);
        piece.userData.velocity.y -= 3.2 * delta;
        piece.rotation.x += delta * 8;
        piece.rotation.z += delta * 5;
        piece.scale.multiplyScalar(Math.max(0.9, 1 - delta * 1.6));
      }
    } else if (effect.type === "ring") {
      effect.object.scale.setScalar(1 + progress * (effect.strength || 3.2));
      effect.material.opacity = Math.max(0, 0.9 * (1 - progress));
    } else {
      effect.object.scale.setScalar(1 + progress * 1.8);
      effect.material.opacity = Math.max(0, 0.92 * (1 - progress));
    }
    if (progress >= 1) {
      scene.remove(effect.object);
      effect.material?.dispose();
      effects.splice(i, 1);
    }
  }
}

let hudTick = 0;
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  if (state.mode === "playing") {
    state.elapsed += delta;
    if (TRAINING_MODES[state.trainingMode].timed) state.remaining -= delta;
    updateTracking(delta);
    hudTick += delta;
    if (hudTick > 0.05) {
      updateHud();
      hudTick = 0;
    }
    if (TRAINING_MODES[state.trainingMode].timed && state.remaining <= 0) endGame();
  }

  state.hitStop = Math.max(0, state.hitStop - delta);
  state.shake = THREE.MathUtils.lerp(state.shake, 0, 1 - Math.pow(0.0002, delta));

  state.recoil = THREE.MathUtils.lerp(state.recoil, 0, 1 - Math.pow(0.001, delta));
  gun.position.z = -0.9 + state.recoil * 0.095;
  gun.position.y = -0.42 - state.recoil * 0.035;
  gun.rotation.x = -0.03 + state.recoil * 0.055;

  if (state.mode === "menu") {
    camera.position.x = 0;
    camera.position.y = 1.7 + Math.sin(time * 0.55) * 0.035;
    camera.rotation.y = Math.sin(time * 0.22) * 0.018;
  } else {
    camera.position.x = Math.sin(time * 72) * state.shake * 0.008;
    camera.position.y = 1.7 + Math.cos(time * 66) * state.shake * 0.006;
  }

  const flowTier = getFlowTier();
  if (roomGlow) roomGlow.intensity = THREE.MathUtils.lerp(roomGlow.intensity, 36 + flowTier * 12, 0.08);

  const visualDelta = state.hitStop > 0 ? delta * 0.08 : delta;
  updateTargets(time);
  updateEffects(visualDelta);
  renderer.render(scene, camera);
}

fillTargets();
setScreen("menu");
applySettings();
selectTrainingMode("flick");
renderHistory();
updateDailyCard();
ui.start.disabled = false;
window.__bloomshotReady = true;
animate();
