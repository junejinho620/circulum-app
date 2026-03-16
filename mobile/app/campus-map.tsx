import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Pressable, Dimensions, Animated, PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  textPrimary:   '#111111',
  textSecondary: '#5F6472',
  textMuted:     '#8A90A2',
  accentBlue:    '#4B50F8',
  accentPurple:  '#8B4DFF',
  accentPink:    '#E655C5',
  accentGreen:   '#3DAB73',
  accentOrange:  '#F1973B',
  white:         '#FFFFFF',
};

const BG: [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];

// ─── Category definitions ─────────────────────────────────────────────────────
type CategoryId = 'lectures' | 'study' | 'food' | 'events' | 'quiet' | 'popular';

const CATEGORIES: { id: CategoryId; label: string; icon: string; color: string }[] = [
  { id: 'lectures', label: 'Lecture Halls', icon: 'school-outline', color: T.accentBlue },
  { id: 'study', label: 'Study Spots', icon: 'book-outline', color: T.accentPurple },
  { id: 'food', label: 'Food & Coffee', icon: 'cafe-outline', color: T.accentOrange },
  { id: 'events', label: 'Events', icon: 'calendar-outline', color: T.accentPink },
  { id: 'quiet', label: 'Quiet Zones', icon: 'leaf-outline', color: T.accentGreen },
  { id: 'popular', label: 'Popular', icon: 'flame-outline', color: '#E05555' },
];

// ─── Location data ────────────────────────────────────────────────────────────
type CampusLocation = {
  id: string;
  name: string;
  subtitle: string;
  category: CategoryId;
  floor?: string;
  building: string;
  studentsNow: number;
  bestTime: string;
  rating: number;
  coordinates: { x: number; y: number };
  saved?: boolean;
  tags?: string[];
};

const LOCATIONS: CampusLocation[] = [
  {
    id: '1', name: 'Bahen Centre', subtitle: 'CS & Engineering Hub',
    category: 'lectures', building: 'BA', floor: 'Floors 1-8',
    studentsNow: 342, bestTime: 'Before 10am', rating: 4.2,
    coordinates: { x: 0.45, y: 0.35 },
    tags: ['CS lectures', 'Labs', 'Study rooms'],
  },
  {
    id: '2', name: 'Robarts Library', subtitle: 'Main campus library',
    category: 'study', building: 'Robarts', floor: 'Floors 1-14',
    studentsNow: 891, bestTime: 'Weekday mornings', rating: 4.5,
    coordinates: { x: 0.32, y: 0.28 },
    tags: ['Silent zones', 'Group rooms', 'Cafeteria'],
  },
  {
    id: '3', name: 'Sid Smith Café', subtitle: 'Best espresso on campus',
    category: 'food', building: 'Sidney Smith Hall',
    studentsNow: 48, bestTime: '2-4pm (no lines)', rating: 4.7,
    coordinates: { x: 0.55, y: 0.42 },
    tags: ['Coffee', 'Pastries', 'Quick bites'],
  },
  {
    id: '4', name: 'Hart House', subtitle: 'Culture & community centre',
    category: 'popular', building: 'Hart House',
    studentsNow: 156, bestTime: 'Lunch hour', rating: 4.8,
    coordinates: { x: 0.38, y: 0.52 },
    tags: ['Events', 'Gallery', 'Gym', 'Dining'],
  },
  {
    id: '5', name: 'Convocation Hall', subtitle: 'Iconic lecture theatre',
    category: 'lectures', building: 'Con Hall', floor: 'Main floor',
    studentsNow: 720, bestTime: 'Outside class hours', rating: 4.0,
    coordinates: { x: 0.42, y: 0.58 },
    tags: ['Large lectures', 'Ceremonies'],
  },
  {
    id: '6', name: 'Gerstein Library', subtitle: 'Science & medicine library',
    category: 'quiet', building: 'Gerstein', floor: 'Floors 1-4',
    studentsNow: 234, bestTime: 'After 6pm', rating: 4.6,
    coordinates: { x: 0.58, y: 0.32 },
    tags: ['Silent study', 'Medical resources', 'Quiet'],
  },
  {
    id: '7', name: 'Med Sci Building', subtitle: 'Medical Sciences auditorium',
    category: 'lectures', building: 'MSB', floor: 'Floors 1-6',
    studentsNow: 189, bestTime: 'Midday gap', rating: 3.9,
    coordinates: { x: 0.62, y: 0.45 },
    tags: ['Bio lectures', 'Labs'],
  },
  {
    id: '8', name: "King's College Circle", subtitle: 'Iconic campus green',
    category: 'popular', building: 'Outdoor',
    studentsNow: 67, bestTime: 'Sunny afternoons', rating: 4.9,
    coordinates: { x: 0.40, y: 0.48 },
    tags: ['Photos', 'Relaxation', 'Events'],
  },
  {
    id: '9', name: 'Exam Centre', subtitle: 'Central exam facility',
    category: 'lectures', building: 'Exam Centre', floor: 'Main & Upper',
    studentsNow: 0, bestTime: 'Exam season', rating: 3.4,
    coordinates: { x: 0.25, y: 0.60 },
    tags: ['Exams', 'Large capacity'],
  },
  {
    id: '10', name: 'Earth Sciences Café', subtitle: 'Hidden gem for lunch',
    category: 'food', building: 'Earth Sciences Centre',
    studentsNow: 31, bestTime: '11am-1pm', rating: 4.4,
    coordinates: { x: 0.68, y: 0.38 },
    tags: ['Lunch specials', 'Quiet seating'],
  },
  {
    id: '11', name: 'Trinity College Quad', subtitle: 'Beautiful quiet study area',
    category: 'quiet', building: 'Trinity College',
    studentsNow: 14, bestTime: 'Anytime', rating: 4.8,
    coordinates: { x: 0.28, y: 0.42 },
    tags: ['Historic', 'Outdoor study', 'Peaceful'],
  },
  {
    id: '12', name: 'Graham Library', subtitle: 'Trinity College library',
    category: 'study', building: 'Trinity College', floor: 'Main floor',
    studentsNow: 42, bestTime: 'Mornings', rating: 4.7,
    coordinates: { x: 0.26, y: 0.44 },
    tags: ['Historic', 'Beautiful interior', 'Quiet'],
  },
];

