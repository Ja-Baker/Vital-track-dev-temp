import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { VitalTrend } from '../../types';
import { format } from 'date-fns';

interface VitalChartProps {
  data: VitalTrend[];
  type: 'heart_rate' | 'spo2' | 'respiration_rate' | 'stress_level';
  title: string;
  unit: string;
}

const VitalChart: React.FC<VitalChartProps> = ({ data, type, title, unit }) => {
  const screenWidth = Dimensions.get('window').width - spacing.lg * 2;

  const getColor = () => {
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

  const getValue = (trend: VitalTrend): number | null => {
    switch (type) {
      case 'heart_rate':
        return trend.avgHeartRate ?? null;
      case 'spo2':
        return trend.avgSpO2 ?? null;
      case 'respiration_rate':
        return trend.avgRespirationRate ?? null;
      case 'stress_level':
        return trend.avgStressLevel ?? null;
      default:
        return null;
    }
  };

  // Filter out null values and prepare data
  const validData = data
    .map((trend) => ({
      timestamp: trend.timestamp,
      value: getValue(trend),
    }))
    .filter((item) => item.value !== null) as Array<{
    timestamp: string;
    value: number;
  }>;

  if (validData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      </View>
    );
  }

  const chartData = {
    labels: validData.map((item, index) => {
      // Show every 3rd label to avoid crowding
      if (index % 3 === 0) {
        return format(new Date(item.timestamp), 'HH:mm');
      }
      return '';
    }),
    datasets: [
      {
        data: validData.map((item) => item.value),
        color: () => getColor(),
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.3})`,
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: borderRadius.lg,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: getColor(),
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        withDots={true}
        withShadow={false}
        fromZero={false}
        yAxisSuffix={` ${unit}`}
        yAxisInterval={1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: borderRadius.lg,
    paddingRight: spacing.md,
  },
  noDataContainer: {
    height: 220,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default VitalChart;
