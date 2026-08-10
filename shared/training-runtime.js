const finiteNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function resolveTargetBaseScale({
  baseMode = "flick",
  difficulty = 1,
  targetScale = 1,
  targetSizeMode = "combo",
} = {}) {
  const requestedScale = finiteNumber(targetScale, 1);
  if (targetSizeMode === "fixed") return requestedScale;

  const level = finiteNumber(difficulty, 1);
  let modeScale = 1;
  if (baseMode === "track") modeScale = 0.84;
  else if (baseMode === "switch") modeScale = 0.92;
  else if (baseMode === "zen") modeScale = 1.16 - (level - 1) * 0.075;
  return modeScale * requestedScale;
}

export function advanceTargetActiveAge(currentAgeMs, deltaSeconds, isPlaying) {
  const age = Math.max(0, finiteNumber(currentAgeMs, 0));
  if (!isPlaying) return age;
  return age + Math.max(0, finiteNumber(deltaSeconds, 0)) * 1000;
}

export function resolveRuntimeDifficulty({
  aiActive = false,
  configuredDifficulty = 1,
  adaptiveDifficulty = 1,
} = {}) {
  const source = aiActive ? configuredDifficulty : adaptiveDifficulty;
  return Math.min(5, Math.max(1, finiteNumber(source, 1)));
}
