import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable,
  TextInput, KeyboardAvoidingView, Platform, Animated, Dimensions,
  Modal, Alert, Clipboard,
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
  accentGreen:   '#3DAB73',
  accentOrange:  '#F1973B',
  accentRed:     '#E54545',
  white:         '#FFFFFF',
};

const BG:  [string, string, string] = ['#F4CBD9', '#E9E1F6', '#D7E6FF'];
const CTA: [string, string, string] = ['#4B50F8', '#8B4DFF', '#E655C5'];

const AVATAR_GRADS: [string, string][] = [
  ['#4B50F8', '#8B4DFF'], ['#8B4DFF', '#E655C5'], ['#6B7CFF', '#4B50F8'],
  ['#E655C5', '#C47EFF'], ['#C47EFF', '#6B7CFF'], ['#F1973B', '#E655C5'],
  ['#3DAB73', '#4D97FF'], ['#4D97FF', '#6B7CFF'],
];

// ─── Quick emoji reactions ──────────────────────────────────────────────────
const QUICK_REACTIONS = ['\u2764\uFE0F', '\uD83D\uDE02', '\uD83D\uDE2E', '\uD83D\uDC4D', '\uD83D\uDD25', '\uD83D\uDE22'];

// ─── Mock recipient data ─────────────────────────────────────────────────────
const RECIPIENTS: Record<string, {
  handle: string;
  initial: string;
  gradIdx: number;
  year: string;
  major: string;
  sharedCourses: string[];
  sharedInterests: string[];
  mutualFriends: number;
  availability: string;
}> = {
  '1': {
    handle: 'StudyGuru', initial: 'S', gradIdx: 0,
    year: '3rd Year', major: 'Computer Science',
    sharedCourses: ['CSC263', 'MAT237'],
    sharedInterests: ['Computer Science', 'Coffee'],
    mutualFriends: 4,
    availability: 'Free today 2-4 PM',
  },
  '2': {
    handle: 'CampusExplorer', initial: 'C', gradIdx: 1,
    year: '2nd Year', major: 'Psychology',
    sharedCourses: [],
    sharedInterests: [],
    mutualFriends: 2,
    availability: 'Usually responds within 1h',
  },
};

// ─── Mock messages ───────────────────────────────────────────────────────────
type ChatMessage = {
  id: string;
  text: string;
  isOwn: boolean;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  reaction?: string;
  replyTo?: { text: string; sender: string };
};

