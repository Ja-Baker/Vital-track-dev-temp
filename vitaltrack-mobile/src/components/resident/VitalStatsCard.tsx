import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { VitalStats } from '../../types';
import {
  formatHeartRate,
  formatSpO2,
  formatRespirationRate,
  formatStressLevel,
} from '../../utils/formatters';

interface VitalStatsCardProps {
  stats: VitalStats;
  hours?: number;
}

const VitalStatsCard: React.FC<VitalStatsCardProps> = ({
  stats,
  hours = 24,
}) => {
  const statItems = [
    {
      label: 'Heart Rate',
      avg: formatHeartRate(stats.avgHeartRate),
      min: formatHeartRate(stats.minHeartRate),
      max: formatHeartRate(stats.maxHeartRate),
      color: colors.heartRate,
    },
    {
      label: 'SpO₂',
      avg: formatSpO2(stats.avgSpO2),
      min: formatSpO2(stats.minSpO2),
      max: formatSpO2(stats.maxSpO2),
      color: colors.spo2,
    },
    {
      label: 'Respiration',
      avg: formatRespirationRate(stats.avgRespirationRate),
      min: formatRespirationRate(stats.minRespirationRate),
      max: formatRespirationRate(stats.maxRespirationRate),
      color: colors.respirationRate,
    },
    {
      label: 'Stress Level',
      avg: formatStressLevel(stats.avgStressLevel),
      min: formatStressLevel(stats.minStressLevel),
      max: formatStressLevel(stats.maxStressLevel),
      color: colors.stressLevel,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Last {hours} Hours Statistics</Text>
      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statItem}>
            <View style={styles.statHeader}>
              <View
                style={[styles.colorDot, { backgroundColor: item.color }]}
              />
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
            <View style={styles.statValues}>
              <View style={styles.statValue}>
                <Text style={styles.statValueLabel}>Avg</Text>
                <Text style={[styles.statValueText, { color: item.color }]}>
                  {item.avg}
                </Text>
              </View>
              <View style={styles.statValue}>
                <Text style={styles.statValueLabel}>Min</Text>
                <Text style={styles.statValueText}>{item.min}</Text>
              </View>
              <View style={styles.statValue}>
                <Text style={styles.statValueLabel}>Max</Text>
                <Text style={styles.statValueText}>{item.max}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    gap: spacing.md,
  },
  statItem: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statValue: {
    alignItems: 'center',
  },
  statValueLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  statValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default VitalStatsCard;
