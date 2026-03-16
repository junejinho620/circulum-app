import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Pressable,
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

const BG: [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sentimentLabel(r: number) { return r >= 4.0 ? 'Positive' : r >= 3.0 ? 'Mixed' : 'Tough Grader'; }
function sentimentColor(r: number) { return r >= 4.0 ? '#3DAB73' : r >= 3.0 ? '#F1973B' : '#E05555'; }

function ratingColor(r: number) {
  if (r >= 4.0) return '#3DAB73';
  if (r >= 3.0) return '#F1973B';
  return '#E05555';
}

// ─── Mock data ────────────────────────────────────────────────────────────────
export type Professor = {
  id: string;
  name: string;
  department: string;
  courses: string[];
  overall: number;
  clarity: number;
  fairness: number;
  workload: number;
  engagement: number;
  reviewCount: number;
  trending?: boolean;
  tags: string[];
};

export const PROFESSORS: Professor[] = [
  {
    id: '1', name: 'Prof. Daniel Horton', department: 'Computer Science',
    courses: ['CSC263', 'CSC373'], overall: 4.6, clarity: 4.8, fairness: 4.3, workload: 3.5, engagement: 4.7,
    reviewCount: 189, trending: true,
    tags: ['Clear explanations', 'Tough exams', 'Helpful office hours'],
  },
  {
    id: '2', name: 'Prof. Jennifer Liu', department: 'Computer Science',
    courses: ['CSC108', 'CSC148'], overall: 4.5, clarity: 4.7, fairness: 4.5, workload: 3.0, engagement: 4.4,
    reviewCount: 312,
    tags: ['Beginner friendly', 'Well organized', 'Slides-based'],
  },
  {
    id: '3', name: 'Prof. Michael Selick', department: 'Mathematics',
    courses: ['MAT237', 'MAT337'], overall: 3.2, clarity: 2.8, fairness: 3.0, workload: 4.8, engagement: 3.5,
    reviewCount: 145, trending: true,
    tags: ['Proof-heavy', 'Fast-paced', 'Challenging but rewarding'],
  },
  {
    id: '4', name: 'Prof. Anita Bhatt', department: 'Psychology',
    courses: ['PSY100', 'PSY201'], overall: 4.7, clarity: 4.6, fairness: 4.8, workload: 2.5, engagement: 4.9,
    reviewCount: 524,
    tags: ['Very interactive', 'Funny lectures', 'Fair grading'],
  },
  {
    id: '5', name: 'Prof. Sarah Brenner', department: 'Statistics',
    courses: ['STA257', 'STA261'], overall: 3.5, clarity: 3.3, fairness: 3.6, workload: 4.0, engagement: 3.2,
    reviewCount: 198,
    tags: ['Exam-heavy', 'Derivation focused', 'Office hours essential'],
  },
  {
    id: '6', name: 'Prof. Alexander Guerzhoy', department: 'Computer Science',
    courses: ['CSC108', 'CSC180'], overall: 4.3, clarity: 4.5, fairness: 4.2, workload: 3.2, engagement: 4.1,
    reviewCount: 276,
    tags: ['Practical examples', 'Assignments well-designed', 'Approachable'],
  },
  {
    id: '7', name: 'Prof. Wei Chen', department: 'History',
    courses: ['HIS101', 'HIS201'], overall: 4.1, clarity: 4.0, fairness: 4.3, workload: 3.5, engagement: 3.8,
    reviewCount: 145,
    tags: ['Essay-heavy', 'Engaging storyteller', 'Tutorial participation matters'],
  },
  {
    id: '8', name: 'Prof. James Gazzale', department: 'Economics',
    courses: ['ECO101', 'ECO200'], overall: 4.0, clarity: 4.2, fairness: 3.8, workload: 3.3, engagement: 3.9,
    reviewCount: 210,
    tags: ['Graph-heavy', 'Textbook mirrors exams', 'Curved generously'],
  },
  {
    id: '9', name: 'Prof. John Cami', department: 'Astronomy',
    courses: ['AST101', 'AST201'], overall: 4.6, clarity: 4.8, fairness: 4.7, workload: 2.2, engagement: 4.5,
    reviewCount: 380,
    tags: ['Bird course legend', 'iClicker marks', 'Planetarium sessions'],
  },
  {
    id: '10', name: 'Prof. David Calver', department: 'Computer Science',
    courses: ['CSC148', 'CSC207'], overall: 4.2, clarity: 4.4, fairness: 4.0, workload: 3.8, engagement: 4.3,
    reviewCount: 295,
    tags: ['Recursion king', 'Debugger advocate', 'Tricky edge cases'],
  },
  {
    id: '11', name: 'Prof. Lisa Morrison', department: 'Philosophy',
    courses: ['PHL101', 'PHL200'], overall: 4.3, clarity: 4.1, fairness: 4.4, workload: 3.0, engagement: 4.2,
    reviewCount: 210,
    tags: ['Argument-focused', 'TA feedback crucial', 'Socratic style'],
  },
  {
    id: '12', name: 'Prof. Thomas Baumgart', department: 'Computer Science',
    courses: ['CSC263', 'CSC369'], overall: 3.8, clarity: 3.6, fairness: 3.9, workload: 4.2, engagement: 3.7,
    reviewCount: 167,
    tags: ['Exam-heavy', 'Past exams are gold', 'Amortized analysis expert'],
  },
];

const DEPT_CHIPS = ['All', 'Computer Science', 'Mathematics', 'Statistics', 'Psychology', 'Economics', 'History', 'Astronomy', 'Philosophy'];
const SORT_OPTIONS = ['Highest Rated', 'Most Reviewed', 'Trending', 'Lowest Workload'];

// ─── Header ──────────────────────────────────────────────────────────────────
function Header({ onBack, onMyProfs }: { onBack: () => void; onMyProfs: () => void }) {
  return (
    <View style={hdr.row}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={hdr.navBtn}>
        <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
      </TouchableOpacity>
      <Text style={hdr.title}>Prof Reviews</Text>
      <TouchableOpacity onPress={onMyProfs} activeOpacity={0.7} style={hdr.navBtn}>
        <Ionicons name="heart-outline" size={18} color={T.accentPurple} />
      </TouchableOpacity>
    </View>
  );
}

const hdr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  title: { fontSize: 18, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
});

