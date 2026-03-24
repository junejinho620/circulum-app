import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DetailHeaderSkeleton, SkeletonList } from '../../src/components/common/Skeletons';

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

const DIFF_LABELS = ['Easy', 'Moderate', 'Hard', 'Very Hard'];
const DIFF_COLORS = ['#3DAB73', '#F1973B', '#E05555', '#C43030'];
function diffLabel(d: number) { return DIFF_LABELS[Math.min(d, 3)]; }
function diffColor(d: number) { return DIFF_COLORS[Math.min(d, 3)]; }

// ─── Mock course database (same as main screen) ──────────────────────────────
type Course = {
  id: string; code: string; title: string; department: string;
  difficulty: number; workload: number; rating: number;
  reviewCount: number; discussionCount: number; description: string;
  terms: string[]; prerequisites: string[]; followUps: string[];
  topProfessors: string[];
  gradeDistribution: { A: number; B: number; C: number; D: number; F: number };
  tips: string[]; pitfalls: string[];
};

const COURSES: Record<string, Course> = {
  '1': {
    id: '1', code: 'CSC108', title: 'Introduction to Computer Programming',
    department: 'Computer Science', difficulty: 0, workload: 6, rating: 4.3, reviewCount: 312, discussionCount: 48,
    description: 'An introduction to programming in Python. Variables, functions, conditionals, loops, lists, and file I/O. Emphasis on problem-solving and computational thinking.',
    terms: ['Fall', 'Winter', 'Summer'], prerequisites: [], followUps: ['CSC148', 'CSC120'],
    topProfessors: ['Prof. Liu', 'Prof. Guerzhoy'],
    gradeDistribution: { A: 35, B: 30, C: 20, D: 10, F: 5 },
    tips: ['Start assignments early — the autograder queue gets long near deadlines', 'Attend labs for easy marks', 'The practice exercises mirror exam questions'],
    pitfalls: ['Don\'t skip the style guide — you lose marks for bad formatting', 'Late submissions get 0 with no exceptions'],
  },
  '2': {
    id: '2', code: 'MAT237', title: 'Multivariable Calculus',
    department: 'Mathematics', difficulty: 3, workload: 14, rating: 3.2, reviewCount: 189, discussionCount: 72,
    description: 'Sequences, series, topology of Rⁿ, multivariable limits, derivatives, integrals, vector calculus. A rigorous proof-based course.',
    terms: ['Fall', 'Winter'], prerequisites: ['MAT137', 'MAT157'], followUps: ['MAT337', 'APM346'],
    topProfessors: ['Prof. Selick', 'Prof. Bierstone'],
    gradeDistribution: { A: 15, B: 25, C: 30, D: 20, F: 10 },
    tips: ['Form a study group — the problem sets are brutal alone', 'Use the textbook examples religiously', 'Office hours are essential for this course'],
    pitfalls: ['The jump from MAT137 is steep — review epsilon-delta proofs', 'Don\'t fall behind — each topic builds on the last'],
  },
  '3': {
    id: '3', code: 'PSY100', title: 'Introductory Psychology',
    department: 'Psychology', difficulty: 0, workload: 5, rating: 4.5, reviewCount: 524, discussionCount: 31,
    description: 'Survey of major areas: neuroscience, perception, learning, memory, development, personality, social behaviour, and mental health.',
    terms: ['Fall', 'Winter', 'Summer'], prerequisites: [], followUps: ['PSY201', 'PSY210', 'PSY220'],
    topProfessors: ['Prof. Bhatt', 'Prof. Bhatt'],
    gradeDistribution: { A: 40, B: 35, C: 15, D: 7, F: 3 },
    tips: ['Read the textbook — exam questions come straight from it', 'The online quizzes are free marks', 'Use flashcards for the terminology'],
    pitfalls: ['Don\'t underestimate the final — it\'s cumulative and detailed'],
  },
  '4': {
    id: '4', code: 'CSC263', title: 'Data Structures and Analysis',
    department: 'Computer Science', difficulty: 2, workload: 10, rating: 3.8, reviewCount: 276, discussionCount: 95,
    description: 'Algorithm analysis. Heaps, BSTs, hash tables, graphs, amortized analysis, randomized algorithms. Essential for technical interviews.',
    terms: ['Fall', 'Winter'], prerequisites: ['CSC148', 'CSC165'], followUps: ['CSC373', 'CSC369'],
    topProfessors: ['Prof. Horton', 'Prof. Baumgart'],
    gradeDistribution: { A: 20, B: 30, C: 25, D: 15, F: 10 },
    tips: ['Draw everything — visual representations help for tree/graph problems', 'Past exams are gold', 'Understand the proofs, don\'t just memorize'],
    pitfalls: ['Amortized analysis trips everyone up — spend extra time on it', 'Don\'t skip tutorials — they cover exam material'],
  },
  '5': {
    id: '5', code: 'STA257', title: 'Probability and Statistics I',
    department: 'Statistics', difficulty: 2, workload: 9, rating: 3.5, reviewCount: 198, discussionCount: 44,
    description: 'Probability spaces, random variables, distributions, expectation, limit theorems, and statistical inference foundations.',
    terms: ['Fall', 'Winter'], prerequisites: ['MAT137'], followUps: ['STA261', 'STA302'],
    topProfessors: ['Prof. Brenner', 'Prof. Taback'],
    gradeDistribution: { A: 18, B: 28, C: 30, D: 16, F: 8 },
    tips: ['Practice with past midterms — question style is consistent', 'Derivations matter more than memorizing formulas'],
    pitfalls: ['The transition from discrete to continuous distributions is tricky'],
  },
  '6': {
    id: '6', code: 'HIS101', title: 'World History to 1500',
    department: 'History', difficulty: 1, workload: 7, rating: 4.1, reviewCount: 145, discussionCount: 22,
    description: 'Survey of global civilizations from antiquity to the early modern period. Themes include trade, religion, empire, and cultural exchange.',
    terms: ['Fall'], prerequisites: [], followUps: ['HIS102', 'HIS201'],
    topProfessors: ['Prof. Chen', 'Prof. Kumar'],
    gradeDistribution: { A: 30, B: 35, C: 22, D: 8, F: 5 },
    tips: ['The essay rubric is strict — visit the writing center', 'Tutorial participation counts heavily'],
    pitfalls: ['Don\'t skip the primary source readings — they show up on exams'],
  },
  '7': {
    id: '7', code: 'ECO101', title: 'Principles of Microeconomics',
    department: 'Economics', difficulty: 1, workload: 6, rating: 4.0, reviewCount: 402, discussionCount: 38,
    description: 'Supply and demand, market structures, consumer theory, production, welfare economics, and government policy.',
    terms: ['Fall', 'Winter', 'Summer'], prerequisites: [], followUps: ['ECO102', 'ECO200'],
    topProfessors: ['Prof. Gazzale', 'Prof. Shum'],
    gradeDistribution: { A: 25, B: 35, C: 25, D: 10, F: 5 },
    tips: ['The textbook problems mirror exam questions closely', 'Office hours are underused — take advantage'],
    pitfalls: ['Graph-reading questions are easy marks people throw away'],
  },
  '8': {
    id: '8', code: 'AST101', title: 'The Sun and Its Neighbours',
    department: 'Astronomy', difficulty: 0, workload: 4, rating: 4.6, reviewCount: 380, discussionCount: 18,
    description: 'The solar system, planetary science, space exploration, astrobiology fundamentals. A popular breadth requirement.',
    terms: ['Fall', 'Winter'], prerequisites: [], followUps: ['AST201', 'AST210'],
    topProfessors: ['Prof. Cami', 'Prof. Dotten'],
    gradeDistribution: { A: 45, B: 30, C: 15, D: 7, F: 3 },
    tips: ['Show up to lecture — there are iClicker marks', 'The planetarium session is both mandatory and awesome'],
    pitfalls: ['Don\'t blow off the final just because it\'s a bird course'],
  },
  '9': {
    id: '9', code: 'CSC148', title: 'Introduction to Computer Science',
    department: 'Computer Science', difficulty: 1, workload: 8, rating: 4.2, reviewCount: 295, discussionCount: 56,
    description: 'Abstract data types, recursion, object-oriented programming, algorithm analysis intro. The gateway to CS upper years.',
    terms: ['Fall', 'Winter'], prerequisites: ['CSC108'], followUps: ['CSC207', 'CSC236', 'CSC263'],
    topProfessors: ['Prof. Calver', 'Prof. Smith'],
    gradeDistribution: { A: 28, B: 32, C: 22, D: 12, F: 6 },
    tips: ['Recursion is the hardest part — practice with small examples first', 'Use the debugger, not print statements'],
    pitfalls: ['The linked list assignment has tricky edge cases — test thoroughly'],
  },
  '10': {
    id: '10', code: 'PHL101', title: 'Introduction to Philosophy',
    department: 'Philosophy', difficulty: 1, workload: 5, rating: 4.3, reviewCount: 210, discussionCount: 15,
    description: 'Fundamental philosophical questions: knowledge, reality, ethics, free will, meaning. Emphasis on argument analysis and critical thinking.',
    terms: ['Fall', 'Winter'], prerequisites: [], followUps: ['PHL200', 'PHL210'],
    topProfessors: ['Prof. Morrison', 'Prof. Fenton'],
    gradeDistribution: { A: 32, B: 33, C: 20, D: 10, F: 5 },
    tips: ['The essay is 40% of your grade — start early and get TA feedback', 'Tutorials are where the real learning happens'],
    pitfalls: ['Avoid vague thesis statements — TAs mark specifically on argument structure'],
  },
};