// ─── Campus events ────────────────────────────────────────────────────────────
type CampusEvent = {
  id: string;
  title: string;
  locationId: string;
  startTime: string;
  startsIn: string;
  participants: number;
  category: string;
  color: string;
};

const EVENTS: CampusEvent[] = [
  {
    id: 'e1', title: 'CS Career Fair', locationId: '1',
    startTime: '2:00 PM', startsIn: '1h 23m', participants: 340,
    category: 'Career', color: T.accentBlue,
  },
  {
    id: 'e2', title: 'Jazz Night', locationId: '4',
    startTime: '7:00 PM', startsIn: '6h 23m', participants: 85,
    category: 'Social', color: T.accentPink,
  },
  {
    id: 'e3', title: 'Midterm Review — MAT237', locationId: '5',
    startTime: '4:30 PM', startsIn: '3h 53m', participants: 210,
    category: 'Academic', color: T.accentPurple,
  },
  {
    id: 'e4', title: 'Free Pizza Friday', locationId: '3',
    startTime: '12:00 PM', startsIn: '25m', participants: 128,
    category: 'Food', color: T.accentOrange,
  },
];

// ─── Saved places ─────────────────────────────────────────────────────────────
type SavedPlace = { id: string; locationId: string; type: 'favorite' | 'frequent' | 'recent' };

const SAVED_PLACES: SavedPlace[] = [
  { id: 's1', locationId: '2', type: 'favorite' },
  { id: 's2', locationId: '6', type: 'favorite' },
  { id: 's3', locationId: '1', type: 'frequent' },
  { id: 's4', locationId: '3', type: 'frequent' },
  { id: 's5', locationId: '5', type: 'recent' },
  { id: 's6', locationId: '4', type: 'recent' },
];

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_ICON: Record<CategoryId, { icon: string; color: string; bg: string }> = {
  lectures: { icon: 'school', color: T.accentBlue, bg: 'rgba(75,80,248,0.12)' },
  study:    { icon: 'book', color: T.accentPurple, bg: 'rgba(139,77,255,0.12)' },
  food:     { icon: 'cafe', color: T.accentOrange, bg: 'rgba(241,151,59,0.12)' },
  events:   { icon: 'calendar', color: T.accentPink, bg: 'rgba(230,85,197,0.12)' },
  quiet:    { icon: 'leaf', color: T.accentGreen, bg: 'rgba(61,171,115,0.12)' },
  popular:  { icon: 'flame', color: '#E05555', bg: 'rgba(224,85,85,0.12)' },
};

