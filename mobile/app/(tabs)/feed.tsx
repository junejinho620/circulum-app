import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Dimensions,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import EmptyState from '../../src/components/common/EmptyState';
import { FeedCardSkeleton } from '../../src/components/common/Skeletons';
import { useCampusFeed, Post } from '../../src/services/queries';
import { useAuthStore } from '../../src/store/auth.store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { width: SCREEN_W } = Dimensions.get('window');

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

// ─── Avatar gradient palette ──────────────────────────────────────────────────
const AVATAR_GRADS: [string, string][] = [
  ['#4B50F8', '#8B4DFF'], ['#8B4DFF', '#E655C5'], ['#6B7CFF', '#4B50F8'],
  ['#E655C5', '#C47EFF'], ['#C47EFF', '#6B7CFF'], ['#3DAB73', '#4D97FF'],
  ['#F1973B', '#E655C5'], ['#4D97FF', '#8B4DFF'],
];

function avatarGrad(handle: string): [string, string] {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = ((h << 5) - h + handle.charCodeAt(i)) | 0;
  return AVATAR_GRADS[Math.abs(h) % AVATAR_GRADS.length];
}

// ─── Filter chips ─────────────────────────────────────────────────────────────
const FILTERS = ['For You', 'Following', 'Trending', 'Classes', 'Events', 'Confessions'];

// ─── Category → board mapping ─────────────────────────────────────────────────
const CATEGORY_BOARD: Record<string, { label: string; color: string }> = {
  general:    { label: 'General',      color: '#4B50F8' },
  study:      { label: 'Classes',      color: '#4B50F8' },
  meme:       { label: 'Memes',        color: '#E655C5' },
  event:      { label: 'Events',       color: '#8B4DFF' },
  buy_sell:   { label: 'Marketplace',  color: '#F1973B' },
  lost_found: { label: 'Lost & Found', color: '#6B7CFF' },
};

function boardForCategory(category: string) {
  return CATEGORY_BOARD[category] ?? { label: category, color: '#4B50F8' };
}

// ─── Anonymous tap quips ─────────────────────────────────────────────────────
const ANON_QUIPS = [
  'Nice try! Identity sealed \u{1F512}',
  'Behind the mask\u2026 another mask \u{1F3AD}',
  'Anonymous and proud \u270A',
  'Some mysteries stay unsolved \u{1F311}',
  'The shadows keep my secrets \u{1F464}',
  'You\'ll never know \u{1F60F}',
];

function pickQuip() {
  return ANON_QUIPS[Math.floor(Math.random() * ANON_QUIPS.length)];
}

// ─── AnonToast ───────────────────────────────────────────────────────────────
function AnonToast({ message, onDone }: { message: string; onDone: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(onDone);
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[at.wrap, { opacity, transform: [{ scale }] }]}>
      <View style={at.card}>
        <Ionicons name="finger-print-outline" size={20} color={T.accentPurple} />
        <Text style={at.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const at = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 100, left: 0, right: 0,
    alignItems: 'center', zIndex: 999, pointerEvents: 'none',
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.2)',
    shadowColor: '#8B4DFF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  text: { fontSize: 14, fontWeight: '600', color: T.textPrimary },
});

// ─── Presence strip ──────────────────────────────────────────────────────────
const PRESENCE_NAMES = [
  'Sarah K.', 'Mike T.', 'Chris L.', 'Anonymous', 'Jessica W.', 'Alex R.',
];

function PresenceStrip() {
  return (
    <View style={ps.wrap}>
      <View style={ps.avatarStack}>
        {PRESENCE_NAMES.slice(0, 6).map((name, i) => (
          <View key={i} style={[ps.avatarRing, { marginLeft: i === 0 ? 0 : -10, zIndex: 6 - i }]}>
            <LinearGradient
              colors={avatarGrad(name)}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={ps.avatar}
            >
              {name === 'Anonymous' ? (
                <Ionicons name="eye-off" size={10} color="rgba(255,255,255,0.9)" />
              ) : (
                <Text style={ps.avatarText}>{name[0]}</Text>
              )}
            </LinearGradient>
          </View>
        ))}
      </View>
      <View style={ps.pulseWrap}>
        <View style={ps.pulseDot} />
        <Text style={ps.pulseText}>
          <Text style={{ fontWeight: '700', color: T.textPrimary }}>512</Text> active now
        </Text>
      </View>
    </View>
  );
}

