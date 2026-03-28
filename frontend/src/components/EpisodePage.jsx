import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Loader2, Orbit,
  Play, Radio, Sparkles, Tv2, Volume2, X,
  AlertTriangle, RefreshCw, ExternalLink, SkipForward, SkipBack,
} from 'lucide-react';
import SEO from './SEO';
import { animeAPI } from '../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─────────────────────────────────────────────────────────────────────────────
// Watch Modal
// ─────────────────────────────────────────────────────────────────────────────

const WatchModal = ({ animeSlug, animeTitle, episodeNumber, totalEpisodes, animeId, slug, onClose }) => {
  const navigate = useNavigate();

  const [sources,   setSources]   = useState([]);
  const [active,    setActive]    = useState(null);
  const [watchUrl,  setWatchUrl]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [currentEp, setCurrentEp] = useState(episodeNumber);

  // Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fetchSources = useCallback(async (ep) => {
    setLoading(true);
    setError(null);
    setSources([]);
    setActive(null);
    try {
      const res  = await fetch(
        `${API_BASE}/anime/sources/${encodeURIComponent(animeSlug)}/${ep}` +
        `?title=${encodeURIComponent(animeTitle || '')}`
      );
      const data = await res.json();
      if (!data.success) { setError(data.message || 'No sources available.'); return; }
      setWatchUrl(data.watchUrl);
      if (data.sources?.length > 0) {
        setSources(data.sources);
        setActive(data.sources.find((s) => s.type === 'sub') || data.sources[0]);
      } else {
        setSources([]);
        setActive({ serverId: 'direct', serverName: 'AniWatch', type: 'direct', embedUrl: data.watchUrl });
      }
    } catch { setError('Failed to connect to server.'); }
    finally   { setLoading(false); }
  }, [animeSlug, animeTitle]);

  useEffect(() => { fetchSources(currentEp); }, [currentEp, fetchSources]);

  const goToEp = (ep) => {
    setCurrentEp(ep);
    navigate(`/anime/${animeId}/${slug}/episode/${ep}`, { replace: true });
  };

  const hasPrev   = currentEp > 1;
  const hasNext   = totalEpisodes ? currentEp < totalEpisodes : true;
  const iframeSrc = active?.embedUrl || null;
  const isFullPage = active?.serverId === 'direct';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-5"
      style={{ background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ background: '#0d1117', maxWidth: 960, maxHeight: '95vh' }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Tv2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span className="text-white font-semibold text-sm truncate">{animeTitle}</span>
            <span className="text-violet-300 text-sm flex-shrink-0">— Episode {currentEp}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
            <button onClick={() => fetchSources(currentEp)} title="Reload"
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Player ─────────────────────────────────────────────────────────
         *
         * Containerul are aspect-ratio 16:9 strict (DOAR video, fără bare).
         * overflow:hidden taie tot ce iese din container.
         *
         * Iframe full-page aniwatchtv:
         *   - top: -130px  → tăiem header + titlu aniwatchtv (sus)
         *   - height: 100% + 130px + 110px → iframe mai înalt ca containerul
         *     → barele de jos (Light/AutoPlay/Prev/Next, ~110px) ies din container
         *     → overflow:hidden le taie
         *
         * Rezultat: se vede STRICT zona video, fără niciun element al aniwatchtv.
         * ────────────────────────────────────────────────────────────────── */}
        <div
          className="relative bg-black flex-shrink-0 w-full overflow-hidden"
          style={{ height: 'clamp(410px, 56.25vw, 780px)' }}
        >
          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
              <span className="text-sm text-gray-400">Loading player…</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center z-10">
              <AlertTriangle className="w-10 h-10 text-yellow-400" />
              <p className="text-gray-300 text-sm max-w-sm leading-relaxed">{error}</p>
              <div className="flex gap-3 flex-wrap justify-center">
                <button onClick={() => fetchSources(currentEp)}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition">
                  Retry
                </button>
                {watchUrl && (
                  <a href={watchUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open on AniWatch
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Iframe */}
          {!loading && !error && iframeSrc && (
            isFullPage ? (
              // Pagina completă aniwatchtv — clip sus și jos
              <iframe
                key={iframeSrc}
                src={iframeSrc}
                scrolling="no"
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                referrerPolicy="origin"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-pointer-lock"
                title={`${animeTitle} Episode ${currentEp}`}
                style={{
                  position : 'absolute',
                  top      : '-130px',          // taie header aniwatchtv
                  left     : 0,
                  width    : '100%',
                  height   : 'calc(100% + 130px + 160px)', // extinde jos → barele ies din container
                  border   : 'none',
                }}
              />
            ) : (
              // Embed direct — iframe perfect 100%
              <iframe
                key={iframeSrc}
                src={iframeSrc}
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
                referrerPolicy="origin"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-pointer-lock"
                title={`${animeTitle} Episode ${currentEp}`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />
            )
          )}

          {!loading && !error && !iframeSrc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Play className="w-10 h-10 text-gray-600" />
              <p className="text-gray-500 text-sm">No player available.</p>
            </div>
          )}
        </div>

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-white/10">

          {/* Server selector — doar dacă avem embed-uri multiple */}
          {!loading && !error && sources.length > 1 && (
            <div className="px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Servers</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sources.map((src) => {
                  const isActive = active?.serverId === src.serverId;
                  return (
                    <button key={src.serverId} onClick={() => setActive(src)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                        isActive
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}>
                      {src.serverName}
                      <span className={`ml-1 text-[10px] px-1 py-0.5 rounded ${
                        src.type === 'sub' ? 'bg-blue-500/30 text-blue-300' : 'bg-orange-500/30 text-orange-300'
                      }`}>
                        {src.type?.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prev / Next episode */}
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <button
              onClick={() => hasPrev && goToEp(currentEp - 1)}
              disabled={!hasPrev}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                hasPrev
                  ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  : 'bg-white/[0.03] text-gray-600 border border-white/5 cursor-not-allowed'
              }`}
            >
              <SkipBack className="w-4 h-4" />
              <span>Prev</span>
              {hasPrev && <span className="text-gray-400 text-xs hidden sm:inline">Ep {currentEp - 1}</span>}
            </button>

            <span className="text-xs text-gray-500 flex-shrink-0">
              Episode {currentEp}{totalEpisodes ? ` / ${totalEpisodes}` : ''}
            </span>

            <button
              onClick={() => hasNext && goToEp(currentEp + 1)}
              disabled={!hasNext}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                hasNext
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white border border-violet-400/20 shadow-lg shadow-violet-500/20'
                  : 'bg-white/[0.03] text-gray-600 border border-white/5 cursor-not-allowed'
              }`}
            >
              {hasNext && <span className="text-white/70 text-xs hidden sm:inline">Ep {currentEp + 1}</span>}
              <span>Next</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Info Panel
// ─────────────────────────────────────────────────────────────────────────────

const InfoPanel = ({ icon, title, text, accent = 'violet' }) => {
  const accentMap = {
    violet: 'from-violet-500/20 via-fuchsia-500/10 to-cyan-400/10 border-violet-500/20',
    red   : 'from-red-500/20 via-pink-500/10 to-orange-400/10 border-red-500/20',
    cyan  : 'from-cyan-500/20 via-blue-500/10 to-violet-400/10 border-cyan-500/20',
  };
  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${accentMap[accent]} backdrop-blur-sm`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_40%)] pointer-events-none" />
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center">{icon}</div>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <div className="w-8 h-0.5 rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-400 mt-1" />
          </div>
        </div>
        <p className="text-gray-200 leading-7 whitespace-pre-line text-sm">{text}</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EpisodePage
// ─────────────────────────────────────────────────────────────────────────────

const EpisodePage = () => {
  const { id, slug, episodeNumber } = useParams();
  const numericEpisode = parseInt(episodeNumber, 10);

  const [anime,          setAnime]          = useState(null);
  const [episodeContent, setEpisodeContent] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [showPlayer,     setShowPlayer]     = useState(false);

  useEffect(() => {
    if (!id || !numericEpisode) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const animeData = await animeAPI.getDetails(id);
        setAnime(animeData);

        const score =
          animeData.averageScore ??
          animeData.meanScore ??
          (animeData.rating ? Math.round(parseFloat(animeData.rating) * 10) : '');

        const res = await fetch(
          `${API_BASE}/content/episode/${encodeURIComponent(id)}/${encodeURIComponent(numericEpisode)}` +
          `?title=${encodeURIComponent(animeData.title || '')}` +
          `&year=${encodeURIComponent(animeData.year || '')}` +
          `&score=${encodeURIComponent(score)}` +
          `&genres=${encodeURIComponent((animeData.genres || []).join(','))}`
        );
        const json = await res.json();
        if (json?.success) setEpisodeContent(json.data || null);
      } catch { setError('Failed to load episode page'); }
      finally   { setLoading(false); }
    };
    fetchData();
  }, [id, numericEpisode]);

  const openPlayer  = useCallback(() => setShowPlayer(true),  []);
  const closePlayer = useCallback(() => setShowPlayer(false), []);

  const totalEps = anime?.totalEpisodes && anime.totalEpisodes !== 'Unknown'
    ? parseInt(anime.totalEpisodes, 10) : null;

  const prevLink = numericEpisode > 1
    ? `/anime/${id}/${slug}/episode/${numericEpisode - 1}` : null;
  const nextLink = `/anime/${id}/${slug}/episode/${numericEpisode + 1}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
          <span className="text-gray-400 text-sm">Loading episode…</span>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-[#0a0f1f] flex items-center justify-center text-red-400">
        {error || 'Episode not found'}
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${anime.title} Episode ${numericEpisode}`}
        description={`Watch ${anime.title} Episode ${numericEpisode} online.`}
        image={anime.image}
        path={`/anime/${id}/${slug}/episode/${numericEpisode}`}
        type="article"
        structuredData={{
          '@context': 'https://schema.org', '@type': 'TVEpisode',
          name: `${anime.title} Episode ${numericEpisode}`,
          partOfSeries: { '@type': 'TVSeries', name: anime.title },
          episodeNumber: numericEpisode, image: anime.image,
        }}
      />

      {showPlayer && (
        <WatchModal
          animeSlug={slug}
          animeTitle={anime.title}
          episodeNumber={numericEpisode}
          totalEpisodes={totalEps}
          animeId={id}
          slug={slug}
          onClose={closePlayer}
        />
      )}

      <div className="min-h-screen bg-[#0a0f1f] text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

          {/* Back + Breadcrumb */}
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              to={`/anime/${id}/${slug}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-white/5 hover:bg-white/10 border border-white/10
                         text-sm text-gray-300 hover:text-white transition flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <nav className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
              <Link to="/" className="hover:text-white transition">Home</Link>
              <span>/</span>
              <Link to={`/anime/${id}/${slug}`} className="hover:text-white transition">{anime.title}</Link>
              <span>/</span>
              <span className="text-gray-300">Episode {numericEpisode}</span>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8">

            {/* Sidebar */}
            <aside className="space-y-4">
              <div
                className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 relative group cursor-pointer"
                onClick={openPlayer}
              >
                <img
                  src={anime.image || `${API_BASE}/placeholder/300/400`}
                  alt={anime.title}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center shadow-2xl shadow-violet-500/50">
                    <Play className="w-7 h-7 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              <button
                onClick={openPlayer}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-base
                           bg-gradient-to-r from-violet-600 to-pink-600
                           hover:from-violet-500 hover:to-pink-500
                           shadow-lg shadow-violet-500/30
                           transition-all duration-200 active:scale-[0.97]"
              >
                <Play className="w-5 h-5 fill-white" />
                Watch Now
              </button>

              <div className="grid grid-cols-2 gap-2">
                {prevLink ? (
                  <Link to={prevLink}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-xs text-gray-300 hover:text-white">
                    <ArrowLeft className="w-3.5 h-3.5" /> Ep {numericEpisode - 1}
                  </Link>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-600">
                    <ArrowLeft className="w-3.5 h-3.5" /> Prev
                  </div>
                )}
                <Link to={nextLink}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/80 to-pink-600/80 hover:from-violet-500 hover:to-pink-500 border border-violet-400/20 transition text-xs text-white">
                  Ep {numericEpisode + 1} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </aside>

            {/* Main */}
            <main>
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.10),transparent_30%)] pointer-events-none" />
                <div className="relative space-y-7">

                  <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">{anime.title}</h1>
                    <p className="text-violet-300 font-semibold mt-1">Episode {numericEpisode}</p>
                  </div>

                  {(episodeContent?.customIntro || episodeContent?.watchGuide || episodeContent?.whyWatch) && (
                    <div className="space-y-4">
                      {episodeContent?.customIntro && (
                        <InfoPanel icon={<Sparkles className="w-5 h-5 text-violet-300" />} title="Overview" text={episodeContent.customIntro} accent="violet" />
                      )}
                      {episodeContent?.watchGuide && (
                        <InfoPanel icon={<Radio className="w-5 h-5 text-red-300" />} title="Where to watch" text={episodeContent.watchGuide} accent="red" />
                      )}
                      {episodeContent?.whyWatch && (
                        <InfoPanel icon={<Orbit className="w-5 h-5 text-cyan-300" />} title="Why watch this episode?" text={episodeContent.whyWatch} accent="cyan" />
                      )}
                    </div>
                  )}

                  <div className="flex justify-center py-2">
                    <button
                      onClick={openPlayer}
                      className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg
                                 bg-gradient-to-r from-violet-600 to-pink-600
                                 hover:from-violet-500 hover:to-pink-500
                                 shadow-xl shadow-violet-500/25
                                 transition-all duration-200 active:scale-[0.97]"
                    >
                      <Play className="w-6 h-6 fill-white" />
                      Watch Episode {numericEpisode}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {prevLink ? (
                      <Link to={prevLink} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition">
                        <ArrowLeft className="w-4 h-4" /> Episode {numericEpisode - 1}
                      </Link>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.02] border border-white/5 text-gray-600">
                        <ArrowLeft className="w-4 h-4" /> Previous
                      </div>
                    )}
                    <Link to={nextLink} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white border border-violet-400/20 transition shadow-lg shadow-violet-500/10">
                      Episode {numericEpisode + 1} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default EpisodePage;