// ─── Map Grid (stylized campus representation) ───────────────────────────────
function MapCanvas({
  activeCategory,
  pins,
  onPinPress,
  selectedPin,
  events,
  onEventPress,
}: {
  activeCategory: CategoryId | null;
  pins: CampusLocation[];
  onPinPress: (loc: CampusLocation) => void;
  selectedPin: string | null;
  events: CampusEvent[];
  onEventPress: (e: CampusEvent) => void;
}) {
  // ── Zoom & pan state ──
  const scale = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Track cumulative values for gesture math
  const scaleOffset = useRef(1);
  const translateOffset = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);
  const isPinching = useRef(false);

  const MIN_SCALE = 0.8;
  const MAX_SCALE = 3.0;

  const getDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => {
        // Only capture if actually moving (avoids stealing taps from pins)
        return Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Snapshot current offsets
        translateOffset.current = {
          x: (translate.x as any)._value,
          y: (translate.y as any)._value,
        };
        isPinching.current = false;
        lastPinchDist.current = 0;
      },
      onPanResponderMove: (evt, g) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          // ── Pinch to zoom ──
          const dist = getDistance(touches);
          if (!isPinching.current) {
            isPinching.current = true;
            lastPinchDist.current = dist;
            scaleOffset.current = (scale as any)._value;
            return;
          }

          const ratio = dist / lastPinchDist.current;
          let newScale = scaleOffset.current * ratio;
          newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
          scale.setValue(newScale);
        } else if (!isPinching.current) {
          // ── Single finger pan ──
          translate.setValue({
            x: translateOffset.current.x + g.dx,
            y: translateOffset.current.y + g.dy,
          });
        }
      },
      onPanResponderRelease: () => {
        isPinching.current = false;
        lastPinchDist.current = 0;

        // Snap scale back if out of comfortable range
        const currentScale = (scale as any)._value;
        if (currentScale < 1) {
          Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
          Animated.spring(translate, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const resetView = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
      Animated.spring(translate, { toValue: { x: 0, y: 0 }, useNativeDriver: false }),
    ]).start();
    scaleOffset.current = 1;
    translateOffset.current = { x: 0, y: 0 };
  }, []);

  const zoomIn = useCallback(() => {
    const curr = (scale as any)._value;
    const next = Math.min(MAX_SCALE, curr + 0.5);
    scaleOffset.current = next;
    Animated.spring(scale, { toValue: next, useNativeDriver: false }).start();
  }, []);

  const zoomOut = useCallback(() => {
    const curr = (scale as any)._value;
    const next = Math.max(MIN_SCALE, curr - 0.5);
    scaleOffset.current = next;
    Animated.spring(scale, { toValue: next, useNativeDriver: false }).start();
    if (next <= 1) {
      Animated.spring(translate, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    }
  }, []);

  const MAP_H = SCREEN_H * 0.92;

  const filteredPins = activeCategory
    ? pins.filter((p) => p.category === activeCategory)
    : pins;

  return (
    <View style={mc.canvas}>
      <Animated.View
        style={[
          mc.mapContent,
          {
            transform: [
              { translateX: translate.x },
              { translateY: translate.y },
              { scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Background grid pattern */}
        <View style={mc.gridOverlay}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={`h${i}`} style={[mc.gridLineH, { top: (MAP_H / 12) * i }]} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={`v${i}`} style={[mc.gridLineV, { left: (SCREEN_W / 8) * i }]} />
          ))}
        </View>

        {/* Campus path curves */}
        <View style={[mc.path, { top: '40%', left: '10%', width: '80%', height: 2 }]} />
        <View style={[mc.path, { top: '20%', left: '30%', width: 2, height: '60%' }]} />
        <View style={[mc.path, { top: '55%', left: '15%', width: '70%', height: 2 }]} />
        <View style={[mc.path, { top: '30%', left: '50%', width: 2, height: '40%' }]} />
        <View style={[mc.pathCurve, { top: '25%', left: '20%' }]} />
        <View style={[mc.pathCurve, { top: '50%', left: '60%' }]} />

        {/* Campus green areas */}
        <View style={[mc.greenArea, { top: '43%', left: '33%', width: 80, height: 55 }]} />
        <View style={[mc.greenArea, { top: '36%', left: '22%', width: 40, height: 35, borderRadius: 20 }]} />
        <View style={[mc.greenArea, { top: '58%', left: '50%', width: 50, height: 30 }]} />

        {/* Building footprints */}
        <View style={[mc.building, { top: '30%', left: '40%', width: 50, height: 60 }]} />
        <View style={[mc.building, { top: '23%', left: '27%', width: 45, height: 45 }]} />
        <View style={[mc.building, { top: '37%', left: '50%', width: 55, height: 40 }]} />
        <View style={[mc.building, { top: '52%', left: '35%', width: 60, height: 35 }]} />
        <View style={[mc.building, { top: '25%', left: '55%', width: 48, height: 50 }]} />
        <View style={[mc.building, { top: '55%', left: '20%', width: 42, height: 45 }]} />
        <View style={[mc.building, { top: '18%', left: '42%', width: 35, height: 35, borderRadius: 18 }]} />
        <View style={[mc.building, { top: '45%', left: '62%', width: 50, height: 38 }]} />
        <View style={[mc.building, { top: '62%', left: '45%', width: 45, height: 30 }]} />

        {/* Location pins */}
        {filteredPins.map((loc) => {
          const cat = CATEGORY_ICON[loc.category];
          const isSelected = selectedPin === loc.id;
          return (
            <TouchableOpacity
              key={loc.id}
              activeOpacity={0.8}
              style={[
                mc.pin,
                {
                  top: `${loc.coordinates.y * 100}%`,
                  left: `${loc.coordinates.x * 100}%`,
                },
                isSelected && mc.pinSelected,
              ]}
              onPress={() => onPinPress(loc)}
            >
              <View style={[mc.pinBody, isSelected && mc.pinBodySelected, { backgroundColor: isSelected ? cat.color : cat.bg }]}>
                <Ionicons name={cat.icon as any} size={isSelected ? 16 : 14} color={isSelected ? T.white : cat.color} />
              </View>
              {isSelected && <View style={[mc.pinArrow, { borderTopColor: cat.color }]} />}
              {loc.studentsNow > 100 && !isSelected && (
                <View style={mc.hotBadge}>
                  <Text style={mc.hotBadgeText}>{loc.studentsNow}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* User location marker */}
        <View style={mc.userMarker}>
          <View style={mc.userMarkerPulse} />
          <View style={mc.userMarkerDot} />
        </View>

        {/* Event markers — inside transformable area so they move with the map */}
        {events.map((ev) => {
          const loc = pins.find((l) => l.id === ev.locationId);
          if (!loc) return null;
          return (
            <TouchableOpacity
              key={ev.id} activeOpacity={0.8}
              style={[mc.eventMarker, { top: `${loc.coordinates.y * 100 - 8}%`, left: `${loc.coordinates.x * 100 + 4}%` }]}
              onPress={() => onEventPress(ev)}
            >
              <View style={[mc.eventBadge, { backgroundColor: ev.color }]}>
                <Ionicons name="calendar" size={9} color={T.white} />
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Zoom controls — fixed outside the transformable area */}
      <View style={mc.zoomControls}>
        <TouchableOpacity activeOpacity={0.7} style={mc.zoomBtn} onPress={zoomIn}>
          <Ionicons name="add" size={20} color={T.textPrimary} />
        </TouchableOpacity>
        <View style={mc.zoomDivider} />
        <TouchableOpacity activeOpacity={0.7} style={mc.zoomBtn} onPress={zoomOut}>
          <Ionicons name="remove" size={20} color={T.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Re-center button */}
      <TouchableOpacity activeOpacity={0.7} style={mc.recenterBtn} onPress={resetView}>
        <Ionicons name="locate-outline" size={20} color={T.accentBlue} />
      </TouchableOpacity>

      {/* Compass — tap to reset view */}
      <TouchableOpacity activeOpacity={0.7} style={mc.compass} onPress={resetView}>
        <Ionicons name="compass-outline" size={22} color={T.textSecondary} />
        <Text style={mc.compassText}>N</Text>
      </TouchableOpacity>
    </View>
  );
}

const mc = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: '#EDF1F7', overflow: 'hidden' },
  mapContent: { ...StyleSheet.absoluteFillObject },
  gridOverlay: { ...StyleSheet.absoluteFillObject },
  gridLineH: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(160,175,200,0.12)',
  },
  gridLineV: {
    position: 'absolute', top: 0, bottom: 0, width: 1,
    backgroundColor: 'rgba(160,175,200,0.12)',
  },
  path: {
    position: 'absolute',
    backgroundColor: 'rgba(180,190,210,0.35)',
    borderRadius: 1,
  },
  pathCurve: {
    position: 'absolute', width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: 'rgba(180,190,210,0.25)',
    backgroundColor: 'transparent',
  },
  greenArea: {
    position: 'absolute', borderRadius: 12,
    backgroundColor: 'rgba(61,171,115,0.10)',
    borderWidth: 1, borderColor: 'rgba(61,171,115,0.12)',
  },
  building: {
    position: 'absolute', borderRadius: 6,
    backgroundColor: 'rgba(91,96,140,0.08)',
    borderWidth: 1, borderColor: 'rgba(91,96,140,0.10)',
  },
  pin: {
    position: 'absolute', alignItems: 'center',
    marginLeft: -18, marginTop: -36,
    zIndex: 5,
  },
  pinSelected: { zIndex: 20 },
  pinBody: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  pinBodySelected: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2.5,
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  pinArrow: {
    width: 0, height: 0, marginTop: -2,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  hotBadge: {
    position: 'absolute', top: -6, right: -10,
    backgroundColor: '#E05555', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1,
    borderWidth: 1.5, borderColor: T.white,
  },
  hotBadgeText: { fontSize: 8, fontWeight: '800', color: T.white },
  userMarker: {
    position: 'absolute', top: '46%', left: '43%',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 15,
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(75,80,248,0.15)',
  },
  userMarkerDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: T.accentBlue,
    borderWidth: 3, borderColor: T.white,
    shadowColor: T.accentBlue, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
  },
  compass: {
    position: 'absolute', bottom: 28, right: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  compassText: {
    position: 'absolute', top: 3,
    fontSize: 7, fontWeight: '800', color: '#E05555',
  },
  eventMarker: {
    position: 'absolute', zIndex: 12,
  },
  eventBadge: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: T.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 5, elevation: 3,
  },
  zoomControls: {
    position: 'absolute', bottom: 84, right: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  zoomBtn: {
    width: 44, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  zoomDivider: {
    height: 1, backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 10,
  },
  recenterBtn: {
    position: 'absolute', bottom: 180, right: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
});

// ─── Search Bar ───────────────────────────────────────────────────────────────
function FloatingSearch({
  query, setQuery, onFocus, suggestions, onSelect,
}: {
  query: string; setQuery: (v: string) => void; onFocus: () => void;
  suggestions: CampusLocation[]; onSelect: (loc: CampusLocation) => void;
}) {
  return (
    <View style={fs.wrap}>
      <View style={fs.bar}>
        <Ionicons name="search" size={18} color={T.textMuted} />
        <TextInput
          style={fs.input}
          placeholder="Search buildings, halls, food..."
          placeholderTextColor={T.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={onFocus}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={T.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {query.length > 0 && suggestions.length > 0 && (
        <View style={fs.dropdown}>
          {suggestions.slice(0, 5).map((loc) => {
            const cat = CATEGORY_ICON[loc.category];
            return (
              <TouchableOpacity
                key={loc.id} activeOpacity={0.7} style={fs.suggestion}
                onPress={() => onSelect(loc)}
              >
                <View style={[fs.suggIcon, { backgroundColor: cat.bg }]}>
                  <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={fs.suggName}>{loc.name}</Text>
                  <Text style={fs.suggCat}>{loc.building}</Text>
                </View>
                <View style={[fs.categoryTag, { backgroundColor: cat.bg }]}>
                  <Text style={[fs.categoryTagText, { color: cat.color }]}>
                    {CATEGORIES.find((c) => c.id === loc.category)?.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const fs = StyleSheet.create({
  wrap: { zIndex: 30 },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14, shadowRadius: 14, elevation: 6,
  },
  input: { flex: 1, fontSize: 14, fontWeight: '500', color: T.textPrimary, padding: 0 },
  dropdown: {
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
  },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  suggIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  suggName: { fontSize: 14, fontWeight: '600', color: T.textPrimary },
  suggCat: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  categoryTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  categoryTagText: { fontSize: 10, fontWeight: '700' },
});

// ─── Category chip styles ─────────────────────────────────────────────────────
const cc = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: T.textSecondary },
});

// ─── Location Detail Bottom Sheet ─────────────────────────────────────────────
function LocationSheet({
  location, onClose, onNavigate, onSave, onShare,
}: {
  location: CampusLocation | null;
  onClose: () => void;
  onNavigate: () => void;
  onSave: () => void;
  onShare: () => void;
}) {
  if (!location) return null;

  const cat = CATEGORY_ICON[location.category];
  const crowdLevel = location.studentsNow > 500 ? 'Very Busy' : location.studentsNow > 200 ? 'Busy' : location.studentsNow > 50 ? 'Moderate' : 'Quiet';
  const crowdColor = location.studentsNow > 500 ? '#E05555' : location.studentsNow > 200 ? T.accentOrange : location.studentsNow > 50 ? T.accentBlue : T.accentGreen;

  return (
    <View style={ls.sheet}>
      {/* Handle */}
      <View style={ls.handle} />

      {/* Header */}
      <View style={ls.header}>
        <View style={[ls.iconCircle, { backgroundColor: cat.bg }]}>
          <Ionicons name={cat.icon as any} size={20} color={cat.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ls.name}>{location.name}</Text>
          <Text style={ls.subtitle}>{location.building}{location.floor ? ` · ${location.floor}` : ''}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={ls.closeBtn}>
          <Ionicons name="close" size={18} color={T.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={ls.statsRow}>
        <View style={ls.statCard}>
          <View style={[ls.statDot, { backgroundColor: crowdColor }]} />
          <Text style={ls.statLabel}>Now</Text>
          <Text style={[ls.statValue, { color: crowdColor }]}>{crowdLevel}</Text>
          <Text style={ls.statSub}>{location.studentsNow} students</Text>
        </View>
        <View style={ls.statCard}>
          <Ionicons name="time-outline" size={14} color={T.accentPurple} />
          <Text style={ls.statLabel}>Best Time</Text>
          <Text style={ls.statValue}>{location.bestTime}</Text>
        </View>
        <View style={ls.statCard}>
          <Ionicons name="star" size={14} color={T.accentOrange} />
          <Text style={ls.statLabel}>Rating</Text>
          <Text style={ls.statValue}>{location.rating}</Text>
        </View>
      </View>

      {/* Tags */}
      {location.tags && (
        <View style={ls.tagRow}>
          {location.tags.map((tag) => (
            <View key={tag} style={ls.tag}>
              <Text style={ls.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action buttons */}
      <View style={ls.actions}>
        <TouchableOpacity activeOpacity={0.8} onPress={onNavigate} style={{ flex: 1 }}>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ls.primaryAction}>
            <Ionicons name="navigate" size={16} color={T.white} />
            <Text style={ls.primaryActionText}>Navigate</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={onSave} style={ls.secondaryAction}>
          <Ionicons name="bookmark-outline" size={18} color={T.accentPurple} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={onShare} style={ls.secondaryAction}>
          <Ionicons name="share-outline" size={18} color={T.accentBlue} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} style={ls.secondaryAction}>
          <Ionicons name="people-outline" size={18} color={T.accentGreen} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} style={ls.secondaryAction}>
          <Ionicons name="chatbubble-outline" size={18} color={T.accentPink} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ls = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 10,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 10,
    zIndex: 40,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 18, fontWeight: '800', color: T.textPrimary },
  subtitle: { fontSize: 12, color: T.textMuted, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 6,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statLabel: { fontSize: 10, fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  statValue: { fontSize: 13, fontWeight: '800', color: T.textPrimary },
  statSub: { fontSize: 9, color: T.textMuted },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  tag: {
    backgroundColor: 'rgba(75,80,248,0.06)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(75,80,248,0.08)',
  },
  tagText: { fontSize: 11, fontWeight: '600', color: T.accentBlue },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 14,
  },
  primaryActionText: { fontSize: 14, fontWeight: '700', color: T.white },
  secondaryAction: {
    width: 46, height: 46, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Saved Places Panel ───────────────────────────────────────────────────────
function SavedPanel({
  visible, onToggle, onSelect,
}: {
  visible: boolean; onToggle: () => void; onSelect: (loc: CampusLocation) => void;
}) {
  const grouped = {
    favorite: SAVED_PLACES.filter((s) => s.type === 'favorite'),
    frequent: SAVED_PLACES.filter((s) => s.type === 'frequent'),
    recent: SAVED_PLACES.filter((s) => s.type === 'recent'),
  };

  const getLocation = (id: string) => LOCATIONS.find((l) => l.id === id)!;

  return (
    <View style={[sp.panel, !visible && sp.panelCollapsed]}>
      <TouchableOpacity activeOpacity={0.7} onPress={onToggle} style={sp.toggleBtn}>
        <Ionicons name="bookmark" size={16} color={T.accentPurple} />
        {!visible && <Text style={sp.toggleLabel}>Saved</Text>}
        <Ionicons name={visible ? 'chevron-down' : 'chevron-up'} size={14} color={T.textMuted} />
      </TouchableOpacity>

      {visible && (
        <ScrollView showsVerticalScrollIndicator={false} style={sp.list}>
          {/* Favorites */}
          <Text style={sp.groupLabel}>Favorites</Text>
          {grouped.favorite.map((s) => {
            const loc = getLocation(s.locationId);
            const cat = CATEGORY_ICON[loc.category];
            return (
              <TouchableOpacity key={s.id} activeOpacity={0.7} style={sp.item} onPress={() => onSelect(loc)}>
                <View style={[sp.itemIcon, { backgroundColor: cat.bg }]}>
                  <Ionicons name={cat.icon as any} size={12} color={cat.color} />
                </View>
                <Text style={sp.itemName} numberOfLines={1}>{loc.name}</Text>
                <Ionicons name="heart" size={12} color={T.accentPink} />
              </TouchableOpacity>
            );
          })}

          {/* Frequent */}
          <Text style={sp.groupLabel}>Frequently Visited</Text>
          {grouped.frequent.map((s) => {
            const loc = getLocation(s.locationId);
            const cat = CATEGORY_ICON[loc.category];
            return (
              <TouchableOpacity key={s.id} activeOpacity={0.7} style={sp.item} onPress={() => onSelect(loc)}>
                <View style={[sp.itemIcon, { backgroundColor: cat.bg }]}>
                  <Ionicons name={cat.icon as any} size={12} color={cat.color} />
                </View>
                <Text style={sp.itemName} numberOfLines={1}>{loc.name}</Text>
                <Ionicons name="trending-up" size={12} color={T.accentGreen} />
              </TouchableOpacity>
            );
          })}

          {/* Recent */}
          <Text style={sp.groupLabel}>Recent</Text>
          {grouped.recent.map((s) => {
            const loc = getLocation(s.locationId);
            const cat = CATEGORY_ICON[loc.category];
            return (
              <TouchableOpacity key={s.id} activeOpacity={0.7} style={sp.item} onPress={() => onSelect(loc)}>
                <View style={[sp.itemIcon, { backgroundColor: cat.bg }]}>
                  <Ionicons name={cat.icon as any} size={12} color={cat.color} />
                </View>
                <Text style={sp.itemName} numberOfLines={1}>{loc.name}</Text>
                <Ionicons name="time-outline" size={12} color={T.textMuted} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const sp = StyleSheet.create({
  panel: {
    position: 'absolute', bottom: 28, left: 16,
    width: 200, maxHeight: 320,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
    zIndex: 20,
  },
  panelCollapsed: { width: 'auto', maxHeight: 'auto' },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  toggleLabel: { fontSize: 12, fontWeight: '700', color: T.accentPurple },
  list: { paddingHorizontal: 12, paddingBottom: 12 },
  groupLabel: {
    fontSize: 9, fontWeight: '800', color: T.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 8, marginBottom: 4, marginLeft: 2,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 6,
    borderRadius: 10,
  },
  itemIcon: {
    width: 24, height: 24, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  itemName: { flex: 1, fontSize: 12, fontWeight: '600', color: T.textPrimary },
});

// ─── Event Detail Card ────────────────────────────────────────────────────────
function EventCard({
  event, onClose,
}: {
  event: CampusEvent | null; onClose: () => void;
}) {
  if (!event) return null;
  const loc = LOCATIONS.find((l) => l.id === event.locationId);

  return (
    <View style={ec.card}>
      <View style={ec.header}>
        <View style={[ec.catDot, { backgroundColor: event.color }]} />
        <Text style={ec.catLabel}>{event.category}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
          <Ionicons name="close" size={16} color={T.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={ec.title}>{event.title}</Text>

      <View style={ec.infoRow}>
        <View style={ec.infoPill}>
          <Ionicons name="time-outline" size={12} color={T.accentPurple} />
          <Text style={ec.infoText}>{event.startTime}</Text>
        </View>
        <View style={ec.infoPill}>
          <Ionicons name="hourglass-outline" size={12} color={T.accentOrange} />
          <Text style={ec.infoText}>in {event.startsIn}</Text>
        </View>
        <View style={ec.infoPill}>
          <Ionicons name="people-outline" size={12} color={T.accentGreen} />
          <Text style={ec.infoText}>{event.participants}</Text>
        </View>
      </View>

      {loc && (
        <Text style={ec.location}>
          <Ionicons name="location-outline" size={11} color={T.textMuted} /> {loc.name}
        </Text>
      )}

      <View style={ec.actionRow}>
        <TouchableOpacity activeOpacity={0.8} style={{ flex: 1 }}>
          <LinearGradient colors={[event.color, T.accentPurple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ec.joinBtn}>
            <Ionicons name="enter-outline" size={14} color={T.white} />
            <Text style={ec.joinText}>Quick Join</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={ec.bookmarkBtn}>
          <Ionicons name="bookmark-outline" size={16} color={T.accentPurple} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ec = StyleSheet.create({
  card: {
    position: 'absolute', top: 120, left: 16, right: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
    zIndex: 35,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catLabel: { fontSize: 11, fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  title: { fontSize: 16, fontWeight: '800', color: T.textPrimary, marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  infoText: { fontSize: 11, fontWeight: '600', color: T.textSecondary },
  location: { fontSize: 11, color: T.textMuted, marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 14, paddingVertical: 12,
  },
  joinText: { fontSize: 13, fontWeight: '700', color: T.white },
  bookmarkBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Top bar & layout styles ──────────────────────────────────────────────────
const ui = StyleSheet.create({
  topBar: {
    position: 'absolute', top: 6, left: 0, right: 0, zIndex: 35,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 10,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  searchWrap: { flex: 1 },
  chipsRow: {
    position: 'absolute', top: 60, left: 0, right: 0, zIndex: 25,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CampusMapScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);

  const searchSuggestions = searchQuery.length > 0
    ? LOCATIONS.filter((l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handlePinPress = useCallback((loc: CampusLocation) => {
    setSelectedLocation(loc);
    setSelectedEvent(null);
    setSavedPanelOpen(false);
  }, []);

  const handleSearchSelect = useCallback((loc: CampusLocation) => {
    setSearchQuery('');
    setSelectedLocation(loc);
    setSelectedEvent(null);
  }, []);

  const handleEventPress = useCallback((ev: CampusEvent) => {
    setSelectedEvent(ev);
    setSelectedLocation(null);
  }, []);

  const handleSavedSelect = useCallback((loc: CampusLocation) => {
    setSavedPanelOpen(false);
    setSelectedLocation(loc);
  }, []);

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flex: 1 }}>
          {/* Full-screen map canvas */}
          <MapCanvas
            activeCategory={activeCategory}
            pins={LOCATIONS}
            onPinPress={handlePinPress}
            selectedPin={selectedLocation?.id ?? null}
            events={EVENTS}
            onEventPress={handleEventPress}
          />

          {/* Top bar: back + search on one row */}
          <View style={ui.topBar}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} style={ui.backBtn}>
              <Ionicons name="chevron-back" size={20} color={T.textPrimary} />
            </TouchableOpacity>
            <View style={ui.searchWrap}>
              <FloatingSearch
                query={searchQuery}
                setQuery={setSearchQuery}
                onFocus={() => {}}
                suggestions={searchSuggestions}
                onSelect={handleSearchSelect}
              />
            </View>
          </View>

          {/* Category chips — 14px below search row */}
          <View style={ui.chipsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id} activeOpacity={0.7}
                    style={[cc.chip, isActive && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => setActiveCategory(isActive ? null : cat.id)}
                  >
                    <Ionicons name={cat.icon as any} size={14} color={isActive ? T.white : cat.color} />
                    <Text style={[cc.chipText, isActive && { color: T.white }]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Event detail card */}
          {selectedEvent && !selectedLocation && (
            <EventCard event={selectedEvent} onClose={() => setSelectedEvent(null)} />
          )}

          {/* Saved places panel */}
          {!selectedLocation && (
            <SavedPanel
              visible={savedPanelOpen}
              onToggle={() => setSavedPanelOpen(!savedPanelOpen)}
              onSelect={handleSavedSelect}
            />
          )}

          {/* Location detail bottom sheet */}
          {selectedLocation && (
            <LocationSheet
              location={selectedLocation}
              onClose={() => setSelectedLocation(null)}
              onNavigate={() => {}}
              onSave={() => {}}
              onShare={() => {}}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDF1F7' },
});
