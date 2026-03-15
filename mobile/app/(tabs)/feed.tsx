import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

// ─── Mock feed data ───────────────────────────────────────────────────────────
type FeedItem = {
  id: string;
  type: 'post' | 'poll' | 'event' | 'milestone';
  author: string;
  handle: string;
  isAnonymous: boolean;
  board: string;
  boardColor: string;
  community?: string;
  text: string;
  time: string;
  upvotes: number;
  comments: number;
  // poll-specific
  pollOptions?: { label: string; votes: number }[];
  // event-specific
  eventDate?: string;
  eventLocation?: string;
  eventAttendees?: number;
  // milestone
  milestoneIcon?: string;
  milestoneColor?: string;
};

const FEED_DATA: FeedItem[] = [
  {
    id: '1', type: 'post', author: 'Anonymous', handle: 'anon', isAnonymous: true,
    board: 'Confessions', boardColor: '#E655C5',
    text: 'I accidentally submitted the wrong file for my final project and the prof gave me a 92 anyway. I still haven\'t told anyone.',
    time: '8m', upvotes: 217, comments: 43,
  },
  {
    id: '2', type: 'poll', author: 'Sarah K.', handle: 'sarahk', isAnonymous: false,
    board: 'Classes', boardColor: '#4B50F8', community: 'MAT237',
    text: 'How did everyone feel about the midterm?',
    time: '15m', upvotes: 89, comments: 34,
    pollOptions: [
      { label: 'Easy — I\'m fine', votes: 12 },
      { label: 'Fair but tricky', votes: 48 },
      { label: 'Absolutely brutal', votes: 67 },
      { label: 'I blacked out', votes: 31 },
    ],
  },
  {
    id: '3', type: 'event', author: 'Hart House', handle: 'harthouse', isAnonymous: false,
    board: 'Events', boardColor: '#8B4DFF',
    text: 'Study Week Pop-Up: Free Coffee & Donuts',
    time: '22m', upvotes: 134, comments: 18,
    eventDate: 'Today, 11:00 AM – 2:00 PM',
    eventLocation: 'Hart House Great Hall',
    eventAttendees: 86,
  },
  {
    id: '4', type: 'post', author: 'Mike T.', handle: 'miket', isAnonymous: false,
    board: 'Housing', boardColor: '#6B7CFF',
    text: 'Subletting my 1BR near campus this summer. Fully furnished, $1200/mo, 5 min walk to Robarts. DM if interested.',
    time: '38m', upvotes: 24, comments: 11,
  },
  {
    id: '5', type: 'milestone', author: '', handle: '', isAnonymous: false,
    board: 'Campus', boardColor: '#3DAB73',
    text: 'CSC263 community just hit 500 members!',
    time: '1h', upvotes: 45, comments: 8,
    milestoneIcon: 'trophy-outline', milestoneColor: '#F1973B',
  },
  {
    id: '6', type: 'post', author: 'Anonymous', handle: 'anon2', isAnonymous: true,
    board: 'Confessions', boardColor: '#E655C5',
    text: 'The person who sits behind me in PSY100 always smells like fresh cookies and it\'s genuinely the highlight of my Mondays.',
    time: '1h', upvotes: 312, comments: 67,
  },
  {
    id: '7', type: 'post', author: 'Chris L.', handle: 'chrisl', isAnonymous: false,
    board: 'Classes', boardColor: '#4B50F8', community: 'CSC108',
    text: 'Pro tip: Professor Diane\'s office hours are WAY less crowded on Thursdays. Got my entire assignment reviewed in 10 mins.',
    time: '2h', upvotes: 78, comments: 15,
  },
  {
    id: '8', type: 'poll', author: 'Campus Life', handle: 'campuslife', isAnonymous: false,
    board: 'Social', boardColor: '#3DAB73',
    text: 'Best study spot on campus?',
    time: '2h', upvotes: 156, comments: 42,
    pollOptions: [
      { label: 'Robarts Library', votes: 89 },
      { label: 'Gerstein', votes: 45 },
      { label: 'Bahen Centre', votes: 34 },
      { label: 'A random bench outside', votes: 62 },
    ],
  },
  {
    id: '9', type: 'event', author: 'CS Student Union', handle: 'cssu', isAnonymous: false,
    board: 'Events', boardColor: '#8B4DFF',
    text: 'Hackathon Info Session — Build your team!',
    time: '3h', upvotes: 67, comments: 23,
    eventDate: 'Tomorrow, 6:00 PM',
    eventLocation: 'Bahen Centre BA1190',
    eventAttendees: 42,
  },
  {
    id: '10', type: 'post', author: 'Jessica W.', handle: 'jessicaw', isAnonymous: false,
    board: 'Marketplace', boardColor: '#F1973B',
    text: 'Selling Stewart Calculus 9th Ed — $40. Barely used (I wish I could say the same about the knowledge). Pick up at Robarts.',
    time: '3h', upvotes: 33, comments: 7,
  },
];

