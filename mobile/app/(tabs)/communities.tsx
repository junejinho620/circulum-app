import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
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

// ─── Avatar gradient palette ──────────────────────────────────────────────────
const AVATAR_GRADS: [string, string][] = [
  ['#4B50F8', '#8B4DFF'],
  ['#8B4DFF', '#E655C5'],
  ['#6B7CFF', '#4B50F8'],
  ['#E655C5', '#C47EFF'],
  ['#C47EFF', '#6B7CFF'],
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Classes', 'Housing', 'Events', 'Social', 'Marketplace', 'Confessions', 'International'];

const TRENDING_TOPICS = [
  { label: 'Exam curve', posts: 34, color: T.accentBlue },
  { label: 'Roommate search', posts: 21, color: T.accentPurple },
  { label: 'Internship deadlines', posts: 18, color: T.accentBlue },
  { label: 'Party tonight', posts: 28, color: T.accentPink },
  { label: 'Grade appeal', posts: 12, color: T.accentPurple },
  { label: 'Study group', posts: 15, color: T.accentBlue },
];

type Community = {
  id: string;
  name: string;
  description: string;
  members: string;
  activeNow: number;
  newToday: number;
  icon: string;
  color: string;
};

const COMMUNITIES: Community[] = [
  { id: '1', name: 'Classes', description: 'Course discussions, notes, exam help', members: '1.2k', activeNow: 34, newToday: 12, icon: 'school-outline', color: '#4B50F8' },
  { id: '2', name: 'Confessions', description: 'Anonymous campus confessions', members: '1.8k', activeNow: 42, newToday: 23, icon: 'eye-off-outline', color: '#E655C5' },
  { id: '3', name: 'Housing', description: 'Roommates, sublets, dorm life', members: '890', activeNow: 12, newToday: 5, icon: 'home-outline', color: '#6B7CFF' },
  { id: '4', name: 'Events', description: 'Campus events, meetups, parties', members: '650', activeNow: 28, newToday: 8, icon: 'calendar-outline', color: '#8B4DFF' },
  { id: '5', name: 'Marketplace', description: 'Buy, sell, trade on campus', members: '720', activeNow: 15, newToday: 6, icon: 'pricetag-outline', color: '#F1973B' },
  { id: '6', name: 'Social', description: 'Meet people, hangouts, clubs', members: '540', activeNow: 8, newToday: 4, icon: 'people-outline', color: '#3DAB73' },
];

type NicheModule = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
};

const NICHE_MODULES: NicheModule[] = [
  { id: 'study-buddy', label: 'Study Buddy', subtitle: 'Find study partners', icon: 'people-outline', color: '#C47EFF' },
  { id: 'professors', label: 'Prof Reviews', subtitle: 'Rate & read reviews', icon: 'school-outline', color: '#8B4DFF' },
  { id: 'international', label: 'International', subtitle: 'Global community', icon: 'globe-outline', color: '#4D97FF' },
  { id: 'polls', label: 'Polls', subtitle: 'Campus opinions', icon: 'stats-chart-outline', color: '#F1973B' },
  { id: 'ai-assistant', label: 'AI Assistant', subtitle: 'Academic help', icon: 'sparkles-outline', color: '#7A64FF' },
  { id: 'map', label: 'Campus Map', subtitle: 'Navigate campus', icon: 'map-outline', color: '#3DAB73' },
];

// ─── Search bar ───────────────────────────────────────────────────────────────
function SearchBar() {
  return (
    <View style={sb.shadow}>
      <View style={sb.bar}>
        <Ionicons name="search-outline" size={18} color={T.textMuted} />
        <TextInput
          placeholder="Search communities, topics, courses..."
          placeholderTextColor={T.textMuted}
          style={sb.input}
          editable={false}
        />
      </View>
    </View>
  );
}

const sb = StyleSheet.create({
  shadow: {
    marginHorizontal: 22, borderRadius: 16,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 16, height: 46,
  },
  input: { flex: 1, fontSize: 14, color: T.textPrimary },
});

