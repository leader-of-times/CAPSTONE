import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import tokens from '../styles/tokens';

const PrimaryButton = ({ 
  onPress, 
  title, 
  disabled = false, 
  loading = false, 
  variant = 'primary',
  style 
}) => {
  const getButtonStyle = () => {
    if (disabled) return styles.disabled;
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.textPrimary;
      case 'secondary':
        return styles.textSecondary;
      case 'outline':
        return styles.textOutline;
      default:
        return styles.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.container, getButtonStyle(), style]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? tokens.colors.white : tokens.colors.black} />
      ) : (
        <Text style={[styles.text, getTextStyle()]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: {
    backgroundColor: tokens.colors.primary,
  },
  secondary: {
    backgroundColor: tokens.colors.black,
  },
  outline: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.gray300,
  },
  disabled: {
    backgroundColor: tokens.colors.gray200,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textPrimary: {
    color: tokens.colors.white,
  },
  textSecondary: {
    color: tokens.colors.white,
  },
  textOutline: {
    color: tokens.colors.black,
  },
});

export default PrimaryButton;
