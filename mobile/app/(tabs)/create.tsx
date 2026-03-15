import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  textPrimary:   '#111111',
  textSecondary: '#5F6472',
  textMuted:     '#8A90A2',
  accentBlue:    '#4B50F8',
  accentPurple:  '#8B4DFF',
  accentPink:    '#E655C5',
  white:         '#FFFFFF',
};

const BG:  [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];
const PUB: [string, string, string] = ['#3DAB73', '#2BC77A', '#1EB589'];

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'study',       label: 'Study',       icon: 'book-outline',            color: '#4B50F8' },
  { key: 'events',      label: 'Events',      icon: 'calendar-outline',        color: '#8B4DFF' },
  { key: 'free-stuff',  label: 'Free Stuff',  icon: 'gift-outline',            color: '#E655C5' },
  { key: 'confessions', label: 'Confessions', icon: 'eye-off-outline',         color: '#C47EFF' },
  { key: 'gigs',        label: 'Gigs',        icon: 'cash-outline',            color: '#3DAB73' },
  { key: 'lost-found',  label: 'Lost & Found',icon: 'search-outline',          color: '#F1973B' },
  { key: 'housing',     label: 'Housing',     icon: 'home-outline',            color: '#6B7CFF' },
  { key: 'social',      label: 'Social',      icon: 'people-outline',          color: '#4D97FF' },
];

// ─── Audiences ────────────────────────────────────────────────────────────────
const AUDIENCES = [
  { key: 'all',         label: 'All students',       icon: 'earth-outline' },
  { key: 'course',      label: 'My courses',         icon: 'school-outline' },
  { key: 'community',   label: 'Specific board',     icon: 'chatbubbles-outline' },
];

