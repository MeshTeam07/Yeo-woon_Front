export function formatDistance(meter) {
  return meter < 1000 ? `${meter}m` : `${(meter / 1000).toFixed(1)}km`;
}

export function formatTime(dateString) {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  return `${Math.floor(hours / 24)}일 전`;
}
