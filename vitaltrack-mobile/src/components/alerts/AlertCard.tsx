import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { Text, TextInput as PaperTextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Alert, AlertType, AlertStatus } from '../../types';
import { colors, spacing, borderRadius, shadows } from '../../theme/theme';
import {
  formatTimeAgo,
  formatAlertCategory,
  formatFullName,
  formatInitials,
} from '../../utils/formatters';
import Badge from '../common/Badge';
import Button from '../common/Button';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string, notes?: string) => void;
  onEscalate?: (alertId: string) => void;
  onPress?: (alertId: string) => void;
  isLoading?: boolean;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onResolve,
  onEscalate,
  onPress,
  isLoading = false,
}) => {
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const getAlertIcon = (type: AlertType): string => {
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

  const getAlertColor = (type: AlertType): string => {
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

  const getAlertBackgroundColor = (type: AlertType): string => {
    switch (type) {
      case 'critical':
        return colors.errorLight;
      case 'warning':
        return colors.warningLight;
      case 'info':
        return colors.primaryLight;
      default:
        return colors.background;
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

  const handleResolvePress = () => {
    setShowResolveModal(true);
  };

  const handleResolveConfirm = () => {
    if (onResolve) {
      onResolve(alert.id, resolutionNotes.trim() || undefined);
    }
    setShowResolveModal(false);
    setResolutionNotes('');
  };

  const handleResolveCancel = () => {
    setShowResolveModal(false);
    setResolutionNotes('');
  };

  const alertColor = getAlertColor(alert.alertType);
  const alertBgColor = getAlertBackgroundColor(alert.alertType);
  const residentName = alert.resident
    ? formatFullName(alert.resident.firstName, alert.resident.lastName)
    : 'Unknown Resident';
  const residentInitials = alert.resident
    ? formatInitials(alert.resident.firstName, alert.resident.lastName)
    : '?';

  // Determine which action buttons to show
  const showAcknowledge = alert.status === 'active' && onAcknowledge;
  const showResolve = alert.status === 'acknowledged' && onResolve;
  const showEscalate = alert.alertType === 'critical' && alert.status === 'active' && onEscalate;

  return (
    <>
      <TouchableOpacity
        style={[styles.container, shadows.small]}
        onPress={() => onPress?.(alert.id)}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        {/* Alert Type Indicator */}
        <View style={[styles.typeIndicator, { backgroundColor: alertColor }]} />

        {/* Card Content */}
        <View style={styles.content}>
          {/* Header: Resident Info */}
          <View style={styles.header}>
            <View style={styles.residentInfo}>
              <View style={[styles.avatar, { backgroundColor: alertBgColor }]}>
                <Text style={[styles.avatarText, { color: alertColor }]}>
                  {residentInitials}
                </Text>
              </View>
              <View style={styles.residentDetails}>
                <Text style={styles.residentName}>{residentName}</Text>
                <Text style={styles.roomNumber}>
                  Room {alert.resident?.roomNumber || 'N/A'}
                </Text>
              </View>
            </View>
            <Badge
              text={alert.status}
              type={getBadgeType(alert.status)}
              size="small"
            />
          </View>

          {/* Alert Info */}
          <View style={styles.alertInfo}>
            <View style={styles.alertHeader}>
              <MaterialCommunityIcons
                name={getAlertIcon(alert.alertType)}
                size={20}
                color={alertColor}
              />
              <Text style={[styles.alertType, { color: alertColor }]}>
                {alert.alertType.toUpperCase()}
              </Text>
              <Text style={styles.alertCategory}>
                • {formatAlertCategory(alert.category)}
              </Text>
            </View>
            <Text style={styles.alertMessage}>{alert.message}</Text>
          </View>

          {/* Vital Data (if present) */}
          {alert.vitalData && Object.keys(alert.vitalData).length > 0 && (
            <View style={styles.vitalDataContainer}>
              {Object.entries(alert.vitalData).map(([key, value]) => (
                <View key={key} style={styles.vitalDataItem}>
                  <Text style={styles.vitalDataLabel}>{key}:</Text>
                  <Text style={styles.vitalDataValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer: Timestamp & Actions */}
          <View style={styles.footer}>
            <View style={styles.timestampContainer}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={colors.textLight}
              />
              <Text style={styles.timestamp}>{formatTimeAgo(alert.createdAt)}</Text>
            </View>

            {/* Action Buttons */}
            {(showAcknowledge || showResolve || showEscalate) && (
              <View style={styles.actions}>
                {showAcknowledge && (
                  <Button
                    title="Acknowledge"
                    onPress={() => onAcknowledge(alert.id)}
                    mode="contained"
                    style={styles.actionButton}
                    labelStyle={styles.actionButtonLabel}
                    loading={isLoading}
                  />
                )}
                {showResolve && (
                  <Button
                    title="Resolve"
                    onPress={handleResolvePress}
                    mode="contained"
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                    labelStyle={styles.actionButtonLabel}
                    loading={isLoading}
                  />
                )}
                {showEscalate && (
                  <Button
                    title="Escalate"
                    onPress={() => onEscalate(alert.id)}
                    mode="outlined"
                    style={styles.actionButton}
                    labelStyle={[styles.actionButtonLabel, { color: colors.error }]}
                    loading={isLoading}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Resolve Modal */}
      <Modal
        visible={showResolveModal}
        transparent
        animationType="fade"
        onRequestClose={handleResolveCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Resolve Alert</Text>
            <Text style={styles.modalMessage}>
              Add optional notes about the resolution:
            </Text>
            <PaperTextInput
              mode="outlined"
              placeholder="Enter resolution notes (optional)"
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              multiline
              numberOfLines={4}
              style={styles.modalInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={handleResolveCancel}
                mode="outlined"
                style={styles.modalButton}
              />
              <Button
                title="Resolve"
                onPress={handleResolveConfirm}
                mode="contained"
                style={[styles.modalButton, { backgroundColor: colors.success }]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  typeIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  residentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  residentDetails: {
    flex: 1,
  },
  residentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  roomNumber: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  alertInfo: {
    marginBottom: spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alertType: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
  alertCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  vitalDataContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  vitalDataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  vitalDataLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  vitalDataValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    minWidth: 90,
    marginHorizontal: 0,
  },
  actionButtonLabel: {
    fontSize: 12,
    textTransform: 'none',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalInput: {
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalButton: {
    minWidth: 100,
  },
});

export default AlertCard;
