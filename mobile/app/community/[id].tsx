import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import EmptyState from '../../src/components/common/EmptyState';
import { FeedCardSkeleton, SkeletonList } from '../../src/components/common/Skeletons';
import SuccessToast from '../../src/components/common/SuccessToast';

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

// ─── Individual community data ───────────────────────────────────────────────
type CommunityData = {
  id: string;
  name: string;
  subtitle: string;
  board: string;
  boardColor: string;
  description: string;
  members: number;
  activeNow: number;
  postsToday: number;
  scope: string;
  rules: string[];
  tags: string[];
};

const COMMUNITY_MAP: Record<string, CommunityData> = {
  // Classes board communities
  'csc108': {
    id: 'csc108', name: 'CSC108', subtitle: 'Intro to Computer Programming',
    board: 'Classes', boardColor: '#4B50F8',
    description: 'Everything CSC108 — assignments, labs, exam prep, lecture discussions, and study groups.',
    members: 420, activeNow: 18, postsToday: 8, scope: 'Fall 2025',
    rules: ['No posting assignment solutions', 'Use spoiler tags for hints', 'Be patient with beginners'],
    tags: ['python', 'assignments', 'labs', 'exam', 'lecture-notes'],
  },
  'mat237': {
    id: 'mat237', name: 'MAT237', subtitle: 'Multivariable Calculus',
    board: 'Classes', boardColor: '#4B50F8',
    description: 'Multivariable calculus discussions — proofs, problem sets, midterm and final prep.',
    members: 310, activeNow: 24, postsToday: 12, scope: 'Fall 2025',
    rules: ['Show your work when asking for help', 'No full solutions to graded work', 'Share resources freely'],
    tags: ['proofs', 'problem-sets', 'midterm', 'final', 'office-hours'],
  },
  'csc263': {
    id: 'csc263', name: 'CSC263', subtitle: 'Data Structures & Analysis',
    board: 'Classes', boardColor: '#4B50F8',
    description: 'Algorithm design, data structures, complexity analysis. Study groups and problem discussions.',
    members: 280, activeNow: 15, postsToday: 6, scope: 'Fall 2025',
    rules: ['No assignment solutions before deadlines', 'Explain your reasoning', 'Help each other learn'],
    tags: ['algorithms', 'complexity', 'trees', 'graphs', 'study-group'],
  },
  'eco101': {
    id: 'eco101', name: 'ECO101', subtitle: 'Principles of Microeconomics',
    board: 'Classes', boardColor: '#4B50F8',
    description: 'Supply and demand, market structures, game theory. Exam prep and lecture notes.',
    members: 390, activeNow: 12, postsToday: 5, scope: 'Fall 2025',
    rules: ['Cite sources when sharing data', 'Respect differing economic views', 'Share past exams freely'],
    tags: ['supply-demand', 'market', 'midterm', 'textbook', 'lecture'],
  },
  'psy100': {
    id: 'psy100', name: 'PSY100', subtitle: 'Intro to Psychology',
    board: 'Classes', boardColor: '#4B50F8',
    description: 'Psychology fundamentals — cognition, behavior, neuroscience. Research participation and exam help.',
    members: 510, activeNow: 8, postsToday: 3, scope: 'Fall 2025',
    rules: ['No sharing SONA codes', 'Be mindful discussing mental health', 'Share study tips freely'],
    tags: ['cognition', 'neuroscience', 'research', 'exam', 'textbook'],
  },
  'sta257': {
    id: 'sta257', name: 'STA257', subtitle: 'Probability & Statistics I',
    board: 'Classes', boardColor: '#4B50F8',
    description: 'Probability distributions, random variables, limit theorems. Problem set discussions.',
    members: 220, activeNow: 10, postsToday: 4, scope: 'Fall 2025',
    rules: ['Show your attempt before asking', 'No full solutions to ungraded work', 'Share formula sheets'],
    tags: ['probability', 'distributions', 'problem-sets', 'exam'],
  },
  'chm136': {
    id: 'chm136', name: 'CHM136', subtitle: 'Introductory Organic Chemistry',
    board: 'Classes', boardColor: '#4B50F8',
    description: 'Organic chemistry — reaction mechanisms, lab reports, exam prep and study resources.',
    members: 340, activeNow: 14, postsToday: 7, scope: 'Fall 2025',
    rules: ['Safety first in lab discussions', 'Share reaction mechanism tips', 'No copying lab reports'],
    tags: ['mechanisms', 'lab', 'synthesis', 'exam', 'study-group'],
  },
  'phy131': {
    id: 'phy131', name: 'PHY131', subtitle: 'Intro to Physics I',
    board: 'Classes', boardColor: '#4B50F8',
    description: 'Mechanics, waves, thermodynamics. Problem discussions and exam prep.',
    members: 290, activeNow: 6, postsToday: 2, scope: 'Fall 2025',
    rules: ['Include diagrams when possible', 'Check units in your answers', 'Share practice problems'],
    tags: ['mechanics', 'waves', 'thermo', 'lab', 'exam'],
  },
  // Housing board communities
  'h-sublets': {
    id: 'h-sublets', name: 'Sublets & Leases', subtitle: 'Find or post sublets and leases',
    board: 'Housing', boardColor: '#6B7CFF',
    description: 'Post and find sublets, lease takeovers, and summer housing near campus.',
    members: 520, activeNow: 8, postsToday: 3, scope: 'University-wide',
    rules: ['Include price & location', 'No scams', 'Verify before paying'],
    tags: ['sublet', 'lease', 'summer', 'downtown', 'annex'],
  },
  'h-roommates': {
    id: 'h-roommates', name: 'Roommate Finder', subtitle: 'Find your next roommate',
    board: 'Housing', boardColor: '#6B7CFF',
    description: 'Looking for a roommate? Post your preferences and find your match.',
    members: 430, activeNow: 6, postsToday: 2, scope: 'University-wide',
    rules: ['Be honest about habits', 'Include budget range', 'Respect boundaries'],
    tags: ['roommate', 'preferences', 'budget', 'location'],
  },
  // Free Board communities
  'fb-general': {
    id: 'fb-general', name: 'General Chat', subtitle: 'Talk about anything campus-related',
    board: 'Free Board', boardColor: '#4B50F8',
    description: 'The go-to space for any campus topic — no rules on what to post, just be respectful.',
    members: 2400, activeNow: 45, postsToday: 31, scope: 'University-wide',
    rules: ['Be respectful', 'No spam', 'No personal attacks'],
    tags: ['campus', 'life', 'random', 'questions', 'thoughts'],
  },
  'fb-memes': {
    id: 'fb-memes', name: 'Memes', subtitle: 'Campus memes and humor',
    board: 'Free Board', boardColor: '#4B50F8',
    description: 'The finest campus memes. Keep it funny, keep it relatable.',
    members: 1640, activeNow: 22, postsToday: 19, scope: 'University-wide',
    rules: ['Keep it funny', 'No offensive content', 'OC encouraged'],
    tags: ['memes', 'humor', 'relatable', 'campus-life'],
  },
};

