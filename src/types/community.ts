export type CommunityType = 'creator' | 'comic';

export interface Community {
  id: string;
  type: CommunityType;
  targetId: string; // authorId atau comicId
  name: string;
  description: string | null;
  rules: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  creatorId: string | null;
  memberCount: number;
  postCount: number;
  isMember?: boolean;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  title: string;
  content: string;
  isAuthorBadge: boolean;
  isSpoiler: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  isSpoiler: boolean;
  createdAt: string;
}

export interface CommunityReport {
  id: string;
  targetType: 'post' | 'comment';
  targetId: string;
  reporterId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}
