import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Typography, Spacing } from '../../theme';

interface Props {
  size?: 'small' | 'large';
  message?: string;
  fullscreen?: boolean;
}

export default function LoadingSpinner({ size = 'large', message, fullscreen }: Props) {
  if (fullscreen) {
    return (
      <LinearGradient
        colors={Gradients.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.fullscreen}
      >
        <ActivityIndicator size={size} color={Colors.primary} />
        {message && <Text style={styles.message}>{message}</Text>}
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: Typography.md,
    fontWeight: '500',
  },
});
