import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable,
  TextInput, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

function ratingColor(r: number) {
  if (r >= 4.0) return '#3DAB73';
  if (r >= 3.0) return '#F1973B';
  return '#E05555';
}

function sentimentLabel(r: number) { return r >= 4.0 ? 'Positive' : r >= 3.0 ? 'Mixed' : 'Tough Grader'; }
function sentimentColor(r: number) { return r >= 4.0 ? '#3DAB73' : r >= 3.0 ? '#F1973B' : '#E05555'; }

// ─── Professor data ──────────────────────────────────────────────────────────
type Professor = {
  id: string; name: string; department: string; courses: string[];
  overall: number; clarity: number; fairness: number; workload: number; engagement: number;
  reviewCount: number; tags: string[];
};

const PROFS: Record<string, Professor> = {
  '1': { id: '1', name: 'Prof. Daniel Horton', department: 'Computer Science', courses: ['CSC263', 'CSC373'], overall: 4.6, clarity: 4.8, fairness: 4.3, workload: 3.5, engagement: 4.7, reviewCount: 189, tags: ['Clear explanations', 'Tough exams', 'Helpful office hours'] },
  '2': { id: '2', name: 'Prof. Jennifer Liu', department: 'Computer Science', courses: ['CSC108', 'CSC148'], overall: 4.5, clarity: 4.7, fairness: 4.5, workload: 3.0, engagement: 4.4, reviewCount: 312, tags: ['Beginner friendly', 'Well organized', 'Slides-based'] },
  '3': { id: '3', name: 'Prof. Michael Selick', department: 'Mathematics', courses: ['MAT237', 'MAT337'], overall: 3.2, clarity: 2.8, fairness: 3.0, workload: 4.8, engagement: 3.5, reviewCount: 145, tags: ['Proof-heavy', 'Fast-paced', 'Challenging but rewarding'] },
  '4': { id: '4', name: 'Prof. Anita Bhatt', department: 'Psychology', courses: ['PSY100', 'PSY201'], overall: 4.7, clarity: 4.6, fairness: 4.8, workload: 2.5, engagement: 4.9, reviewCount: 524, tags: ['Very interactive', 'Funny lectures', 'Fair grading'] },
  '5': { id: '5', name: 'Prof. Sarah Brenner', department: 'Statistics', courses: ['STA257', 'STA261'], overall: 3.5, clarity: 3.3, fairness: 3.6, workload: 4.0, engagement: 3.2, reviewCount: 198, tags: ['Exam-heavy', 'Derivation focused', 'Office hours essential'] },
  '6': { id: '6', name: 'Prof. Alexander Guerzhoy', department: 'Computer Science', courses: ['CSC108', 'CSC180'], overall: 4.3, clarity: 4.5, fairness: 4.2, workload: 3.2, engagement: 4.1, reviewCount: 276, tags: ['Practical examples', 'Assignments well-designed', 'Approachable'] },
  '7': { id: '7', name: 'Prof. Wei Chen', department: 'History', courses: ['HIS101', 'HIS201'], overall: 4.1, clarity: 4.0, fairness: 4.3, workload: 3.5, engagement: 3.8, reviewCount: 145, tags: ['Essay-heavy', 'Engaging storyteller', 'Tutorial participation matters'] },
  '8': { id: '8', name: 'Prof. James Gazzale', department: 'Economics', courses: ['ECO101', 'ECO200'], overall: 4.0, clarity: 4.2, fairness: 3.8, workload: 3.3, engagement: 3.9, reviewCount: 210, tags: ['Graph-heavy', 'Textbook mirrors exams', 'Curved generously'] },
  '9': { id: '9', name: 'Prof. John Cami', department: 'Astronomy', courses: ['AST101', 'AST201'], overall: 4.6, clarity: 4.8, fairness: 4.7, workload: 2.2, engagement: 4.5, reviewCount: 380, tags: ['Bird course legend', 'iClicker marks', 'Planetarium sessions'] },
  '10': { id: '10', name: 'Prof. David Calver', department: 'Computer Science', courses: ['CSC148', 'CSC207'], overall: 4.2, clarity: 4.4, fairness: 4.0, workload: 3.8, engagement: 4.3, reviewCount: 295, tags: ['Recursion king', 'Debugger advocate', 'Tricky edge cases'] },
  '11': { id: '11', name: 'Prof. Lisa Morrison', department: 'Philosophy', courses: ['PHL101', 'PHL200'], overall: 4.3, clarity: 4.1, fairness: 4.4, workload: 3.0, engagement: 4.2, reviewCount: 210, tags: ['Argument-focused', 'TA feedback crucial', 'Socratic style'] },
  '12': { id: '12', name: 'Prof. Thomas Baumgart', department: 'Computer Science', courses: ['CSC263', 'CSC369'], overall: 3.8, clarity: 3.6, fairness: 3.9, workload: 4.2, engagement: 3.7, reviewCount: 167, tags: ['Exam-heavy', 'Past exams are gold', 'Amortized analysis expert'] },
};

