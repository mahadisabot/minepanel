import axios from 'axios';
import { getPublicEnv } from '@/lib/public-env';

const api = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
  },
});

api.interceptors.request.use((config) => {
  let url = getPublicEnv('NEXT_PUBLIC_BACKEND_URL') || '';
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // If accessing via ngrok or any domain name, route API requests relatively through the gateway.
      if (hostname.endsWith('.ngrok-free.dev') || !/^[0-9.]+$/.test(hostname)) {
        url = '/api';
      } else {
        url = url.replace('localhost', hostname).replace('127.0.0.1', hostname);
      }
    }
  }
  config.baseURL = url;
  return config;
});

export default api;
