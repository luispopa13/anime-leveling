import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AnimeCard from './AnimeCard';
import { animeAPI } from '../services/api';
import SEO from './SEO';

const HomePage = () => {
  const [sections, setSections] = useState({
    popular: [],
    trending: [],
    top100: [],
    season: [],
    upcoming: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sectionErrors, setSectionErrors] = useState({});
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        setSectionErrors({});

        // Fetch data with individual error handling
        const fetchPromises = [
          animeAPI.getPopular().catch(err => ({ error: 'popular', message: err.message })),
          animeAPI.getTrending().catch(err => ({ error: 'trending', message: err.message })),
          animeAPI.getTop100(1, 100).catch(err => ({ error: 'top100', message: err.message })),
          animeAPI.getPopularThisSeason().catch(err => ({ error: 'season', message: err.message })),
          animeAPI.getUpcomingNextSeason().catch(err => ({ error: 'upcoming', message: err.message }))
        ];

        const results = await Promise.all(fetchPromises);

        const newSections = {
          popular: [],
          trending: [],
          top100: [],
          season: [],
          upcoming: []
        };

        const newSectionErrors = {};

        // Process results
        results.forEach((result, index) => {
          const sectionNames = ['popular', 'trending', 'top100', 'season', 'upcoming'];
          const sectionName = sectionNames[index];

          if (result && result.error) {
            // This was an error
            console.error(`Failed to load ${sectionName}:`, result.message);
            newSectionErrors[sectionName] = result.message;
            newSections[sectionName] = null;
          } else if (result && Array.isArray(result)) {
            // Direct array response
            newSections[sectionName] = result;
          } else if (result && result.data && Array.isArray(result.data)) {
            // Response with data property
            newSections[sectionName] = result.data;
          } else if (result && result.results && Array.isArray(result.results)) {
            // Response with results property
            newSections[sectionName] = result.results;
          } else {
            console.warn(`Unexpected data structure for ${sectionName}:`, result);
            newSections[sectionName] = [];
          }
        });

        setSections(newSections);
        setSectionErrors(newSectionErrors);

        // Check if all requests failed
        const allFailed = Object.values(newSections).every(section => 
          section === null || (Array.isArray(section) && section.length === 0)
        );
        
        if (allFailed) {
          throw new Error('Failed to load any anime data');
        }

      } catch (err) {
        console.error('Error loading anime data:', err);
        setError('Failed to load anime data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const Section = ({ title, data, emoji, sectionKey }) => {
    
    return (
      <section className="mb-16">
        <div className="flex items-center mb-8">
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-3 rounded-xl mr-4 border border-gray-600">
            <span className="text-2xl">{emoji}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            {data && Array.isArray(data) && (
              <p className="text-gray-400 text-sm mt-1">{data.length} anime found</p>
            )}
          </div>
        </div>
        
        {data === null ? (
          <div className="bg-red-900/20 backdrop-blur-sm rounded-2xl p-8 text-center border border-red-700/40">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-300 text-lg mb-2">Failed to load {title}</p>
            {sectionErrors[sectionKey] && (
              <p className="text-red-400 text-sm">{sectionErrors[sectionKey]}</p>
            )}
          </div>
        ) : data && Array.isArray(data) && data.length > 0 ? (
          <div className="grid justify-items-center grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-8">
            {data.slice(0, 12).map((anime, index) => (
              <AnimeCard key={anime.id || `${title}-${index}`} anime={anime} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-700">
            <div className="text-4xl mb-4">📺</div>
            <p className="text-gray-400 text-lg">No anime found in this category.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm border border-red-500"
            >
              Retry Loading
            </button>
          </div>
        )}
      </section>
    );
  };

  const getRatingColor = (rating) => {
    const score = parseFloat(rating);
    if (score >= 9) return 'text-green-400';
    if (score >= 8) return 'text-blue-400';
    if (score >= 7) return 'text-yellow-400';
    if (score >= 6) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-600';
      case 'ongoing': return 'bg-red-600';
      case 'upcoming': return 'bg-yellow-600';
      case 'cancelled': return 'bg-red-700';
      case 'hiatus': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pages = [];
    
    // Calculate page range to show
    const maxPagesToShow = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors border border-gray-600"
        >
          Previous
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-2 rounded-lg bg-gray-700 text-white hover:bg-red-600 transition-colors border border-gray-600"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-lg transition-colors border ${
              currentPage === page
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-gray-700 text-white hover:bg-red-600 border-gray-600'
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-2 rounded-lg bg-gray-700 text-white hover:bg-red-600 transition-colors border border-gray-600"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors border border-gray-600"
        >
          Next
        </button>
      </div>
    );
  };

  const Top100Table = ({ data }) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-3 rounded-xl mr-4 border border-red-500">
              <span className="text-2xl">🏆</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Top 100 Highest Rated Anime</h2>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-700">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-400 text-lg">No top anime data available.</p>
          </div>
        </section>
      );
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = data.slice(startIndex, endIndex);

    return (
      <section className="mb-16">
        <div className="flex items-center mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-3 rounded-xl mr-4 border border-red-500">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Top 100 Highest Rated Anime</h2>
            <p className="text-gray-400 text-sm mt-1">
              Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} anime
            </p>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Anime</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Year</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Episodes</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rating</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Genres</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {currentData.map((anime, index) => {
                  const actualRank = startIndex + index + 1;
                  return (
                    <tr key={anime.id || index} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {actualRank <= 3 && (
                            <span className="text-lg mr-2">
                              {actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : '🥉'}
                            </span>
                          )}
                          <span className={`font-bold ${
                            actualRank <= 10 ? 'text-red-400' : 
                            actualRank <= 25 ? 'text-gray-300' : 'text-gray-400'
                          }`}>
                            #{actualRank}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          to={`/anime/${anime.id}`}
                          className="flex items-center space-x-4 hover:text-red-400 transition-colors group"
                        >
                          <div className="relative">
                            <img
                              src={anime.image || `http://localhost:5000/api/placeholder/60/80`}
                              alt={anime.title}
                              className="w-12 h-16 rounded-lg object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                e.target.src = `http://localhost:5000/api/placeholder/60/80`;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm leading-tight truncate">{anime.title}</p>
                            {anime.alternativeTitles && anime.alternativeTitles[0] && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                {anime.alternativeTitles[0]}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{anime.year || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">
                          {anime.totalEpisodes || anime.episodes || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(anime.status)}`}>
                          {anime.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {anime.rating && anime.rating !== 'N/A' ? (
                          <div className={`flex items-center ${getRatingColor(anime.rating)}`}>
                            <span className="text-sm mr-1">⭐</span>
                            <span className="font-semibold">{anime.rating}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {anime.genres && anime.genres.length > 0 ? (
                            anime.genres.slice(0, 3).map((genre, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full text-xs font-medium border border-gray-500"
                              >
                                {genre}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-xs">N/A</span>
                          )}
                          {anime.genres && anime.genres.length > 3 && (
                            <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded-full border border-gray-600">
                              +{anime.genres.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <Pagination
          currentPage={currentPage}
          totalItems={data.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </section>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-red-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-2 border-red-300 opacity-20 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-white text-xl font-semibold">Loading amazing anime content...</p>
            <p className="text-red-300 text-sm">Preparing your next adventure</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-8xl mb-6 animate-bounce">😞</div>
          <h2 className="text-3xl font-bold text-white mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-300 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg border border-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Watch Anime Online Free - AnimeLeveling"
        description="Stream thousands of anime episodes free in HD. Watch Naruto, One Piece, Attack on Titan, Demon Slayer, Jujutsu Kaisen and more on AnimeLeveling."
        keywords="watch anime online free, anime streaming HD, free anime site, trending anime, popular anime 2025, anime episodes online, AnimeLeveling"
        path="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Trending & Popular Anime',
          description: 'Watch trending and popular anime online free in HD quality.',
          url: process.env.REACT_APP_SITE_URL || 'https://animeleveling.com',
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-red-600 max-h-[200px] h-[200px] rounded-xl border border-slate-700/50">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-slate-500/5 animate-pulse duration-[3000ms]"></div>
        
        {/* Floating particles - more subtle */}
        <div className="absolute top-8 right-16 w-1 h-1 bg-red-400/60 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-12 left-16 w-1 h-1 bg-slate-400/40 rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-16 left-8 w-1 h-1 bg-red-300/50 rounded-full animate-pulse delay-500"></div>
        
        {/* Main content */}
        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center group">
          
          {/* Icon and title group */}
          <div className="flex items-center space-x-4 mb-2 transform group-hover:scale-105 transition-all duration-300">
            {/* Sharingan Eye Icon */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-90 transition-all duration-1000">
                {/* Sharingan pattern */}
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  {/* Outer black border */}
                  <circle cx="50" cy="50" r="48" fill="#000"/>
                  
                  {/* Red background */}
                  <circle cx="50" cy="50" r="44" fill="#dc2626"/>
                  
                  {/* Inner circle border */}
                  <circle cx="50" cy="50" r="22" fill="none" stroke="#991b1b" strokeWidth="1.5"/>
                  
                  {/* Center black pupil */}
                  <circle cx="50" cy="50" r="6" fill="#000"/>
                  
                  {/* Three tomoe (teardrop/comma shapes) */}
                  <g>
                    {/* Top tomoe */}
                    <g transform="rotate(0 50 50)">
                      <circle cx="50" cy="28" r="5" fill="#000"/>
                      <path d="M 45 28 Q 42 20, 50 20 Q 55 25, 50 28 Z" fill="#000"/>
                    </g>
                    
                    {/* Bottom right tomoe */}
                    <g transform="rotate(120 50 50)">
                      <circle cx="50" cy="28" r="5" fill="#000"/>
                      <path d="M 45 28 Q 42 20, 50 20 Q 55 25, 50 28 Z" fill="#000"/>
                    </g>
                    
                    {/* Bottom left tomoe */}
                    <g transform="rotate(240 50 50)">
                      <circle cx="50" cy="28" r="5" fill="#000"/>
                      <path d="M 45 28 Q 42 20, 50 20 Q 55 25, 50 28 Z" fill="#000"/>
                    </g>
                  </g>
                </svg>
              </div>
              <div className="absolute -inset-1 bg-red-500/20 rounded-full blur opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
            </div>
            
            {/* Main title */}
            <h1 className="text-3xl font-bold text-white tracking-tight">
              <span className="hover:text-red-300 transition-colors duration-300">Anime</span>
              <span className="text-red-400 hover:text-red-300 transition-colors duration-300 ml-2">Leveling</span>
            </h1>
          </div>
          
          {/* Japanese subtitle */}
          <div className="text-sm text-slate-400 font-light tracking-[0.2em] mb-4 opacity-80">
            アニメリスト
          </div>
          
          {/* Minimalist decorative line */}
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent group-hover:w-24 transition-all duration-500"></div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Section title="Trending Now" data={sections.trending} emoji="🔥" sectionKey="trending" />
          <Section title="All Time Popular" data={sections.popular} emoji="⭐" sectionKey="popular" />
          <Section title="Popular This Season" data={sections.season} emoji="🌸" sectionKey="season" />
          <Section title="Upcoming Next Season" data={sections.upcoming} emoji="🌱" sectionKey="upcoming" />
          
          {/* Top 100 Table with Pagination */}
          <Top100Table data={sections.top100} />
        </div>
      </div>
    </div>
    </>
  );
};

export default HomePage;