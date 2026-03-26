import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Animated, LayoutAnimation, Platform, UIManager, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import {
  useConversations,
  useNotifications,
  useUnreadNotificationCount,
  useMarkAllNotificationsRead,
  Conversation,
  Notification,
} from '../../src/services/queries';
import { SkeletonList } from '../../src/components/common/Skeletons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
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

// ─── Avatar gradient palette ──────────────────────────────────────────────────
const AVATAR_GRADS: [string, string][] = [
  ['#4B50F8', '#8B4DFF'], ['#8B4DFF', '#E655C5'], ['#6B7CFF', '#4B50F8'],
  ['#E655C5', '#C47EFF'], ['#C47EFF', '#6B7CFF'], ['#F1973B', '#E655C5'],
  ['#3DAB73', '#4D97FF'],
];

function avatarGrad(handle: string): [string, string] {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) % AVATAR_GRADS.length;
  return AVATAR_GRADS[h];
}

function GradAvatar({ handle, size = 40 }: { handle: string; size?: number }) {
  return (
    <LinearGradient
      colors={avatarGrad(handle)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: size * 0.36, fontWeight: '800', color: '#fff' }}>
        {handle[0].toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

function StackedAvatars({ handles, size = 22 }: { handles: string[]; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {handles.slice(0, 3).map((h, i) => (
        <View key={h} style={{ marginLeft: i > 0 ? -8 : 0, borderRadius: size / 2, borderWidth: 2, borderColor: 'rgba(255,255,255,0.62)' }}>
          <GradAvatar handle={h} size={size} />
        </View>
      ))}
    </View>
  );
}

// ─── Segmented control ──────────────────────────────────────────────────────
function SegmentedControl({
  active, onChange, unreadMessages, unreadActivity,
}: {
  active: 'messages' | 'activity';
  onChange: (v: 'messages' | 'activity') => void;
  unreadMessages: number;
  unreadActivity: number;
}) {
  const slideAnim = useRef(new Animated.Value(active === 'messages' ? 0 : 1)).current;

  const handlePress = (tab: 'messages' | 'activity') => {
    if (tab === active) return;
    Animated.spring(slideAnim, { toValue: tab === 'messages' ? 0 : 1, useNativeDriver: false, tension: 200, friction: 22 }).start();
    onChange(tab);
  };

  const translateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [2, (SEGMENT_W - 4) / 2] });

  return (
    <View style={seg.outer}>
      <View style={seg.track}>
        <Animated.View style={[seg.indicator, { transform: [{ translateX }] }]}>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={seg.indicatorGrad} />
        </Animated.View>
        <TouchableOpacity activeOpacity={0.8} onPress={() => handlePress('messages')} style={seg.tab}>
          <Ionicons name="chatbubbles" size={14} color={active === 'messages' ? '#fff' : T.textMuted} />
          <Text style={[seg.tabText, active === 'messages' && seg.tabTextActive]}>Messages</Text>
          {active !== 'messages' && unreadMessages > 0 && (
            <View style={seg.badge}><Text style={seg.badgeText}>{unreadMessages}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => handlePress('activity')} style={seg.tab}>
          <Ionicons name="pulse" size={14} color={active === 'activity' ? '#fff' : T.textMuted} />
          <Text style={[seg.tabText, active === 'activity' && seg.tabTextActive]}>Activity</Text>
          {active !== 'activity' && unreadActivity > 0 && (
            <View style={seg.badge}><Text style={seg.badgeText}>{unreadActivity}</Text></View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const SEGMENT_W = 320;
const seg = StyleSheet.create({
  outer: { alignItems: 'center', marginBottom: 4 },
  track: {
    width: SEGMENT_W, height: 44, flexDirection: 'row',
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute', top: 2, bottom: 2,
    width: (SEGMENT_W - 4) / 2, borderRadius: 12, overflow: 'hidden',
  },
  indicatorGrad: { flex: 1, borderRadius: 12 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    zIndex: 1,
  },
  tabText: { fontSize: 13, fontWeight: '700', color: T.textMuted },
  tabTextActive: { color: '#fff' },
  badge: {
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: T.accentPink, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
});

// ─── Section label ──────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <View style={sl.row}>
      <Text style={sl.text}>{label}</Text>
      <View style={sl.line} />
    </View>
  );
}

const sl = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 22, marginBottom: 4, marginTop: 6 },
  text: { fontSize: 10, fontWeight: '800', color: T.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(17,17,17,0.06)' },
});

// ─── Glass card ─────────────────────────────────────────────────────────────
function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[glc.shadow, style]}>
      <View style={glc.card}>{children}</View>
    </View>
  );
}

