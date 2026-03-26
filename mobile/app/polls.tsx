import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  FlatList, Dimensions, Modal, Pressable, Animated, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SuccessToast from '../src/components/common/SuccessToast';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { usePolls, useCreatePoll, Poll } from '../src/services/queries';
import { api } from '../src/services/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  textPrimary:   '#111111',
  textSecondary: '#5F6472',
  textMuted:     '#8A90A2',
  accentBlue:    '#4B50F8',
  accentPurple:  '#8B4DFF',
  accentPink:    '#E655C5',
  accentOrange:  '#F1973B',
  accentGreen:   '#3DAB73',
  white:         '#FFFFFF',
};

const BG:  [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];

const AVATAR_GRADS: [string, string][] = [
  ['#4B50F8', '#8B4DFF'], ['#8B4DFF', '#E655C5'], ['#6B7CFF', '#4B50F8'],
  ['#E655C5', '#C47EFF'], ['#C47EFF', '#6B7CFF'], ['#F1973B', '#E655C5'],
];

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  'All', 'Academics', 'Campus Life', 'Housing', 'Food',
  'Social', 'Confessions', 'Events', 'Marketplace', 'Random',
];

// ─── Duration options ─────────────────────────────────────────────────────────
const DURATIONS = [
  { label: '6h', value: 6 },
  { label: '24h', value: 24 },
  { label: '3d', value: 72 },
  { label: '7d', value: 168 },
];

// ─── Velocity badge colors ────────────────────────────────────────────────────
const VELOCITY_COLORS: Record<string, string> = {
  Rising: '#4B50F8',
  Hot: '#F1973B',
  Surging: '#E655C5',
  Controversial: '#C43030',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(votes: number, total: number) {
  if (total === 0) return 0;
  return Math.round((votes / total) * 100);
}

/** Derive a deterministic avatar gradient index from an id string. */
function gradIdxFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % AVATAR_GRADS.length;
}

