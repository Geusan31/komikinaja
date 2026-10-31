import { supabase } from './supabase';
import type {
  CoinPackage,
  Transaction,
  SupportMessage,
  SupporterLeaderboardItem,
  CreatorEarningsSummary,
} from '../types/monetization';

// Paket Koin Demo sesuai PRD v2.2 (dengan label jelas dan harga simulasi)
export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'demo-pack-starter',
    name: 'Paket Pemula',
    coinAmount: 100,
    priceIdr: 10000,
    popular: false,
  },
  {
    id: 'demo-pack-popular',
    name: 'Paket Populer',
    coinAmount: 300,
    priceIdr: 28000,
    bonusCoins: 20,
    popular: true,
  },
  {
    id: 'demo-pack-fan',
    name: 'Paket Antusias',
    coinAmount: 650,
    priceIdr: 55000,
    bonusCoins: 50,
    popular: false,
  },
  {
    id: 'demo-pack-sultan',
    name: 'Paket Sultan',
    coinAmount: 1400,
    priceIdr: 110000,
    bonusCoins: 150,
    popular: false,
  },
];

const LOCAL_WALLET_PREFIX = 'komikinaja_demo_wallet_';
const LOCAL_TX_KEY = 'komikinaja_demo_tx_';
const LOCAL_UNLOCK_KEY = 'komikinaja_demo_unlocks_';
const LOCAL_TIPS_KEY = 'komikinaja_demo_tips';

const getLocalCoins = (userId: string): number => {
  if (typeof window === 'undefined') return 200;
  const val = window.localStorage.getItem(LOCAL_WALLET_PREFIX + userId);
  if (val === null) {
    // Berikan modal awal 200 koin demo untuk pengujian UX yang mulus
    window.localStorage.setItem(LOCAL_WALLET_PREFIX + userId, '200');
    return 200;
  }
  return Number(val) || 0;
};

const setLocalCoins = (userId: string, coins: number): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_WALLET_PREFIX + userId, String(Math.max(0, coins)));
};

