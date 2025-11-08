import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchResident,
  clearSelectedResident,
} from '../store/slices/residentsSlice';
import {
  fetchLatestVital,
  fetchVitalTrends,
  fetchVitalStats,
  clearVitals,
} from '../store/slices/vitalsSlice';
import { fetchResidentAlerts } from '../store/slices/alertsSlice';
import { websocketService } from '../services/websocket';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, borderRadius } from '../theme/theme';
import {
  formatInitials,
  formatDate,
  calculateAge,
  formatPhoneNumber,
} from '../utils/formatters';
import VitalIndicator from '../components/resident/VitalIndicator';
import VitalChart from '../components/charts/VitalChart';
import VitalStatsCard from '../components/resident/VitalStatsCard';
import AlertHistoryCard from '../components/resident/AlertHistoryCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

type ResidentDetailRouteProp = RouteProp<RootStackParamList, 'ResidentDetail'>;

const ResidentDetailScreen: React.FC = () => {
  const route = useRoute<ResidentDetailRouteProp>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { residentId } = route.params;

  const { selectedResident, isLoading } = useAppSelector(
    (state) => state.residents
  );
  const { latestVital, trends, stats } = useAppSelector((state) => state.vitals);
  const { alerts } = useAppSelector((state) => state.alerts);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'vitals' | 'alerts'>('vitals');

  // Fetch resident data on mount
  useEffect(() => {
    loadResidentData();

    // Subscribe to real-time updates for this resident
    websocketService.subscribeToResident(residentId);

    return () => {
      // Unsubscribe and clear data on unmount
      websocketService.unsubscribeFromResident(residentId);
      dispatch(clearSelectedResident());
      dispatch(clearVitals());
    };
  }, [residentId, dispatch]);

  const loadResidentData = async () => {
    try {
      await Promise.all([
        dispatch(fetchResident(residentId)).unwrap(),
        dispatch(fetchLatestVital(residentId)).unwrap(),
        dispatch(
          fetchVitalTrends({ residentId, intervalMinutes: 60, hours: 24 })
        ).unwrap(),
        dispatch(fetchVitalStats({ residentId, hours: 24 })).unwrap(),
        dispatch(fetchResidentAlerts({ residentId })).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to load resident data:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadResidentData();
    setIsRefreshing(false);
  }, [residentId]);

  const handleEditThresholds = () => {
    navigation.navigate('EditThresholds', { residentId });
  };

  if (isLoading || !selectedResident) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading resident details...</Text>
      </View>
    );
  }

  const resident = selectedResident;
  const residentAlerts = alerts.filter((a) => a.residentId === residentId);
  const activeAlerts = residentAlerts.filter((a) => a.status === 'active');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        {/* Avatar and Name */}
        <View style={styles.avatarSection}>
          {resident.photoUrl ? (
            <Avatar.Image
              size={80}
              source={{ uri: resident.photoUrl }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={80}
              label={formatInitials(resident.firstName, resident.lastName)}
              style={[styles.avatar, { backgroundColor: colors.primary }]}
              labelStyle={styles.avatarLabel}
            />
          )}
          <View style={styles.nameSection}>
            <Text style={styles.name}>
              {resident.firstName} {resident.lastName}
            </Text>
            <Text style={styles.age}>
              {calculateAge(resident.dateOfBirth)} years old
            </Text>
            <Text style={styles.birthDate}>
              Born {formatDate(resident.dateOfBirth)}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="door"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoLabel}>Room</Text>
            <Text style={styles.infoValue}>{resident.roomNumber}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="phone"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoLabel}>Emergency</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {resident.emergencyContactName}
            </Text>
            <Text style={styles.infoSubvalue} numberOfLines={1}>
              {formatPhoneNumber(resident.emergencyContactPhone)}
            </Text>
          </View>
          {resident.garminDeviceId && (
            <View style={styles.infoItem}>
              <MaterialCommunityIcons
                name="watch"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoLabel}>Device</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {resident.garminDeviceId}
              </Text>
            </View>
          )}
        </View>

        {/* Active Alerts Banner */}
        {activeAlerts.length > 0 && (
          <View style={styles.alertBanner}>
            <MaterialCommunityIcons
              name="alert"
              size={20}
              color={colors.error}
            />
            <Text style={styles.alertBannerText}>
              {activeAlerts.length} Active Alert
              {activeAlerts.length > 1 ? 's' : ''}
            </Text>
            <Badge text={activeAlerts.length} type="error" size="small" />
          </View>
        )}
      </View>

      {/* Live Vitals Card */}
      {latestVital && (
        <View style={styles.vitalsCard}>
          <Text style={styles.sectionTitle}>Live Vitals</Text>
          <View style={styles.vitalsGrid}>
            <VitalIndicator
              type="heart_rate"
              value={latestVital.heartRate}
              size="large"
            />
            <VitalIndicator
              type="spo2"
              value={latestVital.spo2}
              size="large"
            />
            <VitalIndicator
              type="respiration_rate"
              value={latestVital.respirationRate}
              size="large"
            />
            <VitalIndicator
              type="stress_level"
              value={latestVital.stressLevel}
              size="large"
            />
          </View>
        </View>
      )}

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'vitals' && styles.tabActive,
          ]}
          onPress={() => setSelectedTab('vitals')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'vitals' && styles.tabTextActive,
            ]}
          >
            Vital Trends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'alerts' && styles.tabActive,
          ]}
          onPress={() => setSelectedTab('alerts')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'alerts' && styles.tabTextActive,
            ]}
          >
            Alerts ({residentAlerts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {selectedTab === 'vitals' ? (
        <>
          {/* Charts */}
          {trends.length > 0 ? (
            <>
              <VitalChart
                data={trends}
                type="heart_rate"
                title="Heart Rate (Last 24 Hours)"
                unit="bpm"
              />
              <VitalChart
                data={trends}
                type="spo2"
                title="SpO₂ (Last 24 Hours)"
                unit="%"
              />
              <VitalChart
                data={trends}
                type="respiration_rate"
                title="Respiration Rate (Last 24 Hours)"
                unit="rpm"
              />
              <VitalChart
                data={trends}
                type="stress_level"
                title="Stress Level (Last 24 Hours)"
                unit=""
              />
            </>
          ) : (
            <View style={styles.noDataCard}>
              <MaterialCommunityIcons
                name="chart-line"
                size={48}
                color={colors.textLight}
              />
              <Text style={styles.noDataText}>No trend data available</Text>
            </View>
          )}

          {/* Statistics */}
          {stats && <VitalStatsCard stats={stats} hours={24} />}

          {/* Edit Thresholds Button */}
          <Button
            title="Edit Vital Thresholds"
            onPress={handleEditThresholds}
            mode="outlined"
            icon="cog"
            fullWidth
            style={styles.editButton}
          />
        </>
      ) : (
        <>
          {/* Alert History */}
          <AlertHistoryCard alerts={residentAlerts} />
        </>
      )}

      {/* Medical Notes */}
      {resident.medicalNotes && (
        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>Medical Notes</Text>
          <Text style={styles.notesText}>{resident.medicalNotes}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    marginRight: spacing.md,
  },
  avatarLabel: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  age: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  birthDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  divider: {
    marginVertical: spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  infoSubvalue: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  alertBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginLeft: spacing.sm,
  },
  vitalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  vitalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  noDataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  editButton: {
    marginBottom: spacing.md,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
});

export default ResidentDetailScreen;