/** Friendly time-remaining string from an ISO date string. */
function timeLeftStr(endsAt?: string): string {
  if (!endsAt) return '';
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return `${Math.ceil(diff / (1000 * 60))}m left`;
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

/** Friendly relative time string from createdAt. */
function timeAgoStr(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Determine a velocity label based on vote patterns. */
function velocityLabel(poll: Poll): string | undefined {
  if (poll.totalVotes > 1000) return 'Hot';
  if (poll.totalVotes > 500) return 'Rising';
  return undefined;
}

// ─── Trending poll card (horizontal carousel) ────────────────────────────────
function TrendingPollCard({ poll, onPress }: { poll: Poll; onPress: () => void }) {
  const maxVotes = Math.max(...poll.options.map((o) => o.voteCount));
  const velocity = velocityLabel(poll);
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={tp.shadow}>
      <View style={tp.card}>
        {/* velocity badge */}
        {velocity && (
          <View style={[tp.velocityBadge, { backgroundColor: (VELOCITY_COLORS[velocity] ?? T.accentBlue) + '14' }]}>
            <Ionicons name="trending-up" size={10} color={VELOCITY_COLORS[velocity] ?? T.accentBlue} />
            <Text style={[tp.velocityText, { color: VELOCITY_COLORS[velocity] ?? T.accentBlue }]}>{velocity}</Text>
          </View>
        )}
        <Text style={tp.question} numberOfLines={2}>{poll.question}</Text>
        {/* mini result bars */}
        <View style={tp.bars}>
          {poll.options.slice(0, 3).map((opt) => (
            <View key={opt.id} style={tp.barRow}>
              <View style={tp.barTrack}>
                <View style={[tp.barFill, { width: `${pct(opt.voteCount, poll.totalVotes)}%` }]} />
              </View>
              <Text style={tp.barPct}>{pct(opt.voteCount, poll.totalVotes)}%</Text>
            </View>
          ))}
        </View>
        <View style={tp.footer}>
          <Text style={tp.votes}>{poll.totalVotes.toLocaleString()} votes</Text>
          <Text style={tp.timeLeft}>{timeLeftStr(poll.endsAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const tp = StyleSheet.create({
  shadow: {
    width: 240, borderRadius: 18,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  card: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    padding: 14, gap: 10,
  },
  velocityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
  },
  velocityText: { fontSize: 10, fontWeight: '700' },
  question: { fontSize: 13, fontWeight: '700', color: T.textPrimary, lineHeight: 18 },
  bars: { gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barTrack: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(17,17,17,0.04)',
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3, backgroundColor: T.accentPurple + '40' },
  barPct: { fontSize: 9, fontWeight: '700', color: T.textMuted, width: 28, textAlign: 'right' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  votes: { fontSize: 11, fontWeight: '600', color: T.textSecondary },
  timeLeft: { fontSize: 10, color: T.textMuted },
});

// ─── Poll feed card ──────────────────────────────────────────────────────────
function PollCard({ poll, onVote, onPress }: {
  poll: Poll;
  onVote: (pollId: string, optId: string) => void;
  onPress: () => void;
}) {
  const hasVoted = (poll.userVotes?.length ?? 0) > 0;
  const winnerVotes = Math.max(...poll.options.map((o) => o.voteCount));
  const gIdx = gradIdxFromId(poll.id);
  const velocity = velocityLabel(poll);
  const authorInitial = poll.isAnonymous ? '?' : (poll.author.handle?.[0]?.toUpperCase() ?? '?');
  const authorName = poll.isAnonymous ? 'Anonymous' : poll.author.handle;

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={pc.shadow}>
      <View style={pc.card}>
        {/* author row */}
        <View style={pc.authorRow}>
          <LinearGradient colors={AVATAR_GRADS[gIdx % AVATAR_GRADS.length]} style={pc.avatar}>
            <Text style={pc.avatarLetter}>{authorInitial}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={pc.authorName}>{authorName}</Text>
            <View style={pc.metaRow}>
              <View style={[pc.catPill, { backgroundColor: T.accentOrange + '10', borderColor: T.accentOrange + '25' }]}>
                <Text style={[pc.catPillText, { color: T.accentOrange }]}>{poll.type === 'multiple' ? 'Multi' : 'Single'}</Text>
              </View>
              <Text style={pc.time}>{timeAgoStr(poll.createdAt)}</Text>
            </View>
          </View>
          {poll.isAnonymous && (
            <View style={pc.anonBadge}>
              <Ionicons name="eye-off" size={10} color={T.accentPurple} />
              <Text style={pc.anonText}>Anon</Text>
            </View>
          )}
        </View>

        {/* question */}
        <Text style={pc.question}>{poll.question}</Text>

        {/* options */}
        <View style={pc.options}>
          {poll.options.map((opt) => {
            const p = pct(opt.voteCount, poll.totalVotes);
            const isWinner = opt.voteCount === winnerVotes && hasVoted;
            const isSelected = poll.userVotes?.includes(opt.id) ?? false;
            return (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={hasVoted ? 1 : 0.7}
                onPress={() => !hasVoted && onVote(poll.id, opt.id)}
                style={[pc.optionWrap, isSelected && pc.optionSelected]}
              >
                {hasVoted && (
                  <Animated.View
                    style={[
                      pc.optionBar,
                      {
                        width: `${p}%`,
                        backgroundColor: isWinner ? T.accentPurple + '18' : 'rgba(17,17,17,0.04)',
                      },
                    ]}
                  />
                )}
                <Text style={[pc.optionLabel, isWinner && { color: T.textPrimary, fontWeight: '600' }]}>
                  {opt.text}
                </Text>
                {hasVoted && (
                  <Text style={[pc.optionPct, isWinner && { color: T.accentPurple }]}>{p}%</Text>
                )}
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={14} color={T.accentPurple} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* footer */}
        <View style={pc.footer}>
          <View style={pc.footerLeft}>
            <Ionicons name="bar-chart-outline" size={13} color={T.textMuted} />
            <Text style={pc.footerText}>{poll.totalVotes.toLocaleString()} votes</Text>
          </View>
          <View style={pc.footerLeft}>
            <Ionicons name="time-outline" size={12} color={T.textMuted} />
            <Text style={pc.footerText}>{timeLeftStr(poll.endsAt)}</Text>
          </View>
          {velocity && (
            <View style={[pc.velocityPill, { backgroundColor: (VELOCITY_COLORS[velocity] ?? T.accentBlue) + '12' }]}>
              <Ionicons name="trending-up" size={10} color={VELOCITY_COLORS[velocity] ?? T.accentBlue} />
              <Text style={[pc.velocityLabel, { color: VELOCITY_COLORS[velocity] ?? T.accentBlue }]}>{velocity}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const pc = StyleSheet.create({
  shadow: {
    marginHorizontal: 16, borderRadius: 20,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  card: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.68)',
    padding: 16, gap: 12,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 14, fontWeight: '800', color: '#fff' },
  authorName: { fontSize: 13, fontWeight: '700', color: T.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  catPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, borderWidth: 1 },
  catPillText: { fontSize: 10, fontWeight: '700' },
  time: { fontSize: 11, color: T.textMuted },
  anonBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: T.accentPurple + '0C', borderRadius: 99,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  anonText: { fontSize: 9, fontWeight: '700', color: T.accentPurple },
  question: { fontSize: 15, fontWeight: '700', color: T.textPrimary, lineHeight: 21 },
  options: { gap: 6 },
  optionWrap: {
    flexDirection: 'row', alignItems: 'center',
    minHeight: 42, borderRadius: 12, overflow: 'hidden',
    backgroundColor: 'rgba(17,17,17,0.025)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.04)',
    paddingHorizontal: 14,
  },
  optionSelected: { borderColor: T.accentPurple + '40' },
  optionBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    borderRadius: 12,
  },
  optionLabel: { flex: 1, fontSize: 13, color: T.textSecondary, fontWeight: '500', paddingVertical: 10 },
  optionPct: { fontSize: 13, color: T.textMuted, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: T.textMuted, fontWeight: '500' },
  velocityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, marginLeft: 'auto',
  },
  velocityLabel: { fontSize: 9, fontWeight: '700' },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, icon, onSeeAll }: { title: string; icon?: string; onSeeAll?: () => void }) {
  return (
    <View style={sh.row}>
      <View style={sh.left}>
        {icon && (
          <View style={sh.iconCircle}>
            <Ionicons name={icon as any} size={14} color={T.accentPurple} />
          </View>
        )}
        <Text style={sh.title}>{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={sh.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, marginBottom: 2 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconCircle: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: T.accentPurple + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
  seeAll: { fontSize: 12, fontWeight: '600', color: T.accentBlue },
});

// ─── Create poll sheet ────────────────────────────────────────────────────────
function CreatePollSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [category, setCategory] = useState('Random');
  const [duration, setDuration] = useState(24);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const createPollMutation = useCreatePoll();

  const addOption = () => { if (options.length < 6) setOptions([...options, '']); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, val: string) => { const copy = [...options]; copy[i] = val; setOptions(copy); };

  const canSubmit = question.trim().length > 5 && options.filter((o) => o.trim()).length >= 2 && !createPollMutation.isPending;

  const handlePost = () => {
    const endsAt = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();
    createPollMutation.mutate(
      {
        question: question.trim(),
        options: options.filter((o) => o.trim()),
        type: 'single',
        isAnonymous,
        endsAt,
      },
      {
        onSuccess: () => {
          setShowConfirm(true);
          setTimeout(() => {
            setShowConfirm(false);
            onClose();
            setQuestion('');
            setOptions(['', '']);
            setIsAnonymous(false);
            setDuration(24);
            setCategory('Random');
          }, 1800);
        },
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={cs.backdrop} onPress={onClose} />
      <View style={cs.sheet}>
        <View style={cs.handle} />
        {showConfirm ? (
          <View style={cs.confirmWrap}>
            <View style={cs.confirmCircle}>
              <Ionicons name="checkmark" size={36} color={T.white} />
            </View>
            <Text style={cs.confirmTitle}>Poll Posted!</Text>
            <Text style={cs.confirmSub}>Your poll is live and ready for votes</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <Text style={cs.title}>Create Poll</Text>

            {/* question */}
            <Text style={cs.label}>Your Question</Text>
            <TextInput
              style={cs.questionInput}
              placeholder="What do you want to ask campus?"
              placeholderTextColor={T.textMuted}
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={200}
            />
            <Text style={cs.charCount}>{question.length}/200</Text>

            {/* options */}
            <Text style={cs.label}>Options</Text>
            {options.map((opt, i) => (
              <View key={i} style={cs.optionRow}>
                <View style={cs.optionNum}>
                  <Text style={cs.optionNumText}>{String.fromCharCode(65 + i)}</Text>
                </View>
                <TextInput
                  style={cs.optionInput}
                  placeholder={`Option ${i + 1}`}
                  placeholderTextColor={T.textMuted}
                  value={opt}
                  onChangeText={(v) => updateOption(i, v)}
                  maxLength={80}
                />
                {options.length > 2 && (
                  <TouchableOpacity onPress={() => removeOption(i)} style={cs.removeBtn}>
                    <Ionicons name="close-circle" size={18} color={T.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {options.length < 6 && (
              <TouchableOpacity onPress={addOption} style={cs.addOptionBtn}>
                <Ionicons name="add-circle-outline" size={16} color={T.accentPurple} />
                <Text style={cs.addOptionText}>Add option</Text>
              </TouchableOpacity>
            )}

            {/* category */}
            <Text style={[cs.label, { marginTop: 18 }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={cs.catScroll} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[cs.catChip, category === cat && cs.catChipActive]}
                >
                  <Text style={[cs.catChipText, category === cat && cs.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* duration */}
            <Text style={[cs.label, { marginTop: 18 }]}>Duration</Text>
            <View style={cs.durRow}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  onPress={() => setDuration(d.value)}
                  style={[cs.durChip, duration === d.value && cs.durChipActive]}
                >
                  <Text style={[cs.durText, duration === d.value && cs.durTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* anonymous toggle */}
            <TouchableOpacity onPress={() => setIsAnonymous(!isAnonymous)} style={cs.toggleRow}>
              <View style={cs.toggleLeft}>
                <Ionicons name="eye-off-outline" size={18} color={T.textSecondary} />
                <Text style={cs.toggleLabel}>Post anonymously</Text>
              </View>
              <View style={[cs.toggle, isAnonymous && cs.toggleOn]}>
                <View style={[cs.toggleKnob, isAnonymous && cs.toggleKnobOn]} />
              </View>
            </TouchableOpacity>

            {/* submit */}
            <TouchableOpacity
              activeOpacity={canSubmit ? 0.85 : 1}
              onPress={() => canSubmit && handlePost()}
              style={{ marginTop: 20, borderRadius: 16, overflow: 'hidden', opacity: canSubmit ? 1 : 0.4 }}
            >
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cs.submitBtn}>
                {createPollMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={16} color="#fff" />
                    <Text style={cs.submitText}>Post Poll</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const cs = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 10, maxHeight: '88%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '800', color: T.textPrimary, marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: T.textSecondary, marginBottom: 8 },
  questionInput: {
    backgroundColor: 'rgba(17,17,17,0.03)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
    padding: 14, fontSize: 14, color: T.textPrimary,
    minHeight: 72, textAlignVertical: 'top',
  },
  charCount: { fontSize: 10, color: T.textMuted, textAlign: 'right', marginTop: 4, marginBottom: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  optionNum: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: T.accentPurple + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  optionNumText: { fontSize: 12, fontWeight: '800', color: T.accentPurple },
  optionInput: {
    flex: 1, backgroundColor: 'rgba(17,17,17,0.03)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: T.textPrimary,
  },
  removeBtn: { padding: 4 },
  addOptionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginTop: 4,
  },
  addOptionText: { fontSize: 12, fontWeight: '600', color: T.accentPurple },
  catScroll: { marginBottom: 4 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
  catChipActive: { backgroundColor: T.accentPurple, borderColor: T.accentPurple },
  catChipText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  catChipTextActive: { color: '#fff' },
  durRow: { flexDirection: 'row', gap: 10 },
  durChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(17,17,17,0.03)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
  durChipActive: { backgroundColor: T.accentPurple + '14', borderColor: T.accentPurple + '40' },
  durText: { fontSize: 13, fontWeight: '600', color: T.textSecondary },
  durTextActive: { color: T.accentPurple, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 18, paddingVertical: 4,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: T.textSecondary },
  toggle: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(17,17,17,0.08)',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: T.accentPurple },
  toggleKnob: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2,
  },
  toggleKnobOn: { alignSelf: 'flex-end' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  confirmWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  confirmCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: T.accentGreen,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  confirmTitle: { fontSize: 20, fontWeight: '800', color: T.textPrimary },
  confirmSub: { fontSize: 13, color: T.textMuted, marginTop: 4 },
});

// ─── Poll detail sheet ────────────────────────────────────────────────────────
function PollDetailSheet({ poll, visible, onClose, onVote }: {
  poll: Poll | null; visible: boolean; onClose: () => void;
  onVote: (pollId: string, optId: string) => void;
}) {
  if (!poll) return null;
  const hasVoted = (poll.userVotes?.length ?? 0) > 0;
  const winnerVotes = Math.max(...poll.options.map((o) => o.voteCount));
  const sortedOptions = [...poll.options].sort((a, b) => b.voteCount - a.voteCount);
  const gIdx = gradIdxFromId(poll.id);
  const velocity = velocityLabel(poll);
  const authorInitial = poll.isAnonymous ? '?' : (poll.author.handle?.[0]?.toUpperCase() ?? '?');
  const authorName = poll.isAnonymous ? 'Anonymous' : poll.author.handle;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={ds.backdrop} onPress={onClose} />
      <View style={ds.sheet}>
        <View style={ds.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* header */}
          <View style={ds.headerRow}>
            <View style={[ds.catPill, { backgroundColor: T.accentOrange + '12' }]}>
              <Text style={[ds.catPillText, { color: T.accentOrange }]}>{poll.type === 'multiple' ? 'Multi' : 'Single'}</Text>
            </View>
            {velocity && (
              <View style={[ds.catPill, { backgroundColor: (VELOCITY_COLORS[velocity] ?? T.accentBlue) + '12' }]}>
                <Ionicons name="trending-up" size={10} color={VELOCITY_COLORS[velocity] ?? T.accentBlue} />
                <Text style={[ds.catPillText, { color: VELOCITY_COLORS[velocity] ?? T.accentBlue }]}>
                  {velocity}
                </Text>
              </View>
            )}
            <Text style={ds.timeLeft}>{timeLeftStr(poll.endsAt)}</Text>
          </View>

          <Text style={ds.question}>{poll.question}</Text>

          {/* author */}
          <View style={ds.authorRow}>
            <LinearGradient colors={AVATAR_GRADS[gIdx % AVATAR_GRADS.length]} style={ds.avatar}>
              <Text style={ds.avatarLetter}>{authorInitial}</Text>
            </LinearGradient>
            <Text style={ds.authorName}>{authorName}</Text>
            <Text style={ds.createdAgo}>{timeAgoStr(poll.createdAt)}</Text>
          </View>

          {/* results */}
          <View style={ds.resultsWrap}>
            {sortedOptions.map((opt, i) => {
              const p = pct(opt.voteCount, poll.totalVotes);
              const isWinner = i === 0;
              const isSelected = poll.userVotes?.includes(opt.id) ?? false;
              return (
                <TouchableOpacity
                  key={opt.id}
                  activeOpacity={hasVoted ? 1 : 0.7}
                  onPress={() => !hasVoted && onVote(poll.id, opt.id)}
                >
                  <View style={ds.resultRow}>
                    <View style={ds.resultInfo}>
                      <Text style={[ds.resultLabel, isWinner && hasVoted && { color: T.textPrimary, fontWeight: '700' }]}>
                        {opt.text}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={14} color={T.accentPurple} />}
                    </View>
                    <View style={ds.barOuter}>
                      <View
                        style={[
                          ds.barInner,
                          {
                            width: `${p}%`,
                            backgroundColor: isWinner && hasVoted ? T.accentPurple : T.accentPurple + '30',
                          },
                        ]}
                      />
                    </View>
                    <View style={ds.resultMeta}>
                      <Text style={[ds.resultPct, isWinner && hasVoted && { color: T.accentPurple }]}>
                        {hasVoted ? `${p}%` : '\u2014'}
                      </Text>
                      <Text style={ds.resultVotes}>{hasVoted ? `${opt.voteCount} votes` : ''}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* stats row */}
          <View style={ds.statsRow}>
            <View style={ds.statBox}>
              <Text style={ds.statNum}>{poll.totalVotes.toLocaleString()}</Text>
              <Text style={ds.statLabel}>Total Votes</Text>
            </View>
            <View style={ds.statBox}>
              <Text style={ds.statNum}>{poll.options.length}</Text>
              <Text style={ds.statLabel}>Options</Text>
            </View>
            <View style={ds.statBox}>
              <Text style={ds.statNum}>{poll.status === 'active' ? 'Active' : 'Closed'}</Text>
              <Text style={ds.statLabel}>Status</Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity activeOpacity={0.85} style={{ borderRadius: 16, overflow: 'hidden', marginTop: 16 }}>
            <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ds.ctaBtn}>
              <Ionicons name="chatbubbles-outline" size={16} color="#fff" />
              <Text style={ds.ctaText}>Join Discussion</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const ds = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 10, maxHeight: '90%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
  },
  catPillText: { fontSize: 11, fontWeight: '700' },
  timeLeft: { fontSize: 11, color: T.textMuted, marginLeft: 'auto' },
  question: { fontSize: 20, fontWeight: '800', color: T.textPrimary, lineHeight: 26, marginBottom: 14 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  avatar: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 11, fontWeight: '800', color: '#fff' },
  authorName: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  createdAgo: { fontSize: 11, color: T.textMuted },
  resultsWrap: { gap: 14 },
  resultRow: { gap: 6 },
  resultInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultLabel: { fontSize: 13, fontWeight: '500', color: T.textSecondary },
  barOuter: { height: 10, borderRadius: 5, backgroundColor: 'rgba(17,17,17,0.04)', overflow: 'hidden' },
  barInner: { height: 10, borderRadius: 5 },
  resultMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  resultPct: { fontSize: 12, fontWeight: '700', color: T.textMuted },
  resultVotes: { fontSize: 11, color: T.textMuted },
  statsRow: {
    flexDirection: 'row', gap: 12, marginTop: 20,
  },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14,
    backgroundColor: 'rgba(17,17,17,0.025)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.04)',
  },
  statNum: { fontSize: 17, fontWeight: '800', color: T.textPrimary },
  statLabel: { fontSize: 10, fontWeight: '600', color: T.textMuted, marginTop: 2 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16,
  },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function PollsScreen() {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [detailPoll, setDetailPoll] = useState<Poll | null>(null);
  const [showHot, setShowHot] = useState(false);

  // ─── API hooks ─────────────────────────────────────────
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, refetch, isRefetching } = usePolls();
  const polls = data?.pages.flatMap((p) => p.items) ?? [];

  // Trending = polls sorted by totalVotes, top 5
  const trendingPolls = [...polls].sort((a, b) => b.totalVotes - a.totalVotes).slice(0, 5);

  // Hot rankings = top 3 polls by total votes
  const hotRankings = [...polls]
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .slice(0, 3)
    .map((p, i) => ({
      id: p.id,
      label: i === 0 ? 'Most Voted' : i === 1 ? 'Fastest Growing' : 'Most Controversial',
      question: p.question,
      votes: p.totalVotes,
      icon: (i === 0 ? 'trophy-outline' : i === 1 ? 'trending-up-outline' : 'flash-outline') as 'trophy-outline' | 'trending-up-outline' | 'flash-outline',
      color: i === 0 ? '#F1973B' : i === 1 ? '#3DAB73' : '#E655C5',
    }));

  // Vote mutation -- uses api directly so pollId is always correct
  const queryClient = useQueryClient();
  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionIds }: { pollId: string; optionIds: string[] }) =>
      api.post(`/polls/${pollId}/vote`, { optionIds }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['poll', variables.pollId] });
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    },
  });

  const [voteToast, setVoteToast] = useState(false);
  const handleVote = useCallback((pollId: string, optId: string) => {
    voteMutation.mutate(
      { pollId, optionIds: [optId] },
      {
        onSuccess: () => {
          setVoteToast(true);
        },
      },
    );
  }, [voteMutation]);

  // Filter polls by status (only show active)
  const activePolls = polls.filter((p) => p.status === 'active');

  return (
    <LinearGradient colors={BG} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ─── Sticky header ─────────────────────────────────── */}
        <View style={ui.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={ui.navBtn}>
            <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
          </TouchableOpacity>
          <Text style={ui.headerTitle}>Polls</Text>
          <TouchableOpacity onPress={() => setShowCreate(true)} activeOpacity={0.7} style={ui.navBtn}>
            <Ionicons name="add" size={20} color={T.accentPurple} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={T.accentPurple} />
            <Text style={{ marginTop: 12, fontSize: 13, color: T.textMuted }}>Loading polls...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={T.accentPurple} />
            }
          >
            {/* ─── Category chips ──────────────────────────────── */}
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={ui.catRow}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCat(cat)}
                  style={[ui.catChip, selectedCat === cat && ui.catChipActive]}
                >
                  <Text style={[ui.catChipText, selectedCat === cat && ui.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ─── Hot rankings (expandable) ────────────────────── */}
            {hotRankings.length > 0 && (
              <>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowHot(!showHot)} style={ui.hotToggle}>
                  <View style={[ui.hotIcon, showHot && { backgroundColor: T.accentOrange + '18' }]}>
                    <Ionicons name="flame" size={14} color={showHot ? T.accentOrange : T.textMuted} />
                  </View>
                  <Text style={[ui.hotLabel, showHot && { color: T.accentOrange }]}>Hot Rankings</Text>
                  <Ionicons name={showHot ? 'chevron-up' : 'chevron-down'} size={14} color={T.textMuted} />
                </TouchableOpacity>
                {showHot && (
                  <View style={{ paddingHorizontal: 22, gap: 8, marginBottom: 20 }}>
                    {hotRankings.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.82}
                        onPress={() => {
                          const p = polls.find((x) => x.id === item.id);
                          if (p) setDetailPoll(p);
                        }}
                        style={hr.shadow}
                      >
                        <View style={hr.card}>
                          <View style={[hr.iconCircle, { backgroundColor: item.color + '14' }]}>
                            <Ionicons name={item.icon} size={16} color={item.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={hr.label}>{item.label}</Text>
                            <Text style={hr.question} numberOfLines={1}>{item.question}</Text>
                          </View>
                          <View style={hr.voteBadge}>
                            <Text style={hr.voteCount}>{item.votes.toLocaleString()}</Text>
                            <Ionicons name="chevron-forward" size={12} color={T.textMuted} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* ─── Trending carousel ───────────────────────────── */}
            {selectedCat === 'All' && trendingPolls.length > 0 && (
              <>
                <SectionHeader title="Trending Now" icon="trending-up-outline" onSeeAll={() => {}} />
                <ScrollView
                  horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 22, gap: 12, marginTop: 10, marginBottom: 22 }}
                >
                  {trendingPolls.map((poll) => (
                    <TrendingPollCard key={poll.id} poll={poll} onPress={() => setDetailPoll(poll)} />
                  ))}
                </ScrollView>
              </>
            )}

            {/* ─── Poll feed ───────────────────────────────────── */}
            <SectionHeader title={selectedCat === 'All' ? 'All Polls' : selectedCat} icon="stats-chart-outline" />
            <View style={{ gap: 14, marginTop: 10 }}>
              {activePolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onVote={handleVote}
                  onPress={() => setDetailPoll(poll)}
                />
              ))}
            </View>

            {/* Load more */}
            {hasNextPage && (
              <TouchableOpacity
                onPress={() => fetchNextPage()}
                activeOpacity={0.7}
                style={{ alignItems: 'center', paddingVertical: 20 }}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator size="small" color={T.accentPurple} />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '600', color: T.accentBlue }}>Load more polls</Text>
                )}
              </TouchableOpacity>
            )}

            {activePolls.length === 0 && !isLoading && (
              <View style={ui.emptyWrap}>
                <Ionicons name="stats-chart-outline" size={40} color={T.textMuted + '40'} />
                <Text style={ui.emptyText}>No polls in this category yet</Text>
                <TouchableOpacity onPress={() => setShowCreate(true)}>
                  <Text style={ui.emptyAction}>Be the first to create one</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* ─── Modals ────────────────────────────────────────── */}
        <CreatePollSheet visible={showCreate} onClose={() => setShowCreate(false)} />
        <PollDetailSheet
          poll={detailPoll}
          visible={!!detailPoll}
          onClose={() => setDetailPoll(null)}
          onVote={handleVote}
        />
      </SafeAreaView>
      <SuccessToast message="Vote recorded!" visible={voteToast} onDone={() => setVoteToast(false)} icon="checkmark-done" />
    </LinearGradient>
  );
}

// ─── Hot ranking card styles ─────────────────────────────────────────────────
const hr = StyleSheet.create({
  shadow: {
    borderRadius: 16,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.68)',
    padding: 14,
  },
  iconCircle: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  question: { fontSize: 13, fontWeight: '600', color: T.textPrimary, marginTop: 1 },
  voteBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  voteCount: { fontSize: 12, fontWeight: '700', color: T.textSecondary },
});

// ─── Main UI styles ───────────────────────────────────────────────────────────
const ui = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  catRow: { paddingHorizontal: 22, gap: 8, marginBottom: 18 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
  },
  catChipActive: { backgroundColor: T.accentPurple, borderColor: T.accentPurple },
  catChipText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  catChipTextActive: { color: '#fff', fontWeight: '700' },
  hotToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', marginLeft: 22, marginBottom: 14,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
  },
  hotIcon: {
    width: 22, height: 22, borderRadius: 7,
    backgroundColor: 'rgba(17,17,17,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  hotLabel: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: T.textMuted, fontWeight: '500' },
  emptyAction: { fontSize: 13, color: T.accentPurple, fontWeight: '700' },
});