// ─── Presence strip ──────────────────────────────────────────────────────────
const ACTIVE_USERS = [
  'Sarah K.', 'Mike T.', 'Chris L.', 'Anonymous', 'Jessica W.',
  'Alex R.', 'Jordan P.', 'Anonymous', 'Sam H.', 'Taylor N.',
  'Anonymous', 'Casey M.',
];

function PresenceStrip() {
  return (
    <View style={ps.wrap}>
      <View style={ps.avatarStack}>
        {ACTIVE_USERS.slice(0, 6).map((name, i) => (
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

function PostCard({ item, onPress }: { item: FeedItem; onPress: () => void }) {
  const ag = avatarGrad(item.handle);
  return (
    <View style={fd.shadow}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        <View style={fd.card}>
          {/* Author row */}
          <View style={fd.authorRow}>
            <LinearGradient colors={ag} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={fd.avatar}>
              {item.isAnonymous ? (
                <Ionicons name="eye-off" size={14} color="rgba(255,255,255,0.9)" />
              ) : (
                <Text style={fd.avatarLetter}>{item.author[0]}</Text>
              )}
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={fd.authorName}>{item.author}</Text>
              <View style={fd.authorMeta}>
                <View style={[fd.boardPill, { backgroundColor: item.boardColor + '10', borderColor: item.boardColor + '20' }]}>
                  <Text style={[fd.boardPillText, { color: item.boardColor }]}>{item.board}</Text>
                </View>
                {item.community && (
                  <Text style={fd.communityText}>in {item.community}</Text>
                )}
              </View>
            </View>
            <Text style={fd.time}>{item.time}</Text>
          </View>

          {/* Body */}
          <Text style={fd.body}>{item.text}</Text>

          {/* Actions */}
          <View style={fd.actionsRow}>
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-up-outline" size={16} color={T.accentBlue} />
              <Text style={[fd.actionText, { color: T.accentBlue }]}>{item.upvotes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={14} color={T.textMuted} />
              <Text style={fd.actionText}>{item.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={15} color={T.textMuted} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons name="bookmark-outline" size={15} color={T.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function PollCard({ item, onPress }: { item: FeedItem; onPress: () => void }) {
  const ag = avatarGrad(item.handle);
  const totalVotes = item.pollOptions?.reduce((sum, o) => sum + o.votes, 0) ?? 1;

  return (
    <View style={fd.shadow}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        <View style={fd.card}>
          {/* Author row */}
          <View style={fd.authorRow}>
            <LinearGradient colors={ag} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={fd.avatar}>
              <Text style={fd.avatarLetter}>{item.author[0]}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={fd.authorName}>{item.author}</Text>
              <View style={fd.authorMeta}>
                <View style={[fd.boardPill, { backgroundColor: item.boardColor + '10', borderColor: item.boardColor + '20' }]}>
                  <Text style={[fd.boardPillText, { color: item.boardColor }]}>{item.board}</Text>
                </View>
                {item.community && <Text style={fd.communityText}>in {item.community}</Text>}
                <View style={pl.pollBadge}>
                  <Ionicons name="stats-chart-outline" size={10} color={T.accentPurple} />
                  <Text style={pl.pollBadgeText}>Poll</Text>
                </View>
              </View>
            </View>
            <Text style={fd.time}>{item.time}</Text>
          </View>

          <Text style={fd.body}>{item.text}</Text>

          {/* Poll options */}
          <View style={pl.options}>
            {item.pollOptions?.map((opt, i) => {
              const pct = Math.round((opt.votes / totalVotes) * 100);
              const isTop = opt.votes === Math.max(...(item.pollOptions?.map(o => o.votes) ?? [0]));
              return (
                <View key={i} style={pl.optionWrap}>
                  <View style={[pl.optionBar, { width: `${pct}%`, backgroundColor: isTop ? T.accentBlue + '14' : 'rgba(17,17,17,0.04)' }]} />
                  <Text style={[pl.optionLabel, isTop && { color: T.accentBlue, fontWeight: '700' }]}>{opt.label}</Text>
                  <Text style={[pl.optionPct, isTop && { color: T.accentBlue }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>
          <Text style={pl.totalVotes}>{totalVotes} votes</Text>

          {/* Actions */}
          <View style={fd.actionsRow}>
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-up-outline" size={16} color={T.accentBlue} />
              <Text style={[fd.actionText, { color: T.accentBlue }]}>{item.upvotes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={14} color={T.textMuted} />
              <Text style={fd.actionText}>{item.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={fd.actionBtn} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={15} color={T.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function EventCard({ item, onPress }: { item: FeedItem; onPress: () => void }) {
  return (
    <View style={fd.shadow}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        <View style={[fd.card, { borderLeftWidth: 3, borderLeftColor: item.boardColor }]}>
          {/* Event header */}
          <View style={fd.authorRow}>
            <View style={[ev.iconWrap, { backgroundColor: item.boardColor + '14' }]}>
              <Ionicons name="calendar" size={18} color={item.boardColor} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={fd.authorMeta}>
                <View style={[fd.boardPill, { backgroundColor: item.boardColor + '10', borderColor: item.boardColor + '20' }]}>
                  <Text style={[fd.boardPillText, { color: item.boardColor }]}>{item.board}</Text>
                </View>
                <Text style={fd.time}>{item.time}</Text>
              </View>
            </View>
          </View>

          <Text style={[fd.body, { fontWeight: '700', fontSize: 15 }]}>{item.text}</Text>

          {/* Event details */}
          <View style={ev.details}>
            <View style={ev.detailRow}>
              <Ionicons name="time-outline" size={14} color={T.accentPurple} />
              <Text style={ev.detailText}>{item.eventDate}</Text>
            </View>
            <View style={ev.detailRow}>
              <Ionicons name="location-outline" size={14} color={T.accentBlue} />
              <Text style={ev.detailText}>{item.eventLocation}</Text>
            </View>
          </View>

          {/* Attendees + actions */}
          <View style={fd.actionsRow}>
            <View style={ev.attendeeWrap}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[ev.miniAvatar, { marginLeft: i === 0 ? 0 : -6, zIndex: 3 - i }]}>
                  <LinearGradient colors={AVATAR_GRADS[i]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ev.miniAvatarGrad} />
                </View>
              ))}
              <Text style={ev.attendeeText}>{item.eventAttendees} going</Text>
            </View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity activeOpacity={0.8}>
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ev.rsvpBtn}>
                <Text style={ev.rsvpText}>RSVP</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function MilestoneCard({ item }: { item: FeedItem }) {
  return (
    <View style={ms.wrap}>
      <View style={ms.line} />
      <View style={[ms.iconWrap, { backgroundColor: (item.milestoneColor ?? T.accentBlue) + '14' }]}>
        <Ionicons name={(item.milestoneIcon ?? 'trophy-outline') as any} size={16} color={item.milestoneColor ?? T.accentBlue} />
      </View>
      <Text style={ms.text}>{item.text}</Text>
      <Text style={ms.time}>{item.time}</Text>
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

const pl = StyleSheet.create({
  pollBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(139,77,255,0.08)',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99,
  },
  pollBadgeText: { fontSize: 10, fontWeight: '700', color: T.accentPurple },
  options: { gap: 6 },
  optionWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 38, borderRadius: 10,
    backgroundColor: 'rgba(17,17,17,0.02)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.04)',
    overflow: 'hidden', paddingHorizontal: 12,
  },
  optionBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    borderRadius: 10,
  },
  optionLabel: { flex: 1, fontSize: 12, color: T.textSecondary, fontWeight: '500' },
  optionPct: { fontSize: 12, color: T.textMuted, fontWeight: '700' },
  totalVotes: { fontSize: 11, color: T.textMuted },
});

const ev = StyleSheet.create({
  iconWrap: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  details: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 12, color: T.textSecondary },
  attendeeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniAvatar: { borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)' },
  miniAvatarGrad: { width: 16, height: 16, borderRadius: 8 },
  attendeeText: { fontSize: 11, color: T.textMuted, fontWeight: '600' },
  rsvpBtn: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99,
  },
  rsvpText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});

const ms = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 22, paddingVertical: 8,
  },
  line: {
    flex: 0, width: 2, height: 24,
    backgroundColor: 'rgba(17,17,17,0.06)', borderRadius: 1,
  },
  iconWrap: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { flex: 1, fontSize: 12, color: T.textSecondary, fontWeight: '600' },
  time: { fontSize: 11, color: T.textMuted },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('For You');
  const scrollY = useRef(new Animated.Value(0)).current;

  const renderItem = useCallback(({ item }: { item: FeedItem }) => {
    switch (item.type) {
      case 'poll':
        return <PollCard item={item} onPress={() => router.push(`/post/${item.id}` as any)} />;
      case 'event':
        return <EventCard item={item} onPress={() => router.push(`/post/${item.id}` as any)} />;
      case 'milestone':
        return <MilestoneCard item={item} />;
      default:
        return <PostCard item={item} onPress={() => router.push(`/post/${item.id}` as any)} />;
    }
  }, []);

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

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header onBell={() => router.push('/(tabs)/inbox')} />

        <Animated.FlatList
          data={FEED_DATA}
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
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 32 },
});
