import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, clearError } from '../store/slices/authSlice';
import { AuthScreenProps } from '../navigation/types';
import TextInput from '../components/common/TextInput';
import Button from '../components/common/Button';
import { isValidEmail, isValidFacilityCode } from '../utils/validators';
import { colors, spacing, typography } from '../theme/theme';

type Props = AuthScreenProps<'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [facilityCode, setFacilityCode] = useState('');

  const [errors, setErrors] = useState({
    email: '',
    password: '',
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
      password: '',
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

    // Password validation
    if (!password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(
        login({
          email: email.trim(),
          password,
          facilityCode: facilityCode.trim().toUpperCase(),
        })
      ).unwrap();
      // Navigation handled automatically by RootNavigator based on auth state
    } catch (err) {
      // Error displayed from Redux state
      console.error('Login failed:', err);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

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
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>VitalTrack</Text>
          </View>
          <Text style={styles.subtitle}>Senior Living Health Monitoring</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.description}>
            Sign in to access your facility dashboard
          </Text>

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

          {/* Password Input */}
          <TextInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors({ ...errors, password: '' });
            }}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            icon="lock"
            error={errors.password}
            testID="password-input"
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

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            style={styles.loginButton}
            testID="login-button"
          />

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <Divider style={styles.divider} />
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Don't have access? Contact your facility administrator.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>VitalTrack v1.0.0</Text>
          <Text style={styles.footerText}>© 2025 All rights reserved</Text>
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
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
  },
  helpContainer: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
});

export default LoginScreen;
