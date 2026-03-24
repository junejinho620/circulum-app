import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, Modal, Pressable, FlatList, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/auth.store';

const { width: SCREEN_W } = Dimensions.get('window');

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

const BG:  [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];
const AVATAR_GRAD: [string, string, string] = ['#6B7CFF', '#8B4DFF', '#F08CCF'];

// ─── Year options ─────────────────────────────────────────────────────────────
const YEARS = ['1st', '2nd', '3rd', '4th', '5th+', 'Grad', 'Alumni'];

// ─── Major suggestions ───────────────────────────────────────────────────────
const MAJORS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Software Engineering', 'Data Science',
  'Mathematics', 'Statistics', 'Physics', 'Chemistry', 'Biology',
  'Biochemistry', 'Neuroscience', 'Psychology', 'Sociology',
  'Political Science', 'Economics', 'Commerce', 'Finance',
  'Accounting', 'Marketing', 'Management', 'International Relations',
  'Philosophy', 'English', 'History', 'Linguistics', 'Music',
  'Art & Design', 'Film Studies', 'Architecture', 'Urban Planning',
  'Environmental Science', 'Health Sciences', 'Nursing', 'Kinesiology',
  'Pharmacy', 'Pre-Med', 'Law', 'Education', 'Social Work',
];

// ─── Interest tags (expanded with categories) ────────────────────────────────
type InterestCategory = { label: string; icon: string; color: string; tags: string[] };

const INTEREST_CATS: InterestCategory[] = [
  {
    label: 'Academic', icon: 'school-outline', color: T.accentBlue,
    tags: ['Computer Science', 'Engineering', 'Business', 'Psychology', 'Biology',
      'Mathematics', 'Physics', 'Economics', 'Philosophy', 'Chemistry',
      'Political Science', 'Sociology', 'History', 'Linguistics', 'Literature',
      'Statistics', 'Data Science', 'Neuroscience', 'Environmental Science', 'Architecture'],
  },
  {
    label: 'Hobbies', icon: 'color-palette-outline', color: T.accentPurple,
    tags: ['Photography', 'Music', 'Art & Design', 'Film', 'Gaming',
      'Reading', 'Writing', 'Cooking', 'Fitness', 'Yoga',
      'Dancing', 'Hiking', 'Skateboarding', 'Chess', 'Anime',
      'Podcasts', 'DIY & Crafts', 'Thrifting', 'Board Games', 'Gardening'],
  },
  {
    label: 'Campus Life', icon: 'people-outline', color: T.accentGreen,
    tags: ['Clubs', 'Greek Life', 'Student Gov', 'Volunteering', 'Sports',
      'Hackathons', 'Startups', 'Research', 'Tutoring', 'Events',
      'Intramurals', 'Study Groups', 'Housing', 'Commuting', 'Campus Jobs',
      'Student Media', 'Debate', 'Model UN', 'Cultural Orgs', 'Music Ensembles'],
  },
  {
    label: 'Career', icon: 'briefcase-outline', color: T.accentOrange,
    tags: ['Internships', 'Co-op', 'Networking', 'Tech Industry', 'Finance',
      'Consulting', 'Healthcare', 'Law', 'Academia', 'Entrepreneurship',
      'Product Management', 'UX Design', 'Marketing', 'Data Analytics', 'AI & ML',
      'Grad School', 'Resume Help', 'Interview Prep', 'Side Projects', 'Freelancing'],
  },
  {
    label: 'Lifestyle', icon: 'heart-outline', color: T.accentPink,
    tags: ['Travel', 'Sustainability', 'Mental Health', 'Coffee', 'Foodie',
      'Night Owl', 'Early Bird', 'Minimalism', 'Fashion', 'Pets',
      'Gym & Lifting', 'Running', 'Meditation', 'Skincare', 'Budgeting',
      'Relationship Advice', 'Self-Improvement', 'Spirituality', 'Astrology', 'Memes'],
  },
];

const ALL_INTERESTS = INTEREST_CATS.flatMap((c) => c.tags);


// ─── Handle validation (mock) ─────────────────────────────────────────────────
const TAKEN_HANDLES = ['admin', 'moderator', 'circulum', 'anonymous'];

function validateHandle(h: string): 'available' | 'taken' | 'invalid' | 'short' {
  if (h.length < 3) return 'short';
  if (!/^[a-zA-Z0-9_]+$/.test(h)) return 'invalid';
  if (TAKEN_HANDLES.includes(h.toLowerCase())) return 'taken';
  return 'available';
}

