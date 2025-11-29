import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../theme/theme';

interface OfflineBannerProps {
  isVisible: boolean;
  pendingActionsCount?: number;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isVisible,
  pendingActionsCount = 0,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`You are offline${pendingActionsCount > 0 ? `. ${pendingActionsCount} changes pending sync` : ''}`}
    >
      <MaterialCommunityIcons
        name="wifi-off"
        size={18}
        color="#FFFFFF"
        style={styles.icon}
      />
      <Text style={styles.text}>
        You are offline
        {pendingActionsCount > 0 && ` • ${pendingActionsCount} pending`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OfflineBanner;
