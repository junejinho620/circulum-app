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
  author: { id: string; handle: string; avatarUrl?: string };
  community?: { id: string; name: string; slug: string };
  userVote?: number;
  isBookmarked?: boolean;
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

export interface UserProfile {
  id: string;
  handle: string;
  bio?: string;
  avatarUrl?: string;
  year?: string;
  interests?: string[];
  university: { id: string; name: string };
  major?: { id: string; name: string } | null;
  postCount: number;
  commentCount: number;
  totalKarma: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  payload: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface Poll {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  status: 'active' | 'closed' | 'removed';
  isAnonymous: boolean;
  totalVotes: number;
  endsAt?: string;
  createdAt: string;
  author: { id: string; handle: string };
  options: PollOption[];
  userVotes?: string[];
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  sortOrder: number;
}

export interface Hashtag {
  id: string;
  name: string;
  usageCount: number;
}

export interface Bookmark {
  id: string;
  postId: string;
  post: Post;
  createdAt: string;
}

export interface BlockedUser {
  id: string;
  blockedId: string;
  blocked: { id: string; handle: string; avatarUrl?: string };
  createdAt: string;
}

// ─── Paginated response type ─────────────────────────────────────────────────

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIVERSITY QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// FEED QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const usePersonalizedFeed = (sort: string = 'hot') =>
  useInfiniteQuery({
    queryKey: ['feed', 'personalized', sort],
    queryFn: ({ pageParam = 1 }) =>
      api.get<Paginated<Post>>(`/posts/feed/personalized?sort=${sort}&page=${pageParam}`),
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
      api.get<Paginated<Post>>(`/posts/feed?sort=${sort}&page=${pageParam}`),
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
      api.get<Paginated<Post>>(
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

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNITY QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const useCommunities = (type?: string) =>
  useQuery({
    queryKey: ['communities', type],
    queryFn: () => api.get<Community[]>(`/communities${type ? `?type=${type}` : ''}`),
  });

export const useCommunityDetail = (communityId: string) =>
  useQuery({
    queryKey: ['community', communityId],
    queryFn: () => api.get<Community>(`/communities/${communityId}`),
    enabled: !!communityId,
  });

export const useMyCommunities = () =>
  useQuery({ queryKey: ['communities', 'my'], queryFn: () => api.get<any[]>('/communities/my') });

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const useConversations = () =>
  useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get<Paginated<Conversation>>('/conversations'),
  });

export const useMessages = (conversationId: string) =>
  useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam = 1 }) =>
      api.get<Paginated<Message>>(
        `/conversations/${conversationId}/messages?page=${pageParam}`,
      ),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.flatMap((p) => p.items).length;
      return loaded < lastPage.total ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!conversationId,
  });

// ═══════════════════════════════════════════════════════════════════════════════
// USER / PROFILE QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const useMyProfile = () =>
  useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => api.get<UserProfile>('/users/me/profile'),
  });

export const useUserProfile = (userId: string) =>
  useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.get<UserProfile>(`/users/${userId}/profile`),
    enabled: !!userId,
  });

export const useSearchUsers = (query: string) =>
  useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => api.get<{ id: string; handle: string; avatarUrl?: string; bio?: string; totalKarma: number }[]>(
      `/users/search?q=${encodeURIComponent(query)}`,
    ),
    enabled: query.length >= 2,
  });

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const useNotifications = (page = 1) =>
  useQuery({
    queryKey: ['notifications', page],
    queryFn: () => api.get<Paginated<Notification>>(`/notifications?page=${page}&limit=30`),
  });

export const useUnreadNotificationCount = () =>
  useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<number>('/notifications/unread-count'),
    refetchInterval: 30_000, // poll every 30s
  });

