import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
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

function avatarGrad(handle: string): [string, string] {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) % AVATAR_GRADS.length;
  return AVATAR_GRADS[h];
}

function GradAvatar({ handle, size = 40 }: { handle: string; size?: number }) {
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

// ─── Filter chips ─────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Replies', 'Mentions', 'Messages', 'System'];

function FilterChips({ active, onSelect }: { active: string; onSelect: (f: string) => void }) {
  return (
    <ScrollView
      horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={fc.row}
    >
      {FILTERS.map((f) => {
        const isActive = f === active;
        return (
          <TouchableOpacity
            key={f}
            onPress={() => onSelect(f)}
            activeOpacity={0.75}
            style={fc.chipShadow}
          >
            {isActive ? (
              <LinearGradient
                colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={fc.chipActive}
              >
                <Text style={fc.chipActiveText}>{f}</Text>
              </LinearGradient>
            ) : (
              <View style={fc.chipInactive}>
                <Text style={fc.chipInactiveText}>{f}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const fc = StyleSheet.create({
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

// ─── Activity Summary ─────────────────────────────────────────────────────────
function ActivitySummary() {
  return (
    <View style={as.shadow}>
      <View style={as.card}>
        <View style={as.statsRow}>
          <SummaryItem icon="chatbubble-outline" count={7} label="replies" color={T.accentBlue} />
          <View style={as.divider} />
          <SummaryItem icon="at" count={2} label="mentions" color={T.accentPurple} />
          <View style={as.divider} />
          <SummaryItem icon="mail-outline" count={1} label="message" color={T.accentPink} />
        </View>
      </View>
    </View>
  );
}

function SummaryItem({ icon, count, label, color }: { icon: string; count: number; label: string; color: string }) {
  return (
    <View style={as.item}>
      <View style={[as.iconWrap, { backgroundColor: color + '12' }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <Text style={as.countText}>{count}</Text>
      <Text style={as.labelText}>{label}</Text>
    </View>
  );
}

const as = StyleSheet.create({
  shadow: {
    borderRadius: 22, marginHorizontal: 22,
    shadowColor: '#8B4DFF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  card: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    paddingVertical: 16, paddingHorizontal: 12,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly',
  },
  divider: {
    width: 1, height: 28, backgroundColor: 'rgba(17,17,17,0.06)',
  },
  item: { alignItems: 'center', gap: 4 },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  countText: { fontSize: 16, fontWeight: '800', color: T.textPrimary },
  labelText: { fontSize: 11, color: T.textMuted, fontWeight: '500' },
});

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <View style={sl.row}>
      <Text style={sl.text}>{label}</Text>
      <View style={sl.line} />
    </View>
  );
}

const sl = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 22, marginBottom: 4, marginTop: 2 },
  text: { fontSize: 11, fontWeight: '800', color: T.textMuted, letterSpacing: 0.6 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(17,17,17,0.06)' },
});

// ─── Base notification card ───────────────────────────────────────────────────
function NotifCard({
  unread, children, onPress, accentColors,
}: {
  unread?: boolean; children: React.ReactNode; onPress?: () => void; accentColors?: [string, string];
}) {
  return (
    <View style={[nc.shadow, !unread && nc.shadowRead]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.86}>
        <View style={[nc.inner, !unread && nc.innerRead]}>
          {unread && (
            <LinearGradient
              colors={accentColors ?? [T.accentBlue, T.accentPurple]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={nc.accent}
            />
          )}
          {children}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const nc = StyleSheet.create({
  shadow: {
    borderRadius: 22, marginHorizontal: 22, marginBottom: 10,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 18, elevation: 5,
  },
  shadowRead: { shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  inner: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 16, gap: 8,
  },
  innerRead: { opacity: 0.72 },
  accent: {
    position: 'absolute', left: 0, top: 12, bottom: 12,
    width: 3, borderRadius: 2,
  },
});

// ─── Reply notification ───────────────────────────────────────────────────────
function ReplyNotif({ handle, preview, time, unread, onPress }: {
  handle: string; preview: string; time: string; unread?: boolean; onPress?: () => void;
}) {
  return (
    <NotifCard unread={unread} onPress={onPress} accentColors={[T.accentBlue, '#6B7CFF']}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <GradAvatar handle={handle} size={38} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '400', color: T.textSecondary, flex: 1, lineHeight: 19 }}>
              <Text style={{ fontWeight: '700', color: T.textPrimary }}>{handle}</Text>
              {' '}replied to your comment
            </Text>
            <Text style={{ fontSize: 11, color: T.textMuted, flexShrink: 0, marginTop: 2 }}>{time}</Text>
          </View>
          <Text style={{ fontSize: 13, color: T.textSecondary, lineHeight: 19 }} numberOfLines={2}>
            {preview}
          </Text>
          <View style={{ marginTop: 2 }}>
            <View style={pill.reply}>
              <Ionicons name="return-down-forward-outline" size={11} color={T.accentBlue} />
              <Text style={pill.replyText}>View thread</Text>
            </View>
          </View>
        </View>
      </View>
    </NotifCard>
  );
}

const pill = StyleSheet.create({
  reply: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 4, backgroundColor: 'rgba(75,80,248,0.08)',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1, borderColor: 'rgba(75,80,248,0.14)',
  },
  replyText: { fontSize: 10, fontWeight: '700', color: T.accentBlue },
});

// ─── Mention notification ─────────────────────────────────────────────────────
function MentionNotif({ preview, board, time, unread, onPress }: {
  preview: string; board: string; time: string; unread?: boolean; onPress?: () => void;
}) {
  return (
    <NotifCard unread={unread} onPress={onPress} accentColors={[T.accentPurple, '#C47EFF']}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={mnt.icon}>
          <Ionicons name="at" size={18} color={T.accentPurple} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: T.textPrimary }}>You were mentioned</Text>
            <Text style={{ fontSize: 11, color: T.textMuted }}>{time}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={mnt.boardPill}>
              <Text style={mnt.boardText}>{board}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: T.textSecondary, lineHeight: 19 }} numberOfLines={2}>
            {preview}
          </Text>
        </View>
      </View>
    </NotifCard>
  );
}

const mnt = StyleSheet.create({
  icon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(139,77,255,0.09)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.14)',
  },
  boardPill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
    backgroundColor: 'rgba(139,77,255,0.09)', borderWidth: 1, borderColor: 'rgba(139,77,255,0.16)',
  },
  boardText: { fontSize: 10, fontWeight: '700', color: T.accentPurple, letterSpacing: 0.2 },
});

// ─── Message notification ─────────────────────────────────────────────────────
function MessageNotif({ handle, preview, time, unread, onPress }: {
  handle: string; preview: string; time: string; unread?: boolean; onPress?: () => void;
}) {
  return (
    <NotifCard unread={unread} onPress={onPress} accentColors={[T.accentPink, '#C47EFF']}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={msg.iconWrap}>
          <GradAvatar handle={handle} size={30} />
          <View style={msg.dmBadge}>
            <Ionicons name="mail" size={9} color={T.white} />
          </View>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: T.textPrimary, flex: 1 }}>{handle}</Text>
            <Text style={{ fontSize: 11, color: T.textMuted, flexShrink: 0, marginTop: 2 }}>{time}</Text>
          </View>
          <Text style={{ fontSize: 13, color: T.textSecondary, lineHeight: 19 }} numberOfLines={2}>
            {preview}
          </Text>
          <View style={{ marginTop: 2 }}>
            <View style={msg.replyPill}>
              <Ionicons name="chatbubble-outline" size={10} color={T.accentPink} />
              <Text style={msg.replyPillText}>Reply</Text>
            </View>
          </View>
        </View>
      </View>
    </NotifCard>
  );
}

