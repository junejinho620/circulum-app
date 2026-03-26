import React, { useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Pressable, Dimensions, Animated, PanResponder, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useStudyBuddyMatches,
  useStudySessions,
  useCreateStudySession,
  useJoinStudySession,
  StudyBuddyMatch,
  StudySessionItem,
} from '../src/services/queries';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  textPrimary:   '#111111',
  textSecondary: '#5F6472',
  textMuted:     '#8A90A2',
  accentBlue:    '#4B50F8',
  accentPurple:  '#8B4DFF',
  accentPink:    '#E655C5',
  accentGreen:   '#3DAB73',
  white:         '#FFFFFF',
};

const BG: [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];

// ─── Avatar gradient palette ─────────────────────────────────────────────────
const AVATAR_GRADS: [string, string][] = [
  ['#4B50F8', '#8B4DFF'], ['#8B4DFF', '#E655C5'], ['#6B7CFF', '#4B50F8'],
  ['#E655C5', '#C47EFF'], ['#C47EFF', '#6B7CFF'], ['#3DAB73', '#4D97FF'],
  ['#F1973B', '#E655C5'], ['#4D97FF', '#3DAB73'],
];

function avatarGrad(i: number): [string, string] {
  return AVATAR_GRADS[i % AVATAR_GRADS.length];
}

// ─── Helpers to map API shapes to UI shapes ──────────────────────────────────

/** Derive a stable numeric index from a string id for avatar gradient selection */
function idToIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/** Map a StudySessionItem from the API into the shape the SessionCard expects */
function mapSession(s: StudySessionItem) {
  const dateObj = new Date(s.date);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dateLabel: string;
  if (dateObj.toDateString() === now.toDateString()) {
    dateLabel = 'Today';
  } else if (dateObj.toDateString() === tomorrow.toDateString()) {
    dateLabel = 'Tomorrow';
  } else {
    dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const timeLabel = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const participants = (s.participants ?? []).map((p) => ({
    initial: p.user.handle?.[0]?.toUpperCase() ?? '?',
    gradIdx: idToIndex(p.user.id) % AVATAR_GRADS.length,
  }));

  return {
    id: s.id,
    course: s.courseCode,
    date: dateLabel,
    time: timeLabel,
    location: s.location,
    duration: s.duration,
    participants,
    goal: s.goal,
    isPublic: s.isPublic,
    maxParticipants: s.maxParticipants,
    participantCount: s.participantCount,
  };
}

type MappedSession = ReturnType<typeof mapSession>;

const INTENSITY_COLORS: Record<string, string> = {
  Light: '#3DAB73', Moderate: '#F1973B', Intense: '#E05555',
};

// ─── Header ──────────────────────────────────────────────────────────────────
function Header({ onBack, onCreate }: { onBack: () => void; onCreate: () => void }) {
  return (
    <View style={hdr.row}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={hdr.navBtn}>
        <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
      </TouchableOpacity>
      <Text style={hdr.title}>Study Buddy</Text>
      <TouchableOpacity onPress={onCreate} activeOpacity={0.7} style={hdr.navBtn}>
        <Ionicons name="add" size={20} color={T.accentPurple} />
      </TouchableOpacity>
    </View>
  );
}

const hdr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  title: { fontSize: 18, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
});

// ─── Mode Toggle ─────────────────────────────────────────────────────────────
function ModeToggle({ mode, onToggle }: { mode: 'match' | 'explore'; onToggle: () => void }) {
  return (
    <View style={mt.wrap}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[mt.tab, mode === 'match' && mt.tabActive]}
        onPress={onToggle}
      >
        <Ionicons name="sparkles-outline" size={14} color={mode === 'match' ? T.white : T.textSecondary} />
        <Text style={[mt.tabText, mode === 'match' && mt.tabTextActive]}>Matching</Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[mt.tab, mode === 'explore' && mt.tabActive]}
        onPress={onToggle}
      >
        <Ionicons name="grid-outline" size={14} color={mode === 'explore' ? T.white : T.textSecondary} />
        <Text style={[mt.tabText, mode === 'explore' && mt.tabTextActive]}>Explorer</Text>
      </TouchableOpacity>
    </View>
  );
}

