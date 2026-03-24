import React, { useState, useRef, forwardRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, Animated, Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Typography, Spacing, Radius } from '../../src/theme';
import { useUniversities } from '../../src/services/queries';
import { useAuthStore } from '../../src/store/auth.store';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  textPrimary:   '#111111',
  textSecondary: '#5F6472',
  textMuted:     '#8A90A2',
  accentBlue:    '#4B50F8',
  accentPurple:  '#8B4DFF',
  accentPink:    '#E655C5',
  white:         '#FFFFFF',
  inputBg:       'rgba(255,255,255,0.62)',
  inputBorder:   'rgba(75,80,248,0.18)',
  glassBorder:   'rgba(255,255,255,0.42)',
  error:         '#E655C5',
};

const BG: [string, string, string]  = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];

type Step = 'email' | 'code' | 'identity' | 'topics' | 'verify';
const STEPS: Step[] = ['email', 'code', 'identity', 'topics'];

// ─── Campus Illustration ───────────────────────────────────────────────────────
function CampusIllustration() {
  return (
    <View style={ill.wrap}>
      <View style={ill.glow} />
      <View style={ill.ringOuter} />
      <View style={ill.ringMid} />
      <View style={ill.coreShadow}>
        <BlurView intensity={50} tint="light" style={ill.core}>
          <View style={ill.buildGrid}>
            {([[6, 12, 6], [10, 8, 10], [6, 12, 6]] as number[][]).map((row, ri) => (
              <View key={ri} style={ill.buildRow}>
                {row.map((h, ci) => (
                  <View key={ci} style={[ill.buildBlock, { height: h }, ri === 1 && ci === 1 && ill.buildBlockCenter]} />
                ))}
              </View>
            ))}
          </View>
        </BlurView>
      </View>
      <View style={[ill.dot, { backgroundColor: 'rgba(75,80,248,0.40)',  top: 24, right: 64 }]} />
      <View style={[ill.dot, { backgroundColor: 'rgba(230,85,197,0.42)', bottom: 30, left: 60 }]} />
      <View style={[ill.dot, { backgroundColor: 'rgba(139,77,255,0.38)', width: 6, height: 6, borderRadius: 3, top: 64, left: 30 }]} />
    </View>
  );
}
const ill = StyleSheet.create({
  wrap:             { height: 210, alignItems: 'center', justifyContent: 'center' },
  glow:             { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(139,77,255,0.13)' },
  ringOuter:        { position: 'absolute', width: 188, height: 188, borderRadius: 94, borderWidth: 1, borderColor: 'rgba(255,255,255,0.52)', backgroundColor: 'rgba(255,255,255,0.07)' },
  ringMid:          { position: 'absolute', width: 144, height: 144, borderRadius: 72, borderWidth: 1, borderColor: 'rgba(199,184,255,0.44)', backgroundColor: 'rgba(255,255,255,0.10)' },
  coreShadow:       { shadowColor: '#8B4DFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.20, shadowRadius: 22, elevation: 8 },
  core:             { width: 88, height: 88, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.58)', alignItems: 'center', justifyContent: 'center' },
  buildGrid:        { gap: 4, alignItems: 'center' },
  buildRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  buildBlock:       { width: 9, borderRadius: 2, backgroundColor: 'rgba(75,80,248,0.20)' },
  buildBlockCenter: { backgroundColor: 'rgba(139,77,255,0.50)' },
  dot:              { position: 'absolute', width: 9, height: 9, borderRadius: 5 },
});

// ─── Verify Emblem ────────────────────────────────────────────────────────────
function VerifyEmblem() {
  return (
    <View style={ve.wrap}>
      <View style={ve.glow} />
      <View style={ve.ringOuter} />
      <View style={ve.ringMid} />
      <View style={ve.coreShadow}>
        <BlurView intensity={55} tint="light" style={ve.core}>
          <View style={ve.envBody}>
            <View style={ve.envTop} />
            <View style={ve.envRow}>
              <View style={ve.envLine} />
              <View style={[ve.envLine, { width: 18 }]} />
            </View>
          </View>
        </BlurView>
      </View>
      <View style={[ve.dot, { backgroundColor: 'rgba(75,80,248,0.38)',  top: 28, right: 56 }]} />
      <View style={[ve.dot, { backgroundColor: 'rgba(230,85,197,0.40)', bottom: 26, left: 54 }]} />
      <View style={[ve.dot, { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(139,77,255,0.36)', top: 58, left: 26 }]} />
    </View>
  );
}
const ve = StyleSheet.create({
  wrap:       { height: 168, alignItems: 'center', justifyContent: 'center' },
  glow:       { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(139,77,255,0.14)' },
  ringOuter:  { position: 'absolute', width: 158, height: 158, borderRadius: 79, borderWidth: 1, borderColor: 'rgba(255,255,255,0.50)', backgroundColor: 'rgba(255,255,255,0.07)' },
  ringMid:    { position: 'absolute', width: 118, height: 118, borderRadius: 59, borderWidth: 1, borderColor: 'rgba(199,184,255,0.44)', backgroundColor: 'rgba(255,255,255,0.10)' },
  coreShadow: { shadowColor: '#8B4DFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 20, elevation: 8 },
  core:       { width: 76, height: 76, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.58)', alignItems: 'center', justifyContent: 'center' },
  envBody:    { gap: 5, alignItems: 'center' },
  envTop:     { width: 34, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(75,80,248,0.35)', backgroundColor: 'rgba(75,80,248,0.08)' },
  envRow:     { flexDirection: 'row', gap: 4 },
  envLine:    { width: 26, height: 3, borderRadius: 2, backgroundColor: 'rgba(75,80,248,0.22)' },
  dot:        { position: 'absolute', width: 9, height: 9, borderRadius: 5 },
});

// ─── OTP Input ────────────────────────────────────────────────────────────────
const CODE_LEN = 6;

interface OtpBoxProps {
  value: string;
  onChangeText: (t: string) => void;
  onKeyPress: (e: any) => void;
  onFocus: () => void;
  onBlur: () => void;
  focused: boolean;
}
const OtpBox = forwardRef<TextInput, OtpBoxProps>(
  ({ value, onChangeText, onKeyPress, onFocus, onBlur, focused }, ref) => (
    <View style={[otp.box, focused && otp.boxFocused, !!value && otp.boxFilled]}>
      <TextInput
        ref={ref}
        style={otp.digit}
        value={value}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        onFocus={onFocus}
        onBlur={onBlur}
        keyboardType="number-pad"
        maxLength={1}
        textAlign="center"
        caretHidden
        selectTextOnFocus
      />
    </View>
  ),
);
OtpBox.displayName = 'OtpBox';

function OtpInput({ digits, onChange }: { digits: string[]; onChange: (d: string[]) => void }) {
  const refs = useRef<(TextInput | null)[]>(new Array(CODE_LEN).fill(null));
  const [focusedIdx, setFocusedIdx] = useState(-1);

  const handleChange = (text: string, i: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = digit;
    onChange(next);
    if (digit && i < CODE_LEN - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyPress = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      onChange(next);
      refs.current[i - 1]?.focus();
    }
  };

  return (
    <View style={otp.row}>
      {Array.from({ length: CODE_LEN }).map((_, i) => (
        <OtpBox
          key={i}
          ref={(r) => { refs.current[i] = r; }}
          value={digits[i] ?? ''}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          onFocus={() => setFocusedIdx(i)}
          onBlur={() => setFocusedIdx(-1)}
          focused={focusedIdx === i}
        />
      ))}
    </View>
  );
}
const otp = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  box: {
    width: 46, height: 58, borderRadius: 16,
    backgroundColor: T.inputBg, borderWidth: 1.5, borderColor: T.inputBorder,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  boxFocused: {
    borderColor: T.accentBlue,
    backgroundColor: 'rgba(255,255,255,0.90)',
    shadowColor: '#8B4DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22, shadowRadius: 14, elevation: 4,
  },
  boxFilled: { borderColor: 'rgba(139,77,255,0.38)', backgroundColor: 'rgba(255,255,255,0.82)' },
  digit: { fontSize: 24, fontWeight: '700', color: T.textPrimary, width: '100%', height: '100%', textAlignVertical: 'center' },
});

// ─── Avatar Grid ──────────────────────────────────────────────────────────────
type AvatarShape = 'circle' | 'ring' | 'diamond' | 'plus' | 'crescent' | 'tri' | 'dot3' | 'bars';
const AVATARS: { id: string; grad: [string, string]; shape: AvatarShape }[] = [
  { id: 'a', grad: ['#4B50F8', '#8B4DFF'], shape: 'circle'   },
  { id: 'b', grad: ['#8B4DFF', '#E655C5'], shape: 'ring'     },
  { id: 'c', grad: ['#6B7CFF', '#4B50F8'], shape: 'diamond'  },
  { id: 'd', grad: ['#E655C5', '#8B4DFF'], shape: 'plus'     },
  { id: 'e', grad: ['#4B50F8', '#6B7CFF'], shape: 'crescent' },
  { id: 'f', grad: ['#C7B8FF', '#8B4DFF'], shape: 'tri'      },
  { id: 'g', grad: ['#8B4DFF', '#4B50F8'], shape: 'dot3'     },
  { id: 'h', grad: ['#E655C5', '#4B50F8'], shape: 'bars'     },
];

function AvatarShapeEl({ shape }: { shape: AvatarShape }) {
  const w = 'rgba(255,255,255,0.88)';
  switch (shape) {
    case 'circle':   return <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: w }} />;
    case 'ring':     return <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 3, borderColor: w, backgroundColor: 'transparent' }} />;
    case 'diamond':  return <View style={{ width: 18, height: 18, borderRadius: 3, backgroundColor: w, transform: [{ rotate: '45deg' }] }} />;
    case 'plus':     return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: w, position: 'absolute' }} />
        <View style={{ width: 6, height: 22, borderRadius: 3, backgroundColor: w }} />
      </View>
    );
    case 'crescent': return (
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: w, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.40)', top: -2, left: 6 }} />
      </View>
    );
    case 'tri':      return (
      <View style={{ width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 22, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: w }} />
    );
    case 'dot3':     return (
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {[1, 1.4, 1].map((scale, i) => (
          <View key={i} style={{ width: 7 * scale, height: 7 * scale, borderRadius: 4, backgroundColor: w }} />
        ))}
      </View>
    );
    case 'bars':     return (
      <View style={{ gap: 4 }}>
        {[22, 16, 10].map((wd, i) => <View key={i} style={{ width: wd, height: 4, borderRadius: 2, backgroundColor: w, opacity: 1 - i * 0.15 }} />)}
      </View>
    );
    default: return null;
  }
}

