import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import EmptyState from '../../src/components/common/EmptyState';
import { FeedCardSkeleton, SkeletonList } from '../../src/components/common/Skeletons';
import SuccessToast from '../../src/components/common/SuccessToast';
import {
  useCommunityDetail,
  useCommunityFeed,
  useMyCommunities,
  useJoinCommunity,
  useLeaveCommunity,
  Community,
  Post,
} from '../../src/services/queries';

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

// ─── Color for community type ─────────────────────────────────────────────────
function communityColor(type: string): string {
  switch (type) {
    case 'class': return '#4B50F8';
    case 'housing': return '#6B7CFF';
    case 'club': return '#8B4DFF';
    default: return '#4B50F8';
  }
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
function CommunityHero({ community, color, joined, joining, onJoin }: {
  community: Community;
  color: string;
  joined: boolean;
  joining: boolean;
  onJoin: () => void;
}) {
  return (
    <View style={ch.card}>
      {/* Identity */}
      <View style={ch.identityRow}>
        <View style={[ch.iconWrap, { backgroundColor: color + '14' }]}>
          <Text style={[ch.iconCode, { color }]}>
            {community.name.slice(0, 3)}
          </Text>
          <Text style={[ch.iconNum, { color }]}>
            {community.name.slice(3)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ch.name}>{community.name}</Text>
          {community.type ? (
            <Text style={ch.subtitle}>{community.type}</Text>
          ) : null}
        </View>
      </View>

      {/* Type breadcrumb */}
      <View style={ch.breadcrumbRow}>
        <View style={[ch.boardPill, { backgroundColor: color + '0C', borderColor: color + '1A' }]}>
          <Ionicons name="folder-outline" size={10} color={color} />
          <Text style={[ch.boardText, { color }]}>{community.type || 'Community'}</Text>
        </View>
      </View>

      {/* Description */}
      {community.description ? (
        <Text style={ch.description}>{community.description}</Text>
      ) : null}

      {/* Stats */}
      <View style={ch.statsRow}>
        <View style={ch.stat}>
          <Text style={ch.statValue}>{community.memberCount.toLocaleString()}</Text>
          <Text style={ch.statLabel}>members</Text>
        </View>
        <View style={ch.statDivider} />
        <View style={ch.stat}>
          <Text style={ch.statValue}>{community.postCount.toLocaleString()}</Text>
          <Text style={ch.statLabel}>posts</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={ch.actionsRow}>
        <TouchableOpacity onPress={onJoin} activeOpacity={0.85} style={{ flex: 1 }} disabled={joining}>
          {joined ? (
            <View style={ch.joinedBtn}>
              {joining ? (
                <ActivityIndicator size="small" color={T.accentBlue} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color={T.accentBlue} />
                  <Text style={ch.joinedText}>Joined</Text>
                </>
              )}
            </View>
          ) : (
            <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ch.joinBtn}>
              {joining ? (
                <ActivityIndicator size="small" color={T.white} />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={16} color={T.white} />
                  <Text style={ch.joinText}>Join Community</Text>
                </>
              )}
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
function PostFeedCard({ post, color, onPress }: {
  post: Post; color: string; onPress: () => void;
}) {
  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(post.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }, [post.createdAt]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={pf.card}>
        <View style={pf.badgeRow}>
          {post.category ? (
            <View style={[pf.tagBadge, { backgroundColor: color + '0C', borderColor: color + '1A' }]}>
              <Text style={[pf.tagText, { color }]}>#{post.category}</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <Text style={pf.timestamp}>{timeAgo}</Text>
        </View>
        <View style={pf.authorRow}>
          <GradAvatar handle={post.author?.handle ?? '?'} size={28} />
          <Text style={pf.authorHandle}>{post.author?.handle ?? 'Anonymous'}</Text>
        </View>
        <Text style={pf.title} numberOfLines={2}>{post.title}</Text>
        {post.body ? <Text style={pf.body} numberOfLines={2}>{post.body}</Text> : null}
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
  const [joinToast, setJoinToast] = useState(false);
  const [sort, setSort] = useState<FeedSort>('hot');

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: community, isLoading: communityLoading, isError: communityError } = useCommunityDetail(id ?? '');
  const { data: myCommunities } = useMyCommunities();
  const feedQuery = useCommunityFeed(id ?? '', sort);
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  // ── Derived state ──────────────────────────────────────────────────────────
  const joined = useMemo(() => {
    if (!myCommunities || !id) return false;
    return myCommunities.some((c: any) => c.id === id || c.communityId === id);
  }, [myCommunities, id]);

  const posts: Post[] = useMemo(() => {
    if (!feedQuery.data) return [];
    return feedQuery.data.pages.flatMap((p) => p.items);
  }, [feedQuery.data]);

  const totalPosts = feedQuery.data?.pages[0]?.total ?? community?.postCount ?? 0;

  const color = community ? communityColor(community.type) : T.accentBlue;

  const joining = joinMutation.isPending || leaveMutation.isPending;

  // ── Join / leave handler ───────────────────────────────────────────────────
  const handleJoinToggle = () => {
    if (!id || joining) return;
    if (joined) {
      leaveMutation.mutate(id);
    } else {
      joinMutation.mutate(id, {
        onSuccess: () => setJoinToast(true),
      });
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (communityLoading) {
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

  // ── Not found / error state ────────────────────────────────────────────────
  if (!community || communityError) {
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
            <View style={[s.navDot, { backgroundColor: color }]} />
            <Text style={s.navTitle} numberOfLines={1}>{community.name}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={s.navBtn}>
            <Ionicons name="ellipsis-horizontal" size={17} color={T.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <CommunityHero
            community={community}
            color={color}
            joined={joined}
            joining={joining}
            onJoin={handleJoinToggle}
          />

          {/* Search */}
          <View style={s.searchCard}>
            <Ionicons name="search-outline" size={16} color={T.textMuted} />
            <TextInput style={s.searchInput} placeholder={`Search in ${community.name}...`} placeholderTextColor={T.textMuted} />
          </View>

          <FeedControls sort={sort} onSort={setSort} postCount={totalPosts} />

          {/* Posts */}
          {feedQuery.isLoading ? (
            <SkeletonList count={3} type="card" />
          ) : posts.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="No posts yet"
              message="Be the first to start a conversation in this community."
            />
          ) : (
            posts.map(post => (
              <PostFeedCard
                key={post.id}
                post={post}
                color={color}
                onPress={() => router.push(`/post/${post.id}` as any)}
              />
            ))
          )}

          {/* Load more */}
          {feedQuery.hasNextPage && (
            <TouchableOpacity
              onPress={() => feedQuery.fetchNextPage()}
              activeOpacity={0.7}
              style={s.loadMore}
            >
              {feedQuery.isFetchingNextPage ? (
                <ActivityIndicator size="small" color={T.accentPurple} />
              ) : (
                <Text style={s.loadMoreText}>Load more</Text>
              )}
            </TouchableOpacity>
          )}

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
  loadMore: {
    alignItems: 'center', justifyContent: 'center', height: 44,
    backgroundColor: GLASS_LIGHT, borderRadius: 14,
    borderWidth: 1, borderColor: GLASS_BORDER,
  },
  loadMoreText: { fontSize: 13, fontWeight: '700', color: T.accentPurple },
});