// ─── Category chips ───────────────────────────────────────────────────────────
function CategoryChips({ active, onSelect }: { active: string; onSelect: (c: string) => void }) {
  return (
    <ScrollView
      horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={cc.row}
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat === active;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            activeOpacity={0.75}
            style={cc.chipShadow}
          >
            {isActive ? (
              <LinearGradient
                colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={cc.chipActive}
              >
                <Text style={cc.chipActiveText}>{cat}</Text>
              </LinearGradient>
            ) : (
              <View style={cc.chipInactive}>
                <Text style={cc.chipInactiveText}>{cat}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const cc = StyleSheet.create({
  row: { paddingHorizontal: 22, gap: 8, paddingBottom: 4 },
  chipShadow: {
    borderRadius: 99,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  chipActive: {
    height: 36, paddingHorizontal: 18,
    borderRadius: 99,
    alignItems: 'center', justifyContent: 'center',
  },
  chipActiveText: { fontSize: 13, fontWeight: '700', color: T.white },
  chipInactive: {
    height: 36, paddingHorizontal: 18,
    borderRadius: 99,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  chipInactiveText: { fontSize: 13, fontWeight: '600', color: T.textSecondary },
});

// ─── Trending post card ───────────────────────────────────────────────────────
type TrendingPostData = {
  id: string;
  board: string;
  boardColor: string;
  text: string;
  upvotes: number;
  comments: number;
  time: string;
};

const HOT_POSTS: TrendingPostData[] = [
  {
    id: '1', board: 'Classes', boardColor: '#4B50F8',
    text: 'Anyone else think the MAT237 midterm grading curve was way off this semester?',
    upvotes: 134, comments: 58, time: '22m ago',
  },
  {
    id: '2', board: 'Events', boardColor: '#8B4DFF',
    text: 'Free coffee at Robarts until noon — Hart House is doing a study week pop-up.',
    upvotes: 89, comments: 14, time: '1h ago',
  },
  {
    id: '3', board: 'Confessions', boardColor: '#E655C5',
    text: 'I accidentally submitted the wrong file for my final project and the prof gave me a 92 anyway.',
    upvotes: 217, comments: 43, time: '3h ago',
  },
];

function TrendingPost({ post, onPress }: { post: TrendingPostData; onPress: () => void }) {
  return (
    <View style={tp.shadow}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.86}>
        <View style={tp.card}>
          <View style={tp.topRow}>
            <View style={[tp.boardPill, { backgroundColor: post.boardColor + '12', borderColor: post.boardColor + '22' }]}>
              <Text style={[tp.boardText, { color: post.boardColor }]}>{post.board}</Text>
            </View>
            <Text style={tp.time}>{post.time}</Text>
          </View>
          <Text style={tp.text} numberOfLines={2}>{post.text}</Text>
          <View style={tp.statsRow}>
            <View style={tp.stat}>
              <Ionicons name="arrow-up-outline" size={13} color={T.accentBlue} />
              <Text style={[tp.statText, { color: T.accentBlue }]}>{post.upvotes}</Text>
            </View>
            <View style={tp.stat}>
              <Ionicons name="chatbubble-outline" size={12} color={T.textMuted} />
              <Text style={tp.statText}>{post.comments}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const tp = StyleSheet.create({
  shadow: {
    marginHorizontal: 22, marginBottom: 10, borderRadius: 20,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 4,
  },
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 16, gap: 10,
  },
  topRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  boardPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, borderWidth: 1 },
  boardText: { fontSize: 10, fontWeight: '700' },
  time:      { fontSize: 11, color: T.textMuted },
  text:      { fontSize: 13, color: T.textPrimary, lineHeight: 19, fontWeight: '500' },
  statsRow:  { flexDirection: 'row', gap: 14 },
  stat:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText:  { fontSize: 12, color: T.textMuted, fontWeight: '600' },
});

// ─── Trending topics ──────────────────────────────────────────────────────────
function TrendingTopics() {
  return (
    <View style={tt.shadow}>
      <View style={tt.card}>
        <View style={tt.header}>
          <Ionicons name="flame-outline" size={15} color={T.accentPink} />
          <Text style={tt.title}>Trending topics</Text>
        </View>
        <View style={tt.chips}>
          {TRENDING_TOPICS.map((topic) => (
            <TouchableOpacity key={topic.label} activeOpacity={0.75} style={[tt.chip, { backgroundColor: topic.color + '0C', borderColor: topic.color + '22' }]}>
              <Text style={[tt.chipLabel, { color: topic.color }]}># {topic.label}</Text>
              <Text style={tt.chipCount}>{topic.posts}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const tt = StyleSheet.create({
  shadow: {
    marginHorizontal: 22, borderRadius: 22,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  card: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 18, gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1,
  },
  chipLabel: { fontSize: 12, fontWeight: '700' },
  chipCount: { fontSize: 10, fontWeight: '600', color: T.textMuted },
});

// ─── Community card ───────────────────────────────────────────────────────────
function CommunityCard({ community, onPress }: { community: Community; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.86} style={cm.shadow}>
      <View style={cm.card}>
        <View style={cm.topRow}>
          <View style={[cm.iconWrap, { backgroundColor: community.color + '12' }]}>
            <Ionicons name={community.icon as any} size={20} color={community.color} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={cm.name}>{community.name}</Text>
            <Text style={cm.desc}>{community.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={T.textMuted} />
        </View>
        <View style={cm.footer}>
          {/* Mini avatar cluster */}
          <View style={cm.avatarRow}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[cm.miniAvatar, { marginLeft: i === 0 ? 0 : -7, zIndex: 3 - i }]}>
                <LinearGradient
                  colors={AVATAR_GRADS[i]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={cm.miniAvatarGrad}
                />
              </View>
            ))}
          </View>
          <Text style={cm.members}>{community.members} members</Text>
          <View style={cm.activeDot} />
          <Text style={cm.activeText}>{community.activeNow} active</Text>
          {community.newToday > 0 && (
            <View style={cm.newBadge}>
              <Text style={cm.newBadgeText}>{community.newToday} new</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cm = StyleSheet.create({
  shadow: {
    marginHorizontal: 22, borderRadius: 20, marginBottom: 10,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 14, elevation: 4,
  },
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 16, gap: 12,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  desc: { fontSize: 12, color: T.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 2 },
  avatarRow: { flexDirection: 'row', marginRight: 2 },
  miniAvatar: { borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)' },
  miniAvatarGrad: { width: 18, height: 18, borderRadius: 9 },
  members: { fontSize: 11, color: T.textMuted, fontWeight: '500' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3DAB73' },
  activeText: { fontSize: 11, color: '#3DAB73', fontWeight: '600' },
  newBadge: {
    marginLeft: 'auto' as any,
    backgroundColor: 'rgba(75,80,248,0.10)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99, borderWidth: 1, borderColor: 'rgba(75,80,248,0.18)',
  },
  newBadgeText: { fontSize: 10, fontWeight: '700', color: T.accentBlue },
});

// ─── Niche destination cards ──────────────────────────────────────────────────
function NicheGrid() {
  return (
    <View style={ng.grid}>
      {NICHE_MODULES.map((mod) => (
        <TouchableOpacity key={mod.id} activeOpacity={0.78} style={ng.cardWrap}>
          <View style={ng.card}>
            <View style={[ng.iconCircle, { backgroundColor: mod.color + '12' }]}>
              <Ionicons name={mod.icon as any} size={18} color={mod.color} />
            </View>
            <Text style={ng.label} numberOfLines={1}>{mod.label}</Text>
            <Text style={ng.subtitle} numberOfLines={1}>{mod.subtitle}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const ng = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 22, gap: 10,
  },
  cardWrap: {
    width: '30%', flexGrow: 1,
    borderRadius: 18,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  card: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    minHeight: 100,
  },
  iconCircle: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '700', color: T.textSecondary, textAlign: 'center' },
  subtitle: { fontSize: 10, color: T.textMuted, textAlign: 'center' },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={sh.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  title: { fontSize: 15, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.2 },
  seeAll: { fontSize: 12, fontWeight: '600', color: T.accentBlue },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('All');
  const [trendingOnly, setTrendingOnly] = useState(false);

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={s.nav}>
          <View style={s.navSpacer} />
          <Text style={s.navTitle}>{trendingOnly ? 'Trending' : 'Explore'}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={s.navActionWrap}
            onPress={() => setTrendingOnly((v) => !v)}
          >
            <View style={[s.navActionBtn, trendingOnly && s.navActionBtnActive]}>
              <Ionicons name="flame-outline" size={17} color={trendingOnly ? T.white : T.accentPink} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {trendingOnly ? (
            <>
              {/* Trending-only view */}
              <CategoryChips active={category} onSelect={setCategory} />

              <TrendingTopics />

              <SectionHeader title="Trending Now" />
              <View style={{ gap: 0 }}>
                {HOT_POSTS.map((p) => (
                  <TrendingPost key={p.id} post={p} onPress={() => router.push(`/post/${p.id}` as any)} />
                ))}
              </View>

              <View style={{ height: 40 }} />
            </>
          ) : (
            <>
              {/* Full explore view */}
              <SearchBar />

              <CategoryChips active={category} onSelect={setCategory} />

              <TrendingTopics />

              <SectionHeader title="Trending Now" onSeeAll={() => setTrendingOnly(true)} />
              <View style={{ gap: 0 }}>
                {HOT_POSTS.map((p) => (
                  <TrendingPost key={p.id} post={p} onPress={() => router.push(`/post/${p.id}` as any)} />
                ))}
              </View>

              <SectionHeader title="Communities" onSeeAll={() => {}} />
              <View style={{ gap: 0 }}>
                {COMMUNITIES.map((c) => (
                  <CommunityCard
                    key={c.id}
                    community={c}
                    onPress={() => router.push(`/board/${c.id}` as any)}
                  />
                ))}
              </View>

              <SectionHeader title="Discover more" />
              <NicheGrid />

              <View style={{ height: 40 }} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
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
  navSpacer: { width: 38 },
  navActionWrap: { borderRadius: 19, overflow: 'hidden' },
  navActionBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  navActionBtnActive: {
    backgroundColor: T.accentPink,
    borderColor: T.accentPink,
  },
  navTitle: { fontSize: 18, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  scroll: { paddingTop: 4, paddingBottom: 32, gap: 18 },
});
