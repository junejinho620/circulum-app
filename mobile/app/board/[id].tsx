import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  green:         '#2BC77A',
};

const BG:  [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];

const GLASS = 'rgba(255,255,255,0.62)';
const GLASS_BORDER = 'rgba(255,255,255,0.55)';
const GLASS_LIGHT = 'rgba(255,255,255,0.48)';

// ─── Avatar gradient palette ──────────────────────────────────────────────────
const AVATAR_GRADS: [string, string][] = [
  ['#4B50F8', '#8B4DFF'],
  ['#8B4DFF', '#E655C5'],
  ['#6B7CFF', '#4B50F8'],
  ['#E655C5', '#C47EFF'],
  ['#C47EFF', '#6B7CFF'],
  ['#3DAB73', '#2BC77A'],
  ['#F87171', '#FB923C'],
];

function avatarGrad(handle: string): [string, string] {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) % AVATAR_GRADS.length;
  return AVATAR_GRADS[h];
}

// ─── Board definitions ────────────────────────────────────────────────────────
type BoardData = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  totalMembers: number;
  totalPosts: number;
};

const BOARD_MAP: Record<string, BoardData> = {
  '1': { id: '1', name: 'Free Board', description: 'Anything goes — questions, thoughts, campus life, random musings.', icon: 'chatbubbles-outline', color: '#4B50F8', totalMembers: 2400, totalPosts: 1840 },
  '2': { id: '2', name: 'Classes', description: 'Course discussions, exam prep, notes sharing, study groups, and academic help.', icon: 'school-outline', color: '#4B50F8', totalMembers: 3200, totalPosts: 4120 },
  '3': { id: '3', name: 'Housing', description: 'Roommate search, sublets, dorm reviews, and all things housing.', icon: 'home-outline', color: '#6B7CFF', totalMembers: 890, totalPosts: 620 },
  '4': { id: '4', name: 'Events', description: 'Campus events, club meetups, parties, workshops, and career fairs.', icon: 'calendar-outline', color: '#8B4DFF', totalMembers: 650, totalPosts: 380 },
  '5': { id: '5', name: 'Marketplace', description: 'Buy, sell, and trade textbooks, electronics, furniture, and more.', icon: 'pricetag-outline', color: '#F1973B', totalMembers: 720, totalPosts: 510 },
  '6': { id: '6', name: 'Social', description: 'Meet people, find hangout buddies, join clubs, and make friends on campus.', icon: 'people-outline', color: '#3DAB73', totalMembers: 540, totalPosts: 290 },
};

// ─── Communities within each board ────────────────────────────────────────────
type CommunityItem = {
  id: string;
  name: string;
  subtitle: string;
  members: number;
  activeNow: number;
  newToday: number;
  isJoined?: boolean;
};

