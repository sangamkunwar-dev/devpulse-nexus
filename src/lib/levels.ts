/** XP → level curve: level n requires 100 * n^2 total XP. */
export function levelFromXp(xp: number) {
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  const currentFloor = 100 * (level - 1) ** 2;
  const nextFloor = 100 * level ** 2;
  const progress = Math.min(1, (xp - currentFloor) / (nextFloor - currentFloor));
  return { level, progress, nextFloor, currentFloor, toNext: nextFloor - xp };
}

export const LEVEL_TITLES = [
  "Hello World",
  "Bug Spotter",
  "Loop Wrangler",
  "Stack Tracer",
  "Merge Master",
  "Refactor Sage",
  "System Architect",
  "Kernel Legend",
];

export function levelTitle(level: number) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}
