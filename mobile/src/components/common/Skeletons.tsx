import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '../../theme';

/* ─── Shimmer Pulse ─────────────────────────────────────────────────────────── */

function ShimmerBox({ style }: { style?: any }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return <Animated.View style={[s.shimmer, style, { opacity }]} />;
}

/* ─── Feed Card Skeleton ────────────────────────────────────────────────────── */

export function FeedCardSkeleton() {
  return (
    <View style={s.feedCard}>
      <View style={s.feedRow}>
        <ShimmerBox style={s.avatar} />
        <View style={{ flex: 1, gap: 6 }}>
          <ShimmerBox style={[s.line, { width: '40%' }]} />
          <ShimmerBox style={[s.line, { width: '25%', height: 10 }]} />
        </View>
      </View>
      <ShimmerBox style={[s.line, { width: '100%', height: 14, marginTop: 12 }]} />
      <ShimmerBox style={[s.line, { width: '85%', height: 14, marginTop: 6 }]} />
      <ShimmerBox style={[s.line, { width: '60%', height: 14, marginTop: 6 }]} />
      <View style={[s.feedRow, { marginTop: 14 }]}>
        <ShimmerBox style={[s.pill, { width: 50 }]} />
        <ShimmerBox style={[s.pill, { width: 50 }]} />
        <ShimmerBox style={[s.pill, { width: 70 }]} />
      </View>
    </View>
  );
}

/* ─── List Row Skeleton ─────────────────────────────────────────────────────── */

export function ListRowSkeleton() {
  return (
    <View style={s.listRow}>
      <ShimmerBox style={s.avatar} />
      <View style={{ flex: 1, gap: 6 }}>
        <ShimmerBox style={[s.line, { width: '55%' }]} />
        <ShimmerBox style={[s.line, { width: '80%', height: 10 }]} />
      </View>
      <ShimmerBox style={[s.line, { width: 40, height: 10 }]} />
    </View>
  );
}

/* ─── Profile Header Skeleton ───────────────────────────────────────────────── */

export function ProfileHeaderSkeleton() {
  return (
    <View style={s.profileHeader}>
      <ShimmerBox style={s.avatarLg} />
      <ShimmerBox style={[s.line, { width: '45%', height: 18, marginTop: 12 }]} />
      <ShimmerBox style={[s.line, { width: '30%', height: 12, marginTop: 8 }]} />
      <View style={[s.feedRow, { marginTop: 16, justifyContent: 'center' }]}>
        <ShimmerBox style={[s.statBox]} />
        <ShimmerBox style={[s.statBox]} />
        <ShimmerBox style={[s.statBox]} />
      </View>
    </View>
  );
}

/* ─── Detail Header Skeleton ────────────────────────────────────────────────── */

export function DetailHeaderSkeleton() {
  return (
    <View style={s.detailHeader}>
      <ShimmerBox style={[s.line, { width: '70%', height: 20 }]} />
      <ShimmerBox style={[s.line, { width: '45%', height: 12, marginTop: 8 }]} />
      <ShimmerBox style={[s.line, { width: '100%', height: 100, marginTop: 16, borderRadius: Radius.md }]} />
      <View style={[s.feedRow, { marginTop: 14 }]}>
        <ShimmerBox style={[s.pill, { width: 60 }]} />
        <ShimmerBox style={[s.pill, { width: 80 }]} />
        <ShimmerBox style={[s.pill, { width: 55 }]} />
      </View>
    </View>
  );
}

/* ─── Module Grid Skeleton ─────────────────────────────────────────────────── */

export function ModuleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={s.moduleGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={s.moduleCard}>
          <ShimmerBox style={s.moduleIcon} />
          <ShimmerBox style={[s.line, { width: '70%', height: 10 }]} />
          <ShimmerBox style={[s.line, { width: '50%', height: 8 }]} />
        </View>
      ))}
    </View>
  );
}

/* ─── Generic Skeleton List (renders N rows) ────────────────────────────────── */

export function SkeletonList({ count = 4, type = 'row' }: { count?: number; type?: 'row' | 'card' }) {
  const Component = type === 'card' ? FeedCardSkeleton : ListRowSkeleton;
  return (
    <View style={{ gap: type === 'card' ? 16 : 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </View>
  );
}

/* ─── Styles ────────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  shimmer: {
    backgroundColor: 'rgba(139, 77, 255, 0.08)',
    borderRadius: Radius.xs,
  },
  feedCard: {
    backgroundColor: Colors.surfaceGlass,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    padding: Spacing.base,
    ...Shadow.sm,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarLg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: 'center',
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
  pill: {
    height: 26,
    borderRadius: 13,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerSoft,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  statBox: {
    width: 70,
    height: 48,
    borderRadius: Radius.sm,
  },
  detailHeader: {
    padding: Spacing.base,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 22,
    gap: 12,
  },
  moduleCard: {
    width: '30%',
    flexGrow: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 100,
  },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
  },
});