// ─── Profile completion calc ──────────────────────────────────────────────────
function calcCompletion(handle: string, bio: string, major: string, year: string, interests: string[]): number {
  let score = 0;
  if (handle.length >= 3) score += 20;
  if (bio.length >= 10) score += 20;
  if (major.length > 0) score += 20;
  if (year.length > 0) score += 20;
  if (interests.length >= 2) score += 20;
  return score;
}

// ─── Major selector sheet ─────────────────────────────────────────────────────
function MajorSheet({ visible, onClose, onSelect, current }: {
  visible: boolean; onClose: () => void; onSelect: (m: string) => void; current: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() =>
    search.trim()
      ? MAJORS.filter((m) => m.toLowerCase().includes(search.toLowerCase()))
      : MAJORS,
    [search],
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={ms.backdrop} onPress={onClose} />
      <View style={ms.sheet}>
        <View style={ms.handle} />
        <Text style={ms.title}>Select Major</Text>
        <View style={ms.searchWrap}>
          <Ionicons name="search" size={16} color={T.textMuted} />
          <TextInput
            style={ms.searchInput}
            placeholder="Search programs..."
            placeholderTextColor={T.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 340 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { onSelect(item); onClose(); setSearch(''); }}
              style={[ms.item, current === item && ms.itemActive]}
            >
              <Text style={[ms.itemText, current === item && ms.itemTextActive]}>{item}</Text>
              {current === item && <Ionicons name="checkmark" size={16} color={T.accentPurple} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={ms.emptyText}>No match found</Text>
              <TouchableOpacity
                onPress={() => { onSelect(search.trim()); onClose(); setSearch(''); }}
                style={ms.customBtn}
              >
                <Ionicons name="add-circle-outline" size={14} color={T.accentPurple} />
                <Text style={ms.customBtnText}>Use "{search.trim()}"</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 10, maxHeight: '70%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: T.textPrimary, marginBottom: 14 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(17,17,17,0.04)', borderRadius: 12,
    paddingHorizontal: 12, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: T.textPrimary, paddingVertical: 10 },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: 'rgba(17,17,17,0.04)',
  },
  itemActive: { backgroundColor: T.accentPurple + '08', borderRadius: 10, paddingHorizontal: 10 },
  itemText: { fontSize: 14, fontWeight: '500', color: T.textPrimary },
  itemTextActive: { fontWeight: '700', color: T.accentPurple },
  emptyText: { fontSize: 13, color: T.textMuted },
  customBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  customBtnText: { fontSize: 13, fontWeight: '600', color: T.accentPurple },
});

