export const TRAINING_RECIPE_SCHEMA_VERSION = 3;

export const TRAINING_RECIPE_CAPABILITIES = Object.freeze({
  modes: Object.freeze(["flick", "switch", "track", "zen"]),
  targetSizeModes: Object.freeze(["fixed", "combo"]),
  movementPatterns: Object.freeze(["static", "horizontal", "vertical", "figure8", "circle", "free", "waypoints"]),
  spawnPatterns: Object.freeze(["free", "horizontalLine", "verticalLine", "grid", "custom"]),
  spawnOrders: Object.freeze(["random", "sequential"]),
  limits: Object.freeze({
    phases: Object.freeze({ minimum: 1, maximum: 6 }),
    totalDuration: Object.freeze({ minimum: 15, maximum: 900 }),
    duration: Object.freeze({ minimum: 15, maximum: 180 }),
    difficulty: Object.freeze({ minimum: 1, maximum: 5 }),
    targetCount: Object.freeze({ minimum: 1, maximum: 5 }),
    targetScale: Object.freeze({ minimum: 0.35, maximum: 1.4 }),
    targetLifetime: Object.freeze({ disabled: 0, minimum: 0.5, maximum: 12 }),
    spawnPoints: Object.freeze({ maximum: 12 }),
    spawnJitter: Object.freeze({ minimum: 0, maximum: 0.25 }),
    movementSpeed: Object.freeze({ minimum: 0.6, maximum: 2.2 }),
    movementWidth: Object.freeze({ minimum: 0.25, maximum: 2 }),
    movementHeight: Object.freeze({ minimum: 0.25, maximum: 2 }),
    movementPoints: Object.freeze({ maximum: 12 }),
    comboMinScale: Object.freeze({ minimum: 0.3, maximum: 0.8 }),
  }),
});

export const DEFAULT_TARGET_COUNTS = Object.freeze({ flick: 3, switch: 1, track: 1, zen: 3 });
export const DEFAULT_DURATIONS = Object.freeze({ flick: 45, switch: 45, track: 30, zen: 60 });

const allowedModes = new Set(TRAINING_RECIPE_CAPABILITIES.modes);
const allowedTargetSizeModes = new Set(TRAINING_RECIPE_CAPABILITIES.targetSizeModes);
const allowedMovementPatterns = new Set(TRAINING_RECIPE_CAPABILITIES.movementPatterns);
const allowedSpawnPatterns = new Set(TRAINING_RECIPE_CAPABILITIES.spawnPatterns);
const allowedSpawnOrders = new Set(TRAINING_RECIPE_CAPABILITIES.spawnOrders);
const { limits } = TRAINING_RECIPE_CAPABILITIES;

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function numberInRange(value, range, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, range.minimum, range.maximum) : fallback;
}

function roundedNumberInRange(value, range, fallback, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(numberInRange(value, range, fallback) * factor) / factor;
}

function cleanText(value, maximum, fallback = "") {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  return (text || fallback).slice(0, maximum);
}

function normalizePoints(points, maximum = 12) {
  if (!Array.isArray(points)) return [];
  return points.slice(0, maximum).map((point) => ({
    x: roundedNumberInRange(point?.x, { minimum: -1, maximum: 1 }, 0, 3),
    y: roundedNumberInRange(point?.y, { minimum: -1, maximum: 1 }, 0, 3),
  }));
}

function normalizeTargetLifetime(value) {
  if (value === undefined || value === null || value === "") return limits.targetLifetime.disabled;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return limits.targetLifetime.disabled;
  return roundedNumberInRange(parsed, limits.targetLifetime, limits.targetLifetime.disabled, 2);
}

export function normalizeTrainingPhase(input = {}, index = 0) {
  const baseMode = allowedModes.has(input?.baseMode) ? input.baseMode : "flick";
  const difficulty = Math.round(numberInRange(input?.difficulty, limits.difficulty, 2));
  const defaultScale = baseMode === "track" ? 0.9 : 1;
  const defaultMovement = baseMode === "track" ? "free" : "static";
  const movementPattern = allowedMovementPatterns.has(input?.movementPattern) ? input.movementPattern : defaultMovement;
  const movementPoints = normalizePoints(input?.movementPoints, limits.movementPoints.maximum);
  const spawnPoints = normalizePoints(input?.spawnPoints, limits.spawnPoints.maximum);
  const requestedSpawn = allowedSpawnPatterns.has(input?.spawnPattern) ? input.spawnPattern : "free";
  const spawnPattern = requestedSpawn === "custom" && !spawnPoints.length ? "free" : requestedSpawn;

  return {
    baseMode,
    label: cleanText(input?.label, 12, `\u7b2c ${index + 1} \u6bb5`),
    focus: cleanText(input?.focus, 24, "\u4fdd\u6301\u7a33\u5b9a\u8282\u594f"),
    duration: Math.round(numberInRange(input?.duration, limits.duration, DEFAULT_DURATIONS[baseMode])),
    difficulty,
    targetCount: Math.round(numberInRange(input?.targetCount, limits.targetCount, DEFAULT_TARGET_COUNTS[baseMode])),
    targetScale: roundedNumberInRange(input?.targetScale, limits.targetScale, defaultScale),
    targetSizeMode: allowedTargetSizeModes.has(input?.targetSizeMode) ? input.targetSizeMode : "combo",
    targetLifetime: normalizeTargetLifetime(input?.targetLifetime),
    spawnPattern,
    spawnPoints,
    spawnOrder: allowedSpawnOrders.has(input?.spawnOrder) ? input.spawnOrder : "random",
    spawnJitter: roundedNumberInRange(input?.spawnJitter, limits.spawnJitter, 0, 3),
    movementSpeed: roundedNumberInRange(input?.movementSpeed, limits.movementSpeed, 1),
    movementWidth: roundedNumberInRange(input?.movementWidth, limits.movementWidth, 1),
    movementHeight: roundedNumberInRange(input?.movementHeight, limits.movementHeight, 1),
    movementPattern: movementPattern === "waypoints" && movementPoints.length < 2 ? defaultMovement : movementPattern,
    movementPoints,
    comboMinScale: roundedNumberInRange(input?.comboMinScale, limits.comboMinScale, baseMode === "track" ? 0.52 : 0.38),
  };
}