const getLocalTransactions = (userId: string): Transaction[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_TX_KEY + userId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const addLocalTransaction = (userId: string, tx: Transaction): void => {
  if (typeof window === 'undefined') return;
  const list = getLocalTransactions(userId);
  list.unshift(tx);
  window.localStorage.setItem(LOCAL_TX_KEY + userId, JSON.stringify(list));
};

const getLocalUnlocks = (userId: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_UNLOCK_KEY + userId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const addLocalUnlock = (userId: string, chapterId: string): void => {
  if (typeof window === 'undefined') return;
  const list = getLocalUnlocks(userId);
  if (!list.includes(chapterId)) {
    list.push(chapterId);
    window.localStorage.setItem(LOCAL_UNLOCK_KEY + userId, JSON.stringify(list));
  }
};

const getAllLocalSupportMessages = (): SupportMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_TIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const addLocalSupportMessage = (msg: SupportMessage): void => {
  if (typeof window === 'undefined') return;
  const list = getAllLocalSupportMessages();
  list.unshift(msg);
  window.localStorage.setItem(LOCAL_TIPS_KEY, JSON.stringify(list));
};

// ----------------------------------------------------------------------
// API Wallet
// ----------------------------------------------------------------------

/** Mengambil saldo koin pembaca (dengan sync lokal demo) */
export const getCoinBalance = async (userId: string): Promise<number> => {
  if (!userId) return 0;
  if (!supabase) return getLocalCoins(userId);

  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance_coins')
      .eq('user_id', userId)
      .eq('wallet_type', 'reader')
      .maybeSingle();

    if (error || !data) {
      return getLocalCoins(userId);
    }
    return Number(data.balance_coins);
  } catch {
    return getLocalCoins(userId);
  }
};

/** Top-up Koin Demo (Simulasi) */
export const topUpCoinsDemo = async (
  userId: string,
  pkg: CoinPackage,
): Promise<{ success: boolean; newBalance: number; error: string | null }> => {
  if (!userId) return { success: false, newBalance: 0, error: 'User tidak ditemukan' };

  const totalAdded = pkg.coinAmount + (pkg.bonusCoins || 0);
  const current = getLocalCoins(userId);
  const newBal = current + totalAdded;
  setLocalCoins(userId, newBal);

  const tx: Transaction = {
    id: 'demo-tx-' + crypto.randomUUID(),
    type: 'top_up',
    status: 'succeeded',
    actorUserId: userId,
    coinAmount: totalAdded,
    grossAmountIdr: pkg.priceIdr,
    isDemo: true,
    metadata: { packageName: pkg.name, bonusCoins: pkg.bonusCoins || 0 },
    createdAt: new Date().toISOString(),
  };
  addLocalTransaction(userId, tx);

  if (supabase) {
    try {
      await supabase.from('wallets').upsert({
        user_id: userId,
        wallet_type: 'reader',
        balance_coins: newBal,
        updated_at: new Date().toISOString(),
      });
      await supabase.from('transactions').insert({
        id: tx.id,
        transaction_type: 'top_up',
        status: 'succeeded',
        actor_user_id: userId,
        coin_amount: totalAdded,
        gross_amount_idr: pkg.priceIdr,
        is_demo: true,
        metadata: tx.metadata,
      });
    } catch {
      // Abaikan bila skema belum dieksekusi di Supabase
    }
  }

  return { success: true, newBalance: newBal, error: null };
};

/** Cek apakah chapter sudah di-unlock oleh user */
export const isChapterUnlocked = async (userId: string, chapterId: string): Promise<boolean> => {
  if (!userId || !chapterId) return false;
  const localList = getLocalUnlocks(userId);
  if (localList.includes(chapterId)) return true;

  if (!supabase) return false;
  try {
    const { data } = await supabase
      .from('chapter_unlocks')
      .select('id')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .maybeSingle();
    if (data) {
      addLocalUnlock(userId, chapterId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/** Membuka Chapter Premium dengan Koin */
export const unlockChapter = async (
  userId: string,
  comicId: string,
  comicTitle: string,
  chapterId: string,
  chapterNumber: number,
  priceCoins: number,
  creatorId?: string | null,
): Promise<{ success: boolean; newBalance: number; error: string | null }> => {
  if (!userId) return { success: false, newBalance: 0, error: 'Silakan masuk terlebih dahulu' };

  // Cegah double billing
  const already = await isChapterUnlocked(userId, chapterId);
  if (already) {
    const cur = await getCoinBalance(userId);
    return { success: true, newBalance: cur, error: null };
  }

  const currentCoins = await getCoinBalance(userId);
  if (currentCoins < priceCoins) {
    return {
      success: false,
      newBalance: currentCoins,
      error: `Saldo koin tidak mencukupi (Butuh ${priceCoins} koin, saldo kamu ${currentCoins} koin).`,
    };
  }

  const newBal = currentCoins - priceCoins;
  setLocalCoins(userId, newBal);
  addLocalUnlock(userId, chapterId);

  const tx: Transaction = {
    id: 'demo-tx-' + crypto.randomUUID(),
    type: 'chapter_purchase',
    status: 'succeeded',
    actorUserId: userId,
    recipientUserId: creatorId,
    comicId,
    comicTitle,
    chapterId,
    chapterNumber,
    coinAmount: priceCoins,
    isDemo: true,
    createdAt: new Date().toISOString(),
  };
  addLocalTransaction(userId, tx);

  if (supabase) {
    try {
      await supabase.from('wallets').upsert({
        user_id: userId,
        wallet_type: 'reader',
        balance_coins: newBal,
        updated_at: new Date().toISOString(),
      });
      await supabase.from('chapter_unlocks').insert({
        user_id: userId,
        chapter_id: chapterId,
      });
      await supabase.from('transactions').insert({
        id: tx.id,
        transaction_type: 'chapter_purchase',
        status: 'succeeded',
        actor_user_id: userId,
        recipient_user_id: creatorId,
        comic_id: comicId,
        chapter_id: chapterId,
        coin_amount: priceCoins,
        is_demo: true,
      });
      if (creatorId) {
        // Alokasikan pembagian hasil (70% kreator, 30% platform)
        const creatorCoins = Math.floor(priceCoins * 0.7);
        const platformCoins = priceCoins - creatorCoins;
        await supabase.from('creator_earnings').insert({
          creator_id: creatorId,
          transaction_id: tx.id,
          gross_coins: priceCoins,
          platform_fee_coins: platformCoins,
          creator_net_coins: creatorCoins,
          status: 'available',
        });
      }
    } catch {
      // Supabase fallback
    }
  }

  return { success: true, newBalance: newBal, error: null };
};

/** Mengirim Tip / Dukungan kepada Kreator */
export const sendAuthorTip = async (input: {
  donorUserId: string;
  donorName: string;
  donorAvatar: string | null;
  creatorId: string;
  comicId?: string | null;
  comicTitle?: string | null;
  coinAmount: number;
  message?: string;
  isAnonymous?: boolean;
}): Promise<{ success: boolean; newBalance: number; error: string | null }> => {
  const { donorUserId, donorName, donorAvatar, creatorId, comicId, comicTitle, coinAmount, message, isAnonymous } =
    input;

  if (!donorUserId) return { success: false, newBalance: 0, error: 'Silakan masuk terlebih dahulu' };
  if (donorUserId === creatorId) {
    return { success: false, newBalance: 0, error: 'Kreator tidak dapat memberi tip pada diri sendiri.' };
  }
  if (coinAmount <= 0) {
    return { success: false, newBalance: 0, error: 'Jumlah koin harus lebih dari nol.' };
  }

  const current = await getCoinBalance(donorUserId);
  if (current < coinAmount) {
    return {
      success: false,
      newBalance: current,
      error: `Saldo koin tidak mencukupi (Butuh ${coinAmount} koin, saldo kamu ${current} koin).`,
    };
  }

  const newBal = current - coinAmount;
  setLocalCoins(donorUserId, newBal);

  const txId = 'demo-tx-' + crypto.randomUUID();
  const tx: Transaction = {
    id: txId,
    type: 'author_tip',
    status: 'succeeded',
    actorUserId: donorUserId,
    recipientUserId: creatorId,
    comicId,
    comicTitle,
    coinAmount,
    isDemo: true,
    metadata: { message, isAnonymous: Boolean(isAnonymous) },
    createdAt: new Date().toISOString(),
  };
  addLocalTransaction(donorUserId, tx);

  const supportMsg: SupportMessage = {
    id: 'demo-msg-' + crypto.randomUUID(),
    donorUserId,
    donorName: isAnonymous ? 'Supporter Baik Hati' : donorName,
    donorAvatar: isAnonymous ? null : donorAvatar,
    creatorId,
    comicId,
    comicTitle,
    coinAmount,
    message: message?.trim() || null,
    isAnonymous: Boolean(isAnonymous),
    createdAt: new Date().toISOString(),
  };
  addLocalSupportMessage(supportMsg);

  if (supabase) {
    try {
      await supabase.from('wallets').upsert({
        user_id: donorUserId,
        wallet_type: 'reader',
        balance_coins: newBal,
        updated_at: new Date().toISOString(),
      });
      await supabase.from('transactions').insert({
        id: txId,
        transaction_type: 'author_tip',
        status: 'succeeded',
        actor_user_id: donorUserId,
        recipient_user_id: creatorId,
        comic_id: comicId,
        coin_amount: coinAmount,
        is_demo: true,
      });
      await supabase.from('support_messages').insert({
        id: supportMsg.id,
        transaction_id: txId,
        donor_user_id: donorUserId,
        creator_id: creatorId,
        comic_id: comicId,
        coin_amount: coinAmount,
        message: supportMsg.message,
        is_anonymous: Boolean(isAnonymous),
      });
      const creatorCoins = Math.floor(coinAmount * 0.7);
      const platformCoins = coinAmount - creatorCoins;
      await supabase.from('creator_earnings').insert({
        creator_id: creatorId,
        transaction_id: txId,
        gross_coins: coinAmount,
        platform_fee_coins: platformCoins,
        creator_net_coins: creatorCoins,
        status: 'available',
      });
    } catch {
      // Supabase fallback
    }
  }

  return { success: true, newBalance: newBal, error: null };
};

/** Ambil Support Wall & Leaderboard Supporter */
export const getSupportWall = async (
  target: { creatorId?: string; comicId?: string },
): Promise<{ leaderboard: SupporterLeaderboardItem[]; recentMessages: SupportMessage[] }> => {
  let messages = getAllLocalSupportMessages();

  if (target.comicId) {
    messages = messages.filter((m) => m.comicId === target.comicId);
  } else if (target.creatorId) {
    messages = messages.filter((m) => m.creatorId === target.creatorId);
  }

  // Hitung leaderboard total koin per donor
  const totals: Record<string, { name: string; avatar: string | null; coins: number; lastMsg?: string | null }> = {};
  messages.forEach((m) => {
    const key = m.isAnonymous ? 'anon' : m.donorUserId;
    if (!totals[key]) {
      totals[key] = {
        name: m.isAnonymous ? 'Supporter Baik Hati' : m.donorName,
        avatar: m.isAnonymous ? null : m.donorAvatar,
        coins: 0,
        lastMsg: m.message,
      };
    }
    totals[key].coins += m.coinAmount;
    if (m.message) totals[key].lastMsg = m.message;
  });

  const leaderboard: SupporterLeaderboardItem[] = Object.entries(totals)
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      userAvatar: data.avatar,
      totalCoins: data.coins,
      rank: 0,
      recentMessage: data.lastMsg,
    }))
    .sort((a, b) => b.totalCoins - a.totalCoins)
    .slice(0, 5)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  return {
    leaderboard,
    recentMessages: messages.slice(0, 10),
  };
};

/** Ambil Ringkasan Pendapatan Kreator (Creator Wallet) */
export const getCreatorEarningsSummary = async (creatorId: string): Promise<CreatorEarningsSummary> => {
  const allTips = getAllLocalSupportMessages().filter((m) => m.creatorId === creatorId);
  const grossCoins = allTips.reduce((acc, m) => acc + m.coinAmount, 0);
  const platformFeeCoins = Math.round(grossCoins * 0.3); // 30% platform
  const netCoins = grossCoins - platformFeeCoins; // 70% net
  const estimatedNetIdr = netCoins * 100; // Simulasi 1 Koin = ~Rp 100

  return {
    grossCoins,
    platformFeeCoins,
    netCoins,
    availablePayoutCoins: netCoins,
    estimatedNetIdr,
  };
};

/** Ambil Riwayat Transaksi Pengguna */
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  return getLocalTransactions(userId);
};
