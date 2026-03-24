import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/auth.store';

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

// ─── Data ─────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: 'How does anonymity work?', a: 'Your identity is protected by default. Other students see your handle and reputation tier, but never your real name or email. Only your university verification status is visible.' },
  { q: 'Can my university see my posts?', a: 'No. Circulum does not share any user content or identity information with universities. Your school email is only used for verification and is never linked to your posts.' },
  { q: 'How do I earn XP and level up?', a: 'You earn XP by posting (+10), replying (+5), receiving upvotes (+1 each), and maintaining daily streaks (+10/day). Higher tiers unlock additional features and recognition.' },
  { q: 'What happens if I get reported?', a: 'Reports are reviewed by our moderation team. If a post violates community guidelines, it may be removed. Repeated violations can result in temporary or permanent suspension.' },
  { q: 'Can I change my anonymous handle?', a: 'You can change your handle once every 30 days from Edit Profile in Settings. Your previous handle will not be visible to other users.' },
  { q: 'How do I delete my account?', a: 'Go to Settings → Account Actions → Delete Account. This permanently erases all your data including posts, comments, and reputation. This action cannot be undone.' },
  { q: 'Is my data encrypted?', a: 'Yes. All data is encrypted in transit (TLS) and at rest. Direct messages use end-to-end encryption. We follow industry-standard security practices.' },
  { q: 'How do I report a bug?', a: 'Go to Settings → Support & Trust → Report a Problem. Describe the issue and our team will investigate within 48 hours.' },
];

const GUIDELINES = [
  { title: 'Be Respectful', body: 'Treat everyone with dignity. No harassment, bullying, hate speech, or personal attacks. Disagreement is fine — cruelty is not.' },
  { title: 'Keep It Honest', body: 'Don\'t impersonate others, spread misinformation, or misrepresent your identity. Academic integrity applies here too.' },
  { title: 'Protect Privacy', body: 'Never share someone else\'s personal information (names, photos, contact details) without their consent. Doxxing results in immediate suspension.' },
  { title: 'Stay On Topic', body: 'Post in relevant communities. Off-topic spam, excessive self-promotion, and repetitive content clutter the experience for everyone.' },
  { title: 'No Illegal Content', body: 'Don\'t post content that violates local laws, promotes illegal activities, or facilitates academic dishonesty like exam cheating.' },
  { title: 'Report, Don\'t Retaliate', body: 'If you see something that breaks these guidelines, use the report button. Vigilante moderation makes things worse.' },
  { title: 'Consequences', body: 'Violations may result in content removal, temporary muting, or permanent account suspension depending on severity and history.' },
];

const TOS_SECTIONS = [
  { title: 'Acceptance of Terms', body: 'By creating an account or using Circulum, you agree to these Terms of Service. If you do not agree, please do not use the app.' },
  { title: 'Eligibility', body: 'You must be enrolled at a participating university with a valid .edu email address. You must be at least 17 years old to use Circulum.' },
  { title: 'Your Account', body: 'You are responsible for maintaining the security of your account. You may not share your login credentials or let others access your account. One account per person.' },
  { title: 'User Content', body: 'You retain ownership of content you post. By posting, you grant Circulum a license to display, distribute, and moderate your content within the platform. You are responsible for what you post.' },
  { title: 'Prohibited Conduct', body: 'You may not use Circulum to harass, spam, impersonate, hack, scrape data, distribute malware, or violate any applicable laws. See Community Guidelines for details.' },
  { title: 'Moderation', body: 'Circulum reserves the right to remove content and suspend accounts that violate these terms or community guidelines, at our sole discretion.' },
  { title: 'Disclaimers', body: 'Circulum is provided "as is" without warranties. We do not guarantee uninterrupted service, accuracy of user-generated content, or fitness for any particular purpose.' },
  { title: 'Limitation of Liability', body: 'Circulum shall not be liable for indirect, incidental, or consequential damages arising from your use of the platform.' },
  { title: 'Changes to Terms', body: 'We may update these terms from time to time. Continued use after changes constitutes acceptance of the new terms.' },
];

const PRIVACY_SECTIONS = [
  { title: 'Information We Collect', body: 'We collect your university email (for verification only), chosen handle, profile information you provide, and content you post. We also collect usage data like app interactions and device information.' },
  { title: 'How We Use Your Data', body: 'Your data is used to provide the service, verify university enrollment, personalize your feed, deliver notifications, and improve the platform. We never sell your personal data.' },
  { title: 'Anonymity', body: 'Your real identity is separated from your public profile. Other users see only your handle and tier. Your email is used solely for verification and account recovery.' },
  { title: 'Data Storage & Security', body: 'Data is stored on encrypted servers. We use TLS for data in transit and AES-256 for data at rest. Access to user data is restricted to authorized personnel.' },
  { title: 'Third-Party Sharing', body: 'We do not share your personal information with third parties except as required by law, or with service providers who help operate the platform under strict data protection agreements.' },
  { title: 'Your Rights', body: 'You can access, correct, or delete your data at any time through Settings. You can export your data or request complete account deletion.' },
  { title: 'Data Retention', body: 'Account data is retained while your account is active. After deletion, data is purged within 30 days. Anonymized, aggregated data may be retained for analytics.' },
  { title: 'Contact', body: 'For privacy concerns, contact privacy@circulum.app. We respond to all inquiries within 72 hours.' },
];

