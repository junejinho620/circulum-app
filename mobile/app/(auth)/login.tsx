import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as SecureStore from 'expo-secure-store';
import { Typography, Spacing, Radius } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth.store';

const REMEMBERED_EMAIL_KEY = 'circulum_remembered_email';

const C = {
  textPrimary:   '#111111',
  textSecondary: '#5F6472',
  textMuted:     '#8A90A2',
  accentBlue:    '#4B50F8',
  accentPurple:  '#8B4DFF',
  accentPink:    '#E655C5',
  white:         '#FFFFFF',
  inputBg:       'rgba(255,255,255,0.62)',
  inputBorder:   'rgba(75,80,248,0.18)',
  inputBorderFocus: 'rgba(75,80,248,0.55)',
  glassBorder:   'rgba(255,255,255,0.42)',
  error:         '#E655C5',
  // aliases used in JSX below
  get violet()     { return this.accentBlue; },
  get violetDark() { return this.accentBlue; },
  get violetGlow() { return this.accentPurple; },
  get textDark()   { return this.textPrimary; },
  get textMid()    { return this.textSecondary; },
  get textLight()  { return this.textMuted; },
};

function GlassInput({
  label, placeholder, value, onChangeText, secureTextEntry, keyboardType, error,
}: {
  label: string; placeholder?: string; value: string; onChangeText: (v: string) => void;
  secureTextEntry?: boolean; keyboardType?: any; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={iStyles.label}>{label}</Text>
      <View style={[iStyles.field, focused && iStyles.focused, !!error && iStyles.errored]}>
        <TextInput
          style={iStyles.input}
          placeholder={placeholder}
          placeholderTextColor={C.textLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {!!error && <Text style={iStyles.error}>{error}</Text>}
    </View>
  );
}

const iStyles = StyleSheet.create({
  label: { fontSize: Typography.sm, fontWeight: '600', color: C.textMid, marginLeft: 2 },
  field: {
    backgroundColor: C.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  focused: {
    borderColor: C.violetDark,
    backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#8B4DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  errored: { borderColor: C.error },
  input: { fontSize: Typography.base, color: C.textDark },
  error: { fontSize: Typography.xs, color: C.error, marginLeft: 2 },
});

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  // Load remembered email on mount
  useEffect(() => {
    SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY).then((saved) => {
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    });
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 310, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 310, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 310, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await login(email.trim(), password);

      // Save or clear remembered email
      if (rememberMe) {
        await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, email.trim());
      } else {
        await SecureStore.deleteItemAsync(REMEMBERED_EMAIL_KEY);
      }

      router.replace('/(tabs)/feed');
    } catch (err: any) {
      const msg = err?.message || 'Login failed';
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#F4CBD9', '#E9E1F6', '#D7E6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Back button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
              <Ionicons name="arrow-back" size={18} color={C.textDark} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            {/* App mark */}
            <View style={styles.logoArea}>
              <View style={styles.logoShadow}>
                <BlurView intensity={70} tint="light" style={styles.logoGlass}>
                  <View style={styles.logoRingOuter} />
                  <View style={styles.logoCircleBlue} />
                  <View style={styles.logoCirclePurple} />
                  <View style={styles.logoCirclePink} />
                  <View style={styles.logoDot} />
                </BlurView>
              </View>
            </View>

            <View style={styles.titleArea}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to your anonymous campus account</Text>
            </View>

            {/* Glass form card */}
            <BlurView intensity={55} tint="light" style={styles.formCard}>
              <GlassInput
                label="University Email"
                placeholder="you@university.edu"
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: '' })); }}
                keyboardType="email-address"
                error={errors.email}
              />
              <GlassInput
                label="Password"
                placeholder="Your password"
                value={password}
                onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: '' })); }}
                secureTextEntry
                error={errors.password}
              />

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                  style={styles.rememberRow}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
                style={styles.ctaShadow}
              >
                <LinearGradient
                  colors={['#4B50F8', '#8B4DFF', '#E655C5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaButton}
                >
                  <Text style={styles.ctaText}>
                    {loading ? 'Signing in…' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                <Text style={styles.footerLink}>Create one</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 9999 },
  orbTop: { width: 240, height: 240, top: -70, right: -70, backgroundColor: '#F3D6E9', opacity: 0.50 },
  orbBottom: { width: 200, height: 200, bottom: -50, left: -50, backgroundColor: '#C7B8FF', opacity: 0.38 },

  header: { padding: Spacing.xl, paddingBottom: 0 },
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
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  logoArea: { alignItems: 'center' },
  logoShadow: {
    shadowColor: '#8B4DFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
  logoGlass: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRingOuter: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(75,80,248,0.16)',
  },
  logoCircleBlue: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(75,80,248,0.12)',
    top: 9,
    left: 9,
  },
  logoCirclePurple: {
    position: 'absolute',
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: 'rgba(139,77,255,0.14)',
    bottom: 10,
    right: 10,
  },
  logoCirclePink: {
    position: 'absolute',
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: 'rgba(230,85,197,0.16)',
    top: 10,
    right: 13,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(75,80,248,0.42)',
  },

  titleArea: { gap: Spacing.sm },
  title: {
    fontSize: Typography.xxxl,
    fontWeight: '800',
    color: C.textDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.base,
    color: C.textMid,
    lineHeight: Typography.base * 1.6,
  },

  formCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    padding: Spacing.xl,
    gap: Spacing.lg,
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(75,80,248,0.25)',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: C.accentPurple,
    borderColor: C.accentPurple,
  },
  rememberText: {
    fontSize: Typography.sm,
    color: C.textMid,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: Typography.sm,
    color: C.violet,
    fontWeight: '600',
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
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { fontSize: Typography.sm, color: C.textLight },
  footerLink: { fontSize: Typography.sm, color: C.violet, fontWeight: '600' },
});
