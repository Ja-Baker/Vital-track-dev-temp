import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { resetPassword, clearError } from '../store/slices/authSlice';
import { AuthScreenProps } from '../navigation/types';
import TextInput from '../components/common/TextInput';
import Button from '../components/common/Button';
import { isValidPassword, getPasswordStrength } from '../utils/validators';
import { colors, spacing, typography } from '../theme/theme';

type Props = AuthScreenProps<'ResetPassword'>;

const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { token } = route.params;
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    strength: 'weak' | 'medium' | 'strong';
    score: number;
    feedback: string[];
  } | null>(null);

  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  // Clear Redux error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Update password strength on password change
  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  const validateForm = (): boolean => {
    const newErrors = {
      password: '',
      confirmPassword: '',
    };

    let isValid = true;

    // Password validation
    if (!password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!isValidPassword(password)) {
      newErrors.password =
        'Password must be at least 8 characters with uppercase, lowercase, and number';
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(
        resetPassword({
          token,
          newPassword: password,
        })
      ).unwrap();

      setSuccess(true);
    } catch (err) {
      console.error('Reset password failed:', err);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const getStrengthColor = (): string => {
    if (!passwordStrength) return colors.border;
    switch (passwordStrength.strength) {
      case 'weak':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'strong':
        return colors.success;
      default:
        return colors.border;
    }
  };

  const getStrengthProgress = (): number => {
    if (!passwordStrength) return 0;
    return passwordStrength.score / 5;
  };

  if (success) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon */}
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <MaterialCommunityIcons
                name="check-circle"
                size={80}
                color={colors.success}
              />
            </View>

            <Text style={styles.successTitle}>Password Reset!</Text>
            <Text style={styles.successMessage}>
              Your password has been successfully reset. You can now sign in with
              your new password.
            </Text>

            <Button
              title="Sign In"
              onPress={handleBackToLogin}
              fullWidth
              style={styles.button}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="shield-lock"
              size={60}
              color={colors.primary}
            />
          </View>
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.description}>
            Your new password must be different from your previous password and meet
            all security requirements.
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* New Password Input */}
          <TextInput
            label="New Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors({ ...errors, password: '' });
            }}
            placeholder="Enter new password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            icon="lock"
            error={errors.password}
            testID="password-input"
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && passwordStrength && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthHeader}>
                <Text style={styles.strengthLabel}>Password Strength:</Text>
                <Text
                  style={[
                    styles.strengthValue,
                    { color: getStrengthColor() },
                  ]}
                >
                  {passwordStrength.strength.toUpperCase()}
                </Text>
              </View>
              <ProgressBar
                progress={getStrengthProgress()}
                color={getStrengthColor()}
                style={styles.strengthBar}
              />
              {passwordStrength.feedback.length > 0 && (
                <View style={styles.feedbackContainer}>
                  {passwordStrength.feedback.map((item, index) => (
                    <View key={index} style={styles.feedbackItem}>
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={16}
                        color={colors.error}
                      />
                      <Text style={styles.feedbackText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Confirm Password Input */}
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors({ ...errors, confirmPassword: '' });
            }}
            placeholder="Confirm new password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            icon="lock-check"
            error={errors.confirmPassword}
            testID="confirm-password-input"
          />

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={password.length >= 8 ? 'check-circle' : 'circle-outline'}
                size={16}
                color={password.length >= 8 ? colors.success : colors.textSecondary}
              />
              <Text style={styles.requirementText}>At least 8 characters</Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={/[a-z]/.test(password) ? 'check-circle' : 'circle-outline'}
                size={16}
                color={/[a-z]/.test(password) ? colors.success : colors.textSecondary}
              />
              <Text style={styles.requirementText}>One lowercase letter</Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={/[A-Z]/.test(password) ? 'check-circle' : 'circle-outline'}
                size={16}
                color={/[A-Z]/.test(password) ? colors.success : colors.textSecondary}
              />
              <Text style={styles.requirementText}>One uppercase letter</Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={/\d/.test(password) ? 'check-circle' : 'circle-outline'}
                size={16}
                color={/\d/.test(password) ? colors.success : colors.textSecondary}
              />
              <Text style={styles.requirementText}>One number</Text>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title="Reset Password"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            style={styles.button}
            testID="submit-button"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  strengthContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  strengthLabel: {
    fontSize: 14,
    color: colors.text,
  },
  strengthValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  strengthBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: spacing.sm,
  },
  feedbackContainer: {
    marginTop: spacing.sm,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  feedbackText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  requirementsContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requirementText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
  },
  // Success state styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
  },
  successIconContainer: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successMessage: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
});

export default ResetPasswordScreen;