// ─── Mock posts ───────────────────────────────────────────────────────────────
type CommunityPost = {
  id: string;
  author: string;
  title: string;
  body: string;
  timestamp: string;
  upvotes: number;
  commentCount: number;
  isPinned?: boolean;
  isHot?: boolean;
  tag?: string;
};

// Posts adapt based on which community the user is viewing
function getPostsForCommunity(id: string): CommunityPost[] {
  if (id === 'mat237') return [
    { id: 'mp1', author: 'AnonBio12', title: 'Anyone else think the exam grading was way off this semester?', body: "Got my midterm back and lost 8 points on a question I had completely correct. The TA wrote 'insufficient justification'.", timestamp: '2h ago', upvotes: 142, commentCount: 38, isHot: true, tag: 'grades' },
    { id: 'mp2', author: 'SilverMaple33', title: 'Grade appeal process — what actually worked?', body: "I've heard mixed things about going through the registrar vs emailing the prof directly.", timestamp: '7h ago', upvotes: 56, commentCount: 15, tag: 'advice' },
    { id: 'mp3', author: 'PrismaticFox', title: 'Problem Set 5 — anyone stuck on Q3?', body: 'The epsilon-delta proof for the multivariable limit is killing me. Any hints?', timestamp: '1d ago', upvotes: 28, commentCount: 19, tag: 'problem-sets' },
  ];
  if (id === 'csc263') return [
    { id: 'cp1', author: 'VelvetStorm', title: 'Looking for a study group — midterm in 2 weeks', body: 'Algorithm design & analysis — I want to do weekly practice sessions. Anyone interested?', timestamp: '5h ago', upvotes: 34, commentCount: 21, tag: 'study-group' },
    { id: 'cp2', author: 'AquaSpectra', title: 'Red-black tree rotations explained simply', body: 'I made a visual guide for left/right rotations that helped me finally get it.', timestamp: '1d ago', upvotes: 89, commentCount: 8, isPinned: true, tag: 'algorithms' },
    { id: 'cp3', author: 'CosmicNova88', title: 'Average-case vs worst-case — when does it matter?', body: 'Prof emphasized this in lecture but I still feel unclear about when to analyze each.', timestamp: '2d ago', upvotes: 41, commentCount: 14 },
  ];
  if (id === 'csc108') return [
    { id: 'cp4', author: 'CosmicNova88', title: 'Free tutoring sessions at Robarts this week', body: 'Math/CS tutoring available Mon-Fri 4-6pm in Room 2100. Organized by the Math Union.', timestamp: '4h ago', upvotes: 89, commentCount: 12, isPinned: true, tag: 'resources' },
    { id: 'cp5', author: 'BlueMoonTide', title: 'How to approach the recursion assignment?', body: "I understand the concept but I can't figure out the base case for Q2.", timestamp: '8h ago', upvotes: 23, commentCount: 17, tag: 'assignments' },
  ];
  // Generic fallback posts
  return [
    { id: 'gp1', author: 'AnonBio12', title: 'Welcome to the community!', body: 'Feel free to post questions, share resources, and help each other out.', timestamp: '1d ago', upvotes: 45, commentCount: 8, isPinned: true },
    { id: 'gp2', author: 'VelvetStorm', title: 'Any tips for newcomers?', body: 'Just joined — what should I know about this community?', timestamp: '3h ago', upvotes: 12, commentCount: 5 },
  ];
}

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

