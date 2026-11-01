import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Users,
  MessageSquare,
  Heart,
  Flag,
  Send,
  EyeOff,
  ShieldAlert,
  Plus,
  BookOpen,
  Info,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getCommunityDetail,
  toggleJoinCommunity,
  listCommunityPosts,
  createCommunityPost,
  likePost,
  listPostComments,
  addPostComment,
} from '../services/community';
import type { Community, CommunityPost, CommunityComment } from '../types/community';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  return `${days} hari lalu`;
}

// ---------------------------------------------------------------------------
// Report modal
// ---------------------------------------------------------------------------

interface ReportModalProps {
  targetType: 'post' | 'comment';
  targetId: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ targetType, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);

  const REASONS = [
    'Spam atau iklan tidak diinginkan',
    'Ujaran kebencian atau pelecehan',
    'Pelanggaran hak cipta',
    'Spoiler tidak diberi label',
    'Konten tidak pantas (NSFW)',
    'Lainnya',
  ];

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason);
    setDone(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('community.report')}
    >
      <div className="bg-background rounded-xl border border-primary/20 p-6 w-full max-w-md shadow-xl flex flex-col gap-4">
        {done ? (
          <>
            <div className="flex items-center gap-2 text-primary font-bold">
              <ShieldAlert size={20} className="text-primary" aria-hidden="true" />
              {t('community.reportSuccess')}
            </div>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 bg-primary text-white font-semibold text-sm rounded-md hover:bg-primary-hover transition-colors cursor-pointer"
            >
              {t('common.back')}
            </button>
          </>
        ) : (
          <>
            <h2 className="font-heading font-bold text-lg text-primary flex items-center gap-2">
              <Flag size={18} aria-hidden="true" />
              {t('community.report')} {targetType === 'post' ? 'Postingan' : 'Komentar'}
            </h2>
            <p className="text-xs text-gray-600">Pilih alasan laporan pelanggaran:</p>
            <div className="flex flex-col gap-2">
              {REASONS.map(r => (
                <label key={r} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer p-2 rounded-md hover:bg-surface transition-colors">
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-primary"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-primary/30 text-primary font-semibold text-sm rounded-md hover:bg-primary/5 transition-colors cursor-pointer"
              >
                {t('detail.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Kirim Laporan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Spoiler wrapper
// ---------------------------------------------------------------------------

const SpoilerWrapper: React.FC<{ isSpoiler: boolean; children: React.ReactNode }> = ({
  isSpoiler,
  children,
}) => {
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);

  if (!isSpoiler) return <>{children}</>;

  return (
    <div className="relative">
      <div className={revealed ? '' : 'blur-md select-none pointer-events-none transition-all'}>{children}</div>
      {!revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 z-10 p-3">
          <div className="bg-surface/95 border border-primary/20 text-primary rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <EyeOff size={14} className="text-primary/70" aria-hidden="true" />
              {t('community.spoilerWarning')}
            </div>
            <button
              onClick={() => setRevealed(true)}
              className="text-xs font-bold text-primary underline hover:text-primary-hover cursor-pointer"
            >
              {t('community.revealSpoiler')}
            </button>
          </div>
        </div>
      )}
      {revealed && (
        <button
          onClick={() => setRevealed(false)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary mt-1 font-medium cursor-pointer"
        >
          <EyeOff size={12} aria-hidden="true" /> {t('community.hideSpoiler')}
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Comment thread (expanded from post)
// ---------------------------------------------------------------------------

interface CommentThreadProps {
  postId: string;
}

const CommentThread: React.FC<CommentThreadProps> = ({ postId }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSpoilerComment, setIsSpoilerComment] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listPostComments(postId).then(data => {
      if (!cancelled) { setComments(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [postId]);

  const handlePost = async () => {
    if (!user || !text.trim()) return;
    setPosting(true);
    const comment = await addPostComment({
      postId,
      userId: user.id,
      userName: user.name || user.email,
      userAvatar: user.avatar || null,
      content: text.trim(),
      isSpoiler: isSpoilerComment,
    });
    setComments(prev => [...prev, comment]);
    setText('');
    setIsSpoilerComment(false);
    setPosting(false);
  };

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-primary/10">
      {loading ? (
        <div className="h-8 bg-surface rounded animate-pulse" />
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-500 italic py-1">Belum ada komentar.</p>
      ) : (
        comments.map(c => (
          <SpoilerWrapper key={c.id} isSpoiler={c.isSpoiler}>
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden border border-primary/20">
                {c.userAvatar
                  ? <img src={c.userAvatar} alt={c.userName} className="w-full h-full object-cover" />
                  : c.userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-surface rounded-lg px-3.5 py-2 border border-primary/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">{c.userName}</span>
                  <span className="text-[11px] text-gray-500">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-700 mt-1 leading-relaxed">{c.content}</p>
              </div>
            </div>
          </SpoilerWrapper>
        ))
      )}

      {user ? (
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t('community.commentPlaceholder')}
              className="flex-1 px-3.5 py-2 text-xs border border-primary/20 rounded-md outline-none focus:border-primary transition-colors bg-background text-primary"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
            />
            <button
              onClick={handlePost}
              disabled={posting || !text.trim()}
              className="p-2 bg-primary text-white rounded-md disabled:opacity-50 hover:bg-primary-hover transition-colors cursor-pointer"
              aria-label="Kirim komentar"
            >
              <Send size={15} aria-hidden="true" />
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSpoilerComment}
              onChange={e => setIsSpoilerComment(e.target.checked)}
              className="accent-primary"
            />
            {t('community.isSpoiler')}
          </label>
        </div>
      ) : (
        <p className="text-xs text-gray-500 py-1">{t('comments.loginToComment')}</p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Post card
// ---------------------------------------------------------------------------

interface PostCardProps {
  post: CommunityPost;
  onLike: (id: string) => void;
  onReport: (type: 'post', id: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onReport }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);

  return (
    <article className="bg-surface rounded-xl border border-primary/15 p-5 flex flex-col gap-3.5 shadow-sm">
      {/* Author Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-primary/10 overflow-hidden shrink-0 border border-primary/20 flex items-center justify-center">
          {post.authorAvatar ? (
            <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary font-heading font-bold text-sm">
              {post.authorName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-bold text-primary text-sm">{post.authorName}</span>
            {post.isAuthorBadge && (
              <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-semibold rounded-md">
                {t('community.authorBadge')}
              </span>
            )}
            {post.isSpoiler && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold rounded-md flex items-center gap-1">
                <EyeOff size={11} aria-hidden="true" />
                {t('community.spoilerWarning')}
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-500">{timeAgo(post.createdAt)}</span>
        </div>

        {user && (
          <button
            onClick={() => onReport('post', post.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50 cursor-pointer"
            aria-label={t('community.report')}
            title={t('community.report')}
          >
            <Flag size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Content */}
      <SpoilerWrapper isSpoiler={post.isSpoiler}>
        <div className="flex flex-col gap-1.5">
          {post.title && (
            <h3 className="font-heading font-bold text-primary text-base leading-snug">
              {post.title}
            </h3>
          )}
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      </SpoilerWrapper>

      {/* Actions */}
      <div className="flex items-center gap-5 pt-1 border-t border-primary/10 text-xs text-gray-600">
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 hover:text-red-600 transition-colors cursor-pointer font-medium"
          aria-label={t('community.like')}
        >
          <Heart size={15} aria-hidden="true" />
          <span>{post.likesCount}</span>
        </button>
        <button
          onClick={() => setShowComments(prev => !prev)}
          className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer font-medium"
        >
          <MessageSquare size={15} aria-hidden="true" />
          <span>{post.commentsCount} {t('community.posts')}</span>
        </button>
      </div>

      {showComments && <CommentThread postId={post.id} />}
    </article>
  );
};

// ---------------------------------------------------------------------------
// Create post form
// ---------------------------------------------------------------------------

interface CreatePostFormProps {
  communityId: string;
  onCreated: (post: CommunityPost) => void;
  isAuthorOfCommunity: boolean;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ communityId, onCreated, isAuthorOfCommunity }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    setError('');
    try {
      const post = await createCommunityPost({
        communityId,
        authorId: user.id,
        authorName: user.name || user.email,
        authorAvatar: user.avatar || null,
        title: title.trim(),
        content: content.trim(),
        isAuthorBadge: isAuthorOfCommunity,
        isSpoiler,
      });
      onCreated(post);
      setTitle('');
      setContent('');
      setIsSpoiler(false);
      setOpen(false);
    } catch {
      setError('Gagal membuat postingan. Coba lagi.');
    } finally {
      setPosting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-dashed border-primary/30 rounded-xl bg-surface/40 hover:bg-surface text-primary transition-all font-semibold text-sm cursor-pointer"
      >
        <Plus size={16} aria-hidden="true" />
        {t('community.createPost')}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-primary/20 p-5 flex flex-col gap-3 shadow-sm">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={t('community.postTitlePlaceholder')}
        className="w-full px-3.5 py-2.5 border border-primary/20 rounded-md text-sm outline-none focus:border-primary transition-colors bg-background font-semibold text-primary"
        maxLength={120}
      />
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={t('community.postContentPlaceholder')}
        rows={4}
        className="w-full px-3.5 py-2.5 border border-primary/20 rounded-md text-sm outline-none focus:border-primary transition-colors bg-background resize-none text-primary"
        maxLength={2000}
        required
      />
      <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isSpoiler}
          onChange={e => setIsSpoiler(e.target.checked)}
          className="accent-primary"
        />
        {t('community.isSpoiler')}
      </label>
      {error && <p role="alert" className="text-red-500 text-xs font-medium">{error}</p>}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => { setOpen(false); setTitle(''); setContent(''); setError(''); }}
          className="flex-1 py-2 px-4 border border-primary/30 text-primary font-semibold rounded-md hover:bg-primary/5 transition-colors text-sm cursor-pointer"
        >
          {t('detail.cancel')}
        </button>
        <button
          type="submit"
          disabled={posting || !content.trim()}
          className="flex-1 py-2 px-4 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors text-sm cursor-pointer"
        >
          {posting ? t('common.loading') : 'Posting'}
        </button>
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [joinBusy, setJoinBusy] = useState(false);

  // Report modal state
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([
      getCommunityDetail(id, user?.id),
      listCommunityPosts(id),
    ]).then(([comm, postList]) => {
      if (!cancelled) {
        setCommunity(comm);
        setPosts(postList);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) { setError(true); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [id, user?.id]);

  const handleToggleJoin = async () => {
    if (!user || !id) return;
    setJoinBusy(true);
    const result = await toggleJoinCommunity(id, user.id);
    setCommunity(prev => prev ? { ...prev, isMember: result.isMember, memberCount: result.memberCount } : prev);
    setJoinBusy(false);
  };

  const handleLike = async (postId: string) => {
    const newCount = await likePost(postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likesCount: newCount } : p));
  };

  const handleReport = (type: 'post' | 'comment', targetId: string) => {
    setReportTarget({ type, id: targetId });
  };

  const handlePostCreated = (post: CommunityPost) => {
    setPosts(prev => [post, ...prev]);
    setCommunity(prev => prev ? { ...prev, postCount: prev.postCount + 1 } : prev);
  };

  const isAuthorOfCommunity = Boolean(
    user && community?.creatorId && community.creatorId === user.id,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
          <div className="h-44 bg-surface rounded-xl animate-pulse" />
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-surface rounded-xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <p className="text-red-500 font-semibold">{t('common.notFound')}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover transition-colors cursor-pointer"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Back Link */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            {t('common.back')}
          </button>
        </div>

        {/* Community Hero Card */}
        <div className="bg-surface rounded-xl border border-primary/20 p-6 sm:p-7 flex flex-col md:flex-row md:items-start justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 shrink-0 flex items-center justify-center overflow-hidden">
              {community.avatarUrl ? (
                <img src={community.avatarUrl} alt={community.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading font-bold text-2xl text-primary">
                  {community.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-primary/70 bg-primary/10 px-2 py-0.5 rounded-md">
                  {community.type === 'creator' ? t('community.officialBadge') : t('community.tabComic')}
                </span>
                {community.type === 'comic' && community.targetId && (
                  <Link
                    to={`/comic/${community.targetId}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <BookOpen size={11} aria-hidden="true" />
                    Lihat Komik
                  </Link>
                )}
              </div>

              <h1 className="font-heading font-bold text-2xl text-primary leading-tight">
                {community.name}
              </h1>

              {community.description && (
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mt-0.5">
                  {community.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-5 text-xs text-gray-600 pt-2 mt-1 border-t border-primary/10">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users size={13} className="text-primary/70" aria-hidden="true" />
                  {community.memberCount.toLocaleString()} {t('community.members')}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <MessageSquare size={13} className="text-primary/70" aria-hidden="true" />
                  {community.postCount} {t('community.posts')}
                </span>
              </div>
            </div>
          </div>

          {/* Join / Leave button */}
          {user ? (
            <div className="shrink-0">
              <button
                onClick={handleToggleJoin}
                disabled={joinBusy}
                aria-pressed={community.isMember}
                className={`w-full md:w-auto px-6 py-2.5 rounded-md font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer ${
                  community.isMember
                    ? 'border border-primary/30 text-primary hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                    : 'bg-primary text-white hover:bg-primary-hover'
                }`}
              >
                {community.isMember ? t('community.joined') : t('community.join')}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="w-full md:w-auto px-6 py-2.5 rounded-md font-semibold text-sm text-center bg-primary text-white hover:bg-primary-hover transition-colors shrink-0"
            >
              {t('community.join')}
            </Link>
          )}
        </div>

        {/* Rules (collapsible) */}
        {community.rules && (
          <details className="bg-surface/50 border border-primary/15 rounded-xl">
            <summary className="px-5 py-3 font-heading font-bold text-xs text-primary cursor-pointer flex items-center gap-2 select-none">
              <Info size={14} className="text-primary/70" aria-hidden="true" />
              {t('community.rules')}
            </summary>
            <div className="px-5 pb-4 text-xs text-gray-700 leading-relaxed whitespace-pre-line border-t border-primary/10 pt-2">
              {community.rules}
            </div>
          </details>
        )}

        {/* Create post */}
        {community.isMember && (
          <CreatePostForm
            communityId={community.id}
            onCreated={handlePostCreated}
            isAuthorOfCommunity={isAuthorOfCommunity}
          />
        )}

        {/* Feed */}
        <section aria-label="Feed komunitas" className="flex flex-col gap-4">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-surface/40 rounded-xl border border-primary/10 p-8">
              <MessageSquare size={28} className="text-primary/40" aria-hidden="true" />
              <p className="text-gray-600 text-sm">{t('community.emptyPosts')}</p>
              {!community.isMember && user && (
                <button
                  onClick={handleToggleJoin}
                  disabled={joinBusy}
                  className="mt-1 px-5 py-2.5 bg-primary text-white font-semibold rounded-md text-sm hover:bg-primary-hover disabled:opacity-60 cursor-pointer"
                >
                  {t('community.join')}
                </button>
              )}
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onReport={handleReport}
              />
            ))
          )}
        </section>
      </main>

      <Footer />

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
          onSubmit={() => {
            // Laporan dikonfirmasi ke UI
          }}
        />
      )}
    </div>
  );
};
