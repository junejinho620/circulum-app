import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  FlatList, Dimensions, Modal, Pressable, Animated,
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

const BG: [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];

// ─── Difficulty / workload helpers ────────────────────────────────────────────
const DIFF_LABELS = ['Easy', 'Moderate', 'Hard', 'Very Hard'];
const DIFF_COLORS = ['#3DAB73', '#F1973B', '#E05555', '#C43030'];

function diffLabel(d: number) { return DIFF_LABELS[Math.min(d, 3)]; }
function diffColor(d: number) { return DIFF_COLORS[Math.min(d, 3)]; }

// ─── Mock data ────────────────────────────────────────────────────────────────
type Course = {
  id: string;
  code: string;
  title: string;
  department: string;
  difficulty: number;      // 0-3
  workload: number;        // hrs/week
  rating: number;          // 0-5
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
};

const COURSES: Course[] = [
  {
    id: '1', code: 'CSC108', title: 'Introduction to Computer Programming',
    department: 'Computer Science', difficulty: 0, workload: 6, rating: 4.3, reviewCount: 312, discussionCount: 48,
    description: 'An introduction to programming in Python. Variables, functions, conditionals, loops, lists, and file I/O.',
    terms: ['Fall', 'Winter', 'Summer'], trending: 'hot', prerequisites: [], followUps: ['CSC148', 'CSC120'],
    topProfessors: ['Prof. Liu', 'Prof. Guerzhoy'], gradeDistribution: { A: 35, B: 30, C: 20, D: 10, F: 5 },
    tips: ['Start assignments early — the autograder queue gets long near deadlines', 'Attend labs for easy marks'],
    pitfalls: ['Don\'t skip the style guide — you lose marks for bad formatting'],
  },
  {
    id: '2', code: 'MAT237', title: 'Multivariable Calculus',
    department: 'Mathematics', difficulty: 3, workload: 14, rating: 3.2, reviewCount: 189, discussionCount: 72,
    description: 'Sequences, series, topology of Rⁿ, multivariable limits, derivatives, integrals, vector calculus.',
    terms: ['Fall', 'Winter'], trending: 'rising', prerequisites: ['MAT137', 'MAT157'], followUps: ['MAT337', 'APM346'],
    topProfessors: ['Prof. Selick', 'Prof. Bierstone'], gradeDistribution: { A: 15, B: 25, C: 30, D: 20, F: 10 },
    tips: ['Form a study group — the problem sets are brutal alone', 'Use the textbook examples religiously'],
    pitfalls: ['The jump from MAT137 is steep — review epsilon-delta proofs'],
  },
  {
    id: '3', code: 'PSY100', title: 'Introductory Psychology',
    department: 'Psychology', difficulty: 0, workload: 5, rating: 4.5, reviewCount: 524, discussionCount: 31,
    description: 'Survey of major areas: neuroscience, perception, learning, memory, development, personality, social behaviour.',
    terms: ['Fall', 'Winter', 'Summer'], bird: true, prerequisites: [], followUps: ['PSY201', 'PSY210', 'PSY220'],
    topProfessors: ['Prof. Bhatt', 'Prof. Bhatt'], gradeDistribution: { A: 40, B: 35, C: 15, D: 7, F: 3 },
    tips: ['Read the textbook — exam questions come straight from it', 'The online quizzes are free marks'],
    pitfalls: ['Don\'t underestimate the final — it\'s cumulative and detailed'],
  },
  {
    id: '4', code: 'CSC263', title: 'Data Structures and Analysis',
    department: 'Computer Science', difficulty: 2, workload: 10, rating: 3.8, reviewCount: 276, discussionCount: 95,
    description: 'Algorithm analysis. Heaps, BSTs, hash tables, graphs, amortized analysis, randomized algorithms.',
    terms: ['Fall', 'Winter'], trending: 'hot', prerequisites: ['CSC148', 'CSC165'], followUps: ['CSC373', 'CSC369'],
    topProfessors: ['Prof. Horton', 'Prof. Baumgart'], gradeDistribution: { A: 20, B: 30, C: 25, D: 15, F: 10 },
    tips: ['Draw everything — visual representations help for tree/graph problems', 'Past exams are gold'],
    pitfalls: ['Amortized analysis trips everyone up — spend extra time on it'],
  },
  {
    id: '5', code: 'STA257', title: 'Probability and Statistics I',
    department: 'Statistics', difficulty: 2, workload: 9, rating: 3.5, reviewCount: 198, discussionCount: 44,
    description: 'Probability spaces, random variables, distributions, expectation, limit theorems.',
    terms: ['Fall', 'Winter'], prerequisites: ['MAT137'], followUps: ['STA261', 'STA302'],
    topProfessors: ['Prof. Brenner', 'Prof. Taback'], gradeDistribution: { A: 18, B: 28, C: 30, D: 16, F: 8 },
    tips: ['Practice with past midterms — question style is consistent', 'Derivations matter more than memorizing formulas'],
    pitfalls: ['The transition from discrete to continuous distributions is tricky'],
  },
  {
    id: '6', code: 'HIS101', title: 'World History to 1500',
    department: 'History', difficulty: 1, workload: 7, rating: 4.1, reviewCount: 145, discussionCount: 22,
    description: 'Survey of global civilizations from antiquity to the early modern period.',
    terms: ['Fall'], bird: true, prerequisites: [], followUps: ['HIS102', 'HIS201'],
    topProfessors: ['Prof. Chen', 'Prof. Kumar'], gradeDistribution: { A: 30, B: 35, C: 22, D: 8, F: 5 },
    tips: ['The essay rubric is strict — visit the writing center', 'Tutorial participation counts heavily'],
    pitfalls: ['Don\'t skip the primary source readings — they show up on exams'],
  },
  {
    id: '7', code: 'ECO101', title: 'Principles of Microeconomics',
    department: 'Economics', difficulty: 1, workload: 6, rating: 4.0, reviewCount: 402, discussionCount: 38,
    description: 'Supply and demand, market structures, consumer theory, production, welfare economics.',
    terms: ['Fall', 'Winter', 'Summer'], prerequisites: [], followUps: ['ECO102', 'ECO200'],
    topProfessors: ['Prof. Gazzale', 'Prof. Shum'], gradeDistribution: { A: 25, B: 35, C: 25, D: 10, F: 5 },
    tips: ['The textbook problems mirror exam questions closely', 'Office hours are underused — take advantage'],
    pitfalls: ['Graph-reading questions are easy marks people throw away'],
  },
  {
    id: '8', code: 'AST101', title: 'The Sun and Its Neighbours',
    department: 'Astronomy', difficulty: 0, workload: 4, rating: 4.6, reviewCount: 380, discussionCount: 18,
    description: 'The solar system, planetary science, space exploration, astrobiology fundamentals.',
    terms: ['Fall', 'Winter'], bird: true, prerequisites: [], followUps: ['AST201', 'AST210'],
    topProfessors: ['Prof. Cami', 'Prof. Dotten'], gradeDistribution: { A: 45, B: 30, C: 15, D: 7, F: 3 },
    tips: ['Show up to lecture — there are iClicker marks', 'The planetarium session is both mandatory and awesome'],
    pitfalls: ['Don\'t blow off the final just because it\'s a bird course'],
  },
  {
    id: '9', code: 'CSC148', title: 'Introduction to Computer Science',
    department: 'Computer Science', difficulty: 1, workload: 8, rating: 4.2, reviewCount: 295, discussionCount: 56,
    description: 'Abstract data types, recursion, object-oriented programming, algorithm analysis intro.',
    terms: ['Fall', 'Winter'], prerequisites: ['CSC108'], followUps: ['CSC207', 'CSC236', 'CSC263'],
    topProfessors: ['Prof. Calver', 'Prof. Smith'], gradeDistribution: { A: 28, B: 32, C: 22, D: 12, F: 6 },
    tips: ['Recursion is the hardest part — practice with small examples first', 'Use the debugger, not print statements'],
    pitfalls: ['The linked list assignment has tricky edge cases — test thoroughly'],
  },
  {
    id: '10', code: 'PHL101', title: 'Introduction to Philosophy',
    department: 'Philosophy', difficulty: 1, workload: 5, rating: 4.3, reviewCount: 210, discussionCount: 15,
    description: 'Fundamental philosophical questions: knowledge, reality, ethics, free will, meaning.',
    terms: ['Fall', 'Winter'], bird: true, prerequisites: [], followUps: ['PHL200', 'PHL210'],
    topProfessors: ['Prof. Morrison', 'Prof. Fenton'], gradeDistribution: { A: 32, B: 33, C: 20, D: 10, F: 5 },
    tips: ['The essay is 40% of your grade — start early and get TA feedback', 'Tutorials are where the real learning happens'],
    pitfalls: ['Avoid vague thesis statements — TAs mark specifically on argument structure'],
  },
];

