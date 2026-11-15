import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';
import { Input, Textarea } from '../components/Input';
import { Plus, Info, Eye } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { categories } from '../data/dummy';
import {
  createComic,
  addChapter,
  getCreatorComic,
  type CreatorChapter,
} from '../services/creatorComics';

const genreOptions = categories.filter((c) => c !== 'ALL');

export const AddComic: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const comicParam = searchParams.get('comic');

  // Fase 1 — data komik
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Fase 2 — chapter
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<CreatorChapter[]>([]);
  const [chNumber, setChNumber] = useState('1');
  const [chTitle, setChTitle] = useState('');
  const [pageFiles, setPageFiles] = useState<File[]>([]);

  const [loadingComic, setLoadingComic] = useState(Boolean(comicParam));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mode kelola: muat komik yang sudah ada (?comic=<uuid>).
  useEffect(() => {
    if (!comicParam) return;
    let cancelled = false;
    getCreatorComic(comicParam).then(({ data, chapters: ch }) => {
      if (cancelled) return;
      if (data) {
        setCreatedId(data.id);
        setTitle(data.title);
        setGenres(data.genres);
        setDescription(data.description ?? '');
        setChapters(ch);
        if (ch.length > 0) setChNumber(String(Math.max(...ch.map((c) => c.number)) + 1));
      } else {
        setError(t('detail.notFound'));
      }
      setLoadingComic(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comicParam]);

  const toggleGenre = (g: string) =>
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const handlePagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // Urutkan per nama agar hasil prediktabel bila penamaan file bernomor (01, 02, ...).
    files.sort((a, b) => a.name.localeCompare(b.name));
    setPageFiles(files);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    const { data, error: err } = await createComic({ title, description, genres, coverFile });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setCreatedId(data);
    setSuccess(t('addComic.created'));
    setChapters([]);
    setChNumber('1');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdId) return;
    setError('');
    setSuccess('');
    setSubmitting(true);
    const { error: err } = await addChapter(createdId, {
      number: Number(chNumber),
      title: chTitle,
      pageFiles,
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setSuccess(t('addComic.successChapter'));
    setChNumber(String(Number(chNumber) + 1));
    setChTitle('');
    setPageFiles([]);
    const { chapters: updated } = await getCreatorComic(createdId);
    setChapters(updated);
  };

  const inManageMode = Boolean(createdId);

  if (loadingComic) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12">
          <div className="h-10 bg-gray-300 rounded w-1/3 animate-pulse mb-8"></div>
          <div className="h-64 bg-gray-300 rounded-xl animate-pulse"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold font-heading text-ink">{t('addComic.title')}</h1>
          {inManageMode && (
            <Link
              to={`/comic/${createdId}`}
              className="px-4 py-2.5 min-h-11 border-2 border-primary text-ink rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
            >
              <Eye size={16} aria-hidden="true" /> {t('addComic.viewComic')}
            </Link>
          )}
        </div>

        {error && (
          <p role="alert" className="w-full text-red-500 text-sm mb-4 text-left bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 font-medium">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="w-full text-emerald-600 text-sm mb-4 text-left bg-emerald-500/15 border border-emerald-500/30 rounded-lg px-4 py-3 font-medium">
            {success}
          </p>
        )}

        {/* ===================== Fase 1: Detail komik ===================== */}
        {!inManageMode ? (
          <form onSubmit={handleCreate} className="w-full flex flex-col gap-6 text-ink">
            {/* Cover upload */}
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <label htmlFor="cover" className="w-40 h-56 rounded-xl overflow-hidden shadow-xl bg-surface cursor-pointer shrink-0 relative group border border-[var(--color-line)]">
                <img
                  src={coverPreview || 'https://placehold.co/400x600/EAE3D2/1F2544/png?text=Cover+Komik'}
                  alt={t('addComic.cover')}
                  className="w-full h-full object-cover group-hover:brightness-75 transition-all"
                />
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-white px-3 py-1 rounded-full shadow text-sm font-bold text-[#1F2544]">
                    {t('addComic.changeCover')}
                  </span>
                </span>
              </label>
              <input id="cover" type="file" accept="image/*" onChange={handleCoverChange} className="sr-only" />

              <div className="flex-1 w-full flex flex-col gap-4">
                <Input
                  id="judul"
                  type="text"
                  label={t('addComic.titleField')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-surface border border-[var(--color-line)]"
                  required
                />
              </div>
            </div>

            <Textarea
              id="deskripsi"
              label={t('addComic.description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-surface border border-[var(--color-line)]"
            />

            <div className="flex flex-col gap-2 text-left">
              <span className="font-bold text-base text-ink">{t('addComic.genre')}</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('addComic.genre')}>
                {genreOptions.map((g) => (
                  <Button
                    key={g}
                    type="button"
                    variant={genres.includes(g) ? 'chipActive' : 'chip'}
                    size="sm"
                    pill
                    onClick={() => toggleGenre(g)}
                    aria-pressed={genres.includes(g)}
                  >
                    {g}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className="px-10"
              >
                {submitting ? t('common.loading') : t('addComic.createComic')}
              </Button>
            </div>
          </form>
        ) : (
          /* ===================== Fase 2: Tambah chapter ===================== */
          <div className="w-full flex flex-col gap-8">
            <div className="bg-surface/70 border border-[var(--color-line)] rounded-xl p-4 flex items-start gap-3 text-left">
              <Info size={20} className="text-ink shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-ink-muted">{t('addComic.chapterHint')}</p>
            </div>

            <h2 className="text-xl font-bold text-ink text-left">
              {t('addComic.chapterSection')} — {title}
            </h2>

            <form onSubmit={handleAddChapter} className="w-full flex flex-col gap-5 text-ink text-left">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  id="chNumber"
                  type="number"
                  min={1}
                  step={1}
                  label={t('addComic.chapterNumber')}
                  value={chNumber}
                  onChange={(e) => setChNumber(e.target.value)}
                  containerClassName="sm:w-40"
                  className="bg-surface border border-[var(--color-line)]"
                  required
                />
                <Input
                  id="chTitle"
                  type="text"
                  label={t('addComic.chapterTitle')}
                  value={chTitle}
                  onChange={(e) => setChTitle(e.target.value)}
                  containerClassName="flex-1"
                  className="bg-surface border border-[var(--color-line)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="pages" className="font-bold text-sm text-ink">{t('addComic.pageFiles')}</label>
                <input
                  id="pages"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePagesChange}
                  className="block w-full text-sm text-ink-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:font-bold hover:file:bg-primary-hover file:cursor-pointer"
                />
                <p className="text-xs text-ink-muted">{t('addComic.pageOrderHint')}</p>
                {pageFiles.length > 0 && (
                  <ul className="text-sm text-ink-muted flex flex-col gap-1 mt-1">
                    {pageFiles.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center gap-2">
                        <span className="text-ink font-bold">{i + 1}.</span> {f.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || pageFiles.length === 0}
                  size="lg"
                >
                  <Plus size={18} aria-hidden="true" />
                  {submitting ? t('common.loading') : t('addComic.addChapter')}
                </Button>
              </div>
            </form>

            {/* Daftar chapter yang sudah ditambahkan */}
            <div className="w-full text-left">
              <h3 className="font-bold text-lg text-ink mb-3">{t('addComic.existingChapters')}</h3>
              {chapters.length === 0 ? (
                <p className="text-sm text-ink-muted">{t('addComic.noChapters')}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {chapters.map((c) => (
                    <li key={c.id} className="flex items-center justify-between bg-surface border border-[var(--color-line)] rounded-lg px-4 py-3">
                      <span className="font-semibold text-ink">
                        {t('addComic.chapterWord')} {c.number}
                        {c.title ? ` — ${c.title}` : ''}
                        <span className="text-xs text-ink-muted ml-2">({c.pageCount} {t('addComic.pagesUnit')})</span>
                      </span>
                      <Link
                        to={`/read/${createdId}/${c.number}`}
                        className="text-sm font-bold text-ink hover:underline flex items-center gap-1"
                      >
                        <Eye size={16} aria-hidden="true" /> {t('addComic.readChapter')}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="w-full flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/profile')}
              >
                {t('addComic.done')}
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
