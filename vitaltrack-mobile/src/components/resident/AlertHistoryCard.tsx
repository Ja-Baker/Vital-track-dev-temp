import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Alert, AlertType, AlertStatus } from '../../types';
import { colors, spacing, borderRadius } from '../../theme/theme';
import {
  formatTimeAgo,
  formatAlertCategory,
  formatAlertStatus,
} from '../../utils/formatters';
import Badge from '../common/Badge';

interface AlertHistoryCardProps {
  alerts: Alert[];
  onAlertPress?: (alertId: string) => void;
}

const AlertHistoryCard: React.FC<AlertHistoryCardProps> = ({
  alerts,
  onAlertPress,
}) => {
  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return 'alert-octagon';
      case 'warning':
        return 'alert';
      case 'info':
        return 'information';
      default:
        return 'bell';
    }
  };

  const getAlertColor = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getBadgeType = (
    status: AlertStatus
  ): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'active':
        return 'error';
      case 'acknowledged':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'escalated':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderAlert = ({ item }: { item: Alert }) => {
    const alertColor = getAlertColor(item.alertType);

    return (
      <View style={styles.alertItem}>
        <View style={styles.alertIconContainer}>
          <MaterialCommunityIcons
            name={getAlertIcon(item.alertType)}
            size={24}
            color={alertColor}
          />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertCategory}>
              {formatAlertCategory(item.category)}
            </Text>
            <Badge
              text={formatAlertStatus(item.status)}
              type={getBadgeType(item.status)}
              size="small"
            />
          </View>
          <Text style={styles.alertMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.alertTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  if (alerts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Alert History</Text>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="check-circle"
            size={48}
            color={colors.success}
          />
          <Text style={styles.emptyText}>No alerts</Text>
          <Text style={styles.emptySubtext}>
            This resident has no alert history
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Alert History</Text>
        <Badge text={alerts.length} type="default" size="small" />
      </View>
      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  alertItem: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  alertIconContainer: {
    marginRight: spacing.md,
    paddingTop: spacing.xs,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alertCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  alertMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  alertTime: {
    fontSize: 11,
    color: colors.textLight,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default AlertHistoryCard;