function isNumberInRange(value, range) {
  const number = Number(value);
  return Number.isFinite(number) && number >= range.minimum && number <= range.maximum;
}

function validateNumber(value, range, path, errors, { integer = false } = {}) {
  if (!isNumberInRange(value, range) || (integer && !Number.isInteger(Number(value)))) {
    errors.push(`${path} is outside the supported range`);
  }
}

function validatePoints(points, maximum, path, errors) {
  if (!Array.isArray(points)) {
    errors.push(`${path} must be an array`);
    return;
  }
  if (points.length > maximum) errors.push(`${path} exceeds ${maximum}`);
  points.forEach((point, index) => {
    if (!point || typeof point !== "object" || !isNumberInRange(point.x, { minimum: -1, maximum: 1 }) || !isNumberInRange(point.y, { minimum: -1, maximum: 1 })) {
      errors.push(`${path}[${index}] must contain normalized x/y coordinates`);
    }
  });
}

export function validateTrainingRecipe(recipe) {
  const errors = [];
  if (!recipe || typeof recipe !== "object") return { valid: false, errors: ["recipe must be an object"] };
  if (!Array.isArray(recipe.phases) || recipe.phases.length < limits.phases.minimum) {
    return { valid: false, errors: ["recipe.phases must contain at least one phase"] };
  }
  if (recipe.phases.length > limits.phases.maximum) errors.push(`recipe.phases exceeds ${limits.phases.maximum}`);

  let totalDuration = 0;
  recipe.phases.forEach((phase, index) => {
    const path = `recipe.phases[${index}]`;
    if (!phase || typeof phase !== "object") {
      errors.push(`${path} must be an object`);
      return;
    }
    if (!allowedModes.has(phase.baseMode)) errors.push(`${path}.baseMode is unsupported`);
    if (!allowedTargetSizeModes.has(phase.targetSizeMode ?? "combo")) errors.push(`${path}.targetSizeMode is unsupported`);
    if (!allowedMovementPatterns.has(phase.movementPattern)) errors.push(`${path}.movementPattern is unsupported`);
    if (!allowedSpawnPatterns.has(phase.spawnPattern)) errors.push(`${path}.spawnPattern is unsupported`);
    if (!allowedSpawnOrders.has(phase.spawnOrder)) errors.push(`${path}.spawnOrder is unsupported`);
    validateNumber(phase.duration, limits.duration, `${path}.duration`, errors, { integer: true });
    validateNumber(phase.difficulty, limits.difficulty, `${path}.difficulty`, errors, { integer: true });
    validateNumber(phase.targetCount, limits.targetCount, `${path}.targetCount`, errors, { integer: true });
    validateNumber(phase.targetScale, limits.targetScale, `${path}.targetScale`, errors);
    validateNumber(phase.spawnJitter, limits.spawnJitter, `${path}.spawnJitter`, errors);
    validateNumber(phase.movementSpeed, limits.movementSpeed, `${path}.movementSpeed`, errors);
    validateNumber(phase.movementWidth ?? 1, limits.movementWidth, `${path}.movementWidth`, errors);
    validateNumber(phase.movementHeight ?? 1, limits.movementHeight, `${path}.movementHeight`, errors);
    validateNumber(phase.comboMinScale, limits.comboMinScale, `${path}.comboMinScale`, errors);
    const lifetime = Number(phase.targetLifetime ?? limits.targetLifetime.disabled);
    if (lifetime !== limits.targetLifetime.disabled && !isNumberInRange(lifetime, limits.targetLifetime)) {
      errors.push(`${path}.targetLifetime is outside the supported range`);
    }
    validatePoints(phase.spawnPoints, limits.spawnPoints.maximum, `${path}.spawnPoints`, errors);
    validatePoints(phase.movementPoints, limits.movementPoints.maximum, `${path}.movementPoints`, errors);
    if (phase.spawnPattern === "custom" && (!Array.isArray(phase.spawnPoints) || phase.spawnPoints.length < 1)) errors.push(`${path}.spawnPoints requires at least one point`);
    if (phase.movementPattern === "waypoints" && (!Array.isArray(phase.movementPoints) || phase.movementPoints.length < 2)) errors.push(`${path}.movementPoints requires at least two points`);
    const duration = Number(phase.duration);
    if (Number.isFinite(duration)) totalDuration += duration;
  });
  if (totalDuration > limits.totalDuration.maximum) errors.push(`recipe duration exceeds ${limits.totalDuration.maximum}`);
  return { valid: errors.length === 0, errors };
}
