import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  FlatList, Dimensions, Modal, Pressable, Animated, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoursesWithReviews, useCourseDetail, CourseDetail } from '../src/services/queries';
import { useDebouncedValue } from '../src/hooks/useDebouncedValue';

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

const BG: [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];

// ─── Difficulty / workload helpers ────────────────────────────────────────────
const DIFF_LABELS = ['Easy', 'Moderate', 'Hard', 'Very Hard'];
const DIFF_COLORS = ['#3DAB73', '#F1973B', '#E05555', '#C43030'];

function diffLabel(d: number) { return DIFF_LABELS[Math.min(Math.round(d), 3)]; }
function diffColor(d: number) { return DIFF_COLORS[Math.min(Math.round(d), 3)]; }

// ─── UI constants ─────────────────────────────────────────────────────────────
const FILTER_CHIPS = ['All', 'Computer Science', 'Mathematics', 'Statistics', 'Psychology', 'Economics', 'History', 'Astronomy', 'Philosophy'];
const LEVEL_CHIPS = ['All Levels', '100-level', '200-level', '300-level', 'Graduate'];
const SORT_OPTIONS = ['Most Popular', 'Highest Rated', 'Lowest Workload', 'Recently Discussed'];

// ─── Map API sort labels to query params ──────────────────────────────────────
function sortLabelToParam(label: string): string {
  switch (label) {
    case 'Highest Rated': return 'rating';
    case 'Lowest Workload': return 'workload';
    case 'Recently Discussed': return 'discussed';
    default: return 'popular';
  }
}

// ─── Normalize API CourseDetail to a shape the UI components expect ──────────
interface UICourse {
  id: string;
  code: string;
  title: string;
  department: string;
  difficulty: number;
  workload: number;
  rating: number;
  reviewCount: number;
  discussionCount: number;
  description: string;
  terms: string[];
  trending?: 'hot' | 'rising';
  bird?: boolean;
  prerequisites: string[];
  followUps: string[];
  topProfessors: string[];
  gradeDistribution: { A: number; B: number; C: number; D: number; F: number };
  tips: string[];
  pitfalls: string[];
}

function toUICourse(c: CourseDetail): UICourse {
  const gd = c.gradeDistribution || {};
  return {
    id: c.id,
    code: c.code,
    title: c.name,
    department: c.department,
    difficulty: c.avgDifficulty,
    workload: c.avgWorkload,
    rating: c.avgRating,
    reviewCount: c.reviewCount,
    discussionCount: 0,
    description: c.description || '',
    terms: c.terms || [],
    topProfessors: c.topProfessors || [],
    gradeDistribution: {
      A: (gd as any).A ?? 0,
      B: (gd as any).B ?? 0,
      C: (gd as any).C ?? 0,
      D: (gd as any).D ?? 0,
      F: (gd as any).F ?? 0,
    },
    tips: c.tips || [],
    pitfalls: c.pitfalls || [],
    prerequisites: [],
    followUps: [],
    // Derive trending / bird heuristics from data
    trending: c.reviewCount >= 300 ? 'hot' : c.reviewCount >= 200 ? 'rising' : undefined,
    bird: c.avgDifficulty <= 0.5 && c.avgWorkload <= 5,
  };
}

