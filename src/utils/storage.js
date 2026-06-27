import seedRecords from '../data/seedRecords';

export const STORAGE_KEY = 'yeowoon_records_v1';
export const LIKE_KEY = 'yeowoon_likes_v1';
export const AUTH_KEY = 'yeowoon_auth_v1';

export function loadRecords() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return seedRecords;

  try {
    return JSON.parse(saved);
  } catch {
    return seedRecords;
  }
}

export function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function loadLikes() {
  try {
    return JSON.parse(localStorage.getItem(LIKE_KEY)) ?? [];
  } catch {
    return [];
  }
}

export function saveLikes(likes) {
  localStorage.setItem(LIKE_KEY, JSON.stringify(likes));
}