const BOARD_COMMUNITIES: Record<string, CommunityItem[]> = {
  '1': [
    { id: 'fb-general', name: 'General Chat', subtitle: 'Talk about anything campus-related', members: 2400, activeNow: 45, newToday: 31, isJoined: true },
    { id: 'fb-rants', name: 'Rant & Vent', subtitle: 'Let it out — no judgement', members: 1120, activeNow: 18, newToday: 14 },
    { id: 'fb-advice', name: 'Advice Board', subtitle: 'Ask for advice from fellow students', members: 890, activeNow: 9, newToday: 7 },
    { id: 'fb-memes', name: 'Memes', subtitle: 'Campus memes and humor', members: 1640, activeNow: 22, newToday: 19, isJoined: true },
  ],
  '2': [
    { id: 'csc108', name: 'CSC108', subtitle: 'Intro to Computer Programming', members: 420, activeNow: 18, newToday: 8, isJoined: true },
    { id: 'mat237', name: 'MAT237', subtitle: 'Multivariable Calculus', members: 310, activeNow: 24, newToday: 12 },
    { id: 'csc263', name: 'CSC263', subtitle: 'Data Structures & Analysis', members: 280, activeNow: 15, newToday: 6, isJoined: true },
    { id: 'eco101', name: 'ECO101', subtitle: 'Principles of Microeconomics', members: 390, activeNow: 12, newToday: 5 },
    { id: 'psy100', name: 'PSY100', subtitle: 'Intro to Psychology', members: 510, activeNow: 8, newToday: 3 },
    { id: 'sta257', name: 'STA257', subtitle: 'Probability & Statistics I', members: 220, activeNow: 10, newToday: 4 },
    { id: 'chm136', name: 'CHM136', subtitle: 'Introductory Organic Chemistry', members: 340, activeNow: 14, newToday: 7 },
    { id: 'phy131', name: 'PHY131', subtitle: 'Intro to Physics I', members: 290, activeNow: 6, newToday: 2 },
  ],
  '3': [
    { id: 'h-sublets', name: 'Sublets & Leases', subtitle: 'Find or post sublets and leases', members: 520, activeNow: 8, newToday: 3 },
    { id: 'h-roommates', name: 'Roommate Finder', subtitle: 'Find your next roommate', members: 430, activeNow: 6, newToday: 2, isJoined: true },
    { id: 'h-dorms', name: 'Dorm Life', subtitle: 'Residence hall discussions and tips', members: 380, activeNow: 4, newToday: 1 },
    { id: 'h-reviews', name: 'Landlord Reviews', subtitle: 'Rate and review landlords', members: 210, activeNow: 2, newToday: 1 },
  ],
  '4': [
    { id: 'e-parties', name: 'Parties & Nightlife', subtitle: "What's happening this weekend", members: 340, activeNow: 15, newToday: 5, isJoined: true },
    { id: 'e-career', name: 'Career Fairs', subtitle: 'Job fairs, networking, and career events', members: 280, activeNow: 4, newToday: 2 },
    { id: 'e-clubs', name: 'Club Events', subtitle: 'Student org meetups and activities', members: 310, activeNow: 8, newToday: 3 },
    { id: 'e-workshops', name: 'Workshops', subtitle: 'Skill-building sessions and seminars', members: 190, activeNow: 3, newToday: 1 },
  ],
  '5': [
    { id: 'm-textbooks', name: 'Textbooks', subtitle: 'Buy and sell course textbooks', members: 450, activeNow: 10, newToday: 4, isJoined: true },
    { id: 'm-electronics', name: 'Electronics', subtitle: 'Laptops, tablets, calculators', members: 310, activeNow: 5, newToday: 2 },
    { id: 'm-furniture', name: 'Furniture', subtitle: 'Desks, chairs, dorm essentials', members: 180, activeNow: 3, newToday: 1 },
    { id: 'm-free', name: 'Free Stuff', subtitle: 'Giving away items — first come first serve', members: 620, activeNow: 12, newToday: 6, isJoined: true },
  ],
  '6': [
    { id: 's-hangout', name: 'Hangout Buddies', subtitle: 'Find people to hang out with', members: 290, activeNow: 5, newToday: 3, isJoined: true },
    { id: 's-sports', name: 'Sports & Fitness', subtitle: 'Intramurals, gym partners, pickup games', members: 240, activeNow: 4, newToday: 2 },
    { id: 's-dating', name: 'Dating & Relationships', subtitle: 'Advice, stories, and connections', members: 380, activeNow: 8, newToday: 4 },
    { id: 's-intl', name: 'International Students', subtitle: 'Connect with the global campus community', members: 410, activeNow: 6, newToday: 2 },
  ],
};

// ─── Recent posts for the board (mixed from all communities) ─────────────────
type RecentPost = {
  id: string;
  communityName: string;
  author: string;
  title: string;
  timestamp: string;
  upvotes: number;
  commentCount: number;
  isHot?: boolean;
};

const BOARD_RECENT_POSTS: Record<string, RecentPost[]> = {
  '2': [
    { id: 'bp1', communityName: 'MAT237', author: 'AnonBio12', title: 'Anyone else think the exam grading was way off?', timestamp: '2h ago', upvotes: 142, commentCount: 38, isHot: true },
    { id: 'bp2', communityName: 'CSC263', author: 'VelvetStorm', title: 'Looking for a study group — midterm in 2 weeks', timestamp: '5h ago', upvotes: 34, commentCount: 21 },
    { id: 'bp3', communityName: 'CSC108', author: 'CosmicNova88', title: 'Free tutoring sessions at Robarts this week', timestamp: '4h ago', upvotes: 89, commentCount: 12 },
  ],
};

