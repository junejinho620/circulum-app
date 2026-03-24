import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ListRenderItem, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { useMessages, Message } from '../../src/services/queries';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';
import { socketService } from '../../src/services/socket';
import LoadingSpinner from '../../src/components/common/LoadingSpinner';
import EmptyState from '../../src/components/common/EmptyState';
import ErrorState from '../../src/components/common/ErrorState';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  if (!id) {
    router.back();
    return null;
  }
  const { user } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [conversationStatus, setConversationStatus] = useState<string>('');
  const [isPending, setIsPending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<any>(null);

  const {
    data, isLoading, error, refetch, fetchNextPage, hasNextPage,
  } = useMessages(id);

  const allMessages = data?.pages.flatMap((p) => p.items) ?? [];
  const displayMessages = [...allMessages, ...localMessages];

  useEffect(() => {
    socketService.joinConversation(id);

    // Check conversation status
    api.get<any>(`/conversations`).then((res: any) => {
      const conv = res?.items?.find((c: any) => c.conversationId === id);
      if (conv) {
        setConversationStatus(conv.conversation?.status);
        setIsPending(conv.conversation?.status === 'pending' && conv.role === 'recipient');
      }
    }).catch(() => {});

    const unsub = socketService.on('new_message', (data) => {
      if (data.conversationId === id) {
        setLocalMessages((prev) => {
          if (prev.find((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      socketService.leaveConversation(id);
      unsub();
    };
  }, [id]);

  const handleAccept = async () => {
    try {
      await api.patch(`/conversations/${id}/accept`);
      setIsPending(false);
      setConversationStatus('active');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;
    const body = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const msg: any = await api.post(`/conversations/${id}/messages`, { body });
      setLocalMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setMessageText(body);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    socketService.sendTyping(id);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {}, 2000);
  };

  const renderMessage: ListRenderItem<Message> = useCallback(({ item, index }) => {
    const isOwn = item.senderId === user?.id;
    const prevMsg = displayMessages[index - 1];
    const showTime = !prevMsg ||
      dayjs(item.createdAt).diff(dayjs(prevMsg.createdAt), 'minute') > 5;

    return (
      <View>
        {showTime && (
          <Text style={styles.timeLabel}>
            {dayjs(item.createdAt).format('h:mm A')}
          </Text>
        )}
        <View style={[styles.messageBubbleWrapper, isOwn && styles.messageBubbleWrapperOwn]}>
          <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
            <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
              {item.body}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [user?.id, displayMessages]);

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerName}>Conversation</Text>
          <View style={{ width: 22 }} />
        </View>
        <ErrorState message="Couldn't load messages" onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>?</Text>
            </View>
            <View>
              <Text style={styles.headerName}>Anonymous</Text>
              <Text style={styles.headerStatus}>
                {conversationStatus === 'pending' ? '⏳ Pending' : '🟢 Active'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert(
              'Options',
              undefined,
              [
                { text: 'Block', style: 'destructive', onPress: () => api.patch(`/conversations/${id}/block`) },
                { text: 'Report', onPress: () => {} },
                { text: 'Cancel', style: 'cancel' },
              ],
            )}
            style={styles.moreBtn}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Accept banner for pending */}
        {isPending && (
          <View style={styles.acceptBanner}>
            <Text style={styles.acceptBannerText}>
              Someone wants to chat with you
            </Text>
            <View style={styles.acceptBannerActions}>
              <TouchableOpacity onPress={handleAccept} style={styles.acceptBtn}>
                <Text style={styles.acceptBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => api.delete(`/conversations/${id}`).then(() => router.back())}
                style={styles.declineBtn}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Messages */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[styles.messageList, displayMessages.length === 0 && { flex: 1 }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
              </View>
            }
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.1}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input */}
        {!isPending && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              value={messageText}
              onChangeText={(v) => { setMessageText(v); handleTyping(); }}
              multiline
              maxLength={5000}
              selectionColor={Colors.primary}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!messageText.trim() || sending}
              style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            >
              <Ionicons name="send" size={18} color={messageText.trim() ? Colors.white : Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  headerName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  headerStatus: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  moreBtn: { padding: Spacing.sm },
  acceptBanner: {
    backgroundColor: Colors.primary + '15',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '33',
  },
  acceptBannerText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  acceptBannerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  acceptBtnText: {
    color: Colors.white,
    fontWeight: Typography.semibold,
    fontSize: Typography.sm,
  },
  declineBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  declineBtnText: {
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    fontSize: Typography.sm,
  },
  messageList: {
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  timeLabel: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginVertical: Spacing.sm,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  messageBubbleWrapperOwn: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  messageBubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: Radius.xs,
  },
  messageBubbleOwn: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.xs,
  },
  messageText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: Typography.base * Typography.normal,
  },
  messageTextOwn: { color: Colors.white },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.surfaceElevated },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyChatText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
