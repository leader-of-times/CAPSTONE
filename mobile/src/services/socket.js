import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Try to detect the dev machine host from Expo debuggerHost, otherwise fallback
const LAN_IP_FALLBACK = '192.168.29.226';

function getSocketUrl() {
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:3000`;
  }

  const debuggerHost = Constants.manifest?.debuggerHost || Constants.manifest2?.debuggerHost;
  if (debuggerHost) {
    const hostPart = debuggerHost.split(':')[0];
    return `http://${hostPart}:3000`;
  }

  return `http://${LAN_IP_FALLBACK}:3000`;
}

const SOCKET_URL = getSocketUrl();

let socket = null;
// queuedListeners stores callbacks when socket isn't initialized yet
const queuedListeners = {};

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
    // attach any queued listeners
    Object.keys(queuedListeners).forEach((eventName) => {
      queuedListeners[eventName].forEach((cb) => socket.on(eventName, cb));
    });
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
  } else {
    queuedListeners['newRideRequest'] = queuedListeners['newRideRequest'] || [];
    queuedListeners['newRideRequest'].push(callback);
  }
};

export const onRideAccepted = (callback) => {
  if (socket) {
    socket.on('rideAccepted', callback);
  } else {
    queuedListeners['rideAccepted'] = queuedListeners['rideAccepted'] || [];
    queuedListeners['rideAccepted'].push(callback);
  }
};

export const onRideStarted = (callback) => {
  if (socket) {
    socket.on('rideStarted', callback);
  } else {
    queuedListeners['rideStarted'] = queuedListeners['rideStarted'] || [];
    queuedListeners['rideStarted'].push(callback);
  }
};

export const onRideCompleted = (callback) => {
  if (socket) {
    socket.on('rideCompleted', callback);
  } else {
    queuedListeners['rideCompleted'] = queuedListeners['rideCompleted'] || [];
    queuedListeners['rideCompleted'].push(callback);
  }
};

export const onRideAcceptedConfirmation = (callback) => {
  if (socket) {
    socket.on('rideAcceptedConfirmation', callback);
  } else {
    queuedListeners['rideAcceptedConfirmation'] = queuedListeners['rideAcceptedConfirmation'] || [];
    queuedListeners['rideAcceptedConfirmation'].push(callback);
  }
};

export const onRideNoLongerAvailable = (callback) => {
  if (socket) {
    socket.on('rideNoLongerAvailable', callback);
  } else {
    queuedListeners['rideNoLongerAvailable'] = queuedListeners['rideNoLongerAvailable'] || [];
    queuedListeners['rideNoLongerAvailable'].push(callback);
  }
};

// (queued listener versions above handle registration when socket not ready)

export const removeAllListeners = () => {
  if (socket) {
    socket.removeAllListeners();
  }
};
