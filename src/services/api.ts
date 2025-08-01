import { useAuthStore } from '@/store/auth';
import axios from 'axios';
import { localApiService } from './local-api';
import { localStorageService } from './local-storage';

// Flag to enable/disable local mode for demos
const USE_LOCAL_STORAGE = true; // Set to false to use real backend

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

// Local API wrapper that simulates axios responses
const createLocalResponse = (data: any) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
  request: {}
});

const localApiWrapper = {
  get: async (url: string) => {
    // Initialize local storage if first time
    if (typeof window !== 'undefined') {
      localStorageService.initializeDefaultData();
    }

    const urlObj = new URL(url, 'http://localhost');
    const path = urlObj.pathname;
    const searchParams = Object.fromEntries(urlObj.searchParams.entries());

    // Convert string params to appropriate types
    const params = {
      ...searchParams,
      page: searchParams.page ? parseInt(searchParams.page) : undefined,
      perPage: searchParams.perPage ? parseInt(searchParams.perPage) : undefined,
      eventId: searchParams.eventId ? parseInt(searchParams.eventId) : undefined,
      priorityId: searchParams.priorityId ? parseInt(searchParams.priorityId) : undefined,
      playerIds: searchParams.playerIds ? [parseInt(searchParams.playerIds)] : undefined,
    };

    try {
      let result;
      
      if (path === '/api/events') {
        result = await localApiService.getEvents(params);
      } else if (path.match(/^\/api\/events\/\d+$/)) {
        const id = parseInt(path.split('/')[3]);
        result = await localApiService.getEvent(id);
      } else if (path.match(/^\/api\/events\/\d+\/players$/)) {
        const id = parseInt(path.split('/')[3]);
        result = await localApiService.getEventPlayers(id);
      } else if (path === '/api/tasks') {
        result = await localApiService.getTasks(params);
      } else if (path === '/api/players') {
        result = await localApiService.getPlayers(params);
      } else if (path.match(/^\/api\/players\/\d+$/)) {
        const id = parseInt(path.split('/')[3]);
        result = await localApiService.getPlayer(id);
      } else if (path.match(/^\/api\/players\/\d+\/notes$/)) {
        const id = parseInt(path.split('/')[3]);
        result = await localApiService.getPlayerNotes(id);
      } else if (path.match(/^\/api\/players\/\d+\/goals$/)) {
        const id = parseInt(path.split('/')[3]);
        result = await localApiService.getPlayerGoals(id);
      } else if (path === '/api/priorities') {
        result = await localApiService.getPriorities();
      } else if (path === '/api/positions') {
        result = await localApiService.getPositions();
      } else if (path === '/api/eventTypes') {
        result = await localApiService.getEventTypes();
      } else if (path === '/api/me' || path === '/api/profile') {
        result = await localApiService.getProfile();
      } else {
        throw new Error(`Local API: Endpoint not implemented: ${path}`);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      return createLocalResponse(result);
    } catch (error) {
      console.error('Local API Error:', error);
      throw error;
    }
  },
  
  post: async (url: string, data: any) => {
    if (typeof window !== 'undefined') {
      localStorageService.initializeDefaultData();
    }

    const urlObj = new URL(url, 'http://localhost');
    const path = urlObj.pathname;

    try {
      let result;
      
      if (path === '/api/tasks') {
        result = await localApiService.createTask(data);
      } else if (path === '/api/events') {
        result = await localApiService.createEvent(data);
      } else if (path === '/api/login') {
        result = await localApiService.login(data);
      } else {
        throw new Error(`Local API: POST endpoint not implemented: ${path}`);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      return createLocalResponse(result);
    } catch (error) {
      console.error('Local API Error:', error);
      throw error;
    }
  },

  put: async (url: string, data: any) => {
    if (typeof window !== 'undefined') {
      localStorageService.initializeDefaultData();
    }

    const urlObj = new URL(url, 'http://localhost');
    const path = urlObj.pathname;

    try {
      let result;
      
      if (path.match(/^\/api\/tasks\/\d+$/)) {
        const id = parseInt(path.split('/')[3]);
        result = await localApiService.updateTask(id, data);
      } else if (path.match(/^\/api\/events\/\d+$/)) {
        const id = parseInt(path.split('/')[3]);
        result = await localApiService.updateEvent(id, data);
      } else {
        throw new Error(`Local API: PUT endpoint not implemented: ${path}`);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      return createLocalResponse(result);
    } catch (error) {
      console.error('Local API Error:', error);
      throw error;
    }
  },

  delete: async (url: string) => {
    if (typeof window !== 'undefined') {
      localStorageService.initializeDefaultData();
    }

    const urlObj = new URL(url, 'http://localhost');
    const path = urlObj.pathname;

    try {
      let result;
      
      if (path.match(/^\/api\/tasks\/\d+$/)) {
        const id = parseInt(path.split('/')[3]);
        result = await localApiService.deleteTask(id);
      } else {
        throw new Error(`Local API: DELETE endpoint not implemented: ${path}`);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      return createLocalResponse(result);
    } catch (error) {
      console.error('Local API Error:', error);
      throw error;
    }
  }
};

// Choose which API to use based on configuration
const selectedApi = USE_LOCAL_STORAGE ? localApiWrapper : api;

// Apply interceptors only to real axios instance
if (!USE_LOCAL_STORAGE) {
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
}

export const fetcher = (url: string) => selectedApi.get(url).then((res) => res.data || [])

// Export the configured API instance
export default selectedApi as typeof api;