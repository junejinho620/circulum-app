import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, Pressable, Dimensions, TextInput, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileHeaderSkeleton, SkeletonList } from '../../src/components/common/Skeletons';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Reputation tiers (shared with profile tab) ─────────────────────────────
type Tier = { name: string; icon: string; minXP: number; color: string; grad: [string, string] };
const TIERS: Tier[] = [
  { name: 'Newcomer',     icon: 'leaf-outline',     minXP: 0,    color: '#8A90A2', grad: ['#8A90A2', '#B0B5C3'] },
  { name: 'Contributor',  icon: 'chatbubble-outline', minXP: 100,  color: '#4B50F8', grad: ['#4B50F8', '#6B7CFF'] },
  { name: 'Regular',      icon: 'star-outline',     minXP: 500,  color: '#8B4DFF', grad: ['#8B4DFF', '#C47EFF'] },
  { name: 'Trusted',      icon: 'shield-checkmark-outline', minXP: 1500, color: '#3DAB73', grad: ['#3DAB73', '#6BCB95'] },
  { name: 'Campus Leader', icon: 'trophy-outline',  minXP: 3500, color: '#F1973B', grad: ['#F1973B', '#FFB347'] },
  { name: 'Legend',        icon: 'diamond-outline',  minXP: 7000, color: '#E655C5', grad: ['#E655C5', '#FF88DD'] },
];

function getUserTier(xp: number) {
  let idx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].minXP) { idx = i; break; }
  }
  const current = TIERS[idx];
  const next = TIERS[idx + 1] ?? null;
  const progress = next ? Math.min((xp - current.minXP) / (next.minXP - current.minXP), 1) : 1;
  return { current, next, progress };
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  textPrimary:   '#111111',
  textSecondary: '#5F6472',
  textMuted:     '#8A90A2',
  accentBlue:    '#4B50F8',
  accentPurple:  '#8B4DFF',
  accentPink:    '#E655C5',
  accentGreen:   '#3DAB73',
  accentOrange:  '#F1973B',
  white:         '#FFFFFF',
};

const BG:  [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];

const AVATAR_GRADS: [string, string][] = [
  ['#4B50F8', '#8B4DFF'], ['#8B4DFF', '#E655C5'], ['#6B7CFF', '#4B50F8'],
  ['#E655C5', '#C47EFF'], ['#C47EFF', '#6B7CFF'], ['#F1973B', '#E655C5'],
  ['#3DAB73', '#4D97FF'], ['#4D97FF', '#6B7CFF'],
];

// ─── Mock profiles ────────────────────────────────────────────────────────────
type UserProfile = {
  id: string;
  handle: string;
  initial: string;
  gradIdx: number;
  university: string;
  year: string;
  major: string;
  bio: string;
  isOnline: boolean;
  lookingFor: string[];
  studyStyle: string;
  interests: string[];
  courses: string[];
  communities: string[];
  reputation: number;
  posts: number;
  pollsCreated: number;
  studySessions: number;
  helpfulVotes: number;
  memberSince: string;
  favoriteTopics: string[];
  availability: { day: string; time: string }[];
  publicSessions: { title: string; time: string; course: string }[];
  recentPosts: { id: string; text: string; board: string; boardColor: string; likes: number; comments: number; time: string }[];
  messagingPermission: 'allowed' | 'request_required' | 'restricted';
};

