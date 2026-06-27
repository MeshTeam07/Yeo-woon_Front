import client from './client';

export const getPresignedUrl = ({ fileName, contentType }) =>
  client.post('/uploads/presigned-url', { fileName, contentType });

export const uploadFileToS3 = async (presignedUrl, file) => {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!res.ok) throw new Error('S3 업로드 실패');
};
