import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable,
  Dimensions, Animated, TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useSchedule,
  useBulkImportSchedule,
  useCreateScheduleBlock,
  useDeleteScheduleBlock,
  ScheduleBlockItem,
} from '../src/services/queries';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

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

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS_START = 8;
const HOURS_END = 22;
const HOUR_HEIGHT = 64;
const TIME_COL_W = 48;
const DAY_COL_W = (SCREEN_W - TIME_COL_W - 44) / 5;

// ─── Color palette for courses ────────────────────────────────────────────────
const COURSE_COLORS = [
  { bg: '#E8EAFF', border: '#4B50F8', text: '#4B50F8' },
  { bg: '#F3E8FF', border: '#8B4DFF', text: '#8B4DFF' },
  { bg: '#FFE8F5', border: '#E655C5', text: '#E655C5' },
  { bg: '#E8FFF3', border: '#3DAB73', text: '#3DAB73' },
  { bg: '#FFF3E8', border: '#F1973B', text: '#F1973B' },
  { bg: '#E8F4FF', border: '#4D97FF', text: '#4D97FF' },
  { bg: '#FFF8E8', border: '#D4A017', text: '#B8860B' },
  { bg: '#FFE8E8', border: '#E05555', text: '#D04040' },
];

// ─── Mock schedule data ───────────────────────────────────────────────────────
type ScheduleBlock = {
  id: string;
  title: string;
  subtitle?: string;
  location?: string;
  professor?: string;
  day: number;
  startHour: number;
  endHour: number;
  colorIndex: number;
  type: 'class' | 'event' | 'personal';
};


// ─── AI Import mock detected items ───────────────────────────────────────────
type DetectedCourse = {
  id: string;
  name: string;
  day: string;
  time: string;
  location: string;
  confidence: number;
  confirmed: boolean;
};


// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatHour(h: number): string {
  const hr = Math.floor(h);
  const min = (h - hr) * 60;
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return min > 0 ? `${display}:${min.toString().padStart(2, '0')} ${ampm}` : `${display} ${ampm}`;
}

function getBlocksForDay(day: number, schedule: ScheduleBlock[]): ScheduleBlock[] {
  return schedule.filter((b) => b.day === day);
}

function getDayDate(dayIndex: number): number {
  const today = new Date();
  const diff = dayIndex - today.getDay();
  const date = new Date(today);
  date.setDate(today.getDate() + diff);
  return date.getDate();
}

