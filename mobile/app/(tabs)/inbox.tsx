import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Animated, LayoutAnimation, Platform, UIManager, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
function SegmentedControl({ active, onChange }: { active: 'messages' | 'activity'; onChange: (v: 'messages' | 'activity') => void }) {
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
          {active !== 'messages' && (
            <View style={seg.badge}><Text style={seg.badgeText}>3</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => handlePress('activity')} style={seg.tab}>
          <Ionicons name="pulse" size={14} color={active === 'activity' ? '#fff' : T.textMuted} />
          <Text style={[seg.tabText, active === 'activity' && seg.tabTextActive]}>Activity</Text>
          {active !== 'activity' && (
            <View style={seg.badge}><Text style={seg.badgeText}>9</Text></View>
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

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES TAB
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Message request data ───────────────────────────────────────────────────
const MESSAGE_REQUESTS = [
  { handle: 'NightOwl21', preview: 'Hey! Are you in Prof Kim\'s tutorial section?', time: '1h ago' },
  { handle: 'QuantumLeap', preview: 'Saw your post about the hackathon \u2014 interested in teaming up?', time: '3h ago' },
  { handle: 'CafeLatte99', preview: 'Hi, I\'m looking for a study group for STA247', time: '1d ago' },
];

// ─── Conversation data ─────────────────────────────────────────────────────
const CONVERSATIONS = [
  {
    id: '1', handle: 'StudyGuru', preview: 'For sure! Robarts 3rd floor works great', time: '2m ago',
    unread: 2, contextBadge: 'CSC263', contextColor: T.accentBlue, pinned: true,
  },
  {
    id: '2', handle: 'PixelFern42', preview: 'Hey, are you still selling the calculus textbook?', time: '32m ago',
    unread: 1, contextBadge: 'Marketplace', contextColor: T.accentOrange, pinned: false,
  },
  {
    id: '3', handle: 'CosmicNova88', preview: 'The study session yesterday was really helpful, thanks!', time: '1h ago',
    unread: 0, contextBadge: 'Study Session', contextColor: T.accentPurple, pinned: false,
  },
  {
    id: '4', handle: 'SilverMaple33', preview: 'I\'ll check the syllabus and get back to you', time: '3h ago',
    unread: 0, contextBadge: null, contextColor: null, pinned: false,
  },
  {
    id: '5', handle: 'VelvetStorm', preview: 'That prof review link was so helpful, thanks!', time: '1d ago',
    unread: 0, contextBadge: 'Career & Co-op', contextColor: T.accentGreen, pinned: false,
  },
];

// ─── Message requests section ───────────────────────────────────────────────
function MessageRequestsSection({ router }: { router: any }) {
  const [expanded, setExpanded] = useState(false);

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
            <Text style={mr.countText}>{MESSAGE_REQUESTS.length}</Text>
          </View>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={T.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={mr.list}>
          {MESSAGE_REQUESTS.map((req) => (
            <View key={req.handle} style={mr.reqRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/profile/${req.handle}` as any)}>
                <GradAvatar handle={req.handle} size={38} />
              </TouchableOpacity>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={mr.reqHandle}>@{req.handle}</Text>
                  <Text style={mr.reqTime}>{req.time}</Text>
                </View>
                <Text style={mr.reqPreview} numberOfLines={1}>{req.preview}</Text>
              </View>
              <View style={mr.reqActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Alert.alert('Accepted', `Chat with @${req.handle} started`)}
                  style={mr.acceptBtn}
                >
                  <Ionicons name="checkmark" size={14} color={T.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Ignored', `Request from @${req.handle} ignored`)}
                  style={mr.ignoreBtn}
                >
                  <Ionicons name="close" size={14} color={T.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
function ConversationRow({ conv, router }: { conv: typeof CONVERSATIONS[0]; router: any }) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => router.push(`/dm/${conv.id}` as any)}
      style={cv.row}
    >
      <View>
        <GradAvatar handle={conv.handle} size={46} />
        {conv.unread > 0 && (
          <View style={cv.unreadDot} />
        )}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[cv.name, conv.unread > 0 && { color: T.textPrimary }]}>@{conv.handle}</Text>
          <Text style={[cv.time, conv.unread > 0 && { color: T.accentPurple, fontWeight: '700' }]}>{conv.time}</Text>
        </View>
        <Text style={[cv.preview, conv.unread > 0 && { color: T.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
          {conv.preview}
        </Text>
        <View style={cv.metaRow}>
          {conv.contextBadge && (
            <View style={[cv.contextPill, { backgroundColor: conv.contextColor + '0C', borderColor: conv.contextColor + '20' }]}>
              <Text style={[cv.contextText, { color: conv.contextColor! }]}>{conv.contextBadge}</Text>
            </View>
          )}
          {conv.pinned && (
            <View style={cv.pinnedBadge}>
              <Ionicons name="pin" size={9} color={T.accentOrange} />
            </View>
          )}
        </View>
      </View>
      {conv.unread > 0 && (
        <View style={cv.unreadBadge}>
          <Text style={cv.unreadText}>{conv.unread}</Text>
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
  const pinned = CONVERSATIONS.filter((c) => c.pinned);
  const rest = CONVERSATIONS.filter((c) => !c.pinned);

  return (
    <>
      <MessageRequestsSection router={router} />

      {pinned.length > 0 && (
        <>
          <SectionLabel label="Pinned" />
          {pinned.map((c) => <ConversationRow key={c.id} conv={c} router={router} />)}
        </>
      )}

      <SectionLabel label="Recent" />
      {rest.map((c) => <ConversationRow key={c.id} conv={c} router={router} />)}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY TAB
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Activity summary navigation card ───────────────────────────────────────
function ActivitySummaryNav({ onSwitchToMessages }: { onSwitchToMessages: () => void }) {
  const items = [
    { icon: 'chatbubble-outline', count: 7, label: 'Replies', color: T.accentBlue },
    { icon: 'at', count: 2, label: 'Mentions', color: T.accentPurple },
    { icon: 'trending-up-outline', count: 3, label: 'Threads', color: T.accentGreen },
    { icon: 'mail-outline', count: 3, label: 'Messages', color: T.accentPink, onPress: onSwitchToMessages },
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

// ─── Activity tab content ───────────────────────────────────────────────────
function ActivityTab({ router, onSwitchToMessages }: { router: any; onSwitchToMessages: () => void }) {
  return (
    <>
      <ActivitySummaryNav onSwitchToMessages={onSwitchToMessages} />

      {/* ── New ── */}
      <SectionLabel label="New" />

      <GroupedReplyNotif
        threadTitle="Anyone have experience with the registrar appeals process?"
        replyCount={3}
        handles={['CosmicNova88', 'SilverMaple33', 'VelvetStorm']}
        latestPreview='"Did you CC the department? They tend to respond way faster..."'
        time="5m ago"
        unread
        onPress={() => router.push('/post/1')}
      />

      <GroupedMentionNotif
        board="Housing"
        mentionCount={2}
        preview="@AnonBio12 actually brought this up last week \u2014 check their post in Housing"
        time="18m ago"
        unread
        onPress={() => router.push('/post/1')}
      />

      {/* ── Earlier Today ── */}
      <SectionLabel label="Earlier Today" />

      <ThreadMomentumCard
        threadTitle="Anyone else think the MAT237 midterm grading curve was way off?"
        newReplies={12}
        viewIncrease={340}
        time="2h ago"
        onPress={() => router.push('/post/1')}
      />

      <GroupedReplyNotif
        threadTitle="Best study spots on campus after 8 PM?"
        replyCount={5}
        handles={['StudyGuru', 'NightOwl21', 'QuantumLeap']}
        latestPreview='"Robarts 3rd floor is unbeatable after 8 PM, trust me"'
        time="3h ago"
        onPress={() => router.push('/post/1')}
      />

      <PollResultNotif
        question="Should the library extend hours during finals?"
        winner="Yes, until 2 AM"
        percent={73}
        time="4h ago"
        onPress={() => router.push('/polls')}
      />

      {/* ── Yesterday ── */}
      <SectionLabel label="Yesterday" />

      <ThreadMomentumCard
        threadTitle="Free coffee at Robarts until noon \u2014 Hart House study week pop-up"
        newReplies={8}
        viewIncrease={520}
        time="Yesterday"
        onPress={() => router.push('/post/1')}
      />

      {/* ── System ── */}
      <SectionLabel label="System" />

      <GlassCard style={{ padding: 0 }}>
        <View style={{ paddingTop: 4, paddingBottom: 4 }}>
          <SystemNotif
            icon="shield-checkmark-outline"
            title="Post approved"
            body="Your post in Classes was reviewed and approved."
            time="4h ago"
          />
          <SystemNotif
            icon="megaphone-outline"
            title="New feature"
            body="Study Buddy matching is now available \u2014 try it out!"
            time="1d ago"
            onPress={() => router.push('/study-buddy')}
          />
          <SystemNotif
            icon="information-circle-outline"
            title="Privacy update"
            body="We\u2019ve updated our privacy policy. Tap to review."
            time="3d ago"
          />
        </View>
      </GlassCard>

      <View style={{ height: 40 }} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function InboxScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'messages' | 'activity'>('messages');
  const [refreshing, setRefreshing] = useState(false);
  const [allRead, setAllRead] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

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
            onPress={() => setAllRead(true)}
          >
            <View style={s.navActionBtn}>
              <Ionicons name="checkmark-done-outline" size={17} color={T.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Segmented Control */}
        <SegmentedControl active={activeTab} onChange={setActiveTab} />

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