const REPORT_CATEGORIES = [
  { id: 'bug', label: 'Bug / Crash', icon: 'bug-outline' },
  { id: 'ui', label: 'UI Issue', icon: 'phone-portrait-outline' },
  { id: 'perf', label: 'Slow / Laggy', icon: 'speedometer-outline' },
  { id: 'content', label: 'Content Issue', icon: 'document-outline' },
  { id: 'account', label: 'Account Problem', icon: 'person-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

// ─── Reusable row components ──────────────────────────────────────────────────

function ToggleRow({ icon, title, subtitle, value, onToggle, color }: {
  icon: string; title: string; subtitle?: string;
  value: boolean; onToggle: () => void; color?: string;
}) {
  const c = color ?? T.accentBlue;
  return (
    <View style={r.row}>
      <View style={[r.iconCircle, { backgroundColor: c + '10' }]}>
        <Ionicons name={icon as any} size={16} color={c} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={r.title}>{title}</Text>
        {subtitle && <Text style={r.subtitle}>{subtitle}</Text>}
      </View>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <View style={[r.toggle, value && { backgroundColor: T.accentPurple }]}>
          <View style={[r.toggleKnob, value && r.toggleKnobOn]} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

function NavRow({ icon, title, subtitle, value, onPress, color, danger }: {
  icon: string; title: string; subtitle?: string; value?: string;
  onPress: () => void; color?: string; danger?: boolean;
}) {
  const c = danger ? T.accentPink : (color ?? T.accentBlue);
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={r.row}>
      <View style={[r.iconCircle, { backgroundColor: c + '10' }]}>
        <Ionicons name={icon as any} size={16} color={c} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[r.title, danger && { color: T.accentPink }]}>{title}</Text>
        {subtitle && <Text style={r.subtitle}>{subtitle}</Text>}
      </View>
      {value && <Text style={r.valueText}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={danger ? T.accentPink + '60' : T.textMuted} />
    </TouchableOpacity>
  );
}

const r = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13,
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '600', color: T.textPrimary },
  subtitle: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  valueText: { fontSize: 12, fontWeight: '600', color: T.textMuted, marginRight: 2 },
  toggle: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(17,17,17,0.08)',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleKnob: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2,
  },
  toggleKnobOn: { alignSelf: 'flex-end' },
});

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sc.shadow}>
      <View style={sc.card}>
        <Text style={sc.title}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  shadow: {
    marginHorizontal: 22, borderRadius: 22,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  card: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.68)',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6,
  },
  title: {
    fontSize: 11, fontWeight: '700', color: T.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
});

// ─── Subsection label ─────────────────────────────────────────────────────────

function SubLabel({ text }: { text: string }) {
  return <Text style={sub.label}>{text}</Text>;
}

const sub = StyleSheet.create({
  label: {
    fontSize: 10, fontWeight: '700', color: T.accentPurple,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginTop: 10, marginBottom: 2, marginLeft: 48,
  },
});

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <View style={{ height: 1, backgroundColor: 'rgba(17,17,17,0.05)', marginLeft: 48 }} />;
}

// ─── Helper: mask email ───────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'•'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

// ─── FAQ Item (expandable) ────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setOpen(!open)} activeOpacity={0.7} style={r.row}>
        <View style={[r.iconCircle, { backgroundColor: T.accentPurple + '10' }]}>
          <Ionicons name="help-circle-outline" size={16} color={T.accentPurple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={r.title}>{q}</Text>
          {open && <Text style={[r.subtitle, { marginTop: 6, lineHeight: 18 }]}>{a}</Text>}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={T.textMuted} />
      </TouchableOpacity>
      <Divider />
    </>
  );
}

// ─── Empty list state ─────────────────────────────────────────────────────────

function EmptyList({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={el.wrap}>
      <View style={el.iconWrap}>
        <Ionicons name={icon as any} size={40} color={T.textMuted + '40'} />
      </View>
      <Text style={el.title}>{title}</Text>
      <Text style={el.subtitle}>{subtitle}</Text>
    </View>
  );
}

