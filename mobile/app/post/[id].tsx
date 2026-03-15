import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
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
  green:         '#2BC77A',
};

const BG:  [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];
const PUB: [string, string, string] = ['#3DAB73', '#2BC77A', '#1EB589'];

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

// ─── Mock data ────────────────────────────────────────────────────────────────
const POST = {
  category: 'Classes',
  categoryIcon: 'school-outline' as const,
  categoryColor: '#4B50F8',
  board: 'MAT237 · U of T',
  title: 'Anyone else think the MAT237 exam grading was way off this semester?',
  body: "Got my midterm back and lost 8 points on a question I had completely correct. The TA wrote 'insufficient justification' but there's literally a full proof there. Has anyone else had issues with this?",
  author: 'AnonBio12',
  timestamp: '2h ago',
  upvotes: 142,
  commentCount: 38,
  viewCount: 891,
  activeNow: 12,
};

type Reply = {
  id: string; author: string; timestamp: string; text: string;
  upvotes: number; isOp?: boolean;
};

type Comment = {
  id: string; author: string; timestamp: string; text: string;
  upvotes: number; isHot?: boolean; isHelpful?: boolean;
  replies: Reply[];
};

const COMMENTS: Comment[] = [
  {
    id: 'c1', author: 'CosmicNova88', timestamp: '1h ago',
    text: 'Same thing happened to me on Q3. Lost 5 points and the solution was identical to the one in lecture slides. Emailed the prof and got no response yet.',
    upvotes: 47, isHot: true,
    replies: [
      { id: 'r1', author: 'BlueMoonTide', timestamp: '58m ago', text: 'Did you CC the department? That tends to get faster responses.', upvotes: 12 },
      { id: 'r2', author: 'AnonBio12', timestamp: '45m ago', text: 'OP here — good idea, going to try that.', upvotes: 8, isOp: true },
    ],
  },
  {
    id: 'c2', author: 'SilverMaple33', timestamp: '52m ago',
    text: "There's a formal grade review process through the registrar. Takes 2 weeks but if you're right you get the points back + apology.",
    upvotes: 29, isHelpful: true, replies: [],
  },
  {
    id: 'c3', author: 'VelvetStorm', timestamp: '34m ago',
    text: 'This prof has a history of vague grading rubrics. Rate My Prof reviews are full of it. Worth documenting everything before submitting anything.',
    upvotes: 18,
    replies: [
      { id: 'r3', author: 'PrismaticFox', timestamp: '20m ago', text: '100% agree. Take screenshots of everything before submitting any re-grade request.', upvotes: 7 },
    ],
  },
  {
    id: 'c4', author: 'AquaSpectra', timestamp: '12m ago',
    text: 'Starting a group chat for everyone affected. DM me if you want in — strength in numbers.',
    upvotes: 61, replies: [],
  },
];