// ─── Avatar action sheet ──────────────────────────────────────────────────────
function AvatarSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const actions = [
    { icon: 'image-outline', label: 'Upload from library', color: T.accentBlue },
    { icon: 'camera-outline', label: 'Take a photo', color: T.accentPurple },
    { icon: 'trash-outline', label: 'Remove photo', color: T.accentPink },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={as.backdrop} onPress={onClose} />
      <View style={as.sheet}>
        <View style={as.handle} />
        <Text style={as.title}>Change Avatar</Text>
        {actions.map((a) => (
          <TouchableOpacity key={a.label} activeOpacity={0.7} onPress={onClose} style={as.row}>
            <View style={[as.iconCircle, { backgroundColor: a.color + '10' }]}>
              <Ionicons name={a.icon as any} size={18} color={a.color} />
            </View>
            <Text style={[as.rowText, a.label.includes('Remove') && { color: T.accentPink }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
      </View>
    </Modal>
  );
}

const as = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 10,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: T.textPrimary, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconCircle: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowText: { fontSize: 15, fontWeight: '600', color: T.textPrimary },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [handle, setHandle] = useState(user?.handle ?? 'AnonVisitor');
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('2nd');
  const [interests, setInterests] = useState<string[]>(['Computer Science', 'Photography']);
  const [showMajorSheet, setShowMajorSheet] = useState(false);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [interestCat, setInterestCat] = useState(0);
  const [showInterests, setShowInterests] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleStatus = validateHandle(handle);
  const completion = calcCompletion(handle, bio, major, year, interests);

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 8 ? [...prev, tag] : prev,
    );
  };

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); router.back(); }, 1600);
  };

  return (
    <LinearGradient colors={BG} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={ui.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={ui.navBtn}>
            <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
          </TouchableOpacity>
          <Text style={ui.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={ui.navBtn}>
            <Ionicons name="checkmark" size={20} color={T.accentPurple} />
          </TouchableOpacity>
        </View>

        {/* Success overlay */}
        {showSuccess && (
          <View style={ui.successOverlay}>
            <View style={ui.successCircle}>
              <Ionicons name="checkmark" size={36} color={T.white} />
            </View>
            <Text style={ui.successTitle}>Profile Updated!</Text>
            <Text style={ui.successSub}>Your changes are live</Text>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

          {/* ═══ SECTION 1: Live Preview Card ═══ */}
          <View style={pv.shadow}>
            <View style={pv.card}>
              {/* Completion bar */}
              <View style={pv.completionRow}>
                <Text style={pv.completionLabel}>Profile {completion}% complete</Text>
                <View style={pv.completionTrack}>
                  <LinearGradient
                    colors={completion === 100 ? [T.accentGreen, T.accentGreen] : CTA}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[pv.completionFill, { width: `${Math.max(8, completion)}%` }]}
                  />
                </View>
              </View>

              <View style={pv.previewRow}>
                <LinearGradient colors={AVATAR_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pv.avatar}>
                  <View style={pv.avatarInner}>
                    <Text style={pv.avatarLetter}>{handle.charAt(0).toUpperCase()}</Text>
                  </View>
                </LinearGradient>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={pv.handle}>@{handle || '...'}</Text>
                  <Text style={pv.meta}>
                    {year ? `${year} Year` : '—'}{major ? ` · ${major}` : ''}
                  </Text>
                  {bio.length > 0 && <Text style={pv.bio} numberOfLines={1}>{bio}</Text>}
                </View>
              </View>

              {/* interest preview badges */}
              {interests.length > 0 && (
                <View style={pv.badgeRow}>
                  {interests.slice(0, 4).map((tag) => (
                    <View key={tag} style={pv.badge}>
                      <Text style={pv.badgeText}>{tag}</Text>
                    </View>
                  ))}
                  {interests.length > 4 && (
                    <View style={pv.badge}>
                      <Text style={pv.badgeText}>+{interests.length - 4}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* ═══ SECTION 2: Avatar ═══ */}
          <View style={av.wrap}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowAvatarSheet(true)}>
              <LinearGradient colors={AVATAR_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={av.outer}>
                <View style={av.inner}>
                  <Text style={av.letter}>{handle.charAt(0).toUpperCase()}</Text>
                </View>
              </LinearGradient>
              <View style={av.editBtn}>
                <Ionicons name="camera" size={14} color={T.white} />
              </View>
            </TouchableOpacity>
            <Text style={av.hint}>Tap to change avatar</Text>
          </View>

          {/* ═══ Form fields ═══ */}
          <View style={fm.section}>

            {/* ═══ SECTION 3: Handle ═══ */}
            <View style={fm.fieldWrap}>
              <Text style={fm.label}>Handle</Text>
              <View style={[
                fm.inputRow,
                handleStatus === 'available' && handle.length >= 3 && fm.inputValid,
                (handleStatus === 'taken' || handleStatus === 'invalid') && fm.inputError,
              ]}>
                <Text style={fm.prefix}>@</Text>
                <TextInput
                  style={fm.input}
                  value={handle}
                  onChangeText={setHandle}
                  placeholder="your_handle"
                  placeholderTextColor={T.textMuted}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {handle.length >= 3 && (
                  <View style={[fm.statusDot, { backgroundColor: handleStatus === 'available' ? T.accentGreen : T.accentPink }]} />
                )}
              </View>
              <View style={fm.hintRow}>
                {handleStatus === 'available' && handle.length >= 3 && (
                  <>
                    <Ionicons name="checkmark-circle" size={12} color={T.accentGreen} />
                    <Text style={[fm.hint, { color: T.accentGreen }]}>Available</Text>
                  </>
                )}
                {handleStatus === 'taken' && (
                  <>
                    <Ionicons name="close-circle" size={12} color={T.accentPink} />
                    <Text style={[fm.hint, { color: T.accentPink }]}>Already taken</Text>
                  </>
                )}
                {handleStatus === 'invalid' && (
                  <>
                    <Ionicons name="warning" size={12} color={T.accentPink} />
                    <Text style={[fm.hint, { color: T.accentPink }]}>Letters, numbers, underscores only</Text>
                  </>
                )}
                {handleStatus === 'short' && (
                  <Text style={fm.hint}>Min 3 characters · This is your public display name</Text>
                )}
                <Text style={[fm.hint, { marginLeft: 'auto' }]}>{handle.length}/20</Text>
              </View>
            </View>

            {/* ═══ SECTION 4: Bio ═══ */}
            <View style={fm.fieldWrap}>
              <Text style={fm.label}>Bio</Text>
              <TextInput
                style={[fm.inputFull, { minHeight: 80, textAlignVertical: 'top' }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell others a little about yourself..."
                placeholderTextColor={T.textMuted + '80'}
                multiline
                maxLength={160}
              />
              <Text style={[fm.charCount, bio.length > 140 && { color: T.accentOrange }]}>{bio.length}/160</Text>
            </View>

            {/* ═══ SECTION 5: Major / Program ═══ */}
            <View style={fm.fieldWrap}>
              <Text style={fm.label}>Major / Program</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowMajorSheet(true)}
                style={fm.selectorBtn}
              >
                {major ? (
                  <View style={fm.majorTag}>
                    <Ionicons name="school" size={12} color={T.accentPurple} />
                    <Text style={fm.majorTagText}>{major}</Text>
                    <TouchableOpacity onPress={() => setMajor('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close" size={14} color={T.accentPurple + '80'} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={fm.selectorPlaceholder}>Select your program</Text>
                )}
                <Ionicons name="chevron-down" size={16} color={T.textMuted} />
              </TouchableOpacity>
            </View>

            {/* ═══ SECTION 6: Year ═══ */}
            <View style={fm.fieldWrap}>
              <Text style={fm.label}>Year</Text>
              <View style={fm.yearRow}>
                {YEARS.map((y) => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setYear(y)}
                    style={[fm.yearChip, year === y && fm.yearChipActive]}
                  >
                    <Text style={[fm.yearText, year === y && fm.yearTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ═══ SECTION 7: Interests ═══ */}
            <View style={fm.fieldWrap}>
              <View style={fm.labelRow}>
                <Text style={fm.label}>Interests</Text>
                <Text style={[fm.labelHint, interests.length >= 8 && { color: T.accentOrange }]}>
                  {interests.length}/8 selected
                </Text>
              </View>

              {/* selected */}
              {interests.length > 0 && (
                <View style={fm.tagRow}>
                  {interests.map((tag) => (
                    <TouchableOpacity key={tag} onPress={() => toggleInterest(tag)} style={fm.tagActive}>
                      <Text style={fm.tagActiveText}>{tag}</Text>
                      <Ionicons name="close" size={12} color={T.white} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* expand toggle */}
              <TouchableOpacity
                onPress={() => setShowInterests(!showInterests)}
                style={fm.addInterestBtn}
              >
                <Ionicons name={showInterests ? 'chevron-up' : 'add-circle-outline'} size={16} color={T.accentPurple} />
                <Text style={fm.addInterestText}>{showInterests ? 'Hide options' : 'Browse interests'}</Text>
              </TouchableOpacity>

              {/* category tabs + grid */}
              {showInterests && (
                <View style={fm.interestPicker}>
                  {/* category tabs */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {INTEREST_CATS.map((cat, idx) => (
                      <TouchableOpacity
                        key={cat.label}
                        onPress={() => setInterestCat(idx)}
                        style={[fm.catTab, interestCat === idx && { backgroundColor: cat.color + '14', borderColor: cat.color + '30' }]}
                      >
                        <Ionicons name={cat.icon as any} size={12} color={interestCat === idx ? cat.color : T.textMuted} />
                        <Text style={[fm.catTabText, interestCat === idx && { color: cat.color }]}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* tags grid */}
                  <View style={fm.tagGrid}>
                    {INTEREST_CATS[interestCat].tags.map((tag) => {
                      const selected = interests.includes(tag);
                      return (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => toggleInterest(tag)}
                          style={[fm.tagInactive, selected && fm.tagInactiveSelected]}
                        >
                          {selected && <Ionicons name="checkmark" size={12} color={T.accentPurple} />}
                          <Text style={[fm.tagInactiveText, selected && { color: T.accentPurple, fontWeight: '700' }]}>{tag}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* ═══ SECTION 8: Save ═══ */}
          <View style={{ marginHorizontal: 22, marginTop: 20 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              style={{ borderRadius: 16, overflow: 'hidden' }}
            >
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ui.saveBtn}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={ui.saveText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ─── Sheets ──────────────────────────────────────── */}
        <MajorSheet
          visible={showMajorSheet}
          onClose={() => setShowMajorSheet(false)}
          onSelect={setMajor}
          current={major}
        />
        <AvatarSheet
          visible={showAvatarSheet}
          onClose={() => setShowAvatarSheet(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Header / global styles ──────────────────────────────────────────────────
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
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16,
  },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  successOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
  },
  successCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: T.accentGreen,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: T.textPrimary },
  successSub: { fontSize: 13, color: T.textMuted, marginTop: 4 },
});

// ─── Preview card styles ─────────────────────────────────────────────────────
const pv = StyleSheet.create({
  shadow: {
    marginHorizontal: 22, borderRadius: 22, marginBottom: 6,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  card: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    padding: 16, gap: 12,
  },
  completionRow: { gap: 6 },
  completionLabel: { fontSize: 11, fontWeight: '700', color: T.textMuted },
  completionTrack: {
    height: 6, borderRadius: 3, backgroundColor: 'rgba(17,17,17,0.04)', overflow: 'hidden',
  },
  completionFill: { height: 6, borderRadius: 3 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)',
  },
  avatarLetter: { fontSize: 20, fontWeight: '800', color: T.white },
  handle: { fontSize: 15, fontWeight: '800', color: T.textPrimary },
  meta: { fontSize: 12, color: T.textSecondary },
  bio: { fontSize: 11, color: T.textMuted, fontStyle: 'italic' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
    backgroundColor: T.accentPurple + '10',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: T.accentPurple },
});

// ─── Avatar styles ────────────────────────────────────────────────────────────
const av = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 14, gap: 8 },
  outer: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B4DFF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  inner: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)',
  },
  letter: { fontSize: 38, fontWeight: '800', color: T.white, letterSpacing: -0.6 },
  editBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: T.accentPurple,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  hint: { fontSize: 11, color: T.textMuted },
});

// ─── Form styles ──────────────────────────────────────────────────────────────
const fm = StyleSheet.create({
  section: { paddingHorizontal: 22, gap: 22 },
  fieldWrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: T.textSecondary },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  labelHint: { fontSize: 11, fontWeight: '600', color: T.textMuted },
  hint: { fontSize: 11, color: T.textMuted },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 14,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  inputValid: { borderColor: T.accentGreen + '50' },
  inputError: { borderColor: T.accentPink + '50' },
  prefix: { fontSize: 15, fontWeight: '700', color: T.textMuted, marginRight: 2 },
  input: {
    flex: 1, fontSize: 14, fontWeight: '600', color: T.textPrimary,
    paddingVertical: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  inputFull: {
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: T.textPrimary,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  charCount: { fontSize: 10, color: T.textMuted, textAlign: 'right' },
  promptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
    backgroundColor: T.accentOrange + '0C',
  },
  promptBtnText: { fontSize: 10, fontWeight: '700', color: T.accentOrange },
  selectorBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  selectorPlaceholder: { fontSize: 14, color: T.textMuted },
  majorTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
    backgroundColor: T.accentPurple + '10',
  },
  majorTagText: { fontSize: 13, fontWeight: '700', color: T.accentPurple },
  yearRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  yearChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
  },
  yearChipActive: { backgroundColor: T.accentPurple, borderColor: T.accentPurple },
  yearText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  yearTextActive: { color: '#fff', fontWeight: '700' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagActive: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99,
    backgroundColor: T.accentPurple,
  },
  tagActiveText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  tagInactive: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
  },
  tagInactiveSelected: { backgroundColor: T.accentPurple + '0C', borderColor: T.accentPurple + '30' },
  tagInactiveText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  addInterestBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
  },
  addInterestText: { fontSize: 12, fontWeight: '600', color: T.accentPurple },
  interestPicker: { gap: 10, marginTop: 4 },
  catTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
    backgroundColor: 'rgba(17,17,17,0.03)',
    borderWidth: 1, borderColor: 'rgba(17,17,17,0.04)',
  },
  catTabText: { fontSize: 11, fontWeight: '600', color: T.textMuted },
});
