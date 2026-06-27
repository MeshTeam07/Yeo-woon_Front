import client from './client';

export const getMe = () => client.get('/users/me');

export const getMyCapsules = (offset = 0, limit = 20) =>
  client.get('/users/me/capsules', { params: { offset, limit } });

export const getLikedCapsules = (offset = 0, limit = 20) =>
  client.get('/users/me/likes', { params: { offset, limit } });

export const getLikedCount = () =>
  client.get('/users/me/likes/count');

export const updateProfile = ({ nickname, profileImageUrl }) =>
  client.post('/users/me/profile', { nickname, profileImageUrl });
