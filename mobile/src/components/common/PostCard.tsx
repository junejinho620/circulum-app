import React, { memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { Post } from '../../services/queries';
import { useVote } from '../../services/queries';

dayjs.extend(relativeTime);

// Category pill colors — warm accent palette
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  general:    { bg: 'rgba(75,80,248,0.12)',  text: '#4B50F8' },
  study:      { bg: 'rgba(107,124,255,0.12)', text: '#6B7CFF' },
  meme:       { bg: 'rgba(230,85,197,0.12)', text: '#E655C5' },
  event:      { bg: 'rgba(139,77,255,0.12)', text: '#8B4DFF' },
  buy_sell:   { bg: 'rgba(199,184,255,0.22)', text: '#7B64D8' },
  lost_found: { bg: 'rgba(75,80,248,0.12)',  text: '#4B50F8' },
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  study: 'Study',
  meme: 'Meme',
  event: 'Event',
  buy_sell: 'Buy / Sell',
  lost_found: 'Lost & Found',
};

interface PostCardProps {
  post: Post;
  showCommunity?: boolean;
  compact?: boolean;
}

const PostCard = memo(({ post, showCommunity = true, compact = false }: PostCardProps) => {
  const router = useRouter();
  const voteMutation = useVote();
  const score = post.upvotes - post.downvotes;
  const userVote = post.userVote;

  const cat = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.general;

  return (
    <Pressable
      onPress={() => router.push(`/post/${post.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Header row */}
      <View style={styles.header}>
        {/* Category pill */}
        <View style={[styles.categoryPill, { backgroundColor: cat.bg }]}>
          <Text style={[styles.categoryText, { color: cat.text }]}>
            {CATEGORY_LABELS[post.category] || post.category}
          </Text>
        </View>

        {showCommunity && post.community && (
          <Text style={styles.communityText} numberOfLines={1}>
            {post.community.name}
          </Text>
        )}

        <Text style={styles.timeText}>{dayjs(post.createdAt).fromNow()}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={compact ? 2 : 4}>
        {post.title}
      </Text>

      {/* Body preview */}
      {!compact && post.body && (
        <Text style={styles.body} numberOfLines={3}>
          {post.body}
        </Text>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.authorText}>@{post.author.handle}</Text>

        <View style={styles.actions}>
          {/* Upvote */}
          <TouchableOpacity
            onPress={() => voteMutation.mutate({ postId: post.id, value: 1 })}
            style={styles.voteBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name={userVote === 1 ? 'arrow-up' : 'arrow-up-outline'}
              size={16}
              color={userVote === 1 ? Colors.accent : Colors.textMuted}
            />
          </TouchableOpacity>

          <Text style={[
            styles.scoreText,
            userVote === 1 && styles.scoreUp,
            userVote === -1 && styles.scoreDown,
          ]}>
            {score}
          </Text>

          {/* Downvote */}
          <TouchableOpacity
            onPress={() => voteMutation.mutate({ postId: post.id, value: -1 })}
            style={styles.voteBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name={userVote === -1 ? 'arrow-down' : 'arrow-down-outline'}
              size={16}
              color={userVote === -1 ? Colors.danger : Colors.textMuted}
            />
          </TouchableOpacity>

          {/* Comments */}
          <View style={styles.commentRow}>
            <Ionicons name="chatbubble-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.commentCount}>{post.commentCount}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

PostCard.displayName = 'PostCard';
export default PostCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceGlass,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.sm,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    ...Shadow.md,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  categoryText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  communityText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  timeText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: Typography.lg * 1.45,
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
    lineHeight: Typography.md * 1.6,
    marginBottom: Spacing.sm,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dividerSoft,
    marginVertical: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorText: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  voteBtn: { padding: Spacing.xs },
  scoreText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textSecondary,
    minWidth: 22,
    textAlign: 'center',
  },
  scoreUp: { color: Colors.accent },
  scoreDown: { color: Colors.danger },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  commentCount: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