const msg = StyleSheet.create({
  iconWrap: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  dmBadge: {
    position: 'absolute', bottom: -1, right: -1,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: T.accentPink,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  replyPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 4, backgroundColor: 'rgba(230,85,197,0.08)',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1, borderColor: 'rgba(230,85,197,0.14)',
  },
  replyPillText: { fontSize: 10, fontWeight: '700', color: T.accentPink },
});

// ─── System notification ──────────────────────────────────────────────────────
function SystemNotif({ title, body, time, unread, onPress }: {
  title: string; body: string; time: string; unread?: boolean; onPress?: () => void;
}) {
  return (
    <NotifCard unread={unread} onPress={onPress} accentColors={['#6E7388', '#8A90A2']}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={sys.icon}>
          <Ionicons name="shield-checkmark-outline" size={17} color="#6E7388" />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: T.textPrimary }}>{title}</Text>
            <Text style={{ fontSize: 11, color: T.textMuted }}>{time}</Text>
          </View>
          <Text style={{ fontSize: 13, color: T.textSecondary, lineHeight: 19 }} numberOfLines={2}>
            {body}
          </Text>
        </View>
      </View>
    </NotifCard>
  );
}

const sys = StyleSheet.create({
  icon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(110,115,136,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(110,115,136,0.12)',
  },
});

