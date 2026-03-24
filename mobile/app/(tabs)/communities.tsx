import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import EmptyState from '../../src/components/common/EmptyState';
import { SkeletonList, ModuleGridSkeleton } from '../../src/components/common/Skeletons';

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

// ─── Avatar gradient palette ──────────────────────────────────────────────────
const AVATAR_GRADS: [string, string][] = [
  ['#4B50F8', '#8B4DFF'], ['#8B4DFF', '#E655C5'], ['#6B7CFF', '#4B50F8'],
  ['#E655C5', '#C47EFF'], ['#C47EFF', '#6B7CFF'],
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const TRENDING_TOPICS = [
  { label: 'Exam curve', posts: 34, color: T.accentBlue },
  { label: 'Roommate search', posts: 21, color: T.accentPurple },
  { label: 'Internship deadlines', posts: 18, color: T.accentBlue },
  { label: 'Party tonight', posts: 28, color: T.accentPink },
  { label: 'Grade appeal', posts: 12, color: T.accentPurple },
  { label: 'Study group', posts: 15, color: T.accentBlue },
];

const DIR_TABS = ['Popular', 'New', 'Suggested'];

type Community = {
  id: string;
  name: string;
  description: string;
  members: string;
  activeNow: number;
  newToday: number;
  icon: string;
  color: string;
  tag: 'popular' | 'new' | 'suggested';
};

const COMMUNITIES: Community[] = [
  { id: '1', name: 'Classes', description: 'Course discussions, notes, exam help', members: '1.2k', activeNow: 34, newToday: 12, icon: 'school-outline', color: '#4B50F8', tag: 'popular' },
  { id: '2', name: 'Confessions', description: 'Anonymous campus confessions', members: '1.8k', activeNow: 42, newToday: 23, icon: 'eye-off-outline', color: '#E655C5', tag: 'popular' },
  { id: '3', name: 'Housing', description: 'Roommates, sublets, dorm life', members: '890', activeNow: 12, newToday: 5, icon: 'home-outline', color: '#6B7CFF', tag: 'popular' },
  { id: '4', name: 'Events', description: 'Campus events, meetups, parties', members: '650', activeNow: 28, newToday: 8, icon: 'calendar-outline', color: '#8B4DFF', tag: 'popular' },
  { id: '5', name: 'Marketplace', description: 'Buy, sell, trade on campus', members: '720', activeNow: 15, newToday: 6, icon: 'pricetag-outline', color: '#F1973B', tag: 'popular' },
  { id: '6', name: 'Social', description: 'Meet people, hangouts, clubs', members: '540', activeNow: 8, newToday: 4, icon: 'people-outline', color: '#3DAB73', tag: 'popular' },
  { id: '7', name: 'Mental Health', description: 'Support, resources, well-being', members: '320', activeNow: 6, newToday: 3, icon: 'heart-outline', color: '#C47EFF', tag: 'new' },
  { id: '8', name: 'Career & Co-op', description: 'Internships, co-op, job hunting', members: '410', activeNow: 9, newToday: 7, icon: 'briefcase-outline', color: '#4D97FF', tag: 'new' },
  { id: '9', name: 'Photography Club', description: 'Campus through the lens', members: '180', activeNow: 3, newToday: 2, icon: 'camera-outline', color: '#F1973B', tag: 'suggested' },
  { id: '10', name: 'Board Games', description: 'Weekly game nights & meetups', members: '95', activeNow: 2, newToday: 1, icon: 'dice-outline', color: '#8B4DFF', tag: 'suggested' },
  { id: '11', name: 'St. George Local', description: 'Spots & deals near campus', members: '470', activeNow: 14, newToday: 5, icon: 'navigate-outline', color: '#3DAB73', tag: 'suggested' },
  { id: '12', name: 'Kensington Market', description: 'Food, thrift, community', members: '210', activeNow: 4, newToday: 2, icon: 'storefront-outline', color: '#F1973B', tag: 'suggested' },
];

type ModuleItem = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  comingSoon?: boolean;
};

const MODULES: ModuleItem[] = [
  { id: 'timetable', label: 'Timetable', subtitle: 'Plan your schedule', icon: 'calendar-outline', color: '#4B50F8' },
  { id: 'catalog', label: 'Courses', subtitle: 'Browse catalog', icon: 'library-outline', color: '#6B7CFF' },
  { id: 'professors', label: 'Prof Reviews', subtitle: 'Rate & read', icon: 'school-outline', color: '#8B4DFF' },
  { id: 'map', label: 'Campus Map', subtitle: 'Navigate', icon: 'map-outline', color: '#3DAB73' },
  { id: 'study-buddy', label: 'Study Buddy', subtitle: 'Find partners', icon: 'people-outline', color: '#C47EFF' },
  { id: 'polls', label: 'Polls', subtitle: 'Campus opinions', icon: 'stats-chart-outline', color: '#F1973B' },
  { id: 'international', label: 'International', subtitle: 'Global hub', icon: 'globe-outline', color: '#4D97FF', comingSoon: true },
  { id: 'confession', label: 'Confessions', subtitle: 'Stay anonymous', icon: 'chatbox-ellipses-outline', color: '#E655C5', comingSoon: true },
  { id: 'ai-assistant', label: 'AI Assistant', subtitle: 'Academic help', icon: 'sparkles-outline', color: '#7A64FF', comingSoon: true },
];

