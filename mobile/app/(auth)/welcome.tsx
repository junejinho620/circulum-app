import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Spacing, Radius } from '../../src/theme';

const { width: W } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  textPrimary:   '#111111',
  textSecondary: '#5F6472',
  textMuted:     '#8A90A2',
  accentBlue:    '#4B50F8',
  accentPurple:  '#8B4DFF',
  accentPink:    '#E655C5',
  white:         '#FFFFFF',
  glassBorder:   'rgba(255,255,255,0.42)',
  glassCard:     'rgba(255,255,255,0.82)',
  glassBack:     'rgba(255,255,255,0.68)',
};

const BG: [string, string, string]       = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA_GRAD: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];

// ─── Slide data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    key: 'anon',
    title: 'Speak freely\non campus',
    body: 'Post anonymously, ask questions, and join real conversations with verified students.',
  },
  {
    key: 'discover',
    title: "See what\u2019s happening\naround you",
    body: 'Discover class tips, campus events, trending discussions, and real student updates.',
  },
  {
    key: 'market',
    title: 'Make student\nlife easier',
    body: 'Buy and sell items, share information, and get help from your campus community.',
  },
  {
    key: 'circle',
    title: 'Your campus,\nin one circle',
    body: 'From conversations to events to everyday student life — Circulum keeps you connected.',
  },
];

// ─── Screen component ─────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const router       = useRouter();
  const insets       = useSafeAreaInsets();
  const [showSlides, setShowSlides] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const splashAlpha  = useRef(new Animated.Value(1)).current;
  const slidesAlpha  = useRef(new Animated.Value(0)).current;
  const scrollRef    = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(splashAlpha, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(slidesAlpha, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]).start(() => setShowSlides(true));
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setSlideIndex(Math.round(e.nativeEvent.contentOffset.x / W));

  const goNext = () => {
    if (slideIndex < SLIDES.length - 1) {
      const n = slideIndex + 1;
      scrollRef.current?.scrollTo({ x: n * W, animated: true });
      setSlideIndex(n);
    } else {
      router.push('/(auth)/register');
    }
  };

  return (
    <View style={s.root}>
      {/* Atmospheric background */}
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={s.orbTR} />
      <View style={s.orbBL} />

      {/* ── SPLASH ── */}
      <Animated.View
        pointerEvents={showSlides ? 'none' : 'auto'}
        style={[StyleSheet.absoluteFill, { opacity: splashAlpha }]}
      >
        <View style={s.splashWrap}>
          <EmblemMark />
          <Text style={s.splashTitle}>Circulum</Text>
          <Text style={s.splashSlogan}>Your anonymous campus circle.</Text>
        </View>
      </Animated.View>

      {/* ── SLIDES ── */}
      <Animated.View
        pointerEvents={showSlides ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, { opacity: slidesAlpha }]}
      >
        <View style={{ height: insets.top }} />

        {/* Skip link */}
        <View style={s.topBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Slide pages */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {SLIDES.map((slide) => (
            <View key={slide.key} style={s.slidePage}>
              {/* Main glass card */}
              <BlurView intensity={60} tint="light" style={s.mainCard}>

                {/* Illustration — 2-card composition, never overcrowded */}
                {slide.key === 'anon'     && <IllustAnon />}
                {slide.key === 'discover' && <IllustDiscover />}
                {slide.key === 'market'   && <IllustMarket />}
                {slide.key === 'circle'   && <IllustCommunity />}

                {/* Text section */}
                <View style={s.textBlock}>
                  <Text style={s.slideTitle}>{slide.title}</Text>
                  <Text style={s.slideBody}>{slide.body}</Text>
                </View>

              </BlurView>
            </View>
          ))}
        </ScrollView>

        {/* Bottom controls */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          {/* Page dots */}
          <View style={s.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[s.dot, i === slideIndex ? s.dotActive : s.dotInactive]} />
            ))}
          </View>

          {/* CTA button */}
          <TouchableOpacity onPress={goNext} activeOpacity={0.87} style={s.ctaWrap}>
            <LinearGradient colors={CTA_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaBtn}>
              <Text style={s.ctaLabel}>
                {slideIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign-in link */}
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={s.signInHint}>
              Already have an account?{'  '}
              <Text style={s.signInLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Splash emblem ─────────────────────────────────────────────────────────────
function EmblemMark() {
  return (
    <View style={emblem.shadow}>
      <BlurView intensity={70} tint="light" style={emblem.glass}>
        <View style={emblem.ringOuter} />
        <View style={emblem.circleBlue} />
        <View style={emblem.circlePurple} />
        <View style={emblem.circlePink} />
        <View style={emblem.dot} />
      </BlurView>
    </View>
  );
}
const emblem = StyleSheet.create({
  shadow: {
    shadowColor: '#8B4DFF', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.20, shadowRadius: 32, elevation: 12,
    marginBottom: Spacing.xl,
  },
  glass: {
    width: 112, height: 112, borderRadius: 34, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.52)',
    alignItems: 'center', justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute', width: 78, height: 78, borderRadius: 39,
    borderWidth: 1.5, borderColor: 'rgba(75,80,248,0.16)',
  },
  circleBlue: {
    position: 'absolute', width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(75,80,248,0.12)', top: 14, left: 14,
  },
  circlePurple: {
    position: 'absolute', width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(139,77,255,0.14)', bottom: 16, right: 16,
  },
  circlePink: {
    position: 'absolute', width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(230,85,197,0.16)', top: 16, right: 20,
  },
  dot: {
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: 'rgba(75,80,248,0.42)',
  },
});

