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
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestRide } from '../services/api';
import { onRideAccepted, onRideCompleted } from '../services/socket';
import tokens from '../styles/tokens';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';

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
        console.log('Student received rideStarted:', data);
        Alert.alert('Ride Started', 'Your driver has started the trip');
        setCurrentRide(prev => prev ? { ...prev, status: data.status } : null);
      });

      socket.on('rideExpired', (data) => {
        console.log('Student received rideExpired:', data);
        Alert.alert(
          'Request Expired',
          data.message || 'No drivers available. Please try again.',
          [{ text: 'OK', onPress: () => {
            setCurrentRide(null);
            setLoading(false);
          }}]
        );
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Avatar name={userName} size={40} />
            <View style={styles.headerText}>
              <Text style={styles.greetingText}>Hello,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutIcon}>⎋</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Ride Card */}
          {currentRide && (
            <Card variant="dark" style={styles.currentRideCard}>
              <View style={styles.rideHeader}>
                <Text style={styles.cardTitle}>Your Ride</Text>
                <StatusBadge status={currentRide.status} />
              </View>
              
              {currentRide.driver ? (
                <View style={styles.driverSection}>
                  <Avatar name={currentRide.driver.name} size={56} style={styles.driverAvatar} />
                  <View style={styles.driverDetails}>
                    <Text style={styles.driverName}>{currentRide.driver.name}</Text>
                    {currentRide.driver.phone && (
                      <Text style={styles.driverContact}>📞 {currentRide.driver.phone}</Text>
                    )}
                    {currentRide.driver.vehicleInfo && (
                      <Text style={styles.vehicleInfo}>🚗 {currentRide.driver.vehicleInfo}</Text>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="large" color={tokens.colors.primary} />
                  <Text style={styles.searchingText}>Finding your driver...</Text>
                </View>
              )}
            </Card>
          )}

          {/* Request Ride Form */}
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Where are you going?</Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Text style={styles.iconText}>📍</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Pickup Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter pickup address"
                  placeholderTextColor={tokens.colors.mutedLight}
                  value={pickup.address}
                  onChangeText={handlePickupChange}
                  editable={!loading && !currentRide}
                />
              </View>
            </View>

            {pickupSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {pickupSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectPickupLocation(suggestion)}
                  >
                    <Text style={styles.suggestionIcon}>📌</Text>
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {suggestion.address}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={[styles.inputContainer, styles.inputContainerMargin]}>
              <View style={styles.inputIcon}>
                <Text style={styles.iconText}>🎯</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Drop-off Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter dropoff address"
                  placeholderTextColor={tokens.colors.mutedLight}
                  value={dropoff.address}
                  onChangeText={handleDropoffChange}
                  editable={!loading && !currentRide}
                />
              </View>
            </View>

            {dropoffSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {dropoffSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectDropoffLocation(suggestion)}
                  >
                    <Text style={styles.suggestionIcon}>📌</Text>
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {suggestion.address}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <PrimaryButton
              title={currentRide ? 'Ride in Progress' : 'Request Ride'}
              onPress={handleRequestRide}
              disabled={loading || !!currentRide}
              loading={loading}
              variant="primary"
              style={styles.requestButton}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
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
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  driverAvatar: {
    marginRight: 16,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: tokens.colors.white,
    marginBottom: 4,
  },
  driverContact: {
    fontSize: 14,
    color: tokens.colors.gray400,
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 14,
    color: tokens.colors.gray400,
  },
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  searchingText: {
    fontSize: 16,
    color: tokens.colors.gray300,
    marginTop: 12,
    fontStyle: 'italic',
  },
  formCard: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: tokens.colors.black,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.gray100,
    borderRadius: tokens.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.gray200,
  },
  inputContainerMargin: {
    marginTop: 12,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.gray600,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    color: tokens.colors.black,
    padding: 0,
    margin: 0,
  },
  suggestionsContainer: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.md,
    marginTop: 8,
    ...tokens.shadows.md,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray200,
    alignItems: 'center',
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: tokens.colors.black,
  },
  requestButton: {
    marginTop: 24,
  },
});