const PROFILES: Record<string, UserProfile> = {
  '1': {
    id: '1', handle: 'StudyGuru', initial: 'S', gradIdx: 0,
    university: 'University of Toronto', year: '3rd Year', major: 'Computer Science',
    bio: 'Passionate about algorithms and late-night coding sessions. Always down for a study group or coffee chat. Currently surviving CSC263.',
    isOnline: true,
    lookingFor: ['Study Buddies', 'Project Partners', 'Coffee Chats'],
    studyStyle: 'Collaborative',
    interests: ['Computer Science', 'Mathematics', 'Hackathons', 'Coffee', 'Gaming', 'Open Source'],
    courses: ['CSC263', 'CSC209', 'MAT237', 'STA247'],
    communities: ['Classes', 'Career & Co-op', 'Board Games'],
    reputation: 1240,
    posts: 47, pollsCreated: 8, studySessions: 23, helpfulVotes: 312,
    memberSince: '2024',
    favoriteTopics: ['Data Structures', 'Systems Programming', 'Probability'],
    availability: [
      { day: 'Mon', time: '2–4 PM' }, { day: 'Wed', time: '10 AM–12 PM' },
      { day: 'Fri', time: '3–5 PM' },
    ],
    publicSessions: [
      { title: 'CSC263 Midterm Review', time: 'Tomorrow, 3 PM', course: 'CSC263' },
      { title: 'MAT237 Problem Set', time: 'Wed, 10 AM', course: 'MAT237' },
    ],
    recentPosts: [
      { id: 'p1', text: 'Anyone else struggling with AVL tree rotations? Found a great visualization tool.', board: 'Classes', boardColor: '#4B50F8', likes: 34, comments: 12, time: '2h ago' },
      { id: 'p2', text: 'Pro tip: the third floor of Robarts is the best study spot after 8 PM.', board: 'Campus Life', boardColor: '#3DAB73', likes: 89, comments: 23, time: '1d ago' },
      { id: 'p3', text: 'Created a poll about extending library hours — go vote!', board: 'Polls', boardColor: '#F1973B', likes: 56, comments: 8, time: '3d ago' },
    ],
    messagingPermission: 'allowed',
  },
  '2': {
    id: '2', handle: 'CampusExplorer', initial: 'C', gradIdx: 1,
    university: 'University of Toronto', year: '2nd Year', major: 'Psychology',
    bio: 'Exploring the intersection of mind and society. Love discussing research methods over bubble tea. Open to study groups and campus adventures!',
    isOnline: false,
    lookingFor: ['Study Buddies', 'Friends', 'Event Partners'],
    studyStyle: 'Flexible',
    interests: ['Psychology', 'Sociology', 'Photography', 'Mental Health', 'Travel', 'Yoga'],
    courses: ['PSY100', 'PSY201', 'SOC101', 'ANT100'],
    communities: ['Mental Health', 'Social', 'Photography Club'],
    reputation: 860,
    posts: 31, pollsCreated: 5, studySessions: 12, helpfulVotes: 198,
    memberSince: '2025',
    favoriteTopics: ['Research Methods', 'Social Psychology', 'Wellness'],
    availability: [
      { day: 'Tue', time: '1–3 PM' }, { day: 'Thu', time: '11 AM–1 PM' },
    ],
    publicSessions: [
      { title: 'PSY201 Stats Review', time: 'Thu, 11 AM', course: 'PSY201' },
    ],
    recentPosts: [
      { id: 'p1', text: 'Just finished reading "Thinking, Fast and Slow" — highly recommend for any psych major!', board: 'Classes', boardColor: '#4B50F8', likes: 45, comments: 15, time: '5h ago' },
      { id: 'p2', text: 'Best bubble tea spots near campus? Drop your recs below!', board: 'Food', boardColor: '#F1973B', likes: 67, comments: 41, time: '2d ago' },
    ],
    messagingPermission: 'request_required',
  },
};

// ─── Shared context (mock — pretend viewer shares some context) ───────────────
const VIEWER_COURSES = ['CSC263', 'MAT237', 'STA247'];
const VIEWER_COMMUNITIES = ['Classes', 'Career & Co-op'];
const VIEWER_INTERESTS = ['Computer Science', 'Coffee', 'Gaming'];

function getSharedItems(profile: UserProfile) {
  return {
    courses: profile.courses.filter((c) => VIEWER_COURSES.includes(c)),
    communities: profile.communities.filter((c) => VIEWER_COMMUNITIES.includes(c)),
    interests: profile.interests.filter((i) => VIEWER_INTERESTS.includes(i)),
    mutualFriends: Math.floor(Math.random() * 8) + 1,
  };
}

// ─── Glass card wrapper ───────────────────────────────────────────────────────
function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[gc.shadow, style]}>
      <View style={gc.card}>{children}</View>
    </View>
  );
}

const gc = StyleSheet.create({
  shadow: {
    marginHorizontal: 22, borderRadius: 20,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.68)',
    padding: 16, gap: 12,
  },
});

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ title, icon, color }: { title: string; icon?: string; color?: string }) {
  const c = color ?? T.accentPurple;
  return (
    <View style={sl.row}>
      {icon && (
        <View style={[sl.iconCircle, { backgroundColor: c + '12' }]}>
          <Ionicons name={icon as any} size={13} color={c} />
        </View>
      )}
      <Text style={sl.title}>{title}</Text>
    </View>
  );
}

const sl = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, marginBottom: 8 },
  iconCircle: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
});

