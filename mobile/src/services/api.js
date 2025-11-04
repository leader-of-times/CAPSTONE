import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Resolve backend host dynamically. Prefer Expo debuggerHost when available
// (works when running `expo start` and your device is connected to the dev machine's network/hotspot).
const LAN_IP_FALLBACK = '192.168.29.226'; // keep a sensible fallback you can update

function getDevHost() {
  // Web -> use browser host with backend on port 3000
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:3000`;
  }

  // If running under Expo, attempt to read the debugger host which includes the dev machine IP
  const debuggerHost = Constants.manifest?.debuggerHost || Constants.manifest2?.debuggerHost;
  if (debuggerHost) {
    const hostPart = debuggerHost.split(':')[0];
    return `http://${hostPart}:3000`;
  }

  // Fallback to configured LAN_IP
  return `http://${LAN_IP_FALLBACK}:3000`;
}

const API_URL = `${getDevHost()}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);

// Ride APIs
export const requestRide = (rideData) => api.post('/rides/request', rideData);
export const acceptRide = (rideId) => {
  console.log('API acceptRide called with rideId:', rideId);
  return api.post(`/rides/accept/${rideId}`);
};
export const startRide = (rideId) => api.post(`/rides/start/${rideId}`);
export const completeRide = (rideId) => api.post(`/rides/complete/${rideId}`);
export const getRideDetails = (rideId) => api.get(`/rides/${rideId}`);
export const getRideHistory = () => api.get('/rides/user/history');

export default api;