// ─── GradAvatar ───────────────────────────────────────────────────────────────
function GradAvatar({ handle, size = 36 }: { handle: string; size?: number }) {
  const grad = avatarGrad(handle);
  return (
    <LinearGradient
      colors={grad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: size * 0.36, fontWeight: '800', color: '#fff' }}>
        {handle[0].toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

// ─── UpvoteBtn ────────────────────────────────────────────────────────────────
function UpvoteBtn({ count, size = 'md' }: { count: number; size?: 'sm' | 'md' }) {
  const [liked, setLiked] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const isSm = size === 'sm';

  const press = () => {
    setLiked(v => !v);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.4, duration: 90, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  return (
    <TouchableOpacity onPress={press} activeOpacity={0.75} style={ub.wrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={liked ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
          size={isSm ? 16 : 18}
          color={liked ? T.accentBlue : T.textMuted}
        />
      </Animated.View>
      <Text style={[ub.count, isSm && ub.countSm, liked && { color: T.accentBlue }]}>
        {liked ? count + 1 : count}
      </Text>
    </TouchableOpacity>
  );
}

const ub = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { fontSize: 13, fontWeight: '700', color: T.textMuted },
  countSm: { fontSize: 11 },
});

// ─── PostHeroCard ─────────────────────────────────────────────────────────────
// Premium anchor card for the original post — elevated, spacious, clear hierarchy.
function PostHeroCard() {
  return (
    <View style={hero.outer}>
      {/* Subtle gradient glow behind card */}
      <LinearGradient
        colors={['rgba(139,77,255,0.08)', 'rgba(75,80,248,0.04)', 'transparent']}
        style={hero.glow}
      />
      <View style={hero.card}>
        {/* Board context row */}
        <View style={hero.boardRow}>
          <View style={hero.boardPill}>
            <Ionicons name={POST.categoryIcon} size={12} color={POST.categoryColor} />
            <Text style={[hero.boardText, { color: POST.categoryColor }]}>{POST.board}</Text>
          </View>
          <Text style={hero.timestamp}>{POST.timestamp}</Text>
        </View>

        {/* Author */}
        <View style={hero.authorRow}>
          <GradAvatar handle={POST.author} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={hero.handle}>{POST.author}</Text>
            <Text style={hero.authorSub}>Anonymous student</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={hero.moreBtn}>
            <Ionicons name="ellipsis-horizontal" size={16} color={T.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={hero.title}>{POST.title}</Text>

        {/* Body */}
        <Text style={hero.body}>{POST.body}</Text>

        {/* Interaction bar */}
        <View style={hero.divider} />
        <View style={hero.actions}>
          <UpvoteBtn count={POST.upvotes} />

          <TouchableOpacity style={hero.actionBtn} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={16} color={T.textMuted} />
            <Text style={hero.actionText}>{POST.commentCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={hero.actionBtn} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={16} color={T.textMuted} />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <TouchableOpacity style={hero.actionBtn} activeOpacity={0.7}>
            <Ionicons name="bookmark-outline" size={16} color={T.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const hero = StyleSheet.create({
  outer: { position: 'relative' },
  glow: {
    position: 'absolute', top: -12, left: -8, right: -8, bottom: -8,
    borderRadius: 36,
  },
  card: {
    backgroundColor: GLASS,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: GLASS_BORDER,
    padding: 22,
    gap: 14,
    shadowColor: '#8B4DFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 10,
  },
  boardRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  boardPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(75,80,248,0.08)',
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(75,80,248,0.14)',
  },
  boardText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  timestamp: { fontSize: 11, color: T.textMuted, fontWeight: '500' },
  authorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 2,
  },
  handle: { fontSize: 15, fontWeight: '800', color: T.textPrimary },
  authorSub: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  moreBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 18, fontWeight: '800', color: T.textPrimary,
    lineHeight: 26, letterSpacing: -0.3,
  },
  body: {
    fontSize: 15, color: T.textSecondary,
    lineHeight: 23, letterSpacing: 0.1,
  },
  divider: {
    height: 1, backgroundColor: 'rgba(17,17,17,0.05)',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row', alignItems: 'center', gap: 20,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 13, fontWeight: '600', color: T.textMuted },
});

// ─── EngagementStrip ──────────────────────────────────────────────────────────
// Lightweight context module: live participants + trending signal
function EngagementStrip() {
  const handles = ['CosmicNova88', 'BlueMoonTide', 'VelvetStorm', 'AquaSpectra', 'PrismaticFox'];
  const overlap = 9;
  return (
    <View style={es.card}>
      <View style={es.row}>
        {/* Participant avatars */}
        <View style={{ flexDirection: 'row' }}>
          {handles.slice(0, 4).map((h, i) => (
            <View
              key={h}
              style={{
                marginLeft: i === 0 ? 0 : -overlap,
                borderRadius: 14, borderWidth: 2, borderColor: GLASS,
              }}
            >
              <GradAvatar handle={h} size={24} />
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={es.stat}>
            <Text style={{ fontWeight: '700', color: T.textPrimary }}>{POST.activeNow} people</Text>
            {' '}in this thread now
          </Text>
        </View>

        {/* Live pulse dot */}
        <View style={es.liveDot} />
      </View>
    </View>
  );
}

const es = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  stat: { fontSize: 12, color: T.textSecondary, fontWeight: '500' },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: T.green,
    shadowColor: T.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
});

// ─── SortPills ────────────────────────────────────────────────────────────────
type SortOption = 'top' | 'new' | 'relevant';

function SortPills({ active, onSelect }: { active: SortOption; onSelect: (s: SortOption) => void }) {
  const options: { key: SortOption; label: string; icon: string }[] = [
    { key: 'top', label: 'Top', icon: 'flame-outline' },
    { key: 'new', label: 'New', icon: 'time-outline' },
    { key: 'relevant', label: 'Relevant', icon: 'sparkles-outline' },
  ];

  return (
    <View style={sp.row}>
      <Text style={sp.label}>{POST.commentCount} replies</Text>
      <View style={{ flex: 1 }} />
      {options.map(o => {
        const isActive = active === o.key;
        return (
          <TouchableOpacity
            key={o.key}
            onPress={() => onSelect(o.key)}
            activeOpacity={0.7}
            style={[sp.pill, isActive && sp.pillActive]}
          >
            <Ionicons
              name={o.icon as any}
              size={12}
              color={isActive ? T.accentPurple : T.textMuted}
            />
            <Text style={[sp.pillText, isActive && sp.pillTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const sp = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 14, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.2,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 32, paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  pillActive: {
    backgroundColor: 'rgba(139,77,255,0.10)',
    borderColor: 'rgba(139,77,255,0.22)',
  },
  pillText: { fontSize: 12, fontWeight: '600', color: T.textMuted },
  pillTextActive: { color: T.accentPurple, fontWeight: '700' },
});

// ─── HighlightedCommentCard ───────────────────────────────────────────────────
// Used for top reply or helpful answer — subtle purple accent glow.
function HighlightedCommentCard({ comment, label, labelColor, onReply }: {
  comment: Comment;
  label: string;
  labelColor: string;
  onReply: (author: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={{ gap: 0 }}>
      {/* Label */}
      <View style={hl.labelRow}>
        <LinearGradient
          colors={CTA}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={hl.labelDot}
        />
        <Text style={[hl.labelText, { color: labelColor }]}>{label}</Text>
      </View>

      {/* Card */}
      <View style={hl.card}>
        {/* Accent stripe */}
        <LinearGradient
          colors={CTA}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={hl.stripe}
        />

        <View style={hl.content}>
          {/* Author */}
          <View style={hl.authorRow}>
            <GradAvatar handle={comment.author} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={hl.handle}>{comment.author}</Text>
              <Text style={hl.time}>{comment.timestamp}</Text>
            </View>
            <View style={hl.upvoteBadge}>
              <Ionicons name="arrow-up" size={11} color={T.accentPurple} />
              <Text style={hl.upvoteBadgeText}>{comment.upvotes}</Text>
            </View>
          </View>

          {/* Body */}
          <Text style={hl.text}>{comment.text}</Text>

          {/* Actions */}
          <View style={hl.actions}>
            <UpvoteBtn count={comment.upvotes} />
            <TouchableOpacity
              onPress={() => onReply(comment.author)}
              style={hl.actionBtn}
            >
              <Ionicons name="chatbubble-outline" size={13} color={T.textMuted} />
              <Text style={hl.actionText}>Reply</Text>
            </TouchableOpacity>
            {comment.replies.length > 0 && (
              <TouchableOpacity
                onPress={() => setExpanded(v => !v)}
                style={hl.actionBtn}
              >
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={13}
                  color={T.accentPurple}
                />
                <Text style={[hl.actionText, { color: T.accentPurple }]}>
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Nested replies */}
      {expanded && comment.replies.map((r, i) => (
        <NestedReply key={r.id} reply={r} isLast={i === comment.replies.length - 1} />
      ))}
    </View>
  );
}

const hl = StyleSheet.create({
  labelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 8, paddingLeft: 4,
  },
  labelDot: { width: 7, height: 7, borderRadius: 4 },
  labelText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  card: {
    flexDirection: 'row',
    backgroundColor: GLASS,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(139,77,255,0.18)',
    overflow: 'hidden',
    shadowColor: '#8B4DFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 7,
  },
  stripe: { width: 3.5, borderTopLeftRadius: 24, borderBottomLeftRadius: 24 },
  content: { flex: 1, padding: 18, gap: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  handle: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  time: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  upvoteBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(139,77,255,0.08)',
    borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.14)',
  },
  upvoteBadgeText: { fontSize: 11, fontWeight: '800', color: T.accentPurple },
  text: { fontSize: 14, color: T.textSecondary, lineHeight: 22 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: T.textMuted, fontWeight: '600' },
});

// ─── NestedReply ──────────────────────────────────────────────────────────────
function NestedReply({ reply, isLast }: { reply: Reply; isLast: boolean }) {
  return (
    <View style={nr.wrap}>
      {/* Thread connector */}
      <View style={nr.connectorArea}>
        <View style={[nr.vertLine, isLast && { bottom: '50%' }]} />
        <View style={nr.hookLine} />
      </View>

      {/* Reply content */}
      <View style={nr.card}>
        <View style={nr.authorRow}>
          <GradAvatar handle={reply.author} size={26} />
          <Text style={nr.handle}>{reply.author}</Text>
          {reply.isOp && (
            <View style={nr.opBadge}>
              <Text style={nr.opText}>OP</Text>
            </View>
          )}
          <Text style={nr.time}>{reply.timestamp}</Text>
        </View>
        <Text style={nr.text}>{reply.text}</Text>
        <View style={nr.actions}>
          <UpvoteBtn count={reply.upvotes} size="sm" />
          <TouchableOpacity style={nr.actionBtn}>
            <Ionicons name="return-down-forward-outline" size={12} color={T.textMuted} />
            <Text style={nr.actionText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const nr = StyleSheet.create({
  wrap: {
    flexDirection: 'row', marginTop: 0, paddingLeft: 18,
  },
  connectorArea: {
    width: 20, alignItems: 'center', position: 'relative',
  },
  vertLine: {
    position: 'absolute', left: 8, top: 0, bottom: 0,
    width: 1.5, backgroundColor: 'rgba(139,77,255,0.14)',
    borderRadius: 1,
  },
  hookLine: {
    position: 'absolute', left: 8, top: 18,
    width: 10, height: 1.5,
    backgroundColor: 'rgba(139,77,255,0.14)',
    borderRadius: 1,
  },
  card: {
    flex: 1,
    backgroundColor: GLASS_LIGHT,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    padding: 14, gap: 6,
    marginVertical: 4,
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  handle: { fontSize: 12, fontWeight: '700', color: T.textPrimary },
  time: { fontSize: 10, color: T.textMuted, marginLeft: 'auto' },
  text: { fontSize: 13, color: T.textSecondary, lineHeight: 19 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actionText: { fontSize: 11, color: T.textMuted, fontWeight: '600' },
  opBadge: {
    backgroundColor: 'rgba(75,80,248,0.10)',
    paddingHorizontal: 6, paddingVertical: 1.5,
    borderRadius: 5,
  },
  opText: { fontSize: 9, fontWeight: '800', color: T.accentBlue, letterSpacing: 0.4 },
});

// ─── CommentCard ──────────────────────────────────────────────────────────────
function CommentCard({ comment, onReply }: { comment: Comment; onReply: (author: string) => void }) {
  const [expanded, setExpanded] = useState(comment.replies.length > 0);

  return (
    <View style={{ gap: 0 }}>
      <View style={cc.card}>
        {/* Author row */}
        <View style={cc.authorRow}>
          <GradAvatar handle={comment.author} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={cc.handle}>{comment.author}</Text>
            <Text style={cc.time}>{comment.timestamp}</Text>
          </View>
        </View>

        {/* Body */}
        <Text style={cc.text}>{comment.text}</Text>

        {/* Actions */}
        <View style={cc.actions}>
          <UpvoteBtn count={comment.upvotes} />
          <TouchableOpacity
            onPress={() => onReply(comment.author)}
            style={cc.actionBtn}
          >
            <Ionicons name="chatbubble-outline" size={13} color={T.textMuted} />
            <Text style={cc.actionText}>Reply</Text>
          </TouchableOpacity>
          {comment.replies.length > 0 && (
            <TouchableOpacity
              onPress={() => setExpanded(v => !v)}
              style={cc.actionBtn}
            >
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={13}
                color={T.accentPurple}
              />
              <Text style={[cc.actionText, { color: T.accentPurple }]}>
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Nested replies */}
      {expanded && comment.replies.map((r, i) => (
        <NestedReply key={r.id} reply={r} isLast={i === comment.replies.length - 1} />
      ))}
    </View>
  );
}

const cc = StyleSheet.create({
  card: {
    backgroundColor: GLASS,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    padding: 18, gap: 10,
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  handle: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  time: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  text: { fontSize: 14, color: T.textSecondary, lineHeight: 22 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: T.textMuted, fontWeight: '600' },
});

// ─── TypingIndicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const anims = dots.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={ti.wrap}>
      <View style={ti.pill}>
        <GradAvatar handle="SomeoneNew" size={18} />
        <Text style={ti.label}>2 people typing</Text>
        <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
          {dots.map((op, i) => (
            <Animated.View
              key={i}
              style={{
                width: 4, height: 4, borderRadius: 2,
                backgroundColor: T.accentPurple, opacity: op,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const ti = StyleSheet.create({
  wrap: { alignItems: 'flex-start', paddingHorizontal: 2 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(139,77,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.14)',
  },
  label: { fontSize: 12, color: T.accentPurple, fontWeight: '600' },
});

// ─── ReplyComposer ────────────────────────────────────────────────────────────
function ReplyComposer({ replyingTo, onClear }: { replyingTo: string | null; onClear: () => void }) {
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const accent = isAnonymous ? T.accentBlue : PUB[1];
  const gradColors = isAnonymous ? CTA : PUB;

  return (
    <View style={rp.wrapper}>
      {/* Reply-to banner */}
      {replyingTo && (
        <View style={rp.replyBanner}>
          <Ionicons name="return-down-forward-outline" size={12} color={accent} />
          <Text style={[rp.replyLabel, { color: accent }]}>
            Replying to <Text style={{ fontWeight: '700' }}>{replyingTo}</Text>
          </Text>
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={14} color={T.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Mode accent strip */}
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={rp.accentStrip}
      />

      {/* Main composer area */}
      <View style={rp.composerBody}>
        {/* Input row */}
        <View style={rp.inputRow}>
          <GradAvatar
            handle={isAnonymous ? 'AnonBio12' : 'JunJinho'}
            size={34}
          />
          <View style={rp.inputCard}>
            <TextInput
              style={rp.input}
              placeholder={isAnonymous ? 'Write a reply…' : 'Reply as Jun Jinho…'}
              placeholderTextColor={T.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
              autoCorrect
              autoCapitalize="sentences"
            />
          </View>
        </View>

        {/* Bottom controls row */}
        <View style={rp.controlsRow}>
          {/* Identity toggle */}
          <View style={rp.toggleTrack}>
            <TouchableOpacity
              onPress={() => setIsAnonymous(true)}
              activeOpacity={0.8}
            >
              {isAnonymous ? (
                <LinearGradient
                  colors={CTA}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={rp.toggleActive}
                >
                  <Ionicons name="shield-checkmark" size={11} color={T.white} />
                  <Text style={rp.toggleActiveText}>Anonymous</Text>
                </LinearGradient>
              ) : (
                <View style={rp.toggleInactive}>
                  <Ionicons name="shield-outline" size={11} color={T.textMuted} />
                  <Text style={rp.toggleInactiveText}>Anonymous</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={rp.toggleDivider} />
            <TouchableOpacity
              onPress={() => setIsAnonymous(false)}
              activeOpacity={0.8}
            >
              {!isAnonymous ? (
                <LinearGradient
                  colors={PUB}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={rp.toggleActive}
                >
                  <Ionicons name="person" size={11} color={T.white} />
                  <Text style={rp.toggleActiveText}>Public</Text>
                </LinearGradient>
              ) : (
                <View style={rp.toggleInactive}>
                  <Ionicons name="person-outline" size={11} color={T.textMuted} />
                  <Text style={rp.toggleInactiveText}>Public</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }} />

          {/* Send button */}
          <TouchableOpacity
            activeOpacity={text.trim() ? 0.8 : 1}
            style={[rp.sendOuter, !text.trim() && { opacity: 0.35 }]}
          >
            <LinearGradient
              colors={gradColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={rp.sendBtn}
            >
              <Ionicons name="send" size={15} color={T.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Safety hint */}
        <View style={rp.safetyRow}>
          <Ionicons
            name={isAnonymous ? 'shield-checkmark-outline' : 'eye-outline'}
            size={11}
            color={accent}
          />
          <Text style={[rp.safetyText, { color: accent }]}>
            {isAnonymous
              ? 'Identity hidden — students see your anonymous handle only'
              : 'Your name and profile will be visible to everyone'}
          </Text>
        </View>

        {/* Bottom safe area absorbed into composer */}
        <SafeAreaView edges={['bottom']} />
      </View>
    </View>
  );
}

const rp = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderTopWidth: 1,
    borderTopColor: GLASS_BORDER,
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.10,
    shadowRadius: 22,
    elevation: 12,
  },
  replyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  replyLabel: { flex: 1, fontSize: 12 },
  accentStrip: {
    height: 2.5,
  },
  composerBody: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  inputCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 14, paddingVertical: 10,
    minHeight: 42,
  },
  input: {
    fontSize: 14, color: T.textPrimary,
    lineHeight: 20, maxHeight: 100,
    paddingVertical: 0,
  },
  controlsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  toggleTrack: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  },
  toggleActive: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, margin: 2.5,
    shadowColor: '#4B50F8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20, shadowRadius: 5, elevation: 3,
  },
  toggleActiveText: { fontSize: 11, fontWeight: '700', color: T.white },
  toggleInactive: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, margin: 2.5,
  },
  toggleInactiveText: { fontSize: 11, fontWeight: '600', color: T.textMuted },
  toggleDivider: { width: 1, height: 16, backgroundColor: 'rgba(17,17,17,0.06)' },
  sendOuter: {
    borderRadius: 20,
    shadowColor: '#4B50F8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  safetyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: -4,
  },
  safetyText: { fontSize: 10, fontWeight: '500' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PostDetailScreen() {
  const router = useRouter();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('top');

  // Find highlighted comments
  const hotComment = COMMENTS.find(c => c.isHot);
  const helpfulComment = COMMENTS.find(c => c.isHelpful);
  const regularComments = COMMENTS.filter(c => !c.isHot && !c.isHelpful);

  return (
    <View style={s.root}>
      {/* Background gradient */}
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* ── Header ── */}
          <View style={s.nav}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={s.navBtn}>
              <Ionicons name="chevron-back" size={18} color={T.textPrimary} />
            </TouchableOpacity>

            <View style={s.navCenter}>
              <Text style={s.navTitle} numberOfLines={1}>Discussion</Text>
            </View>

            <TouchableOpacity activeOpacity={0.8} style={s.navBtn}>
              <Ionicons name="ellipsis-horizontal" size={17} color={T.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* ── Thread Content ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Original post hero */}
            <PostHeroCard />

            {/* Engagement context */}
            <EngagementStrip />

            {/* Sort controls */}
            <SortPills active={sortBy} onSelect={setSortBy} />

            {/* Highlighted: Top reply */}
            {hotComment && (
              <HighlightedCommentCard
                comment={hotComment}
                label="TOP REPLY"
                labelColor={T.accentPurple}
                onReply={setReplyingTo}
              />
            )}

            {/* Highlighted: Helpful answer */}
            {helpfulComment && (
              <HighlightedCommentCard
                comment={helpfulComment}
                label="HELPFUL"
                labelColor={T.green}
                onReply={setReplyingTo}
              />
            )}

            {/* Regular comments */}
            {regularComments.map(comment => (
              <CommentCard key={comment.id} comment={comment} onReply={setReplyingTo} />
            ))}

            {/* Typing indicator */}
            <TypingIndicator />

            <View style={{ height: 8 }} />
          </ScrollView>

          {/* ── Reply Composer ── */}
          <ReplyComposer replyingTo={replyingTo} onClear={() => setReplyingTo(null)} />
        </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  navCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  navTitle: {
    fontSize: 15, fontWeight: '700',
    color: T.textPrimary, letterSpacing: -0.2,
  },

  scroll: {
    paddingHorizontal: 20, paddingTop: 4,
    paddingBottom: 16, gap: 16,
  },
});
