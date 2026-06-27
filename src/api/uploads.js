import client from './client';

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/uploads/images', formData);
};
