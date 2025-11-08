import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../theme/theme';
import {
  formatHeartRate,
  formatSpO2,
  formatRespirationRate,
  formatStressLevel,
} from '../../utils/formatters';

interface VitalIndicatorProps {
  type: 'heart_rate' | 'spo2' | 'respiration_rate' | 'stress_level';
  value?: number;
  isNormal?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const VitalIndicator: React.FC<VitalIndicatorProps> = ({
  type,
  value,
  isNormal = true,
  size = 'medium',
  showLabel = true,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'heart_rate':
        return 'heart-pulse';
      case 'spo2':
        return 'water-percent';
      case 'respiration_rate':
        return 'lungs';
      case 'stress_level':
        return 'brain';
      default:
        return 'heart';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'heart_rate':
        return 'Heart Rate';
      case 'spo2':
        return 'SpO₂';
      case 'respiration_rate':
        return 'Respiration';
      case 'stress_level':
        return 'Stress';
      default:
        return '';
    }
  };

  const getColor = () => {
    if (value === undefined || value === null) {
      return colors.textLight;
    }
    if (!isNormal) {
      return colors.error;
    }
    switch (type) {
      case 'heart_rate':
        return colors.heartRate;
      case 'spo2':
        return colors.spo2;
      case 'respiration_rate':
        return colors.respirationRate;
      case 'stress_level':
        return colors.stressLevel;
      default:
        return colors.primary;
    }
  };

  const getFormattedValue = () => {
    switch (type) {
      case 'heart_rate':
        return formatHeartRate(value);
      case 'spo2':
        return formatSpO2(value);
      case 'respiration_rate':
        return formatRespirationRate(value);
      case 'stress_level':
        return formatStressLevel(value);
      default:
        return '--';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 28;
      default:
        return 20;
    }
  };

  const getValueSize = () => {
    switch (size) {
      case 'small':
        return styles.smallValue;
      case 'large':
        return styles.largeValue;
      default:
        return styles.mediumValue;
    }
  };

  const getLabelSize = () => {
    switch (size) {
      case 'small':
        return styles.smallLabel;
      case 'large':
        return styles.largeLabel;
      default:
        return styles.mediumLabel;
    }
  };

  const color = getColor();

  return (
    <View style={styles.container}>
      <View style={styles.iconValueContainer}>
        <MaterialCommunityIcons
          name={getIcon()}
          size={getIconSize()}
          color={color}
          style={styles.icon}
        />
        <Text style={[styles.value, getValueSize(), { color }]}>
          {getFormattedValue()}
        </Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, getLabelSize()]}>{getLabel()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.xs,
  },
  value: {
    fontWeight: '600',
  },
  label: {
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  // Small size
  smallValue: {
    fontSize: 12,
  },
  smallLabel: {
    fontSize: 10,
  },
  // Medium size
  mediumValue: {
    fontSize: 14,
  },
  mediumLabel: {
    fontSize: 11,
  },
  // Large size
  largeValue: {
    fontSize: 18,
  },
  largeLabel: {
    fontSize: 12,
  },
});

export default VitalIndicator;