// ─── Shared resources mock ───────────────────────────────────────────────────
type Resource = { id: string; title: string; type: 'notes' | 'exam' | 'guide' | 'link'; upvotes: number };

function getResources(code: string): Resource[] {
  return [
    { id: '1', title: `${code} — Comprehensive Study Notes`, type: 'notes', upvotes: 124 },
    { id: '2', title: `${code} — Fall 2025 Midterm Solutions`, type: 'exam', upvotes: 89 },
    { id: '3', title: `${code} — Final Exam Study Guide`, type: 'guide', upvotes: 76 },
    { id: '4', title: `${code} — Useful YouTube Playlist`, type: 'link', upvotes: 52 },
  ];
}

const RESOURCE_ICONS: Record<string, string> = {
  notes: 'document-text-outline',
  exam: 'school-outline',
  guide: 'book-outline',
  link: 'link-outline',
};
const RESOURCE_COLORS: Record<string, string> = {
  notes: T.accentBlue,
  exam: T.accentPurple,
  guide: '#3DAB73',
  link: '#F1973B',
};

// ─── Header ──────────────────────────────────────────────────────────────────
function Header({ onBack, onSave, onShare, saved }: {
  onBack: () => void; onSave: () => void; onShare: () => void; saved: boolean;
}) {
  return (
    <View style={hdr.row}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={hdr.navBtn}>
        <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
      </TouchableOpacity>
      <View style={hdr.actions}>
        <TouchableOpacity onPress={onSave} activeOpacity={0.7} style={hdr.navBtn}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? T.accentBlue : T.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} activeOpacity={0.7} style={hdr.navBtn}>
          <Ionicons name="share-outline" size={18} color={T.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const hdr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 8,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  actions: { flexDirection: 'row', gap: 8 },
});

