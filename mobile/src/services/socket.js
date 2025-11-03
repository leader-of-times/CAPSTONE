import { io } from 'socket.io-client';
import { Platform } from 'react-native';

// Resolve socket host dynamically so web uses localhost and device uses LAN IP.
const LAN_IP = '192.168.29.226';
let SOCKET_URL;
if (Platform.OS === 'web') {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  SOCKET_URL = `http://${hostname}:5000`;
} else {
  SOCKET_URL = `http://${LAN_IP}:5000`;
}

let socket = null;

export const initSocket = (token, userId, role) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket.emit('authenticate', { userId, role });
  });

  socket.on('authenticated', (data) => {
    console.log('Socket authenticated:', data);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn('Socket not initialized');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Driver-specific events
export const updateDriverStatus = (online, location) => {
  if (socket) {
    socket.emit('driverStatus', { online, location });
  }
};

export const updateDriverLocation = (coordinates) => {
  if (socket) {
    socket.emit('updateLocation', { coordinates });
  }
};

// Listen for ride events
export const onNewRideRequest = (callback) => {
  if (socket) {
    socket.on('newRideRequest', callback);
  }
};

export const onRideAccepted = (callback) => {
  if (socket) {
    socket.on('rideAccepted', callback);
  }
};

export const onRideStarted = (callback) => {
  if (socket) {
    socket.on('rideStarted', callback);
  }
};

export const onRideCompleted = (callback) => {
  if (socket) {
    socket.on('rideCompleted', callback);
  }
};

export const removeAllListeners = () => {
  if (socket) {
    socket.removeAllListeners();
  }
};
