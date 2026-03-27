import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Menu, X, Heart } from 'lucide-react';
import { useAnimeFavorites } from './AnimeFavoritesContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { favoritesCount } = useAnimeFavorites();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === '/search') {
      setSearchQuery(searchParams.get('q') || '');
    }
  }, [location.pathname, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();

    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setIsMenuOpen(false);
  };

  const navItem = (path, label) => (
    <Link
      to={path}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        location.pathname === path
          ? 'bg-red-600 text-white shadow-lg border border-red-500'
          : 'text-gray-300 hover:bg-red-600 hover:text-white'
      }`}
      onClick={() => setIsMenuOpen(false)}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-gray-800 shadow-lg sticky top-0 z-50 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative group">
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400 group-hover:from-pink-300 group-hover:via-purple-300 group-hover:to-indigo-300 transition-all duration-500 tracking-wide filter drop-shadow-lg">
                AnimeLeveling
              </div>

              <div className="text-xs text-red-600 font-bold tracking-widest opacity-80 mt-1 group-hover:text-purple-300 transition-colors duration-300">
                アニメレベリング
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 via-purple-400/20 to-indigo-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anime..."
                className="w-64 bg-gray-700 text-white placeholder-gray-400 rounded-lg pl-10 pr-16 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs transition-colors duration-200 border border-red-500"
              >
                Go
              </button>
            </form>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-2">
              {navItem('/', 'Home')}
              {navItem('/search', 'Browse')}

              <Link
                to="/favorites"
                className={`relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  location.pathname === '/favorites'
                    ? 'bg-red-600 text-white shadow-lg border border-red-500'
                    : 'text-gray-300 hover:bg-red-600 hover:text-white'
                }`}
              >
                <Heart className="w-4 h-4" />
                Favorites

                {favoritesCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-white text-red-600 text-xs font-bold">
                    {favoritesCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-red-600 transition-colors duration-200"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search anime..."
                  className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg pl-10 pr-20 py-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm transition-colors duration-200 border border-red-500"
                >
                  Search
                </button>
              </div>
            </form>

            <nav className="flex flex-col space-y-2">
              {navItem('/', 'Home')}
              {navItem('/search', 'Browse')}

              <Link
                to="/favorites"
                onClick={() => setIsMenuOpen(false)}
                className={`relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                  location.pathname === '/favorites'
                    ? 'bg-red-600 text-white shadow-lg border border-red-500'
                    : 'text-gray-300 hover:bg-red-600 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Favorites
                </span>

                {favoritesCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-white text-red-600 text-xs font-bold">
                    {favoritesCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;