import React from 'react';
import SEO from './SEO';
import AnimeCard from './AnimeCard';
import { useAnimeFavorites } from './AnimeFavoritesContext';

const FavoritesPage = () => {
  const { favorites, favoritesCount, clearFavorites } = useAnimeFavorites();

  return (
    <>
      <SEO
        title="Favorite Anime"
        description="Browse your saved favorite anime on AnimeLeveling."
        path="/favorites"
      />

      <div className="min-h-screen bg-gray-900">
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Your Favorites</h1>
                <p className="text-gray-400">
                  {favoritesCount} {favoritesCount === 1 ? 'anime saved' : 'anime saved'}
                </p>
              </div>

              {favoritesCount > 0 && (
                <button
                  onClick={clearFavorites}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors border border-red-500"
                >
                  Clear Favorites
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {favorites.length > 0 ? (
            <div className="grid justify-items-center grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-8">
              {favorites.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">💜</div>
              <h2 className="text-2xl font-bold text-white mb-4">No favorite anime yet</h2>
              <p className="text-gray-400 max-w-md mx-auto">
                Start adding anime to your favorites by clicking the heart or bookmark icon on any anime card.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FavoritesPage;