function AvatarGrid({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <View style={av.grid}>
      {AVATARS.map((a) => {
        const active = selected === a.id;
        return (
          <TouchableOpacity key={a.id} onPress={() => onSelect(a.id)} activeOpacity={0.82}>
            <View style={[av.ring, active && av.ringActive]}>
              <LinearGradient colors={a.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={av.avatar}>
                <AvatarShapeEl shape={a.shape} />
              </LinearGradient>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const av = StyleSheet.create({
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  ring:       { padding: 3, borderRadius: 22, borderWidth: 2, borderColor: 'transparent' },
  ringActive: { borderColor: T.accentBlue, shadowColor: '#4B50F8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.32, shadowRadius: 12, elevation: 6 },
  avatar:     { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

// ─── Topic Chips ──────────────────────────────────────────────────────────────
const TOPICS = [
  { key: 'classes',     label: 'Classes'     },
  { key: 'events',      label: 'Events'      },
  { key: 'market',      label: 'Marketplace' },
  { key: 'housing',     label: 'Housing'     },
  { key: 'food',        label: 'Food'        },
  { key: 'nightlife',   label: 'Nightlife'   },
  { key: 'clubs',       label: 'Clubs'       },
  { key: 'internships', label: 'Internships' },
  { key: 'sports',      label: 'Sports'      },
  { key: 'study',       label: 'Study Help'  },
];

function TopicChips({ selected, onToggle }: { selected: string[]; onToggle: (key: string) => void }) {
  return (
    <View style={tc.grid}>
      {TOPICS.map((t) => {
        const active = selected.includes(t.key);
        return (
          <TouchableOpacity key={t.key} onPress={() => onToggle(t.key)} activeOpacity={0.78}>
            {active ? (
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tc.chip, tc.chipActive]}>
                <Text style={[tc.label, tc.labelActive]}>{t.label}</Text>
              </LinearGradient>
            ) : (
              <View style={tc.chip}>
                <Text style={tc.label}>{t.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const tc = StyleSheet.create({
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip:        { paddingHorizontal: 18, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: T.inputBg, borderWidth: 1.5, borderColor: T.inputBorder },
  chipActive:  { borderWidth: 0, shadowColor: '#4B50F8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.26, shadowRadius: 10, elevation: 5 },
  label:       { fontSize: Typography.base, fontWeight: '600', color: T.textSecondary },
  labelActive: { color: T.white },
});

// ─── Glass Input ───────────────────────────────────────────────────────────────
function GlassInput({
  label, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, autoCapitalize, maxLength, error, hint,
}: {
  label?: string; placeholder?: string; value: string;
  onChangeText: (v: string) => void; secureTextEntry?: boolean;
  keyboardType?: any; autoCapitalize?: any; maxLength?: number;
  error?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={gi.wrapper}>
      {label && <Text style={gi.label}>{label}</Text>}
      <View style={[gi.field, focused && gi.focused, !!error && gi.errored]}>
        <TextInput
          style={gi.input}
          placeholder={placeholder}
          placeholderTextColor={T.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {!!error && <Text style={gi.error}>{error}</Text>}
      {!!hint && !error && <Text style={gi.hint}>{hint}</Text>}
    </View>
  );
}
const gi = StyleSheet.create({
  wrapper: { gap: 6 },
  label:   { fontSize: Typography.sm, fontWeight: '600', color: T.textSecondary, marginLeft: 2 },
  field:   {
    backgroundColor: T.inputBg, borderRadius: Radius.md, borderWidth: 1.5, borderColor: T.inputBorder,
    minHeight: 54, paddingHorizontal: Spacing.base, justifyContent: 'center',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  focused: {
    borderColor: T.accentBlue,
    backgroundColor: 'rgba(255,255,255,0.88)',
    // Focus glow
    shadowColor: '#8B4DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 4,
  },
  errored: { borderColor: T.error },
  input:   { fontSize: Typography.md, color: T.textPrimary, paddingVertical: Spacing.md, fontWeight: '400' },
  error:   { fontSize: Typography.sm, color: T.error, marginLeft: 2 },
  hint:    { fontSize: Typography.sm, color: T.textMuted, marginLeft: 2 },
});

// ─── Gradient CTA Button ───────────────────────────────────────────────────────
function GradientButton({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} disabled={loading} style={[btn.shadow, { marginTop: 4 }]}>
      <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={btn.grad}>
        <Text style={btn.label}>{loading ? 'Please wait\u2026' : label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
const btn = StyleSheet.create({
  shadow: { shadowColor: '#4B50F8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 18, elevation: 8 },
  grad:   { height: 56, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  label:  { fontSize: Typography.md, fontWeight: '700', color: T.white, letterSpacing: 0.3 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { register } = useAuthStore();
  const { data: universities } = useUniversities();

  const [step, setStep]             = useState<Step>('email');
  const [loading, setLoading]       = useState(false);
  const [codeDigits, setCodeDigits] = useState<string[]>(new Array(CODE_LEN).fill(''));
  const [selectedAvatar, setSelectedAvatar] = useState('a');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [form, setForm] = useState({
    email: '', password: '', handle: '',
    universityId: '', universityName: '', universityDomain: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Card entrance animation
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    scaleAnim.setValue(0.97);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1,    duration: 310, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0,    duration: 310, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 310, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [step]);

  const update = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const toggleTopic = (key: string) =>
    setSelectedTopics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const stepIndex = STEPS.indexOf(step as Step);

  const goBack = () => {
    if (step === 'email')    router.back();
    if (step === 'code')     setStep('email');
    if (step === 'identity') setStep('code');
    if (step === 'topics')   setStep('identity');
  };

  const validateEmail = () => {
    const e = form.email.trim();
    if (!e) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Enter a valid email address';
    if (!/\.edu$/i.test(e.split('@')[1] ?? '')) return 'Use your university (.edu) email';
    return '';
  };

  const validatePassword = () => {
    const p = form.password;
    if (!p) return 'Password is required';
    if (p.length < 8) return 'At least 8 characters';
    return '';
  };

  const handleEmailContinue = () => {
    const emailErr = validateEmail();
    const passErr = validatePassword();
    if (emailErr || passErr) {
      setErrors({ email: emailErr, password: passErr });
      return;
    }
    setStep('code');
  };

  const handleCodeVerify = () => {
    if (codeDigits.some((d) => !d)) {
      setErrors({ code: 'Enter the full code' });
      return;
    }
    setErrors({});
    setStep('identity');
  };

  const handleIdentityContinue = () => {
    const h = form.handle.trim();
    if (!h) { setErrors({ handle: 'Pick a nickname' }); return; }
    if (h.length < 3) { setErrors({ handle: 'At least 3 characters' }); return; }
    setErrors({});
    setStep('topics');
  };

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)/feed');
    }, 800);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={s.orbTR} />
      <View style={s.orbBL} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* ── Progress header ── */}
          {step !== 'verify' && (
            <View style={[s.header, { paddingTop: Math.max(insets.top, 0) + 12 }]}>
              <TouchableOpacity onPress={goBack} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="arrow-back" size={18} color={T.textPrimary} />
              </TouchableOpacity>

              <View style={s.progressArea}>
                <Text style={s.stepLabel}>Step {stepIndex + 1} of {STEPS.length}</Text>
                <View style={s.progressBar}>
                  {STEPS.map((st, i) => (
                    <View key={st} style={[s.progressSegment, i <= stepIndex ? s.progressFilled : s.progressEmpty]} />
                  ))}
                </View>
              </View>

              <View style={{ width: 36 }} />
            </View>
          )}

          <ScrollView
            contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Animated card wrapper ── */}
            <Animated.View style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            }}>

              {/* ── STEP 1: Email ─────────────────────────────────────────── */}
              {step === 'email' && (
                <View style={s.page}>
                  <CampusIllustration />
                  <BlurView intensity={55} tint="light" style={s.card}>
                    <Text style={s.headline}>Join your{'\n'}campus circle</Text>
                    <Text style={s.subtext}>
                      Sign up using your university email to access your school community.
                    </Text>
                    <View style={{ gap: Spacing.md }}>
                      <View style={{ gap: Spacing.xs }}>
                        <GlassInput
                          placeholder="Enter your school email"
                          value={form.email}
                          onChangeText={(v) => update('email', v)}
                          keyboardType="email-address"
                          error={errors.email}
                        />
                        {!errors.email && (
                          <View style={s.hintRow}>
                            <Ionicons name="shield-checkmark-outline" size={12} color={T.accentBlue} />
                            <Text style={s.helperText}>We verify your .edu email to keep the community campus-only.</Text>
                          </View>
                        )}
                      </View>
                      <GlassInput
                        placeholder="Create a password"
                        value={form.password}
                        onChangeText={(v) => update('password', v)}
                        secureTextEntry
                        error={errors.password}
                        hint="Min 8 characters"
                      />
                    </View>
                    <GradientButton label="Continue" onPress={handleEmailContinue} />
                  </BlurView>

                  <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={s.signInRow}>
                    <Text style={s.signInHint}>
                      Already have an account?{'  '}<Text style={s.signInLink}>Sign in</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── STEP 2: Code ──────────────────────────────────────────── */}
              {step === 'code' && (
                <View style={s.page}>
                  <VerifyEmblem />
                  <BlurView intensity={55} tint="light" style={s.card}>
                    <Text style={s.headline}>Verify your{'\n'}email</Text>
                    <Text style={s.subtext}>
                      We've sent a {CODE_LEN}-digit code to your inbox.
                    </Text>
                    <OtpInput digits={codeDigits} onChange={(d) => { setCodeDigits(d); setErrors((p) => ({ ...p, code: '' })); }} />
                    {!!errors.code && <Text style={{ fontSize: Typography.sm, color: T.error, textAlign: 'center' }}>{errors.code}</Text>}
                    <TouchableOpacity style={s.resendRow}>
                      <Text style={s.helperText}>
                        Didn't receive a code?{'  '}<Text style={s.resendLink}>Resend</Text>
                      </Text>
                    </TouchableOpacity>
                    <GradientButton label="Verify" onPress={handleCodeVerify} />
                  </BlurView>
                </View>
              )}

              {/* ── STEP 3: Identity ──────────────────────────────────────── */}
              {step === 'identity' && (
                <View style={s.page}>
                  <View style={s.idOrb1} />
                  <View style={s.idOrb2} />
                  <BlurView intensity={55} tint="light" style={s.card}>
                    <Text style={s.headline}>Create your{'\n'}anonymous identity</Text>
                    <Text style={s.subtext}>Choose how you will be displayed.</Text>
                    <AvatarGrid selected={selectedAvatar} onSelect={setSelectedAvatar} />
                    <View style={{ gap: Spacing.xs }}>
                      <GlassInput
                        placeholder="Choose a nickname"
                        value={form.handle}
                        onChangeText={(v) => update('handle', v.trim())}
                        maxLength={25}
                        error={errors.handle}
                      />
                      {!errors.handle && <Text style={s.helperText}>You can change this later.</Text>}
                    </View>
                    <GradientButton label="Continue" onPress={handleIdentityContinue} />
                  </BlurView>
                </View>
              )}

              {/* ── STEP 4: Topics ────────────────────────────────────────── */}
              {step === 'topics' && (
                <View style={s.topicsPage}>
                  <View style={s.stepHead}>
                    <Text style={s.headline}>What do you{'\n'}want to see?</Text>
                    <Text style={s.subtext}>Choose topics to personalize your campus feed.</Text>
                  </View>
                  {/* Profile preview */}
                  <View style={s.previewRow}>
                    {(() => {
                      const a = AVATARS.find((x) => x.id === selectedAvatar) ?? AVATARS[0];
                      return (
                        <LinearGradient colors={a.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.previewAvatar}>
                          <AvatarShapeEl shape={a.shape} />
                        </LinearGradient>
                      );
                    })()}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={s.previewName}>{form.handle || 'Your nickname'}</Text>
                      <Text style={s.previewSub}>{form.email}</Text>
                    </View>
                  </View>

                  <BlurView intensity={55} tint="light" style={s.card}>
                    <TopicChips selected={selectedTopics} onToggle={toggleTopic} />
                    <Text style={[s.helperText, { textAlign: 'center' }]}>
                      {selectedTopics.length === 0
                        ? 'Pick at least one topic to get started.'
                        : `${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''} selected \u2014 you can change this anytime.`}
                    </Text>
                    <GradientButton label="Finish Setup" onPress={handleFinish} loading={loading} />
                  </BlurView>
                </View>
              )}

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1 },
  orbTR: { position: 'absolute', width: 240, height: 240, top: -70, right: -70, borderRadius: 9999, backgroundColor: '#F3D6E9', opacity: 0.50 },
  orbBL: { position: 'absolute', width: 200, height: 200, bottom: -50, left: -50, borderRadius: 9999, backgroundColor: '#C7B8FF', opacity: 0.38 },

  // Identity floating orbs
  idOrb1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, top: 20, right: -20, backgroundColor: 'rgba(139,77,255,0.10)' },
  idOrb2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, top: 80, left: -10, backgroundColor: 'rgba(75,80,248,0.08)' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 12, gap: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.90)',
  },
  progressArea:    { flex: 1, gap: 6 },
  stepLabel:       { fontSize: Typography.sm, fontWeight: '600', color: T.textMuted, letterSpacing: 0.2 },
  progressBar:     { flexDirection: 'row', gap: Spacing.sm },
  progressSegment: { flex: 1, height: 4, borderRadius: Radius.full },
  progressFilled:  { backgroundColor: T.accentBlue },
  progressEmpty:   { backgroundColor: 'rgba(75,80,248,0.18)' },

  // Scroll
  scroll: { paddingHorizontal: 24, paddingTop: 32, gap: Spacing.lg },

  // Page containers
  page:       { gap: Spacing.lg },
  topicsPage: { gap: Spacing.xl },
  stepHead:   { gap: Spacing.sm },

  // Glass card
  card: {
    borderRadius: 28, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)',
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28,
    gap: Spacing.lg,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.10, shadowRadius: 32, elevation: 8,
  },

  // Typography
  headline:   { fontSize: 30, fontWeight: '800', color: '#111111', letterSpacing: -0.5, lineHeight: 36 },
  subtext:    { fontSize: Typography.base, color: '#5F6472', lineHeight: Typography.base * 1.65, fontWeight: '400' },
  helperText: { fontSize: Typography.sm, color: '#8A90A2', marginLeft: 2 },
  hintRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 2 },

  // Resend
  resendRow:  { alignItems: 'center' },
  resendLink: { color: '#4B50F8', fontWeight: '600', fontSize: Typography.sm },

  // Sign-in footer
  signInRow:  { alignItems: 'center', paddingVertical: Spacing.xs },
  signInHint: { fontSize: 14, color: '#8A90A2', textAlign: 'center' },
  signInLink: { color: '#4B50F8', fontWeight: '600' },

  // Profile preview
  previewRow:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 4 },
  previewAvatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  previewName:   { fontSize: 15, fontWeight: '700', color: '#111111' },
  previewSub:    { fontSize: 12, color: '#8A90A2' },
});
