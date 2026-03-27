import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Header from './components/Header';

// Pagina principala se incarca imediat (e prima pagina)
import HomePage from './components/HomePage';

// Restul paginilor se incarca lazy — bundle initial mai mic
const SearchPage   = lazy(() => import('./components/SearchPage'));
const AnimeDetails = lazy(() => import('./components/AnimeDetails'));
const EpisodePage  = lazy(() => import('./components/EpisodePage'));
const FavoritesPage = lazy(() => import('./components/FavoritesPage'));
// Fallback simplu cat se incarca pagina
const PageLoader = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Header />
        <main>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"                                          element={<HomePage />} />
              <Route path="/search"                                    element={<SearchPage />} />
              <Route path="/favorites"                                 element={<FavoritesPage />} />
              <Route path="/anime/:id/:slug?"                          element={<AnimeDetails />} />
              <Route path="/anime/:id/:slug/episode/:episodeNumber"    element={<EpisodePage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;