// ─── Mock reviews ────────────────────────────────────────────────────────────
type Review = {
  id: string; course: string; semester: string;
  clarity: number; fairness: number; workload: number; engagement: number;
  text: string; helpful: number; agree: number;
};

function getReviews(profId: string): Review[] {
  return [
    { id: '1', course: 'CSC263', semester: 'Fall 2025', clarity: 5, fairness: 4, workload: 4, engagement: 5, text: 'One of the best lecturers I\'ve had. Explains complex data structures with amazing clarity. Exams are tough but fair if you attend lectures.', helpful: 42, agree: 38 },
    { id: '2', course: 'CSC263', semester: 'Winter 2025', clarity: 4, fairness: 4, workload: 3, engagement: 5, text: 'Really engaging lecturer. Office hours are super helpful. Problem sets are hard but the TAs are responsive.', helpful: 31, agree: 27 },
    { id: '3', course: 'CSC373', semester: 'Fall 2024', clarity: 5, fairness: 5, workload: 4, engagement: 4, text: 'Challenging course but Prof makes it manageable. Past exams are the best prep. Highly recommend attending every lecture.', helpful: 28, agree: 25 },
    { id: '4', course: 'CSC263', semester: 'Fall 2024', clarity: 4, fairness: 3, workload: 4, engagement: 4, text: 'Good professor overall. The midterm felt harder than practice problems but the curve was generous. Would take again.', helpful: 19, agree: 15 },
    { id: '5', course: 'CSC373', semester: 'Winter 2024', clarity: 5, fairness: 4, workload: 3, engagement: 5, text: 'Makes algorithms feel intuitive instead of abstract. The visualizations in lecture are incredible. Best CS prof.', helpful: 56, agree: 48 },
  ];
}

// ─── Mock trend data ─────────────────────────────────────────────────────────
const TREND_SEMESTERS = ['F23', 'W24', 'F24', 'W25', 'F25'];
function getTrendData(prof: Professor) {
  const base = prof.overall;
  return TREND_SEMESTERS.map((sem, i) => ({
    semester: sem,
    rating: Math.max(1, Math.min(5, base + (Math.random() - 0.5) * 0.6 - 0.1 + i * 0.05)),
    reviews: Math.floor(prof.reviewCount / 5 + (Math.random() - 0.3) * 15),
  }));
}

// ─── Dept average (mock) ─────────────────────────────────────────────────────
const DEPT_AVG = { clarity: 3.8, fairness: 3.7, workload: 3.4, engagement: 3.6, overall: 3.7 };

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
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? T.accentPurple : T.textSecondary} />
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

