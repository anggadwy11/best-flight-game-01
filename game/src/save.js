// The one saved thing: the pilot's best score, in this browser only.
// Storage can be off (private windows) — the game then simply forgets.
import { BEST_KEY } from './config.js';

export function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // No storage: the best score lasts this visit only.
  }
}