// ═══════════════════════════════════════════════════════════════════════════════
// POLL QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const usePolls = (communityId?: string) =>
  useInfiniteQuery({
    queryKey: ['polls', communityId],
    queryFn: ({ pageParam = 1 }) =>
      api.get<Paginated<Poll>>(
        `/polls?page=${pageParam}${communityId ? `&communityId=${communityId}` : ''}`,
      ),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.flatMap((p) => p.items).length;
      return loaded < lastPage.total ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

export const usePoll = (pollId: string) =>
  useQuery({
    queryKey: ['poll', pollId],
    queryFn: () => api.get<Poll & { userVotes: string[] }>(`/polls/${pollId}`),
    enabled: !!pollId,
  });

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKMARK QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const useBookmarks = () =>
  useInfiniteQuery({
    queryKey: ['bookmarks'],
    queryFn: ({ pageParam = 1 }) =>
      api.get<Paginated<Bookmark>>(`/bookmarks?page=${pageParam}`),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.flatMap((p) => p.items).length;
      return loaded < lastPage.total ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCK QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const useBlockedUsers = () =>
  useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.get<BlockedUser[]>('/blocks'),
  });

export const useBlockCount = () =>
  useQuery({
    queryKey: ['blocks', 'count'],
    queryFn: () => api.get<number>('/blocks/count'),
  });

// ═══════════════════════════════════════════════════════════════════════════════
// HASHTAG QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export const useTrendingHashtags = (limit = 20) =>
  useQuery({
    queryKey: ['hashtags', 'trending'],
    queryFn: () => api.get<Hashtag[]>(`/hashtags/trending?limit=${limit}`),
  });

export const useSearchHashtags = (query: string) =>
  useQuery({
    queryKey: ['hashtags', 'search', query],
    queryFn: () => api.get<Hashtag[]>(`/hashtags/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 1,
  });

export const useHashtagPosts = (name: string) =>
  useInfiniteQuery({
    queryKey: ['hashtags', name, 'posts'],
    queryFn: ({ pageParam = 1 }) =>
      api.get<{ hashtag: Hashtag; items: Post[]; total: number }>(
        `/hashtags/${encodeURIComponent(name)}/posts?page=${pageParam}`,
      ),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.flatMap((p) => p.items).length;
      return loaded < lastPage.total ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!name,
  });

// ═══════════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Posts ───────────────────────────────────────────────────────────────────

export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      body?: string;
      category: string;
      communityId: string;
      imageUrls?: string[];
    }) => api.post('/posts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.delete(`/posts/${postId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

// ─── Votes ──────────────────────────────────────────────────────────────────

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

// ─── Comments ───────────────────────────────────────────────────────────────

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

// ─── Communities ─────────────────────────────────────────────────────────────

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

// ─── Messages ───────────────────────────────────────────────────────────────

export const useInitiateConversation = () =>
  useMutation({
    mutationFn: (data: { recipientId: string; initialMessage: string; fromPostId?: string }) =>
      api.post('/conversations/initiate', data),
  });

export const useSendMessage = (conversationId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { body: string; imageUrl?: string }) =>
      api.post(`/conversations/${conversationId}/messages`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

// ─── Profile ────────────────────────────────────────────────────────────────

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      handle?: string;
      bio?: string;
      avatarUrl?: string;
      year?: string;
      interests?: string[];
    }) => api.patch('/users/me/profile', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// ─── Notifications ──────────────────────────────────────────────────────────

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      api.patch(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// ─── Polls ──────────────────────────────────────────────────────────────────

export const useCreatePoll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      question: string;
      options: string[];
      type?: 'single' | 'multiple';
      communityId?: string;
      isAnonymous?: boolean;
      endsAt?: string;
    }) => api.post('/polls', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['polls'] });
    },
  });
};

export const useVotePoll = (pollId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (optionIds: string[]) =>
      api.post(`/polls/${pollId}/vote`, { optionIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['poll', pollId] });
      qc.invalidateQueries({ queryKey: ['polls'] });
    },
  });
};