const FILTER_CHIPS = ['All', 'Computer Science', 'Mathematics', 'Statistics', 'Psychology', 'Economics', 'History', 'Astronomy', 'Philosophy'];
const LEVEL_CHIPS = ['All Levels', '100-level', '200-level', '300-level', 'Graduate'];
const SORT_OPTIONS = ['Most Popular', 'Highest Rated', 'Lowest Workload', 'Recently Discussed'];

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
  suggestions: Course[]; onSelectCourse: (id: string) => void;
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
function TrendingCourseCard({ course, onPress }: { course: Course; onPress: () => void }) {
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
            <Text style={tc.statText}>{course.discussionCount}</Text>
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
function BirdCourseCard({ course, onPress }: { course: Course; onPress: () => void }) {
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
  course: Course; onPress: () => void; onBookmark: () => void; saved: boolean;
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
function QuickPreviewModal({ course, visible, onClose, onFullDetail }: {
  course: Course | null; visible: boolean; onClose: () => void; onFullDetail: () => void;
}) {
  if (!course) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={qp.backdrop} onPress={onClose}>
        <Pressable style={qp.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={qp.handle} />
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

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function CoursesScreen() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Most Popular');
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trendingCourses = COURSES.filter((c) => c.trending);
  const birdCourses = COURSES.filter((c) => c.bird);

  // Search suggestions
  const suggestions = search.length > 0
    ? COURSES.filter((c) =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.department.toLowerCase().includes(search.toLowerCase()) ||
        c.topProfessors.some((p) => p.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  // Filtered + sorted list
  const filteredCourses = COURSES
    .filter((c) => {
      if (deptFilter !== 'All' && c.department !== deptFilter) return false;
      if (search.length > 0) {
        const q = search.toLowerCase();
        return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'Highest Rated': return b.rating - a.rating;
        case 'Lowest Workload': return a.workload - b.workload;
        case 'Recently Discussed': return b.discussionCount - a.discussionCount;
        default: return b.reviewCount - a.reviewCount; // Most Popular
      }
    });

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

  const handleLongPress = (course: Course) => {
    setPreviewCourse(course);
    setShowPreview(true);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header onBack={() => router.back()} onMyCourses={() => {}} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Trending */}
          <SectionHeader title="Trending Courses" icon="flame-outline" iconColor={T.accentBlue} onSeeAll={() => {}} />
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22, gap: 12 }}
          >
            {trendingCourses.map((c) => (
              <TrendingCourseCard key={c.id} course={c} onPress={() => openCourseDetail(c.id)} />
            ))}
          </ScrollView>

          {/* Bird Courses */}
          <SectionHeader title="Bird Courses" icon="leaf-outline" iconColor="#3DAB73" onSeeAll={() => {}} />
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22, gap: 12 }}
          >
            {birdCourses.map((c) => (
              <BirdCourseCard key={c.id} course={c} onPress={() => openCourseDetail(c.id)} />
            ))}
          </ScrollView>

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
            {filteredCourses.map((c) => (
              <CourseListCard
                key={c.id}
                course={c}
                saved={savedCourses.has(c.id)}
                onPress={() => openCourseDetail(c.id)}
                onBookmark={() => toggleSave(c.id)}
              />
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      <QuickPreviewModal
        course={previewCourse}
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        onFullDetail={() => {
          setShowPreview(false);
          if (previewCourse) openCourseDetail(previewCourse.id);
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
