import React, { useState, useEffect } from 'react';
import { MessageCircle, Trash2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { listComments, addComment, deleteComment, type Comment } from '../services/comments';

/** Waktu relatif ("5 menit lalu") terlokalisasi memakai Intl. Murni — `now` dikirim sebagai prop. */
const formatRelativeTime = (iso: string, now: number, language: string): string => {
  const diff = now - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return rtf.format(0, 'minute');
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.round(hours / 24);
  return rtf.format(-days, 'day');
};

const CommentItem: React.FC<{ comment: Comment; now: number; onDelete: (id: string) => void }> = ({ comment, now, onDelete }) => {
  const { t, language } = useLanguage();
  const time = formatRelativeTime(comment.createdAt, now, language);

  return (
    <li className="flex gap-3 py-4 border-b border-primary/10 last:border-b-0">
      <img
        src={comment.user.avatar}
        alt=""
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-primary/10"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-primary text-sm">{comment.user.name}</span>
          <span className="text-xs text-gray-500">{time}</span>
          {comment.isOwn && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              aria-label={t('comments.delete')}
              title={t('comments.delete')}
              className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="text-gray-800 text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
      </div>
    </li>
  );
};

export const CommentSection: React.FC<{ comicId: string }> = ({ comicId }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(0);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listComments(comicId).then(({ data, error: hasError }) => {
      if (cancelled) return;
      setComments(data);
      setError(hasError);
      setNow(Date.now());
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [comicId, reloadKey]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosting(true);
    setPostError('');
    const { error: postErr } = await addComment(comicId, draft);
    setPosting(false);
    if (postErr) {
      setPostError(postErr);
      return;
    }
    setDraft('');
    setReloadKey((k) => k + 1);
  };

  const handleDelete = async (id: string) => {
    const { error: delErr } = await deleteComment(id);
    if (!delErr) setReloadKey((k) => k + 1);
  };

  return (
    <section className="w-full flex flex-col gap-4 mb-16" aria-labelledby="comments-heading">
      <h3 id="comments-heading" className="font-bold text-xl text-gray-700 flex items-center gap-2">
        <MessageCircle size={20} className="text-primary" aria-hidden="true" />
        {t('comments.title')}
        <span className="text-sm font-semibold text-gray-500">({comments.length})</span>
      </h3>

      {user ? (
        <form onSubmit={handlePost} className="flex gap-3 items-start">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('comments.placeholder')}
            maxLength={2000}
            rows={2}
            className="flex-1 px-4 py-3 bg-surface border border-transparent rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-500 text-primary resize-none"
          />
          <button
            type="submit"
            disabled={posting || !draft.trim()}
            className="mt-1 px-4 py-3 bg-primary text-white rounded-md font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={16} aria-hidden="true" />
            {t('comments.post')}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 bg-surface rounded-md px-4 py-3">{t('comments.loginToComment')}</p>
      )}
      {postError && <p role="alert" className="text-red-500 text-sm">{postError}</p>}

      {loading ? (
        <ul className="flex flex-col">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex gap-3 py-4 border-b border-primary/10 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-300 shrink-0"></div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <p className="text-sm text-red-500">{t('common.loadError')}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-600 bg-surface rounded-md px-4 py-3">{t('comments.empty')}</p>
      ) : (
        <ul className="flex flex-col">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} now={now} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </section>
  );
};