const el = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(17,17,17,0.03)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '700', color: T.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 13, color: T.textMuted, textAlign: 'center', lineHeight: 20 },
});

// ─── Legal section renderer ──────────────────────────────────────────────────

function LegalSections({ sections }: { sections: { title: string; body: string }[] }) {
  return (
    <>
      {sections.map((s, i) => (
        <SectionCard key={i} title={s.title}>
          <Text style={lg.body}>{s.body}</Text>
          <View style={{ height: 10 }} />
        </SectionCard>
      ))}
    </>
  );
}

const lg = StyleSheet.create({
  body: { fontSize: 13, lineHeight: 21, color: T.textSecondary },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // ─── Modal state ────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // ─── Notification toggles ──────────────────────────────────
  const [replyNotifs, setReplyNotifs] = useState(true);
  const [mentionNotifs, setMentionNotifs] = useState(true);
  const [pollResults, setPollResults] = useState(true);
  const [dmNotifs, setDmNotifs] = useState(true);
  const [buddyRequests, setBuddyRequests] = useState(true);
  const [communityInvites, setCommunityInvites] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);

  // ─── Privacy toggles ──────────────────────────────────────
  const [hideActivity, setHideActivity] = useState(false);
  const [studyBuddyVisible, setStudyBuddyVisible] = useState(true);

  // ─── Picker values ────────────────────────────────────────
  const [dmAccess, setDmAccess] = useState('Everyone');
  const [profileVisibility, setProfileVisibility] = useState('Campus');

  // ─── Preferences toggles ─────────────────────────────────
  const [darkMode, setDarkMode] = useState(false);
  const [haptics, setHaptics] = useState(true);

  // ─── Content preference toggles ───────────────────────────
  const [filterNSFW, setFilterNSFW] = useState(true);
  const [filterPolitics, setFilterPolitics] = useState(false);
  const [filterMemes, setFilterMemes] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [autoImages, setAutoImages] = useState(true);

  // ─── Account security form ────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // ─── Report form ──────────────────────────────────────────
  const [reportCategory, setReportCategory] = useState('');
  const [reportText, setReportText] = useState('');

  // ─── Alert pickers ────────────────────────────────────────

  const pickDmAccess = () => {
    Alert.alert('Who Can Message Me', 'Choose who can send you direct messages', [
      { text: 'Everyone', onPress: () => setDmAccess('Everyone') },
      { text: 'Campus Only', onPress: () => setDmAccess('Campus') },
      { text: 'Nobody', onPress: () => setDmAccess('Nobody') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickProfileVisibility = () => {
    Alert.alert('Profile Visibility', 'Choose who can see your profile', [
      { text: 'Everyone', onPress: () => setProfileVisibility('Everyone') },
      { text: 'Campus Only', onPress: () => setProfileVisibility('Campus') },
      { text: 'Private', onPress: () => setProfileVisibility('Private') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickLanguage = () => {
    Alert.alert('Language', 'More languages coming soon!', [
      { text: 'English (Default)', style: 'cancel' },
    ]);
  };

  // ─── Handlers ─────────────────────────────────────────────

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Too Short', 'New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    Alert.alert('Password Updated', 'Your password has been changed successfully.');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setActiveModal(null);
  };

  const handleSubmitReport = () => {
    if (!reportCategory) {
      Alert.alert('Select Category', 'Please select a problem category.');
      return;
    }
    if (!reportText.trim()) {
      Alert.alert('Add Details', 'Please describe the issue.');
      return;
    }
    Alert.alert('Report Submitted', 'Thanks for letting us know. We\'ll look into it.', [
      {
        text: 'OK',
        onPress: () => {
          setReportCategory('');
          setReportText('');
          setActiveModal(null);
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/(auth)/welcome'); },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account?',
      'This will permanently erase all your posts, comments, reputation, and account data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I understand, delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This is your last chance. All data will be permanently deleted.',
              [
                { text: 'Go back', style: 'cancel' },
                {
                  text: 'Confirm Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await logout();
                    router.replace('/(auth)/welcome');
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const insets = useSafeAreaInsets();
  const email = user ? `${user.handle.toLowerCase()}@${user.university?.emailDomain ?? 'mail.utoronto.ca'}` : 'student@mail.utoronto.ca';

  // ─── Modal title helper ───────────────────────────────────
  const modalTitle: Record<string, string> = {
    security: 'Account Security',
    content: 'Content Preferences',
    help: 'Help Centre',
    report: 'Report a Problem',
    guidelines: 'Community Guidelines',
    tos: 'Terms of Service',
    privacy: 'Privacy Policy',
    blocked: 'Blocked Users',
    muted: 'Muted Topics',
  };

  return (
    <LinearGradient colors={BG} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={ui.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={ui.navBtn}>
            <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
          </TouchableOpacity>
          <Text style={ui.headerTitle}>Settings</Text>
          <View style={ui.navBtnSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50, gap: 16 }}>

          {/* ═══ SECTION 1: Account & Identity ═══ */}
          <SectionCard title="Account & Identity">
            <NavRow
              icon="person-outline" title="Edit Profile"
              subtitle="Handle, bio, major, year, interests"
              onPress={() => router.push('/edit-profile' as any)}
              color={T.accentPurple}
            />
            <Divider />
            <View style={r.row}>
              <View style={[r.iconCircle, { backgroundColor: T.accentGreen + '10' }]}>
                <Ionicons name="shield-checkmark" size={16} color={T.accentGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={r.title}>Verified University</Text>
                  <View style={ui.verifiedBadge}>
                    <Ionicons name="checkmark" size={9} color={T.white} />
                  </View>
                </View>
                <Text style={r.subtitle}>{user?.university?.name ?? 'University of Toronto'}</Text>
              </View>
            </View>
            <Divider />
            <View style={r.row}>
              <View style={[r.iconCircle, { backgroundColor: T.accentBlue + '10' }]}>
                <Ionicons name="mail-outline" size={16} color={T.accentBlue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={r.title}>School Email</Text>
                <Text style={r.subtitle}>{maskEmail(email)}</Text>
              </View>
              <View style={ui.verifiedPill}>
                <Ionicons name="checkmark-circle" size={11} color={T.accentGreen} />
                <Text style={ui.verifiedPillText}>Verified</Text>
              </View>
            </View>
            <Divider />
            <NavRow
              icon="lock-closed-outline" title="Account Security"
              subtitle="Password, login sessions"
              onPress={() => setActiveModal('security')}
              color={T.textSecondary}
            />
          </SectionCard>

          {/* ═══ SECTION 2: Notifications ═══ */}
          <SectionCard title="Notifications">
            <SubLabel text="Activity" />
            <ToggleRow
              icon="chatbubble-outline" title="Replies to My Posts"
              subtitle="When someone responds to your content"
              value={replyNotifs} onToggle={() => setReplyNotifs(!replyNotifs)}
              color={T.accentPurple}
            />
            <Divider />
            <ToggleRow
              icon="at-outline" title="Mentions"
              subtitle="When you're tagged in a discussion"
              value={mentionNotifs} onToggle={() => setMentionNotifs(!mentionNotifs)}
              color={T.accentPurple}
            />
            <Divider />
            <ToggleRow
              icon="stats-chart-outline" title="Poll Results"
              subtitle="Updates when polls you voted in close"
              value={pollResults} onToggle={() => setPollResults(!pollResults)}
              color={T.accentOrange}
            />

            <SubLabel text="Social" />
            <ToggleRow
              icon="paper-plane-outline" title="Direct Messages"
              subtitle="New message notifications"
              value={dmNotifs} onToggle={() => setDmNotifs(!dmNotifs)}
              color={T.accentBlue}
            />
            <Divider />
            <ToggleRow
              icon="people-outline" title="Study Buddy Requests"
              subtitle="When someone wants to study with you"
              value={buddyRequests} onToggle={() => setBuddyRequests(!buddyRequests)}
              color={T.accentPurple}
            />
            <Divider />
            <ToggleRow
              icon="enter-outline" title="Community Invites"
              subtitle="Invitations to join communities"
              value={communityInvites} onToggle={() => setCommunityInvites(!communityInvites)}
              color={T.accentBlue}
            />

            <SubLabel text="Summary" />
            <ToggleRow
              icon="mail-outline" title="Email Digest"
              subtitle="Weekly summary of campus activity"
              value={emailDigest} onToggle={() => setEmailDigest(!emailDigest)}
            />
            <Divider />
            <ToggleRow
              icon="calendar-outline" title="Weekly Activity Summary"
              subtitle="Your contribution recap every Monday"
              value={weeklySummary} onToggle={() => setWeeklySummary(!weeklySummary)}
            />
          </SectionCard>

          {/* ═══ SECTION 3: Privacy & Safety ═══ */}
          <SectionCard title="Privacy & Safety">
            <ToggleRow
              icon="eye-off-outline" title="Hide Activity Status"
              subtitle="Others can't see when you're online"
              value={hideActivity} onToggle={() => setHideActivity(!hideActivity)}
              color={T.accentPurple}
            />
            <Divider />
            <NavRow
              icon="chatbubbles-outline" title="Who Can Message Me"
              subtitle="Control who can send you DMs"
              value={dmAccess}
              onPress={pickDmAccess}
              color={T.accentBlue}
            />
            <Divider />
            <NavRow
              icon="globe-outline" title="Profile Visibility"
              subtitle="Who can see your profile"
              value={profileVisibility}
              onPress={pickProfileVisibility}
              color={T.accentBlue}
            />
            <Divider />
            <ToggleRow
              icon="people-outline" title="Appear in Study Buddy"
              subtitle="Let others discover you for study matching"
              value={studyBuddyVisible} onToggle={() => setStudyBuddyVisible(!studyBuddyVisible)}
              color={T.accentGreen}
            />
            <Divider />
            <NavRow
              icon="ban-outline" title="Blocked Users"
              subtitle="Manage your block list"
              value="0"
              onPress={() => setActiveModal('blocked')}
              color={T.textMuted}
            />
            <Divider />
            <NavRow
              icon="volume-mute-outline" title="Muted Topics"
              subtitle="Hide content from specific topics"
              value="None"
              onPress={() => setActiveModal('muted')}
              color={T.textMuted}
            />
          </SectionCard>

          {/* ═══ SECTION 4: Preferences ═══ */}
          <SectionCard title="Preferences">
            <ToggleRow
              icon="moon-outline" title="Dark Mode"
              subtitle="Switch to dark theme"
              value={darkMode} onToggle={() => setDarkMode(!darkMode)}
              color={T.accentPurple}
            />
            <Divider />
            <ToggleRow
              icon="phone-portrait-outline" title="Haptic Feedback"
              subtitle="Vibrations on interactions"
              value={haptics} onToggle={() => setHaptics(!haptics)}
            />
            <Divider />
            <NavRow
              icon="language-outline" title="Language"
              value="English"
              onPress={pickLanguage}
              color={T.accentBlue}
            />
            <Divider />
            <NavRow
              icon="options-outline" title="Content Preferences"
              subtitle="Hidden topics, content filters"
              onPress={() => setActiveModal('content')}
              color={T.textSecondary}
            />
          </SectionCard>

          {/* ═══ SECTION 5: Support & Trust ═══ */}
          <SectionCard title="Support & Trust">
            <NavRow
              icon="help-circle-outline" title="Help Centre"
              subtitle="FAQs and troubleshooting"
              onPress={() => setActiveModal('help')}
            />
            <Divider />
            <NavRow
              icon="flag-outline" title="Report a Problem"
              subtitle="Let us know what went wrong"
              onPress={() => setActiveModal('report')}
              color={T.accentOrange}
            />
            <Divider />
            <NavRow
              icon="people-circle-outline" title="Community Guidelines"
              subtitle="How we keep campus safe"
              onPress={() => setActiveModal('guidelines')}
              color={T.accentPurple}
            />
            <Divider />
            <NavRow
              icon="document-text-outline" title="Terms of Service"
              onPress={() => setActiveModal('tos')}
              color={T.textMuted}
            />
            <Divider />
            <NavRow
              icon="shield-outline" title="Privacy Policy"
              onPress={() => setActiveModal('privacy')}
              color={T.textMuted}
            />
          </SectionCard>

          {/* ═══ SECTION 6: Account Actions ═══ */}
          <View style={{ height: 8 }} />
          <SectionCard title="Account Actions">
            <NavRow
              icon="log-out-outline" title="Log Out"
              subtitle="Sign out of your account"
              onPress={handleLogout}
              danger
            />
            <Divider />
            <NavRow
              icon="trash-outline" title="Delete Account"
              subtitle="Permanently erase all data — irreversible"
              onPress={handleDeleteAccount}
              danger
            />
          </SectionCard>

          <Text style={ui.version}>Circulum v0.1.0</Text>
        </ScrollView>
      </SafeAreaView>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SETTINGS MODAL                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={activeModal !== null} animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <LinearGradient colors={BG} style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingTop: insets.top }}>
            <View style={ui.header}>
              <TouchableOpacity onPress={() => setActiveModal(null)} activeOpacity={0.7} style={ui.navBtn}>
                <Ionicons name="chevron-back" size={20} color={T.textSecondary} />
              </TouchableOpacity>
              <Text style={ui.headerTitle}>{activeModal ? modalTitle[activeModal] ?? '' : ''}</Text>
              <View style={ui.navBtnSpacer} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 50, gap: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* ─── Account Security ─────────────────────────────── */}
              {activeModal === 'security' && (
                <>
                  {/* Hero */}
                  <View style={sec.hero}>
                    <LinearGradient colors={['rgba(75,80,248,0.10)', 'rgba(139,77,255,0.06)']} style={sec.heroIcon}>
                      <Ionicons name="shield-checkmark" size={32} color={T.accentBlue} />
                    </LinearGradient>
                    <Text style={sec.heroTitle}>Keep your account safe</Text>
                    <Text style={sec.heroSub}>Use a strong, unique password and review your active sessions regularly.</Text>
                  </View>

                  {/* Change Password */}
                  <SectionCard title="Change Password">
                    <View style={m.inputGroup}>
                      <View style={sec.inputRow}>
                        <View style={sec.inputIcon}>
                          <Ionicons name="lock-closed-outline" size={16} color={T.textMuted} />
                        </View>
                        <TextInput
                          style={sec.input}
                          placeholder="Current password"
                          placeholderTextColor={T.textMuted}
                          secureTextEntry={!showCurrentPw}
                          value={currentPw}
                          onChangeText={setCurrentPw}
                        />
                        <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Ionicons name={showCurrentPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={T.textMuted} />
                        </TouchableOpacity>
                      </View>

                      <View style={sec.inputRow}>
                        <View style={sec.inputIcon}>
                          <Ionicons name="key-outline" size={16} color={T.textMuted} />
                        </View>
                        <TextInput
                          style={sec.input}
                          placeholder="New password"
                          placeholderTextColor={T.textMuted}
                          secureTextEntry={!showNewPw}
                          value={newPw}
                          onChangeText={setNewPw}
                        />
                        <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Ionicons name={showNewPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={T.textMuted} />
                        </TouchableOpacity>
                      </View>

                      {/* Password strength bar */}
                      {newPw.length > 0 && (
                        <View style={sec.strengthWrap}>
                          <View style={sec.strengthTrack}>
                            {[0, 1, 2, 3].map((i) => {
                              const strength = (newPw.length >= 12 ? 1 : 0) + (/[A-Z]/.test(newPw) ? 1 : 0) + (/[0-9]/.test(newPw) ? 1 : 0) + (/[^A-Za-z0-9]/.test(newPw) ? 1 : 0);
                              const colors = [T.accentPink, T.accentOrange, T.accentBlue, T.accentGreen];
                              return (
                                <View
                                  key={i}
                                  style={[sec.strengthSeg, { backgroundColor: i < strength ? colors[Math.min(strength - 1, 3)] : 'rgba(17,17,17,0.06)' }]}
                                />
                              );
                            })}
                          </View>
                          <Text style={[sec.strengthLabel, {
                            color: (() => {
                              const s = (newPw.length >= 12 ? 1 : 0) + (/[A-Z]/.test(newPw) ? 1 : 0) + (/[0-9]/.test(newPw) ? 1 : 0) + (/[^A-Za-z0-9]/.test(newPw) ? 1 : 0);
                              return [T.accentPink, T.accentOrange, T.accentBlue, T.accentGreen][Math.min(Math.max(s - 1, 0), 3)];
                            })(),
                          }]}>
                            {(() => {
                              const s = (newPw.length >= 12 ? 1 : 0) + (/[A-Z]/.test(newPw) ? 1 : 0) + (/[0-9]/.test(newPw) ? 1 : 0) + (/[^A-Za-z0-9]/.test(newPw) ? 1 : 0);
                              return ['Weak', 'Fair', 'Good', 'Strong'][Math.min(Math.max(s - 1, 0), 3)];
                            })()}
                          </Text>
                        </View>
                      )}

                      <View style={sec.inputRow}>
                        <View style={sec.inputIcon}>
                          <Ionicons name="checkmark-circle-outline" size={16} color={confirmPw.length > 0 && confirmPw === newPw ? T.accentGreen : T.textMuted} />
                        </View>
                        <TextInput
                          style={sec.input}
                          placeholder="Confirm new password"
                          placeholderTextColor={T.textMuted}
                          secureTextEntry
                          value={confirmPw}
                          onChangeText={setConfirmPw}
                        />
                        {confirmPw.length > 0 && (
                          <Ionicons
                            name={confirmPw === newPw ? 'checkmark-circle' : 'close-circle'}
                            size={18}
                            color={confirmPw === newPw ? T.accentGreen : T.accentPink}
                          />
                        )}
                      </View>
                    </View>

                    <TouchableOpacity activeOpacity={0.85} onPress={handleChangePassword} style={{ borderRadius: 16, overflow: 'hidden', marginTop: 6, marginBottom: 10 }}>
                      <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={m.ctaBtn}>
                        <Ionicons name="lock-closed" size={16} color={T.white} />
                        <Text style={m.ctaBtnText}>Update Password</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </SectionCard>

                  {/* Active Sessions */}
                  <SectionCard title="Active Sessions">
                    <View style={sec.sessionRow}>
                      <View style={sec.sessionIcon}>
                        <Ionicons name="phone-portrait" size={18} color={T.accentGreen} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={r.title}>iPhone</Text>
                          <View style={sec.activeBadge}>
                            <View style={m.activeDot} />
                            <Text style={sec.activeText}>Active</Text>
                          </View>
                        </View>
                        <Text style={r.subtitle}>Circulum for iOS · This device</Text>
                        <Text style={[r.subtitle, { fontSize: 10, color: T.textMuted + '90' }]}>Last active: Just now</Text>
                      </View>
                    </View>
                  </SectionCard>

                  {/* Security Tips */}
                  <SectionCard title="Security Tips">
                    {[
                      { icon: 'key-outline', text: 'Use a mix of letters, numbers, and symbols', color: T.accentBlue },
                      { icon: 'time-outline', text: 'Change your password every 3-6 months', color: T.accentPurple },
                      { icon: 'ban-outline', text: 'Never share your password with anyone', color: T.accentPink },
                      { icon: 'finger-print-outline', text: 'Two-factor authentication coming soon', color: T.accentGreen },
                    ].map((tip, i) => (
                      <React.Fragment key={i}>
                        <View style={sec.tipRow}>
                          <View style={[sec.tipIcon, { backgroundColor: tip.color + '10' }]}>
                            <Ionicons name={tip.icon as any} size={14} color={tip.color} />
                          </View>
                          <Text style={sec.tipText}>{tip.text}</Text>
                        </View>
                        {i < 3 && <Divider />}
                      </React.Fragment>
                    ))}
                  </SectionCard>
                </>
              )}

              {/* ─── Content Preferences ──────────────────────────── */}
              {activeModal === 'content' && (
                <>
                  <SectionCard title="Content Filters">
                    <ToggleRow
                      icon="eye-off-outline" title="Hide NSFW Content"
                      subtitle="Blur or hide sensitive content"
                      value={filterNSFW} onToggle={() => setFilterNSFW(!filterNSFW)}
                      color={T.accentPink}
                    />
                    <Divider />
                    <ToggleRow
                      icon="megaphone-outline" title="Hide Political Content"
                      subtitle="Filter political discussions from feed"
                      value={filterPolitics} onToggle={() => setFilterPolitics(!filterPolitics)}
                      color={T.accentOrange}
                    />
                    <Divider />
                    <ToggleRow
                      icon="happy-outline" title="Hide Meme Posts"
                      subtitle="Less memes, more academics"
                      value={filterMemes} onToggle={() => setFilterMemes(!filterMemes)}
                      color={T.accentPurple}
                    />
                  </SectionCard>

                  <SectionCard title="Feed Display">
                    <ToggleRow
                      icon="resize-outline" title="Compact Post View"
                      subtitle="Show more posts with less spacing"
                      value={compactView} onToggle={() => setCompactView(!compactView)}
                    />
                    <Divider />
                    <ToggleRow
                      icon="image-outline" title="Auto-load Images"
                      subtitle="Automatically display images in posts"
                      value={autoImages} onToggle={() => setAutoImages(!autoImages)}
                      color={T.accentGreen}
                    />
                  </SectionCard>
                </>
              )}

              {/* ─── Help Centre ──────────────────────────────────── */}
              {activeModal === 'help' && (
                <SectionCard title="Frequently Asked Questions">
                  {FAQS.map((faq, i) => (
                    <FAQItem key={i} q={faq.q} a={faq.a} />
                  ))}
                </SectionCard>
              )}

              {/* ─── Report a Problem ─────────────────────────────── */}
              {activeModal === 'report' && (
                <>
                  <SectionCard title="What went wrong?">
                    <View style={m.pillGrid}>
                      {REPORT_CATEGORIES.map((cat) => {
                        const active = reportCategory === cat.id;
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            activeOpacity={0.7}
                            onPress={() => setReportCategory(cat.id)}
                            style={[m.pill, active && m.pillActive]}
                          >
                            <Ionicons
                              name={cat.icon as any}
                              size={14}
                              color={active ? T.white : T.textSecondary}
                            />
                            <Text style={[m.pillText, active && m.pillTextActive]}>
                              {cat.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <View style={{ height: 6 }} />
                  </SectionCard>

                  <SectionCard title="Describe the Issue">
                    <TextInput
                      style={m.textarea}
                      placeholder="Tell us what happened..."
                      placeholderTextColor={T.textMuted}
                      value={reportText}
                      onChangeText={setReportText}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                    />
                    <TouchableOpacity activeOpacity={0.85} onPress={handleSubmitReport} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 4, marginBottom: 10 }}>
                      <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={m.ctaBtn}>
                        <Ionicons name="send-outline" size={16} color={T.white} />
                        <Text style={m.ctaBtnText}>Submit Report</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </SectionCard>
                </>
              )}

              {/* ─── Community Guidelines ─────────────────────────── */}
              {activeModal === 'guidelines' && (
                <>
                  <View style={m.legalIntro}>
                    <View style={m.legalIntroIcon}>
                      <Ionicons name="people-circle" size={28} color={T.accentPurple} />
                    </View>
                    <Text style={m.legalIntroText}>
                      Circulum is built on trust and respect. These guidelines help keep our campus community safe and welcoming for everyone.
                    </Text>
                  </View>
                  <LegalSections sections={GUIDELINES} />
                </>
              )}

              {/* ─── Terms of Service ─────────────────────────────── */}
              {activeModal === 'tos' && (
                <>
                  <View style={m.legalIntro}>
                    <View style={m.legalIntroIcon}>
                      <Ionicons name="document-text" size={28} color={T.accentBlue} />
                    </View>
                    <Text style={m.legalIntroText}>
                      Last updated: March 2026. By using Circulum you agree to the following terms.
                    </Text>
                  </View>
                  <LegalSections sections={TOS_SECTIONS} />
                </>
              )}

              {/* ─── Privacy Policy ───────────────────────────────── */}
              {activeModal === 'privacy' && (
                <>
                  <View style={m.legalIntro}>
                    <View style={m.legalIntroIcon}>
                      <Ionicons name="shield-checkmark" size={28} color={T.accentGreen} />
                    </View>
                    <Text style={m.legalIntroText}>
                      Your privacy matters. Here is how Circulum collects, uses, and protects your data.
                    </Text>
                  </View>
                  <LegalSections sections={PRIVACY_SECTIONS} />
                </>
              )}

              {/* ─── Blocked Users ────────────────────────────────── */}
              {activeModal === 'blocked' && (
                <EmptyList
                  icon="ban-outline"
                  title="No blocked users"
                  subtitle="Users you block won't be able to see your posts or message you. You can block someone from their profile."
                />
              )}

              {/* ─── Muted Topics ─────────────────────────────────── */}
              {activeModal === 'muted' && (
                <EmptyList
                  icon="volume-mute-outline"
                  title="No muted topics"
                  subtitle="Mute topics you don't want to see in your feed. You can mute a topic by tapping the three-dot menu on any post."
                />
              )}
            </ScrollView>
          </View>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

// ─── Main UI styles ───────────────────────────────────────────────────────────
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
  navBtnSpacer: { width: 38 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.3 },
  verifiedBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: T.accentGreen,
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
    backgroundColor: T.accentGreen + '10',
  },
  verifiedPillText: { fontSize: 10, fontWeight: '700', color: T.accentGreen },
  version: { textAlign: 'center', fontSize: 11, color: T.textMuted, marginTop: 4 },
});

// ─── Modal content styles ─────────────────────────────────────────────────────
const m = StyleSheet.create({
  inputGroup: { gap: 10, marginVertical: 8 },
  input: {
    height: 46, borderRadius: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
    fontSize: 14, color: T.textPrimary,
  },
  ctaBtn: {
    height: 48, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: T.white },
  activeDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: T.accentGreen,
  },
  pillGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
  },
  pillActive: {
    backgroundColor: T.accentPurple,
    borderColor: T.accentPurple,
  },
  pillText: { fontSize: 13, fontWeight: '600', color: T.textSecondary },
  pillTextActive: { color: T.white },
  textarea: {
    minHeight: 120, borderRadius: 14, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
    fontSize: 14, color: T.textPrimary, lineHeight: 22,
    marginVertical: 8,
  },
  legalIntro: {
    marginHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 8,
  },
  legalIntroIcon: {
    width: 48, height: 48, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  legalIntroText: {
    flex: 1, fontSize: 13, lineHeight: 20, color: T.textSecondary,
  },
});

// ─── Account Security styles ──────────────────────────────────────────────────
const sec = StyleSheet.create({
  hero: {
    alignItems: 'center', paddingVertical: 20, paddingHorizontal: 22, gap: 10,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 13, lineHeight: 20, color: T.textMuted, textAlign: 'center',
    paddingHorizontal: 10,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    height: 50, borderRadius: 16, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.60)',
  },
  inputIcon: {
    width: 28, alignItems: 'center',
  },
  input: {
    flex: 1, height: 50, fontSize: 14, color: T.textPrimary,
  },
  strengthWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 4,
  },
  strengthTrack: {
    flex: 1, flexDirection: 'row', gap: 4,
  },
  strengthSeg: {
    flex: 1, height: 4, borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11, fontWeight: '700', minWidth: 40,
  },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14,
  },
  sessionIcon: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: T.accentGreen + '10',
    alignItems: 'center', justifyContent: 'center',
  },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99,
    backgroundColor: T.accentGreen + '12',
  },
  activeText: {
    fontSize: 10, fontWeight: '700', color: T.accentGreen,
  },
  tipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
  },
  tipIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  tipText: {
    flex: 1, fontSize: 13, fontWeight: '500', color: T.textSecondary, lineHeight: 19,
  },
});
