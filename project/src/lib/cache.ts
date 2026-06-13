import type { CachedReflection } from '../types';

const CACHE_KEY = 'opera_reflections_cache';

export function getCachedReflections(): CachedReflection[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function cacheReflection(r: CachedReflection): void {
  const existing = getCachedReflections();
  const updated = [r, ...existing.filter(e => e.id !== r.id)];
  localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
}

export function clearCachedReflections(): void {
  localStorage.removeItem(CACHE_KEY);
}