// ─── Professor Hero ──────────────────────────────────────────────────────────
function ProfHero({ prof }: { prof: Professor }) {
  return (
    <View style={ph.card}>
      <View style={ph.inner}>
        <View style={ph.topRow}>
          <LinearGradient colors={[T.accentPurple, T.accentBlue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ph.avatar}>
            <Text style={ph.avatarText}>{prof.name.split(' ').pop()?.[0]}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={ph.name}>{prof.name}</Text>
            <View style={ph.deptRow}>
              <View style={ph.deptBadge}>
                <Text style={ph.deptText}>{prof.department}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Courses taught */}
        <View style={ph.coursesRow}>
          <Text style={ph.coursesLabel}>Teaches:</Text>
          {prof.courses.map((c) => (
            <TouchableOpacity key={c} activeOpacity={0.7} style={ph.coursePill}>
              <Text style={ph.courseText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick actions */}
        <View style={ph.actionsRow}>
          <TouchableOpacity activeOpacity={0.7} style={ph.actionBtn}>
            <Ionicons name="git-compare-outline" size={15} color={T.accentPurple} />
            <Text style={[ph.actionText, { color: T.accentPurple }]}>Compare</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={ph.actionBtn}>
            <Ionicons name="chatbubbles-outline" size={15} color={T.accentBlue} />
            <Text style={ph.actionText}>Discussions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const ph = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  inner: { padding: 18, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800', color: T.white },
  name: { fontSize: 20, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  deptRow: { flexDirection: 'row', marginTop: 4 },
  deptBadge: { backgroundColor: 'rgba(139,77,255,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  deptText: { fontSize: 11, fontWeight: '600', color: T.accentPurple },
  coursesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  coursesLabel: { fontSize: 12, color: T.textMuted, fontWeight: '600' },
  coursePill: { backgroundColor: 'rgba(75,80,248,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  courseText: { fontSize: 12, fontWeight: '700', color: T.accentBlue },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(139,77,255,0.06)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.12)',
  },
  actionText: { fontSize: 12, fontWeight: '600', color: T.accentBlue },
});

// ─── Rating Overview Panel ───────────────────────────────────────────────────
function RatingBar({ label, value, avg, color }: { label: string; value: number; avg: number; color: string }) {
  return (
    <View style={rb.row}>
      <Text style={rb.label}>{label}</Text>
      <View style={rb.trackWrap}>
        <View style={rb.track}>
          <View style={[rb.fill, { width: `${(value / 5) * 100}%`, backgroundColor: color }]} />
        </View>
        <View style={[rb.avgMarker, { left: `${(avg / 5) * 100}%` }]} />
      </View>
      <Text style={[rb.value, { color }]}>{value.toFixed(1)}</Text>
    </View>
  );
}

const rb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 12, fontWeight: '600', color: T.textSecondary, width: 78 },
  trackWrap: { flex: 1, position: 'relative', justifyContent: 'center' },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  avgMarker: {
    position: 'absolute', top: -2, width: 2, height: 12, borderRadius: 1,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  value: { fontSize: 13, fontWeight: '800', width: 30, textAlign: 'right' },
});

function RatingOverview({ prof }: { prof: Professor }) {
  const sColor = sentimentColor(prof.overall);
  return (
    <View style={ro.card}>
      <View style={ro.inner}>
        <Text style={ro.sectionTitle}>Rating Overview</Text>

        {/* Overall score */}
        <View style={ro.overallRow}>
          <View style={[ro.overallBadge, { backgroundColor: ratingColor(prof.overall) + '12' }]}>
            <Text style={[ro.overallScore, { color: ratingColor(prof.overall) }]}>{prof.overall.toFixed(1)}</Text>
            <Text style={ro.overallMax}>/5.0</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={[ro.sentBadge, { backgroundColor: sColor + '15' }]}>
              <Text style={[ro.sentText, { color: sColor }]}>{sentimentLabel(prof.overall)}</Text>
            </View>
            <Text style={ro.reviewText}>{prof.reviewCount} reviews</Text>
          </View>
        </View>

        {/* Bars with dept average markers */}
        <View style={ro.barsWrap}>
          <RatingBar label="Clarity" value={prof.clarity} avg={DEPT_AVG.clarity} color={ratingColor(prof.clarity)} />
          <RatingBar label="Fairness" value={prof.fairness} avg={DEPT_AVG.fairness} color={ratingColor(prof.fairness)} />
          <RatingBar label="Workload" value={prof.workload} avg={DEPT_AVG.workload} color={prof.workload > 3.5 ? '#E05555' : prof.workload > 2.5 ? '#F1973B' : '#3DAB73'} />
          <RatingBar label="Engagement" value={prof.engagement} avg={DEPT_AVG.engagement} color={ratingColor(prof.engagement)} />
        </View>

        {/* Legend */}
        <View style={ro.legendRow}>
          <View style={ro.legendItem}>
            <View style={[ro.legendDot, { backgroundColor: T.accentBlue }]} />
            <Text style={ro.legendText}>This professor</Text>
          </View>
          <View style={ro.legendItem}>
            <View style={[ro.legendDot, { backgroundColor: 'rgba(0,0,0,0.20)' }]} />
            <Text style={ro.legendText}>Dept. average</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const ro = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 18, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
  overallRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  overallBadge: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  overallScore: { fontSize: 28, fontWeight: '800' },
  overallMax: { fontSize: 12, color: T.textMuted, marginTop: -2 },
  sentBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  sentText: { fontSize: 12, fontWeight: '700' },
  reviewText: { fontSize: 12, color: T.textMuted, marginTop: 4 },
  barsWrap: { gap: 8 },
  legendRow: { flexDirection: 'row', gap: 16, paddingTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: T.textMuted },
});

// ─── Review Highlights (AI summary) ──────────────────────────────────────────
function ReviewHighlights({ prof }: { prof: Professor }) {
  return (
    <View style={rh.card}>
      <View style={rh.inner}>
        <View style={rh.headerRow}>
          <Ionicons name="sparkles" size={16} color={T.accentPurple} />
          <Text style={rh.sectionTitle}>Review Highlights</Text>
          <View style={rh.aiBadge}><Text style={rh.aiText}>AI Summary</Text></View>
        </View>
        <Text style={rh.summary}>
          Students consistently praise {prof.name.split(' ').pop()}'s {prof.clarity >= 4 ? 'clear and engaging teaching style' : 'depth of knowledge'}.
          {prof.workload > 3.5 ? ' The workload is considered above average, but students feel the effort is worthwhile.' : ' Workload is manageable for most students.'}
          {prof.fairness >= 4 ? ' Grading is generally seen as fair and transparent.' : ' Some students feel grading could be more consistent.'}
        </Text>
        <View style={rh.tagsWrap}>
          {prof.tags.map((tag, i) => (
            <View key={i} style={rh.tag}>
              <Text style={rh.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const rh = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 18, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2, flex: 1 },
  aiBadge: {
    backgroundColor: 'rgba(139,77,255,0.08)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  aiText: { fontSize: 10, fontWeight: '700', color: T.accentPurple },
  summary: { fontSize: 13, color: T.textSecondary, lineHeight: 19 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: 'rgba(139,77,255,0.06)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.10)',
  },
  tagText: { fontSize: 11, fontWeight: '600', color: T.accentPurple },
});

// ─── Student Reviews Feed ────────────────────────────────────────────────────
const REVIEW_SORT = ['Most Helpful', 'Most Recent', 'Highest', 'Lowest'];

function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={rc.card}>
      <View style={rc.headerRow}>
        <View style={rc.anonAvatar}>
          <Ionicons name="person" size={14} color={T.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rc.anonLabel}>Anonymous Student</Text>
          <Text style={rc.meta}>{review.course} · {review.semester}</Text>
        </View>
        <View style={rc.miniRatings}>
          {[
            { l: 'C', v: review.clarity },
            { l: 'F', v: review.fairness },
            { l: 'W', v: review.workload },
            { l: 'E', v: review.engagement },
          ].map((r) => (
            <View key={r.l} style={[rc.miniDot, { backgroundColor: ratingColor(r.v) + '20' }]}>
              <Text style={[rc.miniText, { color: ratingColor(r.v) }]}>{r.l}{r.v}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={rc.text}>{review.text}</Text>
      <View style={rc.reactionsRow}>
        <TouchableOpacity activeOpacity={0.7} style={rc.reactionBtn}>
          <Ionicons name="thumbs-up-outline" size={13} color={T.accentBlue} />
          <Text style={rc.reactionText}>Helpful ({review.helpful})</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={rc.reactionBtn}>
          <Ionicons name="checkmark-circle-outline" size={13} color="#3DAB73" />
          <Text style={[rc.reactionText, { color: '#3DAB73' }]}>Agree ({review.agree})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const rc = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    padding: 16, gap: 10, marginBottom: 10,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  anonAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  anonLabel: { fontSize: 12, fontWeight: '600', color: T.textPrimary },
  meta: { fontSize: 11, color: T.textMuted },
  miniRatings: { flexDirection: 'row', gap: 3 },
  miniDot: { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  miniText: { fontSize: 9, fontWeight: '700' },
  text: { fontSize: 13, color: T.textSecondary, lineHeight: 19 },
  reactionsRow: { flexDirection: 'row', gap: 12 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactionText: { fontSize: 11, fontWeight: '600', color: T.accentBlue },
});

// ─── Teaching Trend ──────────────────────────────────────────────────────────
function TeachingTrend({ prof }: { prof: Professor }) {
  const data = getTrendData(prof);
  const maxRating = 5;
  const chartH = 100;
  const barW = (SCREEN_W - 44 - 40 - data.length * 8) / data.length;

  return (
    <View style={tt.card}>
      <View style={tt.inner}>
        <Text style={tt.sectionTitle}>Teaching Trend</Text>
        <View style={tt.chartArea}>
          {data.map((d, i) => {
            const h = (d.rating / maxRating) * chartH;
            const color = ratingColor(d.rating);
            return (
              <View key={i} style={tt.barCol}>
                <View style={[tt.barTrack, { height: chartH }]}>
                  <View style={[tt.barFill, { height: h, backgroundColor: color }]} />
                </View>
                <Text style={tt.semLabel}>{d.semester}</Text>
                <Text style={[tt.ratingLabel, { color }]}>{d.rating.toFixed(1)}</Text>
              </View>
            );
          })}
        </View>
        <View style={tt.metaRow}>
          <Ionicons name="trending-up" size={14} color="#3DAB73" />
          <Text style={tt.metaText}>Rating trending upward over last 3 semesters</Text>
        </View>
      </View>
    </View>
  );
}

const tt = StyleSheet.create({
  card: {
    marginHorizontal: 22, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  inner: { padding: 18, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
  chartArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: {
    width: '100%', borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 8 },
  semLabel: { fontSize: 10, fontWeight: '600', color: T.textMuted },
  ratingLabel: { fontSize: 10, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: T.textMuted },
});

// ─── Write Review Sheet ──────────────────────────────────────────────────────
function WriteReviewSheet({ prof, visible, onClose }: {
  prof: Professor; visible: boolean; onClose: () => void;
}) {
  const [selCourse, setSelCourse] = useState(prof.courses[0]);
  const [ratings, setRatings] = useState({ clarity: 0, fairness: 0, workload: 0, engagement: 0 });
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(true);

  const ratingCategories = [
    { key: 'clarity', label: 'Clarity', icon: 'eye-outline' },
    { key: 'fairness', label: 'Fairness', icon: 'scale-outline' },
    { key: 'workload', label: 'Workload', icon: 'barbell-outline' },
    { key: 'engagement', label: 'Engagement', icon: 'sparkles-outline' },
  ] as const;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={wr.backdrop} onPress={onClose}>
        <Pressable style={wr.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={wr.handle} />
            <Text style={wr.title}>Write Review</Text>
            <Text style={wr.subtitle}>for {prof.name}</Text>

            {/* Course selector */}
            <Text style={wr.label}>Course</Text>
            <View style={wr.courseRow}>
              {prof.courses.map((c) => (
                <TouchableOpacity
                  key={c} activeOpacity={0.7}
                  style={[wr.coursePill, selCourse === c && wr.coursePillActive]}
                  onPress={() => setSelCourse(c)}
                >
                  <Text style={[wr.courseText, selCourse === c && wr.courseTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Star ratings */}
            {ratingCategories.map(({ key, label, icon }) => (
              <View key={key} style={wr.ratingRow}>
                <Ionicons name={icon as any} size={16} color={T.accentPurple} />
                <Text style={wr.ratingLabel}>{label}</Text>
                <View style={wr.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star} activeOpacity={0.6}
                      onPress={() => setRatings((prev) => ({ ...prev, [key]: star }))}
                    >
                      <Ionicons
                        name={star <= ratings[key] ? 'star' : 'star-outline'}
                        size={22}
                        color={star <= ratings[key] ? '#F1973B' : 'rgba(0,0,0,0.12)'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Tags */}
            <Text style={[wr.label, { marginTop: 14 }]}>Tags</Text>
            <View style={wr.tagsRow}>
              {['Exam-heavy', 'Slides-based', 'Very interactive', 'Group projects', 'Fair grading', 'Funny lectures', 'Fast-paced'].map((tag) => (
                <TouchableOpacity key={tag} activeOpacity={0.7} style={wr.tagChip}>
                  <Text style={wr.tagChipText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Written feedback */}
            <Text style={[wr.label, { marginTop: 14 }]}>Your Review</Text>
            <TextInput
              style={wr.textInput}
              placeholder="Share your experience with this professor..."
              placeholderTextColor={T.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={text}
              onChangeText={setText}
            />

            {/* Anonymous toggle */}
            <TouchableOpacity
              style={wr.anonRow} activeOpacity={0.7}
              onPress={() => setAnonymous(!anonymous)}
            >
              <Ionicons name={anonymous ? 'checkbox' : 'square-outline'} size={20} color={T.accentPurple} />
              <Text style={wr.anonText}>Post anonymously</Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity activeOpacity={0.8} onPress={onClose}>
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={wr.submitBtn}>
                <Text style={wr.submitText}>Submit Review</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const wr = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: T.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 22, paddingBottom: 36, maxHeight: '90%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '800', color: T.textPrimary },
  subtitle: { fontSize: 13, color: T.textMuted, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: T.textPrimary, marginBottom: 8 },
  courseRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  coursePill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  coursePillActive: { backgroundColor: T.accentPurple, borderColor: T.accentPurple },
  courseText: { fontSize: 13, fontWeight: '700', color: T.textSecondary },
  courseTextActive: { color: T.white },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  ratingLabel: { fontSize: 13, fontWeight: '600', color: T.textSecondary, flex: 1 },
  starsRow: { flexDirection: 'row', gap: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: 'rgba(139,77,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.12)',
  },
  tagChipText: { fontSize: 11, fontWeight: '600', color: T.accentPurple },
  textInput: {
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 14,
    padding: 14, fontSize: 14, color: T.textPrimary,
    minHeight: 100, backgroundColor: 'rgba(0,0,0,0.02)',
  },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 16 },
  anonText: { fontSize: 13, color: T.textSecondary },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, paddingVertical: 15,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: T.white },
});

// ─── Compare Professors Sheet ────────────────────────────────────────────────
function CompareBar({ label, val1, val2, name1, name2 }: {
  label: string; val1: number; val2: number; name1: string; name2: string;
}) {
  return (
    <View style={cb.row}>
      <Text style={cb.label}>{label}</Text>
      <View style={cb.barsWrap}>
        <View style={cb.barRow}>
          <View style={[cb.bar1, { width: `${(val1 / 5) * 100}%` }]} />
          <Text style={cb.val}>{val1.toFixed(1)}</Text>
        </View>
        <View style={cb.barRow}>
          <View style={[cb.bar2, { width: `${(val2 / 5) * 100}%` }]} />
          <Text style={cb.val}>{val2.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
}

const cb = StyleSheet.create({
  row: { gap: 4 },
  label: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  barsWrap: { gap: 3 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bar1: { height: 6, borderRadius: 3, backgroundColor: T.accentPurple },
  bar2: { height: 6, borderRadius: 3, backgroundColor: T.accentBlue },
  val: { fontSize: 11, fontWeight: '700', color: T.textMuted },
});

// ─── Main Detail Screen ──────────────────────────────────────────────────────
export default function ProfessorDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [saved, setSaved] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [reviewSort, setReviewSort] = useState('Most Helpful');

  const prof = PROFS[id ?? '1'];
  if (!prof) {
    return (
      <View style={s.root}>
        <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: T.textMuted, fontSize: 16 }}>Professor not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: T.accentPurple, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const reviews = getReviews(prof.id);
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (reviewSort) {
      case 'Most Recent': return 0;
      case 'Highest': return (b.clarity + b.fairness + b.engagement) - (a.clarity + a.fairness + a.engagement);
      case 'Lowest': return (a.clarity + a.fairness + a.engagement) - (b.clarity + b.fairness + b.engagement);
      default: return b.helpful - a.helpful;
    }
  });

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
          <ProfHero prof={prof} />
          <RatingOverview prof={prof} />
          <ReviewHighlights prof={prof} />
          <TeachingTrend prof={prof} />

          {/* Reviews section */}
          <View style={s.reviewsHeader}>
            <Text style={s.reviewsTitle}>Student Reviews</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {REVIEW_SORT.map((opt) => (
                <TouchableOpacity
                  key={opt} activeOpacity={0.7}
                  style={[s.sortChip, reviewSort === opt && s.sortChipActive]}
                  onPress={() => setReviewSort(opt)}
                >
                  <Text style={[s.sortChipText, reviewSort === opt && s.sortChipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {sortedReviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Write Review FAB */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={s.fabWrap}
          onPress={() => setShowWriteReview(true)}
        >
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.fab}>
            <Ionicons name="create-outline" size={18} color={T.white} />
            <Text style={s.fabText}>Write Review</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>

      <WriteReviewSheet
        prof={prof}
        visible={showWriteReview}
        onClose={() => setShowWriteReview(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingTop: 4, paddingBottom: 32, gap: 16 },
  reviewsHeader: { paddingHorizontal: 22, gap: 8 },
  reviewsTitle: { fontSize: 15, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.2 },
  sortChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  sortChipActive: { backgroundColor: T.accentPurple, borderColor: T.accentPurple },
  sortChipText: { fontSize: 11, fontWeight: '600', color: T.textSecondary },
  sortChipTextActive: { color: T.white },
  fabWrap: {
    position: 'absolute', bottom: 24, right: 22,
    shadowColor: T.accentPurple, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  fab: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 14,
  },
  fabText: { fontSize: 14, fontWeight: '700', color: T.white },
});
