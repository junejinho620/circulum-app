import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Typography, Spacing, Radius, Shadow } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export default function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, style, fullWidth,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const height = size === 'lg' ? 56 : size === 'md' ? 48 : 36;
  const fontSize = size === 'lg' ? Typography.lg : size === 'md' ? Typography.md : Typography.base;
  const px = size === 'lg' ? Spacing.xl : size === 'md' ? Spacing.lg : Spacing.md;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.87}
        style={[
          styles.shadowWrap,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, { height, paddingHorizontal: px }]}
        >
          {loading
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Text style={[styles.textBase, styles.textPrimary, { fontSize }]}>{title}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[`variant_${variant}`],
        { height, paddingHorizontal: px },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={Colors.primary} />
        : <Text style={[styles.textBase, styles[`text_${variant}`], { fontSize }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },

  shadowWrap: {
    borderRadius: Radius.full,
    ...Shadow.md,
    shadowColor: '#4B50F8',
    shadowOpacity: 0.28,
  },

  variant_secondary: {
    backgroundColor: Colors.surfaceGlassStrong,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    ...Shadow.sm,
  },
  variant_ghost: {
    backgroundColor: Colors.transparent,
  },
  variant_danger: {
    backgroundColor: Colors.accentPink,
    ...Shadow.sm,
  },

  textBase: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textPrimary: { color: Colors.white },
  text_secondary: { color: Colors.textPrimary },
  text_ghost: { color: Colors.primary },
  text_danger: { color: Colors.white },
});
