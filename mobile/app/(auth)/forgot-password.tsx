import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  textPrimary:   '#111111',
  textSecondary: '#5F6472',
  textMuted:     '#8A90A2',
  accentBlue:    '#4B50F8',
  accentPurple:  '#8B4DFF',
  accentPink:    '#E655C5',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#F4CBD9', '#E9E1F6', '#D7E6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Back button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
              <Ionicons name="arrow-back" size={18} color={C.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.titleArea}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your university email and we'll send you a reset link.
              </Text>
            </View>

            {/* Glass card */}
            <View style={styles.glassCard}>
              {!sent ? (
                <>
                  {/* Email input */}
                  <View style={{ gap: 6 }}>
                    <Text style={styles.label}>University Email</Text>
                    <View style={[styles.field, focused && styles.fieldFocused]}>
                      <TextInput
                        style={styles.input}
                        placeholder="you@university.edu"
                        placeholderTextColor={C.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                      />
                    </View>
                  </View>

                  {/* Submit button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                    style={styles.ctaShadow}
                  >
                    <LinearGradient
                      colors={['#4B50F8', '#8B4DFF', '#E655C5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.ctaButton}
                    >
                      <Text style={styles.ctaText}>Send Reset Link</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Success state */}
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={48} color={C.accentBlue} />
                  </View>
                  <Text style={styles.successText}>
                    Check your inbox! We've sent a reset link to your email.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.85}
                    style={styles.ctaShadow}
                  >
                    <LinearGradient
                      colors={['#4B50F8', '#8B4DFF', '#E655C5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.ctaButton}
                    >
                      <Text style={styles.ctaText}>Back to Login</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { padding: 24, paddingBottom: 0 },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 24,
  },

  titleArea: { gap: 8 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: C.textSecondary,
    lineHeight: 25,
  },

  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    padding: 24,
    gap: 20,
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
    marginLeft: 2,
  },
  field: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(75,80,248,0.18)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldFocused: {
    borderColor: C.accentBlue,
    backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#8B4DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  input: {
    fontSize: 16,
    color: C.textPrimary,
  },

  ctaShadow: {
    shadowColor: '#4B50F8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButton: {
    height: 56,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  successIcon: {
    alignItems: 'center',
    paddingTop: 4,
  },
  successText: {
    fontSize: 16,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 25,
  },
});