// ─── More options sheet ───────────────────────────────────────────────────────
function MoreSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const actions = [
    { icon: 'flag-outline', label: 'Report User', color: T.accentOrange },
    { icon: 'ban-outline', label: 'Block User', color: T.accentPink },
    { icon: 'volume-mute-outline', label: 'Mute Posts', color: T.textMuted },
    { icon: 'person-remove-outline', label: 'Remove Connection', color: T.accentPink },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={mo.backdrop} onPress={onClose} />
      <View style={mo.sheet}>
        <View style={mo.handle} />
        {actions.map((a) => (
          <TouchableOpacity
            key={a.label} activeOpacity={0.7}
            onPress={() => { onClose(); Alert.alert(a.label, `${a.label} will be available in an upcoming update.`); }}
            style={mo.row}
          >
            <View style={[mo.iconCircle, { backgroundColor: a.color + '10' }]}>
              <Ionicons name={a.icon as any} size={17} color={a.color} />
            </View>
            <Text style={[mo.rowText, a.label.includes('Block') || a.label.includes('Remove') ? { color: T.accentPink } : {}]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
      </View>
    </Modal>
  );
}

const mo = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 10,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconCircle: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowText: { fontSize: 15, fontWeight: '600', color: T.textPrimary },
});

// ─── DM Initiation Sheet ────────────────────────────────────────────────────
function DMInitiationSheet({
  visible, onClose, profile, shared, onSend,
}: {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile;
  shared: ReturnType<typeof getSharedItems>;
  onSend: (message: string) => void;
}) {
  const [customMsg, setCustomMsg] = useState('');
  const isRequestMode = profile.messagingPermission === 'request_required';

  const activeMessage = customMsg.trim();

  const handleSend = () => {
    if (!activeMessage) return;
    onSend(activeMessage);
    setCustomMsg('');
  };

  // Shared context summary line
  const contextParts: string[] = [];
  if (shared.courses.length > 0) contextParts.push(`${shared.courses.length} shared course${shared.courses.length > 1 ? 's' : ''}`);
  if (shared.interests.length > 0) contextParts.push(`${shared.interests.length} shared interest${shared.interests.length > 1 ? 's' : ''}`);
  if (shared.mutualFriends > 0) contextParts.push(`${shared.mutualFriends} mutual`);
  const contextSummary = contextParts.join(' · ');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={dm.backdrop} onPress={onClose} />
      <View style={dm.sheet}>
        <View style={dm.handle} />

        {/* Recipient info */}
        <View style={dm.recipientRow}>
          <LinearGradient colors={AVATAR_GRADS[profile.gradIdx % AVATAR_GRADS.length]} style={dm.recipientAvatar}>
            <Text style={dm.recipientInitial}>{profile.initial}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={dm.recipientHandle}>@{profile.handle}</Text>
            {contextSummary ? (
              <View style={dm.contextRow}>
                <Ionicons name="git-compare-outline" size={11} color={T.accentPurple} />
                <Text style={dm.contextText}>{contextSummary}</Text>
              </View>
            ) : (
              <Text style={dm.contextText}>{profile.year} · {profile.major}</Text>
            )}
          </View>
        </View>

        {/* Message input */}
        <View style={dm.customSection}>
          <Text style={dm.sectionLabel}>Your message</Text>
          <View style={dm.inputWrap}>
            <TextInput
              style={dm.input}
              placeholder={`Say hi to @${profile.handle}...`}
              placeholderTextColor={T.textMuted}
              value={customMsg}
              onChangeText={setCustomMsg}
              multiline
              maxLength={500}
            />
            <Text style={dm.charCount}>{customMsg.length}/500</Text>
          </View>
        </View>

        {/* Privacy notice */}
        <View style={dm.privacyRow}>
          <Ionicons name="shield-checkmark-outline" size={12} color={T.textMuted} />
          <Text style={dm.privacyText}>
            {isRequestMode
              ? 'This will be sent as a message request. They can accept or decline.'
              : 'Messages are private between you two. You can block or report at any time.'}
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          activeOpacity={activeMessage ? 0.85 : 1}
          onPress={handleSend}
          disabled={!activeMessage}
          style={{ borderRadius: 16, overflow: 'hidden', opacity: activeMessage ? 1 : 0.4 }}
        >
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dm.ctaBtn}>
            <Ionicons name={isRequestMode ? 'paper-plane' : 'chatbubble'} size={16} color="#fff" />
            <Text style={dm.ctaText}>{isRequestMode ? 'Send Request' : 'Start Chat'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 34,
    maxHeight: '88%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 16 },

  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  recipientAvatar: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B4DFF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
  },
  recipientInitial: { fontSize: 20, fontWeight: '800', color: '#fff' },
  recipientHandle: { fontSize: 16, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  contextText: { fontSize: 12, color: T.textMuted, fontWeight: '500' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: T.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },

  customSection: { gap: 8, marginBottom: 12 },
  inputWrap: {
    backgroundColor: 'rgba(17,17,17,0.025)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
  },
  input: { fontSize: 14, color: T.textPrimary, lineHeight: 20, minHeight: 44, maxHeight: 100, paddingVertical: 0 },
  charCount: { fontSize: 10, color: T.textMuted, textAlign: 'right', marginTop: 4 },

  privacyRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    paddingVertical: 10, marginBottom: 12,
  },
  privacyText: { flex: 1, fontSize: 11, color: T.textMuted, lineHeight: 15 },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 16,
  },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
});