// ─── Avatar circle ────────────────────────────────────────────────────────────
function AvatarCircle({ grad, size = 42 }: { grad: [string, string]; size?: number }) {
  return (
    <LinearGradient
      colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{
        width: size * 0.4, height: size * 0.4,
        borderRadius: (size * 0.4) / 2,
        backgroundColor: 'rgba(255,255,255,0.30)',
      }} />
    </LinearGradient>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CreatePostScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('study');
  const [audience, setAudience] = useState('all');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const composerElevation = useRef(new Animated.Value(0)).current;

  const handleToggle = () => setIsAnonymous((v) => !v);

  const handleComposerFocus = () => {
    Animated.timing(composerElevation, {
      toValue: 1, duration: 220, useNativeDriver: false,
    }).start();
  };
  const handleComposerBlur = () => {
    Animated.timing(composerElevation, {
      toValue: 0, duration: 220, useNativeDriver: false,
    }).start();
  };

  const handlePost = () => router.replace('/(tabs)/feed');

  const cardShadowRadius = composerElevation.interpolate({
    inputRange: [0, 1], outputRange: [20, 36],
  });
  const cardShadowOpacity = composerElevation.interpolate({
    inputRange: [0, 1], outputRange: [0.08, 0.14],
  });

  const accent = isAnonymous ? T.accentBlue : PUB[0];

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={s.nav}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={s.navCancel}>
              <Text style={s.navCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.navTitle}>Create Post</Text>
            <TouchableOpacity onPress={handlePost} activeOpacity={0.85} style={s.navPostWrap}>
              <LinearGradient
                colors={isAnonymous ? CTA : PUB}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.navPostBtn}
              >
                <Text style={s.navPostText}>Post</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Identity + Toggle */}
            <View style={id_.shadow}>
              <View style={id_.card}>
                <AvatarCircle
                  grad={isAnonymous ? ['#4B50F8', '#8B4DFF'] : [PUB[0], PUB[2]]}
                  size={42}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={id_.handle}>
                    {isAnonymous ? 'AnonBio12' : 'Jun Jinho'}
                  </Text>
                  <Text style={[id_.status, { color: accent }]}>
                    {isAnonymous ? 'Identity hidden' : 'Posting publicly'}
                  </Text>
                </View>

                {/* Toggle */}
                <View style={tog.track}>
                  <TouchableOpacity
                    onPress={() => !isAnonymous && handleToggle()}
                    activeOpacity={0.8}
                    style={tog.segment}
                  >
                    {isAnonymous ? (
                      <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tog.segActive}>
                        <Ionicons name="shield-checkmark" size={11} color={T.white} />
                        <Text style={tog.segActiveText}>Anonymous</Text>
                      </LinearGradient>
                    ) : (
                      <View style={tog.segInactive}>
                        <Text style={tog.segInactiveText}>Anonymous</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={tog.divider} />
                  <TouchableOpacity
                    onPress={() => isAnonymous && handleToggle()}
                    activeOpacity={0.8}
                    style={tog.segment}
                  >
                    {!isAnonymous ? (
                      <LinearGradient colors={PUB} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tog.segActive}>
                        <Ionicons name="person" size={11} color={T.white} />
                        <Text style={tog.segActiveText}>Public</Text>
                      </LinearGradient>
                    ) : (
                      <View style={tog.segInactive}>
                        <Text style={tog.segInactiveText}>Public</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Composer card */}
            <Animated.View style={[
              comp.shadow,
              { shadowRadius: cardShadowRadius, shadowOpacity: cardShadowOpacity },
            ]}>
              <View style={comp.card}>
                <TextInput
                  style={comp.input}
                  placeholder="What's on your mind? Ask a question, share a thought..."
                  placeholderTextColor={T.textMuted}
                  multiline
                  value={body}
                  onChangeText={setBody}
                  onFocus={handleComposerFocus}
                  onBlur={handleComposerBlur}
                  maxLength={2000}
                  textAlignVertical="top"
                  autoCorrect
                  autoCapitalize="sentences"
                />

                {body.length > 0 && (
                  <Text style={comp.charCount}>{body.length}/2000</Text>
                )}

                {/* Attachment row */}
                <View style={comp.attachRow}>
                  <TouchableOpacity style={comp.attachBtn} activeOpacity={0.7}>
                    <Ionicons name="image-outline" size={18} color={T.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity style={comp.attachBtn} activeOpacity={0.7}>
                    <Ionicons name="stats-chart-outline" size={16} color={T.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity style={comp.attachBtn} activeOpacity={0.7}>
                    <Ionicons name="link-outline" size={17} color={T.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity style={comp.attachBtn} activeOpacity={0.7}>
                    <Ionicons name="pricetag-outline" size={16} color={T.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Category */}
            <View style={{ gap: 10 }}>
              <Text style={s.sectionLabel}>Category</Text>
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 4 }}
              >
                {CATEGORIES.map((cat) => {
                  const isActive = cat.key === category;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setCategory(cat.key)}
                      activeOpacity={0.75}
                      style={ch.wrap}
                    >
                      {isActive ? (
                        <LinearGradient
                          colors={isAnonymous ? [cat.color, T.accentPurple] : PUB}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={ch.active}
                        >
                          <Ionicons name={cat.icon as any} size={14} color={T.white} />
                          <Text style={ch.activeText}>{cat.label}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={ch.inactive}>
                          <Ionicons name={cat.icon as any} size={14} color={T.textSecondary} />
                          <Text style={ch.inactiveText}>{cat.label}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Audience */}
            <View style={{ gap: 10 }}>
              <Text style={s.sectionLabel}>Audience</Text>
              <View style={aud.row}>
                {AUDIENCES.map((a) => {
                  const isActive = a.key === audience;
                  return (
                    <TouchableOpacity
                      key={a.key}
                      onPress={() => setAudience(a.key)}
                      activeOpacity={0.75}
                      style={[aud.card, isActive && aud.cardActive, isActive && { borderColor: accent + '30' }]}
                    >
                      <View style={[aud.iconWrap, { backgroundColor: isActive ? accent + '14' : 'rgba(17,17,17,0.04)' }]}>
                        <Ionicons name={a.icon as any} size={16} color={isActive ? accent : T.textMuted} />
                      </View>
                      <Text style={[aud.label, isActive && { color: T.textPrimary }]}>{a.label}</Text>
                      {isActive && (
                        <View style={[aud.check, { backgroundColor: accent }]}>
                          <Ionicons name="checkmark" size={10} color={T.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Safety module */}
            <View style={safe.card}>
              <View style={safe.iconWrap}>
                <Ionicons
                  name={isAnonymous ? 'shield-checkmark-outline' : 'eye-outline'}
                  size={16}
                  color={accent}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={safe.title}>
                  {isAnonymous ? 'Anonymous posting' : 'Public posting'}
                </Text>
                <Text style={safe.body}>
                  {isAnonymous
                    ? 'Your real identity is never revealed. Students see your anonymous handle only.'
                    : 'Your name and profile will be visible. You can switch to anonymous above.'}
                </Text>
              </View>
            </View>

            {/* Publish CTA */}
            <View style={cta.wrap}>
              <TouchableOpacity onPress={handlePost} activeOpacity={0.86} style={cta.shadow}>
                <LinearGradient
                  colors={isAnonymous ? CTA : PUB}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={cta.btn}
                >
                  <Ionicons name="send" size={17} color={T.white} />
                  <Text style={cta.text}>
                    {isAnonymous ? 'Post Anonymously' : 'Post Publicly'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 14,
  },
  navCancel: { paddingVertical: 6, paddingHorizontal: 2 },
  navCancelText: { fontSize: 15, color: T.textSecondary, fontWeight: '500' },
  navTitle: { fontSize: 16, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
  navPostWrap: {
    borderRadius: 99,
    shadowColor: '#4B50F8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 6,
  },
  navPostBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 99 },
  navPostText: { fontSize: 14, fontWeight: '700', color: T.white },
  scroll: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 36, gap: 18 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: T.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
});

// Identity card
const id_ = StyleSheet.create({
  shadow: {
    borderRadius: 22,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  handle: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  status: { fontSize: 11, fontWeight: '600' },
});

// Toggle
const tog = StyleSheet.create({
  track: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.50)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)',
    overflow: 'hidden',
  },
  segment: {},
  segActive: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10, margin: 3,
    shadowColor: '#4B50F8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 6, elevation: 3,
  },
  segActiveText: { fontSize: 12, fontWeight: '700', color: T.white },
  segInactive: { paddingHorizontal: 11, paddingVertical: 7, margin: 3 },
  segInactiveText: { fontSize: 12, fontWeight: '600', color: T.textMuted },
  divider: { width: 1, height: 16, backgroundColor: 'rgba(17,17,17,0.07)' },
});

// Composer
const comp = StyleSheet.create({
  shadow: {
    borderRadius: 24,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 8 }, elevation: 7,
  },
  card: {
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, gap: 10,
  },
  input: {
    fontSize: 16, color: T.textPrimary, lineHeight: 24,
    minHeight: 120, fontWeight: '400',
  },
  charCount: { fontSize: 11, color: T.textMuted, textAlign: 'right' },
  attachRow: {
    flexDirection: 'row', gap: 4,
    borderTopWidth: 1, borderTopColor: 'rgba(17,17,17,0.05)',
    paddingTop: 10,
  },
  attachBtn: {
    width: 40, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.50)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)',
  },
});

// Category chips
const ch = StyleSheet.create({
  wrap: {
    borderRadius: 99,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  active: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, height: 36, borderRadius: 99,
  },
  activeText: { fontSize: 13, fontWeight: '700', color: T.white },
  inactive: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, height: 36, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  inactiveText: { fontSize: 13, fontWeight: '600', color: T.textSecondary },
});

// Audience
const aud = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  card: {
    flex: 1, alignItems: 'center', gap: 6,
    paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 18, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.50)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  cardActive: {
    backgroundColor: 'rgba(255,255,255,0.70)',
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '600', color: T.textMuted, textAlign: 'center' },
  check: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
});

// Safety module
const safe = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  iconWrap: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: 'rgba(139,77,255,0.08)',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  title: { fontSize: 12, fontWeight: '700', color: T.textPrimary },
  body: { fontSize: 11, color: T.textMuted, lineHeight: 16 },
});

// CTA
const cta = StyleSheet.create({
  wrap: { paddingTop: 4 },
  shadow: {
    borderRadius: 99,
    shadowColor: '#4B50F8', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 54, borderRadius: 99,
  },
  text: { fontSize: 16, fontWeight: '700', color: T.white, letterSpacing: 0.2 },
});
