import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  acceptRide,
  startRide,
  completeRide,
  getRideHistory,
} from '../services/api';
import {
  updateDriverStatus,
  onNewRideRequest,
  getSocket,
} from '../services/socket';

export default function DriverHomeScreen({ navigation, onLogout }) {
  const [userName, setUserName] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    loadRideHistory();
    setupSocketListeners();

    // Debug: log socket status
    const socket = getSocket();
    console.log('[Driver] Socket on mount:', socket ? 'initialized' : 'NOT initialized');
    if (socket) {
      console.log('[Driver] Socket connected:', socket.connected);
    }

    return () => {
      // Set offline on unmount
      if (isOnline) {
        updateDriverStatus(false);
      }
    };
  }, []);

  const loadUserData = async () => {
    const name = await AsyncStorage.getItem('userName');
    setUserName(name || 'Driver');
  };

  const loadRideHistory = async () => {
    try {
      const response = await getRideHistory();
      setRideHistory(response.data.rides || []);
    } catch (error) {
      console.error('Load history error:', error);
    }
  };

  const setupSocketListeners = () => {
    onNewRideRequest((data) => {
      console.log('Driver received newRideRequest:', data);
      setPendingRequests((prev) => [...prev, data]);
      Alert.alert(
        'New Ride Request!',
        `Pickup: ${data.pickup}\nFare: ₹${data.fareEstimate}`,
        [{ text: 'View', onPress: () => {} }]
      );
    });
  };

  const handleToggleOnline = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    
    // Use mock location for demo
    const location = {
      coordinates: [77.5946, 12.9716], // Bangalore
    };
    
    updateDriverStatus(newStatus, location);
    
    if (newStatus) {
      Alert.alert('You are now Online', 'You will receive ride requests');
    } else {
      Alert.alert('You are now Offline', 'You will not receive ride requests');
    }
  };

  const handleAcceptRide = async (rideId) => {
    setLoading(true);
    try {
      const response = await acceptRide(rideId);
      console.log('Driver accepted ride:', rideId, response.data);
      setCurrentRide(response.data.ride);
      setPendingRequests((prev) => prev.filter((r) => r.rideId !== rideId));
      Alert.alert('Success', 'Ride accepted!');
    } catch (error) {
      console.error('Accept ride error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to accept ride'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartRide = async () => {
    if (!currentRide) return;

    setLoading(true);
    try {
      const response = await startRide(currentRide._id);
      setCurrentRide(response.data.ride);
      Alert.alert('Success', 'Ride started!');
    } catch (error) {
      console.error('Start ride error:', error);
      Alert.alert('Error', 'Failed to start ride');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!currentRide) return;

    Alert.alert(
      'Complete Ride',
      'Mark this ride as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await completeRide(currentRide._id);
              Alert.alert(
                'Ride Completed',
                `Earned: ₹${response.data.fareCharged}`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setCurrentRide(null);
                      loadRideHistory();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Complete ride error:', error);
              Alert.alert('Error', 'Failed to complete ride');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    if (isOnline) {
      updateDriverStatus(false);
    }
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {userName}!</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Driver Status</Text>
          <View style={styles.switchContainer}>
            <Text style={[styles.statusText, isOnline && styles.onlineText]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#cbd5e1', true: '#10b981' }}
              thumbColor={isOnline ? '#fff' : '#f4f4f5'}
            />
          </View>
        </View>
      </View>

      {/* Current/ongoing ride display removed to start fresh */}

      {pendingRequests.length > 0 && !currentRide && (
        <View style={styles.requestsCard}>
          <Text style={styles.cardTitle}>Ride Requests</Text>
          {pendingRequests.map((request) => (
            <View key={request.rideId} style={styles.requestItem}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestText}>{request.pickup}</Text>
                <Text style={styles.requestFare}>₹{request.fareEstimate}</Text>
              </View>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => {
                  console.log('Accept button pressed for rideId:', request.rideId);
                  handleAcceptRide(request.rideId);
                }}
                disabled={loading}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {rideHistory.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.cardTitle}>Recent Rides</Text>
          {rideHistory.slice(0, 5).map((ride) => (
            <View key={ride._id} style={styles.historyItem}>
              <Text style={styles.historyStatus}>{ride.status}</Text>
              <Text style={styles.historyFare}>₹{ride.fare.total}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  onlineText: {
    color: '#10b981',
  },
  currentRideCard: {
    backgroundColor: '#dbeafe',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  rideStatus: {
    fontSize: 16,
    color: '#1e40af',
    marginBottom: 5,
  },
  rideInfo: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSuccess: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  requestsCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  requestInfo: {
    flex: 1,
  },
  requestText: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 4,
  },
  requestFare: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  acceptButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyStatus: {
    fontSize: 14,
    color: '#475569',
  },
  historyFare: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
});
