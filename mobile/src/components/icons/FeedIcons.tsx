/**
 * Circulum Custom Feed Icons
 * Minimal geometric icons with soft fills.
 * Designed for 16–26px usage inside glass pills and cards.
 *
 * variant="onDark"  → white/light bars (use inside gradient badges)
 * variant="onLight" → colored gradient bars (use on glass card backgrounds)
 */
import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ─── TrendPulseIcon ───────────────────────────────────────────────────────────
// Signal-wave shape: 5 bars in an irregular rhythm [short, mid, tall, short, mid]
// suggesting a live audio/momentum pulse rather than a flat bar chart.
//
// onDark  → solid white bars, full opacity, clear against gradient backgrounds
// onLight → per-bar colored gradient fills on glass card backgrounds

type Variant = 'onDark' | 'onLight';

// Bar heights as fractions of `size` (tallest = 1.0)
const BAR_RATIOS = [0.42, 0.68, 1.0, 0.52, 0.78];

// Colored fills used in onLight mode (top → bottom gradient per bar)
const LIGHT_GRADS: [string, string][] = [
  ['#6B7CFF', '#4B50F8'],
  ['#8B6AFF', '#6B50F8'],
  ['#8B4DFF', '#6B30DF'],
  ['#A040E0', '#8B4DFF'],
  ['#D04BC0', '#E655C5'],
];

// White-fill opacity per bar in onDark mode (increases toward peak, then stays high)
const DARK_OPACITIES = [0.50, 0.72, 1.00, 0.58, 0.84];

export function TrendPulseIcon({
  size    = 18,
  variant = 'onDark',
}: {
  size?:    number;
  variant?: Variant;
}) {
  const barW   = Math.round(size * 0.22);   // ~4px at size=18
  const barGap = Math.round(size * 0.20);   // ~3.5px at size=18
  const barR   = Math.round(barW * 0.45);
  const totalW = BAR_RATIOS.length * barW + (BAR_RATIOS.length - 1) * barGap;
  const peakI  = BAR_RATIOS.indexOf(1.0);

  return (
    <View
      style={{
        width:  totalW,
        height: size,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: barGap,
      }}
    >
      {BAR_RATIOS.map((ratio, i) => {
        const barH     = Math.round(ratio * size);
        const isPeak   = i === peakI;

        return (
          <View key={i} style={{ alignItems: 'center' }}>
            {/* Apex glow dot — only on tallest bar */}
            {isPeak && (
              <View
                style={{
                  width:  barW + 1,
                  height: barW + 1,
                  borderRadius: (barW + 1) / 2,
                  marginBottom: 2,
                  backgroundColor:
                    variant === 'onDark'
                      ? 'rgba(255,255,255,0.90)'
                      : 'rgba(230,85,197,0.80)',
                  shadowColor:
                    variant === 'onDark' ? '#FFFFFF' : '#E655C5',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              />
            )}

            {/* Bar body */}
            {variant === 'onDark' ? (
              // Solid white bar — fully visible on any gradient background
              <View
                style={{
                  width:  barW,
                  height: barH,
                  borderRadius: barR,
                  backgroundColor: `rgba(255,255,255,${DARK_OPACITIES[i]})`,
                }}
              />
            ) : (
              // Colored gradient bar for glass/light backgrounds
              <LinearGradient
                colors={LIGHT_GRADS[i]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  width:  barW,
                  height: barH,
                  borderRadius: barR,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── RadarIcon ────────────────────────────────────────────────────────────────
// Three concentric focus rings + filled gradient center dot + sweep arm.
// variant="onDark"  → white rings for gradient backgrounds
// variant="onLight" → blue/purple rings for glass card backgrounds

export function RadarIcon({
  size    = 20,
  variant = 'onLight',
}: {
  size?:    number;
  variant?: Variant;
}) {
  const outer = size;
  const mid   = Math.round(size * 0.64);
  const inner = Math.round(size * 0.26);

  const ringColorOuter =
    variant === 'onDark'
      ? 'rgba(255,255,255,0.30)'
      : 'rgba(75,80,248,0.26)';

  const ringColorMid =
    variant === 'onDark'
      ? 'rgba(255,255,255,0.55)'
      : 'rgba(139,77,255,0.52)';

  const sweepColor =
    variant === 'onDark'
      ? 'rgba(255,255,255,0.60)'
      : 'rgba(139,77,255,0.58)';

  const sweepH = (mid / 2) * 0.78;

  return (
    <View
      style={{
        width:  outer,
        height: outer,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer ring */}
      <View
        style={{
          position:     'absolute',
          width:        outer,
          height:       outer,
          borderRadius: outer / 2,
          borderWidth:  1,
          borderColor:  ringColorOuter,
        }}
      />

      {/* Mid ring */}
      <View
        style={{
          position:     'absolute',
          width:        mid,
          height:       mid,
          borderRadius: mid / 2,
          borderWidth:  1.5,
          borderColor:  ringColorMid,
        }}
      />

      {/* Sweep arm */}
      <View
        style={{
          position:        'absolute',
          width:           1.5,
          height:          sweepH,
          borderRadius:    1,
          backgroundColor: sweepColor,
          top:             outer / 2 - sweepH,
          left:            outer / 2 - 0.75,
          transform:       [{ rotate: '38deg' }],
        }}
      />

      {/* Center dot */}
      <LinearGradient
        colors={variant === 'onDark' ? ['#FFFFFF', 'rgba(255,255,255,0.80)'] : ['#4B50F8', '#8B4DFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width:        inner,
          height:       inner,
          borderRadius: inner / 2,
          shadowColor:  variant === 'onDark' ? '#FFFFFF' : '#4B50F8',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.80,
          shadowRadius:  3,
          elevation:     3,
        }}
      />
    </View>
  );
}
