import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Button as PaperButton, ActivityIndicator } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  mode = 'contained',
  loading = false,
  disabled = false,
  icon,
  style,
  labelStyle,
  fullWidth = false,
}) => {
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled || loading}
      icon={icon}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        style,
      ]}
      labelStyle={[styles.label, labelStyle]}
      contentStyle={styles.content}
      loading={loading}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : title}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    elevation: 2,
  },
  content: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
});

export default Button;
