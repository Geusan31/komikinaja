import React from 'react';
import { Heart, Eye } from 'lucide-react';

export interface ComicCardProps {
  id?: number;
  title: string;
  cover: string;
  episode?: string;
  likes?: string;
  views?: string;
  isNew?: boolean;
  badge?: string;
  hideStats?: boolean;
}

export const ComicCard: React.FC<ComicCardProps> = ({
  title,
  cover,
  episode,
  likes,
  views,
  isNew = false,
  badge,
  hideStats = false,
}) => {
  return (
    <div className="flex flex-col gap-2 group cursor-pointer text-left">
      <div className="relative aspect-3/4 w-full rounded-lg overflow-hidden bg-surface border border-[var(--color-line)] shadow-sm transition-transform duration-300 group-hover:scale-105">
        <img
          src={cover}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {badge && (
          <div className="absolute top-2 left-2 bg-primary/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm shadow">
            {badge}
          </div>
        )}
        {isNew && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow">
            New
          </div>
        )}
      </div>
      <div className="flex flex-col text-left mt-1">
        <h3 className="font-bold text-ink text-sm md:text-base leading-tight truncate">{title}</h3>
        {episode && (
          <p className="text-xs md:text-sm text-ink-muted truncate">{episode}</p>
        )}
        {!hideStats && (likes !== undefined || views !== undefined) && (
          <div className="flex items-center gap-3 text-xs text-ink-muted mt-1">
            {likes !== undefined && (
              <div className="flex items-center gap-1">
                <Heart size={12} className="fill-current opacity-60" aria-hidden="true" />
                <span>{likes}</span>
              </div>
            )}
            {views !== undefined && (
              <div className="flex items-center gap-1">
                <Eye size={12} className="opacity-60" aria-hidden="true" />
                <span>{views}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ComicSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      <div className="aspect-3/4 w-full rounded-lg bg-surface"></div>
      <div className="flex flex-col text-left mt-1 gap-2">
        <div className="h-4 bg-surface rounded w-3/4"></div>
        <div className="h-3 bg-surface rounded w-1/2"></div>
        <div className="flex items-center gap-3 mt-1">
          <div className="h-3 bg-surface rounded w-12"></div>
          <div className="h-3 bg-surface rounded w-12"></div>
        </div>
      </div>
    </div>
  );
};
