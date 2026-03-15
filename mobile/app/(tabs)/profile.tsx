import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
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
  white: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.46)',
  glassFill: 'rgba(255,255,255,0.64)',
  glassFillStrong: 'rgba(255,255,255,0.78)',
};

const BG: [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];
const AVATAR: [string, string, string] = ['#6B7CFF', '#8B4DFF', '#F08CCF'];

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

function BadgePill({
  icon,
  label,
  earned,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  earned: boolean;
}) {
  return (
    <View style={[s.badgePill, !earned && s.badgePillLocked]}>
      <View style={[s.badgeIcon, !earned && s.badgeIconLocked]}>
        <Ionicons
          name={icon}
          size={14}
          color={earned ? T.accentPurple : T.textMuted}
        />
      </View>
      <Text style={[s.badgeLabel, !earned && s.badgeLabelLocked]}>{label}</Text>
    </View>
  );
}

function MenuAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.84} onPress={onPress} style={s.actionItem}>
      <View style={s.actionIcon}>
        <Ionicons name={icon} size={17} color={T.accentBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.actionTitle}>{title}</Text>
        <Text style={s.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={T.textMuted} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

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
  const reputation = profile.totalKarma;
  const reputationProgress = Math.min(reputation / 2000, 1);
  const posts = profile.postCount;
  const replies = profile.commentCount;
  const upvotes = profile.totalKarma;
  const discussionsJoined = Math.max(3, Math.round((profile.postCount + profile.commentCount) / 2));
  const earnedBadges = [
    { icon: 'sparkles-outline' as const, label: 'First Spark', earned: posts > 0 },
    { icon: 'chatbubble-ellipses-outline' as const, label: 'Conversation Starter', earned: posts >= 5 },
    { icon: 'arrow-up-circle-outline' as const, label: 'Trusted Voice', earned: upvotes >= 250 },
    { icon: 'people-outline' as const, label: 'Campus Connector', earned: discussionsJoined >= 18 },
  ];
  const unlockedCount = earnedBadges.filter((badge) => badge.earned).length;

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
            onPress={() => Alert.alert('Settings', user ? 'Settings modules can be wired next.' : 'Sign in first to access profile settings.')}
          >
            <BlurView intensity={34} tint="light" style={s.settingsBtn}>
              <Ionicons name="settings-outline" size={18} color={T.textSecondary} />
            </BlurView>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
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
                </View>
              </View>

              <View style={s.reputationRow}>
                <View>
                  <Text style={s.reputationLabel}>Reputation</Text>
                  <Text style={s.reputationValue}>{reputation}</Text>
                </View>
                <View style={s.reputationMeta}>
                  <Text style={s.reputationMetaText}>Campus trust building</Text>
                  <Text style={s.reputationMetaSub}>Member since {joinedYear}</Text>
                </View>
              </View>

              <View style={s.progressTrack}>
                <LinearGradient
                  colors={CTA}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.progressFill, { width: `${Math.max(12, reputationProgress * 100)}%` }]}
                />
              </View>
            </BlurView>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.statsRow}
          >
            <StatPill value={String(posts)} label="Posts" />
            <StatPill value={String(replies)} label="Replies" />
            <StatPill value={String(upvotes)} label="Upvotes received" />
            <StatPill value={String(discussionsJoined)} label="Discussions joined" />
          </ScrollView>

          <View style={s.cardShadow}>
            <BlurView intensity={38} tint="light" style={s.moduleCard}>
              <SectionTitle title="Achievements" action={`${unlockedCount}/4 unlocked`} />
              <Text style={s.moduleIntro}>
                Consistent, respectful contribution builds your anonymous reputation on campus.
              </Text>
              <View style={s.badgeGrid}>
                {earnedBadges.map((badge) => (
                  <BadgePill
                    key={badge.label}
                    icon={badge.icon}
                    label={badge.label}
                    earned={badge.earned}
                  />
                ))}
              </View>
            </BlurView>
          </View>

          <View style={s.cardShadow}>
            <BlurView intensity={38} tint="light" style={s.moduleCard}>
              <SectionTitle title="Contribution Snapshot" />
              <View style={s.snapshotRow}>
                <View style={s.snapshotBlock}>
                  <Text style={s.snapshotNumber}>{Math.max(1, Math.round(posts * 0.7 + replies * 0.25))}</Text>
                  <Text style={s.snapshotLabel}>helpful moments this month</Text>
                </View>
                <View style={s.snapshotDivider} />
                <View style={s.snapshotBlock}>
                  <Text style={s.snapshotNumber}>{Math.max(1, Math.round(upvotes / 64))}</Text>
                  <Text style={s.snapshotLabel}>people positively impacted</Text>
                </View>
              </View>
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
                  onPress={() => Alert.alert('Saved Threads', 'Saved threads screen can be wired next.')}
                />
                <View style={s.actionDivider} />
                <MenuAction
                  icon="school-outline"
                  title="Academic footprint"
                  subtitle="See your course and discussion history"
                  onPress={() => Alert.alert('Academic Footprint', 'Academic footprint screen can be wired next.')}
                />
                <View style={s.actionDivider} />
                <MenuAction
                  icon="notifications-outline"
                  title="Notification preferences"
                  subtitle="Control replies, mentions, and alerts"
                  onPress={() => Alert.alert('Notifications', 'Notification preferences can be wired next.')}
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
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  reputationLabel: {
    fontSize: 12,
    color: T.textMuted,
    fontWeight: '600',
  },
  reputationValue: {
    marginTop: 2,
    fontSize: 28,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: -0.8,
  },
  reputationMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  reputationMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.textSecondary,
  },
  reputationMetaSub: {
    fontSize: 11,
    color: T.textMuted,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.56)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
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
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(139,77,255,0.14)',
  },
  badgePillLocked: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  badgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,77,255,0.10)',
  },
  badgeIconLocked: {
    backgroundColor: 'rgba(17,17,17,0.05)',
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: T.textSecondary,
  },
  badgeLabelLocked: {
    color: T.textMuted,
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  snapshotBlock: {
    flex: 1,
    gap: 6,
  },
  snapshotNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: -0.6,
  },
  snapshotLabel: {
    fontSize: 12,
    lineHeight: 18,
    color: T.textSecondary,
  },
  snapshotDivider: {
    width: 1,
    height: 52,
    backgroundColor: 'rgba(17,17,17,0.08)',
  },
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
