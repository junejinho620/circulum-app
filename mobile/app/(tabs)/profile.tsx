import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Easing,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../src/store/auth.store';

const T = {
  textPrimary: '#111111',
  textSecondary: '#5F6472',
  textMuted: '#8A90A2',
  accentBlue: '#4B50F8',
  accentPurple: '#8B4DFF',
  accentPink: '#E655C5',
  accentGreen: '#3DAB73',
  accentOrange: '#F1973B',
  white: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.46)',
  glassFill: 'rgba(255,255,255,0.64)',
  glassFillStrong: 'rgba(255,255,255,0.78)',
};

const BG: [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];
const AVATAR: [string, string, string] = ['#6B7CFF', '#8B4DFF', '#F08CCF'];

// ─── Reputation tiers ────────────────────────────────────────────────────────
type Tier = {
  name: string;
  icon: string;
  minXP: number;
  color: string;
  grad: [string, string];
};

const TIERS: Tier[] = [
  { name: 'Newcomer',     icon: 'leaf-outline',     minXP: 0,    color: '#8A90A2', grad: ['#8A90A2', '#B0B5C3'] },
  { name: 'Contributor',  icon: 'chatbubble-outline', minXP: 100,  color: '#4B50F8', grad: ['#4B50F8', '#6B7CFF'] },
  { name: 'Regular',      icon: 'star-outline',     minXP: 500,  color: '#8B4DFF', grad: ['#8B4DFF', '#C47EFF'] },
  { name: 'Trusted',      icon: 'shield-checkmark-outline', minXP: 1500, color: '#3DAB73', grad: ['#3DAB73', '#6BCB95'] },
  { name: 'Campus Leader', icon: 'trophy-outline',  minXP: 3500, color: '#F1973B', grad: ['#F1973B', '#FFB347'] },
  { name: 'Legend',        icon: 'diamond-outline',  minXP: 7000, color: '#E655C5', grad: ['#E655C5', '#FF88DD'] },
];

function getTier(xp: number): { current: Tier; next: Tier | null; progress: number; xpToNext: number } {
  let idx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].minXP) { idx = i; break; }
  }
  const current = TIERS[idx];
  const next = TIERS[idx + 1] ?? null;
  const xpInTier = xp - current.minXP;
  const tierSpan = next ? next.minXP - current.minXP : 1;
  const progress = next ? Math.min(xpInTier / tierSpan, 1) : 1;
  const xpToNext = next ? next.minXP - xp : 0;
  return { current, next, progress, xpToNext };
}

// ─── Achievement definitions ─────────────────────────────────────────────────
type Achievement = {
  id: string;
  icon: string;
  label: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  color: string;
};

function getAchievements(posts: number, replies: number, upvotes: number, discussions: number, streak: number): Achievement[] {
  return [
    { id: 'first-spark',   icon: 'sparkles-outline',              label: 'First Spark',          description: 'Create your first post',        target: 1,   current: Math.min(posts, 1),        xpReward: 25,  color: T.accentBlue },
    { id: 'convo-starter',  icon: 'chatbubble-ellipses-outline',  label: 'Conversation Starter', description: 'Create 5 posts',                target: 5,   current: Math.min(posts, 5),        xpReward: 50,  color: T.accentPurple },
    { id: 'prolific',       icon: 'create-outline',               label: 'Prolific Writer',      description: 'Create 25 posts',               target: 25,  current: Math.min(posts, 25),       xpReward: 150, color: T.accentBlue },
    { id: 'helpful',        icon: 'hand-left-outline',            label: 'Helpful Hand',         description: 'Leave 10 replies',              target: 10,  current: Math.min(replies, 10),     xpReward: 50,  color: T.accentGreen },
    { id: 'reply-machine',  icon: 'chatbubbles-outline',          label: 'Reply Machine',        description: 'Leave 50 replies',              target: 50,  current: Math.min(replies, 50),     xpReward: 200, color: T.accentGreen },
    { id: 'trusted-voice',  icon: 'arrow-up-circle-outline',      label: 'Trusted Voice',        description: 'Receive 250 upvotes',           target: 250, current: Math.min(upvotes, 250),    xpReward: 150, color: T.accentOrange },
    { id: 'campus-star',    icon: 'star-outline',                 label: 'Campus Star',          description: 'Receive 1,000 upvotes',         target: 1000, current: Math.min(upvotes, 1000),  xpReward: 500, color: T.accentOrange },
    { id: 'connector',      icon: 'people-outline',               label: 'Campus Connector',     description: 'Join 15 discussions',            target: 15,  current: Math.min(discussions, 15), xpReward: 75,  color: T.accentPurple },
    { id: 'streak-3',       icon: 'flame-outline',                label: 'On Fire',              description: '3-day activity streak',          target: 3,   current: Math.min(streak, 3),       xpReward: 30,  color: T.accentPink },
    { id: 'streak-7',       icon: 'bonfire-outline',              label: 'Week Warrior',         description: '7-day activity streak',          target: 7,   current: Math.min(streak, 7),       xpReward: 100, color: T.accentPink },
  ];
}

