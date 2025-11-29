import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { apiService } from '../services/api';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const screenWidth = Dimensions.get('window').width;

interface FacilityOverview {
  totalResidents: number;
  activeAlerts: number;
  staffCount: number;
  residentsWithRecentVitals: number;
  monitoringRate: number;
  alertsByType: Record<string, number>;
}

interface VitalAverages {
  heartRate: { avg: number | null; min: number | null; max: number | null };
  spo2: { avg: number | null; min: number | null; max: number | null };
  respirationRate: { avg: number | null };
  stressLevel: { avg: number | null };
}

const AnalyticsScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overview, setOverview] = useState<FacilityOverview | null>(null);
  const [vitalAverages, setVitalAverages] = useState<VitalAverages | null>(null);
  const [timeRange, setTimeRange] = useState<string>('24h');

  const fetchAnalytics = useCallback(async () => {
    try {
      const [overviewRes, vitalsRes] = await Promise.all([
        apiService.get('/analytics/overview'),
        apiService.get(`/analytics/vitals?timeRange=${timeRange}`),
      ]);

      if (overviewRes.success) {
        setOverview(overviewRes.data);
      }
      if (vitalsRes.success) {
        setVitalAverages(vitalsRes.data.averages);
      }
    } catch (error) {
      console.error('[Analytics] Fetch error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAnalytics();
  }, [fetchAnalytics]);

  const alertPieData = overview?.alertsByType
    ? Object.entries(overview.alertsByType).map(([type, count], index) => ({
        name: type,
        population: count,
        color: type === 'critical' ? colors.error : type === 'warning' ? colors.warning : colors.info,
        legendFontColor: colors.text,
        legendFontSize: 12,
      }))
    : [];

  const StatCard: React.FC<{
    icon: string;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }> = ({ icon, title, value, subtitle, color = colors.primary }) => (
    <View style={[styles.statCard, shadows.small]} accessible={true} accessibilityLabel={`${title}: ${value}${subtitle ? `, ${subtitle}` : ''}`}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const VitalCard: React.FC<{
    icon: string;
    title: string;
    avg: number | null;
    min?: number | null;
    max?: number | null;
    unit: string;
    color: string;
  }> = ({ icon, title, avg, min, max, unit, color }) => (
    <View style={[styles.vitalCard, shadows.small]} accessible={true} accessibilityLabel={`${title}: average ${avg ?? 'N/A'} ${unit}`}>
      <View style={styles.vitalHeader}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
        <Text style={styles.vitalTitle}>{title}</Text>
      </View>
      <Text style={[styles.vitalValue, { color }]}>
        {avg !== null ? avg : '--'} <Text style={styles.vitalUnit}>{unit}</Text>
      </Text>
      {min !== null && max !== null && (
        <Text style={styles.vitalRange}>
          Range: {min} - {max} {unit}
        </Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">Facility Analytics</Text>
        <Text style={styles.headerSubtitle}>Real-time health monitoring overview</Text>
      </View>

      {/* Overview Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="account-group"
          title="Residents"
          value={overview?.totalResidents ?? 0}
          color={colors.primary}
        />
        <StatCard
          icon="alert-circle"
          title="Active Alerts"
          value={overview?.activeAlerts ?? 0}
          color={colors.error}
        />
        <StatCard
          icon="heart-pulse"
          title="Monitoring"
          value={`${overview?.monitoringRate ?? 0}%`}
          subtitle="Last 24h"
          color={colors.success}
        />
        <StatCard
          icon="account-tie"
          title="Staff"
          value={overview?.staffCount ?? 0}
          color={colors.info}
        />
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <Text style={styles.sectionTitle}>Vital Averages</Text>
        <View style={styles.timeRangeTabs}>
          {['1h', '6h', '24h', '7d'].map((range) => (
            <View
              key={range}
              style={[
                styles.timeRangeTab,
                timeRange === range && styles.timeRangeTabActive,
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: timeRange === range }}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
                onPress={() => setTimeRange(range)}
              >
                {range}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Vital Averages */}
      <View style={styles.vitalsGrid}>
        <VitalCard
          icon="heart-pulse"
          title="Heart Rate"
          avg={vitalAverages?.heartRate.avg ?? null}
          min={vitalAverages?.heartRate.min ?? null}
          max={vitalAverages?.heartRate.max ?? null}
          unit="bpm"
          color={colors.heartRate}
        />
        <VitalCard
          icon="water-percent"
          title="SpO2"
          avg={vitalAverages?.spo2.avg ?? null}
          min={vitalAverages?.spo2.min ?? null}
          max={vitalAverages?.spo2.max ?? null}
          unit="%"
          color={colors.spo2}
        />
        <VitalCard
          icon="lungs"
          title="Respiration"
          avg={vitalAverages?.respirationRate.avg ?? null}
          unit="brpm"
          color={colors.respirationRate}
        />
        <VitalCard
          icon="brain"
          title="Stress Level"
          avg={vitalAverages?.stressLevel.avg ?? null}
          unit="/100"
          color={colors.stressLevel}
        />
      </View>

      {/* Alert Distribution */}
      {alertPieData.length > 0 && (
        <View style={[styles.chartCard, shadows.small]}>
          <Text style={styles.chartTitle} accessibilityRole="header">Alert Distribution</Text>
          <PieChart
            data={alertPieData}
            width={screenWidth - spacing.lg * 2}
            height={180}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      )}

      {/* Legend */}
      <View style={[styles.legendCard, shadows.small]}>
        <Text style={styles.legendTitle}>Alert Types</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>
              Critical: {overview?.alertsByType?.critical ?? 0}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>
              Warning: {overview?.alertsByType?.warning ?? 0}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
            <Text style={styles.legendText}>
              Info: {overview?.alertsByType?.info ?? 0}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: (screenWidth - spacing.md * 2 - spacing.sm) / 2 - spacing.sm / 2,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  statSubtitle: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  timeRangeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: 2,
  },
  timeRangeTab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  timeRangeTabActive: {
    backgroundColor: colors.primary,
  },
  timeRangeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  vitalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: (screenWidth - spacing.md * 2 - spacing.sm) / 2 - spacing.sm / 2,
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vitalTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  vitalValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  vitalUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  vitalRange: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  legendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});

export default AnalyticsScreen;
