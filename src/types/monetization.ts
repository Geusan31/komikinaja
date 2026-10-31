export type TransactionType = 'top_up' | 'chapter_purchase' | 'author_tip' | 'work_support';
export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled';

export interface CoinPackage {
  id: string;
  name: string;
  coinAmount: number;
  priceIdr: number;
  bonusCoins?: number;
  popular?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  actorUserId: string;
  recipientUserId?: string | null;
  comicId?: string | null;
  comicTitle?: string | null;
  chapterId?: string | null;
  chapterNumber?: number | null;
  coinAmount: number;
  grossAmountIdr?: number;
  isDemo: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ChapterUnlock {
  id: string;
  userId: string;
  chapterId: string;
  unlockedAt: string;
}

export interface SupportMessage {
  id: string;
  donorUserId: string;
  donorName: string;
  donorAvatar: string | null;
  creatorId: string;
  comicId?: string | null;
  comicTitle?: string | null;
  coinAmount: number;
  message?: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

export interface SupporterLeaderboardItem {
  userId: string;
  userName: string;
  userAvatar: string | null;
  totalCoins: number;
  rank: number;
  recentMessage?: string | null;
}

export interface CreatorEarningsSummary {
  grossCoins: number;
  platformFeeCoins: number;
  netCoins: number;
  availablePayoutCoins: number;
  estimatedNetIdr: number;
}