// ─── Search Bar ──────────────────────────────────────────────────────────────
function SearchBar({
  value, onChange, onClear, suggestions, onSelect,
}: {
  value: string; onChange: (t: string) => void; onClear: () => void;
  suggestions: Professor[]; onSelect: (id: string) => void;
}) {
  return (
    <View style={{ zIndex: 10 }}>
      <View style={sb.shadow}>
        <View style={sb.bar}>
          <View style={sb.iconWrap}>
            <Ionicons name="search" size={18} color={T.accentPurple} />
          </View>
          <TextInput
            placeholder="Search professors, courses, departments..."
            placeholderTextColor={T.textMuted}
            style={sb.input}
            value={value}
            onChangeText={onChange}
            autoCorrect={false}
          />
          {value.length > 0 && (
            <TouchableOpacity onPress={onClear} activeOpacity={0.7} style={sb.clearBtn}>
              <Ionicons name="close-circle" size={18} color={T.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {suggestions.length > 0 && value.length > 0 && (
        <View style={sb.dropdown}>
          {suggestions.slice(0, 5).map((p) => (
            <TouchableOpacity key={p.id} style={sb.suggestion} activeOpacity={0.7} onPress={() => onSelect(p.id)}>
              <View style={sb.suggAvatar}>
                <Text style={sb.suggAvatarText}>{p.name.split(' ').pop()?.[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sb.suggName} numberOfLines={1}>{p.name}</Text>
                <Text style={sb.suggDept}>{p.department} · {p.courses.join(', ')}</Text>
              </View>
              <View style={[sb.suggRating, { backgroundColor: ratingColor(p.overall) + '15' }]}>
                <Text style={[sb.suggRatingText, { color: ratingColor(p.overall) }]}>{p.overall.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const sb = StyleSheet.create({
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
    backgroundColor: 'rgba(139,77,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  input: { flex: 1, fontSize: 14, color: T.textPrimary },
  clearBtn: { padding: 4 },
  dropdown: {
    marginHorizontal: 22, marginTop: 4,
    backgroundColor: T.white, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  suggAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(139,77,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  suggAvatarText: { fontSize: 14, fontWeight: '700', color: T.accentPurple },
  suggName: { fontSize: 13, fontWeight: '600', color: T.textPrimary },
  suggDept: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  suggRating: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  suggRatingText: { fontSize: 12, fontWeight: '800' },
});

// ─── Filter Chips ────────────────────────────────────────────────────────────
function FilterChips({ chips, active, onSelect }: { chips: string[]; active: string; onSelect: (c: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={fc.row}>
      {chips.map((c) => {
        const isActive = c === active;
        return (
          <TouchableOpacity
            key={c} activeOpacity={0.7}
            style={[fc.chip, isActive && fc.chipActive]}
            onPress={() => onSelect(c)}
          >
            <Text style={[fc.chipText, isActive && fc.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const fc = StyleSheet.create({
  row: { paddingHorizontal: 22, gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  chipActive: { backgroundColor: T.accentPurple, borderColor: T.accentPurple },
  chipText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  chipTextActive: { color: T.white },
});

// ─── Sort Dropdown ───────────────────────────────────────────────────────────
function SortDropdown({ active, onSelect }: { active: string; onSelect: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={sd.wrap}>
      <TouchableOpacity style={sd.trigger} activeOpacity={0.7} onPress={() => setOpen(!open)}>
        <Ionicons name="swap-vertical-outline" size={14} color={T.accentPurple} />
        <Text style={sd.label}>{active}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={12} color={T.textMuted} />
      </TouchableOpacity>
      {open && (
        <View style={sd.menu}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt} style={sd.option} activeOpacity={0.7}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[sd.optText, opt === active && { color: T.accentPurple, fontWeight: '700' }]}>{opt}</Text>
              {opt === active && <Ionicons name="checkmark" size={14} color={T.accentPurple} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const sd = StyleSheet.create({
  wrap: { alignItems: 'flex-end', paddingHorizontal: 22, zIndex: 5 },
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
  },
  label: { fontSize: 11, fontWeight: '600', color: T.textSecondary },
  menu: {
    position: 'absolute', top: 36, right: 22,
    backgroundColor: T.white, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
    minWidth: 170, overflow: 'hidden',
  },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  optText: { fontSize: 13, color: T.textPrimary },
});

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ title, icon, iconColor }: { title: string; icon: string; iconColor: string }) {
  return (
    <View style={shr.row}>
      <View style={[shr.iconCircle, { backgroundColor: iconColor + '12' }]}>
        <Ionicons name={icon as any} size={15} color={iconColor} />
      </View>
      <Text style={shr.title}>{title}</Text>
    </View>
  );
}

const shr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, marginBottom: 2 },
  iconCircle: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
});

// ─── Mini Rating Bar ─────────────────────────────────────────────────────────
function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={mb.row}>
      <Text style={mb.label}>{label}</Text>
      <View style={mb.track}>
        <View style={[mb.fill, { width: `${(value / 5) * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[mb.value, { color }]}>{value.toFixed(1)}</Text>
    </View>
  );
}

const mb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 10, fontWeight: '600', color: T.textMuted, width: 46 },
  track: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  value: { fontSize: 10, fontWeight: '700', width: 24, textAlign: 'right' },
});

// ─── Professor Card ──────────────────────────────────────────────────────────
function ProfessorCard({ prof, onPress }: { prof: Professor; onPress: () => void }) {
  const sColor = sentimentColor(prof.overall);
  const sLabel = sentimentLabel(prof.overall);

  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={pc.card}>
      <View style={pc.inner}>
        {/* Top row */}
        <View style={pc.topRow}>
          <View style={pc.avatarWrap}>
            <LinearGradient
              colors={[T.accentPurple, T.accentBlue]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={pc.avatar}
            >
              <Text style={pc.avatarText}>{prof.name.split(' ').pop()?.[0]}</Text>
            </LinearGradient>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pc.name} numberOfLines={1}>{prof.name}</Text>
            <Text style={pc.dept}>{prof.department}</Text>
            <Text style={pc.courses} numberOfLines={1}>{prof.courses.join(' · ')}</Text>
          </View>
          <View style={pc.ratingCol}>
            <View style={[pc.ratingBadge, { backgroundColor: ratingColor(prof.overall) + '12' }]}>
              <Text style={[pc.ratingText, { color: ratingColor(prof.overall) }]}>{prof.overall.toFixed(1)}</Text>
            </View>
            <View style={[pc.sentBadge, { backgroundColor: sColor + '12' }]}>
              <Text style={[pc.sentText, { color: sColor }]}>{sLabel}</Text>
            </View>
          </View>
        </View>

        {/* Rating bars */}
        <View style={pc.barsWrap}>
          <MiniBar label="Clarity" value={prof.clarity} color={ratingColor(prof.clarity)} />
          <MiniBar label="Fairness" value={prof.fairness} color={ratingColor(prof.fairness)} />
          <MiniBar label="Workload" value={prof.workload} color={prof.workload > 3.5 ? '#E05555' : prof.workload > 2.5 ? '#F1973B' : '#3DAB73'} />
        </View>

        {/* Bottom row */}
        <View style={pc.bottomRow}>
          <View style={pc.reviewStat}>
            <Ionicons name="chatbubble-outline" size={11} color={T.textMuted} />
            <Text style={pc.reviewCount}>{prof.reviewCount} reviews</Text>
          </View>
          {prof.trending && (
            <View style={pc.trendBadge}>
              <Ionicons name="trending-up" size={10} color="#3DAB73" />
              <Text style={pc.trendText}>Trending</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <View style={pc.tagRow}>
            {prof.tags.slice(0, 2).map((tag, i) => (
              <View key={i} style={pc.tag}>
                <Text style={pc.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const pc = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    marginBottom: 10,
  },
  inner: { padding: 14, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatarWrap: {},
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: T.white },
  name: { fontSize: 15, fontWeight: '700', color: T.textPrimary },
  dept: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  courses: { fontSize: 11, fontWeight: '600', color: T.accentBlue, marginTop: 2 },
  ratingCol: { alignItems: 'flex-end', gap: 4 },
  ratingBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  ratingText: { fontSize: 16, fontWeight: '800' },
  sentBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  sentText: { fontSize: 10, fontWeight: '700' },
  barsWrap: { gap: 4, paddingLeft: 56 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  reviewStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewCount: { fontSize: 11, color: T.textMuted },
  trendBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(61,171,115,0.10)', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  trendText: { fontSize: 10, fontWeight: '700', color: '#3DAB73' },
  tagRow: { flexDirection: 'row', gap: 4 },
  tag: {
    backgroundColor: 'rgba(139,77,255,0.06)', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.10)',
  },
  tagText: { fontSize: 10, fontWeight: '600', color: T.accentPurple },
});

// ─── Quick Preview Modal ─────────────────────────────────────────────────────
function QuickPreviewModal({ prof, visible, onClose, onFullProfile }: {
  prof: Professor | null; visible: boolean; onClose: () => void; onFullProfile: () => void;
}) {
  if (!prof) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={qp.backdrop} onPress={onClose}>
        <Pressable style={qp.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={qp.handle} />
          <View style={qp.headerRow}>
            <LinearGradient colors={[T.accentPurple, T.accentBlue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={qp.avatar}>
              <Text style={qp.avatarText}>{prof.name.split(' ').pop()?.[0]}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={qp.name}>{prof.name}</Text>
              <Text style={qp.dept}>{prof.department}</Text>
            </View>
            <View style={[qp.ratingBadge, { backgroundColor: ratingColor(prof.overall) + '15' }]}>
              <Text style={[qp.ratingText, { color: ratingColor(prof.overall) }]}>{prof.overall.toFixed(1)}</Text>
            </View>
          </View>

          <View style={qp.coursesRow}>
            {prof.courses.map((c) => (
              <View key={c} style={qp.coursePill}>
                <Text style={qp.courseText}>{c}</Text>
              </View>
            ))}
          </View>

          <View style={qp.barsSection}>
            <MiniBar label="Clarity" value={prof.clarity} color={ratingColor(prof.clarity)} />
            <MiniBar label="Fairness" value={prof.fairness} color={ratingColor(prof.fairness)} />
            <MiniBar label="Workload" value={prof.workload} color={prof.workload > 3.5 ? '#E05555' : '#F1973B'} />
            <MiniBar label="Engage" value={prof.engagement} color={ratingColor(prof.engagement)} />
          </View>

          <View style={qp.tagsRow}>
            {prof.tags.map((tag, i) => (
              <View key={i} style={qp.tag}>
                <Text style={qp.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={onFullProfile}>
            <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={qp.ctaBtn}>
              <Text style={qp.ctaText}>View Full Profile</Text>
              <Ionicons name="arrow-forward" size={16} color={T.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const qp = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: T.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 22, paddingBottom: 36, gap: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: T.white },
  name: { fontSize: 17, fontWeight: '800', color: T.textPrimary },
  dept: { fontSize: 12, color: T.textMuted },
  ratingBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  ratingText: { fontSize: 18, fontWeight: '800' },
  coursesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  coursePill: {
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  courseText: { fontSize: 12, fontWeight: '700', color: T.accentBlue },
  barsSection: { gap: 5 },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: {
    backgroundColor: 'rgba(139,77,255,0.06)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.10)',
  },
  tagText: { fontSize: 11, fontWeight: '600', color: T.accentPurple },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 14, marginTop: 4,
  },
  ctaText: { fontSize: 15, fontWeight: '700', color: T.white },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ProfessorsScreen() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Highest Rated');
  const [previewProf, setPreviewProf] = useState<Professor | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const suggestions = search.length > 0
    ? PROFESSORS.filter((p) => {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.courses.some((c) => c.toLowerCase().includes(q));
      })
    : [];

  const filteredProfs = PROFESSORS
    .filter((p) => {
      if (deptFilter !== 'All' && p.department !== deptFilter) return false;
      if (search.length > 0) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.courses.some((c) => c.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'Most Reviewed': return b.reviewCount - a.reviewCount;
        case 'Trending': return (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.reviewCount - a.reviewCount;
        case 'Lowest Workload': return a.workload - b.workload;
        default: return b.overall - a.overall;
      }
    });

  const openProfile = (id: string) => {
    setSearch('');
    router.push(`/professor/${id}` as any);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header onBack={() => router.back()} onMyProfs={() => {}} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Search */}
          <SearchBar
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            suggestions={suggestions}
            onSelect={openProfile}
          />

          {/* Filters */}
          <FilterChips chips={DEPT_CHIPS} active={deptFilter} onSelect={setDeptFilter} />

          {/* Sort */}
          <SortDropdown active={sortBy} onSelect={setSortBy} />

          {/* Professor List */}
          <SectionHeader title="Professors" icon="school-outline" iconColor={T.accentPurple} />
          <View style={{ gap: 0 }}>
            {filteredProfs.map((p) => (
              <ProfessorCard key={p.id} prof={p} onPress={() => openProfile(p.id)} />
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      <QuickPreviewModal
        prof={previewProf}
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        onFullProfile={() => {
          setShowPreview(false);
          if (previewProf) openProfile(previewProf.id);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingTop: 4, paddingBottom: 32, gap: 16 },
});
