import React from 'react';
import { Heart, Eye } from 'lucide-react';

export interface ComicCardProps {
  id?: number;
  title: string;
  cover: string;
  episode: string;
  likes: string;
  views: string;
  isNew?: boolean;
}

export const ComicCard: React.FC<ComicCardProps> = ({
  title,
  cover,
  episode,
  likes,
  views,
  isNew = false,
}) => {
  return (
    <div className="flex flex-col gap-2 group cursor-pointer">
      <div className="relative aspect-3/4 w-full rounded-md overflow-hidden bg-gray-200 shadow-sm transition-transform duration-300 group-hover:scale-105">
        <img 
          src={cover} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        {isNew && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            New
          </div>
        )}
      </div>
      <div className="flex flex-col text-left mt-1">
        <h3 className="font-bold text-primary text-base leading-tight truncate">{title}</h3>
        <p className="text-sm text-gray-600 truncate">{episode}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          <div className="flex items-center gap-1">
            <Heart size={12} className="fill-gray-400" />
            <span>{likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye size={12} className="text-gray-400" />
            <span>{views}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ComicSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      <div className="aspect-3/4 w-full rounded-md bg-gray-300"></div>
      <div className="flex flex-col text-left mt-1 gap-2">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        <div className="flex items-center gap-3 mt-1">
          <div className="h-3 bg-gray-300 rounded w-12"></div>
          <div className="h-3 bg-gray-300 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
};
