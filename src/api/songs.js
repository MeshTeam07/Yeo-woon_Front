import client from './client';

export const searchSongs = ({ keyword, limit = 10, offset = 0, country = 'KR' }) =>
  client.get('/api/songs/search', { params: { keyword, limit, offset, country } });
