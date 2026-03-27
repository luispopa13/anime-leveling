import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AnimeFavoritesContext = createContext(null);

export function AnimeFavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    if (typeof window === 'undefined') return [];

    try {
      const stored = window.localStorage.getItem('anime-favorites');
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error reading anime favorites from localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem('anime-favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving anime favorites to localStorage:', error);
    }
  }, [favorites]);

  function toggleFavorite(anime) {
    if (!anime?.id) return;

    setFavorites((prev) => {
      const exists = prev.some((fav) => fav.id === anime.id);

      if (exists) {
        return prev.filter((fav) => fav.id !== anime.id);
      }

      return [
        ...prev,
        {
          id: anime.id,
          title: anime.title || 'Unknown',
          image: anime.image || '',
          rating: anime.rating || 'N/A',
          year: anime.year || 'Unknown',
          favourites: anime.favourites ?? anime.favorites ?? 0,
        },
      ];
    });
  }

  function isFavorite(id) {
    return favorites.some((fav) => fav.id === id);
  }

  function clearFavorites() {
    setFavorites([]);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(
    () => ({
      favorites,
      favoritesCount: favorites.length,
      toggleFavorite,
      isFavorite,
      clearFavorites,
    }),
    [favorites]
  );

  return (
    <AnimeFavoritesContext.Provider value={value}>
      {children}
    </AnimeFavoritesContext.Provider>
  );
}

export function useAnimeFavorites() {
  const context = useContext(AnimeFavoritesContext);

  if (!context) {
    throw new Error('useAnimeFavorites must be used inside AnimeFavoritesProvider');
  }

  return context;
}