export const useClosePoll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pollId: string) => api.patch(`/polls/${pollId}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['polls'] });
    },
  });
};

// ─── Bookmarks ──────────────────────────────────────────────────────────────

export const useToggleBookmark = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      api.post<{ bookmarked: boolean }>(`/bookmarks/${postId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

// ─── Blocks ─────────────────────────────────────────────────────────────────

export const useBlockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.post(`/blocks/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

export const useUnblockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/blocks/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
};

// ─── Moderation ─────────────────────────────────────────────────────────────

export const useReport = () =>
  useMutation({
    mutationFn: (data: {
      type: 'post' | 'comment' | 'message' | 'user';
      reason: string;
      details?: string;
      postId?: string;
      commentId?: string;
      messageId?: string;
      targetUserId?: string;
    }) => api.post('/moderation/reports', data),
  });

// ─── Auth (non-session) ─────────────────────────────────────────────────────

export const useSendVerificationCode = () =>
  useMutation({
    mutationFn: (email: string) =>
      api.post<{ message: string; universityId: string; universityName: string }>(
        '/auth/send-code', { email },
      ),
  });

export const useVerifyCode = () =>
  useMutation({
    mutationFn: (data: { email: string; code: string }) =>
      api.post<{ message: string; universityId: string }>(
        '/auth/verify-code', data,
      ),
  });

export const useForgotPassword = () =>
  useMutation({
    mutationFn: (email: string) => api.post('/auth/forgot-password', { email }),
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: (data: { token: string; newPassword: string }) =>
      api.post('/auth/reset-password', data),
  });

// ─── University / Courses ───────────────────────────────────────────────────

export const useEnrollCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      api.post('/universities/me/courses', { courseId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUnenrollCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      api.delete(`/universities/me/courses/${courseId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateMajor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (majorId: string) =>
      api.post('/universities/me/major', { majorId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// COURSE REVIEWS
// ═══════════════════════════════════════════════════════════════════════════════

export interface CourseDetail {
  id: string;
  code: string;
  name: string;
  department: string;
  description?: string;
  terms?: string[];
  avgRating: number;
  avgDifficulty: number;
  avgWorkload: number;
  reviewCount: number;
  gradeDistribution: Record<string, number>;
  tips: string[];
  pitfalls: string[];
  topProfessors: string[];
}

export interface CourseReview {
  id: string;
  userId: string;
  difficulty: number;
  workload: number;
  rating: number;
  body?: string;
  tips?: string;
  pitfalls?: string;
  professorName?: string;
  term?: string;
  grade?: string;
  createdAt: string;
  user?: { id: string; handle: string };
}

export const useCoursesWithReviews = (department?: string, sort?: string, search?: string) =>
  useQuery({
    queryKey: ['course-reviews', 'courses', department, sort, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (department) params.set('department', department);
      if (sort) params.set('sort', sort);
      if (search) params.set('q', search);
      return api.get<CourseDetail[]>(`/course-reviews/courses?${params.toString()}`);
    },
    placeholderData: (prev) => prev, // keep previous results visible while fetching
  });

export const useCourseDetail = (courseId: string) =>
  useQuery({
    queryKey: ['course-reviews', 'detail', courseId],
    queryFn: () => api.get<CourseDetail>(`/course-reviews/courses/${courseId}`),
    enabled: !!courseId,
  });

export const useCourseReviews = (courseId: string) =>
  useQuery({
    queryKey: ['course-reviews', 'reviews', courseId],
    queryFn: () => api.get<Paginated<CourseReview>>(`/course-reviews/courses/${courseId}/reviews`),
    enabled: !!courseId,
  });

export const useCreateCourseReview = (courseId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      difficulty: number; workload: number; rating: number;
      body?: string; tips?: string; pitfalls?: string;
      professorName?: string; term?: string; grade?: string;
    }) => api.post(`/course-reviews/courses/${courseId}/reviews`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-reviews'] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROFESSORS
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProfessorDetail {
  id: string;
  name: string;
  department: string;
  courses: string[];
  avgOverall: number;
  avgClarity: number;
  avgFairness: number;
  avgWorkload: number;
  avgEngagement: number;
  reviewCount: number;
  isTrending: boolean;
  tags: string[];
}

export interface ProfessorReviewItem {
  id: string;
  overall: number;
  clarity: number;
  fairness: number;
  workload: number;
  engagement: number;
  body?: string;
  courseCode?: string;
  tags?: string[];
  createdAt: string;
  user?: { id: string; handle: string };
}

export const useProfessors = (department?: string, sort?: string, search?: string) =>
  useQuery({
    queryKey: ['professors', department, sort, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (department) params.set('department', department);
      if (sort) params.set('sort', sort);
      if (search) params.set('q', search);
      return api.get<ProfessorDetail[]>(`/professors?${params.toString()}`);
    },
    placeholderData: (prev) => prev,
  });

export const useProfessorDetail = (professorId: string) =>
  useQuery({
    queryKey: ['professors', professorId],
    queryFn: () => api.get<ProfessorDetail>(`/professors/${professorId}`),
    enabled: !!professorId,
  });

export const useProfessorReviews = (professorId: string) =>
  useQuery({
    queryKey: ['professors', professorId, 'reviews'],
    queryFn: () => api.get<Paginated<ProfessorReviewItem>>(`/professors/${professorId}/reviews`),
    enabled: !!professorId,
  });

export const useCreateProfessorReview = (professorId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      overall: number; clarity: number; fairness: number;
      workload: number; engagement: number;
      body?: string; courseCode?: string; tags?: string[];
    }) => api.post(`/professors/${professorId}/reviews`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professors'] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// STUDY BUDDY
// ═══════════════════════════════════════════════════════════════════════════════

export interface StudyBuddyMatch {
  id: string;
  userId: string;
  name: string;
  initial: string;
  courses: string[];
  sharedCourses: string[];
  freeSlots: string[];
  intensity: string;
  location: string;
  preference: string;
  bio: string;
  studyStyle: string[];
  reliability: number;
  sessionsCompleted: number;
  compatibility: number;
  active: boolean;
}

export interface StudySessionItem {
  id: string;
  courseCode: string;
  date: string;
  location: string;
  duration: string;
  goal?: string;
  isPublic: boolean;
  maxParticipants: number;
  participantCount: number;
  creator: { id: string; handle: string };
  participants: { user: { id: string; handle: string } }[];
}

export const useStudyBuddyProfile = () =>
  useQuery({
    queryKey: ['study-buddy', 'profile'],
    queryFn: () => api.get<any>('/study-buddy/profile'),
  });

export const useUpdateStudyBuddyProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      intensity?: string; location?: string; preference?: string;
      bio?: string; studyStyle?: string[]; availability?: string[];
      courses?: string[]; isVisible?: boolean;
    }) => api.patch('/study-buddy/profile', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-buddy'] });
    },
  });
};

export const useStudyBuddyMatches = () =>
  useQuery({
    queryKey: ['study-buddy', 'matches'],
    queryFn: () => api.get<StudyBuddyMatch[]>('/study-buddy/matches'),
  });

export const useStudySessions = () =>
  useQuery({
    queryKey: ['study-buddy', 'sessions'],
    queryFn: () => api.get<StudySessionItem[]>('/study-buddy/sessions'),
  });

export const useCreateStudySession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      courseCode: string; date: string; location: string;
      duration: string; goal?: string; isPublic?: boolean;
      maxParticipants?: number;
    }) => api.post('/study-buddy/sessions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-buddy', 'sessions'] });
    },
  });
};

