import React, { forwardRef, useState } from 'react';
import {
  TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<TextInput, InputProps>(({
  label, error, hint, containerStyle, leftIcon, rightIcon, ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        focused && styles.inputWrapperFocused,
        !!error && styles.inputWrapperError,
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeft,
            rightIcon && styles.inputWithRight,
          ]}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
});

Input.displayName = 'Input';
export default Input;

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    minHeight: 52,
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  inputWrapperFocused: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: Colors.primary,
    shadowOpacity: 0.14,
  },
  inputWrapperError: {
    borderColor: Colors.accentPink,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    fontWeight: '400',
  },
  inputWithLeft: { paddingLeft: Spacing.sm },
  inputWithRight: { paddingRight: Spacing.sm },
  leftIcon: { paddingLeft: Spacing.base },
  rightIcon: { paddingRight: Spacing.base },
  error: { fontSize: Typography.sm, color: Colors.accentPink, marginLeft: 2 },
  hint: { fontSize: Typography.sm, color: Colors.textMuted, marginLeft: 2 },
});
