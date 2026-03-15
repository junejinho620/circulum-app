// ─── Circulum Design System ───────────────────────────────────────────────────
// Soft-gradient glassmorphism • premium campus social

// ─── Colors ───────────────────────────────────────────────────────────────────
export const Colors = {
  // Background gradient stops
  bgTop: '#F4CBD9',
  bgMid: '#E9E1F6',
  bgBottom: '#D7E6FF',

  // Glass / surface
  surfaceGlass: 'rgba(255, 255, 255, 0.58)',
  surfaceGlassStrong: 'rgba(255, 255, 255, 0.72)',
  surfaceCardSoft: '#F7F7FA',
  surfaceCardElevated: '#FFFFFF',
  surfaceDarkAlert: '#0D0D0F',

  // Backward-compat aliases (used by existing screens)
  background: '#F2E8F5',          // approximate mid of gradient
  surface: 'rgba(255,255,255,0.58)',
  surfaceElevated: 'rgba(255,255,255,0.72)',
  border: 'rgba(255,255,255,0.38)',
  borderLight: 'rgba(255,255,255,0.55)',

  // Text
  textPrimary: '#111111',
  textSecondary: '#5F6472',
  textMuted: '#8A90A2',
  textInverse: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Accents
  primary: '#4B50F8',            // ACCENT_BLUE
  primaryDark: '#3B3FD8',
  primaryLight: '#C7B8FF',       // ACCENT_LAVENDER
  accent: '#4F46E5',             // SUCCESS / upvote
  danger: '#E655C5',             // WARNING / downvote (pink)
  warning: '#E655C5',
  info: '#6B7CFF',
  accentPurple: '#8B4DFF',
  accentPink: '#E655C5',
  accentLavender: '#C7B8FF',
  accentSoftPink: '#F3D6E9',

  // Category colors (updated to match palette)
  category: {
    general: '#4B50F8',
    study: '#6B7CFF',
    meme: '#E655C5',
    event: '#8B4DFF',
    buy_sell: '#C7B8FF',
    lost_found: '#4B50F8',
  },

  // Borders / dividers
  borderSoft: 'rgba(255, 255, 255, 0.45)',
  dividerSoft: 'rgba(17, 17, 17, 0.06)',

  // Status
  online: '#4F46E5',
  offline: '#8A90A2',

  // Semantic
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// ─── Gradient helpers (pass directly to LinearGradient colors prop) ────────────
export const Gradients = {
  background: ['#F4CBD9', '#E9E1F6', '#D7E6FF'] as [string, string, string],
  primary: ['#4B50F8', '#8B4DFF', '#E655C5'] as [string, string, string],
  primaryH: ['#4B50F8', '#8B4DFF'] as [string, string],    // horizontal pill
  soft: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.18)'] as [string, string],
  glowPurple: ['rgba(139,77,255,0.22)', 'rgba(139,77,255,0.04)'] as [string, string],
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const Typography = {
  // Font sizes
  xs: 11,
  sm: 12,      // CAPTION
  base: 13,    // BODY_SM
  md: 15,      // BODY_MD
  lg: 17,      // BODY_LG
  xl: 20,      // TITLE_3
  xxl: 24,     // TITLE_2
  xxxl: 32,    // TITLE_1
  display: 40, // DISPLAY_LARGE

  // Line heights (multipliers)
  tight: 1.1,
  normal: 1.45,
  relaxed: 1.65,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,      // SPACE_4
  sm: 8,      // SPACE_8
  md: 12,     // SPACE_12
  base: 16,   // SPACE_16
  lg: 20,     // SPACE_20
  xl: 24,     // SPACE_24
  xxl: 32,    // SPACE_32
  xxxl: 40,   // SPACE_40
  huge: 48,   // SPACE_48
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const Radius = {
  xs: 8,
  sm: 12,     // RADIUS_SM
  md: 16,     // RADIUS_MD
  lg: 20,     // RADIUS_LG
  xl: 24,     // RADIUS_XL
  xxl: 28,    // RADIUS_2XL
  xxxl: 32,   // RADIUS_3XL
  full: 999,  // RADIUS_PILL
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
// React Native shadow props (iOS). Use elevation for Android.
export const Shadow = {
  sm: {
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  md: {
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
    elevation: 6,
  },
  lg: {
    shadowColor: '#5B608C',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 48,
    elevation: 10,
  },
  glow: {
    shadowColor: '#8B4DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ─── Glass card preset (spread into StyleSheet) ───────────────────────────────
export const GlassCard = {
  backgroundColor: Colors.surfaceGlass,
  borderRadius: Radius.xxl,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.38)',
  ...Shadow.md,
};
