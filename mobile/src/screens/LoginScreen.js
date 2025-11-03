import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../services/api';
import { initSocket } from '../services/socket';
import tokens from '../styles/tokens';
import PrimaryButton from '../components/PrimaryButton';

export default function LoginScreen({ navigation, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, password });
      const { token, user } = response.data;

      // Store auth data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userId', user.id);
      await AsyncStorage.setItem('userRole', user.role);
      await AsyncStorage.setItem('userName', user.name);

      // Initialize socket
      initSocket(token, user.id, user.role);

      // Update parent App state to trigger navigation
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.response?.data?.error || 'Invalid credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🚗</Text>
            </View>
            <Text style={styles.title}>AutoShare</Text>
            <Text style={styles.subtitle}>Smart ride-sharing for students</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Text style={styles.inputIcon}>✉️</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={tokens.colors.gray500}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={tokens.colors.gray500}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <PrimaryButton
            title={loading ? 'Signing in...' : 'Sign In'}
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            style={styles.loginButton}
          />

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
  topSection: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: tokens.colors.black,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.gray900,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: tokens.colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: tokens.colors.gray400,
  },
  formSection: {
    flex: 1,
    padding: 24,
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: tokens.colors.black,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: tokens.colors.gray600,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.gray100,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: tokens.colors.gray200,
  },
  inputIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inputIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: tokens.colors.black,
    paddingVertical: 12,
  },
  loginButton: {
    marginTop: 24,
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 15,
    color: tokens.colors.gray600,
  },
  linkTextBold: {
    color: tokens.colors.primary,
    fontWeight: '600',
  },
});
