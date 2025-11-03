import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Resolve backend host dynamically so web can use localhost and device uses LAN IP.
// Update the LAN_IP below to match your machine when testing on a phone.
const LAN_IP = '192.168.29.226';
let host;
if (Platform.OS === 'web') {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  host = `http://${hostname}:5000`;
} else {
  host = `http://${LAN_IP}:5000`;
}

const API_URL = `${host}/api`;

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
