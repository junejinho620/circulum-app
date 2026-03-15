import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Animated, PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// ─── Mock data ────────────────────────────────────────────────────────────────
type BrowseModule = {
  id: string;
  label: string;
  icon: string;
  color: string;
};

const BROWSE_MODULES: BrowseModule[] = [
  { id: 'timetable', label: 'Timetable Builder', icon: 'calendar-outline', color: '#4B50F8' },
  { id: 'catalog', label: 'Course Catalog', icon: 'library-outline', color: '#6B7CFF' },
  { id: 'professors', label: 'Professor Reviews', icon: 'school-outline', color: '#8B4DFF' },
  { id: 'map', label: 'Campus Map', icon: 'map-outline', color: '#3DAB73' },
  { id: 'study-buddy', label: 'Study Buddy Match', icon: 'people-outline', color: '#C47EFF' },
  { id: 'international', label: 'International Community', icon: 'globe-outline', color: '#4D97FF' },
  { id: 'polls', label: 'Polls', icon: 'stats-chart-outline', color: '#F1973B' },
  { id: 'confession', label: 'Confession Board', icon: 'chatbox-ellipses-outline', color: '#E655C5' },
  { id: 'ai-assistant', label: 'AI Academic Assistant', icon: 'sparkles-outline', color: '#7A64FF' },
];

const DEFAULT_PINNED_BROWSE_IDS = ['timetable', 'catalog', 'professors', 'map', 'ai-assistant'];
const BROWSE_PINNED_STORAGE_KEY = 'home_browse_pinned_v1';
const MAX_BROWSE_SLOTS = 5;