// ─── Overflow Menu ──────────────────────────────────────────────────────────
function OverflowMenu({
  visible, onClose, onAction,
}: {
  visible: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}) {
  if (!visible) return null;

  const items = [
    { key: 'profile', icon: 'person-outline', label: 'View Profile', color: T.textPrimary },
    { key: 'mute', icon: 'notifications-off-outline', label: 'Mute Notifications', color: T.textPrimary },
    { key: 'block', icon: 'ban-outline', label: 'Block User', color: T.accentRed },
    { key: 'report', icon: 'flag-outline', label: 'Report', color: T.accentRed },
    { key: 'clear', icon: 'trash-outline', label: 'Clear History', color: T.accentRed },
  ];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={om.backdrop} onPress={onClose}>
        <View style={om.menu}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              onPress={() => { onClose(); onAction(item.key); }}
              style={[om.item, i < items.length - 1 && om.itemBorder]}
            >
              <Ionicons name={item.icon as any} size={18} color={item.color} />
              <Text style={[om.itemText, { color: item.color }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const om = StyleSheet.create({
  backdrop: { flex: 1 },
  menu: {
    position: 'absolute', top: 100, right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
    minWidth: 200, overflow: 'hidden',
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(17,17,17,0.04)' },
  itemText: { fontSize: 14, fontWeight: '600' },
});

// ─── Long Press Message Actions ─────────────────────────────────────────────
function MessageActionsSheet({
  message, visible, onClose, onAction,
}: {
  message: ChatMessage | null;
  visible: boolean;
  onClose: () => void;
  onAction: (action: string, msg: ChatMessage) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 15 }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  if (!visible || !message) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={ma.backdrop} onPress={onClose}>
        <Animated.View style={[ma.sheet, { transform: [{ scale: scaleAnim }] }]}>
          {/* Quick reactions row */}
          <View style={ma.reactionsRow}>
            {QUICK_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => { onClose(); onAction(`react:${emoji}`, message); }}
                style={ma.reactionBtn}
              >
                <Text style={ma.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={ma.divider} />

          {/* Action buttons */}
          {[
            { key: 'reply', icon: 'arrow-undo-outline', label: 'Reply' },
            { key: 'copy', icon: 'copy-outline', label: 'Copy Text' },
            ...(message.isOwn
              ? [{ key: 'delete', icon: 'trash-outline', label: 'Delete Message' }]
              : [{ key: 'report', icon: 'flag-outline', label: 'Report Message' }]),
          ].map((action, i, arr) => (
            <TouchableOpacity
              key={action.key}
              activeOpacity={0.7}
              onPress={() => { onClose(); onAction(action.key, message); }}
              style={[ma.actionBtn, i < arr.length - 1 && ma.actionBorder]}
            >
              <Ionicons
                name={action.icon as any}
                size={17}
                color={action.key === 'delete' || action.key === 'report' ? T.accentRed : T.textPrimary}
              />
              <Text style={[
                ma.actionText,
                (action.key === 'delete' || action.key === 'report') && { color: T.accentRed },
              ]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const ma = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
    minWidth: 260, overflow: 'hidden',
  },
  reactionsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  reactionBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(139,77,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  reactionEmoji: { fontSize: 20 },
  divider: { height: 1, backgroundColor: 'rgba(17,17,17,0.05)' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  actionBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(17,17,17,0.04)' },
  actionText: { fontSize: 14, fontWeight: '600', color: T.textPrimary },
});

// ─── Context Panel (collapsible) ─────────────────────────────────────────────
function ContextPanel({
  recipient, expanded, onToggle,
}: {
  recipient: typeof RECIPIENTS['1'];
  expanded: boolean;
  onToggle: () => void;
}) {
  const animVal = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animVal, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 14,
    }).start();
  }, [expanded]);

  const contentHeight = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140],
  });

  const contentOpacity = animVal.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const hasContext = recipient.sharedCourses.length > 0 || recipient.sharedInterests.length > 0;

  if (!hasContext && recipient.mutualFriends === 0) return null;

  return (
    <View style={cp.wrap}>
      <Animated.View style={[cp.content, { height: contentHeight, opacity: contentOpacity }]}>
        <View style={cp.contentInner}>
          {recipient.sharedCourses.length > 0 && (
            <View style={cp.row}>
              <Ionicons name="school" size={12} color={T.accentBlue} />
              <Text style={cp.label}>Shared:</Text>
              {recipient.sharedCourses.map((c) => (
                <View key={c} style={cp.chip}>
                  <Text style={cp.chipText}>{c}</Text>
                </View>
              ))}
            </View>
          )}
          {recipient.sharedInterests.length > 0 && (
            <View style={cp.row}>
              <Ionicons name="heart" size={12} color={T.accentPink} />
              <Text style={cp.label}>Both like:</Text>
              {recipient.sharedInterests.map((interest) => (
                <View key={interest} style={[cp.chip, { backgroundColor: T.accentPink + '0C', borderColor: T.accentPink + '20' }]}>
                  <Text style={[cp.chipText, { color: T.accentPink }]}>{interest}</Text>
                </View>
              ))}
            </View>
          )}
          {recipient.mutualFriends > 0 && (
            <View style={cp.row}>
              <Ionicons name="people" size={12} color={T.accentPurple} />
              <Text style={cp.mutualText}>{recipient.mutualFriends} mutual connections</Text>
            </View>
          )}
          {recipient.availability && (
            <View style={cp.row}>
              <Ionicons name="time" size={12} color={T.accentGreen} />
              <Text style={cp.availText}>{recipient.availability}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={cp.toggleBtn}>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={T.accentPurple} />
        <Text style={cp.toggleText}>{expanded ? 'Hide context' : 'Show context'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const cp = StyleSheet.create({
  wrap: {
    marginHorizontal: 16, marginBottom: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.50)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  },
  content: {
    overflow: 'hidden',
  },
  contentInner: {
    padding: 12, gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  label: { fontSize: 11, fontWeight: '600', color: T.textMuted },
  chip: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
    backgroundColor: T.accentBlue + '0C',
    borderWidth: 1, borderColor: T.accentBlue + '20',
  },
  chipText: { fontSize: 10, fontWeight: '700', color: T.accentBlue },
  mutualText: { fontSize: 11, fontWeight: '600', color: T.accentPurple },
  availText: { fontSize: 11, fontWeight: '600', color: T.accentGreen },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(17,17,17,0.04)',
  },
  toggleText: { fontSize: 11, fontWeight: '600', color: T.accentPurple },
});

// ─── Chat bubble (with long press + reactions) ──────────────────────────────
function ChatBubble({
  message, showTime, onLongPress,
}: {
  message: ChatMessage;
  showTime: boolean;
  onLongPress: (msg: ChatMessage) => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(message.isOwn ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
      {showTime && <Text style={cb.time}>{message.time}</Text>}

      {/* Reply preview */}
      {message.replyTo && (
        <View style={[cb.replyPreview, message.isOwn && cb.replyPreviewOwn]}>
          <View style={cb.replyBar} />
          <View>
            <Text style={cb.replySender}>{message.replyTo.sender}</Text>
            <Text style={cb.replyText} numberOfLines={1}>{message.replyTo.text}</Text>
          </View>
        </View>
      )}

      <View style={[cb.row, message.isOwn && cb.rowOwn]}>
        <Pressable
          onLongPress={() => onLongPress(message)}
          delayLongPress={400}
          style={[cb.bubble, message.isOwn ? cb.bubbleOwn : cb.bubbleOther]}
        >
          {message.isOwn ? (
            <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cb.bubbleGrad}>
              <Text style={cb.textOwn}>{message.text}</Text>
            </LinearGradient>
          ) : (
            <Text style={cb.textOther}>{message.text}</Text>
          )}
        </Pressable>
        {message.isOwn && message.status && (
          <View style={cb.statusWrap}>
            <Ionicons
              name={message.status === 'read' ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={message.status === 'read' ? T.accentBlue : T.textMuted}
            />
          </View>
        )}
      </View>

      {/* Reaction badge */}
      {message.reaction && (
        <View style={[cb.reactionBadge, message.isOwn && cb.reactionBadgeOwn]}>
          <Text style={cb.reactionBadgeText}>{message.reaction}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const cb = StyleSheet.create({
  time: { textAlign: 'center', fontSize: 10, color: T.textMuted, fontWeight: '500', marginVertical: 10 },
  row: { flexDirection: 'row', marginVertical: 3, paddingHorizontal: 16 },
  rowOwn: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 20 },
  bubbleOwn: {
    borderBottomRightRadius: 6,
    overflow: 'hidden',
    shadowColor: T.accentPurple, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  bubbleGrad: { paddingHorizontal: 16, paddingVertical: 11 },
  bubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16, paddingVertical: 11,
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  textOwn: { fontSize: 14, color: '#fff', lineHeight: 20 },
  textOther: { fontSize: 14, color: T.textPrimary, lineHeight: 20 },
  statusWrap: { alignSelf: 'flex-end', marginLeft: 4, marginBottom: 2 },
  replyPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 2,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(139,77,255,0.06)',
  },
  replyPreviewOwn: { alignSelf: 'flex-end', marginRight: 16 },
  replyBar: { width: 3, height: 24, borderRadius: 1.5, backgroundColor: T.accentPurple },
  replySender: { fontSize: 10, fontWeight: '700', color: T.accentPurple },
  replyText: { fontSize: 11, color: T.textMuted, maxWidth: 200 },
  reactionBadge: {
    alignSelf: 'flex-start',
    marginLeft: 28, marginTop: -6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#5B608C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  reactionBadgeOwn: { alignSelf: 'flex-end', marginRight: 28, marginLeft: 0 },
  reactionBadgeText: { fontSize: 14 },
});

// ─── Attachment picker ──────────────────────────────────────────────────────
function AttachmentPicker({
  visible, onClose, onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 200, friction: 18,
    }).start();
  }, [visible]);

  const items = [
    { key: 'photo', icon: 'image-outline', label: 'Photo', color: T.accentBlue, bg: T.accentBlue + '10' },
    { key: 'file', icon: 'document-outline', label: 'File', color: T.accentPurple, bg: T.accentPurple + '10' },
    { key: 'timetable', icon: 'calendar-outline', label: 'Timetable', color: T.accentGreen, bg: T.accentGreen + '10' },
    { key: 'location', icon: 'location-outline', label: 'Location', color: T.accentOrange, bg: T.accentOrange + '10' },
  ];

  if (!visible) return null;

  return (
    <Animated.View style={[ap.grid, {
      opacity: slideAnim,
      transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
    }]}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.key}
          activeOpacity={0.7}
          onPress={() => { onClose(); onSelect(item.key); }}
          style={ap.item}
        >
          <View style={[ap.iconCircle, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon as any} size={20} color={item.color} />
          </View>
          <Text style={ap.itemLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

const ap = StyleSheet.create({
  grid: {
    flexDirection: 'row', justifyContent: 'center', gap: 20,
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.55)',
  },
  item: { alignItems: 'center', gap: 6 },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  itemLabel: { fontSize: 10, fontWeight: '700', color: T.textSecondary },
});

// ─── Safety footer ──────────────────────────────────────────────────────────
function SafetyFooter() {
  return (
    <View style={sf.wrap}>
      <Ionicons name="shield-checkmark-outline" size={11} color={T.textMuted} />
      <Text style={sf.text}>Messages are private between you and this person</Text>
    </View>
  );
}

const sf = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 6,
  },
  text: { fontSize: 9, color: T.textMuted, fontWeight: '500' },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function DMChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [text, setText] = useState('');
  const [contextExpanded, setContextExpanded] = useState(true);
  const [showOverflow, setShowOverflow] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<ChatMessage | null>(null);
  const [showMsgActions, setShowMsgActions] = useState(false);
  const [toast, setToast] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast(msg);
    toastOpacity.setValue(0);
    Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    toastTimeout.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setToast('');
      });
    }, 2000);
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: "Hey, we\u2019re both in CSC263 \u2014 how are you finding it?", isOwn: true, time: 'Just now', status: 'delivered' },
  ]);
  const scrollRef = useRef<ScrollView>(null);

  const recipient = RECIPIENTS[id ?? '1'] ?? RECIPIENTS['1'];

  // Auto-scroll on new message
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // Collapse context panel on scroll
  const handleScroll = () => {
    if (contextExpanded && messages.length > 3) {
      setContextExpanded(false);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      text: text.trim(),
      isOwn: true,
      time: 'Just now',
      status: 'sent',
      ...(replyingTo ? { replyTo: { text: replyingTo.text, sender: replyingTo.isOwn ? 'You' : `@${recipient.handle}` } } : {}),
    };
    setMessages((prev) => [...prev, newMsg]);
    setText('');
    setReplyingTo(null);
  };

  const handleMsgLongPress = useCallback((msg: ChatMessage) => {
    setSelectedMsg(msg);
    setShowMsgActions(true);
  }, []);

  const handleMsgAction = useCallback((action: string, msg: ChatMessage) => {
    if (action === 'copy') {
      Clipboard.setString(msg.text);
    } else if (action === 'reply') {
      setReplyingTo(msg);
    } else if (action === 'delete') {
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } else if (action.startsWith('react:')) {
      const emoji = action.replace('react:', '');
      setMessages((prev) => prev.map((m) =>
        m.id === msg.id ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m,
      ));
    } else if (action === 'report') {
      Alert.alert('Report Sent', 'This message has been reported to moderators.');
    }
  }, []);

  const handleOverflowAction = useCallback((action: string) => {
    switch (action) {
      case 'profile':
        router.push(`/profile/${id}` as any);
        break;
      case 'mute':
        Alert.alert('Muted', `Notifications from @${recipient.handle} are now muted.`);
        break;
      case 'block':
        Alert.alert(
          'Block User',
          `Are you sure you want to block @${recipient.handle}? They won\u2019t be able to message you.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Block', style: 'destructive', onPress: () => router.back() },
          ],
        );
        break;
      case 'report':
        Alert.alert('Report', 'Thank you for reporting. Our team will review this.');
        break;
      case 'clear':
        Alert.alert(
          'Clear History',
          'This will delete all messages in this conversation.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: () => setMessages([]) },
          ],
        );
        break;
    }
  }, [id, recipient.handle]);

  const handleAttachment = useCallback((type: string) => {
    const labels: Record<string, string> = {
      photo: 'Photo picker',
      file: 'File picker',
      timetable: 'Timetable share',
      location: 'Location share',
    };
    showToast(`${labels[type] ?? type} coming soon`);
  }, []);

  return (
    <View style={s.root}>
      <LinearGradient colors={BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* ── Header ── */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={s.navBtn}>
              <Ionicons name="chevron-back" size={18} color={T.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/profile/${id}` as any)}
              style={s.headerCenter}
            >
              <LinearGradient
                colors={AVATAR_GRADS[recipient.gradIdx % AVATAR_GRADS.length]}
                style={s.headerAvatar}
              >
                <Text style={s.headerAvatarText}>{recipient.initial}</Text>
              </LinearGradient>
              <Text style={s.headerName}>@{recipient.handle}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={s.navBtn}
              onPress={() => setShowOverflow(true)}
            >
              <Ionicons name="ellipsis-horizontal" size={17} color={T.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* ── Context Panel ── */}
          <ContextPanel
            recipient={recipient}
            expanded={contextExpanded}
            onToggle={() => setContextExpanded(!contextExpanded)}
          />

          {/* ── Messages ── */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.msgList}
            onScrollBeginDrag={handleScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* First message notice */}
            <View style={s.firstMsgNotice}>
              <Ionicons name="sparkles" size={14} color={T.accentPurple} />
              <Text style={s.firstMsgText}>This is the start of your conversation with @{recipient.handle}</Text>
            </View>

            {/* Safety notice */}
            <SafetyFooter />

            {messages.map((msg, i) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                showTime={i === 0 || i % 4 === 0}
                onLongPress={handleMsgLongPress}
              />
            ))}
          </ScrollView>

          {/* ── Reply preview bar ── */}
          {replyingTo && (
            <View style={s.replyBar}>
              <View style={s.replyBarAccent} />
              <View style={{ flex: 1 }}>
                <Text style={s.replyBarLabel}>
                  Replying to {replyingTo.isOwn ? 'yourself' : `@${recipient.handle}`}
                </Text>
                <Text style={s.replyBarText} numberOfLines={1}>{replyingTo.text}</Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={18} color={T.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Attachment picker ── */}
          <AttachmentPicker
            visible={showAttachments}
            onClose={() => setShowAttachments(false)}
            onSelect={handleAttachment}
          />

          {/* ── Toast ── */}
          {toast !== '' && (
            <Animated.View style={[s.toast, { opacity: toastOpacity }]}>
              <Text style={s.toastText}>{toast}</Text>
            </Animated.View>
          )}

          {/* ── Input Bar ── */}
          <View style={s.inputBar}>
            <TouchableOpacity
              onPress={() => setShowAttachments(!showAttachments)}
              activeOpacity={0.7}
              style={s.attachBtn}
            >
              <Ionicons
                name={showAttachments ? 'close' : 'add-circle-outline'}
                size={24}
                color={showAttachments ? T.accentPurple : T.textMuted}
              />
            </TouchableOpacity>

            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                placeholder="Write a message..."
                placeholderTextColor={T.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={2000}
              />
            </View>

            {text.trim() ? (
              <TouchableOpacity
                onPress={handleSend}
                activeOpacity={0.8}
                style={s.sendOuter}
              >
                <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.sendBtn}>
                  <Ionicons name="send" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => showToast('Voice messages coming soon')}
                style={s.voiceBtn}
              >
                <Ionicons name="mic-outline" size={22} color={T.accentPurple} />
              </TouchableOpacity>
            )}
          </View>

          <SafeAreaView edges={['bottom']} />
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Modals ── */}
      <OverflowMenu
        visible={showOverflow}
        onClose={() => setShowOverflow(false)}
        onAction={handleOverflowAction}
      />
      <MessageActionsSheet
        message={selectedMsg}
        visible={showMsgActions}
        onClose={() => setShowMsgActions(false)}
        onAction={handleMsgAction}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
    gap: 8,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  headerCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerName: { fontSize: 14, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.2 },

  msgList: { paddingTop: 8, paddingBottom: 16 },

  firstMsgNotice: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: 30, marginVertical: 16,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(139,77,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(139,77,255,0.12)',
  },
  firstMsgText: { fontSize: 11, color: T.accentPurple, fontWeight: '600', textAlign: 'center', lineHeight: 15 },

  replyBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 4,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  replyBarAccent: {
    width: 3, height: 28, borderRadius: 1.5,
    backgroundColor: T.accentPurple,
  },
  replyBarLabel: { fontSize: 10, fontWeight: '700', color: T.accentPurple },
  replyBarText: { fontSize: 12, color: T.textMuted, marginTop: 1 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.55)',
  },
  attachBtn: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 16, paddingVertical: 10,
    minHeight: 42,
  },
  input: { fontSize: 14, color: T.textPrimary, lineHeight: 20, maxHeight: 100, paddingVertical: 0 },
  sendOuter: {
    borderRadius: 21,
    shadowColor: T.accentPurple, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  voiceBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(139,77,255,0.08)',
  },
  toast: {
    alignSelf: 'center',
    marginBottom: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(17,17,17,0.82)',
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
