import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface University {
  id: string; name: string; emailDomain: string; country: string; city: string;
}

export interface Post {
  id: string;
  title: string;
  body?: string;
  category: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  imageUrls?: string[];
  hotScore: number;
  createdAt: string;
  author: { id: string; handle: string };
  community?: { id: string; name: string; slug: string };
  userVote?: number;
}

export interface Comment {
  id: string;
  body: string;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  createdAt: string;
  author: { id: string; handle: string };
  parentId?: string;
  replies?: Comment[];
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: string;
  iconUrl?: string;
  memberCount: number;
  postCount: number;
}

export interface Conversation {
  id: string;
  conversationId: string;
  status: string;
  unreadCount: number;
  conversation: {
    lastMessagePreview: string;
    lastMessageAt: string;
    status: string;
  };
}

export interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

// ─── University Queries ───────────────────────────────────────────────────────

export const useUniversities = () =>
  useQuery({ queryKey: ['universities'], queryFn: () => api.get<University[]>('/universities') });

export const useMajors = (universityId: string) =>
  useQuery({
    queryKey: ['majors', universityId],
    queryFn: () => api.get<any[]>(`/universities/${universityId}/majors`),
    enabled: !!universityId,
  });

export const useCourses = (universityId: string, search?: string) =>
  useQuery({
    queryKey: ['courses', universityId, search],
    queryFn: () => api.get<any[]>(`/universities/${universityId}/courses?q=${search || ''}`),
    enabled: !!universityId,
  });

// ─── Feed Queries ─────────────────────────────────────────────────────────────

export const usePersonalizedFeed = (sort: string = 'hot') =>
  useInfiniteQuery({
    queryKey: ['feed', 'personalized', sort],
    queryFn: ({ pageParam = 1 }) =>
      api.get<{ items: Post[]; total: number }>(`/posts/feed/personalized?sort=${sort}&page=${pageParam}`),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.flatMap((p) => p.items).length;
      return loaded < lastPage.total ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

export const useCampusFeed = (sort: string = 'hot') =>
  useInfiniteQuery({
    queryKey: ['feed', 'campus', sort],
    queryFn: ({ pageParam = 1 }) =>
      api.get<{ items: Post[]; total: number }>(`/posts/feed?sort=${sort}&page=${pageParam}`),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.flatMap((p) => p.items).length;
      return loaded < lastPage.total ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

export const useCommunityFeed = (communityId: string, sort: string = 'hot') =>
  useInfiniteQuery({
    queryKey: ['feed', 'community', communityId, sort],
    queryFn: ({ pageParam = 1 }) =>
      api.get<{ items: Post[]; total: number }>(
        `/posts/community/${communityId}?sort=${sort}&page=${pageParam}`,
      ),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.flatMap((p) => p.items).length;
      return loaded < lastPage.total ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!communityId,
  });

export const usePost = (id: string) =>
  useQuery({
    queryKey: ['post', id],
    queryFn: () => api.get<Post>(`/posts/${id}`),
    enabled: !!id,
  });

export const useComments = (postId: string) =>
  useQuery({
    queryKey: ['comments', postId],
    queryFn: () => api.get<Comment[]>(`/posts/${postId}/comments`),
    enabled: !!postId,
  });

// ─── Community Queries ────────────────────────────────────────────────────────

export const useCommunities = (type?: string) =>
  useQuery({
    queryKey: ['communities', type],
    queryFn: () => api.get<Community[]>(`/communities${type ? `?type=${type}` : ''}`),
  });

export const useMyCommunities = () =>
  useQuery({ queryKey: ['communities', 'my'], queryFn: () => api.get<any[]>('/communities/my') });

// ─── Message Queries ──────────────────────────────────────────────────────────

export const useConversations = () =>
  useQuery({ queryKey: ['conversations'], queryFn: () => api.get<{ items: Conversation[] }>('/conversations') });

export const useMessages = (conversationId: string) =>
  useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam = 1 }) =>
      api.get<{ items: Message[]; total: number }>(
        `/conversations/${conversationId}/messages?page=${pageParam}`,
      ),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.flatMap((p) => p.items).length;
      return loaded < lastPage.total ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!conversationId,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/posts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

export const useVote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { value: number; postId?: string; commentId?: string }) =>
      api.post('/votes', data),
    onSuccess: (_data, variables) => {
      if (variables.postId) {
        qc.invalidateQueries({ queryKey: ['post', variables.postId] });
        qc.invalidateQueries({ queryKey: ['feed'] });
      }
      if (variables.commentId) {
        qc.invalidateQueries({ queryKey: ['comments'] });
      }
    },
  });
};

export const useCreateComment = (postId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { body: string; parentId?: string }) =>
      api.post(`/posts/${postId}/comments`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
};

export const useJoinCommunity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (communityId: string) => api.post(`/communities/${communityId}/join`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities'] });
    },
  });
};

export const useLeaveCommunity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (communityId: string) => api.delete(`/communities/${communityId}/leave`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities'] });
    },
  });
};

export const useInitiateConversation = () =>
  useMutation({
    mutationFn: (data: { recipientId: string; initialMessage: string; fromPostId?: string }) =>
      api.post('/conversations/initiate', data),
  });

export const useReport = () =>
  useMutation({
    mutationFn: (data: any) => api.post('/moderation/reports', data),
  });
