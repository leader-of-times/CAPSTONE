import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import tokens from '../styles/tokens';

const StatusBadge = ({ status, style }) => {
  const getStatusStyle = () => {
    switch (status?.toLowerCase()) {
      case 'requested':
      case 'requesting':
        return { bg: tokens.colors.gray800, text: tokens.colors.white, label: 'Searching...' };
      case 'accepted':
        return { bg: tokens.colors.success, text: tokens.colors.white, label: 'Accepted' };
      case 'onride':
      case 'in_progress':
        return { bg: tokens.colors.info, text: tokens.colors.white, label: 'On Trip' };
      case 'completed':
        return { bg: tokens.colors.gray300, text: tokens.colors.black, label: 'Completed' };
      case 'cancelled':
        return { bg: tokens.colors.primary, text: tokens.colors.white, label: 'Cancelled' };
      default:
        return { bg: tokens.colors.gray600, text: tokens.colors.white, label: status || 'Unknown' };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <View style={[styles.badge, { backgroundColor: statusStyle.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: statusStyle.text }]} />
      <Text style={[styles.text, { color: statusStyle.text }]}>{statusStyle.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatusBadge;