type MissionItem = {
  id: string;
  label: string;
  description: string;
  icon: string;
  gradient: [string, string];
  action: string;
};

const MISSIONS: MissionItem[] = [
  { id: '1', label: 'Build Your Schedule', description: 'Set up your Fall 2025 timetable before enrollment opens', icon: 'calendar-outline', gradient: ['#4B50F8', '#6B7CFF'], action: 'Start' },
  { id: '2', label: 'Join 3 Communities', description: 'Discover communities that match your interests', icon: 'people-outline', gradient: ['#8B4DFF', '#C47EFF'], action: 'Browse' },
  { id: '3', label: 'Rate a Professor', description: 'Help fellow students by sharing your experience', icon: 'star-outline', gradient: ['#F1973B', '#E655C5'], action: 'Review' },
];

// ─── Global search bar ───────────────────────────────────────────────────────
function GlobalSearch() {
  return (
    <View style={gs.shadow}>
      <View style={gs.bar}>
        <View style={gs.iconWrap}>
          <Ionicons name="search" size={18} color={T.accentBlue} />
        </View>
        <TextInput
          placeholder="Search communities, people, courses..."
          placeholderTextColor={T.textMuted}
          style={gs.input}
          editable={false}
        />
        <TouchableOpacity activeOpacity={0.7} style={gs.filterBtn}>
          <Ionicons name="options-outline" size={16} color={T.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const gs = StyleSheet.create({
  shadow: {
    marginHorizontal: 22, borderRadius: 18,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 18, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.60)',
    paddingHorizontal: 14, height: 52,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(75,80,248,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  input: { flex: 1, fontSize: 14, color: T.textPrimary },
  filterBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(17,17,17,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ title, icon, iconColor, onSeeAll }: { title: string; icon?: string; iconColor?: string; onSeeAll?: () => void }) {
  return (
    <View style={sh.row}>
      <View style={sh.left}>
        {icon && <Ionicons name={icon as any} size={16} color={iconColor ?? T.accentPurple} />}
        <Text style={sh.title}>{title}</Text>
      </View>
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
  left: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 15, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.2 },
  seeAll: { fontSize: 12, fontWeight: '600', color: T.accentBlue },
});

// ─── Trending topics ─────────────────────────────────────────────────────────
function TrendingTopics() {
  return (
    <View style={tt.shadow}>
      <View style={tt.card}>
        <View style={tt.chips}>
          {TRENDING_TOPICS.map((topic) => (
            <TouchableOpacity key={topic.label} activeOpacity={0.75} style={[tt.chip, { backgroundColor: topic.color + '0C', borderColor: topic.color + '20' }]}>
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
    marginHorizontal: 22, borderRadius: 20,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 14, elevation: 4,
  },
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 99, borderWidth: 1,
  },
  chipLabel: { fontSize: 12, fontWeight: '700' },
  chipCount: { fontSize: 10, fontWeight: '600', color: T.textMuted },
});

// ─── Directory tabs ──────────────────────────────────────────────────────────
function DirectoryTabs({ active, onSelect }: { active: string; onSelect: (t: string) => void }) {
  return (
    <View style={dt.row}>
      {DIR_TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onSelect(tab)}
            activeOpacity={0.75}
            style={[dt.tab, isActive && dt.tabActive]}
          >
            <Text style={[dt.tabText, isActive && dt.tabTextActive]}>{tab}</Text>
            {isActive && <View style={dt.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const dt = StyleSheet.create({
  row: {
    flexDirection: 'row', paddingHorizontal: 22, gap: 4,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: 'rgba(75,80,248,0.06)',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: T.textMuted },
  tabTextActive: { color: T.accentBlue, fontWeight: '700' },
  indicator: {
    width: 16, height: 3, borderRadius: 2,
    backgroundColor: T.accentBlue,
    marginTop: 4,
  },
});

// ─── Community card ──────────────────────────────────────────────────────────
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
          <View style={cm.avatarRow}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[cm.miniAvatar, { marginLeft: i === 0 ? 0 : -7, zIndex: 3 - i }]}>
                <LinearGradient colors={AVATAR_GRADS[i]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cm.miniAvatarGrad} />
              </View>
            ))}
          </View>
          <Text style={cm.members}>{community.members}</Text>
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

// ─── Coming Soon module card ─────────────────────────────────────────────────
function ComingSoonModuleCard({ mod }: { mod: ModuleItem }) {
  return (
    <View style={mg.cardWrap}>
      <View style={[mg.card, mg.cardComingSoon]}>
          <Text style={[mg.comingSoonText]}>COMING{'\n'}SOON</Text>
        </View>
      </View>
  );
}

// ─── Modules grid ────────────────────────────────────────────────────────────
function ModulesGrid({ onModulePress }: { onModulePress: (id: string) => void }) {
  return (
    <View style={mg.grid}>
      {MODULES.map((mod) =>
        mod.comingSoon ? (
          <ComingSoonModuleCard key={mod.id} mod={mod} />
        ) : (
          <TouchableOpacity key={mod.id} activeOpacity={0.78} style={mg.cardWrap} onPress={() => onModulePress(mod.id)}>
            <View style={mg.card}>
              <View style={[mg.iconCircle, { backgroundColor: mod.color + '12' }]}>
                <Ionicons name={mod.icon as any} size={20} color={mod.color} />
              </View>
              <Text style={mg.label} numberOfLines={1}>{mod.label}</Text>
              <Text style={mg.subtitle} numberOfLines={1}>{mod.subtitle}</Text>
            </View>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const mg = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 22, gap: 12,
  },
  cardWrap: {
    width: '30%', flexGrow: 1,
    borderRadius: 18,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  card: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    minHeight: 100,
  },
  cardComingSoon: {
    opacity: 0.72,
    borderStyle: 'dashed',
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '700', color: T.textSecondary, textAlign: 'center' },
  subtitle: { fontSize: 10, color: T.textMuted, textAlign: 'center' },
  comingSoonText: {
    fontSize: 10, fontWeight: '800', textAlign: 'center',
    letterSpacing: 1.2, justifyContent: 'center',
  },
});

// ─── Explore missions ────────────────────────────────────────────────────────
function MissionCard({ mission }: { mission: MissionItem }) {
  return (
    <View style={mc.shadow}>
      <View style={mc.card}>
        <View style={mc.iconWrap}>
          <LinearGradient colors={mission.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={mc.iconGrad}>
            <Ionicons name={mission.icon as any} size={18} color="#fff" />
          </LinearGradient>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={mc.label}>{mission.label}</Text>
          <Text style={mc.desc} numberOfLines={2}>{mission.description}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8}>
          <LinearGradient colors={mission.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={mc.actionBtn}>
            <Text style={mc.actionText}>{mission.action}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const mc = StyleSheet.create({
  shadow: {
    marginHorizontal: 22, marginBottom: 10, borderRadius: 20,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 14, elevation: 4,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 16,
  },
  iconWrap: {
    shadowColor: '#4B50F8', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  iconGrad: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  desc: { fontSize: 12, color: T.textMuted, lineHeight: 17 },
  actionBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 99,
  },
  actionText: { fontSize: 11, fontWeight: '800', color: '#fff' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const router = useRouter();
  const [dirTab, setDirTab] = useState('Popular');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const filteredCommunities = COMMUNITIES.filter((c) => {
    if (dirTab === 'Popular') return c.tag === 'popular';
    if (dirTab === 'New') return c.tag === 'new';
    if (dirTab === 'Suggested') return c.tag === 'suggested';
    return true;
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={s.nav}>
          <View style={s.navSpacer} />
          <Text style={s.navTitle}>Explore</Text>
          <TouchableOpacity activeOpacity={0.8} style={s.navActionWrap}>
            <View style={s.navActionBtn}>
              <Ionicons name="bookmark-outline" size={18} color={T.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B4DFF" colors={['#8B4DFF']} />
          }
        >

          {/* Global search */}
          <GlobalSearch />

          {loading ? (
            <>
              <SkeletonList count={3} type="row" />
              <ModuleGridSkeleton count={6} />
              <SkeletonList count={2} type="row" />
            </>
          ) : (
            <>
              {/* Trending */}
              <SectionHeader title="Trending Now" icon="flame-outline" iconColor={T.accentPink} />
              <TrendingTopics />

              {/* Communities directory */}
              <SectionHeader title="Communities" icon="grid-outline" iconColor={T.accentBlue} onSeeAll={() => {}} />
              <DirectoryTabs active={dirTab} onSelect={setDirTab} />
              <View style={{ gap: 0 }}>
                {filteredCommunities.map((c) => (
                  <CommunityCard
                    key={c.id}
                    community={c}
                    onPress={() => router.push(`/board/${c.id}` as any)}
                  />
                ))}
              </View>

              {/* Modules hub */}
              <SectionHeader title="Tools & Modules" icon="apps-outline" iconColor={T.accentPurple} />
              <ModulesGrid onModulePress={(id) => {
                if (id === 'timetable') router.push('/timetable' as any);
                if (id === 'catalog') router.push('/courses' as any);
                if (id === 'professors') router.push('/professors' as any);
                if (id === 'study-buddy') router.push('/study-buddy' as any);
                if (id === 'map') router.push('/campus-map' as any);
                if (id === 'polls') router.push('/polls' as any);
              }} />

              {/* Suggested actions */}
              <SectionHeader title="Suggested for You" icon="sparkles-outline" iconColor={T.accentBlue} />
              <View style={{ gap: 0 }}>
                {MISSIONS.map((m) => (
                  <MissionCard key={m.id} mission={m} />
                ))}
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12,
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
  navTitle: { fontSize: 18, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  scroll: { paddingTop: 4, paddingBottom: 32, gap: 18 },
});
