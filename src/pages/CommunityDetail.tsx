import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Users,
  MessageSquare,
  Heart,
  Flag,
  AlertTriangle,
  Send,
  EyeOff,
  Eye,
  ShieldAlert,
  Plus,
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
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('community.report')}
    >
      <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-xl flex flex-col gap-4">
        {done ? (
          <>
            <div className="flex items-center gap-2 text-green-600 font-bold">
              <ShieldAlert size={20} aria-hidden="true" />
              {t('community.reportSuccess')}
            </div>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2 bg-primary text-white font-bold rounded-full"
            >
              {t('common.back')}
            </button>
          </>
        ) : (
          <>
            <h2 className="font-bold text-lg text-primary flex items-center gap-2">
              <Flag size={18} aria-hidden="true" />
              {t('community.report')} {targetType === 'post' ? 'Postingan' : 'Komentar'}
            </h2>
            <p className="text-sm text-gray-600">Pilih alasan laporan:</p>
            <div className="flex flex-col gap-2">
              {REASONS.map(r => (
                <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-primary"
                  />
                  {r}
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-700 font-bold rounded-full hover:bg-gray-100 transition-colors"
              >
                {t('detail.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason}
                className="flex-1 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors"
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
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Belum ada komentar.</p>
      ) : (
        comments.map(c => (
          <SpoilerWrapper key={c.id} isSpoiler={c.isSpoiler}>
            <div className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
                {c.userAvatar
                  ? <img src={c.userAvatar} alt={c.userName} className="w-full h-full object-cover" />
                  : c.userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-surface/70 rounded-xl px-3 py-2">
                <span className="text-xs font-bold text-primary">{c.userName}</span>
                <span className="text-xs text-gray-400 ml-2">{timeAgo(c.createdAt)}</span>
                <p className="text-sm text-gray-800 mt-0.5 leading-relaxed">{c.content}</p>
              </div>
            </div>
          </SpoilerWrapper>
        ))
      )}

      {user ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t('community.commentPlaceholder')}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors bg-background"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
            />
            <button
              onClick={handlePost}
              disabled={posting || !text.trim()}
              className="p-2 bg-primary text-white rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
              aria-label="Kirim komentar"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
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
        <p className="text-xs text-gray-500">{t('comments.loginToComment')}</p>
      )}
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
      <div className={revealed ? '' : 'blur-sm select-none pointer-events-none'}>{children}</div>
      {!revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-10">
          <div className="bg-black/70 text-white rounded-xl px-4 py-2 flex flex-col items-center gap-1 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-xs font-bold text-yellow-400">
              <AlertTriangle size={14} aria-hidden="true" />
              {t('community.spoilerWarning')}
            </div>
            <button
              onClick={() => setRevealed(true)}
              className="text-xs text-white underline hover:text-yellow-200 mt-0.5"
            >
              {t('community.revealSpoiler')}
            </button>
          </div>
        </div>
      )}
      {revealed && (
        <button
          onClick={() => setRevealed(false)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary mt-1"
        >
          <EyeOff size={12} aria-hidden="true" /> {t('community.hideSpoiler')}
        </button>
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
    <article className="bg-surface/70 border border-primary/10 rounded-2xl p-5 flex flex-col gap-3">
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden shrink-0">
          {post.authorAvatar
            ? <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">{post.authorName.charAt(0).toUpperCase()}</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-primary text-sm">{post.authorName}</span>
            {post.isAuthorBadge && (
              <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                {t('community.authorBadge')}
              </span>
            )}
            {post.isSpoiler && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-300 text-[10px] font-bold rounded-full flex items-center gap-0.5">
                <Eye size={10} aria-hidden="true" />
                {t('community.spoilerWarning')}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
        </div>

        {user && (
          <button
            onClick={() => onReport('post', post.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
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
          {post.title && <h3 className="font-bold text-primary text-base">{post.title}</h3>}
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      </SpoilerWrapper>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
          aria-label={t('community.like')}
        >
          <Heart size={16} aria-hidden="true" />
          <span>{post.likesCount}</span>
        </button>
        <button
          onClick={() => setShowComments(prev => !prev)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <MessageSquare size={16} aria-hidden="true" />
          <span>{post.commentsCount}</span>
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
        className="flex items-center gap-2 w-full px-5 py-3 border-2 border-dashed border-primary/30 rounded-2xl text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-semibold text-sm"
      >
        <Plus size={18} aria-hidden="true" />
        {t('community.createPost')}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface/70 border border-primary/20 rounded-2xl p-5 flex flex-col gap-3">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={t('community.postTitlePlaceholder')}
        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors bg-background font-semibold"
        maxLength={120}
      />
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={t('community.postContentPlaceholder')}
        rows={4}
        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors bg-background resize-none"
        maxLength={2000}
        required
      />
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={isSpoiler}
          onChange={e => setIsSpoiler(e.target.checked)}
          className="accent-primary"
        />
        {t('community.isSpoiler')}
      </label>
      {error && <p role="alert" className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { setOpen(false); setTitle(''); setContent(''); setError(''); }}
          className="flex-1 py-2 border-2 border-gray-300 text-gray-700 font-bold rounded-full hover:bg-gray-100 transition-colors text-sm"
        >
          {t('detail.cancel')}
        </button>
        <button
          type="submit"
          disabled={posting || !content.trim()}
          className="flex-1 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
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
      if (cancelled) return;
      setCommunity(comm);
      setPosts(postList);
      setLoading(false);
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

  // Is user the creator/owner of this community?
  const isAuthorOfCommunity = Boolean(
    user && community?.creatorId && community.creatorId === user.id,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="w-full h-48 bg-gray-300 animate-pulse" />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
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
          className="px-5 py-2 bg-primary text-white font-bold rounded-full"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Cover */}
      <div className="w-full h-48 md:h-56 relative overflow-hidden bg-primary/30">
        {community.coverUrl && (
          <img src={community.coverUrl} alt="" className="w-full h-full object-cover opacity-60" />
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-white flex items-center gap-1 text-sm font-bold bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-black/50 transition-colors"
        >
          <ChevronLeft size={18} aria-hidden="true" />
          {t('common.back')}
        </button>
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 -mt-12 relative z-10">
        {/* Community header card */}
        <div className="bg-background border border-primary/10 rounded-2xl p-5 shadow-sm flex gap-4 items-start">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 shrink-0 border-2 border-background shadow">
            {community.avatarUrl
              ? <img src={community.avatarUrl} alt={community.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-primary font-bold text-2xl">{community.name.charAt(0)}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-bold text-xl text-primary leading-tight">{community.name}</h1>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Users size={12} aria-hidden="true" />
                    {community.memberCount.toLocaleString()} {t('community.members')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} aria-hidden="true" />
                    {community.postCount} {t('community.posts')}
                  </span>
                </div>
              </div>
              {user && (
                <button
                  onClick={handleToggleJoin}
                  disabled={joinBusy}
                  aria-pressed={community.isMember}
                  className={`px-5 py-2 rounded-full font-bold text-sm transition-colors disabled:opacity-60 shrink-0 ${
                    community.isMember
                      ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-red-50 hover:text-red-600'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {community.isMember ? t('community.joined') : t('community.join')}
                </button>
              )}
            </div>
            {community.description && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{community.description}</p>
            )}
          </div>
        </div>

        {/* Rules (collapsible) */}
        {community.rules && (
          <details className="bg-surface/60 border border-primary/10 rounded-xl">
            <summary className="px-5 py-3 font-bold text-sm text-primary cursor-pointer flex items-center gap-2">
              <AlertTriangle size={15} aria-hidden="true" />
              {t('community.rules')}
            </summary>
            <div className="px-5 pb-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
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
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <MessageSquare size={32} className="text-primary/30" aria-hidden="true" />
              <p className="text-gray-500 text-sm">{t('community.emptyPosts')}</p>
              {!community.isMember && user && (
                <button
                  onClick={handleToggleJoin}
                  disabled={joinBusy}
                  className="mt-1 px-5 py-2 bg-primary text-white font-bold rounded-full text-sm hover:bg-primary/90 disabled:opacity-60"
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

        {/* Link back to comic/creator if applicable */}
        {community.type === 'comic' && community.targetId && (
          <div className="text-center">
            <Link
              to={`/comic/${community.targetId}`}
              className="text-sm text-primary hover:underline font-semibold"
            >
              ← Lihat halaman komik ini
            </Link>
          </div>
        )}
      </main>

      <Footer />

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
          onSubmit={() => {
            // Laporan disimpan secara lokal / dikirim ke moderator
            // Dalam mode demo, hanya konfirmasi UI
          }}
        />
      )}
    </div>
  );
};