const glc = StyleSheet.create({
  shadow: {
    borderRadius: 20, marginHorizontal: 22,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 16, gap: 12,
  },
});

// ─── Time formatting helper ─────────────────────────────────────────────────
function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES TAB
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Message requests section ───────────────────────────────────────────────
function MessageRequestsSection({ requests, router }: { requests: Conversation[]; router: any }) {
  const [expanded, setExpanded] = useState(false);

  if (requests.length === 0) return null;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <GlassCard>
      <TouchableOpacity activeOpacity={0.7} onPress={toggle} style={mr.header}>
        <View style={mr.headerLeft}>
          <View style={mr.iconCircle}>
            <Ionicons name="mail-unread-outline" size={16} color={T.accentPurple} />
          </View>
          <Text style={mr.headerTitle}>Message Requests</Text>
          <View style={mr.countBadge}>
            <Text style={mr.countText}>{requests.length}</Text>
          </View>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={T.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={mr.list}>
          {requests.map((req) => {
            const handle = req.conversationId.slice(0, 8);
            return (
              <View key={req.id} style={mr.reqRow}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/profile/${handle}` as any)}>
                  <GradAvatar handle={handle} size={38} />
                </TouchableOpacity>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={mr.reqHandle}>@{handle}</Text>
                    <Text style={mr.reqTime}>{formatRelativeTime(req.conversation.lastMessageAt)}</Text>
                  </View>
                  <Text style={mr.reqPreview} numberOfLines={1}>{req.conversation.lastMessagePreview}</Text>
                </View>
                <View style={mr.reqActions}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => Alert.alert('Accepted', `Chat with @${handle} started`)}
                    style={mr.acceptBtn}
                  >
                    <Ionicons name="checkmark" size={14} color={T.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => Alert.alert('Ignored', `Request from @${handle} ignored`)}
                    style={mr.ignoreBtn}
                  >
                    <Ionicons name="close" size={14} color={T.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}

const mr = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconCircle: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: T.accentPurple + '10', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  countBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: T.accentPurple, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  list: { gap: 12 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reqHandle: { fontSize: 13, fontWeight: '700', color: T.textPrimary },
  reqTime: { fontSize: 10, color: T.textMuted },
  reqPreview: { fontSize: 12, color: T.textSecondary },
  reqActions: { flexDirection: 'row', gap: 4 },
  acceptBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: T.accentGreen, alignItems: 'center', justifyContent: 'center',
  },
  ignoreBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(17,17,17,0.04)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
});

// ─── Conversation row ───────────────────────────────────────────────────────
function ConversationRow({ conv, router }: { conv: Conversation; router: any }) {
  const handle = conv.conversationId.slice(0, 8);
  const unread = conv.unreadCount;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => router.push(`/dm/${conv.conversationId}` as any)}
      style={cv.row}
    >
      <View>
        <GradAvatar handle={handle} size={46} />
        {unread > 0 && (
          <View style={cv.unreadDot} />
        )}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[cv.name, unread > 0 && { color: T.textPrimary }]}>@{handle}</Text>
          <Text style={[cv.time, unread > 0 && { color: T.accentPurple, fontWeight: '700' }]}>
            {formatRelativeTime(conv.conversation.lastMessageAt)}
          </Text>
        </View>
        <Text style={[cv.preview, unread > 0 && { color: T.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
          {conv.conversation.lastMessagePreview}
        </Text>
      </View>
      {unread > 0 && (
        <View style={cv.unreadBadge}>
          <Text style={cv.unreadText}>{unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const cv = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 22, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(17,17,17,0.04)',
  },
  name: { fontSize: 14, fontWeight: '700', color: T.textSecondary },
  time: { fontSize: 10, color: T.textMuted },
  preview: { fontSize: 13, color: T.textMuted, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  contextPill: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99,
    borderWidth: 1,
  },
  contextText: { fontSize: 9, fontWeight: '700' },
  pinnedBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: T.accentOrange + '12', alignItems: 'center', justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute', top: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: T.accentPurple, borderWidth: 2, borderColor: 'rgba(255,255,255,0.62)',
  },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: T.accentPurple, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { fontSize: 10, fontWeight: '800', color: '#fff' },
});

// ─── Messages tab content ───────────────────────────────────────────────────
function MessagesTab({ router }: { router: any }) {
  const { data, isLoading } = useConversations();
  const conversations = data?.items ?? [];

  // Split into requests (pending) vs active conversations
  const requests = useMemo(
    () => conversations.filter((c) => c.status === 'pending'),
    [conversations],
  );
  const active = useMemo(
    () => conversations.filter((c) => c.status !== 'pending'),
    [conversations],
  );

  if (isLoading) {
    return (
      <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
        <SkeletonList count={5} type="row" />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <GlassCard>
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 20 }}>
          <Ionicons name="chatbubbles-outline" size={32} color={T.textMuted} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: T.textPrimary }}>No messages yet</Text>
          <Text style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', lineHeight: 19 }}>
            Start a conversation with someone on campus!
          </Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <>
      <MessageRequestsSection requests={requests} router={router} />

      <SectionLabel label="Conversations" />
      {active.map((c) => <ConversationRow key={c.id} conv={c} router={router} />)}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY TAB
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Activity summary navigation card ───────────────────────────────────────
function ActivitySummaryNav({
  onSwitchToMessages, notifications,
}: {
  onSwitchToMessages: () => void;
  notifications: Notification[];
}) {
  const repliesCount = notifications.filter(
    (n) => n.type === 'comment_reply' || n.type === 'post_comment',
  ).length;
  const mentionsCount = notifications.filter((n) => n.type === 'mention').length;
  const threadsCount = notifications.filter(
    (n) => n.type === 'vote_milestone' || n.type === 'thread_trending',
  ).length;
  const messagesCount = notifications.filter((n) => n.type === 'new_message').length;

  const items = [
    { icon: 'chatbubble-outline', count: repliesCount, label: 'Replies', color: T.accentBlue },
    { icon: 'at', count: mentionsCount, label: 'Mentions', color: T.accentPurple },
    { icon: 'trending-up-outline', count: threadsCount, label: 'Threads', color: T.accentGreen },
    { icon: 'mail-outline', count: messagesCount, label: 'Messages', color: T.accentPink, onPress: onSwitchToMessages },
  ];

  return (
    <GlassCard>
      <View style={asn.row}>
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            {i > 0 && <View style={asn.divider} />}
            <TouchableOpacity
              activeOpacity={item.onPress ? 0.7 : 1}
              onPress={item.onPress}
              style={asn.item}
            >
              <View style={[asn.iconWrap, { backgroundColor: item.color + '10' }]}>
                <Ionicons name={item.icon as any} size={14} color={item.color} />
              </View>
              <Text style={asn.count}>{item.count}</Text>
              <Text style={asn.label}>{item.label}</Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </GlassCard>
  );
}

const asn = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  divider: { width: 1, height: 32, backgroundColor: 'rgba(17,17,17,0.05)' },
  item: { alignItems: 'center', gap: 3, flex: 1 },
  iconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 17, fontWeight: '800', color: T.textPrimary },
  label: { fontSize: 9, fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
});

// ─── Grouped reply notification ─────────────────────────────────────────────
function GroupedReplyNotif({
  threadTitle, replyCount, handles, latestPreview, time, unread, onPress,
}: {
  threadTitle: string; replyCount: number; handles: string[];
  latestPreview: string; time: string; unread?: boolean; onPress?: () => void;
}) {
  return (
    <View style={[grn.shadow, !unread && { shadowOpacity: 0.04 }]}>
      <TouchableOpacity activeOpacity={0.86} onPress={onPress}>
        <View style={[grn.card, !unread && { opacity: 0.72 }]}>
          {unread && (
            <LinearGradient colors={[T.accentBlue, '#6B7CFF']} style={grn.accent} />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <StackedAvatars handles={handles} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={grn.title} numberOfLines={1}>
                  <Text style={{ fontWeight: '800', color: T.accentBlue }}>{replyCount}</Text> new replies
                </Text>
                <Text style={grn.time}>{time}</Text>
              </View>
              <Text style={grn.threadTitle} numberOfLines={1}>{threadTitle}</Text>
              <Text style={grn.preview} numberOfLines={1}>{latestPreview}</Text>
              <View style={grn.actionRow}>
                <View style={grn.viewPill}>
                  <Ionicons name="return-down-forward-outline" size={10} color={T.accentBlue} />
                  <Text style={grn.viewText}>View thread</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const grn = StyleSheet.create({
  shadow: {
    borderRadius: 20, marginHorizontal: 22, marginBottom: 10,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 14, gap: 6,
  },
  accent: {
    position: 'absolute', left: 0, top: 12, bottom: 12,
    width: 3, borderRadius: 2,
  },
  title: { fontSize: 13, fontWeight: '600', color: T.textPrimary },
  time: { fontSize: 10, color: T.textMuted, flexShrink: 0 },
  threadTitle: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  preview: { fontSize: 12, color: T.textMuted, fontStyle: 'italic' },
  actionRow: { marginTop: 2 },
  viewPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 4, backgroundColor: 'rgba(75,80,248,0.08)',
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 99, borderWidth: 1, borderColor: 'rgba(75,80,248,0.14)',
  },
  viewText: { fontSize: 10, fontWeight: '700', color: T.accentBlue },
});

// ─── Grouped mention notification ───────────────────────────────────────────
function GroupedMentionNotif({
  board, mentionCount, preview, time, unread, onPress,
}: {
  board: string; mentionCount: number; preview: string;
  time: string; unread?: boolean; onPress?: () => void;
}) {
  return (
    <View style={[gmn.shadow, !unread && { shadowOpacity: 0.04 }]}>
      <TouchableOpacity activeOpacity={0.86} onPress={onPress}>
        <View style={[gmn.card, !unread && { opacity: 0.72 }]}>
          {unread && (
            <LinearGradient colors={[T.accentPurple, '#C47EFF']} style={gmn.accent} />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={gmn.icon}>
              <Ionicons name="at" size={18} color={T.accentPurple} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={gmn.title}>
                  Mentioned <Text style={{ fontWeight: '800', color: T.accentPurple }}>{mentionCount}x</Text> in {board}
                </Text>
                <Text style={gmn.time}>{time}</Text>
              </View>
              <Text style={gmn.preview} numberOfLines={2}>{preview}</Text>
              <View style={gmn.pillRow}>
                <View style={gmn.boardPill}>
                  <Text style={gmn.boardText}>{board}</Text>
                </View>
                <View style={gmn.viewPill}>
                  <Text style={gmn.viewText}>View</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const gmn = StyleSheet.create({
  shadow: {
    borderRadius: 20, marginHorizontal: 22, marginBottom: 10,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 14, gap: 4,
  },
  accent: {
    position: 'absolute', left: 0, top: 12, bottom: 12,
    width: 3, borderRadius: 2,
  },
  icon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(139,77,255,0.09)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.14)',
  },
  title: { fontSize: 13, fontWeight: '600', color: T.textPrimary },
  time: { fontSize: 10, color: T.textMuted, flexShrink: 0 },
  preview: { fontSize: 12, color: T.textSecondary, lineHeight: 17 },
  pillRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  boardPill: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99,
    backgroundColor: 'rgba(139,77,255,0.09)', borderWidth: 1, borderColor: 'rgba(139,77,255,0.16)',
  },
  boardText: { fontSize: 9, fontWeight: '700', color: T.accentPurple },
  viewPill: {
    paddingHorizontal: 9, paddingVertical: 2, borderRadius: 99,
    backgroundColor: 'rgba(139,77,255,0.06)',
  },
  viewText: { fontSize: 9, fontWeight: '700', color: T.accentPurple },
});

// ─── Thread momentum card ───────────────────────────────────────────────────
function ThreadMomentumCard({
  threadTitle, newReplies, viewIncrease, time, onPress,
}: {
  threadTitle: string; newReplies: number; viewIncrease: number;
  time: string; onPress?: () => void;
}) {
  return (
    <View style={tm.shadow}>
      <TouchableOpacity activeOpacity={0.82} onPress={onPress}>
        <View style={tm.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={tm.icon}>
              <Ionicons name="trending-up" size={18} color={T.accentGreen} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={tm.time}>{time}</Text>
              </View>
              <Text style={tm.title} numberOfLines={2}>{threadTitle}</Text>
              <View style={tm.statsRow}>
                <View style={tm.stat}>
                  <Ionicons name="chatbubble" size={10} color={T.accentBlue} />
                  <Text style={tm.statText}>{newReplies} new</Text>
                </View>
                <View style={tm.stat}>
                  <Ionicons name="eye" size={10} color={T.accentGreen} />
                  <Text style={tm.statText}>+{viewIncrease} views</Text>
                </View>
                <View style={tm.velocityBadge}>
                  <Ionicons name="flame" size={10} color={T.accentOrange} />
                  <Text style={tm.velocityText}>Trending</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.85} style={{ alignSelf: 'flex-start', borderRadius: 99, overflow: 'hidden', marginTop: 2 }}>
                <LinearGradient colors={[T.accentGreen + '18', T.accentBlue + '18']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tm.joinBtn}>
                  <Ionicons name="arrow-forward" size={11} color={T.accentGreen} />
                  <Text style={tm.joinText}>Join Conversation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const tm = StyleSheet.create({
  shadow: {
    borderRadius: 20, marginHorizontal: 22, marginBottom: 10,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 14,
  },
  icon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: T.accentGreen + '10',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: T.accentGreen + '18',
  },
  time: { fontSize: 10, color: T.textMuted },
  title: { fontSize: 13, fontWeight: '700', color: T.textPrimary, lineHeight: 18 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 10, fontWeight: '600', color: T.textSecondary },
  velocityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99,
    backgroundColor: T.accentOrange + '10',
  },
  velocityText: { fontSize: 9, fontWeight: '700', color: T.accentOrange },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
  },
  joinText: { fontSize: 10, fontWeight: '700', color: T.accentGreen },
});

// ─── Poll & community notification ──────────────────────────────────────────
function PollResultNotif({ question, winner, percent, time, onPress }: {
  question: string; winner: string; percent: number; time: string; onPress?: () => void;
}) {
  return (
    <View style={prn.shadow}>
      <TouchableOpacity activeOpacity={0.82} onPress={onPress}>
        <View style={prn.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={prn.icon}>
              <Ionicons name="stats-chart-outline" size={16} color={T.accentPink} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={prn.label}>Poll Results</Text>
                <Text style={prn.time}>{time}</Text>
              </View>
              <Text style={prn.question} numberOfLines={1}>{question}</Text>
              <View style={prn.resultRow}>
                <View style={prn.resultBar}>
                  <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[prn.resultFill, { width: `${percent}%` }]} />
                </View>
                <Text style={prn.winner}>{winner} ({percent}%)</Text>
              </View>
              <TouchableOpacity style={prn.viewBtn}>
                <Text style={prn.viewText}>View results</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const prn = StyleSheet.create({
  shadow: {
    borderRadius: 20, marginHorizontal: 22, marginBottom: 10,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 14,
  },
  icon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: T.accentPink + '10',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: T.accentPink + '18',
  },
  label: { fontSize: 10, fontWeight: '700', color: T.accentPink, textTransform: 'uppercase' },
  time: { fontSize: 10, color: T.textMuted },
  question: { fontSize: 13, fontWeight: '600', color: T.textPrimary },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(17,17,17,0.04)', overflow: 'hidden' },
  resultFill: { height: 5, borderRadius: 3 },
  winner: { fontSize: 10, fontWeight: '700', color: T.textSecondary },
  viewBtn: { alignSelf: 'flex-start', marginTop: 2 },
  viewText: { fontSize: 10, fontWeight: '700', color: T.accentPink },
});

// ─── System notification ────────────────────────────────────────────────────
function SystemNotif({ icon, title, body, time, onPress }: {
  icon: string; title: string; body: string; time: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={sysn.row}>
      <View style={sysn.icon}>
        <Ionicons name={icon as any} size={16} color={T.textMuted} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={sysn.title}>{title}</Text>
        <Text style={sysn.body} numberOfLines={1}>{body}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={sysn.time}>{time}</Text>
        <Ionicons name="chevron-forward" size={12} color={T.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const sysn = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 22, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(17,17,17,0.04)',
  },
  icon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(110,115,136,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 13, fontWeight: '600', color: T.textPrimary },
  body: { fontSize: 12, color: T.textMuted },
  time: { fontSize: 10, color: T.textMuted },
});

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ router }: { router: any }) {
  const suggestions = [
    { icon: 'people-outline', label: 'Join communities', color: T.accentPurple, route: '/communities' },
    { icon: 'stats-chart-outline', label: 'Start a poll', color: T.accentPink, route: '/polls' },
    { icon: 'person-add-outline', label: 'Find study buddy', color: T.accentGreen, route: '/study-buddy' },
    { icon: 'compass-outline', label: 'Explore trending', color: T.accentBlue, route: '/communities' },
  ];

  return (
    <GlassCard>
      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
        <Ionicons name="leaf-outline" size={28} color={T.textMuted} />
        <Text style={{ fontSize: 16, fontWeight: '800', color: T.textPrimary }}>All caught up</Text>
        <Text style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', lineHeight: 19 }}>
          No new activity. Jump into something!
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {suggestions.map((s) => (
          <TouchableOpacity
            key={s.label}
            activeOpacity={0.7}
            onPress={() => router.push(s.route as any)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99,
              backgroundColor: s.color + '0A', borderWidth: 1, borderColor: s.color + '18',
            }}
          >
            <Ionicons name={s.icon as any} size={12} color={s.color} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: s.color }}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </GlassCard>
  );
}

// ─── Notification type → icon mapping ───────────────────────────────────────
function getNotifIcon(type: string): string {
  switch (type) {
    case 'comment_reply': return 'chatbubble-outline';
    case 'post_comment': return 'chatbubble-outline';
    case 'mention': return 'at';
    case 'new_message': return 'mail-outline';
    case 'vote_milestone': return 'trending-up-outline';
    case 'thread_trending': return 'flame-outline';
    case 'poll_result': return 'stats-chart-outline';
    case 'system': return 'information-circle-outline';
    default: return 'notifications-outline';
  }
}

// ─── Render a single notification card based on its type ────────────────────
function NotificationCard({ notif, router }: { notif: Notification; router: any }) {
  const time = formatRelativeTime(notif.createdAt);
  const p = notif.payload;

  switch (notif.type) {
    case 'comment_reply':
    case 'post_comment':
      return (
        <GroupedReplyNotif
          threadTitle={p.postTitle ?? p.threadTitle ?? 'A post'}
          replyCount={p.replyCount ?? 1}
          handles={p.handles ?? [p.handle ?? 'User']}
          latestPreview={p.message ?? p.preview ?? ''}
          time={time}
          unread={!notif.isRead}
          onPress={() => router.push(p.postId ? `/post/${p.postId}` : '/feed')}
        />
      );

    case 'mention':
      return (
        <GroupedMentionNotif
          board={p.board ?? p.communityName ?? 'Community'}
          mentionCount={p.mentionCount ?? 1}
          preview={p.message ?? p.preview ?? ''}
          time={time}
          unread={!notif.isRead}
          onPress={() => router.push(p.postId ? `/post/${p.postId}` : '/feed')}
        />
      );

    case 'vote_milestone':
    case 'thread_trending':
      return (
        <ThreadMomentumCard
          threadTitle={p.postTitle ?? p.threadTitle ?? 'A thread'}
          newReplies={p.newReplies ?? p.replyCount ?? 0}
          viewIncrease={p.viewIncrease ?? p.views ?? 0}
          time={time}
          onPress={() => router.push(p.postId ? `/post/${p.postId}` : '/feed')}
        />
      );

    case 'poll_result':
      return (
        <PollResultNotif
          question={p.question ?? 'Poll'}
          winner={p.winner ?? ''}
          percent={p.percent ?? 0}
          time={time}
          onPress={() => router.push(p.pollId ? `/polls` : '/polls')}
        />
      );

    case 'system':
      return (
        <GlassCard style={{ padding: 0 }}>
          <View style={{ paddingTop: 4, paddingBottom: 4 }}>
            <SystemNotif
              icon={p.icon ?? 'information-circle-outline'}
              title={p.title ?? 'System'}
              body={p.message ?? p.body ?? ''}
              time={time}
              onPress={p.route ? () => router.push(p.route) : undefined}
            />
          </View>
        </GlassCard>
      );

    default:
      // Generic notification fallback
      return (
        <GlassCard style={{ padding: 0 }}>
          <View style={{ paddingTop: 4, paddingBottom: 4 }}>
            <SystemNotif
              icon={getNotifIcon(notif.type)}
              title={p.title ?? notif.type.replace(/_/g, ' ')}
              body={p.message ?? p.preview ?? ''}
              time={time}
              onPress={p.postId ? () => router.push(`/post/${p.postId}`) : undefined}
            />
          </View>
        </GlassCard>
      );
  }
}

// ─── Activity tab content ───────────────────────────────────────────────────
function ActivityTab({ router, onSwitchToMessages }: { router: any; onSwitchToMessages: () => void }) {
  const { data, isLoading } = useNotifications();
  const notifications = data?.items ?? [];

  if (isLoading) {
    return (
      <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
        <SkeletonList count={4} type="card" />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <>
        <ActivitySummaryNav onSwitchToMessages={onSwitchToMessages} notifications={[]} />
        <EmptyState router={router} />
      </>
    );
  }

  // Split notifications into time groups
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;

  const unreadNew = notifications.filter((n) => !n.isRead);
  const readToday = notifications.filter((n) => {
    const ts = new Date(n.createdAt).getTime();
    return n.isRead && ts >= todayStart;
  });
  const yesterday = notifications.filter((n) => {
    const ts = new Date(n.createdAt).getTime();
    return ts >= yesterdayStart && ts < todayStart;
  });
  const older = notifications.filter((n) => {
    const ts = new Date(n.createdAt).getTime();
    return n.isRead && ts < yesterdayStart;
  });

  // Separate system notifications
  const systemNotifs = notifications.filter((n) => n.type === 'system');
  const nonSystemNew = unreadNew.filter((n) => n.type !== 'system');
  const nonSystemToday = readToday.filter((n) => n.type !== 'system');
  const nonSystemYesterday = yesterday.filter((n) => n.type !== 'system');
  const nonSystemOlder = older.filter((n) => n.type !== 'system');

  return (
    <>
      <ActivitySummaryNav onSwitchToMessages={onSwitchToMessages} notifications={notifications} />

      {nonSystemNew.length > 0 && (
        <>
          <SectionLabel label="New" />
          {nonSystemNew.map((n) => (
            <NotificationCard key={n.id} notif={n} router={router} />
          ))}
        </>
      )}

      {nonSystemToday.length > 0 && (
        <>
          <SectionLabel label="Earlier Today" />
          {nonSystemToday.map((n) => (
            <NotificationCard key={n.id} notif={n} router={router} />
          ))}
        </>
      )}

      {nonSystemYesterday.length > 0 && (
        <>
          <SectionLabel label="Yesterday" />
          {nonSystemYesterday.map((n) => (
            <NotificationCard key={n.id} notif={n} router={router} />
          ))}
        </>
      )}

      {nonSystemOlder.length > 0 && (
        <>
          <SectionLabel label="Older" />
          {nonSystemOlder.map((n) => (
            <NotificationCard key={n.id} notif={n} router={router} />
          ))}
        </>
      )}

      {systemNotifs.length > 0 && (
        <>
          <SectionLabel label="System" />
          <GlassCard style={{ padding: 0 }}>
            <View style={{ paddingTop: 4, paddingBottom: 4 }}>
              {systemNotifs.map((n) => (
                <SystemNotif
                  key={n.id}
                  icon={n.payload.icon ?? 'information-circle-outline'}
                  title={n.payload.title ?? 'System'}
                  body={n.payload.message ?? n.payload.body ?? ''}
                  time={formatRelativeTime(n.createdAt)}
                  onPress={n.payload.route ? () => router.push(n.payload.route) : undefined}
                />
              ))}
            </View>
          </GlassCard>
        </>
      )}

      <View style={{ height: 40 }} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function InboxScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'messages' | 'activity'>('messages');
  const [refreshing, setRefreshing] = useState(false);

  // Badge counts
  const { data: conversationsData } = useConversations();
  const { data: unreadCount } = useUnreadNotificationCount();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadMessages = useMemo(() => {
    const items = conversationsData?.items ?? [];
    return items.reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversationsData]);

  const unreadActivity = typeof unreadCount === 'number' ? unreadCount : 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const handleMarkAllRead = useCallback(() => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      },
    });
  }, [markAllRead, queryClient]);

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={s.nav}>
          <View style={s.navSpacer} />
          <Text style={s.navTitle}>Inbox</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={s.navActionWrap}
            onPress={handleMarkAllRead}
          >
            <View style={s.navActionBtn}>
              {markAllRead.isPending ? (
                <ActivityIndicator size="small" color={T.textSecondary} />
              ) : (
                <Ionicons name="checkmark-done-outline" size={17} color={T.textSecondary} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Segmented Control */}
        <SegmentedControl
          active={activeTab}
          onChange={setActiveTab}
          unreadMessages={unreadMessages}
          unreadActivity={unreadActivity}
        />

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          key={activeTab}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B4DFF" colors={['#8B4DFF']} />
          }
        >
          {activeTab === 'messages'
            ? <MessagesTab router={router} />
            : <ActivityTab router={router} onSwitchToMessages={() => setActiveTab('messages')} />
          }
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
  scroll: { paddingTop: 10, paddingBottom: 32, gap: 12 },
});
