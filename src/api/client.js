import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
});

// 토큰 저장/조회 헬퍼
export const saveToken = (token) => {
  localStorage.setItem('accessToken', token);
  client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};
export const clearToken = () => {
  localStorage.removeItem('accessToken');
  delete client.defaults.headers.common['Authorization'];
};
export const getToken = () => localStorage.getItem('accessToken');

// 앱 초기 로드 시 localStorage에 토큰이 있으면 헤더 복원
const _saved = getToken();
if (_saved) client.defaults.headers.common['Authorization'] = `Bearer ${_saved}`;

client.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  (err) => Promise.reject(err),
);

export default client;