// ─── CommunityHero ────────────────────────────────────────────────────────────
function CommunityHero({ community, joined, onJoin }: {
  community: CommunityData;
  joined: boolean;
  onJoin: () => void;
}) {
  return (
    <View style={ch.card}>
      {/* Identity */}
      <View style={ch.identityRow}>
        <View style={[ch.iconWrap, { backgroundColor: community.boardColor + '14' }]}>
          <Text style={[ch.iconCode, { color: community.boardColor }]}>
            {community.name.slice(0, 3)}
          </Text>
          <Text style={[ch.iconNum, { color: community.boardColor }]}>
            {community.name.slice(3)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ch.name}>{community.name}</Text>
          <Text style={ch.subtitle}>{community.subtitle}</Text>
        </View>
      </View>

      {/* Board breadcrumb + scope */}
      <View style={ch.breadcrumbRow}>
        <View style={[ch.boardPill, { backgroundColor: community.boardColor + '0C', borderColor: community.boardColor + '1A' }]}>
          <Ionicons name="folder-outline" size={10} color={community.boardColor} />
          <Text style={[ch.boardText, { color: community.boardColor }]}>{community.board}</Text>
        </View>
        <View style={ch.scopePill}>
          <Ionicons name="calendar-outline" size={10} color={T.textMuted} />
          <Text style={ch.scopeText}>{community.scope}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={ch.description}>{community.description}</Text>

      {/* Stats */}
      <View style={ch.statsRow}>
        <View style={ch.stat}>
          <Text style={ch.statValue}>{community.members.toLocaleString()}</Text>
          <Text style={ch.statLabel}>members</Text>
        </View>
        <View style={ch.statDivider} />
        <View style={ch.stat}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={ch.liveDot} />
            <Text style={ch.statValue}>{community.activeNow}</Text>
          </View>
          <Text style={ch.statLabel}>active now</Text>
        </View>
        <View style={ch.statDivider} />
        <View style={ch.stat}>
          <Text style={ch.statValue}>{community.postsToday}</Text>
          <Text style={ch.statLabel}>posts today</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={ch.actionsRow}>
        <TouchableOpacity onPress={onJoin} activeOpacity={0.85} style={{ flex: 1 }}>
          {joined ? (
            <View style={ch.joinedBtn}>
              <Ionicons name="checkmark-circle" size={16} color={T.accentBlue} />
              <Text style={ch.joinedText}>Joined</Text>
            </View>
          ) : (
            <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ch.joinBtn}>
              <Ionicons name="add-circle-outline" size={16} color={T.white} />
              <Text style={ch.joinText}>Join Community</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={ch.actionIcon}>
          <Ionicons name="notifications-outline" size={17} color={T.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={ch.actionIcon}>
          <Ionicons name="share-outline" size={17} color={T.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  card: {
    backgroundColor: GLASS,
    borderRadius: 26, borderWidth: 1.5, borderColor: GLASS_BORDER,
    padding: 22, gap: 14,
    shadowColor: '#8B4DFF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10, shadowRadius: 24, elevation: 8,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  iconCode: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  iconNum: { fontSize: 12, fontWeight: '700', marginTop: -2 },
  name: { fontSize: 22, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: T.textSecondary, marginTop: 2 },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boardPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1,
  },
  boardText: { fontSize: 10, fontWeight: '700' },
  scopePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(17,17,17,0.03)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
  scopeText: { fontSize: 10, fontWeight: '600', color: T.textMuted },
  description: { fontSize: 14, color: T.textSecondary, lineHeight: 21 },
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
  liveDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: T.green,
    shadowColor: T.green, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 4,
  },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, height: 44, borderRadius: 14,
    shadowColor: '#4B50F8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  joinText: { fontSize: 14, fontWeight: '700', color: T.white },
  joinedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(75,80,248,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(75,80,248,0.18)',
  },
  joinedText: { fontSize: 14, fontWeight: '700', color: T.accentBlue },
  actionIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1, borderColor: GLASS_BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Tags strip ───────────────────────────────────────────────────────────────
function TagsStrip({ tags, color }: { tags: string[]; color: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}>
      {tags.map(tag => (
        <View key={tag} style={[tagS.chip, { backgroundColor: color + '0A', borderColor: color + '18' }]}>
          <Text style={[tagS.chipText, { color }]}>#{tag}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const tagS = StyleSheet.create({
  chip: { paddingHorizontal: 10, height: 28, borderRadius: 99, borderWidth: 1, justifyContent: 'center' },
  chipText: { fontSize: 11, fontWeight: '700' },
});

// ─── Feed controls ────────────────────────────────────────────────────────────
type FeedSort = 'hot' | 'new' | 'top';

function FeedControls({ sort, onSort, postCount }: { sort: FeedSort; onSort: (s: FeedSort) => void; postCount: number }) {
  const options: { key: FeedSort; label: string; icon: string }[] = [
    { key: 'hot', label: 'Hot', icon: 'flame-outline' },
    { key: 'new', label: 'New', icon: 'time-outline' },
    { key: 'top', label: 'Top', icon: 'trending-up-outline' },
  ];
  return (
    <View style={fc.row}>
      <Text style={fc.count}>{postCount} posts</Text>
      <View style={{ flex: 1 }} />
      {options.map(o => {
        const active = sort === o.key;
        return (
          <TouchableOpacity key={o.key} onPress={() => onSort(o.key)} activeOpacity={0.7} style={[fc.pill, active && fc.pillActive]}>
            <Ionicons name={o.icon as any} size={12} color={active ? T.accentPurple : T.textMuted} />
            <Text style={[fc.pillText, active && fc.pillTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const fc = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  count: { fontSize: 14, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.2 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 32, paddingHorizontal: 10, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  pillActive: { backgroundColor: 'rgba(139,77,255,0.10)', borderColor: 'rgba(139,77,255,0.22)' },
  pillText: { fontSize: 12, fontWeight: '600', color: T.textMuted },
  pillTextActive: { color: T.accentPurple, fontWeight: '700' },
});

// ─── PostFeedCard ─────────────────────────────────────────────────────────────
function PostFeedCard({ post, communityColor, onPress }: {
  post: CommunityPost; communityColor: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={pf.card}>
        <View style={pf.badgeRow}>
          {post.isPinned && (
            <View style={pf.pinnedBadge}>
              <Ionicons name="pin" size={10} color={T.accentBlue} />
              <Text style={pf.pinnedText}>Pinned</Text>
            </View>
          )}
          {post.isHot && (
            <View style={pf.hotBadge}>
              <Ionicons name="flame" size={10} color={T.accentPink} />
              <Text style={pf.hotText}>Trending</Text>
            </View>
          )}
          {post.tag && (
            <View style={[pf.tagBadge, { backgroundColor: communityColor + '0C', borderColor: communityColor + '1A' }]}>
              <Text style={[pf.tagText, { color: communityColor }]}>#{post.tag}</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Text style={pf.timestamp}>{post.timestamp}</Text>
        </View>
        <View style={pf.authorRow}>
          <GradAvatar handle={post.author} size={28} />
          <Text style={pf.authorHandle}>{post.author}</Text>
        </View>
        <Text style={pf.title} numberOfLines={2}>{post.title}</Text>
        <Text style={pf.body} numberOfLines={2}>{post.body}</Text>
        <View style={pf.footer}>
          <View style={pf.footerBtn}>
            <Ionicons name="arrow-up-circle-outline" size={16} color={T.textMuted} />
            <Text style={pf.footerCount}>{post.upvotes}</Text>
          </View>
          <View style={pf.footerBtn}>
            <Ionicons name="chatbubble-outline" size={14} color={T.textMuted} />
            <Text style={pf.footerCount}>{post.commentCount}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Ionicons name="bookmark-outline" size={14} color={T.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const pf = StyleSheet.create({
  card: {
    backgroundColor: GLASS, borderRadius: 22, borderWidth: 1, borderColor: GLASS_BORDER,
    padding: 18, gap: 10,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pinnedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 99,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(75,80,248,0.14)',
  },
  pinnedText: { fontSize: 10, fontWeight: '700', color: T.accentBlue },
  hotBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(230,85,197,0.08)', borderRadius: 99,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(230,85,197,0.14)',
  },
  hotText: { fontSize: 10, fontWeight: '700', color: T.accentPink },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 1 },
  tagText: { fontSize: 10, fontWeight: '700' },
  timestamp: { fontSize: 11, color: T.textMuted, fontWeight: '500' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorHandle: { fontSize: 13, fontWeight: '700', color: T.textPrimary },
  title: { fontSize: 16, fontWeight: '800', color: T.textPrimary, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontSize: 13, color: T.textSecondary, lineHeight: 19 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 2 },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerCount: { fontSize: 12, fontWeight: '700', color: T.textMuted },
});

// ─── RulesCard ────────────────────────────────────────────────────────────────
function RulesCard({ rules }: { rules: string[] }) {
  return (
    <View style={ru.card}>
      <View style={ru.header}>
        <Ionicons name="shield-checkmark-outline" size={14} color={T.accentPurple} />
        <Text style={ru.title}>Community Guidelines</Text>
      </View>
      {rules.map((rule, i) => (
        <View key={i} style={ru.ruleRow}>
          <Text style={ru.bullet}>{i + 1}</Text>
          <Text style={ru.ruleText}>{rule}</Text>
        </View>
      ))}
    </View>
  );
}

const ru = StyleSheet.create({
  card: { backgroundColor: GLASS_LIGHT, borderRadius: 18, borderWidth: 1, borderColor: GLASS_BORDER, padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 13, fontWeight: '700', color: T.textPrimary },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingLeft: 2 },
  bullet: {
    fontSize: 10, fontWeight: '800', color: T.accentPurple,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(139,77,255,0.08)',
    textAlign: 'center', lineHeight: 16, overflow: 'hidden',
  },
  ruleText: { fontSize: 12, color: T.textSecondary, lineHeight: 17, flex: 1 },
});

// ─── Write FAB ────────────────────────────────────────────────────────────────
function WriteFAB({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={fab.outer}>
      <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={fab.btn}>
        <Ionicons name="create-outline" size={22} color={T.white} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const fab = StyleSheet.create({
  outer: {
    position: 'absolute', bottom: 28, right: 22, borderRadius: 28,
    shadowColor: '#4B50F8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 10,
  },
  btn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CommunityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [joined, setJoined] = useState(false);
  const [joinToast, setJoinToast] = useState(false);
  const [sort, setSort] = useState<FeedSort>('hot');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const community = COMMUNITY_MAP[id ?? ''] ?? null;

  if (loading) {
    return (
      <LinearGradient colors={BG} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={s.nav}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={s.navBtn}>
              <Ionicons name="chevron-back" size={18} color={T.textPrimary} />
            </TouchableOpacity>
            <Text style={s.navTitle}>Loading...</Text>
            <View style={{ width: 38 }} />
          </View>
          <SkeletonList count={3} type="card" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!community) {
    return (
      <LinearGradient colors={BG} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={s.nav}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={s.navBtn}>
              <Ionicons name="chevron-back" size={18} color={T.textPrimary} />
            </TouchableOpacity>
            <View style={{ width: 38 }} />
          </View>
          <EmptyState
            icon="chatbubbles-outline"
            title="Community not found"
            message="This community may have moved or doesn't exist."
            actionLabel="Browse Communities"
            onAction={() => router.replace('/(tabs)/communities')}
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const posts = getPostsForCommunity(community.id);

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
            <View style={[s.navDot, { backgroundColor: community.boardColor }]} />
            <Text style={s.navTitle} numberOfLines={1}>{community.name}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={s.navBtn}>
            <Ionicons name="ellipsis-horizontal" size={17} color={T.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <CommunityHero community={community} joined={joined} onJoin={() => {
            setJoined(v => {
              if (!v) setJoinToast(true);
              return !v;
            });
          }} />
          <TagsStrip tags={community.tags} color={community.boardColor} />

          {/* Search */}
          <View style={s.searchCard}>
            <Ionicons name="search-outline" size={16} color={T.textMuted} />
            <TextInput style={s.searchInput} placeholder={`Search in ${community.name}…`} placeholderTextColor={T.textMuted} />
          </View>

          <FeedControls sort={sort} onSort={setSort} postCount={posts.length} />

          {posts.map(post => (
            <PostFeedCard key={post.id} post={post} communityColor={community.boardColor} onPress={() => router.push(`/post/${post.id}` as any)} />
          ))}

          <RulesCard rules={community.rules} />
          <View style={{ height: 80 }} />
        </ScrollView>

        <WriteFAB onPress={() => router.push('/(tabs)/create')} />
      </SafeAreaView>
      <SuccessToast message="Joined community!" visible={joinToast} onDone={() => setJoinToast(false)} icon="people" />
    </View>
  );
}

// ─── Root styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 16,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: GLASS, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: GLASS_BORDER,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  navCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingHorizontal: 8,
  },
  navDot: { width: 8, height: 8, borderRadius: 4 },
  navTitle: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16, gap: 16 },
  searchCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GLASS_LIGHT, borderRadius: 14,
    borderWidth: 1, borderColor: GLASS_BORDER,
    paddingHorizontal: 14, height: 42,
  },
  searchInput: { flex: 1, fontSize: 13, color: T.textPrimary },
});
