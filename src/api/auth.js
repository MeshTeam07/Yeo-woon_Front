import client from './client';

export const logout = () => client.post('/auth/logout');
