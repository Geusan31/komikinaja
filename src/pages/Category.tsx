import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ComicCard, ComicSkeleton } from '../components/ComicCard';
import { categories } from '../data/dummy';
import { Search } from 'lucide-react';
import { fetchManga } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import emptyIllustration from '../assets/empty_ilustration.png';

export const Category: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeSort, setActiveSort] = useState("Popularitas");
  
  const [mangas, setMangas] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const loadMangas = async (currentPage: number, append = false, query?: string) => {
    setLoading(true);
    
    const currentQuery = query !== undefined ? query : searchQuery;

    // Map UI category to Kitsu Category slugs for accurate filtering
    const genreMap: Record<string, string> = {
      "DRAMA": "drama",
      "FANTASI": "fantasy",
      "KERAJAAN": "historical",
      "ACTION": "action",
      "ROMANCE": "romance",
      "SLICE OF LIFE": "slice-of-life",
      "HOROR": "horror",
      "THRILLER": "thriller"
    };
    
    const genreId = activeCategory === "ALL" ? "" : genreMap[activeCategory] || "";
    
    // Map UI sort to Kitsu sort slugs
    const sortMap: Record<string, string> = {
      "Popularitas": "-userCount",
      "Berdasarkan jumlah like": "-averageRating",
      "Berdasarkan tanggal": "-startDate"
    };
    const sortOrder = sortMap[activeSort] || "-userCount";
    
    const data = await fetchManga(currentPage, currentQuery, 20, genreId, sortOrder);
    
    if (append) {
      setMangas(prev => [...prev, ...data.data]);
    } else {
      setMangas(data.data);
    }
    
    setHasNextPage(data.pagination.has_next_page);
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    loadMangas(1, false, searchQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, activeSort]);

  // Handle URL query changes
  useEffect(() => {
    if (initialQuery !== searchQuery) {
      setSearchQuery(initialQuery);
      setPage(1);
      loadMangas(1, false, initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { q: searchQuery } : {});
    setPage(1);
    loadMangas(1, false, searchQuery);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMangas(nextPage, true);
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col">
      <Navbar />

      {/* Category Navigation */}
      <div className="w-full border-b-2 border-[#1F2544]/10 bg-[#F4EFE6] sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 overflow-x-auto py-4 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-bold whitespace-nowrap transition-colors ${
                  activeCategory === cat ? 'text-[#1F2544]' : 'text-gray-500 hover:text-[#1F2544]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Searching..." 
            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-transparent focus:border-[#1F2544] focus:ring-0 outline-none transition-colors"
          />
        </form>

        {/* Filters & Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
          <h2 className="font-bold text-[#1F2544]">{mangas.length} Serial Ditampilkan</h2>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            {["Popularitas", "Berdasarkan jumlah like", "Berdasarkan tanggal"].map((sort) => (
              <button
                key={sort}
                onClick={() => setActiveSort(sort)}
                className={`transition-colors ${
                  activeSort === sort ? 'text-[#1F2544]' : 'text-gray-500 hover:text-[#1F2544]'
                } ${sort !== "Popularitas" ? 'border-l-2 border-gray-300 pl-4' : ''}`}
              >
                {sort}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8 pb-12">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => <ComicSkeleton key={i} />)}
          </div>
        ) : mangas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <img src={emptyIllustration} alt="Not Found" className="w-80 h-80 object-contain drop-shadow-lg mb-10" />
            <h3 className="text-2xl font-bold text-gray-500 mt-[-20px]">
              '{searchParams.get('q') || "Manga"}' Not Found
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8 pb-12">
            {mangas.map((manga) => (
              <Link to={`/comic/${manga.mal_id}`} key={manga.mal_id}>
                <ComicCard 
                  title={manga.title}
                  cover={manga.images?.webp?.image_url || manga.images?.jpg?.image_url || "https://placehold.co/400x600"}
                  episode={manga.chapters ? `Chapters: ${manga.chapters}` : 'Ongoing'}
                  likes={(manga.score || 0).toString()}
                  views={(manga.members || 0).toLocaleString()}
                  isNew={manga.status === "Publishing"}
                />
              </Link>
            ))}
          </div>
        )}

        {hasNextPage && !loading && (
          <div className="flex justify-center mb-8">
            <button 
              onClick={handleLoadMore}
              className="px-6 py-3 border-2 border-[#1F2544] text-[#1F2544] font-bold rounded-full hover:bg-[#1F2544] hover:text-white transition-colors"
            >
              View More
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
