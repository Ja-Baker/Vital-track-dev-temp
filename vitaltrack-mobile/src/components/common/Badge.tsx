import React from 'react';
import { StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface BadgeProps {
  text: string | number;
  type?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

const Badge: React.FC<BadgeProps> = ({
  text,
  type = 'default',
  size = 'medium',
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'primary':
        return colors.primaryLight;
      case 'success':
        return colors.secondaryLight;
      case 'warning':
        return colors.warningLight;
      case 'error':
        return colors.errorLight;
      case 'info':
        return colors.primaryLight;
      default:
        return colors.background;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'primary':
        return colors.primaryDark;
      case 'success':
        return colors.secondaryDark;
      case 'warning':
        return colors.warningDark;
      case 'error':
        return colors.errorDark;
      case 'info':
        return colors.primaryDark;
      default:
        return colors.textSecondary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          text: styles.smallText,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          text: styles.largeText,
        };
      default:
        return {
          container: styles.mediumContainer,
          text: styles.mediumText,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `${type} badge: ${text}`}
    >
      <Text
        style={[
          styles.text,
          sizeStyles.text,
          { color: getTextColor() },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
  // Small size
  smallContainer: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
  },
  smallText: {
    fontSize: 10,
  },
  // Medium size
  mediumContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 24,
  },
  mediumText: {
    fontSize: 12,
  },
  // Large size
  largeContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 32,
  },
  largeText: {
    fontSize: 14,
  },
});

export default Badge;