const BOARDS = [
  { id: '1', name: 'Free Board',   latest: 'Did anyone lose a red wallet near Sid Smith?',      unread: 3 },
  { id: '2', name: 'Classes',      latest: 'Does anyone have CHM242 notes from today?',          unread: 12 },
  { id: '3', name: 'Housing',      latest: 'Subletting my apartment near campus this summer',    unread: 0 },
  { id: '4', name: 'Events',       latest: 'Hart House mixer tonight — who\'s going?',           unread: 5 },
  { id: '5', name: 'Marketplace',  latest: 'Stewart Calculus 9th Ed — $40',                     unread: 0 },
  { id: '6', name: 'Social',       latest: 'Looking for people to play badminton this week',    unread: 1 },
];

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ onBell }: { onBell: () => void }) {
  return (
    <View style={hdr.row}>
      <View style={hdr.left}>
        <SplashEmblem />
        <View>
          <Text style={hdr.campus}>University of Toronto</Text>
          <Text style={hdr.subtitle}>St. George Campus</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onBell} activeOpacity={0.8} style={hdr.bellWrap}>
        <BlurView intensity={40} tint="light" style={hdr.bell}>
          <Ionicons name="notifications-outline" size={20} color={T.textSecondary} />
          <View style={hdr.badge} />
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

// Exact proportional scale of the splash EmblemMark (112→44px, ratio 0.393)
function SplashEmblem() {
  return (
    <View style={emb.shadow}>
      <BlurView intensity={70} tint="light" style={emb.glass}>
        <View style={emb.ringOuter} />
        <View style={emb.circleBlue} />
        <View style={emb.circlePurple} />
        <View style={emb.circlePink} />
        <View style={emb.dot} />
      </BlurView>
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
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 18,
  },
  left:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  campus:  { fontSize: 15, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  subtitle:{ fontSize: 11, color: T.textMuted, marginTop: 1 },
  bellWrap:{
    borderRadius: 13, overflow: 'hidden',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  bell: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  badge: {
    position: 'absolute', top: 9, right: 9,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#E655C5',
    borderWidth: 1.5, borderColor: '#fff',
  },
});

// ─── Hero card ────────────────────────────────────────────────────────────────
function HeroCard({ onPress }: { onPress: () => void }) {
  return (
    <View style={hero.shadow}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        <BlurView intensity={55} tint="light" style={hero.card}>
          <LinearGradient
            colors={['rgba(75,80,248,0.06)', 'rgba(139,77,255,0.03)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={hero.topRow}>
            <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={hero.dot} />
            <Text style={hero.live}>LIVE NOW</Text>
            <Text style={hero.timeText}>Updated just now</Text>
          </View>
          <Text style={hero.headline}>
            <Text style={hero.count}>24</Text>
            {' '}discussions trending on campus
          </Text>
          <View style={hero.metaRow}>
            <View style={hero.metaItem}>
              <Ionicons name="people-outline" size={13} color={T.accentPurple} />
              <Text style={hero.metaText}>
                <Text style={{ fontWeight: '700', color: T.textPrimary }}>512</Text> active now
              </Text>
            </View>
            <View style={hero.metaDot} />
            <View style={hero.metaItem}>
              <Ionicons name="chatbubble-outline" size={13} color={T.accentBlue} />
              <Text style={hero.metaText}>
                <Text style={{ fontWeight: '700', color: T.textPrimary }}>143</Text> new replies
              </Text>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const hero = StyleSheet.create({
  shadow: {
    marginHorizontal: 22, borderRadius: 24,
    shadowColor: '#8B4DFF', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13, shadowRadius: 26, elevation: 9,
  },
  card: {
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(139,77,255,0.16)',
    padding: 20, gap: 12,
  },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot:      { width: 8, height: 8, borderRadius: 4 },
  live:     { fontSize: 11, fontWeight: '800', color: T.accentPurple, letterSpacing: 0.5 },
  timeText: { fontSize: 11, color: T.textMuted, marginLeft: 'auto' as any },
  headline: { fontSize: 16, fontWeight: '700', color: T.textPrimary, lineHeight: 22 },
  count:    { color: T.accentBlue },
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: T.textSecondary },
  metaDot:  { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(17,17,17,0.15)' },
});

// ─── Shortcuts grid ───────────────────────────────────────────────────────────
function normalizePinnedBrowseIds(ids?: string[]) {
  const validUnique = (ids ?? []).filter((id, i, arr) => {
    const isValid = BROWSE_MODULES.some((m) => m.id === id);
    return isValid && arr.indexOf(id) === i;
  });
  return validUnique.slice(0, MAX_BROWSE_SLOTS);
}

function getBrowseModule(moduleId: string) {
  return BROWSE_MODULES.find((module) => module.id === moduleId) ?? BROWSE_MODULES[0];
}

function BrowseGrid({
  pinnedIds,
  onModulePress,
  onMorePress,
}: {
  pinnedIds: string[];
  onModulePress: (moduleId: string) => void;
  onMorePress: () => void;
}) {
  const pinnedModules = normalizePinnedBrowseIds(pinnedIds).map((id) => getBrowseModule(id));
  const cards = [...pinnedModules, ...Array.from({ length: MAX_BROWSE_SLOTS - pinnedModules.length }, () => null)];

  cards.push({ id: 'more', label: 'More', icon: 'ellipsis-horizontal-circle-outline', color: T.accentPurple } as BrowseModule);

  return (
    <View style={sc.grid}>
      {cards.map((s, index) => (
        <TouchableOpacity
          key={s?.id ?? `empty-${index}`}
          onPress={() => {
            if (!s) return;
            if (s.id === 'more') onMorePress();
            else onModulePress(s.id);
          }}
          activeOpacity={0.78}
          style={sc.itemWrap}
        >
          <View style={[sc.item, !s && sc.itemEmpty]}>
            {s ? (
              <>
                <View style={[sc.iconCircle, { backgroundColor: s.color + '14' }]}>
                  <Ionicons name={s.icon as any} size={20} color={s.color} />
                </View>
                <Text style={sc.label} numberOfLines={2}>{s.label}</Text>
              </>
            ) : (
              <>
                <View style={sc.emptyCircle}>
                  <Ionicons name="add" size={20} color={T.textMuted} />
                </View>
                <Text style={[sc.label, { color: T.textMuted }]} numberOfLines={2}>Empty</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const sc = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 22, gap: 10,
  },
  itemWrap: {
    width: '30%', flexGrow: 1,
    borderRadius: 18,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  item: {
    minHeight: 106,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  itemEmpty: {
    borderStyle: 'dashed',
    borderColor: 'rgba(139,77,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  iconCircle: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyCircle: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(17,17,17,0.05)',
  },
  label: {
    minHeight: 30,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: T.textSecondary,
    textAlign: 'center',
  },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 22, marginBottom: 12,
    }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.2 }}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: T.accentBlue }}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Board row ────────────────────────────────────────────────────────────────
function BoardRow({ board, onPress, last }: { board: typeof BOARDS[0]; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78}>
      <View style={[br.row, !last && br.border]}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={br.name}>{board.name}</Text>
          <Text style={br.latest} numberOfLines={1}>{board.latest}</Text>
        </View>
        <View style={br.right}>
          {board.unread > 0 && (
            <View style={br.badge}>
              <Text style={br.badgeText}>{board.unread > 9 ? '9+' : board.unread}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={14} color={T.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const br = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14, gap: 12,
  },
  border:    { borderBottomWidth: 1, borderBottomColor: 'rgba(17,17,17,0.05)' },
  name:      { fontSize: 13, fontWeight: '700', color: T.textPrimary },
  latest:    { fontSize: 12, color: T.textMuted, lineHeight: 17 },
  right:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge:     {
    backgroundColor: T.accentBlue, borderRadius: 99,
    minWidth: 18, height: 18, paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
});

function BoardsCard({ onBoardPress }: { onBoardPress: (id: string) => void }) {
  return (
    <View style={bc.shadow}>
      <View style={bc.card}>
        {BOARDS.map((b, i) => (
          <BoardRow
            key={b.id}
            board={b}
            onPress={() => onBoardPress(b.id)}
            last={i === BOARDS.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const bc = StyleSheet.create({
  shadow: {
    marginHorizontal: 22, borderRadius: 22,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 18, elevation: 5,
  },
  card: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [browseMenuVisible, setBrowseMenuVisible] = useState(false);
  const [pinnedBrowseIds, setPinnedBrowseIds] = useState<string[]>(DEFAULT_PINNED_BROWSE_IDS);
  const [previewLayouts, setPreviewLayouts] = useState<Array<{ x: number; y: number; width: number; height: number } | null>>(
    Array.from({ length: MAX_BROWSE_SLOTS }, () => null),
  );
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragPositions = React.useRef(Array.from({ length: MAX_BROWSE_SLOTS }, () => new Animated.ValueXY())).current;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BROWSE_PINNED_STORAGE_KEY);
        if (!raw || !active) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && active) {
          setPinnedBrowseIds(normalizePinnedBrowseIds(parsed));
        }
      } catch {
        // Fall back to defaults if saved data is malformed.
      }
    })();
    return () => { active = false; };
  }, []);

  const savePinnedBrowseIds = async (nextIds: string[]) => {
    const normalized = normalizePinnedBrowseIds(nextIds);
    setPinnedBrowseIds(normalized);
    try {
      await AsyncStorage.setItem(BROWSE_PINNED_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore write failures and keep in-memory state.
    }
  };

  const handleBrowseModulePress = (_moduleId: string) => {
    router.push('/(tabs)/communities');
  };

  const movePinnedSlot = (from: number, to: number) => {
    if (to < 0 || to >= pinnedBrowseIds.length) return;
    const next = [...pinnedBrowseIds];
    [next[from], next[to]] = [next[to], next[from]];
    savePinnedBrowseIds(next);
  };

  const addBrowseModule = (moduleId: string) => {
    if (pinnedBrowseIds.includes(moduleId)) return;
    if (pinnedBrowseIds.length >= MAX_BROWSE_SLOTS) return;
    savePinnedBrowseIds([...pinnedBrowseIds, moduleId]);
  };

  const removeBrowseModule = (moduleId: string) => {
    savePinnedBrowseIds(pinnedBrowseIds.filter((id) => id !== moduleId));
  };

  const previewCards = [...pinnedBrowseIds, ...Array.from({ length: MAX_BROWSE_SLOTS - pinnedBrowseIds.length }, () => null)];

  const updatePreviewLayout = (index: number, layout: { x: number; y: number; width: number; height: number }) => {
    setPreviewLayouts((current) => {
      const next = [...current];
      next[index] = layout;
      return next;
    });
  };

  const previewResponders = previewCards.map((moduleId, index) => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) =>
      !!moduleId && (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6),
    onMoveShouldSetPanResponderCapture: (_, gestureState) =>
      !!moduleId && (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6),
    onPanResponderGrant: () => {
      if (!moduleId) return;
      setDraggingIndex(index);
      dragPositions[index].setOffset({
        x: (dragPositions[index].x as any)._value ?? 0,
        y: (dragPositions[index].y as any)._value ?? 0,
      });
      dragPositions[index].setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: (_, gestureState) => {
      if (!moduleId) return;
      dragPositions[index].setValue({ x: gestureState.dx, y: gestureState.dy });
    },
    onPanResponderRelease: (_, gestureState) => {
      if (!moduleId) return;
      const startLayout = previewLayouts[index];
      let swapIndex = index;

      if (startLayout) {
        const dragCenterX = startLayout.x + (startLayout.width / 2) + gestureState.dx;
        const dragCenterY = startLayout.y + (startLayout.height / 2) + gestureState.dy;

        previewLayouts.forEach((layout, layoutIndex) => {
          if (!layout) return;
          const withinX = dragCenterX >= layout.x && dragCenterX <= layout.x + layout.width;
          const withinY = dragCenterY >= layout.y && dragCenterY <= layout.y + layout.height;
          if (withinX && withinY) swapIndex = layoutIndex;
        });
      }

      if (swapIndex !== index && swapIndex < pinnedBrowseIds.length) {
        movePinnedSlot(index, swapIndex);
      }

      dragPositions[index].flattenOffset();
      Animated.spring(dragPositions[index], {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
        bounciness: 6,
      }).start(() => setDraggingIndex(null));
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: () => {
      dragPositions[index].flattenOffset();
      Animated.spring(dragPositions[index], {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start(() => setDraggingIndex(null));
    },
  }));

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header onBell={() => router.push('/(tabs)/inbox')} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Live hero */}
          <HeroCard onPress={() => router.push('/(tabs)/communities')} />

          {/* Quick shortcuts */}
          <View style={s.section}>
            <SectionHeader title="Browse" />
            <BrowseGrid
              pinnedIds={pinnedBrowseIds}
              onModulePress={handleBrowseModulePress}
              onMorePress={() => setBrowseMenuVisible(true)}
            />
          </View>

          {/* Your Boards */}
          <View style={s.section}>
            <SectionHeader title="Your Boards" onSeeAll={() => router.push('/(tabs)/communities')} />
            <BoardsCard onBoardPress={(id) => router.push(`/board/${id}` as any)} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      <Modal
        transparent
        visible={browseMenuVisible}
        animationType="fade"
        onRequestClose={() => setBrowseMenuVisible(false)}
      >
        <Pressable style={bm.backdrop} onPress={() => setBrowseMenuVisible(false)} />
        <View style={bm.sheetWrap} pointerEvents="box-none">
          <BlurView intensity={60} tint="light" style={bm.sheet}>
            <View style={bm.headerRow}>
              <View style={bm.headerCopy}>
                <Text style={bm.title}>Customize Browse</Text>
                <Text style={bm.subtitle}>Drag cards in the home preview to reorder them. Add or remove modules directly.</Text>
              </View>
              <TouchableOpacity onPress={() => setBrowseMenuVisible(false)} style={bm.closeBtn} activeOpacity={0.8}>
                <Ionicons name="close" size={16} color={T.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={bm.caption}>Home Preview</Text>
            <View style={bm.previewGrid}>
              {previewCards.map((id, index) => {
                const module = id ? getBrowseModule(id) : null;
                return (
                  <Animated.View
                    key={id ?? `preview-empty-${index}`}
                    style={[
                      bm.previewCardWrap,
                      draggingIndex === index && bm.previewCardWrapActive,
                      { transform: dragPositions[index].getTranslateTransform(), zIndex: draggingIndex === index ? 10 : 1 },
                    ]}
                    onLayout={(event) => updatePreviewLayout(index, event.nativeEvent.layout)}
                    {...(module ? previewResponders[index].panHandlers : {})}
                  >
                    <View style={[bm.previewCard, !module && bm.previewCardEmpty]}>
                      <View style={bm.previewSlotBadge}>
                        <Text style={bm.previewSlotBadgeText}>{index + 1}</Text>
                      </View>
                      {module ? (
                        <>
                          <TouchableOpacity
                            activeOpacity={0.85}
                            style={bm.previewActionBtn}
                            onPress={() => removeBrowseModule(module.id)}
                          >
                            <Ionicons name="remove" size={14} color="#fff" />
                          </TouchableOpacity>
                          <View style={[bm.previewIcon, { backgroundColor: module.color + '14' }]}>
                            <Ionicons name={module.icon as any} size={18} color={module.color} />
                          </View>
                          <Text style={bm.previewLabel} numberOfLines={2}>{module.label}</Text>
                        </>
                      ) : (
                        <>
                          <View style={bm.previewEmptyIcon}>
                            <Ionicons name="add" size={18} color={T.textMuted} />
                          </View>
                          <Text style={bm.previewLabel} numberOfLines={2}>Empty Slot</Text>
                        </>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
              <View style={bm.previewCardWrap}>
                <View style={[bm.previewCard, bm.previewCardMore]}>
                  <View style={[bm.previewIcon, { backgroundColor: 'rgba(139,77,255,0.12)' }]}>
                    <Ionicons name="ellipsis-horizontal-circle-outline" size={18} color={T.accentPurple} />
                  </View>
                  <Text style={bm.previewLabel} numberOfLines={2}>More</Text>
                </View>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              scrollEnabled={draggingIndex === null}
              contentContainerStyle={bm.sheetScroll}
            >
              <Text style={bm.caption}>All Modules</Text>
              <View style={bm.moduleGrid}>
                {BROWSE_MODULES.filter((module) => !pinnedBrowseIds.includes(module.id)).map((module) => {
                  return (
                    <View
                      key={module.id}
                      style={bm.moduleCardWrap}
                    >
                      <View style={bm.moduleCard}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          style={[bm.moduleActionBtn, bm.moduleActionBtnAdd, pinnedBrowseIds.length >= MAX_BROWSE_SLOTS && bm.moduleActionBtnDisabled]}
                          disabled={pinnedBrowseIds.length >= MAX_BROWSE_SLOTS}
                          onPress={() => addBrowseModule(module.id)}
                        >
                          <Ionicons
                            name="add"
                            size={15}
                            color="#fff"
                          />
                        </TouchableOpacity>
                        <View style={[bm.moduleIcon, { backgroundColor: module.color + '12' }]}>
                          <Ionicons name={module.icon as any} size={16} color={module.color} />
                        </View>
                        <Text style={bm.moduleText} numberOfLines={2}>{module.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => {
                  savePinnedBrowseIds(DEFAULT_PINNED_BROWSE_IDS);
                }}
                style={bm.resetBtn}
              >
                <Ionicons name="refresh-outline" size={15} color={T.accentBlue} />
                <Text style={bm.resetBtnText}>Reset To Defaults</Text>
              </TouchableOpacity>
            </ScrollView>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Root styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  scroll:  { paddingTop: 4, paddingBottom: 32, gap: 28 },
  section: { gap: 0 },
});

const bm = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,17,17,0.30)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(250,246,252,0.96)',
    padding: 16,
    gap: 10,
    maxHeight: '82%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: { fontSize: 16, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.2 },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: T.textSecondary,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(139,77,255,0.20)',
  },
  caption: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6E7388',
    marginTop: 6,
  },
  sheetScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewCardWrap: {
    width: '31%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  previewCardWrapActive: {
    shadowColor: '#4B50F8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  previewCard: {
    minHeight: 108,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,77,255,0.10)',
    backgroundColor: '#FFFFFF',
  },
  previewCardEmpty: {
    borderStyle: 'dashed',
    backgroundColor: 'rgba(244,246,251,0.96)',
    borderColor: 'rgba(139,77,255,0.18)',
  },
  previewCardMore: {
    minHeight: 108,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(139,77,255,0.10)',
  },
  previewSlotBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,17,17,0.08)',
  },
  previewSlotBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#454B5C',
  },
  previewIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.04)',
  },
  previewEmptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(221,226,238,0.92)',
  },
  previewActionBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E655C5',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: '#A82A86',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  previewLabel: {
    minHeight: 30,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: '#313748',
    textAlign: 'center',
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moduleCardWrap: {
    width: '48%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  moduleCard: {
    minHeight: 112,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,77,255,0.10)',
    backgroundColor: '#FFFFFF',
  },
  moduleIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.04)',
  },
  moduleText: {
    minHeight: 30,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: '#313748',
    textAlign: 'center',
  },
  moduleActionBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.68)',
    shadowColor: '#4250D8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  moduleActionBtnAdd: {
    backgroundColor: '#4B50F8',
  },
  moduleActionBtnDisabled: {
    opacity: 0.4,
  },
  resetBtn: {
    height: 44,
    borderRadius: 14,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF1FF',
    borderWidth: 1,
    borderColor: 'rgba(75,80,248,0.22)',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: T.accentBlue,
  },
});