// ─── XP Activity Feed (mock) ─────────────────────────────────────────────────
type XPEvent = { id: string; label: string; xp: number; icon: string; time: string; color: string };

const RECENT_XP: XPEvent[] = [
  { id: '1', label: 'Post upvoted by 3 people',    xp: 15,  icon: 'arrow-up',        time: '2m ago',  color: T.accentBlue },
  { id: '2', label: 'Replied in "Exam curve"',      xp: 5,   icon: 'chatbubble',      time: '15m ago', color: T.accentPurple },
  { id: '3', label: 'Daily streak extended',         xp: 10,  icon: 'flame',           time: '1h ago',  color: T.accentOrange },
  { id: '4', label: 'Earned "Helpful Hand"',         xp: 50,  icon: 'trophy',          time: '3h ago',  color: T.accentGreen },
  { id: '5', label: 'Created a new post',            xp: 10,  icon: 'create',          time: '5h ago',  color: T.accentBlue },
];

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action ? <Text style={s.sectionAction}>{action}</Text> : null}
    </View>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.statPillWrap}>
      <BlurView intensity={28} tint="light" style={s.statPill}>
        <Text style={s.statValue}>{value}</Text>
        <Text style={s.statLabel}>{label}</Text>
      </BlurView>
    </View>
  );
}

