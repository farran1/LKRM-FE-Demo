import { useAuthStore } from '@/store/auth';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiMetadata = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let showErrorMessage: (error: any) => void = (error) => {
  console.error('No error handler set:', error);
}

export const setErrorHandler = (fn: (error: any) => void) => {
  console.log('setErrorHandler')
  showErrorMessage = fn;
}

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      if (error?.response?.config.url !== '/api/login') {
        useAuthStore.getState().logout()
      }
    }
    showErrorMessage(error?.response?.data?.error || 'Unexpected error')
    return Promise.reject(error);
  }
);

export const fetcher = (url: string) => api.get(url).then((res) => res.data || [])

export default api