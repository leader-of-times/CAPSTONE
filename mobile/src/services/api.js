import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Resolve backend host dynamically. Prefer Expo debuggerHost when available
// (works when running `expo start` and your device is connected to the dev machine's network/hotspot).
// Update this to your dev machine's LAN IP if the automatic debuggerHost detection fails.
const LAN_IP_FALLBACK = '192.168.68.103'; // <-- set to your machine's IPv4 from `ipconfig`

function getDevHost() {
  // Web -> use localhost with backend on port 3000
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  // Mobile -> use the configured LAN IP (update LAN_IP_FALLBACK if your network changes)
  return `http://${LAN_IP_FALLBACK}:3000`;
}

const API_URL = `${getDevHost()}/api`;

// Debug: log the resolved API URL
console.log('🔗 API base URL:', API_URL);

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
