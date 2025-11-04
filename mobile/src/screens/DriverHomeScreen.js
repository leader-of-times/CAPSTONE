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
  SafeAreaView,
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
import tokens from '../styles/tokens';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';
import { Ionicons } from '@expo/vector-icons';

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
      // Cleanup socket listeners on unmount
      const { removeAllListeners } = require('../services/socket');
      removeAllListeners();
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

    // When driver accepts, server sends confirmation specifically to that driver
    const { onRideAcceptedConfirmation, onRideNoLongerAvailable } = require('../services/socket');
    onRideAcceptedConfirmation((payload) => {
      console.log('Driver received rideAcceptedConfirmation:', payload);
      // Set current ride and remove it from pendingRequests
      setCurrentRide({
        _id: payload.rideId,
        status: payload.status,
        student: payload.student,
        pickup: payload.pickup,
        dropoff: payload.dropoff,
        fare: payload.fare,
      });
      setPendingRequests((prev) => prev.filter((r) => r.rideId !== payload.rideId));
    });

    // Remove pending request if another driver accepted it
    onRideNoLongerAvailable((data) => {
      console.log('Driver received rideNoLongerAvailable for:', data.rideId);
      setPendingRequests((prev) => prev.filter((r) => r.rideId !== data.rideId));
      // If the driver was viewing this ride, clear it
      if (currentRide && currentRide._id === data.rideId) {
        setCurrentRide(null);
      }
    });

    // Listen for ride acceptance confirmation (when this driver accepts)
    const socket = getSocket();
    if (socket) {
      socket.on('rideAcceptedConfirmation', (data) => {
        console.log('Driver received rideAcceptedConfirmation:', data);
        setCurrentRide({
          _id: data.rideId,
          status: data.status,
          student: data.student,
          pickup: data.pickup,
          dropoff: data.dropoff,
          fare: data.fare
        });
        // Remove from pending requests
        setPendingRequests((prev) => prev.filter((r) => r.rideId !== data.rideId));
      });

      // Listen for rides accepted by other drivers (remove from pending)
      socket.on('rideNoLongerAvailable', (data) => {
        console.log('Driver received rideNoLongerAvailable:', data);
        setPendingRequests((prev) => prev.filter((r) => r.rideId !== data.rideId));
      });

      // Listen for ride started (update local state when starting)
      socket.on('rideStarted', (data) => {
        console.log('Driver received rideStarted:', data);
        setCurrentRide((prev) => prev ? { ...prev, status: data.status } : null);
      });

      // Listen for ride completed (update local state)
      socket.on('rideCompleted', (data) => {
        console.log('Driver received rideCompleted:', data);
        setCurrentRide(null);
      });
    }
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
      // Don't set currentRide here - let the socket event handle it
      // This prevents race conditions and ensures consistency
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Avatar name={userName} size={40} />
            <View style={styles.headerText}>
              <Text style={styles.greetingText}>Driver</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutIcon}>⎋</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Status Card */}
          <Card style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <Text style={styles.statusLabel}>Your Status</Text>
                <Text style={[styles.statusValue, isOnline && styles.onlineValue]}>
                  {isOnline ? '🟢 Online' : '⚫ Offline'}
                </Text>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: '#cbd5e1', true: tokens.colors.accent }}
                thumbColor={tokens.colors.white}
                ios_backgroundColor="#cbd5e1"
              />
            </View>
            {!isOnline && (
              <Text style={styles.statusHint}>
                Go online to start receiving ride requests
              </Text>
            )}
          </Card>

          {/* Current Ride */}
          {currentRide && (
            <Card variant="dark" style={styles.currentRideCard}>
              <View style={styles.rideHeader}>
                <Text style={styles.cardTitle}>Active Ride</Text>
                <StatusBadge status={currentRide.status} />
              </View>

              {currentRide.student && (
                <View style={styles.passengerSection}>
                  <Avatar name={currentRide.student.name} size={48} />
                  <View style={styles.passengerDetails}>
                    <Text style={styles.passengerName}>{currentRide.student.name}</Text>
                    {currentRide.student.phone && (
                      <View style={styles.iconTextRow}>
                        <Ionicons name="call" size={16} color={tokens.colors.textSecondary} style={styles.floatingIcon} />
                        <Text style={styles.passengerPhone}>{currentRide.student.phone}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.tripDetails}>
                <View style={styles.tripDetailRow}>
                  <Text style={styles.tripLabel}>📍 Pickup</Text>
                  <Text style={styles.tripValue} numberOfLines={1}>{currentRide.pickup}</Text>
                </View>
                <View style={styles.tripDetailRow}>
                  <Text style={styles.tripLabel}>🎯 Drop-off</Text>
                  <Text style={styles.tripValue} numberOfLines={1}>{currentRide.dropoff}</Text>
                </View>
                <View style={styles.tripDetailRow}>
                  <Text style={styles.tripLabel}>💵 Fare</Text>
                  <Text style={styles.fareValue}>₹{currentRide.fare?.total || 0}</Text>
                </View>
              </View>

              {currentRide.status === 'Accepted' && (
                <PrimaryButton
                  title="Start Ride"
                  onPress={handleStartRide}
                  loading={loading}
                  variant="primary"
                  style={styles.actionButton}
                />
              )}

              {currentRide.status === 'OnRide' && (
                <PrimaryButton
                  title="Complete Ride"
                  onPress={handleCompleteRide}
                  loading={loading}
                  variant="primary"
                  style={styles.actionButton}
                />
              )}
            </Card>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && !currentRide && (
            <Card style={styles.requestsCard}>
              <Text style={styles.cardTitle}>New Ride Requests</Text>
              <Text style={styles.requestsSubtitle}>
                {pendingRequests.length} {pendingRequests.length === 1 ? 'request' : 'requests'} waiting
              </Text>
              {pendingRequests.map((request) => (
                <View key={request.rideId} style={styles.requestItem}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestPickup} numberOfLines={1}>
                      📍 {request.pickup}
                    </Text>
                    <View style={styles.requestMeta}>
                      <Text style={styles.requestDistance}>
                        {request.distance ? `${request.distance.toFixed(1)} km` : ''}
                      </Text>
                      <Text style={styles.requestFare}>₹{request.fareEstimate}</Text>
                    </View>
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
            </Card>
          )}

          {/* Recent Rides */}
          {rideHistory.length > 0 && !currentRide && pendingRequests.length === 0 && (
            <Card style={styles.historyCard}>
              <Text style={styles.cardTitle}>Recent Trips</Text>
              {rideHistory.slice(0, 5).map((ride) => (
                <View key={ride._id} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <StatusBadge status={ride.status} />
                    <Text style={styles.historyDate}>
                      {new Date(ride.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.historyFare}>₹{ride.fare.total}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Empty State */}
          {isOnline && pendingRequests.length === 0 && !currentRide && (
            <View style={styles.emptyState}>
              <Ionicons name="car" size={48} color={tokens.colors.gray400} style={styles.floatingIcon} />
              <Text style={styles.emptyTitle}>Waiting for rides...</Text>
              <Text style={styles.emptyText}>
                You're online! New ride requests will appear here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: tokens.colors.black,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: tokens.colors.black,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: tokens.colors.gray400,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.colors.gray900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 20,
    color: tokens.colors.white,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  statusCard: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.gray600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.black,
  },
  onlineValue: {
    color: tokens.colors.success,
  },
  statusHint: {
    fontSize: 13,
    color: tokens.colors.gray600,
    marginTop: 12,
    fontStyle: 'italic',
  },
  currentRideCard: {
    marginBottom: 20,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  passengerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray700,
  },
  passengerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '600',
    color: tokens.colors.white,
    marginBottom: 4,
  },
  passengerPhone: {
    fontSize: 14,
    color: tokens.colors.gray400,
  },
  tripDetails: {
    marginBottom: 16,
  },
  tripDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripLabel: {
    fontSize: 14,
    color: tokens.colors.gray400,
    width: 100,
  },
  tripValue: {
    fontSize: 14,
    color: tokens.colors.white,
    flex: 1,
    textAlign: 'right',
  },
  fareValue: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.success,
  },
  actionButton: {
    marginTop: 8,
  },
  requestsCard: {
    marginBottom: 20,
  },
  requestsSubtitle: {
    fontSize: 14,
    color: tokens.colors.gray600,
    marginBottom: 16,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray200,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestPickup: {
    fontSize: 15,
    color: tokens.colors.black,
    marginBottom: 6,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestDistance: {
    fontSize: 13,
    color: tokens.colors.gray600,
    marginRight: 12,
  },
  requestFare: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  acceptButton: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: tokens.radius.md,
  },
  acceptButtonText: {
    color: tokens.colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  historyCard: {
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray200,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    color: tokens.colors.gray600,
    marginLeft: 12,
  },
  historyFare: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.black,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: tokens.colors.white,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: tokens.colors.gray400,
    textAlign: 'center',
    lineHeight: 22,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  floatingIcon: {
    marginRight: 8,
    opacity: 0.8,
  },
});