const ps = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingVertical: 6,
  },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatarRing: {
    borderRadius: 14, borderWidth: 2, borderColor: 'rgba(233,225,246,0.95)',
  },
  avatar: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  pulseWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#3DAB73',
    shadowColor: '#3DAB73', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 4,
  },
  pulseText: { fontSize: 12, color: T.textMuted },
});

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ onBell }: { onBell: () => void }) {
  return (
    <View style={hdr.row}>
      <View style={hdr.left}>
        <EmblemMark />
        <View>
          <Text style={hdr.campus}>University of Toronto</Text>
          <Text style={hdr.subtitle}>St. George Campus</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onBell} activeOpacity={0.8} style={hdr.bellWrap}>
        <View style={hdr.bell}>
          <Ionicons name="notifications-outline" size={20} color={T.textSecondary} />
          <View style={hdr.badge} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

function EmblemMark() {
  return (
    <View style={emb.shadow}>
      <View style={emb.glass}>
        <View style={emb.ringOuter} />
        <View style={emb.circleBlue} />
        <View style={emb.circlePurple} />
        <View style={emb.circlePink} />
        <View style={emb.dot} />
      </View>
    </View>
  );
}

const emb = StyleSheet.create({
  shadow: {
    shadowColor: '#8B4DFF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 12, elevation: 6,
  },
  glass: {
    width: 44, height: 44, borderRadius: 13, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.52)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute', width: 31, height: 31, borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(75,80,248,0.18)',
  },
  circleBlue: {
    position: 'absolute', width: 27, height: 27, borderRadius: 14,
    backgroundColor: 'rgba(75,80,248,0.14)', top: 6, left: 6,
  },
  circlePurple: {
    position: 'absolute', width: 21, height: 21, borderRadius: 11,
    backgroundColor: 'rgba(139,77,255,0.16)', bottom: 6, right: 6,
  },
  circlePink: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: 'rgba(230,85,197,0.18)', top: 6, right: 8,
  },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(75,80,248,0.45)',
  },
});

const hdr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 8,
  },
  left:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  campus:   { fontSize: 15, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  bellWrap: {
    borderRadius: 13, overflow: 'hidden',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  bell: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  badge: {
    position: 'absolute', top: 9, right: 9,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#E655C5',
    borderWidth: 1.5, borderColor: '#fff',
  },
});

