import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

  useEffect(() => {
    checkAuth();
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
