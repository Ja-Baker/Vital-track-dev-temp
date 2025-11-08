import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ResidentWithStatus } from '../../types';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { formatTimeAgo, formatInitials } from '../../utils/formatters';
import Card from '../common/Card';
import Badge from '../common/Badge';
import VitalIndicator from '../resident/VitalIndicator';

interface ResidentCardProps {
  resident: ResidentWithStatus;
  onPress: () => void;
}

const ResidentCard: React.FC<ResidentCardProps> = ({ resident, onPress }) => {
  const hasRecentVital = resident.latestVital && resident.lastVitalTimestamp;
  const hasActiveAlerts = (resident.activeAlerts ?? 0) > 0;

  const getStatusColor = () => {
    if (!hasRecentVital) {
      return colors.textLight;
    }
    if (hasActiveAlerts) {
      return colors.error;
    }
    return colors.success;
  };

  const getStatusText = () => {
    if (!hasRecentVital) {
      return 'No Data';
    }
    if (hasActiveAlerts) {
      return 'Alert';
    }
    return 'Normal';
  };

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        {/* Avatar and Name */}
        <View style={styles.avatarSection}>
          {resident.photoUrl ? (
            <Avatar.Image
              size={50}
              source={{ uri: resident.photoUrl }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={50}
              label={formatInitials(resident.firstName, resident.lastName)}
              style={[styles.avatar, { backgroundColor: colors.primary }]}
              labelStyle={styles.avatarLabel}
            />
          )}
          <View style={styles.nameSection}>
            <Text style={styles.name}>
              {resident.firstName} {resident.lastName}
            </Text>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="door"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.room}>Room {resident.roomNumber}</Text>
            </View>
          </View>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusSection}>
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Vital Signs */}
      {hasRecentVital && resident.latestVital && (
        <View style={styles.vitalsContainer}>
          <VitalIndicator
            type="heart_rate"
            value={resident.latestVital.heartRate}
            size="small"
          />
          <VitalIndicator
            type="spo2"
            value={resident.latestVital.spo2}
            size="small"
          />
          <VitalIndicator
            type="respiration_rate"
            value={resident.latestVital.respirationRate}
            size="small"
          />
          <VitalIndicator
            type="stress_level"
            value={resident.latestVital.stressLevel}
            size="small"
          />
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {/* Last Update Time */}
        <View style={styles.lastUpdate}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.lastUpdateText}>
            {hasRecentVital
              ? formatTimeAgo(resident.lastVitalTimestamp!)
              : 'No recent data'}
          </Text>
        </View>

        {/* Alert Badge */}
        {hasActiveAlerts && (
          <Badge
            text={resident.activeAlerts!}
            type="error"
            size="small"
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: spacing.md,
  },
  avatarLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  room: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: spacing.xs / 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vitalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
});

export default ResidentCard;