const mt = StyleSheet.create({
  wrap: {
    flexDirection: 'row', marginHorizontal: 22, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.50)',
    borderRadius: 14, padding: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 11,
  },
  tabActive: { backgroundColor: T.accentPurple },
  tabText: { fontSize: 13, fontWeight: '600', color: T.textSecondary },
  tabTextActive: { color: T.white },
});

// ─── Swipe Card (Matching Mode) ──────────────────────────────────────────────
export type SwipeCardRef = { swipeLeft: () => void; swipeRight: () => void };

const SwipeCard = forwardRef<SwipeCardRef, {
  buddy: StudyBuddyMatch; onSwipeLeft: () => void; onSwipeRight: () => void; onTap: () => void;
}>(({ buddy, onSwipeLeft, onSwipeRight, onTap }, ref) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-15deg', '0deg', '15deg'] });
  const leftOpacity = pan.x.interpolate({ inputRange: [-100, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const rightOpacity = pan.x.interpolate({ inputRange: [0, 100], outputRange: [0, 1], extrapolate: 'clamp' });

  useImperativeHandle(ref, () => ({
    swipeLeft: () => {
      Animated.timing(pan, { toValue: { x: -400, y: 0 }, duration: 300, useNativeDriver: false }).start(onSwipeLeft);
    },
    swipeRight: () => {
      Animated.timing(pan, { toValue: { x: 400, y: 0 }, duration: 300, useNativeDriver: false }).start(onSwipeRight);
    },
  }));

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 120) {
          Animated.spring(pan, { toValue: { x: 400, y: g.dy }, useNativeDriver: false }).start(onSwipeRight);
        } else if (g.dx < -120) {
          Animated.spring(pan, { toValue: { x: -400, y: g.dy }, useNativeDriver: false }).start(onSwipeLeft);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const grad = avatarGrad(idToIndex(buddy.id));

  return (
    <Animated.View
      style={[sw.card, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity activeOpacity={0.95} onPress={onTap} style={sw.inner}>
        {/* Swipe indicators */}
        <Animated.View style={[sw.swipeIndicator, sw.swipeLeft, { opacity: leftOpacity }]}>
          <Ionicons name="close" size={28} color="#E05555" />
        </Animated.View>
        <Animated.View style={[sw.swipeIndicator, sw.swipeRight, { opacity: rightOpacity }]}>
          <Ionicons name="checkmark" size={28} color={T.accentGreen} />
        </Animated.View>

        {/* Avatar + info */}
        <View style={sw.topSection}>
          <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={sw.avatar}>
            <Text style={sw.avatarText}>{buddy.initial}</Text>
          </LinearGradient>
          <View style={sw.compatBadge}>
            <Text style={sw.compatText}>{buddy.compatibility}%</Text>
            <Text style={sw.compatLabel}>match</Text>
          </View>
        </View>

        <Text style={sw.name}>{buddy.name}</Text>
        {buddy.active && (
          <View style={sw.activeRow}>
            <View style={sw.activeDot} />
            <Text style={sw.activeText}>Active now</Text>
          </View>
        )}

        <Text style={sw.bio} numberOfLines={2}>{buddy.bio}</Text>

        {/* Shared courses */}
        <View style={sw.section}>
          <Text style={sw.sectionLabel}>Shared Courses</Text>
          <View style={sw.pillRow}>
            {buddy.sharedCourses.map((c) => (
              <View key={c} style={sw.coursePill}>
                <Text style={sw.courseText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Free time overlap */}
        <View style={sw.section}>
          <Text style={sw.sectionLabel}>Available</Text>
          <View style={sw.pillRow}>
            {buddy.freeSlots.slice(0, 3).map((s, i) => (
              <View key={i} style={sw.timePill}>
                <Ionicons name="time-outline" size={11} color={T.accentGreen} />
                <Text style={sw.timeText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom stats */}
        <View style={sw.statsRow}>
          <View style={[sw.intensityBadge, { backgroundColor: (INTENSITY_COLORS[buddy.intensity] ?? T.textMuted) + '15' }]}>
            <Text style={[sw.intensityText, { color: INTENSITY_COLORS[buddy.intensity] ?? T.textMuted }]}>{buddy.intensity}</Text>
          </View>
          <View style={sw.stat}>
            <Ionicons name="location-outline" size={12} color={T.textMuted} />
            <Text style={sw.statText}>{buddy.location}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const sw = StyleSheet.create({
  card: {
    width: SCREEN_W - 44, alignSelf: 'center',
    borderRadius: 24, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 6,
  },
  inner: { padding: 20, gap: 10, paddingVertical: 40 },
  swipeIndicator: {
    position: 'absolute', top: 20, zIndex: 10,
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  swipeLeft: { left: 20, backgroundColor: 'rgba(224,85,85,0.12)', borderWidth: 2, borderColor: 'rgba(224,85,85,0.25)' },
  swipeRight: { right: 20, backgroundColor: 'rgba(61,171,115,0.12)', borderWidth: 2, borderColor: 'rgba(61,171,115,0.25)' },
  topSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '800', color: T.white },
  compatBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(75,80,248,0.15)',
  },
  compatText: { fontSize: 22, fontWeight: '800', color: T.accentBlue },
  compatLabel: { fontSize: 10, fontWeight: '600', color: T.textMuted, marginTop: -2 },
  name: { fontSize: 20, fontWeight: '800', color: T.textPrimary },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.accentGreen },
  activeText: { fontSize: 11, fontWeight: '600', color: T.accentGreen },
  bio: { fontSize: 13, color: T.textSecondary, lineHeight: 18 },
  section: { gap: 5 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  coursePill: {
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(75,80,248,0.12)',
  },
  courseText: { fontSize: 12, fontWeight: '700', color: T.accentBlue },
  timePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(61,171,115,0.08)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(61,171,115,0.12)',
  },
  timeText: { fontSize: 11, fontWeight: '600', color: T.accentGreen },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  intensityBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  intensityText: { fontSize: 11, fontWeight: '700' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, color: T.textMuted },
});

// ─── Swipe Action Buttons ────────────────────────────────────────────────────
function SwipeActions({ onSkip, onInvite }: { onSkip: () => void; onInvite: () => void }) {
  return (
    <View style={sa.row}>
      <TouchableOpacity activeOpacity={0.7} style={sa.skipBtn} onPress={onSkip}>
        <Ionicons name="close" size={24} color="#E05555" />
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.8} onPress={onInvite}>
        <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sa.inviteBtn}>
          <Ionicons name="people" size={20} color={T.white} />
          <Text style={sa.inviteText}>Study Together</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.7} style={sa.skipBtn}>
        <Ionicons name="star-outline" size={22} color="#F1973B" />
      </TouchableOpacity>
    </View>
  );
}

const sa = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 2 },
  skipBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 22, paddingHorizontal: 24, paddingVertical: 14,
  },
  inviteText: { fontSize: 15, fontWeight: '700', color: T.white },
});

// ─── Explorer Card (Grid Mode) ───────────────────────────────────────────────
function ExplorerCard({ buddy, onPress }: { buddy: StudyBuddyMatch; onPress: () => void }) {
  const grad = avatarGrad(idToIndex(buddy.id));
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={ec.card}>
      <View style={ec.inner}>
        <View style={ec.topRow}>
          <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ec.avatar}>
            <Text style={ec.avatarText}>{buddy.initial}</Text>
          </LinearGradient>
          {buddy.active && <View style={ec.activeDot} />}
        </View>
        <Text style={ec.name} numberOfLines={1}>{buddy.name}</Text>
        {buddy.sharedCourses.length > 0 && (
          <View style={ec.courseBadge}>
            <Text style={ec.courseText}>{buddy.sharedCourses[0]}</Text>
            {buddy.sharedCourses.length > 1 && (
              <Text style={ec.moreText}>+{buddy.sharedCourses.length - 1}</Text>
            )}
          </View>
        )}
        <Text style={ec.avail} numberOfLines={1}>{buddy.freeSlots[0]}</Text>
        <View style={ec.compatRow}>
          <Text style={ec.compatText}>{buddy.compatibility}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ec = StyleSheet.create({
  card: {
    width: (SCREEN_W - 44 - 10) / 2, borderRadius: 18, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 14, alignItems: 'center', gap: 6 },
  topRow: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: T.white },
  activeDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: T.accentGreen, borderWidth: 2, borderColor: T.white,
  },
  name: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  courseBadge: {
    flexDirection: 'row', gap: 4,
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  courseText: { fontSize: 11, fontWeight: '700', color: T.accentBlue },
  moreText: { fontSize: 11, fontWeight: '600', color: T.textMuted },
  avail: { fontSize: 10, color: T.textMuted },
  compatRow: {
    backgroundColor: 'rgba(139,77,255,0.08)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  compatText: { fontSize: 12, fontWeight: '800', color: T.accentPurple },
});

// ─── Profile Preview Modal ───────────────────────────────────────────────────
function ProfilePreview({ buddy, visible, onClose }: {
  buddy: StudyBuddyMatch | null; visible: boolean; onClose: () => void;
}) {
  if (!buddy) return null;
  const grad = avatarGrad(idToIndex(buddy.id));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pp.backdrop} onPress={onClose}>
        <Pressable style={pp.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={pp.handle} />

            <View style={pp.headerRow}>
              <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pp.avatar}>
                <Text style={pp.avatarText}>{buddy.initial}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={pp.name}>{buddy.name}</Text>
                <View style={pp.badges}>
                  <View style={[pp.intensityBadge, { backgroundColor: (INTENSITY_COLORS[buddy.intensity] ?? T.textMuted) + '15' }]}>
                    <Text style={[pp.intensityText, { color: INTENSITY_COLORS[buddy.intensity] ?? T.textMuted }]}>{buddy.intensity}</Text>
                  </View>
                  <View style={pp.prefBadge}>
                    <Text style={pp.prefText}>{buddy.preference}</Text>
                  </View>
                </View>
              </View>
              <View style={pp.compatCircle}>
                <Text style={pp.compatNum}>{buddy.compatibility}%</Text>
              </View>
            </View>

            <Text style={pp.bio}>{buddy.bio}</Text>

            {/* Shared courses */}
            <Text style={pp.sectionTitle}>Shared Courses</Text>
            <View style={pp.pillRow}>
              {buddy.sharedCourses.map((c) => (
                <View key={c} style={pp.coursePill}>
                  <Ionicons name="school-outline" size={12} color={T.accentBlue} />
                  <Text style={pp.courseText}>{c}</Text>
                </View>
              ))}
            </View>

            {/* Free time */}
            <Text style={pp.sectionTitle}>Available Times</Text>
            <View style={pp.pillRow}>
              {buddy.freeSlots.map((s, i) => (
                <View key={i} style={pp.timePill}>
                  <Ionicons name="time-outline" size={12} color={T.accentGreen} />
                  <Text style={pp.timeText}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Study methods */}
            <Text style={pp.sectionTitle}>Study Style</Text>
            <View style={pp.pillRow}>
              {buddy.studyStyle.map((s, i) => (
                <View key={i} style={pp.stylePill}>
                  <Text style={pp.styleText}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Stats row */}
            <View style={pp.statsRow}>
              <View style={pp.statBox}>
                <Text style={pp.statNum}>{buddy.reliability}%</Text>
                <Text style={pp.statLabel}>Reliability</Text>
              </View>
              <View style={pp.statBox}>
                <Text style={pp.statNum}>{buddy.sessionsCompleted}</Text>
                <Text style={pp.statLabel}>Sessions</Text>
              </View>
              <View style={pp.statBox}>
                <Text style={pp.statNum}>{buddy.sharedCourses.length}</Text>
                <Text style={pp.statLabel}>Shared</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={pp.actionsRow}>
              <TouchableOpacity activeOpacity={0.8} style={{ flex: 1 }}>
                <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={pp.ctaBtn}>
                  <Ionicons name="paper-plane-outline" size={16} color={T.white} />
                  <Text style={pp.ctaText}>Send Invite</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={pp.secondaryBtn}>
                <Ionicons name="chatbubble-outline" size={16} color={T.accentPurple} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={pp.secondaryBtn}>
                <Ionicons name="calendar-outline" size={16} color={T.accentBlue} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pp = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: T.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 22, paddingBottom: 36, maxHeight: '85%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800', color: T.white },
  name: { fontSize: 18, fontWeight: '800', color: T.textPrimary },
  badges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  intensityBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  intensityText: { fontSize: 10, fontWeight: '700' },
  prefBadge: { backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  prefText: { fontSize: 10, fontWeight: '700', color: T.accentBlue },
  compatCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(139,77,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(139,77,255,0.15)',
  },
  compatNum: { fontSize: 16, fontWeight: '800', color: T.accentPurple },
  bio: { fontSize: 13, color: T.textSecondary, lineHeight: 19, marginTop: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  coursePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(75,80,248,0.12)',
  },
  courseText: { fontSize: 12, fontWeight: '700', color: T.accentBlue },
  timePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(61,171,115,0.08)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(61,171,115,0.12)',
  },
  timeText: { fontSize: 12, fontWeight: '600', color: T.accentGreen },
  stylePill: {
    backgroundColor: 'rgba(139,77,255,0.06)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(139,77,255,0.10)',
  },
  styleText: { fontSize: 11, fontWeight: '600', color: T.accentPurple },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statBox: {
    flex: 1, alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 14, paddingVertical: 12,
  },
  statNum: { fontSize: 18, fontWeight: '800', color: T.textPrimary },
  statLabel: { fontSize: 10, color: T.textMuted, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 14,
  },
  ctaText: { fontSize: 15, fontWeight: '700', color: T.white },
  secondaryBtn: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(139,77,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Upcoming Session Card ───────────────────────────────────────────────────
function SessionCard({ session, onJoin }: { session: MappedSession; onJoin?: () => void }) {
  return (
    <View style={sc.card}>
      <View style={sc.inner}>
        <View style={sc.topRow}>
          <View style={sc.coursePill}>
            <Text style={sc.courseText}>{session.course}</Text>
          </View>
          {session.isPublic && (
            <View style={sc.publicBadge}>
              <Ionicons name="globe-outline" size={10} color={T.accentGreen} />
              <Text style={sc.publicText}>Open</Text>
            </View>
          )}
        </View>
        <View style={sc.timeRow}>
          <Text style={sc.date}>{session.date}</Text>
          <Text style={sc.time}>{session.time}</Text>
          <Text style={sc.duration}>({session.duration})</Text>
        </View>
        <View style={sc.locRow}>
          <Ionicons name="location-outline" size={12} color={T.textMuted} />
          <Text style={sc.locText}>{session.location}</Text>
        </View>
        {session.goal && <Text style={sc.goal} numberOfLines={1}>{session.goal}</Text>}
        <View style={sc.bottomRow}>
          <View style={sc.avatarStack}>
            {session.participants.map((p, i) => (
              <LinearGradient
                key={i}
                colors={avatarGrad(p.gradIdx)}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[sc.miniAvatar, { marginLeft: i > 0 ? -8 : 0 }]}
              >
                <Text style={sc.miniAvatarText}>{p.initial}</Text>
              </LinearGradient>
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.7} style={sc.joinBtn} onPress={onJoin}>
            <Text style={sc.joinText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    width: 200, borderRadius: 18, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 14, gap: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coursePill: { backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  courseText: { fontSize: 12, fontWeight: '700', color: T.accentBlue },
  publicBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(61,171,115,0.10)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  publicText: { fontSize: 9, fontWeight: '700', color: T.accentGreen },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  date: { fontSize: 13, fontWeight: '700', color: T.textPrimary },
  time: { fontSize: 12, fontWeight: '600', color: T.accentPurple },
  duration: { fontSize: 10, color: T.textMuted },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 11, color: T.textMuted },
  goal: { fontSize: 11, color: T.textSecondary, fontStyle: 'italic' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  avatarStack: { flexDirection: 'row' },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: T.white },
  miniAvatarText: { fontSize: 10, fontWeight: '700', color: T.white },
  joinBtn: {
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(75,80,248,0.15)',
  },
  joinText: { fontSize: 11, fontWeight: '700', color: T.accentBlue },
});

// ─── Create Session Sheet ────────────────────────────────────────────────────
function CreateSessionSheet({ visible, onClose, buddies }: {
  visible: boolean; onClose: () => void; buddies: StudyBuddyMatch[];
}) {
  const [course, setCourse] = useState('');
  const [location, setLocation] = useState('');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('1h');
  const [isPublic, setIsPublic] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  const createSession = useCreateStudySession();

  // Build course options from available buddy courses
  const courseOptions = Array.from(
    new Set(buddies.flatMap((b) => b.sharedCourses)),
  ).sort();

  // Auto-select first course if none selected
  const activeCourse = course || courseOptions[0] || '';

  const matchedBuddies = buddies.filter((b) =>
    b.sharedCourses.includes(activeCourse)
  ).sort((a, b) => b.compatibility - a.compatibility);

  const toggleInvite = (id: string) => {
    setInvitedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!activeCourse) return;
    createSession.mutate(
      {
        courseCode: activeCourse,
        date: new Date().toISOString(),
        location,
        duration,
        goal: goal || undefined,
        isPublic,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={cs.backdrop} onPress={onClose}>
        <Pressable style={cs.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={cs.handle} />
            <Text style={cs.title}>Create Study Session</Text>

            {/* Course */}
            <Text style={cs.label}>Course</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {courseOptions.map((c) => (
                <TouchableOpacity
                  key={c} activeOpacity={0.7}
                  style={[cs.chip, activeCourse === c && cs.chipActive]}
                  onPress={() => setCourse(c)}
                >
                  <Text style={[cs.chipText, activeCourse === c && cs.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Date & Time placeholders */}
            <Text style={cs.label}>Date & Time</Text>
            <View style={cs.dtRow}>
              <TouchableOpacity activeOpacity={0.7} style={cs.dtBtn}>
                <Ionicons name="calendar-outline" size={16} color={T.accentBlue} />
                <Text style={cs.dtText}>Select Date</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={cs.dtBtn}>
                <Ionicons name="time-outline" size={16} color={T.accentPurple} />
                <Text style={cs.dtText}>Select Time</Text>
              </TouchableOpacity>
            </View>

            {/* Duration */}
            <Text style={cs.label}>Duration</Text>
            <View style={cs.durRow}>
              {['30min', '1h', '1.5h', '2h', '3h'].map((d) => (
                <TouchableOpacity
                  key={d} activeOpacity={0.7}
                  style={[cs.durChip, duration === d && cs.chipActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[cs.durText, duration === d && cs.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Location */}
            <Text style={cs.label}>Location</Text>
            <TextInput
              style={cs.input}
              placeholder="e.g., Robarts Library L3, Online (Zoom)..."
              placeholderTextColor={T.textMuted}
              value={location}
              onChangeText={setLocation}
            />

            {/* Invite Buddies */}
            <Text style={cs.label}>Invite Study Buddies</Text>
            {matchedBuddies.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {matchedBuddies.map((b) => {
                  const selected = invitedIds.has(b.id);
                  const grad = avatarGrad(idToIndex(b.id));
                  return (
                    <TouchableOpacity
                      key={b.id} activeOpacity={0.7}
                      style={[cs.buddyBadge, selected && cs.buddyBadgeActive]}
                      onPress={() => toggleInvite(b.id)}
                    >
                      <View style={cs.buddyAvatarWrap}>
                        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cs.buddyAvatar}>
                          <Text style={cs.buddyInitial}>{b.initial}</Text>
                        </LinearGradient>
                        {selected && (
                          <View style={cs.buddyCheck}>
                            <Ionicons name="checkmark" size={10} color={T.white} />
                          </View>
                        )}
                        {b.active && <View style={cs.buddyOnline} />}
                      </View>
                      <Text style={cs.buddyName} numberOfLines={1}>{b.name.split(' ')[0]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={{ fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>No matched buddies for this course</Text>
            )}
            {invitedIds.size > 0 && (
              <Text style={cs.invitedCount}>{invitedIds.size} {invitedIds.size === 1 ? 'buddy' : 'buddies'} selected</Text>
            )}

            {/* Goal */}
            <Text style={cs.label}>Session Goal (optional)</Text>
            <TextInput
              style={cs.input}
              placeholder="e.g., Finish assignment 2, Midterm prep..."
              placeholderTextColor={T.textMuted}
              value={goal}
              onChangeText={setGoal}
            />

            {/* Public toggle */}
            <TouchableOpacity style={cs.toggleRow} activeOpacity={0.7} onPress={() => setIsPublic(!isPublic)}>
              <Ionicons name={isPublic ? 'checkbox' : 'square-outline'} size={20} color={T.accentPurple} />
              <View>
                <Text style={cs.toggleText}>Open to all students</Text>
                <Text style={cs.toggleSub}>Anyone in the course can join</Text>
              </View>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit} disabled={createSession.isPending}>
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[cs.submitBtn, createSession.isPending && { opacity: 0.6 }]}>
                {createSession.isPending ? (
                  <ActivityIndicator size="small" color={T.white} />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={18} color={T.white} />
                    <Text style={cs.submitText}>Create Session</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const cs = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: T.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 22, paddingBottom: 36, maxHeight: '88%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', color: T.textPrimary, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: T.textPrimary, marginTop: 14, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  chipActive: { backgroundColor: T.accentPurple, borderColor: T.accentPurple },
  chipText: { fontSize: 13, fontWeight: '700', color: T.textSecondary },
  chipTextActive: { color: T.white },
  dtRow: { flexDirection: 'row', gap: 10 },
  dtBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  dtText: { fontSize: 13, fontWeight: '600', color: T.textSecondary },
  durRow: { flexDirection: 'row', gap: 6 },
  durChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  durText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  input: {
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: T.textPrimary,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  toggleText: { fontSize: 13, fontWeight: '600', color: T.textPrimary },
  toggleSub: { fontSize: 11, color: T.textMuted },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 15, marginTop: 18,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: T.white },
  buddyBadge: {
    alignItems: 'center', width: 68, paddingVertical: 10, paddingHorizontal: 4,
    borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.05)',
  },
  buddyBadgeActive: {
    backgroundColor: 'rgba(75,80,248,0.08)',
    borderColor: 'rgba(75,80,248,0.3)',
  },
  buddyAvatarWrap: { position: 'relative', marginBottom: 6 },
  buddyAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  buddyInitial: { fontSize: 16, fontWeight: '800', color: T.white },
  buddyCheck: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: T.accentPurple,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: T.white,
  },
  buddyOnline: {
    position: 'absolute', top: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: T.accentGreen,
    borderWidth: 2, borderColor: T.white,
  },
  buddyName: { fontSize: 11, fontWeight: '600', color: T.textPrimary, textAlign: 'center' },
  buddyMatch: { fontSize: 10, fontWeight: '700', color: T.accentBlue, marginTop: 1 },
  invitedCount: { fontSize: 11, fontWeight: '600', color: T.accentPurple, marginTop: 6 },
});

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ title, icon, iconColor }: { title: string; icon: string; iconColor: string }) {
  return (
    <View style={shr.row}>
      <View style={[shr.iconCircle, { backgroundColor: iconColor + '12' }]}>
        <Ionicons name={icon as any} size={15} color={iconColor} />
      </View>
      <Text style={shr.title}>{title}</Text>
    </View>
  );
}

const shr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, marginBottom: 2 },
  iconCircle: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
});

// ─── Explorer Sort Chips ─────────────────────────────────────────────────────
const EXPLORE_SORTS = ['Best Match', 'Nearby', 'Same Course', 'Most Active'];

// ─── Loading Placeholder ─────────────────────────────────────────────────────
function LoadingPlaceholder() {
  return (
    <View style={lp.container}>
      <ActivityIndicator size="large" color={T.accentPurple} />
      <Text style={lp.text}>Finding study buddies...</Text>
    </View>
  );
}

const lp = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  text: { fontSize: 14, fontWeight: '600', color: T.textMuted },
});

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyBuddiesState() {
  return (
    <View style={emp.container}>
      <Ionicons name="people-outline" size={48} color={T.textMuted} />
      <Text style={emp.title}>No matches yet</Text>
      <Text style={emp.sub}>Update your study profile to get matched with classmates</Text>
    </View>
  );
}

const emp = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  title: { fontSize: 16, fontWeight: '700', color: T.textPrimary },
  sub: { fontSize: 13, color: T.textMuted, textAlign: 'center', lineHeight: 18 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function StudyBuddyScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<'match' | 'explore'>('match');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedBuddy, setSelectedBuddy] = useState<StudyBuddyMatch | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [exploreSort, setExploreSort] = useState('Best Match');
  const [refreshing, setRefreshing] = useState(false);

  const { data: buddies, isLoading: buddiesLoading, refetch: refetchBuddies } = useStudyBuddyMatches();
  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useStudySessions();
  const joinSession = useJoinStudySession();

  const buddyList = buddies ?? [];
  const mappedSessions = (sessions ?? []).map(mapSession);

  const swipeCardRef = useRef<SwipeCardRef>(null);
  const currentBuddy = buddyList.length > 0 ? buddyList[currentIdx % buddyList.length] : null;

  const nextBuddy = () => setCurrentIdx((prev) => prev + 1);
  const handleSkip = useCallback(() => swipeCardRef.current?.swipeLeft(), []);
  const handleInvite = useCallback(() => swipeCardRef.current?.swipeRight(), []);

  const handleJoinSession = (sessionId: string) => {
    joinSession.mutate(sessionId);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchBuddies(), refetchSessions()]);
    setRefreshing(false);
  }, [refetchBuddies, refetchSessions]);

  const sortedBuddies = [...buddyList].sort((a, b) => {
    switch (exploreSort) {
      case 'Same Course': return b.sharedCourses.length - a.sharedCourses.length;
      case 'Most Active': return (b.active ? 1 : 0) - (a.active ? 1 : 0);
      default: return b.compatibility - a.compatibility;
    }
  });

  // ─── Sessions horizontal list (shared by both modes) ─────────────────────
  const SessionsList = () => (
    <View style={{ marginTop: 6 }}>
      <SectionHeader title="Upcoming Sessions" icon="calendar-outline" iconColor={T.accentBlue} />
      {sessionsLoading ? (
        <View style={{ paddingHorizontal: 22, paddingTop: 10 }}>
          <ActivityIndicator size="small" color={T.accentBlue} />
        </View>
      ) : mappedSessions.length > 0 ? (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 22, gap: 10, paddingTop: 6 }}
        >
          {mappedSessions.map((ses) => (
            <SessionCard key={ses.id} session={ses} onJoin={() => handleJoinSession(ses.id)} />
          ))}
        </ScrollView>
      ) : (
        <Text style={{ paddingHorizontal: 22, paddingTop: 6, fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>
          No upcoming sessions
        </Text>
      )}
    </View>
  );

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header onBack={() => router.back()} onCreate={() => setShowCreate(true)} />

        {/* Mode toggle */}
        <ModeToggle mode={mode} onToggle={() => setMode(mode === 'match' ? 'explore' : 'match')} />

        {mode === 'match' ? (
          /* ─── Matching Mode ─── */
          <View style={s.matchContainer}>
            <SessionsList />

            {/* Swipe card */}
            <View style={s.swipeArea}>
              {buddiesLoading ? (
                <LoadingPlaceholder />
              ) : currentBuddy ? (
                <SwipeCard
                  ref={swipeCardRef}
                  key={currentIdx}
                  buddy={currentBuddy}
                  onSwipeLeft={nextBuddy}
                  onSwipeRight={nextBuddy}
                  onTap={() => { setSelectedBuddy(currentBuddy); setShowProfile(true); }}
                />
              ) : (
                <EmptyBuddiesState />
              )}
            </View>

            {currentBuddy && <SwipeActions onSkip={handleSkip} onInvite={handleInvite} />}
            <View style={{ flex: 0.1 }} />
          </View>
        ) : (
          /* ─── Explorer Mode ─── */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.exploreScroll}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accentPurple} />
            }
          >
            <SessionsList />

            {/* Sort chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 6 }}>
              {EXPLORE_SORTS.map((opt) => (
                <TouchableOpacity
                  key={opt} activeOpacity={0.7}
                  style={[s.sortChip, exploreSort === opt && s.sortChipActive]}
                  onPress={() => setExploreSort(opt)}
                >
                  <Text style={[s.sortChipText, exploreSort === opt && s.sortChipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Grid */}
            {buddiesLoading ? (
              <LoadingPlaceholder />
            ) : sortedBuddies.length > 0 ? (
              <View style={s.grid}>
                {sortedBuddies.map((b) => (
                  <ExplorerCard
                    key={b.id}
                    buddy={b}
                    onPress={() => { setSelectedBuddy(b); setShowProfile(true); }}
                  />
                ))}
              </View>
            ) : (
              <EmptyBuddiesState />
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        )}

      </SafeAreaView>

      <ProfilePreview
        buddy={selectedBuddy}
        visible={showProfile}
        onClose={() => setShowProfile(false)}
      />

      <CreateSessionSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        buddies={buddyList}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  matchContainer: { flex: 1 },
  swipeArea: { flex: 1, justifyContent: 'center', paddingVertical: 2 },
  exploreScroll: { paddingTop: 0, gap: 14 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 22,
  },
  sortChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  sortChipActive: { backgroundColor: T.accentPurple, borderColor: T.accentPurple },
  sortChipText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  sortChipTextActive: { color: T.white },
});
