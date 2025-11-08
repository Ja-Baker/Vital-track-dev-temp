import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  editable?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  icon?: string;
  iconRight?: string;
  onIconPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  editable = true,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  icon,
  iconRight,
  onIconPress,
  style,
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const rightIcon = secureTextEntry
    ? showPassword
      ? 'eye-off'
      : 'eye'
    : iconRight;

  const handleRightIconPress = secureTextEntry
    ? handleTogglePassword
    : onIconPress;

  return (
    <View style={[styles.container, style]}>
      <PaperTextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable && !disabled}
        disabled={disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        mode="outlined"
        error={!!error}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        left={icon ? <PaperTextInput.Icon icon={icon} /> : undefined}
        right={
          rightIcon ? (
            <PaperTextInput.Icon
              icon={rightIcon}
              onPress={handleRightIconPress}
            />
          ) : undefined
        }
        style={styles.input}
        outlineStyle={[
          styles.outline,
          isFocused && styles.outlineFocused,
          error && styles.outlineError,
        ]}
        testID={testID}
      />
      {error && (
        <HelperText type="error" visible={!!error} style={styles.helperText}>
          {error}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  outline: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  outlineError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  helperText: {
    fontSize: 12,
    marginTop: -spacing.xs,
  },
});

export default TextInput;