// ─── Restricted Sheet ─────────────────────────────────────────────────────────
function RestrictedSheet({
  visible, onClose, profile, onFollow,
}: {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile;
  onFollow: () => void;
}) {
  const alternatives = [
    { icon: 'person-add-outline', label: 'Follow / Connect', desc: 'Stay updated on their activity', color: T.accentBlue, onPress: () => { onFollow(); onClose(); } },
    { icon: 'people-outline', label: 'Send Study Invite', desc: 'Invite them to a study session', color: T.accentPurple, onPress: () => { onClose(); Alert.alert('Study Invite', 'Study invites will be available in an upcoming update.'); } },
    { icon: 'globe-outline', label: 'Join Same Community', desc: 'Connect through shared communities', color: T.accentGreen, onPress: () => { onClose(); } },
    { icon: 'heart-outline', label: 'React to Their Posts', desc: 'Show support on their content', color: T.accentPink, onPress: () => { onClose(); } },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={rs.backdrop} onPress={onClose} />
      <View style={rs.sheet}>
        <View style={rs.handle} />

        {/* Explanation */}
        <View style={rs.headerRow}>
          <View style={rs.lockIcon}>
            <Ionicons name="lock-closed" size={20} color={T.accentOrange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={rs.headerTitle}>Direct messages unavailable</Text>
            <Text style={rs.headerDesc}>
              @{profile.handle} has limited who can message them. Here are other ways to connect:
            </Text>
          </View>
        </View>

        {/* Alternatives */}
        <View style={rs.alternatives}>
          {alternatives.map((a) => (
            <TouchableOpacity key={a.label} activeOpacity={0.7} onPress={a.onPress} style={rs.altCard}>
              <View style={[rs.altIcon, { backgroundColor: a.color + '10' }]}>
                <Ionicons name={a.icon as any} size={18} color={a.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={rs.altLabel}>{a.label}</Text>
                <Text style={rs.altDesc}>{a.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={T.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </View>
    </Modal>
  );
}

const rs = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 34,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  lockIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: T.accentOrange + '10',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  headerDesc: { fontSize: 13, color: T.textSecondary, lineHeight: 18, marginTop: 3 },
  alternatives: { gap: 8 },
  altCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16,
    backgroundColor: 'rgba(17,17,17,0.02)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.05)',
  },
  altIcon: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  altLabel: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  altDesc: { fontSize: 11, color: T.textMuted, marginTop: 1 },
});

// ─── Request Sent Toast ───────────────────────────────────────────────────────
function RequestSentToast({ visible, onDone, onCancel, onViewProfile }: {
  visible: boolean;
  onDone: () => void;
  onCancel: () => void;
  onViewProfile: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 30, duration: 400, useNativeDriver: true }),
        ]).start(onDone);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[rst.wrap, { opacity, transform: [{ translateY }] }]}>
      <View style={rst.card}>
        <View style={rst.topRow}>
          <View style={rst.checkCircle}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={rst.title}>Message request sent</Text>
            <Text style={rst.subtitle}>You'll be notified when they respond</Text>
          </View>
        </View>
        <View style={rst.actionsRow}>
          <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={rst.actionBtn}>
            <Ionicons name="close-circle-outline" size={14} color={T.accentPink} />
            <Text style={[rst.actionText, { color: T.accentPink }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onViewProfile} activeOpacity={0.7} style={rst.actionBtn}>
            <Ionicons name="person-outline" size={14} color={T.accentPurple} />
            <Text style={[rst.actionText, { color: T.accentPurple }]}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const rst = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 100, left: 22, right: 22,
    zIndex: 999,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20, padding: 16, gap: 12,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.accentGreen,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800', color: T.textPrimary },
  subtitle: { fontSize: 12, color: T.textMuted, marginTop: 1 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
    backgroundColor: 'rgba(17,17,17,0.03)', borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
  actionText: { fontSize: 12, fontWeight: '700' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function PublicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const [showMore, setShowMore] = useState(false);
  const [following, setFollowing] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showDMSheet, setShowDMSheet] = useState(false);
  const [showRestricted, setShowRestricted] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const profile = PROFILES[id ?? '1'] ?? PROFILES['1'];
  const shared = getSharedItems(profile);
  const hasShared = shared.courses.length > 0 || shared.communities.length > 0 || shared.interests.length > 0;

  const handleMessagePress = () => {
    if (profile.messagingPermission === 'restricted') {
      setShowRestricted(true);
    } else {
      setShowDMSheet(true);
    }
  };

  const handleSendMessage = (message: string) => {
    setShowDMSheet(false);
    if (profile.messagingPermission === 'request_required') {
      setRequestSent(true);
    } else {
      router.push(`/dm/${profile.id}` as any);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={BG} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.62)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' }}>
              <Ionicons name="chevron-back" size={18} color="#5F6472" />
            </TouchableOpacity>
          </View>
          <ProfileHeaderSkeleton />
          <SkeletonList count={3} type="row" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={BG} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={ui.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={ui.navBtn}>
            <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
          </TouchableOpacity>
          <Text style={ui.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => setShowMore(true)} activeOpacity={0.7} style={ui.navBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={T.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50, gap: 16 }}>

          {/* ═══ SECTION 1: Profile Header ═══ */}
          <GlassCard>
            <View style={hd.row}>
              <View>
                <LinearGradient colors={AVATAR_GRADS[profile.gradIdx % AVATAR_GRADS.length]} style={hd.avatar}>
                  <View style={hd.avatarInner}>
                    <Text style={hd.avatarLetter}>{profile.initial}</Text>
                  </View>
                </LinearGradient>
                {profile.isOnline && <View style={hd.onlineDot} />}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={hd.handle}>@{profile.handle}</Text>
                <View style={hd.metaRow}>
                  <Ionicons name="shield-checkmark" size={12} color={T.accentGreen} />
                  <Text style={hd.university}>{profile.university}</Text>
                </View>
                <Text style={hd.yearMajor}>{profile.year} · {profile.major}</Text>
                {profile.isOnline ? (
                  <View style={hd.statusRow}>
                    <View style={hd.statusDotSmall} />
                    <Text style={hd.statusText}>Online now</Text>
                  </View>
                ) : (
                  <Text style={hd.statusTextOff}>Last seen recently</Text>
                )}
              </View>
            </View>

            {/* action buttons */}
            <View style={hd.actions}>
              <TouchableOpacity activeOpacity={0.85} onPress={handleMessagePress} style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
                <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={hd.actionPrimary}>
                  <Ionicons name="chatbubble" size={14} color="#fff" />
                  <Text style={hd.actionPrimaryText}>Message</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} style={hd.actionSecondary}>
                <Ionicons name="people" size={14} color={T.accentPurple} />
                <Text style={hd.actionSecondaryText}>Study Invite</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setFollowing(!following)}
                style={[hd.actionIcon, following && { backgroundColor: T.accentBlue + '14' }]}
              >
                <Ionicons
                  name={following ? 'checkmark' : 'person-add'}
                  size={16}
                  color={following ? T.accentBlue : T.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* ═══ SECTION 2: Bio & Social Intent ═══ */}
          <GlassCard>
            <Text style={bi.bio}>{profile.bio}</Text>
            <View style={bi.tagRow}>
              {profile.lookingFor.map((tag) => (
                <View key={tag} style={bi.lookingTag}>
                  <Ionicons name="search" size={10} color={T.accentBlue} />
                  <Text style={bi.lookingText}>{tag}</Text>
                </View>
              ))}
            </View>
            <View style={bi.studyRow}>
              <View style={bi.studyBadge}>
                <Ionicons name="book-outline" size={12} color={T.accentPurple} />
                <Text style={bi.studyText}>{profile.studyStyle} learner</Text>
              </View>
              <View style={bi.memberBadge}>
                <Ionicons name="calendar-outline" size={11} color={T.textMuted} />
                <Text style={bi.memberText}>Since {profile.memberSince}</Text>
              </View>
            </View>
          </GlassCard>

          {/* ═══ SECTION 3: Interest Badges ═══ */}
          <View>
            <SectionLabel title="Interests" icon="heart-outline" color={T.accentPink} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={it.scroll}>
              {profile.interests.map((tag) => {
                const isShared = shared.interests.includes(tag);
                return (
                  <View key={tag} style={[it.badge, isShared && it.badgeShared]}>
                    {isShared && <Ionicons name="link" size={10} color={T.accentPurple} />}
                    <Text style={[it.badgeText, isShared && { color: T.accentPurple }]}>{tag}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* ═══ SECTION 4: Shared Context Panel ═══ */}
          {hasShared && (
            <GlassCard>
              <View style={sc.headerRow}>
                <Ionicons name="git-compare-outline" size={14} color={T.accentPurple} />
                <Text style={sc.headerText}>You have things in common</Text>
              </View>

              {shared.courses.length > 0 && (
                <View style={sc.group}>
                  <Text style={sc.groupLabel}>Shared Courses</Text>
                  <View style={sc.chipRow}>
                    {shared.courses.map((c) => (
                      <TouchableOpacity key={c} activeOpacity={0.7} style={sc.chip}>
                        <Ionicons name="school" size={11} color={T.accentBlue} />
                        <Text style={sc.chipText}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {shared.communities.length > 0 && (
                <View style={sc.group}>
                  <Text style={sc.groupLabel}>Shared Communities</Text>
                  <View style={sc.chipRow}>
                    {shared.communities.map((c) => (
                      <TouchableOpacity key={c} activeOpacity={0.7} style={sc.chip}>
                        <Ionicons name="people" size={11} color={T.accentGreen} />
                        <Text style={sc.chipText}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {shared.interests.length > 0 && (
                <View style={sc.group}>
                  <Text style={sc.groupLabel}>Shared Interests</Text>
                  <View style={sc.chipRow}>
                    {shared.interests.map((i) => (
                      <View key={i} style={[sc.chip, { borderColor: T.accentPurple + '25' }]}>
                        <Ionicons name="heart" size={11} color={T.accentPurple} />
                        <Text style={[sc.chipText, { color: T.accentPurple }]}>{i}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={sc.mutualRow}>
                <View style={sc.mutualAvatars}>
                  {[0, 1, 2].map((i) => (
                    <LinearGradient key={i} colors={AVATAR_GRADS[(i + 2) % AVATAR_GRADS.length]} style={sc.mutualDot} />
                  ))}
                </View>
                <Text style={sc.mutualText}>{shared.mutualFriends} mutual connections</Text>
              </View>
            </GlassCard>
          )}

          {/* ═══ SECTION 5: Activity Summary ═══ */}
          <View>
            <SectionLabel title="Activity" icon="pulse-outline" color={T.accentGreen} />
            <GlassCard style={{ marginHorizontal: 0 }}>
              <View style={ac.statsGrid}>
                <View style={ac.statBox}>
                  <Text style={ac.statNum}>{profile.posts}</Text>
                  <Text style={ac.statLabel}>Posts</Text>
                </View>
                <View style={ac.statBox}>
                  <Text style={ac.statNum}>{profile.pollsCreated}</Text>
                  <Text style={ac.statLabel}>Polls</Text>
                </View>
                <View style={ac.statBox}>
                  <Text style={ac.statNum}>{profile.studySessions}</Text>
                  <Text style={ac.statLabel}>Sessions</Text>
                </View>
                <View style={ac.statBox}>
                  <Text style={ac.statNum}>{profile.helpfulVotes}</Text>
                  <Text style={ac.statLabel}>Helpful</Text>
                </View>
              </View>

              {/* reputation tier */}
              {(() => {
                const xp = profile.posts * 10 + profile.helpfulVotes + profile.reputation;
                const t = getUserTier(xp);
                return (
                  <View style={ac.repRow}>
                    <LinearGradient colors={t.current.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ac.tierIcon}>
                      <Ionicons name={t.current.icon as any} size={14} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <Text style={[ac.repLabel, { color: t.current.color, fontWeight: '800' }]}>{t.current.name}</Text>
                        <Text style={ac.repValue}>{xp.toLocaleString()} XP</Text>
                      </View>
                      <View style={ac.repTrack}>
                        <View style={[ac.repFill, { width: `${Math.max(8, t.progress * 100)}%`, backgroundColor: t.current.color }]} />
                      </View>
                    </View>
                  </View>
                );
              })()}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowActivity(!showActivity)}
                style={ac.expandBtn}
              >
                <Text style={ac.expandText}>{showActivity ? 'Less details' : 'More details'}</Text>
                <Ionicons name={showActivity ? 'chevron-up' : 'chevron-down'} size={14} color={T.accentPurple} />
              </TouchableOpacity>

              {showActivity && (
                <View style={ac.detailGrid}>
                  <View style={ac.detailRow}>
                    <Ionicons name="trending-up" size={13} color={T.accentGreen} />
                    <Text style={ac.detailText}>Active contributor</Text>
                  </View>
                  <View style={ac.detailRow}>
                    <Ionicons name="shield-checkmark" size={13} color={T.accentBlue} />
                    <Text style={ac.detailText}>Trusted community member</Text>
                  </View>
                  <View style={ac.detailRow}>
                    <Ionicons name="star" size={13} color={T.accentOrange} />
                    <Text style={ac.detailText}>Top 15% in helpfulness</Text>
                  </View>
                </View>
              )}
            </GlassCard>
          </View>

          {/* ═══ SECTION 6: Availability ═══ */}
          <View>
            <SectionLabel title="Availability" icon="time-outline" color={T.accentBlue} />
            <GlassCard style={{ marginHorizontal: 0 }}>
              <View style={av.slots}>
                {profile.availability.map((slot, i) => (
                  <View key={i} style={av.slot}>
                    <Text style={av.slotDay}>{slot.day}</Text>
                    <Text style={av.slotTime}>{slot.time}</Text>
                  </View>
                ))}
              </View>

              {profile.publicSessions.length > 0 && (
                <>
                  <Text style={av.sessionLabel}>Upcoming Sessions</Text>
                  {profile.publicSessions.map((s, i) => (
                    <View key={i} style={av.sessionCard}>
                      <View style={av.sessionPill}>
                        <Text style={av.sessionPillText}>{s.course}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={av.sessionTitle}>{s.title}</Text>
                        <Text style={av.sessionTime}>{s.time}</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}

              <TouchableOpacity activeOpacity={0.85} style={{ borderRadius: 12, overflow: 'hidden', marginTop: 4 }}>
                <LinearGradient colors={[T.accentPurple + '14', T.accentBlue + '14']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={av.suggestBtn}>
                  <Ionicons name="calendar-outline" size={14} color={T.accentPurple} />
                  <Text style={av.suggestText}>Suggest Study Session</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* ═══ SECTION 7: Courses & Academic ═══ */}
          <View>
            <SectionLabel title="Courses" icon="school-outline" color={T.accentBlue} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 8 }}>
              {profile.courses.map((c) => {
                const isShared = shared.courses.includes(c);
                return (
                  <TouchableOpacity key={c} activeOpacity={0.7} style={[cr.chip, isShared && cr.chipShared]}>
                    <Ionicons name="school" size={12} color={isShared ? T.accentBlue : T.textSecondary} />
                    <Text style={[cr.chipText, isShared && { color: T.accentBlue, fontWeight: '700' }]}>{c}</Text>
                    {isShared && <View style={cr.sharedDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {profile.favoriteTopics.length > 0 && (
              <View style={cr.topicRow}>
                <Text style={cr.topicLabel}>Frequently discusses</Text>
                <View style={cr.topicChips}>
                  {profile.favoriteTopics.map((t) => (
                    <View key={t} style={cr.topicChip}>
                      <Text style={cr.topicChipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* ═══ SECTION 8: Recent Posts ═══ */}
          <View>
            <SectionLabel title="Recent Activity" icon="document-text-outline" color={T.accentOrange} />
            <View style={{ gap: 10, marginHorizontal: 22 }}>
              {profile.recentPosts.map((post) => (
                <TouchableOpacity key={post.id} activeOpacity={0.82} style={rp.shadow}>
                  <View style={rp.card}>
                    <View style={rp.topRow}>
                      <View style={[rp.boardPill, { backgroundColor: post.boardColor + '10', borderColor: post.boardColor + '25' }]}>
                        <Text style={[rp.boardText, { color: post.boardColor }]}>{post.board}</Text>
                      </View>
                      <Text style={rp.time}>{post.time}</Text>
                    </View>
                    <Text style={rp.text} numberOfLines={2}>{post.text}</Text>
                    <View style={rp.statsRow}>
                      <View style={rp.stat}>
                        <Ionicons name="heart-outline" size={12} color={T.textMuted} />
                        <Text style={rp.statText}>{post.likes}</Text>
                      </View>
                      <View style={rp.stat}>
                        <Ionicons name="chatbubble-outline" size={12} color={T.textMuted} />
                        <Text style={rp.statText}>{post.comments}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity activeOpacity={0.7} style={rp.viewAll}>
              <Text style={rp.viewAllText}>View All Activity</Text>
              <Ionicons name="chevron-forward" size={14} color={T.accentPurple} />
            </TouchableOpacity>
          </View>

        </ScrollView>

        <MoreSheet visible={showMore} onClose={() => setShowMore(false)} />

        <DMInitiationSheet
          visible={showDMSheet}
          onClose={() => setShowDMSheet(false)}
          profile={profile}
          shared={shared}
          onSend={handleSendMessage}
        />

        <RestrictedSheet
          visible={showRestricted}
          onClose={() => setShowRestricted(false)}
          profile={profile}
          onFollow={() => setFollowing(true)}
        />

        <RequestSentToast
          visible={requestSent}
          onDone={() => setRequestSent(false)}
          onCancel={() => { setRequestSent(false); Alert.alert('Cancelled', 'Message request cancelled.'); }}
          onViewProfile={() => setRequestSent(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Header UI ────────────────────────────────────────────────────────────────
const ui = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
});

// ─── Profile header ───────────────────────────────────────────────────────────
const hd = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B4DFF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 14, elevation: 6,
  },
  avatarInner: {
    width: 66, height: 66, borderRadius: 33,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)',
  },
  avatarLetter: { fontSize: 28, fontWeight: '800', color: T.white },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: T.accentGreen, borderWidth: 3, borderColor: '#fff',
  },
  handle: { fontSize: 18, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  university: { fontSize: 11, fontWeight: '600', color: T.accentGreen },
  yearMajor: { fontSize: 12, color: T.textSecondary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.accentGreen },
  statusText: { fontSize: 10, fontWeight: '600', color: T.accentGreen },
  statusTextOff: { fontSize: 10, color: T.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 14,
  },
  actionPrimaryText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  actionSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 11, borderRadius: 14,
    backgroundColor: T.accentPurple + '10',
    borderWidth: 1, borderColor: T.accentPurple + '20',
  },
  actionSecondaryText: { fontSize: 13, fontWeight: '700', color: T.accentPurple },
  actionIcon: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(17,17,17,0.04)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
});

// ─── Bio section ──────────────────────────────────────────────────────────────
const bi = StyleSheet.create({
  bio: { fontSize: 13, color: T.textSecondary, lineHeight: 19 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  lookingTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
    backgroundColor: T.accentBlue + '0C', borderWidth: 1, borderColor: T.accentBlue + '18',
  },
  lookingText: { fontSize: 11, fontWeight: '600', color: T.accentBlue },
  studyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  studyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99,
    backgroundColor: T.accentPurple + '0C',
  },
  studyText: { fontSize: 10, fontWeight: '700', color: T.accentPurple },
  memberBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99,
    backgroundColor: 'rgba(17,17,17,0.03)',
  },
  memberText: { fontSize: 10, fontWeight: '600', color: T.textMuted },
});

// ─── Interests ────────────────────────────────────────────────────────────────
const it = StyleSheet.create({
  scroll: { paddingHorizontal: 22, gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.50)',
  },
  badgeShared: { backgroundColor: T.accentPurple + '0C', borderColor: T.accentPurple + '25' },
  badgeText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
});

// ─── Shared context ───────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerText: { fontSize: 13, fontWeight: '700', color: T.accentPurple },
  group: { gap: 6 },
  groupLabel: { fontSize: 10, fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
    backgroundColor: 'rgba(17,17,17,0.03)', borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
  chipText: { fontSize: 11, fontWeight: '600', color: T.textSecondary },
  mutualRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  mutualAvatars: { flexDirection: 'row' },
  mutualDot: { width: 20, height: 20, borderRadius: 10, marginLeft: -4, borderWidth: 2, borderColor: '#fff' },
  mutualText: { fontSize: 11, fontWeight: '600', color: T.textMuted },
});

// ─── Activity ─────────────────────────────────────────────────────────────────
const ac = StyleSheet.create({
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14,
    backgroundColor: 'rgba(17,17,17,0.025)', borderWidth: 1, borderColor: 'rgba(17,17,17,0.04)',
  },
  statNum: { fontSize: 17, fontWeight: '800', color: T.textPrimary },
  statLabel: { fontSize: 9, fontWeight: '600', color: T.textMuted, marginTop: 1, textTransform: 'uppercase' },
  repRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tierIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  repLabel: { fontSize: 12, fontWeight: '600', color: T.textMuted },
  repValue: { fontSize: 11, fontWeight: '700', color: T.textSecondary },
  repTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(17,17,17,0.04)', overflow: 'hidden' },
  repFill: { height: 5, borderRadius: 3 },
  expandBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 6,
  },
  expandText: { fontSize: 12, fontWeight: '600', color: T.accentPurple },
  detailGrid: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 12, color: T.textSecondary },
});

// ─── Availability ─────────────────────────────────────────────────────────────
const av = StyleSheet.create({
  slots: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  slot: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: T.accentBlue + '08', borderWidth: 1, borderColor: T.accentBlue + '15',
    alignItems: 'center',
  },
  slotDay: { fontSize: 11, fontWeight: '800', color: T.accentBlue },
  slotTime: { fontSize: 10, color: T.textSecondary, marginTop: 1 },
  sessionLabel: { fontSize: 10, fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  sessionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(17,17,17,0.04)',
  },
  sessionPill: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: T.accentPurple + '10',
  },
  sessionPillText: { fontSize: 10, fontWeight: '700', color: T.accentPurple },
  sessionTitle: { fontSize: 13, fontWeight: '600', color: T.textPrimary },
  sessionTime: { fontSize: 11, color: T.textMuted },
  suggestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 12,
  },
  suggestText: { fontSize: 13, fontWeight: '700', color: T.accentPurple },
});

// ─── Courses ──────────────────────────────────────────────────────────────────
const cr = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.50)',
  },
  chipShared: { backgroundColor: T.accentBlue + '08', borderColor: T.accentBlue + '20' },
  chipText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  sharedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.accentBlue },
  topicRow: { marginTop: 12, paddingHorizontal: 22, gap: 6 },
  topicLabel: { fontSize: 10, fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  topicChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topicChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
    backgroundColor: T.accentOrange + '0C',
  },
  topicChipText: { fontSize: 11, fontWeight: '600', color: T.accentOrange },
});

// ─── Recent posts ─────────────────────────────────────────────────────────────
const rp = StyleSheet.create({
  shadow: {
    borderRadius: 16,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  card: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.65)',
    padding: 14, gap: 8,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  boardPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 1 },
  boardText: { fontSize: 10, fontWeight: '700' },
  time: { fontSize: 10, color: T.textMuted },
  text: { fontSize: 13, color: T.textPrimary, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: T.textMuted, fontWeight: '500' },
  viewAll: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 12,
  },
  viewAllText: { fontSize: 13, fontWeight: '700', color: T.accentPurple },
});