// ─── Tier Badge (in hero card) ───────────────────────────────────────────────
function TierBadge({ tier, xp, progress, xpToNext, nextTier, expanded, onPress }: {
  tier: Tier; xp: number; progress: number; xpToNext: number; nextTier: Tier | null;
  expanded: boolean; onPress: () => void;
}) {
  const animWidth = useRef(new Animated.Value(0)).current;
  const chevronRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    Animated.timing(chevronRotate, {
      toValue: expanded ? 1 : 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [expanded]);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View style={tb.wrap}>
        <View style={tb.topRow}>
          <LinearGradient colors={tier.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tb.iconCircle}>
            <Ionicons name={tier.icon as any} size={16} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={tb.labelRow}>
              <Text style={[tb.tierName, { color: tier.color }]}>{tier.name}</Text>
              <View style={tb.xpTapRow}>
                <Text style={tb.xpText}>{xp.toLocaleString()} XP</Text>
                <Animated.View style={{
                  transform: [{ rotate: chevronRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
                }}>
                  <Ionicons name="chevron-down" size={12} color={T.textMuted} />
                </Animated.View>
              </View>
            </View>
            {nextTier ? (
              <Text style={tb.nextText}>{xpToNext.toLocaleString()} XP to {nextTier.name}</Text>
            ) : (
              <Text style={[tb.nextText, { color: tier.color }]}>Max rank reached</Text>
            )}
          </View>
        </View>
        <View style={tb.track}>
          <Animated.View style={[tb.fill, {
            backgroundColor: tier.color,
            width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
        {nextTier && (
          <View style={tb.tierDots}>
            {TIERS.map((t, i) => (
              <View key={t.name} style={[tb.dot, { backgroundColor: xp >= t.minXP ? t.color : 'rgba(17,17,17,0.08)' }]} />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const tb = StyleSheet.create({
  wrap: { gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  tierName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  xpTapRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpText: { fontSize: 13, fontWeight: '700', color: T.textSecondary },
  nextText: { fontSize: 11, color: T.textMuted, fontWeight: '500' },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.56)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  tierDots: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

// ─── Streak Card ─────────────────────────────────────────────────────────────
function StreakCard({ currentStreak, bestStreak, weekActivity }: {
  currentStreak: number; bestStreak: number; weekActivity: boolean[];
}) {
  return (
    <View style={sk.card}>
      <View style={sk.topRow}>
        <View style={sk.flameWrap}>
          <Ionicons name="flame" size={20} color={currentStreak >= 3 ? T.accentOrange : T.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sk.streakNum}>{currentStreak} day streak</Text>
          <Text style={sk.bestText}>Best: {bestStreak} days</Text>
        </View>
        {currentStreak >= 7 && (
          <View style={sk.multiplierBadge}>
            <Ionicons name="flash" size={10} color={T.accentOrange} />
            <Text style={sk.multiplierText}>1.5x XP</Text>
          </View>
        )}
      </View>
      <View style={sk.weekRow}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <View key={i} style={sk.dayCol}>
            <View style={[sk.dayDot, weekActivity[i] && sk.dayDotActive]}>
              {weekActivity[i] && <Ionicons name="checkmark" size={10} color="#fff" />}
            </View>
            <Text style={[sk.dayLabel, weekActivity[i] && { color: T.accentGreen }]}>{day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  card: { gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flameWrap: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(241,151,59,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  streakNum: { fontSize: 16, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  bestText: { fontSize: 11, color: T.textMuted, fontWeight: '500' },
  multiplierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
    backgroundColor: 'rgba(241,151,59,0.10)', borderWidth: 1, borderColor: 'rgba(241,151,59,0.20)',
  },
  multiplierText: { fontSize: 10, fontWeight: '800', color: T.accentOrange },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  dayDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(17,17,17,0.04)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(17,17,17,0.06)',
  },
  dayDotActive: { backgroundColor: T.accentGreen, borderColor: T.accentGreen },
  dayLabel: { fontSize: 10, fontWeight: '600', color: T.textMuted },
});

// ─── Achievement Card (with progress) ────────────────────────────────────────
function AchievementCard({ achievement }: { achievement: Achievement }) {
  const earned = achievement.current >= achievement.target;
  const pct = Math.round((achievement.current / achievement.target) * 100);

  return (
    <View style={[ac.card, earned && ac.cardEarned]}>
      <View style={ac.topRow}>
        <View style={[ac.iconWrap, { backgroundColor: earned ? achievement.color + '15' : 'rgba(17,17,17,0.04)' }]}>
          <Ionicons name={achievement.icon as any} size={16} color={earned ? achievement.color : T.textMuted} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={ac.labelRow}>
            <Text style={[ac.label, earned && { color: T.textPrimary }]}>{achievement.label}</Text>
            {earned && <Ionicons name="checkmark-circle" size={14} color={T.accentGreen} />}
          </View>
          <Text style={ac.desc}>{achievement.description}</Text>
        </View>
        <View style={ac.xpBadge}>
          <Text style={[ac.xpText, { color: achievement.color }]}>+{achievement.xpReward}</Text>
        </View>
      </View>
      {!earned && (
        <View style={ac.progressRow}>
          <View style={ac.progressTrack}>
            <View style={[ac.progressFill, { width: `${pct}%`, backgroundColor: achievement.color }]} />
          </View>
          <Text style={ac.progressText}>{achievement.current}/{achievement.target}</Text>
        </View>
      )}
    </View>
  );
}

const ac = StyleSheet.create({
  card: {
    padding: 14, borderRadius: 18, gap: 10,
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
  },
  cardEarned: { backgroundColor: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.40)' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontSize: 13, fontWeight: '700', color: T.textMuted },
  desc: { fontSize: 11, color: T.textMuted },
  xpBadge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99,
    backgroundColor: 'rgba(17,17,17,0.03)',
  },
  xpText: { fontSize: 10, fontWeight: '800' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(17,17,17,0.05)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 10, fontWeight: '700', color: T.textMuted, minWidth: 28, textAlign: 'right' },
});

// ─── XP Event Row ────────────────────────────────────────────────────────────
function XPEventRow({ event }: { event: XPEvent }) {
  return (
    <View style={xr.row}>
      <View style={[xr.iconWrap, { backgroundColor: event.color + '10' }]}>
        <Ionicons name={event.icon as any} size={14} color={event.color} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={xr.label}>{event.label}</Text>
        <Text style={xr.time}>{event.time}</Text>
      </View>
      <Text style={[xr.xp, { color: event.color }]}>+{event.xp} XP</Text>
    </View>
  );
}

const xr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  iconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600', color: T.textPrimary },
  time: { fontSize: 10, color: T.textMuted },
  xp: { fontSize: 12, fontWeight: '800' },
});

function MenuAction({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.84}
      onPress={disabled ? undefined : onPress}
      style={[s.actionItem, disabled && { opacity: 0.45 }]}
    >
      <View style={s.actionIcon}>
        <Ionicons name={icon} size={17} color={T.accentBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.actionTitle}>{title}</Text>
        <Text style={s.actionSubtitle}>{subtitle}</Text>
      </View>
      {disabled ? (
        <View style={s.soonBadge}>
          <Text style={s.soonBadgeText}>Soon</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={T.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const handleLogout = () => {
    if (!user) {
      router.replace('/(auth)/welcome');
      return;
    }

    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const profile = user ?? {
    handle: 'AnonVisitor',
    university: { name: 'University of Toronto' },
    createdAt: new Date().toISOString(),
    totalKarma: 0,
    postCount: 0,
    commentCount: 0,
  };

  const joinedYear = new Date(profile.createdAt).getFullYear();
  const posts = profile.postCount;
  const replies = profile.commentCount;
  const upvotes = profile.totalKarma;
  const discussionsJoined = Math.max(3, Math.round((profile.postCount + profile.commentCount) / 2));

  // Gamification state (mock — will come from backend later)
  const currentStreak = 5;
  const bestStreak = 12;
  const weekActivity = [true, true, true, true, true, false, false];

  // XP calculation: posts=10xp, replies=5xp, upvotes=1xp, streak bonus
  const totalXP = posts * 10 + replies * 5 + upvotes + currentStreak * 10;
  const tier = getTier(totalXP);

  const achievements = getAchievements(posts, replies, upvotes, discussionsJoined, currentStreak);
  const unlockedCount = achievements.filter((a) => a.current >= a.target).length;
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [xpDetailOpen, setXpDetailOpen] = useState(false);

  const toggleXpDetail = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.create(280, 'easeInEaseOut', 'opacity'));
    setXpDetailOpen((v) => !v);
  }, []);
  const visibleAchievements = showAllAchievements ? achievements : achievements.slice(0, 4);

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[s.orb, s.orbTop]} />
      <View style={[s.orb, s.orbMid]} />
      <View style={[s.orb, s.orbBottom]} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={s.topBar}>
          <View style={s.topBarSpacer} />
          <Text style={s.topBarTitle}>Profile</Text>
          <TouchableOpacity
                    activeOpacity={0.86}
                    style={s.settingsWrap}
            onPress={() => router.push('/settings' as any)}
          >
            <BlurView intensity={34} tint="light" style={s.settingsBtn}>
              <Ionicons name="settings-outline" size={18} color={T.textSecondary} />
            </BlurView>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B4DFF" colors={['#8B4DFF']} />
          }
        >
          <View style={s.cardShadow}>
            <BlurView intensity={40} tint="light" style={s.heroCard}>
              <LinearGradient
                colors={['rgba(75,80,248,0.08)', 'rgba(139,77,255,0.03)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={s.heroTopRow}>
                <LinearGradient colors={AVATAR} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatarOuter}>
                  <View style={s.avatarInner}>
                    <Text style={s.avatarText}>{profile.handle.charAt(0).toUpperCase()}</Text>
                  </View>
                </LinearGradient>

                <View style={s.heroText}>
                  <Text style={s.handle}>{profile.handle}</Text>
                  <Text style={s.university}>{profile.university?.name ?? 'University of Toronto'}</Text>
                  <View style={s.verifiedRow}>
                    <Ionicons name="shield-checkmark" size={12} color={T.accentBlue} />
                    <Text style={s.verifiedText}>{user ? 'Anonymous identity protected' : 'Preview mode'}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push('/edit-profile' as any)}
                    style={s.editProfileBtn}
                  >
                    <Ionicons name="pencil" size={12} color={T.accentPurple} />
                    <Text style={s.editProfileText}>Edit Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TierBadge
                tier={tier.current}
                xp={totalXP}
                progress={tier.progress}
                xpToNext={tier.xpToNext}
                nextTier={tier.next}
                expanded={xpDetailOpen}
                onPress={toggleXpDetail}
              />

              {xpDetailOpen && (
                <View style={s.xpDetailExpand}>
                  <View style={s.xpDetailDivider} />

                  {/* Recent XP */}
                  <SectionTitle title="Recent XP" action="This week" />
                  <View style={{ gap: 0 }}>
                    {RECENT_XP.map((event, i) => (
                      <React.Fragment key={event.id}>
                        <XPEventRow event={event} />
                        {i < RECENT_XP.length - 1 && <View style={s.xpDivider} />}
                      </React.Fragment>
                    ))}
                  </View>

                  <View style={s.xpDetailDivider} />

                  {/* How You Earn XP */}
                  <SectionTitle title="How You Earn XP" />
                  <View style={s.xpBreakdown}>
                    {[
                      { icon: 'create-outline', label: 'Create a post', xp: '+10 XP', color: T.accentBlue },
                      { icon: 'chatbubble-outline', label: 'Leave a reply', xp: '+5 XP', color: T.accentPurple },
                      { icon: 'arrow-up-outline', label: 'Receive an upvote', xp: '+1 XP', color: T.accentGreen },
                      { icon: 'flame-outline', label: 'Daily streak bonus', xp: '+10 XP', color: T.accentOrange },
                      { icon: 'trophy-outline', label: 'Unlock achievement', xp: 'Varies', color: T.accentPink },
                    ].map((item) => (
                      <View key={item.label} style={s.xpRow}>
                        <View style={[s.xpRowIcon, { backgroundColor: item.color + '10' }]}>
                          <Ionicons name={item.icon as any} size={14} color={item.color} />
                        </View>
                        <Text style={s.xpRowLabel}>{item.label}</Text>
                        <Text style={[s.xpRowValue, { color: item.color }]}>{item.xp}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </BlurView>
          </View>

          {/* Stats row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.statsRow}
          >
            <StatPill value={String(posts)} label="Posts" />
            <StatPill value={String(replies)} label="Replies" />
            <StatPill value={String(upvotes)} label="Upvotes" />
            <StatPill value={String(discussionsJoined)} label="Discussions" />
          </ScrollView>

          {/* Streak */}
          <View style={s.cardShadow}>
            <BlurView intensity={38} tint="light" style={s.moduleCard}>
              <StreakCard
                currentStreak={currentStreak}
                bestStreak={bestStreak}
                weekActivity={weekActivity}
              />
            </BlurView>
          </View>

          {/* Achievements */}
          <View style={s.cardShadow}>
            <BlurView intensity={38} tint="light" style={s.moduleCard}>
              <SectionTitle title="Achievements" action={`${unlockedCount}/${achievements.length} unlocked`} />
              <View style={{ gap: 8 }}>
                {visibleAchievements.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </View>
              {achievements.length > 4 && (
                <TouchableOpacity
                  onPress={() => setShowAllAchievements(!showAllAchievements)}
                  style={s.showMoreBtn}
                  activeOpacity={0.7}
                >
                  <Text style={s.showMoreText}>
                    {showAllAchievements ? 'Show less' : `Show all ${achievements.length} achievements`}
                  </Text>
                  <Ionicons name={showAllAchievements ? 'chevron-up' : 'chevron-down'} size={14} color={T.accentPurple} />
                </TouchableOpacity>
              )}
            </BlurView>
          </View>

          <View style={s.cardShadow}>
            <BlurView intensity={38} tint="light" style={s.moduleCard}>
              <SectionTitle title="Quick Actions" />
              <View style={s.actionList}>
                <MenuAction
                  icon="bookmark-outline"
                  title="Saved threads"
                  subtitle="Keep your best campus finds close"
                  onPress={() => {}}
                  disabled
                />
                <View style={s.actionDivider} />
                <MenuAction
                  icon="school-outline"
                  title="Academic footprint"
                  subtitle="See your course and discussion history"
                  onPress={() => {}}
                  disabled
                />
                <View style={s.actionDivider} />
                <MenuAction
                  icon="notifications-outline"
                  title="Notification preferences"
                  subtitle="Control replies, mentions, and alerts"
                  onPress={() => router.push('/settings' as any)}
                />
              </View>
            </BlurView>
          </View>

          <View style={s.cardShadow}>
            <BlurView intensity={38} tint="light" style={s.safetyCard}>
              <View style={s.safetyIcon}>
                <Ionicons name="lock-closed-outline" size={18} color={T.accentPurple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.safetyTitle}>Anonymous by design</Text>
                <Text style={s.safetyBody}>
                  Your profile celebrates contribution and trust without revealing personal identity.
                </Text>
              </View>
            </BlurView>
          </View>

          <TouchableOpacity activeOpacity={0.86} onPress={handleLogout} style={s.logoutWrap}>
            <BlurView intensity={38} tint="light" style={s.logoutCard}>
              <Ionicons name={user ? 'log-out-outline' : 'log-in-outline'} size={18} color={T.accentPink} />
              <Text style={s.logoutText}>{user ? 'Log Out' : 'Sign In'}</Text>
            </BlurView>
          </TouchableOpacity>

          <Text style={s.version}>Circulum MVP v0.1.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 9999 },
  orbTop: {
    width: 260, height: 260, top: -80, right: -70,
    backgroundColor: '#F7D8E5', opacity: 0.42,
  },
  orbMid: {
    width: 180, height: 180, top: 280, left: -60,
    backgroundColor: '#D9CCFF', opacity: 0.24,
  },
  orbBottom: {
    width: 220, height: 220, bottom: 40, right: -60,
    backgroundColor: '#D5E7FF', opacity: 0.28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
  },
  topBarSpacer: { width: 38 },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: -0.3,
  },
  settingsWrap: { borderRadius: 19, overflow: 'hidden' },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.90)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  scroll: {
    paddingTop: 6,
    paddingBottom: 36,
    gap: 18,
  },
  cardShadow: {
    marginHorizontal: 22,
    borderRadius: 28,
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.glassBorder,
    padding: 22,
    gap: 18,
    backgroundColor: T.glassFill,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B4DFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  avatarInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
    color: T.white,
    letterSpacing: -0.6,
  },
  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 6, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
    backgroundColor: 'rgba(139,77,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.15)',
  },
  editProfileText: { fontSize: 11, fontWeight: '700', color: T.accentPurple },
  heroText: { flex: 1, gap: 4 },
  handle: {
    fontSize: 22,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: -0.5,
  },
  university: {
    fontSize: 13,
    color: T.textSecondary,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: T.accentBlue,
  },
  // (tier badge styles are in `tb` StyleSheet above)
  statsRow: {
    paddingHorizontal: 22,
    gap: 10,
  },
  statPillWrap: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  statPill: {
    minWidth: 108,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.glassBorder,
    backgroundColor: T.glassFillStrong,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: -0.4,
  },
  statLabel: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '600',
    color: T.textSecondary,
    textAlign: 'center',
  },
  moduleCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.glassBorder,
    padding: 20,
    backgroundColor: T.glassFill,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: T.accentPurple,
  },
  moduleIntro: {
    fontSize: 13,
    lineHeight: 20,
    color: T.textSecondary,
  },
  // XP detail expand (inside hero card)
  xpDetailExpand: { gap: 14 },
  xpDetailDivider: { height: 1, backgroundColor: 'rgba(17,17,17,0.06)', marginVertical: 2 },

  // Show more achievements button
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 6,
  },
  showMoreText: { fontSize: 12, fontWeight: '600', color: T.accentPurple },

  // XP divider between events
  xpDivider: { height: 1, backgroundColor: 'rgba(17,17,17,0.04)' },

  // XP breakdown
  xpBreakdown: { gap: 2 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  xpRowIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  xpRowLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: T.textPrimary },
  xpRowValue: { fontSize: 12, fontWeight: '800' },
  actionList: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(75,80,248,0.10)',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: T.textPrimary,
  },
  actionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: T.textSecondary,
  },
  actionDivider: {
    height: 1,
    backgroundColor: 'rgba(17,17,17,0.06)',
  },
  soonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(17,17,17,0.06)',
  },
  soonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: T.textMuted,
    letterSpacing: 0.2,
  },
  safetyCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.glassBorder,
    padding: 18,
    backgroundColor: T.glassFill,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  safetyIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,77,255,0.10)',
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: T.textPrimary,
  },
  safetyBody: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 19,
    color: T.textSecondary,
  },
  logoutWrap: {
    marginHorizontal: 22,
    borderRadius: 24,
    overflow: 'hidden',
  },
  logoutCard: {
    height: 56,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.46)',
    backgroundColor: 'rgba(255,255,255,0.66)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: T.accentPink,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: T.textMuted,
    marginTop: 2,
  },
});
