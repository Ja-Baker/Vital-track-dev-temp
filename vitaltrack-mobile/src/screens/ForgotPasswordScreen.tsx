import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { forgotPassword, clearError } from '../store/slices/authSlice';
import { AuthScreenProps } from '../navigation/types';
import TextInput from '../components/common/TextInput';
import Button from '../components/common/Button';
import { isValidEmail, isValidFacilityCode } from '../utils/validators';
import { colors, spacing, typography } from '../theme/theme';

type Props = AuthScreenProps<'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [facilityCode, setFacilityCode] = useState('');
  const [success, setSuccess] = useState(false);

  const [errors, setErrors] = useState({
    email: '',
    facilityCode: '',
  });

  // Clear Redux error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = (): boolean => {
    const newErrors = {
      email: '',
      facilityCode: '',
    };

    let isValid = true;

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Invalid email address';
      isValid = false;
    }

    // Facility code validation
    if (!facilityCode.trim()) {
      newErrors.facilityCode = 'Facility code is required';
      isValid = false;
    } else if (!isValidFacilityCode(facilityCode)) {
      newErrors.facilityCode = 'Invalid facility code (4-10 alphanumeric characters)';
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
        forgotPassword({
          email: email.trim(),
          facilityCode: facilityCode.trim().toUpperCase(),
        })
      ).unwrap();

      setSuccess(true);
    } catch (err) {
      console.error('Forgot password failed:', err);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
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

            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successMessage}>
              We've sent password reset instructions to{' '}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Next Steps:</Text>
              <View style={styles.instructionItem}>
                <MaterialCommunityIcons
                  name="numeric-1-circle"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.instructionText}>
                  Check your email inbox
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <MaterialCommunityIcons
                  name="numeric-2-circle"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.instructionText}>
                  Click the reset password link
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <MaterialCommunityIcons
                  name="numeric-3-circle"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.instructionText}>
                  Create a new password
                </Text>
              </View>
            </View>

            <Text style={styles.noteText}>
              Didn't receive the email? Check your spam folder or try again.
            </Text>

            <Button
              title="Back to Login"
              onPress={handleBackToLogin}
              fullWidth
              style={styles.button}
            />

            <TouchableOpacity
              onPress={() => setSuccess(false)}
              style={styles.resendContainer}
            >
              <Text style={styles.resendText}>Try Again</Text>
            </TouchableOpacity>
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
              name="lock-reset"
              size={60}
              color={colors.primary}
            />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.description}>
            No worries! Enter your email and facility code, and we'll send you
            instructions to reset your password.
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

          {/* Email Input */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors({ ...errors, email: '' });
            }}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="email"
            error={errors.email}
            testID="email-input"
          />

          {/* Facility Code Input */}
          <TextInput
            label="Facility Code"
            value={facilityCode}
            onChangeText={(text) => {
              setFacilityCode(text.toUpperCase());
              setErrors({ ...errors, facilityCode: '' });
            }}
            placeholder="Enter facility code"
            autoCapitalize="characters"
            autoCorrect={false}
            icon="office-building"
            error={errors.facilityCode}
            testID="facility-code-input"
          />

          {/* Submit Button */}
          <Button
            title="Send Reset Link"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            style={styles.button}
            testID="submit-button"
          />

          {/* Back to Login Link */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Remember your password? </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  button: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  // Success state styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl,
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
  emailText: {
    fontWeight: '600',
    color: colors.primary,
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: spacing.md,
    flex: 1,
  },
  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  resendContainer: {
    marginTop: spacing.md,
  },
  resendText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;
