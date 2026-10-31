import { supabase } from './supabase';
import type {
  Community,
  CommunityPost,
  CommunityComment,
  CommunityType,
} from '../types/community';

const LOCAL_COMMUNITIES_KEY = 'komikinaja_demo_communities';
const LOCAL_POSTS_KEY = 'komikinaja_demo_posts';
const LOCAL_COMMENTS_KEY = 'komikinaja_demo_comments';
const LOCAL_MEMBERSHIP_KEY = 'komikinaja_demo_memberships';

// Data bawaan awal agar komunitas langsung hidup dan bisa dites
const DEFAULT_COMMUNITIES: Community[] = [
  {
    id: 'comm-creator-si-juki',
    type: 'creator',
    targetId: 'author-juki',
    name: 'Official Faza Meonk & Si Juki',
    description: 'Komunitas resmi pembaca & penggemar karya Faza Meonk. Berbagi bocoran chapter, obrolan santai, dan update terbaru!',
    rules: '1. Saling menghormati sesama member. 2. Gunakan tag spoiler untuk bocoran cerita. 3. Dilarang spam atau promosi tanpa izin.',
    avatarUrl: 'https://placehold.co/150x150/1F2544/FFFFFF/png?text=SJ',
    coverUrl: 'https://placehold.co/800x300/1F2544/EAE3D2/png?text=Si+Juki+Universe',
    creatorId: 'author-juki',
    memberCount: 342,
    postCount: 18,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'comm-comic-solo-leveling',
    type: 'comic',
    targetId: '121496', // Kitsu ID contoh Solo Leveling
    name: 'Solo Leveling Community ID',
    description: 'Ruang diskusi seru para hunter tentang Sung Jin-woo, Shadow Army, dan Monarch!',
    rules: '1. Tandai spoiler untuk chapter terbaru. 2. Jaga sportivitas saat adu teori. 3. SFW only.',
    avatarUrl: 'https://placehold.co/150x150/1F2544/FFFFFF/png?text=SL',
    coverUrl: 'https://placehold.co/800x300/1F2544/EAE3D2/png?text=Solo+Leveling+Discussions',
    creatorId: null,
    memberCount: 890,
    postCount: 45,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'comm-creator-garudayana',
    type: 'creator',
    targetId: 'author-isma',
    name: 'Garudayana Official Guild',
    description: 'Wadah berkumpulnya pejuang wayang futuristik & pembaca Garudayana karya Is Yuniarto.',
    rules: '1. Hargai karya orisinal. 2. Diskusi ramah dan membangun.',
    avatarUrl: 'https://placehold.co/150x150/1F2544/FFFFFF/png?text=GY',
    coverUrl: 'https://placehold.co/800x300/1F2544/EAE3D2/png?text=Garudayana+Guild',
    creatorId: 'author-isma',
    memberCount: 215,
    postCount: 12,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const DEFAULT_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    communityId: 'comm-creator-si-juki',
    authorId: 'author-juki',
    authorName: 'Faza Meonk',
    authorAvatar: 'https://placehold.co/150x150/1F2544/FFFFFF/png?text=FM',
    title: 'Bocoran Sketsa Karakter Baru untuk Episode Depan!',
    content: 'Halo teman-teman pembaca KomikinAja! Di chapter mendatang Juki bakal ketemu rival baru yang super kocak. Menurut kalian cocoknya namanya siapa nih? Jangan lupa dukung terus ya!',
    isAuthorBadge: true,
    isSpoiler: false,
    likesCount: 54,
    commentsCount: 8,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'post-2',
    communityId: 'comm-comic-solo-leveling',
    authorId: 'user-dimas',
    authorName: 'Dimas Hunter',
    authorAvatar: null,
    title: 'Teori tentang Asal Usul Shadow Monarch!',
    content: '[SPOILER] Buat yang udah baca sampai chapter akhir, gimana menurut kalian soal pengorbanan Ashborn saat ngasih kekuatan ke Jin-woo? Ternyata udah direncanain dari awal!',
    isAuthorBadge: false,
    isSpoiler: true,
    likesCount: 32,
    commentsCount: 14,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

// Helper Local Storage
const getLocalCommunities = (): Community[] => {
  if (typeof window === 'undefined') return DEFAULT_COMMUNITIES;
  const raw = window.localStorage.getItem(LOCAL_COMMUNITIES_KEY);
  if (!raw) {
    window.localStorage.setItem(LOCAL_COMMUNITIES_KEY, JSON.stringify(DEFAULT_COMMUNITIES));
    return DEFAULT_COMMUNITIES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COMMUNITIES;
  }
};

const saveLocalCommunities = (list: Community[]): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_COMMUNITIES_KEY, JSON.stringify(list));
};

