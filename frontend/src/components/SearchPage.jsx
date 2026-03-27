import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, List } from 'lucide-react';
import AnimeCard from './AnimeCard';
import SEO from './SEO';
import { animeAPI } from '../services/api';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const data = await animeAPI.search(searchQuery.trim());
      setResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search anime. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setQuery(urlQuery);

    if (urlQuery.trim()) {
      performSearch(urlQuery);
    } else {
      setResults([]);
      setHasSearched(false);
      setError(null);
    }
  }, [searchParams]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setHasSearched(false);
    setSearchParams({});
  };

  const applySuggestion = (suggestion) => {
    setSearchParams({ q: suggestion });
  };

  return (
    <>
      <SEO
        title={query ? `Search results for ${query}` : 'Search Anime'}
        description={
          query
            ? `Search results for ${query}. Browse episode lists, characters, staff, recommendations and watch links.`
            : 'Search anime by title, episodes, characters and more.'
        }
        path={query ? `/search?q=${encodeURIComponent(query)}` : '/search'}
      />

      <div className="min-h-screen bg-gray-900">
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-3">Search Anime</h1>
            <p className="text-gray-400">Use the search bar from the navigation to search by title.</p>

            {(hasSearched || results.length > 0) && (
              <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400">
                    {loading ? 'Searching...' : `${results.length} results found`}
                    {query && ` for "${query}"`}
                  </span>

                  {query && (
                    <button
                      onClick={clearSearch}
                      className="text-blue-400 hover:text-blue-300 text-sm underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">View:</span>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">Searching for anime...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-red-400 mb-2">Search Error</h3>
                <p className="text-red-300 mb-4">{error}</p>
                {query && (
                  <button
                    onClick={() => performSearch(query)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-4">No Results Found</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                We couldn't find any anime matching "{query}". Try a different title.
              </p>
              <button
                onClick={clearSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid justify-items-center grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-8'
                  : 'space-y-4'
              }
            >
              {results.map((anime, index) => (
                <AnimeCard
                  key={anime.id || `search-${index}`}
                  anime={anime}
                  isListView={viewMode === 'list'}
                />
              ))}
            </div>
          )}

          {!hasSearched && !loading && (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🎌</div>
              <h3 className="text-2xl font-bold text-white mb-4">Discover Amazing Anime</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Search from the navigation bar or try one of these suggestions.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {['Attack on Titan', 'Naruto', 'One Piece', 'Demon Slayer', 'Dragon Ball'].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => applySuggestion(suggestion)}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchPage;