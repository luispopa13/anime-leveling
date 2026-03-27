import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Star, Eye, Heart, Bookmark, Zap } from 'lucide-react';
import { useAnimeFavorites } from './AnimeFavoritesContext';
import { slugify } from '../utils/slug';

const AnimeCard = ({ anime, isLatest, onClick }) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useAnimeFavorites();

  const {
    id,
    title,
    image,
    rating,
    favourites,
    favorites,
    year,
  } = anime || {
    id: 1,
    title: 'Sample Anime Title',
    image: 'https://via.placeholder.com/300x400/1a1a2e/16213e?text=Anime',
    rating: '8.5',
    year: '2024',
    favourites: 0,
  };

  const imageUrl =
    image || 'https://via.placeholder.com/300x400/1a1a2e/16213e?text=Anime';
  const displayRating = rating !== 'N/A' ? rating : null;
  const displayFavorites = favourites ?? favorites ?? null;
  const favorite = isFavorite(id);

  const animePayload = {
    id,
    title,
    image,
    rating,
    year,
    favourites: displayFavorites ?? 0,
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;

    if (onClick) {
      onClick(anime);
      return;
    }

    const slug = slugify(title);
    navigate(`/anime/${id}/${slug}`);
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(animePayload);
  };

  return (
    <div
      className="group relative block w-full h-[650px] max-w-[480px] mx-auto transform transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-3xl blur-sm opacity-0 group-hover:opacity-40 transition-all duration-700 animate-pulse" />
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 rounded-3xl blur opacity-0 group-hover:opacity-60 transition-all duration-700" />

      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <div
          className="absolute w-1 h-1 bg-violet-400 rounded-full opacity-0 group-hover:opacity-100 animate-bounce"
          style={{ top: '20%', left: '10%', animationDelay: '0s' }}
        />
        <div
          className="absolute w-1 h-1 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 animate-bounce"
          style={{ top: '60%', right: '15%', animationDelay: '0.5s' }}
        />
        <div
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 animate-bounce"
          style={{ top: '40%', left: '20%', animationDelay: '1s' }}
        />
      </div>

      <div className="relative h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden border border-slate-700/50 group-hover:border-violet-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/25 flex flex-col backdrop-blur-sm">
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 rounded-3xl border-2 border-violet-500/30 animate-ping" />
        </div>

        <div className="relative h-[450px] overflow-hidden flex-shrink-0">
          <img
            src={imageUrl}
            alt={title}
            width={300}
            height={450}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110 group-hover:contrast-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-pink-600/20 opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12" />

          <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
            <div className="flex flex-col gap-2">
              {displayRating && (
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg backdrop-blur-sm">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  {displayRating}
                </div>
              )}

              {displayFavorites != null && (
                <div className="bg-gradient-to-r from-pink-400 to-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg backdrop-blur-sm">
                  <Heart className="w-3 h-3 mr-1 fill-current" />
                  {displayFavorites}
                </div>
              )}
            </div>

            {isLatest && (
              <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
                <span className="inline-block animate-bounce">🔥</span> NEW
              </div>
            )}
          </div>

          <button
            onClick={handleToggleFavorite}
            className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 transform group-hover:scale-110 z-10 ${
              favorite
                ? 'bg-violet-500/80 text-white shadow-lg shadow-violet-500/50'
                : 'bg-black/30 text-white/70 hover:text-white hover:bg-black/50'
            }`}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Bookmark
              className={`w-4 h-4 transition-all duration-300 ${
                favorite ? 'fill-current animate-pulse' : ''
              }`}
            />
          </button>
        </div>

        <div className="p-5 space-y-3 flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="text-white font-bold text-xl leading-tight mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:via-pink-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all duration-500 line-clamp-2">
              {title}
            </h3>

            <div className="flex items-center text-slate-400 text-sm mt-2 transition-all duration-300 group-hover:text-slate-300">
              <Calendar className="w-4 h-4 mr-2 group-hover:text-violet-400 transition-colors duration-300" />
              <span>{year || 'Unknown'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 group-hover:border-violet-500/30 mt-auto transition-colors duration-300">
            <div className="flex items-center space-x-4 text-slate-400 text-sm">
              <span className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-amber-400" />
                {displayRating || 'N/A'}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {displayFavorites ?? 'N/A'}
              </span>
            </div>

            <button
              onClick={handleToggleFavorite}
              className={`transition-all duration-300 transform hover:scale-125 ${
                favorite ? 'text-red-400' : 'text-violet-400 hover:text-violet-300'
              }`}
              aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="w-full bg-slate-700/50 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-400 rounded-full w-0 group-hover:w-full transition-all duration-1000 ease-out relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 delay-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center justify-center space-x-1 text-xs text-violet-400">
              <Zap className="w-3 h-3 animate-pulse" />
              <span className="font-medium">
                {favorite ? 'Added to favorites' : 'Add to favorites'}
              </span>
              <Zap className="w-3 h-3 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AnimeCard);