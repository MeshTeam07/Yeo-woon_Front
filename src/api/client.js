import axios from 'axios';

const client = axios.create({
  baseURL: '',
  withCredentials: true,
});

client.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  (err) => Promise.reject(err),
);

export default client;