// ─── GradAvatar ───────────────────────────────────────────────────────────────
function GradAvatar({ handle, size = 36 }: { handle: string; size?: number }) {
  const grad = avatarGrad(handle);
  return (
    <LinearGradient
      colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: size * 0.36, fontWeight: '800', color: '#fff' }}>
        {handle[0].toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

// ─── BoardHero ────────────────────────────────────────────────────────────────
function BoardHero({ board, communityCount }: { board: BoardData; communityCount: number }) {
  return (
    <View style={bh.card}>
      <View style={bh.topRow}>
        <View style={[bh.iconWrap, { backgroundColor: board.color + '14' }]}>
          <Ionicons name={board.icon as any} size={28} color={board.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={bh.name}>{board.name}</Text>
          <Text style={bh.description}>{board.description}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={bh.statsRow}>
        <View style={bh.stat}>
          <Text style={bh.statValue}>{communityCount}</Text>
          <Text style={bh.statLabel}>communities</Text>
        </View>
        <View style={bh.statDivider} />
        <View style={bh.stat}>
          <Text style={bh.statValue}>{board.totalMembers.toLocaleString()}</Text>
          <Text style={bh.statLabel}>total members</Text>
        </View>
        <View style={bh.statDivider} />
        <View style={bh.stat}>
          <Text style={bh.statValue}>{board.totalPosts.toLocaleString()}</Text>
          <Text style={bh.statLabel}>total posts</Text>
        </View>
      </View>
    </View>
  );
}

const bh = StyleSheet.create({
  card: {
    backgroundColor: GLASS,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: GLASS_BORDER,
    padding: 22, gap: 16,
    shadowColor: '#8B4DFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.4 },
  description: { fontSize: 13, color: T.textSecondary, lineHeight: 19, marginTop: 4 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.40)',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.50)',
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 16, fontWeight: '800', color: T.textPrimary },
  statLabel: { fontSize: 10, fontWeight: '600', color: T.textMuted, letterSpacing: 0.2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(17,17,17,0.06)' },
});

// ─── SearchBar ────────────────────────────────────────────────────────────────
function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <View style={srch.card}>
      <Ionicons name="search-outline" size={16} color={T.textMuted} />
      <TextInput
        style={srch.input}
        placeholder={placeholder}
        placeholderTextColor={T.textMuted}
      />
    </View>
  );
}

const srch = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GLASS_LIGHT,
    borderRadius: 14,
    borderWidth: 1, borderColor: GLASS_BORDER,
    paddingHorizontal: 14, height: 42,
  },
  input: { flex: 1, fontSize: 13, color: T.textPrimary },
});

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {count !== undefined && (
        <View style={sh.countPill}>
          <Text style={sh.countText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  title: { fontSize: 15, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.2 },
  countPill: {
    backgroundColor: 'rgba(139,77,255,0.10)',
    borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2,
  },
  countText: { fontSize: 11, fontWeight: '700', color: T.accentPurple },
});

// ─── CommunityListCard ────────────────────────────────────────────────────────
function CommunityListCard({ item, boardColor, onPress }: {
  item: CommunityItem;
  boardColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={cl.card}>
        <View style={cl.row}>
          {/* Icon */}
          <View style={[cl.iconCircle, { backgroundColor: boardColor + '12' }]}>
            <Text style={[cl.iconText, { color: boardColor }]}>{item.name.slice(0, 3)}</Text>
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <View style={cl.nameRow}>
              <Text style={cl.name}>{item.name}</Text>
              {item.isJoined && (
                <View style={cl.joinedBadge}>
                  <Ionicons name="checkmark-circle" size={11} color={T.accentBlue} />
                </View>
              )}
            </View>
            <Text style={cl.subtitle} numberOfLines={1}>{item.subtitle}</Text>
          </View>

          {/* Stats */}
          <View style={cl.statsCol}>
            <View style={cl.miniStat}>
              <Text style={cl.miniValue}>{item.members}</Text>
              <Ionicons name="people-outline" size={10} color={T.textMuted} />
            </View>
            {item.activeNow > 0 && (
              <View style={cl.miniStat}>
                <View style={cl.liveDot} />
                <Text style={cl.liveText}>{item.activeNow}</Text>
              </View>
            )}
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={14} color={T.textMuted} />
        </View>

        {/* New today indicator */}
        {item.newToday > 0 && (
          <View style={[cl.newBadge, { backgroundColor: boardColor + '0C', borderColor: boardColor + '1A' }]}>
            <Text style={[cl.newText, { color: boardColor }]}>{item.newToday} new today</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const cl = StyleSheet.create({
  card: {
    backgroundColor: GLASS,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    padding: 16, gap: 8,
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 12, fontWeight: '800', letterSpacing: -0.3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 15, fontWeight: '700', color: T.textPrimary },
  subtitle: { fontSize: 12, color: T.textMuted, marginTop: 2 },
  joinedBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(75,80,248,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  statsCol: { alignItems: 'flex-end', gap: 3 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  miniValue: { fontSize: 11, fontWeight: '600', color: T.textMuted },
  liveDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: T.green,
    shadowColor: T.green, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 3,
  },
  liveText: { fontSize: 10, fontWeight: '700', color: T.green },
  newBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99, borderWidth: 1,
    marginLeft: 56,
  },
  newText: { fontSize: 10, fontWeight: '700' },
});

// ─── RecentPostRow ────────────────────────────────────────────────────────────
function RecentPostRow({ post, onPress }: { post: RecentPost; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={rp.card}>
        <View style={rp.row}>
          <GradAvatar handle={post.author} size={28} />
          <View style={{ flex: 1 }}>
            <View style={rp.meta}>
              <View style={rp.communityPill}>
                <Text style={rp.communityText}>{post.communityName}</Text>
              </View>
              <Text style={rp.timestamp}>{post.timestamp}</Text>
              {post.isHot && <Ionicons name="flame" size={11} color={T.accentPink} />}
            </View>
            <Text style={rp.title} numberOfLines={1}>{post.title}</Text>
          </View>
        </View>
        <View style={rp.stats}>
          <View style={rp.statItem}>
            <Ionicons name="arrow-up-circle-outline" size={13} color={T.textMuted} />
            <Text style={rp.statText}>{post.upvotes}</Text>
          </View>
          <View style={rp.statItem}>
            <Ionicons name="chatbubble-outline" size={12} color={T.textMuted} />
            <Text style={rp.statText}>{post.commentCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const rp = StyleSheet.create({
  card: {
    backgroundColor: GLASS_LIGHT,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    padding: 14, gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  communityPill: {
    backgroundColor: 'rgba(75,80,248,0.08)',
    borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2,
  },
  communityText: { fontSize: 10, fontWeight: '700', color: T.accentBlue },
  timestamp: { fontSize: 10, color: T.textMuted },
  title: { fontSize: 13, fontWeight: '700', color: T.textPrimary, marginTop: 3 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 14, marginLeft: 38 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, fontWeight: '600', color: T.textMuted },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BoardDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const board = BOARD_MAP[id || '1'] || BOARD_MAP['1'];
  const communities = BOARD_COMMUNITIES[id || '1'] || [];
  const recentPosts = BOARD_RECENT_POSTS[id || ''] || [];

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.nav}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={s.navBtn}>
            <Ionicons name="chevron-back" size={18} color={T.textPrimary} />
          </TouchableOpacity>

          <View style={s.navCenter}>
            <View style={[s.navDot, { backgroundColor: board.color }]} />
            <Text style={s.navTitle} numberOfLines={1}>{board.name}</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={s.navBtn}>
            <Ionicons name="ellipsis-horizontal" size={17} color={T.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Board hero */}
          <BoardHero board={board} communityCount={communities.length} />

          {/* Search */}
          <SearchBar placeholder={`Search in ${board.name}…`} />

          {/* Recent activity (only for boards with cross-community posts) */}
          {recentPosts.length > 0 && (
            <>
              <SectionHeader title="Recent Activity" />
              {recentPosts.map(post => (
                <RecentPostRow
                  key={post.id}
                  post={post}
                  onPress={() => router.push(`/post/${post.id}` as any)}
                />
              ))}
            </>
          )}

          {/* Communities list */}
          <SectionHeader title="Communities" count={communities.length} />
          {communities.map(item => (
            <CommunityListCard
              key={item.id}
              item={item}
              boardColor={board.color}
              onPress={() => router.push(`/community/${item.id}` as any)}
            />
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Root styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  nav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 16,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: GLASS,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: GLASS_BORDER,
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  navCenter: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingHorizontal: 8,
  },
  navDot: { width: 8, height: 8, borderRadius: 4 },
  navTitle: {
    fontSize: 15, fontWeight: '700',
    color: T.textPrimary, letterSpacing: -0.2,
  },

  scroll: {
    paddingHorizontal: 20, paddingTop: 4,
    paddingBottom: 16, gap: 16,
  },
});
