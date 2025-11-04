import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { register } from '../services/api';
import tokens from '../styles/tokens';
import PrimaryButton from '../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation, onAuthSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'student',
  });
  const [vehicleInfo, setVehicleInfo] = useState({
    model: '',
    plateNumber: '',
    color: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const { email, password, name, phone, role } = formData;

    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (role === 'driver' && !vehicleInfo.model) {
      Alert.alert('Error', 'Please provide vehicle information');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        ...formData,
        vehicleInfo: role === 'driver' ? vehicleInfo : undefined,
      };

      await register(userData);
      Alert.alert('Success', 'Account created! Please login.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateVehicleInfo = (field, value) => {
    setVehicleInfo((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join AutoShare today</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Text style={styles.inputIcon}>👤</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor={tokens.colors.gray500}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Text style={styles.inputIcon}>✉️</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor={tokens.colors.gray500}
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="lock-closed" size={20} color={tokens.colors.gray500} style={styles.floatingIcon} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password (min 6 characters) *"
                placeholderTextColor={tokens.colors.gray500}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="call" size={20} color={tokens.colors.gray500} style={styles.floatingIcon} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={tokens.colors.gray500}
                value={formData.phone}
                onChangeText={(text) => updateFormData('phone', text)}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>I am a:</Text>
              <Picker
                selectedValue={formData.role}
                onValueChange={(value) => updateFormData('role', value)}
                enabled={!loading}
                style={styles.picker}
              >
                <Picker.Item label="Student" value="student" />
                <Picker.Item label="Driver" value="driver" />
              </Picker>
            </View>

            {formData.role === 'driver' && (
              <View style={styles.vehicleSection}>
                <Text style={styles.sectionTitle}>Vehicle Information</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="car" size={20} color={tokens.colors.gray500} style={styles.floatingIcon} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Vehicle Model *"
                    placeholderTextColor={tokens.colors.gray500}
                    value={vehicleInfo.model}
                    onChangeText={(text) => updateVehicleInfo('model', text)}
                    editable={!loading}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconContainer}>
                    <Text style={styles.inputIcon}>🔢</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Plate Number"
                    placeholderTextColor={tokens.colors.gray500}
                    value={vehicleInfo.plateNumber}
                    onChangeText={(text) => updateVehicleInfo('plateNumber', text)}
                    editable={!loading}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconContainer}>
                    <Text style={styles.inputIcon}>🎨</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Color"
                    placeholderTextColor={tokens.colors.gray500}
                    value={vehicleInfo.color}
                    onChangeText={(text) => updateVehicleInfo('color', text)}
                    editable={!loading}
                  />
                </View>
              </View>
            )}

            <PrimaryButton
              title={loading ? 'Creating Account...' : 'Register'}
              onPress={handleRegister}
              loading={loading}
              variant="primary"
              style={styles.registerButton}
            />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
    backgroundColor: tokens.colors.black,
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
  content: {
    flex: 1,
    padding: 24,
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
  pickerContainer: {
    backgroundColor: tokens.colors.gray100,
    borderWidth: 1,
    borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.md,
    marginBottom: 16,
    padding: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.gray600,
    marginBottom: 4,
  },
  picker: {
    height: 50,
    color: tokens.colors.black,
  },
  vehicleSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: tokens.colors.black,
  },
  registerButton: {
    marginTop: 24,
  },
  linkButton: {
    marginTop: 24,
    marginBottom: 24,
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
  floatingIcon: {
    opacity: 0.8,
  },
});
