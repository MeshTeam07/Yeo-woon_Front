import client from './client';
import { RADIUS_METER } from '../constants';

export function toRecord(c, myUserId) {
  return {
    id: c.capsuleId ?? c.id,
    owner: c.isOwner || c.author?.userId === myUserId ? 'me' : 'other',
    author: c.author?.nickname ?? c.author ?? '',
    address: c.address ?? c.place?.address ?? '',
    lat: c.latitude ?? c.lat,
    lng: c.longitude ?? c.lng,
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
    likedByMe: c.likedByMe ?? false,
  };
}

export const getNearbyCapsules = ({
  latitude, longitude, radius = RADIUS_METER,
  sort = 'distance', limit = 20, offset = 0,
}) =>
  client.get('/capsules/nearby', { params: { latitude, longitude, radius, sort, limit, offset } });

export const getCapsuleById = (capsuleId) =>
  client.get(`/capsules/${capsuleId}`);

export const createCapsule = (data) =>
  client.post('/capsules', data);

export const likeCapsule = (capsuleId) =>
  client.post(`/capsules/${capsuleId}/likes`);

export const unlikeCapsule = (capsuleId) =>
  client.delete(`/capsules/${capsuleId}/likes`);
