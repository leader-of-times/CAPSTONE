import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import RideMapView from '../components/MapView';
import { getRideDetails } from '../services/api';
import { getSocket } from '../services/socket';
import tokens from '../styles/tokens';

export default function TrackRideScreen({ route, navigation }) {
  const { rideId, userRole } = route.params;
  const [ride, setRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const locationSubscription = useRef(null);

  useEffect(() => {
    loadRideDetails();
    setupLocationTracking();
    setupSocketListeners();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const loadRideDetails = async () => {
    try {
      const response = await getRideDetails(rideId);
      setRide(response.data.ride);
      setLoading(false);
    } catch (error) {
      console.error('Load ride details error:', error);
      Alert.alert('Error', 'Failed to load ride details');
      setLoading(false);
    }
  };

  const setupLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for tracking');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        coordinates: [location.coords.longitude, location.coords.latitude],
      });

      if (userRole === 'driver') {
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            const coords = [location.coords.longitude, location.coords.latitude];
            setDriverLocation({ coordinates: coords });
            
            const socket = getSocket();
            if (socket) {
              socket.emit('updateLocation', { coordinates: coords });
            }
          }
        );
      }
    } catch (error) {
      console.error('Location tracking error:', error);
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (socket) {
      socket.on('driverLocationUpdate', (data) => {
        if (data.rideId === rideId) {
          setDriverLocation({ coordinates: data.coordinates });
        }
      });

      socket.on('rideStatusUpdate', (data) => {
        if (data.rideId === rideId) {
          setRide((prev) => ({ ...prev, status: data.status }));
        }
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ride not found</Text>
      </View>
    );
  }

  const rider = ride.riders[0];
  const statusColor = 
    ride.status === 'OnRide' ? tokens.colors.success :
    ride.status === 'Accepted' ? tokens.colors.primary :
    tokens.colors.text;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <RideMapView
          driverLocation={driverLocation || currentLocation}
          pickup={rider.pickup.location}
          dropoff={rider.dropoff.location}
          currentLocation={currentLocation}
          showRoute={true}
        />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.statusBar}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>{ride.status}</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={20} color={tokens.colors.success} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationAddress}>{rider.pickup.address}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.locationRow}>
            <Ionicons name="flag" size={20} color={tokens.colors.error} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.locationAddress}>{rider.dropoff.address}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Fare</Text>
            <Text style={styles.fareValue}>₹{ride.fare.total}</Text>
          </View>

          {ride.estimatedDistance > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Distance</Text>
                <Text style={styles.fareValue}>{ride.estimatedDistance.toFixed(1)} km</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: tokens.colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: tokens.colors.error,
  },
  mapContainer: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: tokens.colors.text,
  },
  detailsCard: {
    backgroundColor: tokens.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: tokens.colors.textLight,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
    color: tokens.colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.border,
    marginVertical: 12,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 14,
    color: tokens.colors.textLight,
  },
  fareValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: tokens.colors.primary,
  },
  backButton: {
    backgroundColor: tokens.colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.text,
  },
});