// ─── Course Hero Section ─────────────────────────────────────────────────────
function CourseHero({ course }: { course: Course }) {
  return (
    <View style={hero.card}>
      <View style={hero.inner}>
        <View style={hero.codeRow}>
          <View style={hero.codeWrap}>
            <Text style={hero.code}>{course.code}</Text>
          </View>
          <View style={hero.deptWrap}>
            <Text style={hero.dept}>{course.department}</Text>
          </View>
        </View>
        <Text style={hero.title}>{course.title}</Text>
        <Text style={hero.desc}>{course.description}</Text>
        {course.terms.length > 0 && (
          <View style={hero.termsRow}>
            <Ionicons name="calendar-outline" size={13} color={T.textMuted} />
            <Text style={hero.termsText}>Available: {course.terms.join(', ')}</Text>
          </View>
        )}
        {/* Quick actions */}
        <View style={hero.actionsRow}>
          <TouchableOpacity activeOpacity={0.7} style={hero.actionBtn}>
            <Ionicons name="add-circle-outline" size={16} color={T.accentBlue} />
            <Text style={hero.actionText}>Add to Timetable</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={hero.actionBtn}>
            <Ionicons name="chatbubbles-outline" size={16} color={T.accentPurple} />
            <Text style={[hero.actionText, { color: T.accentPurple }]}>Community</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const hero = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  inner: { padding: 18, gap: 8 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeWrap: {
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  code: { fontSize: 16, fontWeight: '800', color: T.accentBlue, letterSpacing: 0.5 },
  deptWrap: {
    backgroundColor: 'rgba(139,77,255,0.08)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  dept: { fontSize: 11, fontWeight: '600', color: T.accentPurple },
  title: { fontSize: 20, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  desc: { fontSize: 13, color: T.textSecondary, lineHeight: 19 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  termsText: { fontSize: 12, color: T.textMuted },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(75,80,248,0.06)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(75,80,248,0.12)',
  },
  actionText: { fontSize: 12, fontWeight: '600', color: T.accentBlue },
});

// ─── Difficulty & Workload Panel ─────────────────────────────────────────────
function DifficultyPanel({ course }: { course: Course }) {
  const maxGrade = Math.max(...Object.values(course.gradeDistribution));
  const sentimentScore = course.rating >= 4.0 ? 'Positive' : course.rating >= 3.0 ? 'Mixed' : 'Tough';
  const sentimentColor = course.rating >= 4.0 ? '#3DAB73' : course.rating >= 3.0 ? '#F1973B' : '#E05555';

  return (
    <View style={dp.card}>
      <View style={dp.inner}>
        <Text style={dp.sectionTitle}>Difficulty & Workload</Text>

        {/* Difficulty meter */}
        <View style={dp.meterRow}>
          <Text style={dp.label}>Difficulty</Text>
          <View style={dp.meterTrack}>
            <View style={[dp.meterFill, { width: `${((course.difficulty + 1) / 4) * 100}%`, backgroundColor: diffColor(course.difficulty) }]} />
          </View>
          <Text style={[dp.meterLabel, { color: diffColor(course.difficulty) }]}>{diffLabel(course.difficulty)}</Text>
        </View>

        {/* Workload meter */}
        <View style={dp.meterRow}>
          <Text style={dp.label}>Workload</Text>
          <View style={dp.meterTrack}>
            <View style={[dp.meterFill, { width: `${Math.min((course.workload / 16) * 100, 100)}%`, backgroundColor: course.workload > 10 ? '#E05555' : course.workload > 7 ? '#F1973B' : '#3DAB73' }]} />
          </View>
          <Text style={dp.meterValue}>{course.workload}h/wk</Text>
        </View>

        {/* Grade distribution */}
        <Text style={[dp.label, { marginTop: 10, marginBottom: 6 }]}>Grade Distribution</Text>
        <View style={dp.gradeRow}>
          {Object.entries(course.gradeDistribution).map(([grade, pct]) => (
            <View key={grade} style={dp.gradeCol}>
              <View style={dp.barTrack}>
                <View style={[dp.barFill, { height: `${(pct / maxGrade) * 100}%` }]} />
              </View>
              <Text style={dp.gradeLabel}>{grade}</Text>
              <Text style={dp.gradePct}>{pct}%</Text>
            </View>
          ))}
        </View>

        {/* Sentiment */}
        <View style={dp.sentimentRow}>
          <View style={dp.sentimentLeft}>
            <Ionicons name="star" size={14} color="#F1973B" />
            <Text style={dp.ratingText}>{course.rating.toFixed(1)}</Text>
            <Text style={dp.reviewText}>({course.reviewCount} reviews)</Text>
          </View>
          <View style={[dp.sentimentBadge, { backgroundColor: sentimentColor + '15' }]}>
            <Text style={[dp.sentimentText, { color: sentimentColor }]}>{sentimentScore}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const dp = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: T.textPrimary, marginBottom: 12, letterSpacing: -0.2 },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', color: T.textSecondary, width: 66 },
  meterTrack: {
    flex: 1, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  meterFill: { height: '100%', borderRadius: 4 },
  meterLabel: { fontSize: 11, fontWeight: '700', width: 58, textAlign: 'right' },
  meterValue: { fontSize: 11, fontWeight: '600', color: T.textMuted, width: 58, textAlign: 'right' },
  gradeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, height: 80 },
  gradeCol: { flex: 1, alignItems: 'center', gap: 3 },
  barTrack: {
    flex: 1, width: '100%', borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.04)', overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: 6, backgroundColor: T.accentBlue },
  gradeLabel: { fontSize: 11, fontWeight: '700', color: T.textPrimary },
  gradePct: { fontSize: 10, color: T.textMuted },
  sentimentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sentimentLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 15, fontWeight: '800', color: T.textPrimary },
  reviewText: { fontSize: 12, color: T.textMuted },
  sentimentBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  sentimentText: { fontSize: 11, fontWeight: '700' },
});

// ─── Prerequisites & Course Network ──────────────────────────────────────────
function PrerequisiteGraph({ course, onNavigate }: { course: Course; onNavigate: (code: string) => void }) {
  const hasPrereqs = course.prerequisites.length > 0;
  const hasFollowUps = course.followUps.length > 0;

  if (!hasPrereqs && !hasFollowUps) return null;

  return (
    <View style={pg.card}>
      <View style={pg.inner}>
        <Text style={pg.sectionTitle}>Course Network</Text>

        {hasPrereqs && (
          <View style={pg.section}>
            <View style={pg.labelRow}>
              <Ionicons name="arrow-back-outline" size={14} color={T.accentPurple} />
              <Text style={pg.label}>Prerequisites</Text>
            </View>
            <View style={pg.nodeRow}>
              {course.prerequisites.map((code) => (
                <TouchableOpacity key={code} activeOpacity={0.7} style={pg.node} onPress={() => onNavigate(code)}>
                  <Text style={pg.nodeText}>{code}</Text>
                  <Ionicons name="open-outline" size={10} color={T.accentBlue} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Current course */}
        <View style={pg.currentNode}>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={pg.currentGrad}>
            <Text style={pg.currentText}>{course.code}</Text>
          </LinearGradient>
        </View>

        {/* Connector lines */}
        {hasPrereqs && <View style={pg.connectorUp} />}
        {hasFollowUps && <View style={pg.connectorDown} />}

        {hasFollowUps && (
          <View style={pg.section}>
            <View style={pg.labelRow}>
              <Ionicons name="arrow-forward-outline" size={14} color="#3DAB73" />
              <Text style={pg.label}>Leads to</Text>
            </View>
            <View style={pg.nodeRow}>
              {course.followUps.map((code) => (
                <TouchableOpacity key={code} activeOpacity={0.7} style={[pg.node, pg.nodeGreen]} onPress={() => onNavigate(code)}>
                  <Text style={[pg.nodeText, { color: '#3DAB73' }]}>{code}</Text>
                  <Ionicons name="open-outline" size={10} color="#3DAB73" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const pg = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 18, alignItems: 'center' },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2,
    alignSelf: 'flex-start', marginBottom: 14,
  },
  section: { width: '100%', marginBottom: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  nodeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  node: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(75,80,248,0.15)',
  },
  nodeGreen: {
    backgroundColor: 'rgba(61,171,115,0.08)',
    borderColor: 'rgba(61,171,115,0.15)',
  },
  nodeText: { fontSize: 13, fontWeight: '700', color: T.accentBlue },
  currentNode: { marginVertical: 10 },
  currentGrad: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  currentText: { fontSize: 15, fontWeight: '800', color: T.white, letterSpacing: 0.5 },
  connectorUp: {
    position: 'absolute', top: 80, left: '50%', width: 2, height: 20,
    backgroundColor: 'rgba(75,80,248,0.15)',
  },
  connectorDown: {
    position: 'absolute', bottom: 80, left: '50%', width: 2, height: 20,
    backgroundColor: 'rgba(61,171,115,0.15)',
  },
});

// ─── Student Insights ────────────────────────────────────────────────────────
function StudentInsights({ course }: { course: Course }) {
  return (
    <View style={si.card}>
      <View style={si.inner}>
        <Text style={si.sectionTitle}>Student Insights</Text>

        {/* Top professors */}
        <View style={si.subsection}>
          <View style={si.subHeader}>
            <Ionicons name="school-outline" size={14} color={T.accentPurple} />
            <Text style={si.subTitle}>Best Professors</Text>
          </View>
          <View style={si.profRow}>
            {course.topProfessors.map((prof, i) => (
              <View key={i} style={si.profChip}>
                <Ionicons name="person-circle-outline" size={16} color={T.accentBlue} />
                <Text style={si.profName}>{prof}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Survival tips */}
        <View style={si.subsection}>
          <View style={si.subHeader}>
            <Ionicons name="bulb-outline" size={14} color="#3DAB73" />
            <Text style={si.subTitle}>Survival Tips</Text>
          </View>
          {course.tips.map((tip, i) => (
            <View key={i} style={si.tipRow}>
              <View style={si.tipDot} />
              <Text style={si.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Common pitfalls */}
        <View style={si.subsection}>
          <View style={si.subHeader}>
            <Ionicons name="warning-outline" size={14} color="#E05555" />
            <Text style={si.subTitle}>Common Pitfalls</Text>
          </View>
          {course.pitfalls.map((pit, i) => (
            <View key={i} style={si.pitRow}>
              <Ionicons name="alert-circle" size={14} color="#E05555" />
              <Text style={si.pitText}>{pit}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity activeOpacity={0.7} style={si.ctaBtn}>
          <Text style={si.ctaText}>View All Discussions</Text>
          <Ionicons name="arrow-forward" size={14} color={T.accentBlue} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const si = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 18, gap: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
  subsection: { gap: 6 },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subTitle: { fontSize: 13, fontWeight: '600', color: T.textSecondary },
  profRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  profChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(75,80,248,0.06)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(75,80,248,0.10)',
  },
  profName: { fontSize: 12, fontWeight: '600', color: T.textPrimary },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 4 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3DAB73', marginTop: 5 },
  tipText: { fontSize: 13, color: T.textSecondary, lineHeight: 18, flex: 1 },
  pitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 4 },
  pitText: { fontSize: 13, color: T.textSecondary, lineHeight: 18, flex: 1 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(75,80,248,0.06)', borderRadius: 12,
    paddingVertical: 11, borderWidth: 1, borderColor: 'rgba(75,80,248,0.12)',
  },
  ctaText: { fontSize: 13, fontWeight: '600', color: T.accentBlue },
});

// ─── Resources & Materials ───────────────────────────────────────────────────
function ResourcesSection({ course }: { course: Course }) {
  const resources = getResources(course.code);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? resources : resources.slice(0, 2);

  return (
    <View style={rs.card}>
      <View style={rs.inner}>
        <View style={rs.headerRow}>
          <Text style={rs.sectionTitle}>Resources & Materials</Text>
          <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
            <Text style={rs.toggleText}>{expanded ? 'Show less' : 'Show all'}</Text>
          </TouchableOpacity>
        </View>
        {visible.map((r) => (
          <View key={r.id} style={rs.item}>
            <View style={[rs.iconWrap, { backgroundColor: RESOURCE_COLORS[r.type] + '10' }]}>
              <Ionicons name={RESOURCE_ICONS[r.type] as any} size={16} color={RESOURCE_COLORS[r.type]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={rs.itemTitle} numberOfLines={1}>{r.title}</Text>
              <Text style={rs.itemType}>{r.type.charAt(0).toUpperCase() + r.type.slice(1)}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} style={rs.upvoteBtn}>
              <Ionicons name="arrow-up-outline" size={14} color={T.accentBlue} />
              <Text style={rs.upvoteCount}>{r.upvotes}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const rs = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 18, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
  toggleText: { fontSize: 12, fontWeight: '600', color: T.accentBlue },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: 13, fontWeight: '600', color: T.textPrimary },
  itemType: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  upvoteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(75,80,248,0.06)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 5,
  },
  upvoteCount: { fontSize: 11, fontWeight: '700', color: T.accentBlue },
});

// ─── Discussion Activity ─────────────────────────────────────────────────────
function DiscussionActivity({ course }: { course: Course }) {
  return (
    <View style={da.card}>
      <View style={da.inner}>
        <Text style={da.sectionTitle}>Discussion Activity</Text>
        <View style={da.statsRow}>
          <View style={da.statBox}>
            <Text style={da.statNumber}>{course.discussionCount}</Text>
            <Text style={da.statLabel}>Active threads</Text>
          </View>
          <View style={da.statBox}>
            <View style={da.liveDot} />
            <Text style={da.statNumber}>{Math.floor(course.discussionCount * 0.3)}</Text>
            <Text style={da.statLabel}>Viewing now</Text>
          </View>
        </View>
        <View style={da.previewBox}>
          <View style={da.previewHeader}>
            <Ionicons name="chatbubble-outline" size={13} color={T.accentPurple} />
            <Text style={da.previewLabel}>Latest question</Text>
          </View>
          <Text style={da.previewText} numberOfLines={2}>
            "Does anyone know if the midterm covers chapter 7? The syllabus is unclear..."
          </Text>
          <Text style={da.previewMeta}>Posted 12m ago · 4 replies</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8}>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={da.ctaBtn}>
            <Ionicons name="chatbubbles-outline" size={16} color={T.white} />
            <Text style={da.ctaText}>Join Course Community</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const da = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 18, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3DAB73' },
  statNumber: { fontSize: 16, fontWeight: '800', color: T.textPrimary },
  statLabel: { fontSize: 11, color: T.textMuted, flex: 1 },
  previewBox: {
    backgroundColor: 'rgba(139,77,255,0.04)', borderRadius: 14,
    padding: 12, gap: 4,
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.08)',
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  previewLabel: { fontSize: 11, fontWeight: '600', color: T.accentPurple },
  previewText: { fontSize: 13, color: T.textPrimary, lineHeight: 18, fontStyle: 'italic' },
  previewMeta: { fontSize: 11, color: T.textMuted },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 14,
  },
  ctaText: { fontSize: 15, fontWeight: '700', color: T.white },
});

// ─── Main Detail Screen ──────────────────────────────────────────────────────
export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const course = COURSES[id ?? '1'];

  if (loading) {
    return (
      <View style={s.root}>
        <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={hdr.row}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={hdr.navBtn}>
              <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 22, gap: 16, paddingTop: 4 }}>
            <DetailHeaderSkeleton />
            <SkeletonList count={3} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={s.root}>
        <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: T.textMuted, fontSize: 16 }}>Course not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: T.accentBlue, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const navigateToCourse = (code: string) => {
    const found = Object.values(COURSES).find((c) => c.code === code);
    if (found) router.push(`/course/${found.id}` as any);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header
          onBack={() => router.back()}
          onSave={() => setSaved(!saved)}
          onShare={() => {}}
          saved={saved}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <CourseHero course={course} />
          <DifficultyPanel course={course} />
          <PrerequisiteGraph course={course} onNavigate={navigateToCourse} />
          <StudentInsights course={course} />
          <ResourcesSection course={course} />
          <DiscussionActivity course={course} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingTop: 4, paddingBottom: 32, gap: 16 },
});
