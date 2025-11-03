import React from 'react';
import { View, StyleSheet } from 'react-native';
import tokens from '../styles/tokens';

const Card = ({ children, style, variant = 'default', elevated = true }) => {
  return (
    <View style={[
      styles.card,
      elevated && styles.elevated,
      variant === 'dark' && styles.darkCard,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.gray200,
  },
  elevated: {
    ...tokens.shadows.md,
  },
  darkCard: {
    backgroundColor: tokens.colors.gray900,
    borderColor: tokens.colors.gray800,
  },
});

export default Card;
