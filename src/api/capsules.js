import client from './client';
import { RADIUS_METER } from '../constants';

export function toRecord(c, myUserId, currentUser) {
  const isMe = !!(c.isOwner || c.author?.userId === myUserId || c.user?.id === myUserId);
  return {
    id: c.capsuleId ?? c.id,
    owner: isMe ? 'me' : 'other',
    author:
      c.user?.nickname ??
      c.author?.nickname ??
      c.author ??
      (isMe ? currentUser?.nickname ?? '' : ''),
    authorAvatar:
      c.user?.profileImageUrl ??
      c.author?.profileImageUrl ??
      (isMe ? currentUser?.profileImageUrl ?? null : null),
    address: c.address ?? c.place?.address ?? c.place?.label ?? '',
    lat: c.latitude ?? c.lat ?? c.place?.latitude,
    lng: c.longitude ?? c.lng ?? c.place?.longitude,
    distance: c.distance ?? 0,
    createdAt: c.createdAt,
    message: c.memo ?? c.message ?? '',
    image: c.photoUrl ?? c.image ?? '',
    songs: [
      {
        title: c.song?.title ?? '',
        artist: c.song?.artist ?? '',
        albumImage: c.song?.albumCoverUrl ?? c.song?.albumImage ?? '',
        previewUrl: c.song?.previewUrl ?? '',
        externalTrackId: c.song?.externalTrackId ?? '',
        musicUrl: c.song?.musicUrl ?? '',
      },
    ],
    likes: c.likeCount ?? c.likes ?? 0,
    score: c.score ?? c.recommendScore ?? 50,
    likedByMe: c.likedByMe ?? c.isLiked ?? false,
  };
}

export const getNearbyCapsules = ({
  latitude,
  longitude,
  radius = 100,
  sort = 'distance',
  limit = 20,
  offset = 0,
}) =>
  client.get('/capsules/nearby', {
    params: { latitude, longitude, radius, sort, limit, offset },
  });

export const getCapsuleById = (capsuleId) =>
  client.get(`/capsules/${capsuleId}`);

export const createCapsule = (data) => client.post('/capsules', data);

export const updateCapsule = (capsuleId, data) =>
  client.patch(`/capsules/${capsuleId}`, data);

export const deleteCapsule = (capsuleId) =>
  client.delete(`/capsules/${capsuleId}`);

export const likeCapsule = (capsuleId) =>
  client.post(`/capsules/${capsuleId}/likes`);

export const unlikeCapsule = (capsuleId) =>
  client.delete(`/capsules/${capsuleId}/likes`);
