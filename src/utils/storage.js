export const LIKE_KEY = 'yeowoon_likes_v1';

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
