import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestRide } from '../services/api';
import { onRideAccepted, onRideCompleted } from '../services/socket';

export default function StudentHomeScreen({ navigation, onLogout }) {
  const [userName, setUserName] = useState('');
  const [pickup, setPickup] = useState({
    address: '',
    coordinates: null,
  });
  const [dropoff, setDropoff] = useState({
    address: '',
    coordinates: null,
  });
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);

  useEffect(() => {
    loadUserData();
  // starting fresh: recent rides removed
    setupSocketListeners();

    return () => {
      // Cleanup listeners
    };
  }, []);

  const loadUserData = async () => {
    const name = await AsyncStorage.getItem('userName');
    setUserName(name || 'Student');
  };


  const setupSocketListeners = () => {
    onRideAccepted((data) => {
      console.log('Student received rideAccepted:', data);
      Alert.alert(
        'Driver Found!',
        `${data.driver.name} has accepted your ride`,
        [{ text: 'OK' }]
      );
      setCurrentRide({
        _id: data.rideId,
        status: data.status,
        driver: data.driver,
        fare: data.fare
      });
      setLoading(false);
    });

    onRideCompleted((data) => {
      Alert.alert(
        'Ride Completed',
        `Fare: ₹${data.fare}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentRide(null);
            },
          },
        ]
      );
    });

    // Listen for ride started event
    const socket = require('../services/socket').getSocket();
    if (socket) {
      socket.on('rideStarted', (data) => {
        Alert.alert('Ride Started', 'Your driver has started the trip');
        setCurrentRide(prev => prev ? { ...prev, status: data.status } : null);
      });

      socket.on('rideExpired', (data) => {
        Alert.alert(
          'Request Expired',
          data.message || 'No drivers available. Please try again.',
          [{ text: 'OK', onPress: () => setCurrentRide(null) }]
        );
        setLoading(false);
      });
    }
  };

  const handleRequestRide = async () => {
    if (!pickup.address || !dropoff.address) {
      Alert.alert('Error', 'Please enter both pickup and dropoff locations');
      return;
    }
    setLoading(true);

    // Ensure pickup/dropoff have coordinates. If user typed an address but didn't select
    // a suggestion, fall back to geocoding the address once before requesting the ride.
    try {
      let updatedPickup = pickup;
      let updatedDropoff = dropoff;

      if (!pickup.coordinates && pickup.address) {
        const coords = await geocodeAddress(pickup.address);
        if (!coords) {
          Alert.alert('Location Error', 'Unable to resolve pickup address. Please select from suggestions.');
          setLoading(false);
          return;
        }
        updatedPickup = { ...pickup, coordinates: coords };
        setPickup(updatedPickup);
      }

      if (!dropoff.coordinates && dropoff.address) {
        const coords = await geocodeAddress(dropoff.address);
        if (!coords) {
          Alert.alert('Location Error', 'Unable to resolve dropoff address. Please select from suggestions.');
          setLoading(false);
          return;
        }
        updatedDropoff = { ...dropoff, coordinates: coords };
        setDropoff(updatedDropoff);
      }

      // Replace pickup/dropoff with updated versions that include coordinates
      const payload = { pickup: updatedPickup, dropoff: updatedDropoff };

      const response = await requestRide(payload);
      const { ride } = response.data;

      Alert.alert(
        'Ride Requested',
        `Estimated fare: ₹${ride.fareEstimate.total}\nDistance: ${ride.estimatedDistance.toFixed(
          1
        )} km${ride.matchFound ? '\n\nDriver ETA: ' + ride.driverETA.toFixed(0) + ' min' : '\n\nSearching for drivers...'}`,
        [{ text: 'OK' }]
      );

      setCurrentRide(ride);
    } catch (error) {
      console.error('Request ride error:', error);
      Alert.alert(
        'Request Failed',
        error.response?.data?.error || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Debounced location search using Nominatim with headers and content-type checks
  const searchTimeout = useRef(null);
  // Simple in-memory cache to reduce repeated Nominatim queries
  const searchCache = useRef({});
  const searchLocation = async (query, type) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length < 3) {
      if (type === 'pickup') setPickupSuggestions([]);
      else setDropoffSuggestions([]);
      return;
    }

    // debounce 300ms
    searchTimeout.current = setTimeout(async () => {
      // return cached suggestions if available
      if (searchCache.current[query]) {
        const cached = searchCache.current[query];
        if (type === 'pickup') setPickupSuggestions(cached);
        else setDropoffSuggestions(cached);
        return;
      }
      try {
        // Include an email parameter per Nominatim usage policy to identify the application
        // Restrict results to India using countrycodes=in so users can search anywhere in India
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1&countrycodes=in&email=autoshare@example.com`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            // identify application per Nominatim usage policy
            'User-Agent': 'AutoShare/1.0 (+https://example.com)',
          },
        });

        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
          const text = await response.text();
          console.error('Location search non-ok response', response.status, text);
          if (type === 'pickup') setPickupSuggestions([]);
          else setDropoffSuggestions([]);
          return;
        }

        if (!contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Location search unexpected content-type', contentType, text);
          if (type === 'pickup') setPickupSuggestions([]);
          else setDropoffSuggestions([]);
          return;
        }

        const data = await response.json();
        const suggestions = data.map((item) => ({
          address: item.display_name,
          coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
        }));

        // cache the results for this exact query
        try {
          searchCache.current[query] = suggestions;
        } catch (e) {
          // noop - cache is best-effort
        }

        if (type === 'pickup') setPickupSuggestions(suggestions);
        else setDropoffSuggestions(suggestions);
      } catch (error) {
        console.error('Location search error:', error);
        if (type === 'pickup') setPickupSuggestions([]);
        else setDropoffSuggestions([]);
      }
    }, 300);
  };

  // Geocode a single address to coordinates (used as a fallback when user didn't pick a suggestion)
  const geocodeAddress = async (address) => {
    if (!address || address.length < 3) return null;

    // try cache first
    if (searchCache.current[address] && searchCache.current[address].length > 0) {
      return searchCache.current[address][0].coordinates;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1&addressdetails=1&countrycodes=in&email=autoshare@example.com`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AutoShare/1.0 (+https://example.com)',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Geocode non-ok response', response.status, text);
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Geocode unexpected content-type', contentType, text);
        return null;
      }

      const data = await response.json();
      if (!data || data.length === 0) return null;

      const coords = [parseFloat(data[0].lon), parseFloat(data[0].lat)];

      // cache the single-result under the address key
      try {
        searchCache.current[address] = [
          { address: data[0].display_name, coordinates: coords },
        ];
      } catch (e) {}

      return coords;
    } catch (error) {
      console.error('Geocode error:', error);
      return null;
    }
  };

  const handlePickupChange = (text) => {
    setPickup({ ...pickup, address: text });
    searchLocation(text, 'pickup');
  };

  const handleDropoffChange = (text) => {
    setDropoff({ ...dropoff, address: text });
    searchLocation(text, 'dropoff');
  };

  const selectPickupLocation = (suggestion) => {
    setPickup(suggestion);
    setPickupSuggestions([]);
  };

  const selectDropoffLocation = (suggestion) => {
    setDropoff(suggestion);
    setDropoffSuggestions([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {userName}!</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {currentRide && (
        <View style={styles.currentRideCard}>
          <Text style={styles.cardTitle}>Current Ride</Text>
          <Text style={styles.rideStatus}>Status: {currentRide.status}</Text>
          {currentRide.driver && (
            <>
              <Text style={styles.driverInfo}>
                Driver: {currentRide.driver.name}
              </Text>
              {currentRide.driver.phone && (
                <Text style={styles.driverInfo}>
                  Phone: {currentRide.driver.phone}
                </Text>
              )}
              {currentRide.driver.vehicleInfo && (
                <Text style={styles.driverInfo}>
                  Vehicle: {currentRide.driver.vehicleInfo}
                </Text>
              )}
            </>
          )}
          {!currentRide.driver && currentRide.status === 'Requested' && (
            <Text style={styles.searchingText}>Searching for drivers...</Text>
          )}
        </View>
      )}

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Request a Ride</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Pickup Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter pickup address"
            value={pickup.address}
            onChangeText={handlePickupChange}
            editable={!loading && !currentRide}
          />
          {pickupSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {pickupSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => selectPickupLocation(suggestion)}
                >
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {suggestion.address}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dropoff Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter dropoff address"
            value={dropoff.address}
            onChangeText={handleDropoffChange}
            editable={!loading && !currentRide}
          />
          {dropoffSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {dropoffSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => selectDropoffLocation(suggestion)}
                >
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {suggestion.address}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (loading || !!currentRide) && styles.buttonDisabled,
          ]}
          onPress={handleRequestRide}
          disabled={loading || !!currentRide}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {currentRide ? 'Ride in Progress' : 'Request Ride'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Recent rides removed to start fresh */}
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
  currentRideCard: {
    backgroundColor: '#dbeafe',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  formCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 10,
  },
  inputContainer: {
    position: 'relative',
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
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
  rideStatus: {
    fontSize: 16,
    color: '#1e40af',
    marginBottom: 5,
  },
  driverInfo: {
    fontSize: 14,
    color: '#475569',
  },
  searchingText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 8,
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