export const useJoinStudySession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post(`/study-buddy/sessions/${sessionId}/join`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-buddy', 'sessions'] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPUS MAP
// ═══════════════════════════════════════════════════════════════════════════════

export interface CampusLocationItem {
  id: string;
  name: string;
  subtitle?: string;
  category: string;
  building: string;
  floor?: string;
  coordX: number;
  coordY: number;
  avgRating: number;
  currentOccupancy: number;
  bestTime?: string;
  tags?: string[];
}

export interface CampusEventItem {
  id: string;
  title: string;
  locationId: string;
  startTime: string;
  endTime?: string;
  category: string;
  participantCount: number;
  location?: CampusLocationItem;
}

export interface SavedPlaceItem {
  id: string;
  locationId: string;
  type: string;
  location: CampusLocationItem;
}

export const useCampusLocations = (category?: string) =>
  useQuery({
    queryKey: ['campus', 'locations', category],
    queryFn: () => api.get<CampusLocationItem[]>(
      `/campus/locations${category ? `?category=${category}` : ''}`,
    ),
  });

export const useCampusLocationDetail = (locationId: string) =>
  useQuery({
    queryKey: ['campus', 'locations', locationId],
    queryFn: () => api.get<CampusLocationItem & { events: CampusEventItem[] }>(
      `/campus/locations/${locationId}`,
    ),
    enabled: !!locationId,
  });

export const useCampusEvents = () =>
  useQuery({
    queryKey: ['campus', 'events'],
    queryFn: () => api.get<CampusEventItem[]>('/campus/events'),
  });

export const useSavedPlaces = () =>
  useQuery({
    queryKey: ['campus', 'saved'],
    queryFn: () => api.get<SavedPlaceItem[]>('/campus/saved'),
  });

export const useToggleSavedPlace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (locationId: string) =>
      api.post<{ saved: boolean }>(`/campus/saved/${locationId}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campus', 'saved'] });
      qc.invalidateQueries({ queryKey: ['campus', 'locations'] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIMETABLE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ScheduleBlockItem {
  id: string;
  title: string;
  subtitle?: string;
  location?: string;
  professor?: string;
  day: number;
  startHour: number;
  endHour: number;
  colorIndex: number;
  type: 'class' | 'event' | 'personal';
}

export const useSchedule = () =>
  useQuery({
    queryKey: ['timetable'],
    queryFn: () => api.get<ScheduleBlockItem[]>('/timetable'),
  });

export const useCreateScheduleBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ScheduleBlockItem, 'id'>) =>
      api.post('/timetable/blocks', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
};

export const useUpdateScheduleBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ScheduleBlockItem> & { id: string }) =>
      api.patch(`/timetable/blocks/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
};

export const useDeleteScheduleBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) => api.delete(`/timetable/blocks/${blockId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
};

export const useBulkImportSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blocks: Omit<ScheduleBlockItem, 'id'>[]) =>
      api.post('/timetable/import', { blocks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
};