// ─── Header ──────────────────────────────────────────────────────────────────
function Header({ onBack, onMyCourses }: { onBack: () => void; onMyCourses: () => void }) {
  return (
    <View style={hdr.row}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={hdr.navBtn}>
        <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
      </TouchableOpacity>
      <Text style={hdr.title}>Courses</Text>
      <TouchableOpacity onPress={onMyCourses} activeOpacity={0.7} style={hdr.navBtn}>
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
  value, onChange, onClear, suggestions, onSelectCourse,
}: {
  value: string; onChange: (t: string) => void; onClear: () => void;
  suggestions: UICourse[]; onSelectCourse: (id: string) => void;
}) {
  return (
    <View style={{ zIndex: 10 }}>
      <View style={sb.shadow}>
        <View style={sb.bar}>
          <View style={sb.iconWrap}>
            <Ionicons name="search" size={18} color={T.accentBlue} />
          </View>
          <TextInput
            placeholder="Search courses, codes, professors..."
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
          {suggestions.slice(0, 5).map((c) => (
            <TouchableOpacity key={c.id} style={sb.suggestion} activeOpacity={0.7} onPress={() => onSelectCourse(c.id)}>
              <View style={sb.suggCodeWrap}>
                <Text style={sb.suggCode}>{c.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sb.suggTitle} numberOfLines={1}>{c.title}</Text>
                <Text style={sb.suggDept}>{c.department}</Text>
              </View>
              <View style={[sb.suggDiff, { backgroundColor: diffColor(c.difficulty) + '18' }]}>
                <Text style={[sb.suggDiffText, { color: diffColor(c.difficulty) }]}>{diffLabel(c.difficulty)}</Text>
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
    backgroundColor: 'rgba(75,80,248,0.08)',
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
  suggCodeWrap: {
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  suggCode: { fontSize: 12, fontWeight: '700', color: T.accentBlue },
  suggTitle: { fontSize: 13, fontWeight: '600', color: T.textPrimary },
  suggDept: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  suggDiff: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  suggDiffText: { fontSize: 10, fontWeight: '700' },
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
  chipActive: {
    backgroundColor: T.accentBlue,
    borderColor: T.accentBlue,
  },
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
              <Text style={[sd.optText, opt === active && { color: T.accentBlue, fontWeight: '700' }]}>{opt}</Text>
              {opt === active && <Ionicons name="checkmark" size={14} color={T.accentBlue} />}
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
function SectionHeader({ title, icon, iconColor, onSeeAll }: {
  title: string; icon: string; iconColor: string; onSeeAll?: () => void;
}) {
  return (
    <View style={sh.row}>
      <View style={sh.left}>
        <View style={[sh.iconCircle, { backgroundColor: iconColor + '12' }]}>
          <Ionicons name={icon as any} size={15} color={iconColor} />
        </View>
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
    paddingHorizontal: 22, marginBottom: 2,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconCircle: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
  seeAll: { fontSize: 12, fontWeight: '600', color: T.accentBlue },
});

// ─── Trending Course Card (horizontal) ───────────────────────────────────────
function TrendingCourseCard({ course, onPress }: { course: UICourse; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={tc.card}>
      <View style={tc.inner}>
        <View style={tc.topRow}>
          <View style={tc.codeWrap}>
            <Text style={tc.code}>{course.code}</Text>
          </View>
          {course.trending && (
            <View style={[tc.trendBadge, course.trending === 'hot' ? tc.badgeHot : tc.badgeRising]}>
              <Ionicons name={course.trending === 'hot' ? 'flame' : 'trending-up'} size={10} color={course.trending === 'hot' ? '#E05555' : '#3DAB73'} />
              <Text style={[tc.trendText, { color: course.trending === 'hot' ? '#E05555' : '#3DAB73' }]}>
                {course.trending === 'hot' ? 'Hot' : 'Rising'}
              </Text>
            </View>
          )}
        </View>
        <Text style={tc.title} numberOfLines={2}>{course.title}</Text>
        <Text style={tc.desc} numberOfLines={2}>{course.description}</Text>
        <View style={tc.bottomRow}>
          <View style={[tc.diffBadge, { backgroundColor: diffColor(course.difficulty) + '15' }]}>
            <Text style={[tc.diffText, { color: diffColor(course.difficulty) }]}>{diffLabel(course.difficulty)}</Text>
          </View>
          <View style={tc.statRow}>
            <Ionicons name="star" size={11} color="#F1973B" />
            <Text style={tc.statText}>{course.rating.toFixed(1)}</Text>
          </View>
          <View style={tc.statRow}>
            <Ionicons name="chatbubble-outline" size={10} color={T.textMuted} />
            <Text style={tc.statText}>{course.reviewCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const tc = StyleSheet.create({
  card: {
    width: 220, borderRadius: 18, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 14, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeWrap: {
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  code: { fontSize: 12, fontWeight: '800', color: T.accentBlue, letterSpacing: 0.3 },
  trendBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  badgeHot: { backgroundColor: 'rgba(224,85,85,0.10)' },
  badgeRising: { backgroundColor: 'rgba(61,171,115,0.10)' },
  trendText: { fontSize: 10, fontWeight: '700' },
  title: { fontSize: 14, fontWeight: '700', color: T.textPrimary, lineHeight: 18 },
  desc: { fontSize: 11, color: T.textMuted, lineHeight: 15 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  diffBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  diffText: { fontSize: 10, fontWeight: '700' },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, fontWeight: '600', color: T.textMuted },
});

// ─── Bird Course Card (horizontal) ───────────────────────────────────────────
function BirdCourseCard({ course, onPress }: { course: UICourse; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={bc.card}>
      <View style={bc.inner}>
        <View style={bc.topRow}>
          <View style={bc.codeWrap}>
            <Text style={bc.code}>{course.code}</Text>
          </View>
          <View style={bc.birdBadge}>
            <Text style={bc.birdEmoji}>🐦</Text>
            <Text style={bc.birdText}>Bird</Text>
          </View>
        </View>
        <Text style={bc.title} numberOfLines={2}>{course.title}</Text>
        <View style={bc.bottomRow}>
          <View style={bc.statRow}>
            <Ionicons name="star" size={11} color="#F1973B" />
            <Text style={bc.statText}>{course.rating.toFixed(1)}</Text>
          </View>
          <View style={bc.statRow}>
            <Ionicons name="time-outline" size={11} color={T.textMuted} />
            <Text style={bc.statText}>{course.workload}h/wk</Text>
          </View>
          <View style={bc.statRow}>
            <Ionicons name="people-outline" size={11} color={T.textMuted} />
            <Text style={bc.statText}>{course.reviewCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const bc = StyleSheet.create({
  card: {
    width: 190, borderRadius: 18, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 14, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeWrap: {
    backgroundColor: 'rgba(61,171,115,0.08)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  code: { fontSize: 12, fontWeight: '800', color: '#3DAB73', letterSpacing: 0.3 },
  birdBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(61,171,115,0.10)', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  birdEmoji: { fontSize: 10 },
  birdText: { fontSize: 10, fontWeight: '700', color: '#3DAB73' },
  title: { fontSize: 13, fontWeight: '700', color: T.textPrimary, lineHeight: 17 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, fontWeight: '600', color: T.textMuted },
});

// ─── Course List Card (vertical) ─────────────────────────────────────────────
function CourseListCard({ course, onPress, onBookmark, saved }: {
  course: UICourse; onPress: () => void; onBookmark: () => void; saved: boolean;
}) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={cl.card}>
      <View style={cl.inner}>
        <View style={cl.row1}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={cl.codeRow}>
              <View style={cl.codeWrap}>
                <Text style={cl.code}>{course.code}</Text>
              </View>
              <Text style={cl.dept}>{course.department}</Text>
            </View>
            <Text style={cl.title} numberOfLines={1}>{course.title}</Text>
          </View>
          <TouchableOpacity onPress={onBookmark} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? T.accentBlue : T.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={cl.row2}>
          <View style={[cl.diffBadge, { backgroundColor: diffColor(course.difficulty) + '15' }]}>
            <View style={[cl.diffDot, { backgroundColor: diffColor(course.difficulty) }]} />
            <Text style={[cl.diffText, { color: diffColor(course.difficulty) }]}>{diffLabel(course.difficulty)}</Text>
          </View>
          <View style={cl.stat}>
            <Ionicons name="time-outline" size={12} color={T.textMuted} />
            <Text style={cl.statText}>{course.workload}h/wk</Text>
          </View>
          <View style={cl.stat}>
            <Ionicons name="star" size={12} color="#F1973B" />
            <Text style={cl.statText}>{course.rating.toFixed(1)}</Text>
          </View>
          <View style={cl.stat}>
            <Ionicons name="chatbubble-outline" size={11} color={T.textMuted} />
            <Text style={cl.statText}>{course.reviewCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cl = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    marginBottom: 10,
  },
  inner: { padding: 14, gap: 8 },
  row1: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeWrap: {
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  code: { fontSize: 12, fontWeight: '800', color: T.accentBlue, letterSpacing: 0.3 },
  dept: { fontSize: 11, color: T.textMuted },
  title: { fontSize: 15, fontWeight: '700', color: T.textPrimary },
  row2: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  diffBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  diffDot: { width: 6, height: 6, borderRadius: 3 },
  diffText: { fontSize: 11, fontWeight: '700' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, fontWeight: '600', color: T.textMuted },
});

// ─── Quick Preview Modal ─────────────────────────────────────────────────────
function QuickPreviewModal({ courseId, visible, onClose, onFullDetail }: {
  courseId: string | null; visible: boolean; onClose: () => void; onFullDetail: () => void;
}) {
  const { data: detail, isLoading } = useCourseDetail(courseId || '');
  const course = detail ? toUICourse(detail) : null;

  if (!courseId) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={qp.backdrop} onPress={onClose}>
        <Pressable style={qp.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={qp.handle} />
          {isLoading || !course ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={T.accentPurple} />
              <Text style={{ marginTop: 12, fontSize: 13, color: T.textMuted }}>Loading course details...</Text>
            </View>
          ) : (
            <>
              <View style={qp.header}>
                <View style={qp.codeWrap}>
                  <Text style={qp.code}>{course.code}</Text>
                </View>
                <Text style={qp.dept}>{course.department}</Text>
              </View>
              <Text style={qp.title}>{course.title}</Text>
              <Text style={qp.desc}>{course.description}</Text>
              <View style={qp.statsRow}>
                <View style={[qp.diffBadge, { backgroundColor: diffColor(course.difficulty) + '15' }]}>
                  <Text style={[qp.diffText, { color: diffColor(course.difficulty) }]}>{diffLabel(course.difficulty)}</Text>
                </View>
                <View style={qp.stat}>
                  <Ionicons name="time-outline" size={13} color={T.textMuted} />
                  <Text style={qp.statText}>{course.workload}h/wk</Text>
                </View>
                <View style={qp.stat}>
                  <Ionicons name="star" size={13} color="#F1973B" />
                  <Text style={qp.statText}>{course.rating.toFixed(1)}</Text>
                </View>
              </View>
              {course.terms.length > 0 && (
                <View style={qp.termsRow}>
                  <Ionicons name="calendar-outline" size={12} color={T.textMuted} />
                  <Text style={qp.termsText}>{course.terms.join(' · ')}</Text>
                </View>
              )}
              <TouchableOpacity activeOpacity={0.8} onPress={onFullDetail}>
                <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={qp.ctaBtn}>
                  <Text style={qp.ctaText}>View Full Details</Text>
                  <Ionicons name="arrow-forward" size={16} color={T.white} />
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeWrap: {
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  code: { fontSize: 14, fontWeight: '800', color: T.accentBlue },
  dept: { fontSize: 12, color: T.textMuted },
  title: { fontSize: 18, fontWeight: '800', color: T.textPrimary },
  desc: { fontSize: 13, color: T.textSecondary, lineHeight: 18 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  diffBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  diffText: { fontSize: 11, fontWeight: '700' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '600', color: T.textMuted },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  termsText: { fontSize: 12, color: T.textMuted },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 14, marginTop: 6,
  },
  ctaText: { fontSize: 15, fontWeight: '700', color: T.white },
});

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <View style={{ paddingTop: 60, alignItems: 'center', gap: 12 }}>
      <ActivityIndicator size="large" color={T.accentPurple} />
      <Text style={{ fontSize: 14, color: T.textMuted, fontWeight: '600' }}>Loading courses...</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function CoursesScreen() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Most Popular');
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
  const [previewCourseId, setPreviewCourseId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── API data ──────────────────────────────────────────────────────────────
  const selectedDept = deptFilter === 'All' ? undefined : deptFilter;
  const selectedSort = sortLabelToParam(sortBy);
  const debouncedSearch = useDebouncedValue(search.trim(), 400);
  const searchQuery = debouncedSearch.length >= 2 ? debouncedSearch : undefined;
  const { data: courses, isLoading, isFetching, refetch } = useCoursesWithReviews(selectedDept, selectedSort, searchQuery);

  // Map API data to UI shape
  const allCourses: UICourse[] = useMemo(
    () => (courses || []).map(toUICourse),
    [courses],
  );

  const trendingCourses = useMemo(
    () => allCourses.filter((c) => c.trending),
    [allCourses],
  );
  const birdCourses = useMemo(
    () => allCourses.filter((c) => c.bird),
    [allCourses],
  );

  // Search suggestions
  const suggestions = useMemo(() => {
    if (search.length === 0) return [];
    return allCourses.filter((c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase()) ||
      c.topProfessors.some((p) => p.toLowerCase().includes(search.toLowerCase()))
    );
  }, [allCourses, search]);

  // Filtered + sorted list (sorting is primarily handled by API, but
  // we still filter client-side for local search text)
  const filteredCourses = useMemo(() => {
    let result = allCourses;
    if (search.length > 0) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q),
      );
    }
    return result;
  }, [allCourses, search]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const toggleSave = (id: string) => {
    setSavedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openCourseDetail = (id: string) => {
    setSearch('');
    router.push(`/course/${id}` as any);
  };

  const handleLongPress = (courseId: string) => {
    setPreviewCourseId(courseId);
    setShowPreview(true);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header onBack={() => router.back()} onMyCourses={() => {}} />

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B4DFF" colors={['#8B4DFF']} />
            }
          >

            {/* Trending */}
            {trendingCourses.length > 0 && (
              <>
                <SectionHeader title="Trending Courses" icon="flame-outline" iconColor={T.accentBlue} onSeeAll={() => {}} />
                <ScrollView
                  horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 22, gap: 12 }}
                >
                  {trendingCourses.map((c) => (
                    <TrendingCourseCard key={c.id} course={c} onPress={() => openCourseDetail(c.id)} />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Bird Courses */}
            {birdCourses.length > 0 && (
              <>
                <SectionHeader title="Bird Courses" icon="leaf-outline" iconColor="#3DAB73" onSeeAll={() => {}} />
                <ScrollView
                  horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 22, gap: 12 }}
                >
                  {birdCourses.map((c) => (
                    <BirdCourseCard key={c.id} course={c} onPress={() => openCourseDetail(c.id)} />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <View style={s.dividerDot} />
              <View style={s.dividerLine} />
            </View>

            {/* Search */}
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              suggestions={suggestions}
              onSelectCourse={openCourseDetail}
            />

            {/* Filters */}
            <FilterChips chips={FILTER_CHIPS} active={deptFilter} onSelect={setDeptFilter} />

            {/* Sort */}
            <SortDropdown active={sortBy} onSelect={setSortBy} />

            {/* Course List */}
            <SectionHeader title="All Courses" icon="library-outline" iconColor={T.accentBlue} />
            <View style={{ gap: 0 }}>
              {filteredCourses.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="search-outline" size={36} color={T.textMuted} />
                  <Text style={{ marginTop: 10, fontSize: 14, color: T.textMuted, fontWeight: '600' }}>No courses found</Text>
                </View>
              ) : (
                filteredCourses.map((c) => (
                  <CourseListCard
                    key={c.id}
                    course={c}
                    saved={savedCourses.has(c.id)}
                    onPress={() => openCourseDetail(c.id)}
                    onBookmark={() => toggleSave(c.id)}
                  />
                ))
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      <QuickPreviewModal
        courseId={previewCourseId}
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        onFullDetail={() => {
          setShowPreview(false);
          if (previewCourseId) openCourseDetail(previewCourseId);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingTop: 4, paddingBottom: 32, gap: 16 },
  divider: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 40, marginVertical: 2,
  },
  dividerLine: {
    flex: 1, height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  dividerDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(139,77,255,0.25)',
  },
});
