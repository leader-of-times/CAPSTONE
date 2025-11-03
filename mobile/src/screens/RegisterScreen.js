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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { register } from '../services/api';

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={formData.name}
            onChangeText={(text) => updateFormData('name', text)}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email *"
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters) *"
            value={formData.password}
            onChangeText={(text) => updateFormData('password', text)}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.phone}
            onChangeText={(text) => updateFormData('phone', text)}
            keyboardType="phone-pad"
            editable={!loading}
          />

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
              <TextInput
                style={styles.input}
                placeholder="Vehicle Model *"
                value={vehicleInfo.model}
                onChangeText={(text) => updateVehicleInfo('model', text)}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Plate Number"
                value={vehicleInfo.plateNumber}
                onChangeText={(text) => updateVehicleInfo('plateNumber', text)}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Color"
                value={vehicleInfo.color}
                onChangeText={(text) => updateVehicleInfo('color', text)}
                editable={!loading}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Register'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  picker: {
    height: 50,
  },
  vehicleSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