// ─── Sticky Header ───────────────────────────────────────────────────────────
function Header({
  onBack, onImport, onExport, weekLabel,
}: {
  onBack: () => void;
  onImport: () => void;
  onExport: () => void;
  weekLabel: string;
}) {
  return (
    <View style={hdr.row}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={hdr.navBtn}>
        <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
      </TouchableOpacity>
      <View style={hdr.center}>
        <Text style={hdr.title}>My Timetable</Text>
      </View>
      <View style={hdr.actions}>
        <TouchableOpacity onPress={onImport} activeOpacity={0.7} style={hdr.actionBtn}>
          <Ionicons name="camera-outline" size={19} color={T.accentBlue} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onExport} activeOpacity={0.7} style={hdr.actionBtn}>
          <Ionicons name="share-outline" size={18} color={T.accentPurple} />
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
  center: { alignItems: 'center', gap: 1 },
  title: { fontSize: 16, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  week: { fontSize: 11, color: T.textMuted, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
});

// ─── Compact day selector ────────────────────────────────────────────────────
function DaySelector({
  selectedDay, onSelect, schedule,
}: {
  selectedDay: number;
  onSelect: (d: number) => void;
  schedule: ScheduleBlock[];
}) {
  const today = new Date().getDay();

  return (
    <View style={ds.row}>
      {DAYS.map((day, i) => {
        const isSelected = i === selectedDay;
        const isToday = i === today;
        const dayBlocks = getBlocksForDay(i, schedule);
        const hasClasses = dayBlocks.length > 0;

        return (
          <TouchableOpacity
            key={day}
            onPress={() => onSelect(i)}
            activeOpacity={0.75}
            style={[ds.dayWrap, isSelected && ds.daySelected]}
          >
            <Text style={[ds.dayLabel, isSelected && ds.dayLabelSelected]}>{day}</Text>
            <Text style={[ds.dayDate, isSelected && ds.dayDateSelected, isToday && !isSelected && ds.dayDateToday]}>
              {getDayDate(i)}
            </Text>
            {hasClasses && !isSelected && <View style={ds.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const ds = StyleSheet.create({
  row: {
    flexDirection: 'row', paddingHorizontal: 14, gap: 4, paddingBottom: 6,
  },
  dayWrap: {
    flex: 1, paddingVertical: 6, borderRadius: 12,
    alignItems: 'center', gap: 2,
  },
  daySelected: {
    backgroundColor: T.accentBlue,
    borderRadius: 12,
    shadowColor: T.accentBlue, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  dayLabel: { fontSize: 10, fontWeight: '600', color: T.textMuted },
  dayLabelSelected: { color: 'rgba(255,255,255,0.7)' },
  dayDate: { fontSize: 15, fontWeight: '800', color: T.textPrimary },
  dayDateSelected: { color: T.white },
  dayDateToday: { color: T.accentBlue },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: T.accentPink,
    marginTop: 1,
  },
});

// ─── Schedule block component ────────────────────────────────────────────────
function ScheduleBlockView({
  block, onPress,
}: {
  block: ScheduleBlock;
  onPress: () => void;
}) {
  const color = COURSE_COLORS[block.colorIndex % COURSE_COLORS.length];
  const top = (block.startHour - HOURS_START) * HOUR_HEIGHT;
  const height = (block.endHour - block.startHour) * HOUR_HEIGHT;
  const isCompact = height < 50;
  const typeIcon = block.type === 'class' ? 'school' : block.type === 'event' ? 'calendar' : 'person';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[sb.wrap, {
        top,
        height: height - 2,
        backgroundColor: color.bg,
        borderLeftColor: color.border,
      }]}
    >
      <View style={sb.content}>
        <View style={sb.titleRow}>
          <Text style={[sb.title, { color: color.text }]} numberOfLines={1}>{block.title}</Text>
          {!isCompact && block.type !== 'class' && (
            <Ionicons name={typeIcon as any} size={11} color={color.text} style={{ opacity: 0.6 }} />
          )}
        </View>
        {!isCompact && block.location && (
          <Text style={[sb.location, { color: color.text }]} numberOfLines={1}>{block.location}</Text>
        )}
        {!isCompact && height > 60 && block.professor && (
          <Text style={[sb.prof, { color: color.text }]} numberOfLines={1}>{block.professor}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const sb = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 2, right: 2,
    borderRadius: 10, borderLeftWidth: 3,
    paddingHorizontal: 8, paddingVertical: 5,
    overflow: 'hidden',
  },
  content: { flex: 1, justifyContent: 'center', gap: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: -0.2 },
  location: { fontSize: 10, fontWeight: '600', opacity: 0.7 },
  prof: { fontSize: 9, fontWeight: '500', opacity: 0.5 },
});

// ─── Free time indicator ─────────────────────────────────────────────────────
function FreeTimeSlots({ blocks }: { blocks: ScheduleBlock[] }) {
  if (blocks.length < 2) return null;

  const sorted = [...blocks].sort((a, b) => a.startHour - b.startHour);
  const gaps: { start: number; end: number }[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = sorted[i].endHour;
    const gapEnd = sorted[i + 1].startHour;
    if (gapEnd - gapStart >= 1) {
      gaps.push({ start: gapStart, end: gapEnd });
    }
  }

  return (
    <>
      {gaps.map((gap, i) => {
        const top = (gap.start - HOURS_START) * HOUR_HEIGHT;
        const height = (gap.end - gap.start) * HOUR_HEIGHT;
        return (
          <View key={i} style={[ft.wrap, { top, height: height - 2 }]}>
            <View style={ft.badge}>
              <Ionicons name="cafe-outline" size={10} color="#3DAB73" />
              <Text style={ft.text}>{gap.end - gap.start}h free</Text>
            </View>
          </View>
        );
      })}
    </>
  );
}

const ft = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 4, right: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(61,171,115,0.04)',
    borderWidth: 1, borderColor: 'rgba(61,171,115,0.12)',
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(61,171,115,0.08)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
  },
  text: { fontSize: 10, fontWeight: '700', color: '#3DAB73' },
});

// ─── Now indicator ───────────────────────────────────────────────────────────
function NowIndicator({ currentHour }: { currentHour: number }) {
  if (currentHour < HOURS_START || currentHour > HOURS_END) return null;
  const top = (currentHour - HOURS_START) * HOUR_HEIGHT;

  return (
    <View style={[ni.wrap, { top }]}>
      <View style={ni.dot} />
      <View style={ni.line} />
    </View>
  );
}

const ni = StyleSheet.create({
  wrap: {
    position: 'absolute', left: -6, right: 0,
    flexDirection: 'row', alignItems: 'center',
    zIndex: 20,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#E05555',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#E05555', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 4,
  },
  line: {
    flex: 1, height: 2,
    backgroundColor: '#E05555',
    borderRadius: 1,
  },
});

// ─── Weekly grid ─────────────────────────────────────────────────────────────
function WeeklyGrid({
  schedule, onBlockPress, selectedDay, onEmptyPress,
}: {
  schedule: ScheduleBlock[];
  onBlockPress: (block: ScheduleBlock) => void;
  selectedDay: number;
  onEmptyPress: (day: number, hour: number) => void;
}) {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const totalHeight = (HOURS_END - HOURS_START) * HOUR_HEIGHT;

  const viewDays = selectedDay === 0 || selectedDay === 6
    ? [0, 6]
    : [1, 2, 3, 4, 5];

  const colWidth = viewDays.length === 2
    ? (SCREEN_W - TIME_COL_W - 44) / 2
    : DAY_COL_W;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ height: totalHeight + 40, paddingTop: 8 }}
      style={{ flex: 1 }}
    >
      <View style={gd.gridRow}>
        {/* Time column */}
        <View style={[gd.timeCol, { width: TIME_COL_W }]}>
          {Array.from({ length: HOURS_END - HOURS_START }, (_, i) => (
            <View key={i} style={[gd.timeSlot, { height: HOUR_HEIGHT }]}>
              <Text style={gd.timeText}>{formatHour(HOURS_START + i)}</Text>
            </View>
          ))}
        </View>

        {/* Day columns */}
        {viewDays.map((dayIdx) => {
          const dayBlocks = getBlocksForDay(dayIdx, schedule);
          const isSelected = dayIdx === selectedDay;

          return (
            <TouchableOpacity
              key={dayIdx}
              activeOpacity={1}
              onLongPress={() => onEmptyPress(dayIdx, 9)}
              style={[gd.dayCol, { width: colWidth }, isSelected && gd.dayColSelected]}
            >
              {/* Grid lines */}
              {Array.from({ length: HOURS_END - HOURS_START }, (_, i) => (
                <View key={i} style={[gd.gridLine, { top: i * HOUR_HEIGHT }]} />
              ))}

              <FreeTimeSlots blocks={dayBlocks} />

              {dayBlocks.map((block) => (
                <ScheduleBlockView
                  key={block.id}
                  block={block}
                  onPress={() => onBlockPress(block)}
                />
              ))}

              {dayIdx === now.getDay() && <NowIndicator currentHour={currentHour} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const gd = StyleSheet.create({
  gridRow: { flexDirection: 'row', paddingHorizontal: 10 },
  timeCol: { },
  timeSlot: { justifyContent: 'flex-start', paddingTop: 0 },
  timeText: { fontSize: 10, fontWeight: '600', color: T.textMuted, textAlign: 'right', paddingRight: 8, marginTop: -6 },
  dayCol: { position: 'relative', borderLeftWidth: 1, borderLeftColor: 'rgba(17,17,17,0.05)' },
  dayColSelected: { backgroundColor: 'rgba(75,80,248,0.02)' },
  gridLine: {
    position: 'absolute', left: 0, right: 0,
    height: 1, backgroundColor: 'rgba(17,17,17,0.05)',
  },
});

// ─── Day column headers ──────────────────────────────────────────────────────
function DayHeaders({ selectedDay }: { selectedDay: number }) {
  const viewDays = selectedDay === 0 || selectedDay === 6 ? [0, 6] : [1, 2, 3, 4, 5];
  const colWidth = viewDays.length === 2 ? (SCREEN_W - TIME_COL_W - 44) / 2 : DAY_COL_W;

  return (
    <View style={dh.row}>
      <View style={{ width: TIME_COL_W }} />
      {viewDays.map((dayIdx) => {
        const isSelected = dayIdx === selectedDay;
        return (
          <View key={dayIdx} style={[dh.dayHeader, { width: colWidth }]}>
            <Text style={[dh.dayText, isSelected && dh.dayTextSelected]}>{DAYS[dayIdx]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const dh = StyleSheet.create({
  row: {
    flexDirection: 'row', paddingHorizontal: 10,
    paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(17,17,17,0.06)',
  },
  dayHeader: { alignItems: 'center' },
  dayText: { fontSize: 11, fontWeight: '700', color: T.textMuted },
  dayTextSelected: { color: T.accentBlue, fontWeight: '800' },
});

// ─── Block detail bottom sheet ───────────────────────────────────────────────
function BlockDetailSheet({
  block, visible, onClose,
}: {
  block: ScheduleBlock | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!block) return null;
  const color = COURSE_COLORS[block.colorIndex % COURSE_COLORS.length];

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={bd.backdrop} onPress={onClose} />
      <View style={bd.sheetWrap} pointerEvents="box-none">
        <View style={bd.sheet}>
          <LinearGradient
            colors={[color.border, color.border + '60']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={bd.accent}
          />
          <View style={bd.handle} />

          <View style={bd.content}>
            <View style={bd.titleRow}>
              <View style={[bd.typeIcon, { backgroundColor: color.bg }]}>
                <Ionicons
                  name={(block.type === 'class' ? 'school' : block.type === 'event' ? 'calendar' : 'person') as any}
                  size={20} color={color.text}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={bd.title}>{block.title}</Text>
                {block.subtitle && <Text style={bd.subtitle}>{block.subtitle}</Text>}
              </View>
              <TouchableOpacity onPress={onClose} style={bd.closeBtn}>
                <Ionicons name="close" size={16} color={T.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={bd.detailsGrid}>
              <View style={bd.detailItem}>
                <Ionicons name="time-outline" size={16} color={T.accentBlue} />
                <View>
                  <Text style={bd.detailLabel}>Time</Text>
                  <Text style={bd.detailValue}>{formatHour(block.startHour)} — {formatHour(block.endHour)}</Text>
                </View>
              </View>
              <View style={bd.detailItem}>
                <Ionicons name="calendar-outline" size={16} color={T.accentPurple} />
                <View>
                  <Text style={bd.detailLabel}>Day</Text>
                  <Text style={bd.detailValue}>{DAY_FULL[block.day]}</Text>
                </View>
              </View>
              {block.location && (
                <View style={bd.detailItem}>
                  <Ionicons name="location-outline" size={16} color={T.accentPink} />
                  <View>
                    <Text style={bd.detailLabel}>Location</Text>
                    <Text style={bd.detailValue}>{block.location}</Text>
                  </View>
                </View>
              )}
              {block.professor && (
                <View style={bd.detailItem}>
                  <Ionicons name="person-outline" size={16} color="#3DAB73" />
                  <View>
                    <Text style={bd.detailLabel}>Professor</Text>
                    <Text style={bd.detailValue}>{block.professor}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={bd.actionsRow}>
              <TouchableOpacity style={bd.actionCard} activeOpacity={0.8}>
                <Ionicons name="create-outline" size={18} color={T.accentBlue} />
                <Text style={bd.actionLabel}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={bd.actionCard} activeOpacity={0.8}>
                <Ionicons name="notifications-outline" size={18} color={T.accentPurple} />
                <Text style={bd.actionLabel}>Remind</Text>
              </TouchableOpacity>
              <TouchableOpacity style={bd.actionCard} activeOpacity={0.8}>
                <Ionicons name="people-outline" size={18} color="#3DAB73" />
                <Text style={bd.actionLabel}>Friends</Text>
              </TouchableOpacity>
              <TouchableOpacity style={bd.actionCard} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={18} color="#E05555" />
                <Text style={[bd.actionLabel, { color: '#E05555' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const bd = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,17,17,0.25)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    backgroundColor: '#FAFBFF', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    borderBottomWidth: 0,
  },
  accent: { height: 4 },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginTop: 10,
  },
  content: { padding: 22, gap: 20, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  typeIcon: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: T.textPrimary },
  subtitle: { fontSize: 13, color: T.textMuted, marginTop: 2 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(17,17,17,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  detailsGrid: { gap: 14 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailLabel: { fontSize: 11, fontWeight: '600', color: T.textMuted },
  detailValue: { fontSize: 13, fontWeight: '700', color: T.textPrimary },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionCard: {
    flex: 1, alignItems: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
  actionLabel: { fontSize: 11, fontWeight: '700', color: T.textSecondary },
});

// ─── Add Event bottom sheet ──────────────────────────────────────────────────
function AddEventSheet({
  visible, onClose, prefillDay,
}: {
  visible: boolean;
  onClose: () => void;
  prefillDay: number;
}) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<'class' | 'event' | 'personal'>('class');
  const [selectedDay, setSelectedDay] = useState(prefillDay);
  const [startTime, setStartTime] = useState('9:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [isRecurring, setIsRecurring] = useState(false);

  const types = [
    { key: 'class' as const, label: 'Class', icon: 'school-outline', color: T.accentBlue },
    { key: 'event' as const, label: 'Event', icon: 'calendar-outline', color: T.accentPurple },
    { key: 'personal' as const, label: 'Personal', icon: 'person-outline', color: '#3DAB73' },
  ];

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={ae.backdrop} onPress={onClose} />
      <View style={ae.sheetWrap} pointerEvents="box-none">
        <View style={ae.sheet}>
          <View style={ae.handle} />

          <View style={ae.headerRow}>
            <Text style={ae.title}>Add Event</Text>
            <TouchableOpacity onPress={onClose} style={ae.closeBtn}>
              <Ionicons name="close" size={16} color={T.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ae.form}>
            {/* Event type selector */}
            <View style={ae.typeRow}>
              {types.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setEventType(t.key)}
                  activeOpacity={0.75}
                  style={[ae.typeBtn, eventType === t.key && { backgroundColor: t.color + '12', borderColor: t.color + '30' }]}
                >
                  <Ionicons name={t.icon as any} size={16} color={eventType === t.key ? t.color : T.textMuted} />
                  <Text style={[ae.typeText, eventType === t.key && { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title input */}
            <View style={ae.inputGroup}>
              <Text style={ae.label}>Title</Text>
              <View style={ae.inputWrap}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={eventType === 'class' ? 'e.g. CSC263' : 'Event name'}
                  placeholderTextColor={T.textMuted}
                  style={ae.input}
                />
              </View>
            </View>

            {/* Location input */}
            <View style={ae.inputGroup}>
              <Text style={ae.label}>Location</Text>
              <View style={ae.inputWrap}>
                <Ionicons name="location-outline" size={16} color={T.textMuted} />
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. BA1190"
                  placeholderTextColor={T.textMuted}
                  style={ae.input}
                />
              </View>
            </View>

            {/* Day picker */}
            <View style={ae.inputGroup}>
              <Text style={ae.label}>Day</Text>
              <View style={ae.dayRow}>
                {DAYS.map((d, i) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setSelectedDay(i)}
                    activeOpacity={0.75}
                    style={[ae.dayChip, selectedDay === i && ae.dayChipActive]}
                  >
                    <Text style={[ae.dayChipText, selectedDay === i && ae.dayChipTextActive]}>
                      {d[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time pickers */}
            <View style={ae.timeRow}>
              <View style={[ae.inputGroup, { flex: 1 }]}>
                <Text style={ae.label}>Start</Text>
                <TouchableOpacity activeOpacity={0.8} style={ae.timePicker}>
                  <Ionicons name="time-outline" size={15} color={T.accentBlue} />
                  <Text style={ae.timeText}>{startTime}</Text>
                </TouchableOpacity>
              </View>
              <View style={ae.timeDash}>
                <Text style={{ color: T.textMuted }}>—</Text>
              </View>
              <View style={[ae.inputGroup, { flex: 1 }]}>
                <Text style={ae.label}>End</Text>
                <TouchableOpacity activeOpacity={0.8} style={ae.timePicker}>
                  <Ionicons name="time-outline" size={15} color={T.accentPurple} />
                  <Text style={ae.timeText}>{endTime}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recurring toggle */}
            <TouchableOpacity
              onPress={() => setIsRecurring(!isRecurring)}
              activeOpacity={0.8}
              style={ae.recurringRow}
            >
              <Ionicons name="repeat-outline" size={18} color={isRecurring ? T.accentBlue : T.textMuted} />
              <Text style={[ae.recurringText, isRecurring && { color: T.accentBlue }]}>Repeat weekly</Text>
              <View style={[ae.toggle, isRecurring && ae.toggleActive]}>
                <View style={[ae.toggleDot, isRecurring && ae.toggleDotActive]} />
              </View>
            </TouchableOpacity>

            {/* Save button */}
            <TouchableOpacity activeOpacity={0.85} onPress={onClose}>
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ae.saveBtn}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={ae.saveText}>Add to Timetable</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const ae = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,17,17,0.25)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    backgroundColor: '#FAFBFF', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 14, paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '800', color: T.textPrimary },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(17,17,17,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  form: { padding: 22, paddingTop: 8, gap: 16, paddingBottom: 40 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(17,17,17,0.03)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
  typeText: { fontSize: 12, fontWeight: '700', color: T.textMuted },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: T.textSecondary, paddingLeft: 2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 46, borderRadius: 14, paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: T.textPrimary },
  dayRow: { flexDirection: 'row', gap: 6 },
  dayChip: {
    flex: 1, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(17,17,17,0.03)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
  dayChipActive: {
    backgroundColor: T.accentBlue, borderColor: T.accentBlue,
  },
  dayChipText: { fontSize: 13, fontWeight: '700', color: T.textMuted },
  dayChipTextActive: { color: '#fff' },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 0 },
  timeDash: { paddingBottom: 14, paddingHorizontal: 8 },
  timePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 46, borderRadius: 14, paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
  timeText: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  recurringRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
  },
  recurringText: { flex: 1, fontSize: 13, fontWeight: '600', color: T.textMuted },
  toggle: {
    width: 42, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(17,17,17,0.08)',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: T.accentBlue },
  toggleDot: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2,
  },
  toggleDotActive: { alignSelf: 'flex-end' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 16, marginTop: 4,
  },
  saveText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

// ─── Import bottom sheet ─────────────────────────────────────────────────────
function ImportSheet({
  visible, onClose, onStartImport,
}: {
  visible: boolean;
  onClose: () => void;
  onStartImport: () => void;
}) {
  const options = [
    { icon: 'camera-outline', label: 'Take Photo', desc: 'Snap your timetable', color: T.accentBlue },
    { icon: 'image-outline', label: 'Upload Image', desc: 'From camera roll', color: T.accentPurple },
    { icon: 'document-outline', label: 'Upload PDF', desc: 'From files', color: T.accentPink },
    { icon: 'globe-outline', label: 'School Portal', desc: 'Coming soon', color: T.textMuted },
  ];

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={im.backdrop} onPress={onClose} />
      <View style={im.sheetWrap} pointerEvents="box-none">
        <View style={im.sheet}>
          <View style={im.handle} />
          <Text style={im.title}>Import Timetable</Text>
          <Text style={im.desc}>AI will scan and detect your courses automatically</Text>

          <View style={im.optionsGrid}>
            {options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={opt.color === T.textMuted ? 1 : 0.8}
                style={[im.optionCard, opt.color === T.textMuted && im.optionDisabled]}
                onPress={() => {
                  if (opt.color !== T.textMuted) {
                    onClose();
                    onStartImport();
                  }
                }}
              >
                <View style={[im.optionIcon, { backgroundColor: opt.color + '12' }]}>
                  <Ionicons name={opt.icon as any} size={22} color={opt.color} />
                </View>
                <Text style={im.optionLabel}>{opt.label}</Text>
                <Text style={im.optionDesc}>{opt.desc}</Text>
                {opt.color === T.textMuted && (
                  <View style={im.comingSoon}>
                    <Text style={im.comingSoonText}>Soon</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const im = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,17,17,0.25)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    backgroundColor: '#FAFBFF', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    borderBottomWidth: 0,
    padding: 22, paddingBottom: 40,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: T.textPrimary, textAlign: 'center' },
  desc: { fontSize: 13, color: T.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optionCard: {
    width: '47%', flexGrow: 1,
    borderRadius: 20, padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.06)',
    alignItems: 'center', gap: 8,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 8,
  },
  optionDisabled: { opacity: 0.5 },
  optionIcon: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLabel: { fontSize: 13, fontWeight: '700', color: T.textPrimary },
  optionDesc: { fontSize: 11, color: T.textMuted },
  comingSoon: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(17,17,17,0.06)',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99,
  },
  comingSoonText: { fontSize: 9, fontWeight: '700', color: T.textMuted },
});

// ─── AI Processing screen ────────────────────────────────────────────────────
function AIProcessingView({ progress, detectedItems }: { progress: number; detectedItems: DetectedCourse[] }) {
  return (
    <View style={ap.wrap}>
      <View style={ap.previewCard}>
        <View style={ap.skeleton}>
          <View style={ap.skeletonRow} />
          <View style={[ap.skeletonRow, { width: '70%' }]} />
          <View style={[ap.skeletonRow, { width: '55%' }]} />
          <View style={ap.skeletonGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={[ap.skeletonBlock, { opacity: i <= Math.floor(progress / 16) ? 1 : 0.3 }]}>
                <LinearGradient
                  colors={[COURSE_COLORS[(i - 1) % COURSE_COLORS.length].border + '20', COURSE_COLORS[(i - 1) % COURSE_COLORS.length].border + '08']}
                  style={ap.skeletonBlockFill}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={ap.scanWrap}>
        <View style={ap.scanIcon}>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ap.scanIconGrad}>
            <Ionicons name="sparkles" size={24} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={ap.scanTitle}>AI is scanning your timetable...</Text>
        <Text style={ap.scanSubtitle}>Detecting courses, times, and locations</Text>

        <View style={ap.progressTrack}>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[ap.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={ap.progressText}>{progress}% complete</Text>
      </View>

      <View style={ap.detectedList}>
        {detectedItems.slice(0, Math.floor(progress / 20)).map((item: DetectedCourse) => (
          <View key={item.id} style={ap.detectedItem}>
            <Ionicons name="checkmark-circle" size={16} color="#3DAB73" />
            <Text style={ap.detectedText}>{item.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const ap = StyleSheet.create({
  wrap: { flex: 1, padding: 22, gap: 24, alignItems: 'center', justifyContent: 'center' },
  previewCard: {
    width: '100%', borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    padding: 16, minHeight: 180,
  },
  skeleton: { gap: 10 },
  skeletonRow: { height: 10, borderRadius: 5, backgroundColor: 'rgba(17,17,17,0.06)', width: '85%' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  skeletonBlock: { width: '30%', flexGrow: 1, height: 40, borderRadius: 10, overflow: 'hidden' },
  skeletonBlockFill: { flex: 1, borderRadius: 10 },
  scanWrap: { alignItems: 'center', gap: 8 },
  scanIcon: { shadowColor: T.accentBlue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16 },
  scanIconGrad: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scanTitle: { fontSize: 16, fontWeight: '800', color: T.textPrimary },
  scanSubtitle: { fontSize: 13, color: T.textMuted },
  progressTrack: { width: '80%', height: 6, borderRadius: 3, backgroundColor: 'rgba(17,17,17,0.06)', overflow: 'hidden', marginTop: 8 },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '700', color: T.accentBlue },
  detectedList: { width: '100%', gap: 8 },
  detectedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(61,171,115,0.15)',
  },
  detectedText: { fontSize: 13, fontWeight: '600', color: T.textPrimary },
});

// ─── AI Review screen ────────────────────────────────────────────────────────
function AIReviewView({
  detected, onConfirmAll, onBack,
}: {
  detected: DetectedCourse[];
  onConfirmAll: () => void;
  onBack: () => void;
}) {
  const [items, setItems] = useState(detected);

  const toggleConfirm = (id: string) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, confirmed: !it.confirmed } : it));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  return (
    <View style={rv.wrap}>
      <View style={rv.headerRow}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={rv.backBtn}>
          <Ionicons name="chevron-back" size={18} color={T.textSecondary} />
        </TouchableOpacity>
        <Text style={rv.title}>Review Detected Courses</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rv.list}>
        {items.map((item, idx) => {
          const color = COURSE_COLORS[idx % COURSE_COLORS.length];
          return (
            <View key={item.id} style={[rv.card, item.confirmed && { borderColor: '#3DAB73' + '40' }]}>
              <View style={rv.cardTop}>
                <View style={[rv.colorDot, { backgroundColor: color.border }]} />
                <Text style={rv.courseName} numberOfLines={1}>{item.name}</Text>
                <View style={rv.confidenceBadge}>
                  <Text style={rv.confidenceText}>{item.confidence}%</Text>
                </View>
              </View>

              <View style={rv.detailsRow}>
                <View style={rv.detail}>
                  <Ionicons name="calendar-outline" size={13} color={T.textMuted} />
                  <Text style={rv.detailText}>{item.day}</Text>
                </View>
                <View style={rv.detail}>
                  <Ionicons name="time-outline" size={13} color={T.textMuted} />
                  <Text style={rv.detailText}>{item.time}</Text>
                </View>
                <View style={rv.detail}>
                  <Ionicons name="location-outline" size={13} color={T.textMuted} />
                  <Text style={rv.detailText}>{item.location}</Text>
                </View>
              </View>

              <View style={rv.cardActions}>
                <TouchableOpacity onPress={() => toggleConfirm(item.id)} activeOpacity={0.8} style={[rv.confirmBtn, item.confirmed && rv.confirmedBtn]}>
                  <Ionicons name={item.confirmed ? 'checkmark-circle' : 'checkmark-circle-outline'} size={16} color={item.confirmed ? '#fff' : '#3DAB73'} />
                  <Text style={[rv.confirmText, item.confirmed && rv.confirmedText]}>{item.confirmed ? 'Confirmed' : 'Confirm'}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} style={rv.editBtn}>
                  <Ionicons name="create-outline" size={14} color={T.accentBlue} />
                  <Text style={rv.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(item.id)} activeOpacity={0.8} style={rv.deleteBtn}>
                  <Ionicons name="trash-outline" size={14} color="#E05555" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <TouchableOpacity activeOpacity={0.8} style={rv.addBtn}>
          <Ionicons name="add-circle-outline" size={18} color={T.accentBlue} />
          <Text style={rv.addText}>Add Missing Class</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={rv.ctaWrap}>
        <TouchableOpacity activeOpacity={0.8} style={rv.resolveBtn}>
          <Ionicons name="flash-outline" size={16} color={T.accentPurple} />
          <Text style={rv.resolveText}>Auto Resolve Conflicts</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} onPress={() => { setItems((prev) => prev.map((it) => ({ ...it, confirmed: true }))); setTimeout(onConfirmAll, 300); }}>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={rv.ctaBtn}>
            <Text style={rv.ctaText}>Add to My Timetable</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const rv = StyleSheet.create({
  wrap: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.62)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' },
  title: { fontSize: 16, fontWeight: '800', color: T.textPrimary },
  list: { padding: 22, paddingTop: 0, gap: 12, paddingBottom: 120 },
  card: { borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)', padding: 16, gap: 12, shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  courseName: { flex: 1, fontSize: 14, fontWeight: '700', color: T.textPrimary },
  confidenceBadge: { backgroundColor: 'rgba(61,171,115,0.10)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  confidenceText: { fontSize: 10, fontWeight: '700', color: '#3DAB73' },
  detailsRow: { gap: 6 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 12, color: T.textSecondary },
  cardActions: { flexDirection: 'row', gap: 8 },
  confirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(61,171,115,0.08)', borderWidth: 1, borderColor: 'rgba(61,171,115,0.2)' },
  confirmedBtn: { backgroundColor: '#3DAB73', borderColor: '#3DAB73' },
  confirmText: { fontSize: 12, fontWeight: '700', color: '#3DAB73' },
  confirmedText: { color: '#fff' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(75,80,248,0.06)', borderWidth: 1, borderColor: 'rgba(75,80,248,0.15)' },
  editText: { fontSize: 12, fontWeight: '700', color: T.accentBlue },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(224,85,85,0.06)', borderWidth: 1, borderColor: 'rgba(224,85,85,0.15)' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(75,80,248,0.2)', borderStyle: 'dashed' },
  addText: { fontSize: 13, fontWeight: '700', color: T.accentBlue },
  ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22, paddingBottom: 40, gap: 10, backgroundColor: 'rgba(250,251,255,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(17,17,17,0.06)' },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(139,77,255,0.06)', borderWidth: 1, borderColor: 'rgba(139,77,255,0.15)' },
  resolveText: { fontSize: 13, fontWeight: '700', color: T.accentPurple },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 16 },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

// ─── Export bottom sheet ─────────────────────────────────────────────────────
function ExportSheet({
  visible, onClose, onWallpaper,
}: {
  visible: boolean;
  onClose: () => void;
  onWallpaper: () => void;
}) {
  const options = [
    { icon: 'image-outline', label: 'Save as Image', desc: 'High-res PNG', color: T.accentBlue },
    { icon: 'phone-portrait-outline', label: 'Wallpaper', desc: 'Lock screen ready', color: T.accentPurple },
    { icon: 'people-outline', label: 'Share with Friends', desc: 'Show free times', color: '#3DAB73' },
    { icon: 'share-social-outline', label: 'Share to Apps', desc: 'Instagram, etc.', color: T.accentPink },
  ];

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={ex.backdrop} onPress={onClose} />
      <View style={ex.sheetWrap} pointerEvents="box-none">
        <View style={ex.sheet}>
          <View style={ex.handle} />
          <Text style={ex.title}>Export Timetable</Text>
          <View style={ex.optionsList}>
            {options.map((opt, i) => (
              <TouchableOpacity key={i} activeOpacity={0.8} style={ex.optionRow} onPress={() => { if (opt.label === 'Wallpaper') { onClose(); onWallpaper(); } }}>
                <View style={[ex.optionIcon, { backgroundColor: opt.color + '12' }]}>
                  <Ionicons name={opt.icon as any} size={20} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ex.optionLabel}>{opt.label}</Text>
                  <Text style={ex.optionDesc}>{opt.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={T.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ex = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,17,17,0.25)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#FAFBFF', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', borderBottomWidth: 0, padding: 22, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', color: T.textPrimary, textAlign: 'center', marginBottom: 16 },
  optionsList: { gap: 4 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(17,17,17,0.04)' },
  optionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  optionDesc: { fontSize: 12, color: T.textMuted, marginTop: 1 },
});

// ─── Wallpaper preview (Everytime-style grid) ────────────────────────────────
const WP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WP_HOURS_START = 9;
const WP_HOURS_END = 18;
const WP_HOUR_H = 44;
const WP_TIME_W = 36;

function WallpaperPreview({
  schedule, onClose,
}: {
  schedule: ScheduleBlock[];
  onClose: () => void;
}) {
  const [layout, setLayout] = useState<'compact' | 'aesthetic' | 'contrast'>('compact');
  const layouts = ['compact', 'aesthetic', 'contrast'] as const;

  const bgColors: Record<string, [string, string, string]> = {
    compact: ['#1A1A2E', '#16213E', '#0F3460'],
    aesthetic: ['#F4CBD9', '#E9E1F6', '#D7E6FF'],
    contrast: ['#FFFFFF', '#F5F5F5', '#EBEBEB'],
  };

  const isDark = layout === 'compact';
  const textColor = isDark ? '#fff' : T.textPrimary;
  const mutedColor = isDark ? 'rgba(255,255,255,0.4)' : T.textMuted;
  const gridLineColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,17,0.06)';
  const dayHeaderBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,17,0.03)';

  const wpColW = (SCREEN_W - 44 - 40 - WP_TIME_W) / 5; // margins + time col

  // Filter to class blocks on weekdays
  const classBlocks = schedule.filter(b => b.day >= 1 && b.day <= 5);

  return (
    <View style={wp.wrap}>
      <LinearGradient colors={bgColors[layout]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={wp.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[wp.headerBtn, isDark && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="chevron-back" size={18} color={textColor} />
          </TouchableOpacity>
          <Text style={[wp.headerTitle, { color: textColor }]}>Wallpaper Preview</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Phone frame */}
        <View style={[wp.phoneFrame, isDark && { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.15)' }]}>
          {/* Lock screen clock */}
          <View style={wp.clockArea}>
            <Text style={[wp.clockTime, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,17,0.25)' }]}>9:41</Text>
            <Text style={[wp.clockDate, { color: mutedColor }]}>Monday, March 15</Text>
          </View>

          {/* Timetable grid */}
          <ScrollView showsVerticalScrollIndicator={false} style={wp.gridScroll}>
            {/* Day headers */}
            <View style={wp.dayHeaderRow}>
              <View style={{ width: WP_TIME_W }} />
              {WP_DAYS.map((d) => (
                <View key={d} style={[wp.dayHeaderCell, { width: wpColW, backgroundColor: dayHeaderBg }]}>
                  <Text style={[wp.dayHeaderText, { color: mutedColor }]}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Grid body */}
            <View style={{ height: (WP_HOURS_END - WP_HOURS_START) * WP_HOUR_H }}>
              <View style={{ flexDirection: 'row' }}>
                {/* Time labels */}
                <View style={{ width: WP_TIME_W }}>
                  {Array.from({ length: WP_HOURS_END - WP_HOURS_START }, (_, i) => (
                    <View key={i} style={{ height: WP_HOUR_H, justifyContent: 'flex-start' }}>
                      <Text style={[wp.gridTimeText, { color: mutedColor }]}>{WP_HOURS_START + i}</Text>
                    </View>
                  ))}
                </View>

                {/* Day columns with blocks */}
                {WP_DAYS.map((d, di) => {
                  const dayIdx = di + 1;
                  const dayBlocks = classBlocks.filter(b => b.day === dayIdx);
                  return (
                    <View key={d} style={[wp.gridDayCol, { width: wpColW }]}>
                      {/* Grid lines */}
                      {Array.from({ length: WP_HOURS_END - WP_HOURS_START }, (_, i) => (
                        <View key={i} style={[wp.gridHourLine, { top: i * WP_HOUR_H, backgroundColor: gridLineColor }]} />
                      ))}
                      {/* Course blocks */}
                      {dayBlocks.map((block) => {
                        const color = COURSE_COLORS[block.colorIndex % COURSE_COLORS.length];
                        const top = (block.startHour - WP_HOURS_START) * WP_HOUR_H;
                        const height = (block.endHour - block.startHour) * WP_HOUR_H - 1;
                        const blockBg = isDark ? color.border + '90' : color.border;
                        return (
                          <View key={block.id} style={[wp.gridBlock, { top, height, backgroundColor: blockBg }]}>
                            <Text style={wp.gridBlockTitle} numberOfLines={1}>{block.title}</Text>
                            {height > 30 && block.location && (
                              <Text style={wp.gridBlockLocation} numberOfLines={1}>{block.location}</Text>
                            )}
                            {height > 48 && (
                              <Text style={wp.gridBlockTime} numberOfLines={1}>
                                {formatHour(block.startHour).replace(' AM', '').replace(' PM', '')}–{formatHour(block.endHour).replace(' AM', '').replace(' PM', '')}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Controls */}
        <View style={wp.controls}>
          <View style={[wp.layoutRow, isDark && { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            {layouts.map((l) => (
              <TouchableOpacity key={l} onPress={() => setLayout(l)} activeOpacity={0.75} style={[wp.layoutBtn, layout === l && wp.layoutBtnActive, layout === l && isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Text style={[wp.layoutText, { color: isDark ? 'rgba(255,255,255,0.5)' : T.textMuted }, layout === l && wp.layoutTextActive, layout === l && isDark && { color: '#fff' }]}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.85}>
            <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={wp.saveBtn}>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={wp.saveText}>Save to Photos</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const wp = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 8,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  phoneFrame: {
    flex: 1, marginHorizontal: 20, marginBottom: 8,
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.08)',
  },
  clockArea: { alignItems: 'center', paddingTop: 16, paddingBottom: 10 },
  clockTime: { fontSize: 36, fontWeight: '200', letterSpacing: 2 },
  clockDate: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  gridScroll: { flex: 1, paddingHorizontal: 6 },
  dayHeaderRow: { flexDirection: 'row', marginBottom: 2 },
  dayHeaderCell: {
    alignItems: 'center', paddingVertical: 5,
    borderRadius: 6, marginHorizontal: 1,
  },
  dayHeaderText: { fontSize: 10, fontWeight: '700' },
  gridTimeText: { fontSize: 8, fontWeight: '600', textAlign: 'right', paddingRight: 4, marginTop: -4 },
  gridDayCol: {
    position: 'relative', marginHorizontal: 1,
  },
  gridHourLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
  },
  gridBlock: {
    position: 'absolute', left: 1, right: 1,
    borderRadius: 6, paddingHorizontal: 4, paddingVertical: 3,
    overflow: 'hidden',
  },
  gridBlockTitle: { fontSize: 9, fontWeight: '800', color: '#fff' },
  gridBlockLocation: { fontSize: 7, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  gridBlockTime: { fontSize: 7, fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  controls: { padding: 22, paddingBottom: 36, gap: 12 },
  layoutRow: {
    flexDirection: 'row', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 14, padding: 4,
  },
  layoutBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  layoutBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  layoutText: { fontSize: 13, fontWeight: '600' },
  layoutTextActive: { color: T.accentBlue, fontWeight: '700' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 16,
  },
  saveText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

// ─── Main Timetable screen ───────────────────────────────────────────────────
type ScreenMode = 'timetable' | 'ai-processing' | 'ai-review' | 'wallpaper';

export default function TimetableScreen() {
  const router = useRouter();
  const { data: schedule = [], isLoading, refetch } = useSchedule();
  const bulkImport = useBulkImportSchedule();

  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);
  const [blockDetailVisible, setBlockDetailVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [addEventVisible, setAddEventVisible] = useState(false);
  const [addEventDay, setAddEventDay] = useState(new Date().getDay());
  const [mode, setMode] = useState<ScreenMode>('timetable');
  const [aiProgress, setAiProgress] = useState(0);
  const [detectedItems, setDetectedItems] = useState<DetectedCourse[]>([]);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const weekLabel = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const handleBlockPress = (block: ScheduleBlock) => {
    setSelectedBlock(block);
    setBlockDetailVisible(true);
  };

  const handleEmptyPress = (day: number, _hour: number) => {
    setAddEventDay(day);
    setAddEventVisible(true);
  };

  const startAIImport = () => {
    setMode('ai-processing');
    setAiProgress(0);
    // TODO: Replace with real AI image recognition call.
    // For now simulate progress; detected items come from local state
    // (populated by real image recognition when integrated).
    setDetectedItems([]);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 15) + 5;
      if (p >= 100) { p = 100; clearInterval(interval); setTimeout(() => setMode('ai-review'), 600); }
      setAiProgress(p);
    }, 500);
  };

  const handleConfirmImport = () => {
    // Convert confirmed detected items into schedule blocks and bulk-import
    const confirmedItems = detectedItems.filter((d) => d.confirmed !== false);
    if (confirmedItems.length === 0) {
      setMode('timetable');
      return;
    }

    // Parse detected courses into ScheduleBlockItem format for the API
    const blocks: Omit<ScheduleBlockItem, 'id'>[] = confirmedItems.flatMap((item, idx) => {
      // Parse day string like "Mon, Wed" into day indices
      const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const dayNames = item.day.split(',').map((d) => d.trim());
      const dayIndices = dayNames.map((d) => {
        // Handle full or abbreviated day names
        const abbr = d.slice(0, 3);
        return dayMap[abbr] ?? 1;
      });

      // Parse time string like "9:00 – 10:30 AM" into startHour/endHour
      const timeMatch = item.time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?\s*[–—-]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
      let startHour = 9;
      let endHour = 10;
      if (timeMatch) {
        let sh = parseInt(timeMatch[1], 10);
        const sm = parseInt(timeMatch[2] || '0', 10);
        const sAmPm = (timeMatch[3] || timeMatch[6] || 'AM').toUpperCase();
        let eh = parseInt(timeMatch[4], 10);
        const em = parseInt(timeMatch[5] || '0', 10);
        const eAmPm = (timeMatch[6] || sAmPm).toUpperCase();

        if (sAmPm === 'PM' && sh < 12) sh += 12;
        if (sAmPm === 'AM' && sh === 12) sh = 0;
        if (eAmPm === 'PM' && eh < 12) eh += 12;
        if (eAmPm === 'AM' && eh === 12) eh = 0;

        startHour = sh + sm / 60;
        endHour = eh + em / 60;
      }

      // Parse title — split "CSC263 — Data Structures" into title / subtitle
      const nameParts = item.name.split(/\s*[—–-]\s*/);
      const title = nameParts[0] || item.name;
      const subtitle = nameParts[1] || undefined;

      return dayIndices.map((dayIdx) => ({
        title,
        subtitle,
        location: item.location || undefined,
        day: dayIdx,
        startHour,
        endHour,
        colorIndex: idx % COURSE_COLORS.length,
        type: 'class' as const,
      }));
    });

    bulkImport.mutate(blocks, {
      onSuccess: () => {
        refetch();
        setMode('timetable');
        setDetectedItems([]);
      },
      onError: () => {
        // Still go back to timetable on error — user can retry
        setMode('timetable');
      },
    });
  };

  if (mode === 'wallpaper') {
    return <WallpaperPreview schedule={schedule} onClose={() => setMode('timetable')} />;
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {mode === 'timetable' && (
          <>
            <Header onBack={() => router.back()} onImport={() => setImportVisible(true)} onExport={() => setExportVisible(true)} weekLabel={weekLabel} />

            <DaySelector selectedDay={selectedDay} onSelect={setSelectedDay} schedule={schedule} />

            <DayHeaders selectedDay={selectedDay} />

            {isLoading ? (
              <View style={s.loadingWrap}>
                <ActivityIndicator size="large" color={T.accentBlue} />
                <Text style={s.loadingText}>Loading schedule...</Text>
              </View>
            ) : (
              <WeeklyGrid schedule={schedule} onBlockPress={handleBlockPress} selectedDay={selectedDay} onEmptyPress={handleEmptyPress} />
            )}

            {/* Floating add button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={s.fab}
              onPress={() => { setAddEventDay(selectedDay); setAddEventVisible(true); }}
            >
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.fabGrad}>
                <Ionicons name="add" size={26} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {mode === 'ai-processing' && (
          <AIProcessingView progress={aiProgress} detectedItems={detectedItems} />
        )}

        {mode === 'ai-review' && (
          <AIReviewView detected={detectedItems} onConfirmAll={handleConfirmImport} onBack={() => setMode('timetable')} />
        )}
      </SafeAreaView>

      <BlockDetailSheet block={selectedBlock} visible={blockDetailVisible} onClose={() => setBlockDetailVisible(false)} />
      <ImportSheet visible={importVisible} onClose={() => setImportVisible(false)} onStartImport={startAIImport} />
      <ExportSheet visible={exportVisible} onClose={() => setExportVisible(false)} onWallpaper={() => setMode('wallpaper')} />
      <AddEventSheet visible={addEventVisible} onClose={() => setAddEventVisible(false)} prefillDay={addEventDay} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  loadingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: {
    fontSize: 14, fontWeight: '600', color: T.textMuted,
  },
  fab: {
    position: 'absolute', bottom: 24, right: 22,
    shadowColor: T.accentBlue, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  fabGrad: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
});