const getLocalPosts = (): CommunityPost[] => {
  if (typeof window === 'undefined') return DEFAULT_POSTS;
  const raw = window.localStorage.getItem(LOCAL_POSTS_KEY);
  if (!raw) {
    window.localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(DEFAULT_POSTS));
    return DEFAULT_POSTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_POSTS;
  }
};

const saveLocalPosts = (list: CommunityPost[]): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(list));
};

const getLocalComments = (): CommunityComment[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(LOCAL_COMMENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveLocalComments = (list: CommunityComment[]): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(list));
};

const getMemberships = (userId: string): string[] => {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_MEMBERSHIP_KEY + '_' + userId);
    return raw ? JSON.parse(raw) : ['comm-creator-si-juki'];
  } catch {
    return ['comm-creator-si-juki'];
  }
};

const saveMemberships = (userId: string, ids: string[]): void => {
  if (typeof window === 'undefined' || !userId) return;
  window.localStorage.setItem(LOCAL_MEMBERSHIP_KEY + '_' + userId, JSON.stringify(ids));
};

// ----------------------------------------------------------------------
// Exported Services
// ----------------------------------------------------------------------

/** Daftar semua komunitas dengan opsi filter */
export const listCommunities = async (
  type?: 'all' | 'creator' | 'comic',
  userId?: string,
): Promise<Community[]> => {
  const all = getLocalCommunities();
  const joinedIds = userId ? getMemberships(userId) : [];

  let filtered = all;
  if (type && type !== 'all') {
    filtered = all.filter((c) => c.type === type);
  }

  return filtered.map((c) => ({
    ...c,
    isMember: joinedIds.includes(c.id),
  }));
};

/** Ambil komunitas yang diikuti pengguna */
export const getMyCommunities = async (userId: string): Promise<Community[]> => {
  if (!userId) return [];
  const joinedIds = getMemberships(userId);
  const all = getLocalCommunities();
  return all
    .filter((c) => joinedIds.includes(c.id))
    .map((c) => ({ ...c, isMember: true }));
};

/** Ambil detail satu komunitas */
export const getCommunityDetail = async (
  communityId: string,
  userId?: string,
): Promise<Community | null> => {
  const all = getLocalCommunities();
  const found = all.find((c) => c.id === communityId);
  if (!found) return null;

  const joinedIds = userId ? getMemberships(userId) : [];
  return {
    ...found,
    isMember: joinedIds.includes(found.id),
  };
};

/** Gabung atau keluar dari komunitas */
export const toggleJoinCommunity = async (
  communityId: string,
  userId: string,
): Promise<{ isMember: boolean; memberCount: number }> => {
  const joinedIds = getMemberships(userId);
  const isCurrentlyMember = joinedIds.includes(communityId);
  const all = getLocalCommunities();
  const comm = all.find((c) => c.id === communityId);

  let newMemberCount = comm ? comm.memberCount : 0;
  let newIds: string[];

  if (isCurrentlyMember) {
    newIds = joinedIds.filter((id) => id !== communityId);
    newMemberCount = Math.max(0, newMemberCount - 1);
  } else {
    newIds = [...joinedIds, communityId];
    newMemberCount += 1;
  }

  saveMemberships(userId, newIds);

  if (comm) {
    comm.memberCount = newMemberCount;
    saveLocalCommunities(all);
  }

  if (supabase) {
    try {
      if (isCurrentlyMember) {
        await supabase
          .from('community_members')
          .delete()
          .eq('community_id', communityId)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('community_members')
          .insert({ community_id: communityId, user_id: userId });
      }
    } catch {
      // Supabase fallback
    }
  }

  return { isMember: !isCurrentlyMember, memberCount: newMemberCount };
};