// ─── Thread activity (someone replied after you) ─────────────────────────────
function ThreadActivityNotif({ threadTitle, newReplies, time, onPress }: {
  threadTitle: string; newReplies: number; time: string; onPress?: () => void;
}) {
  return (
    <NotifCard onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={ta.icon}>
          <Ionicons name="chatbubbles-outline" size={17} color={T.accentBlue} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, color: T.textMuted }}>{time}</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: T.textPrimary, lineHeight: 19 }} numberOfLines={2}>
            {threadTitle}
          </Text>
          <Text style={{ fontSize: 12, color: T.textMuted }}>
            <Text style={{ fontWeight: '700', color: T.accentBlue }}>{newReplies}</Text> new replies since you left
          </Text>
        </View>
      </View>
    </NotifCard>
  );
}

const ta = StyleSheet.create({
  icon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(75,80,248,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(75,80,248,0.12)',
  },
});

// ─── Quiet state ──────────────────────────────────────────────────────────────
// Used when activity list is empty
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function QuietState({ onExplore }: { onExplore: () => void }) {
  return (
    <View style={qs.shadow}>
      <View style={qs.card}>
        <Ionicons name="leaf-outline" size={28} color={T.textMuted} />
        <Text style={qs.title}>All caught up</Text>
        <Text style={qs.body}>No new activity right now. Check back later or jump into campus discussions.</Text>
        <TouchableOpacity onPress={onExplore} activeOpacity={0.8}>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={qs.btn}>
            <Text style={qs.btnText}>Explore campus</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const qs = StyleSheet.create({
  shadow: {
    borderRadius: 24, marginHorizontal: 22,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  card: {
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.58)',
    paddingVertical: 32, paddingHorizontal: 24,
    alignItems: 'center', gap: 10,
  },
  title: { fontSize: 16, fontWeight: '800', color: T.textPrimary, marginTop: 4 },
  body: { fontSize: 13, color: T.textMuted, textAlign: 'center', lineHeight: 19 },
  btn: {
    height: 36, paddingHorizontal: 20, borderRadius: 99,
    alignItems: 'center', justifyContent: 'center', marginTop: 6,
  },
  btnText: { fontSize: 13, fontWeight: '700', color: T.white },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function InboxScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');

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
            onPress={() => Alert.alert('Inbox', 'Mark all as read')}
          >
            <View style={s.navActionBtn}>
              <Ionicons name="checkmark-done-outline" size={17} color={T.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Filters */}
          <FilterChips active={filter} onSelect={setFilter} />

          {/* Summary */}
          <ActivitySummary />

          {/* New */}
          <SectionLabel label="NEW" />

          <ReplyNotif
            handle="CosmicNova88"
            preview="Did you CC the department? They tend to respond way faster than the prof directly."
            time="5m ago"
            unread
            onPress={() => router.push('/post/1')}
          />

          <MentionNotif
            preview="@AnonBio12 actually brought this up last week — check their post in Housing"
            board="Housing"
            time="18m ago"
            unread
            onPress={() => router.push('/post/1')}
          />

          <MessageNotif
            handle="PixelFern42"
            preview="Hey, are you still selling the calculus textbook? I can meet at Robarts."
            time="32m ago"
            unread
            onPress={() => router.push('/post/1')}
          />

          {/* Earlier */}
          <SectionLabel label="EARLIER" />

          <ReplyNotif
            handle="SilverMaple33"
            preview="The registrar process takes 2 weeks but it's worth it if you have a strong case."
            time="1h ago"
            onPress={() => router.push('/post/1')}
          />

          <ThreadActivityNotif
            threadTitle="Anyone else think the MAT237 midterm grading curve was way off?"
            newReplies={3}
            time="2h ago"
            onPress={() => router.push('/post/1')}
          />

          <SystemNotif
            title="Community update"
            body="Your post in Classes was reviewed and approved by moderators."
            time="4h ago"
            onPress={() => router.push('/post/1')}
          />

          <ReplyNotif
            handle="VelvetStorm"
            preview="Worth documenting everything before submitting — rate my prof reviews confirm this pattern."
            time="5h ago"
            onPress={() => router.push('/post/1')}
          />

          <ThreadActivityNotif
            threadTitle="Free coffee at Robarts until noon — Hart House study week pop-up"
            newReplies={8}
            time="6h ago"
            onPress={() => router.push('/post/1')}
          />

          <View style={{ height: 40 }} />
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
  navTitle: { fontSize: 18, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  scroll: { paddingTop: 4, paddingBottom: 32, gap: 14 },
});