// ─── Shared mini-card primitives ──────────────────────────────────────────────
function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[mc.pill, { backgroundColor: bg }]}>
      <Text style={[mc.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={mc.divider} />;
}

const mc = StyleSheet.create({
  // Back card — slightly behind, lower opacity
  backCard: {
    position: 'absolute', top: 0, left: 0, right: 16, zIndex: 1,
    backgroundColor: T.glassBack,
    borderRadius: 22, borderWidth: 1, borderColor: T.glassBorder,
    padding: 14, gap: 8,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 3,
    opacity: 0.72, transform: [{ rotate: '-4deg' }, { scale: 0.93 }],
  },
  // Front card — main focal card, full width
  frontCard: {
    position: 'absolute', top: 18, left: 0, right: 0, zIndex: 3,
    backgroundColor: T.glassCard,
    borderRadius: 22, borderWidth: 1, borderColor: T.glassBorder,
    padding: 14, gap: 9,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11, shadowRadius: 28, elevation: 7,
  },
  // Focal glow variant for front card (used on slides 1 + 4)
  frontGlow: {
    shadowColor: '#8B4DFF', shadowOpacity: 0.20,
    shadowRadius: 30, shadowOffset: { width: 0, height: 10 },
    borderColor: 'rgba(199,184,255,0.42)',
  },
  // Row utility
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // Pill
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
  // Text
  title: { fontSize: 12, fontWeight: '600', color: T.textPrimary, lineHeight: 16 },
  meta:  { fontSize: 10, color: T.textMuted,    fontWeight: '400' },
  // Divider
  divider: { height: 1, backgroundColor: 'rgba(17,17,17,0.055)', marginVertical: 1 },
  // Reaction chip
  reactionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(75,80,248,0.08)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999,
  },
  reactionText: { fontSize: 10, color: T.textSecondary, fontWeight: '600' },
});