/** Ambil daftar postingan dalam komunitas */
export const listCommunityPosts = async (communityId: string): Promise<CommunityPost[]> => {
  const posts = getLocalPosts();
  return posts
    .filter((p) => p.communityId === communityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/** Buat postingan baru di komunitas */
export const createCommunityPost = async (input: {
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  title: string;
  content: string;
  isAuthorBadge?: boolean;
  isSpoiler?: boolean;
}): Promise<CommunityPost> => {
  const newPost: CommunityPost = {
    id: 'post-' + crypto.randomUUID(),
    communityId: input.communityId,
    authorId: input.authorId,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    title: input.title.trim(),
    content: input.content.trim(),
    isAuthorBadge: Boolean(input.isAuthorBadge),
    isSpoiler: Boolean(input.isSpoiler),
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  };

  const all = getLocalPosts();
  all.unshift(newPost);
  saveLocalPosts(all);

  // Update postCount pada komunitas
  const comms = getLocalCommunities();
  const comm = comms.find((c) => c.id === input.communityId);
  if (comm) {
    comm.postCount += 1;
    saveLocalCommunities(comms);
  }

  return newPost;
};

/** Suka postingan (Like) */
export const likePost = async (postId: string): Promise<number> => {
  const posts = getLocalPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return 0;
  post.likesCount += 1;
  saveLocalPosts(posts);
  return post.likesCount;
};

/** Ambil komentar untuk postingan */
export const listPostComments = async (postId: string): Promise<CommunityComment[]> => {
  const comments = getLocalComments();
  return comments.filter((c) => c.postId === postId);
};

/** Tambah komentar pada postingan */
export const addPostComment = async (input: {
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  isSpoiler?: boolean;
}): Promise<CommunityComment> => {
  const newComment: CommunityComment = {
    id: 'comment-' + crypto.randomUUID(),
    postId: input.postId,
    userId: input.userId,
    userName: input.userName,
    userAvatar: input.userAvatar,
    content: input.content.trim(),
    isSpoiler: Boolean(input.isSpoiler),
    createdAt: new Date().toISOString(),
  };

  const comments = getLocalComments();
  comments.push(newComment);
  saveLocalComments(comments);

  // Update komentar count di post
  const posts = getLocalPosts();
  const post = posts.find((p) => p.id === input.postId);
  if (post) {
    post.commentsCount += 1;
    saveLocalPosts(posts);
  }

  return newComment;
};

/** Cari atau buat komunitas untuk suatu komik atau author */
export const getOrCreateCommunity = async (
  type: CommunityType,
  targetId: string,
  name: string,
  avatarUrl?: string,
  coverUrl?: string,
  creatorId?: string,
): Promise<Community> => {
  const all = getLocalCommunities();
  const existing = all.find((c) => c.type === type && c.targetId === targetId);
  if (existing) return existing;

  const newComm: Community = {
    id: `comm-${type}-${targetId}`,
    type,
    targetId,
    name,
    description: `Selamat datang di komunitas ${name}! Ruang diskusi ramah dan seru untuk para pembaca setia.`,
    rules: '1. Saling menghormati. 2. Gunakan tag spoiler untuk bocoran cerita. 3. SFW only.',
    avatarUrl: avatarUrl || 'https://placehold.co/150x150/1F2544/FFFFFF/png?text=' + encodeURIComponent(name.charAt(0)),
    coverUrl: coverUrl || 'https://placehold.co/800x300/1F2544/EAE3D2/png?text=' + encodeURIComponent(name),
    creatorId: creatorId || null,
    memberCount: 1,
    postCount: 0,
    isMember: true,
    createdAt: new Date().toISOString(),
  };

  all.push(newComm);
  saveLocalCommunities(all);
  return newComm;
};
