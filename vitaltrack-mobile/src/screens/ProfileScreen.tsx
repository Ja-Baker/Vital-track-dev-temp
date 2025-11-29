import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout, changePassword, clearError } from '../store/slices/authSlice';
import { setThemeMode, ThemeMode } from '../store/slices/themeSlice';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';
import { formatRole, formatInitials, formatPhoneNumber } from '../utils/formatters';
import Button from '../components/common/Button';
import TextInput from '../components/common/TextInput';
import Badge from '../components/common/Badge';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, facility, isLoading } = useAppSelector((state) => state.auth);
  const { mode: themeMode, isDark } = useAppSelector((state) => state.theme);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  // Handle change password
  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap();

      // Success
      Alert.alert(
        'Success',
        'Your password has been changed successfully',
        [{ text: 'OK', onPress: () => handleCloseChangePassword() }]
      );
    } catch (error: any) {
      setPasswordError(error || 'Failed to change password');
    }
  };

  const handleCloseChangePassword = () => {
    setShowChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    dispatch(clearError());
  };

  const handleThemeChange = (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
    setShowThemeModal(false);
  };

  const getThemeLabel = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System Default';
    }
  };

  const getThemeIcon = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return 'white-balance-sunny';
      case 'dark':
        return 'moon-waning-crescent';
      case 'system':
        return 'theme-light-dark';
    }
  };

  if (!user || !facility) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  const userInitials = formatInitials(user.firstName, user.lastName);
  const userFullName = `${user.firstName} ${user.lastName}`;
  const userRole = formatRole(user.role);

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={[styles.card, shadows.small]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{userFullName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadgeContainer}>
            <Badge text={userRole} type="primary" size="medium" />
          </View>
          {user.phoneNumber && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="phone"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.infoText}>
                {formatPhoneNumber(user.phoneNumber)}
              </Text>
            </View>
          )}
          {user.lastLoginAt && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.infoText}>
                Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Facility Info Card */}
        <View style={[styles.card, shadows.small]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="hospital-building"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Facility Information</Text>
          </View>

          <View style={styles.facilityInfoContainer}>
            <View style={styles.facilityInfoRow}>
              <Text style={styles.facilityLabel}>Name:</Text>
              <Text style={styles.facilityValue}>{facility.name}</Text>
            </View>
            <View style={styles.facilityInfoRow}>
              <Text style={styles.facilityLabel}>Code:</Text>
              <Text style={styles.facilityValue}>{facility.facilityCode}</Text>
            </View>
            <View style={styles.facilityInfoRow}>
              <Text style={styles.facilityLabel}>Address:</Text>
              <Text style={styles.facilityValue}>
                {facility.address}
                {'\n'}
                {facility.city}, {facility.state} {facility.zipCode}
              </Text>
            </View>
            <View style={styles.facilityInfoRow}>
              <Text style={styles.facilityLabel}>Phone:</Text>
              <Text style={styles.facilityValue}>
                {formatPhoneNumber(facility.phoneNumber)}
              </Text>
            </View>
            <View style={styles.facilityInfoRow}>
              <Text style={styles.facilityLabel}>Email:</Text>
              <Text style={styles.facilityValue}>{facility.email}</Text>
            </View>
          </View>
        </View>

        {/* Settings Card */}
        <View style={[styles.card, shadows.small]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="cog"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowChangePassword(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Change Password"
            accessibilityHint="Opens change password form"
          >
            <View style={styles.settingItemLeft}>
              <MaterialCommunityIcons
                name="lock-reset"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingItemText}>Change Password</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowThemeModal(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Theme: ${getThemeLabel(themeMode)}`}
            accessibilityHint="Opens theme selection"
          >
            <View style={styles.settingItemLeft}>
              <MaterialCommunityIcons
                name={getThemeIcon(themeMode)}
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingItemText}>Theme</Text>
            </View>
            <View style={styles.themeValueContainer}>
              <Text style={styles.versionText}>{getThemeLabel(themeMode)}</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingItemText}>App Version</Text>
            </View>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Logout"
            onPress={handleLogout}
            mode="outlined"
            icon="logout"
            style={styles.logoutButton}
            loading={isLoading}
          />
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        transparent
        animationType="slide"
        onRequestClose={handleCloseChangePassword}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={handleCloseChangePassword}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                label="Current Password"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  setPasswordError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                style={styles.modalInput}
              />

              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setPasswordError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                style={styles.modalInput}
              />

              <TextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setPasswordError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                style={styles.modalInput}
                error={!!passwordError}
                errorText={passwordError}
              />

              <Text style={styles.passwordHint}>
                Password must be at least 8 characters long
              </Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={handleCloseChangePassword}
                mode="outlined"
                style={styles.modalButton}
              />
              <Button
                title="Change Password"
                onPress={handleChangePassword}
                mode="contained"
                style={styles.modalButton}
                loading={isLoading}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
        accessibilityViewIsModal={true}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}
        >
          <View style={styles.themeModalContent}>
            <Text style={styles.themeModalTitle} accessibilityRole="header">Select Theme</Text>

            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={styles.themeOption}
                onPress={() => handleThemeChange(mode)}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ checked: themeMode === mode }}
                accessibilityLabel={getThemeLabel(mode)}
              >
                <View style={styles.themeOptionLeft}>
                  <MaterialCommunityIcons
                    name={getThemeIcon(mode)}
                    size={24}
                    color={themeMode === mode ? colors.primary : colors.text}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      themeMode === mode && styles.themeOptionTextActive,
                    ]}
                  >
                    {getThemeLabel(mode)}
                  </Text>
                </View>
                {themeMode === mode && (
                  <MaterialCommunityIcons
                    name="check"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  roleBadgeContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  facilityInfoContainer: {
    gap: spacing.md,
  },
  facilityInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  facilityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 80,
  },
  facilityValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: spacing.md,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  logoutButton: {
    borderColor: colors.error,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalInput: {
    marginBottom: spacing.md,
  },
  passwordHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalButton: {
    minWidth: 120,
  },
  themeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    maxWidth: 400,
    width: '90%',
    alignSelf: 'center',
  },
  themeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: spacing.md,
  },
  themeOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ProfileScreen;