// ─── Slide 1 — Anonymous feed ─────────────────────────────────────────────────
function IllustAnon() {
  return (
    <View style={il.wrap}>
      {/* Back card */}
      <View style={mc.backCard}>
        <View style={mc.rowBetween}>
          <Pill label="General" bg="rgba(75,80,248,0.12)" color="#4B50F8" />
          <Text style={mc.meta}>5m ago</Text>
        </View>
        <Text style={mc.title} numberOfLines={1}>Just found out the campus has a rooftop garden 🌿</Text>
        <Text style={mc.meta}>@StarDust99</Text>
      </View>

      {/* Front card — single glow focal point */}
      <View style={[mc.frontCard, mc.frontGlow]}>
        <View style={mc.rowBetween}>
          <Pill label="Study" bg="rgba(107,124,255,0.13)" color="#6B7CFF" />
          <Text style={mc.meta}>2m ago</Text>
        </View>
        <Text style={mc.title} numberOfLines={2}>
          Anyone know which prof curves the most in CHEM201? Asking for a friend 👀
        </Text>
        <Divider />
        <View style={mc.rowBetween}>
          <Text style={mc.meta}>@QuantumFox</Text>
          <View style={mc.row}>
            <View style={mc.reactionChip}><Text style={mc.reactionText}>💬 14</Text></View>
            <View style={mc.reactionChip}><Text style={mc.reactionText}>↑ 23</Text></View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Slide 2 — Discover ───────────────────────────────────────────────────────
const DISC_CATS = [
  { label: 'Classes', bg: 'rgba(107,124,255,0.13)', color: '#6B7CFF' },
  { label: 'Events',  bg: 'rgba(139,77,255,0.13)',  color: '#8B4DFF' },
  { label: 'Campus',  bg: 'rgba(75,80,248,0.12)',   color: '#4B50F8' },
  { label: 'Market',  bg: 'rgba(230,85,197,0.11)',  color: '#E655C5' },
];
const DISC_TREND = [
  { dot: '#4B50F8', label: 'Exam tips for CHEM201',   count: '24 new' },
  { dot: '#8B4DFF', label: 'Library hours extended',  count: '31 new' },
];

function IllustDiscover() {
  return (
    <View style={il.wrap}>
      {/* Back card — event */}
      <View style={mc.backCard}>
        <View style={mc.rowBetween}>
          <Pill label="Event" bg="rgba(139,77,255,0.13)" color="#8B4DFF" />
          <Text style={mc.meta}>Today</Text>
        </View>
        <Text style={mc.title} numberOfLines={1}>Faculty Braai · The Bremner</Text>
        <Text style={mc.meta}>Fri 18 Mar  ·  43 interested</Text>
      </View>

      {/* Front card — browse panel */}
      <View style={mc.frontCard}>
        {/* Search */}
        <View style={il.searchBar}>
          <Text style={il.searchIcon}>○</Text>
          <Text style={il.searchPlaceholder}>Search campus...</Text>
        </View>

        {/* Category chips */}
        <View style={il.chipRow}>
          {DISC_CATS.map((c) => (
            <Pill key={c.label} label={c.label} bg={c.bg} color={c.color} />
          ))}
        </View>

        <Divider />

        {/* Trending items */}
        {DISC_TREND.map((t, i) => (
          <View key={i} style={mc.row}>
            <View style={[il.dot, { backgroundColor: t.dot }]} />
            <Text style={[mc.title, { flex: 1, fontWeight: '500', fontSize: 11 }]} numberOfLines={1}>{t.label}</Text>
            <View style={[mc.reactionChip, { backgroundColor: 'rgba(75,80,248,0.08)' }]}>
              <Text style={mc.reactionText}>{t.count}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Slide 3 — Marketplace ────────────────────────────────────────────────────
const MKT_CATS = [
  { label: 'Textbooks', bg: 'rgba(107,124,255,0.12)', color: '#6B7CFF' },
  { label: 'Housing',   bg: 'rgba(139,77,255,0.12)',  color: '#8B4DFF' },
  { label: 'For Sale',  bg: 'rgba(75,80,248,0.11)',   color: '#4B50F8' },
  { label: 'Help',      bg: 'rgba(230,85,197,0.10)',  color: '#E655C5' },
];
const MKT_LISTINGS = [
  { grad: ['#4B50F8', '#8B4DFF'] as [string,string], title: 'MacBook charger 60W', price: 'R 150', priceBg: 'rgba(75,80,248,0.10)', priceColor: '#4B50F8' },
  { grad: ['#8B4DFF', '#E655C5'] as [string,string], title: 'CHEM201 study notes',  price: 'Free',   priceBg: 'rgba(79,70,229,0.09)', priceColor: '#4F46E5' },
];

function IllustMarket() {
  return (
    <View style={il.wrap}>
      {/* Back card — textbook listing */}
      <View style={mc.backCard}>
        <View style={mc.rowBetween}>
          <Pill label="Textbooks" bg="rgba(107,124,255,0.12)" color="#6B7CFF" />
          <Text style={mc.meta}>2h ago</Text>
        </View>
        <Text style={mc.title} numberOfLines={1}>Calculus 3 — 6th ed. Like new</Text>
        <Text style={mc.meta}>R 180  ·  @MathNerd</Text>
      </View>

      {/* Front card — browse */}
      <View style={mc.frontCard}>
        <View style={il.chipRow}>
          {MKT_CATS.map((c) => (
            <Pill key={c.label} label={c.label} bg={c.bg} color={c.color} />
          ))}
        </View>

        <Divider />

        {MKT_LISTINGS.map((l, i) => (
          <View key={i} style={mc.row}>
            <LinearGradient colors={l.grad} style={il.photoThumb} />
            <Text style={[mc.title, { flex: 1, fontWeight: '500', fontSize: 11 }]} numberOfLines={1}>{l.title}</Text>
            <View style={[mc.pill, { backgroundColor: l.priceBg }]}>
              <Text style={[mc.pillText, { color: l.priceColor, fontWeight: '700' }]}>{l.price}</Text>
            </View>
          </View>
        ))}

        <Divider />
        <Text style={[mc.meta, { fontSize: 9, letterSpacing: 0.2 }]}>14 new listings today</Text>
      </View>
    </View>
  );
}

// ─── Slide 4 — Community ─────────────────────────────────────────────────────
const AV_COLORS = ['#4B50F8', '#8B4DFF', '#E655C5', '#C7B8FF', '#6B7CFF'];
const SPARK = [5, 7, 6, 9, 8, 11, 10, 14, 12, 15, 13, 16, 14, 18, 16, 19, 17, 20, 19, 22];

function Avatars({ n = 4, sz = 17 }: { n?: number; sz?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {AV_COLORS.slice(0, n).map((c, i) => (
        <View
          key={i}
          style={{
            width: sz, height: sz, borderRadius: sz / 2,
            backgroundColor: c,
            marginLeft: i === 0 ? 0 : -(sz * 0.3),
            borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
            zIndex: n - i,
          }}
        />
      ))}
    </View>
  );
}

function IllustCommunity() {
  return (
    <View style={il.wrap}>
      {/* Back card — community stats */}
      <View style={mc.backCard}>
        <View style={mc.rowBetween}>
          <Avatars n={4} sz={16} />
          <View style={il.livePill}>
            <View style={il.liveDot} />
            <Text style={il.liveText}>Active</Text>
          </View>
        </View>
        <Text style={mc.title}>2,400+ students · UCT</Text>
        <Text style={mc.meta}>Online right now</Text>
      </View>

      {/* Front card — trending discussion, single glow */}
      <View style={[mc.frontCard, mc.frontGlow]}>
        <View style={mc.rowBetween}>
          <View style={mc.row}>
            <Text style={{ fontSize: 11 }}>🔥</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: T.textPrimary }}>Trending</Text>
          </View>
          <Text style={mc.meta}>now</Text>
        </View>

        <Text style={mc.title} numberOfLines={2}>
          What's the best quiet study spot on campus? Drop your hidden gems 👇
        </Text>

        <View style={il.chipRow}>
          <Pill label="Study"   bg="rgba(107,124,255,0.12)" color="#6B7CFF" />
          <Pill label="General" bg="rgba(75,80,248,0.11)"   color="#4B50F8" />
        </View>

        <Divider />

        <View style={mc.rowBetween}>
          <View style={mc.row}>
            <Avatars n={5} sz={15} />
            <Text style={mc.meta}>  128 in conversation</Text>
          </View>
        </View>

        {/* Upward-trend sparkline */}
        <View style={il.sparkRow}>
          <Text style={il.sparkLabel}>Activity</Text>
          <View style={il.sparkline}>
            {SPARK.map((h, i) => (
              <View
                key={i}
                style={[il.sparkBar, {
                  height: h,
                  backgroundColor: AV_COLORS[i % 3] ?? '#4B50F8',
                  opacity: 0.40 + (h / 22) * 0.60,
                }]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Illustration shared styles ───────────────────────────────────────────────
const il = StyleSheet.create({
  wrap: {
    height: 198,
    position: 'relative',
    marginBottom: Spacing.lg,
    marginHorizontal: -2,
  },
  // Search bar (Slide 2)
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(75,80,248,0.07)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, gap: 5,
  },
  searchIcon: { fontSize: 10, color: T.textMuted },
  searchPlaceholder: { fontSize: 10, color: T.textMuted },
  // Category chips row
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  // Trend dot
  dot: { width: 6, height: 6, borderRadius: 3 },
  // Listing thumbnail
  photoThumb: { width: 26, height: 26, borderRadius: 8 },
  // Live pill (Slide 4)
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(79,70,229,0.09)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4F46E5' },
  liveText: { fontSize: 9, fontWeight: '600', color: '#4F46E5' },
  // Sparkline
  sparkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sparkLabel: { fontSize: 9, fontWeight: '600', color: T.textMuted, letterSpacing: 0.2, minWidth: 42 },
  sparkline: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 22 },
  sparkBar: { width: 3, borderRadius: 2 },
});

// ─── Main layout styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // Background orbs
  orbTR: {
    position: 'absolute', width: 240, height: 240, top: -70, right: -70,
    borderRadius: 9999, backgroundColor: '#F3D6E9', opacity: 0.50,
  },
  orbBL: {
    position: 'absolute', width: 200, height: 200, bottom: -50, left: -50,
    borderRadius: 9999, backgroundColor: '#C7B8FF', opacity: 0.38,
  },

  // Splash
  splashWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, gap: Spacing.sm,
  },
  splashTitle: {
    fontSize: 46, fontWeight: '800', color: T.textPrimary,
    letterSpacing: -1.5, marginTop: Spacing.sm,
  },
  splashSlogan: {
    fontSize: 16, fontWeight: '400', color: T.textSecondary,
    letterSpacing: 0.1, marginTop: 4,
  },

  // Top bar
  topBar: {
    flexDirection: 'row', paddingHorizontal: 24,
    paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  skipText: { fontSize: 15, color: T.textSecondary, fontWeight: '500' },

  // Slide page
  slidePage: {
    width: W, flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  // Main glass card
  mainCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.glassBorder,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 8,
  },

  // Text block
  textBlock: { gap: Spacing.sm, paddingTop: Spacing.xs },
  slideTitle: {
    fontSize: 28, fontWeight: '700', color: T.textPrimary,
    lineHeight: 34, letterSpacing: -0.4,
  },
  slideBody: {
    fontSize: 15, color: T.textSecondary,
    lineHeight: 23, fontWeight: '400',
  },

  // Footer
  footer: {
    paddingHorizontal: 24, gap: Spacing.base,
    alignItems: 'center', paddingTop: Spacing.md,
  },

  // Page dots
  dots: { flexDirection: 'row', gap: 7, marginBottom: 4 },
  dot: { height: 7, borderRadius: 4 },
  dotActive:   { width: 24, backgroundColor: T.accentBlue },
  dotInactive: { width: 7,  backgroundColor: 'rgba(75,80,248,0.22)' },

  // CTA
  ctaWrap: {
    width: '100%',
    shadowColor: '#4B50F8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 7,
  },
  ctaBtn: {
    height: 56, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaLabel: { fontSize: 17, fontWeight: '700', color: T.white, letterSpacing: 0.3 },

  // Sign-in link
  signInHint: { fontSize: 14, color: T.textMuted, textAlign: 'center' },
  signInLink: { color: T.accentBlue, fontWeight: '600' },
});
