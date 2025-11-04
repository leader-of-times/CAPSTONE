import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tokens from '../styles/tokens';
import api from '../services/api';

export default function PaymentScreen({ route, navigation }) {
  const { rideId, amount, rideFare } = route.params;
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('not_initiated');

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const response = await api.get(`/payments/status/${rideId}`);
      setPaymentStatus(response.data.payment.status);
    } catch (error) {
      console.error('Check payment status error:', error);
    }
  };

  const handlePayNow = async () => {
    if (Platform.OS === 'web') {
      handleWebPayment();
    } else {
      Alert.alert(
        'Payment Simulation',
        'In a real app, this would open Razorpay payment gateway.\n\nFor demo purposes, we\'ll simulate a successful payment.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Simulate Payment',
            onPress: () => simulatePayment(),
          },
        ]
      );
    }
  };

  const handleWebPayment = async () => {
    setLoading(true);
    try {
      const response = await api.post('/payments/create-order', { rideId });
      const { orderId, amount, currency, keyId } = response.data;

      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: 'AutoShare',
          description: 'Ride Payment',
          order_id: orderId,
          handler: async function (response) {
            await verifyPayment(response);
          },
          prefill: {
            name: await AsyncStorage.getItem('userName'),
            email: await AsyncStorage.getItem('userEmail'),
          },
          theme: {
            color: tokens.colors.primary,
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        await simulatePayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = async () => {
    setLoading(true);
    try {
      const response = await api.post('/payments/create-order', { rideId });
      const { orderId } = response.data;

      const mockPaymentData = {
        razorpay_order_id: orderId,
        razorpay_payment_id: `pay_sim_${Date.now()}`,
        razorpay_signature: 'simulated_signature',
        rideId: rideId,
      };

      await verifyPayment(mockPaymentData);
    } catch (error) {
      console.error('Simulated payment error:', error);
      Alert.alert('Error', 'Payment simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const response = await api.post('/payments/verify-payment', {
        ...paymentData,
        rideId,
      });

      if (response.data.success) {
        setPaymentStatus('completed');
        Alert.alert('Success', 'Payment completed successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        setPaymentStatus('failed');
        Alert.alert('Failed', 'Payment verification failed');
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      setPaymentStatus('failed');
      Alert.alert('Error', 'Payment verification failed');
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'completed':
        return tokens.colors.success;
      case 'failed':
        return tokens.colors.error;
      case 'pending':
        return tokens.colors.warning;
      default:
        return tokens.colors.textLight;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Paid';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      default:
        return 'Not Paid';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={paymentStatus === 'completed' ? 'checkmark-circle' : 'cash-outline'} 
            size={80} 
            color={getStatusColor()} 
          />
        </View>

        <Text style={styles.title}>Ride Payment</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Fare Amount</Text>
            <Text style={styles.value}>₹{rideFare || amount}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
        </View>

        {paymentStatus === 'not_initiated' || paymentStatus === 'failed' ? (
          <TouchableOpacity
            style={[styles.payButton, loading && styles.payButtonDisabled]}
            onPress={handlePayNow}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="card-outline" size={24} color="white" />
                <Text style={styles.payButtonText}>Pay Now</Text>
              </>
            )}
          </TouchableOpacity>
        ) : paymentStatus === 'completed' ? (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.note}>
          Note: This is a demo payment integration. In production, real Razorpay keys would be used.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: tokens.colors.text,
    marginBottom: 32,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: tokens.colors.textLight,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: tokens.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.border,
    marginVertical: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: tokens.colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    marginBottom: 16,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  doneButton: {
    backgroundColor: tokens.colors.surface,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 400,
    marginBottom: 16,
  },
  doneButtonText: {
    color: tokens.colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  note: {
    fontSize: 12,
    color: tokens.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: 400,
  },
});
