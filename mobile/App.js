import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import StudentHomeScreen from './src/screens/StudentHomeScreen';
import DriverHomeScreen from './src/screens/DriverHomeScreen';
import RideDetailsScreen from './src/screens/RideDetailsScreen';

// Services
import { initSocket } from './src/services/socket';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Intro animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After "A" appears, animate "uto Share" coming out
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Show intro for total 3.5 seconds
        setTimeout(() => {
          setShowIntro(false);
          checkAuth();
        }, 2000);
      });
    });
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const role = await AsyncStorage.getItem('userRole');
      
      if (token && role) {
        setIsAuthenticated(true);
        setUserRole(role);
        // Initialize socket connection
        const userId = await AsyncStorage.getItem('userId');
        initSocket(token, userId, role);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <Animated.View
          style={[
            styles.introContent,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: translateYAnim },
              ],
            },
          ]}
        >
          <View style={styles.textContainer}>
            <Text style={styles.introTextA}>A</Text>
            <Animated.Text
              style={[
                styles.introTextRest,
                {
                  opacity: textAnim,
                  transform: [{ translateX: textAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0], // Slide from inside A to position
                  }) }],
                },
              ]}
            >
              uto Share
            </Animated.Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  if (loading) {
    return null; // Or a loading screen
  }

  const handleAuthSuccess = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const role = await AsyncStorage.getItem('userRole');
    const userId = await AsyncStorage.getItem('userId');
    
    setIsAuthenticated(true);
    setUserRole(role);
    initSocket(token, userId, role);
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Login" 
              options={{ headerShown: false }}
            >
              {props => <LoginScreen {...props} onAuthSuccess={handleAuthSuccess} />}
            </Stack.Screen>
            <Stack.Screen 
              name="Register" 
              options={{ title: 'Create Account' }}
            >
              {props => <RegisterScreen {...props} onAuthSuccess={handleAuthSuccess} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            {userRole === 'student' ? (
              <Stack.Screen 
                name="StudentHome" 
                options={{ title: 'Request Ride' }}
              >
                {props => <StudentHomeScreen {...props} onLogout={handleLogout} />}
              </Stack.Screen>
            ) : (
              <Stack.Screen 
                name="DriverHome" 
                options={{ title: 'Driver Dashboard' }}
              >
                {props => <DriverHomeScreen {...props} onLogout={handleLogout} />}
              </Stack.Screen>
            )}
            <Stack.Screen 
              name="RideDetails" 
              component={RideDetailsScreen}
              options={{ title: 'Ride Details' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  introContainer: {
    flex: 1,
    backgroundColor: '#000000', // Black background
    justifyContent: 'center',
    alignItems: 'center',
  },
  introContent: {
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  introTextA: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff', // White text
    letterSpacing: 2,
  },
  introTextRest: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff', // White text
    letterSpacing: 2,
  },
});
