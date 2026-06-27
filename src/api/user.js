import client from './client';

export const getMe = () => client.get('/users/me');

export const getMyCapsules = (limit = 20) =>
  client.get('/users/me/capsules', { params: { limit } });

export const updateProfile = ({ nickname, profileImageUrl }) =>
  client.post('/users/me/profile', { nickname, profileImageUrl });
