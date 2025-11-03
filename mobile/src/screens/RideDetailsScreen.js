import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { getRideDetails } from '../services/api';

export default function RideDetailsScreen({ route, navigation }) {
  const { rideId } = route.params;
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRideDetails();
  }, []);

  const loadRideDetails = async () => {
    try {
      const response = await getRideDetails(rideId);
      setRide(response.data.ride);
    } catch (error) {
      console.error('Load ride details error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ride Details</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{ride.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Fare</Text>
          <Text style={styles.valueHighlight}>₹{ride.fare.total}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Distance</Text>
          <Text style={styles.value}>
            {ride.estimatedDistance.toFixed(1)} km
          </Text>
        </View>

        {ride.requesterId && (
          <View style={styles.section}>
            <Text style={styles.label}>Passenger</Text>
            <Text style={styles.value}>{ride.requesterId.name}</Text>
          </View>
        )}

        {ride.driverId && (
          <View style={styles.section}>
            <Text style={styles.label}>Driver</Text>
            <Text style={styles.value}>{ride.driverId.name}</Text>
            {ride.driverId.vehicleInfo && (
              <Text style={styles.subValue}>
                {ride.driverId.vehicleInfo.model} -{' '}
                {ride.driverId.vehicleInfo.color}
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#0f172a',
  },
  section: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  valueHighlight: {
    fontSize: 20,
    color: '#2563eb',
    fontWeight: '700',
  },
  subValue: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
});