// ─── Filter chips ─────────────────────────────────────────────────────────────
function FilterChips({ active, onSelect }: { active: string; onSelect: (f: string) => void }) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={FILTERS}
      keyExtractor={(item) => item}
      contentContainerStyle={fc.row}
      renderItem={({ item }) => {
        const isActive = item === active;
        return (
          <TouchableOpacity onPress={() => onSelect(item)} activeOpacity={0.75}>
            {isActive ? (
              <LinearGradient
                colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={fc.chipActive}
              >
                <Text style={fc.chipActiveText}>{item}</Text>
              </LinearGradient>
            ) : (
              <View style={fc.chipInactive}>
                <Text style={fc.chipInactiveText}>{item}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const fc = StyleSheet.create({
  row: { paddingHorizontal: 22, gap: 8, paddingVertical: 4 },
  chipActive: {
    height: 34, paddingHorizontal: 18,
    borderRadius: 99,
    alignItems: 'center', justifyContent: 'center',
  },
  chipActiveText: { fontSize: 13, fontWeight: '700', color: T.white },
  chipInactive: {
    height: 34, paddingHorizontal: 18,
    borderRadius: 99,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  chipInactiveText: { fontSize: 13, fontWeight: '600', color: T.textSecondary },
});

// ─── Feed card components ─────────────────────────────────────────────────────

function PostCard({ item, onPress, onAvatarPress }: { item: Post; onPress: () => void; onAvatarPress: () => void }) {
  const board = boardForCategory(item.category);
  const ag = avatarGrad(item.author.handle);
  const score = item.upvotes - item.downvotes;
  const timeAgo = dayjs(item.createdAt).fromNow(true);

  return (
    <View style={fd.shadow}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        <View style={fd.card}>
          {/* Author row */}
          <View style={fd.authorRow}>
            <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
              <LinearGradient colors={ag} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={fd.avatar}>
                <Text style={fd.avatarLetter}>{item.author.handle[0]?.toUpperCase()}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={fd.authorName}>@{item.author.handle}</Text>
              <View style={fd.authorMeta}>
                <View style={[fd.boardPill, { backgroundColor: board.color + '10', borderColor: board.color + '20' }]}>
                  <Text style={[fd.boardPillText, { color: board.color }]}>{board.label}</Text>
                </View>
                {item.community && (
                  <Text style={fd.communityText}>in {item.community.name}</Text>
                )}
              </View>
            </View>
            <Text style={fd.time}>{timeAgo}</Text>
          </View>

          {/* Title */}
          {!!item.title && (
            <Text style={[fd.body, { fontWeight: '700' }]}>{item.title}</Text>
          )}

          {/* Body */}
          {!!item.body && (
            <Text style={fd.body} numberOfLines={4}>{item.body}</Text>
          )}

          {/* Actions */}
          <View style={fd.actionsRow}>
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons
                name={item.userVote === 1 ? 'arrow-up' : 'arrow-up-outline'}
                size={16}
                color={item.userVote === 1 ? T.accentBlue : T.accentBlue}
              />
              <Text style={[fd.actionText, { color: T.accentBlue }]}>{score}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons
                name={item.userVote === -1 ? 'arrow-down' : 'arrow-down-outline'}
                size={16}
                color={item.userVote === -1 ? '#E6556F' : T.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={14} color={T.textMuted} />
              <Text style={fd.actionText}>{item.commentCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={15} color={T.textMuted} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons
                name={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={15}
                color={item.isBookmarked ? T.accentPurple : T.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Feed card styles ─────────────────────────────────────────────────────────
const fd = StyleSheet.create({
  shadow: {
    marginHorizontal: 16, borderRadius: 22,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  card: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.65)',
    padding: 16, gap: 12,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 14, fontWeight: '800', color: '#fff' },
  authorName: { fontSize: 13, fontWeight: '700', color: T.textPrimary },
  authorMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  boardPill: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 99, borderWidth: 1,
  },
  boardPillText: { fontSize: 10, fontWeight: '700' },
  communityText: { fontSize: 11, color: T.textMuted },
  time: { fontSize: 11, color: T.textMuted },
  body: { fontSize: 14, color: T.textPrimary, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, color: T.textMuted, fontWeight: '600' },
});

// ─── Loading skeleton for feed ───────────────────────────────────────────────
function FeedLoadingSkeleton() {
  return (
    <View style={{ paddingTop: 12, gap: 12, paddingHorizontal: 16 }}>
      {[0, 1, 2, 3].map((i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </View>
  );
}

// ─── Footer loading indicator ────────────────────────────────────────────────
function FooterLoader({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;
  return (
    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
      <ActivityIndicator size="small" color={T.accentPurple} />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('For You');
  const [anonToast, setAnonToast] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Determine sort based on active filter
  const sort = filter === 'Trending' ? 'hot' : 'new';

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useCampusFeed(sort);

  // Flatten paginated data
  const posts = data?.pages.flatMap(p => p.items) ?? [];

  // Filter posts client-side based on the active filter chip
  const filteredPosts = React.useMemo(() => {
    switch (filter) {
      case 'Classes':
        return posts.filter(p => p.category === 'study');
      case 'Events':
        return posts.filter(p => p.category === 'event');
      case 'Confessions':
        return posts.filter(p => p.category === 'meme');
      default:
        return posts;
    }
  }, [posts, filter]);

  const handleAvatarPress = useCallback((item: Post) => {
    router.push(`/profile/${item.author.handle}` as any);
  }, []);

  const renderItem = useCallback(({ item }: { item: Post }) => {
    const avatarPress = () => handleAvatarPress(item);
    return (
      <PostCard
        item={item}
        onPress={() => router.push(`/post/${item.id}` as any)}
        onAvatarPress={avatarPress}
      />
    );
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ListHeader = useCallback(() => (
    <>
      <PresenceStrip />
      <FilterChips active={filter} onSelect={setFilter} />
      <View style={{ height: 8 }} />
    </>
  ), [filter]);

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      {anonToast && (
        <AnonToast message={anonToast} onDone={() => setAnonToast(null)} />
      )}

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header onBell={() => router.push('/(tabs)/inbox')} />

        {isLoading ? (
          <>
            <ListHeader />
            <FeedLoadingSkeleton />
          </>
        ) : (
          <Animated.FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={ListHeader}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
            scrollEventThrottle={16}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching && !isLoading}
                onRefresh={refetch}
                tintColor="#8B4DFF"
                colors={['#8B4DFF']}
              />
            }
            ListFooterComponent={<FooterLoader isLoading={isFetchingNextPage} />}
            ListEmptyComponent={
              <EmptyState
                icon="newspaper-outline"
                title="Your feed is quiet"
                message="Join communities and follow topics to see posts here."
                actionLabel="Explore Communities"
                onAction={() => router.push('/(tabs)/communities')}
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 32 },
});
