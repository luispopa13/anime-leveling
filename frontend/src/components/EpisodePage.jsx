import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Loader2, Orbit,
  Play, Radio, Sparkles, Tv2, Volume2, X, AlertTriangle, RefreshCw,
} from 'lucide-react';
import SEO from './SEO';
import { animeAPI } from '../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─────────────────────────────────────────────────────────────────────────────
// Watch Modal
// ─────────────────────────────────────────────────────────────────────────────

const WatchModal = ({ animeSlug, animeTitle, episodeNumber, onClose }) => {
  const [sources,   setSources]   = useState([]);
  const [active,    setActive]    = useState(null);
  const [watchUrl,  setWatchUrl]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [useIframe, setUseIframe] = useState(false);

  // Escape key + scroll lock
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top      = `-${scrollY}px`;
    document.body.style.width    = '100%';
    const preventScroll = (e) => e.preventDefault();
    document.addEventListener('wheel',     preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('wheel',     preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top      = '';
      document.body.style.width    = '';
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  const fetchSources = useCallback(async () => {
    if (!animeSlug || !episodeNumber) return;
    setLoading(true);
    setError(null);
    setSources([]);
    setActive(null);
    setUseIframe(false);

    try {
      // Pasăm slug-ul DIN URL (ex: "naruto") + titlul exact pentru matching mai bun
      const url = `${API_BASE}/anime/sources/${encodeURIComponent(animeSlug)}/${episodeNumber}` +
                  `?title=${encodeURIComponent(animeTitle || '')}`;

      const res  = await fetch(url);
      const data = await res.json();

      console.log('[WatchModal] sources response:', data);

      if (!data.success) {
        setError(data.message || 'No sources available for this episode.');
        return;
      }

      setWatchUrl(data.watchUrl);

      if (data.sources?.length > 0) {
        setSources(data.sources);
        const def = data.sources.find((s) => s.type === 'sub') || data.sources[0];
        setActive(def);
        setUseIframe(false);
      } else {
        // Niciun embed direct → caută playerul pe pagina aniwatchtv
        setSources([]);
        setUseIframe(true);
      }
    } catch (err) {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [animeSlug, animeTitle, episodeNumber]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const iframeSrc = active?.embedUrl || (useIframe ? watchUrl : null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6"
      style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-5xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
        style={{ background: '#0d1117', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Tv2 className="w-5 h-5 text-violet-400 flex-shrink-0" />
            <span className="text-white font-semibold text-sm truncate">
              {animeTitle} — Episode {episodeNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            <button onClick={fetchSources} title="Retry"
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player */}
        <div className="relative bg-black flex-shrink-0" style={{ aspectRatio: '16/9' }}>

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
              <span className="text-sm text-gray-400">Loading player…</span>
            </div>
          )}

          {!loading && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center z-10">
              <AlertTriangle className="w-12 h-12 text-yellow-400" />
              <p className="text-gray-300 max-w-sm text-sm">{error}</p>
              <div className="flex gap-3">
                <button onClick={fetchSources}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition">
                  Retry
                </button>
                {watchUrl && (
                  <a href={watchUrl} target="_blank" rel="noreferrer"
                    className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition">
                    Open on AniWatch ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {!loading && !error && iframeSrc && (
            <div style={{ height: '470px' }}>
              <iframe
                key={iframeSrc}
                src={iframeSrc}
                style={
                  useIframe && !active
                    ? {
                        // Clip: taie header aniwatchtv sus (130px) si bare jos (110px)
                        position : 'absolute',
                        top      : '-130px',
                        left     : 0,
                        width    : '100%',
                        height   : 'calc(100% + 130px + 110px)',
                        border   : 'none',
                      }
                    : {
                        position : 'absolute',
                        inset    : 0,
                        width    : '100%',
                        height   : '100%',
                        border   : 'none',
                      }
                }
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
                referrerPolicy="origin"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-pointer-lock"
                title={`${animeTitle} Episode ${episodeNumber}`}
              />
            </div>
          )}

          {!loading && !error && !iframeSrc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <Play className="w-12 h-12 text-gray-600" />
              <p className="text-gray-400">No player available for this episode.</p>
              {watchUrl && (
                <a href={watchUrl} target="_blank" rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition">
                  Open on AniWatch ↗
                </a>
              )}
            </div>
          )}
        </div>

        {/* Server switcher */}
        {!loading && !error && sources.length > 1 && (
          <div className="px-5 py-4 border-t border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Servers</span>
              {watchUrl && (
                <a href={watchUrl} target="_blank" rel="noreferrer"
                  className="ml-auto text-xs text-violet-400 hover:text-violet-300 transition">
                  Open on AniWatch ↗
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((src) => {
                const isActive = active?.serverId === src.serverId;
                return (
                  <button key={src.serverId} onClick={() => setActive(src)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      isActive
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}>
                    {src.serverName}
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded ${
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

        {/* Info fallback iframe */}
        {!loading && !error && useIframe && watchUrl && (
          <div className="px-5 py-3 border-t border-white/10 flex-shrink-0 flex items-center justify-between gap-4">
            <span className="text-xs text-gray-500">
              Playing via AniWatch. If video doesn't load, open directly.
            </span>
            <a href={watchUrl} target="_blank" rel="noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 transition flex-shrink-0">
              Open on AniWatch ↗
            </a>
          </div>
        )}
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
      <div className="relative p-6 md:p-7">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center">{icon}</div>
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <div className="w-10 h-0.5 rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-400 mt-1.5" />
          </div>
        </div>
        <p className="text-gray-200 leading-8 whitespace-pre-line text-sm md:text-base">{text}</p>
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
      } catch (err) {
        setError('Failed to load episode page');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, numericEpisode]);

  const openPlayer  = useCallback(() => setShowPlayer(true),  []);
  const closePlayer = useCallback(() => setShowPlayer(false), []);

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
          animeSlug={slug}           /* slug-ul din URL: "naruto", "attack-on-titan" */
          animeTitle={anime.title}   /* titlul exact din AniList: "Naruto" */
          episodeNumber={numericEpisode}
          onClose={closePlayer}
        />
      )}

      <div className="min-h-screen bg-[#0a0f1f] text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

          <nav className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <Link to={`/anime/${id}/${slug}`} className="hover:text-white transition">{anime.title}</Link>
            <span>/</span>
            <span className="text-gray-300">Episode {numericEpisode}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-8">

            {/* Sidebar */}
            <aside className="space-y-5">
              <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 relative group cursor-pointer"
                onClick={openPlayer}>
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

              <button onClick={openPlayer}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-base
                           bg-gradient-to-r from-violet-600 to-pink-600
                           hover:from-violet-500 hover:to-pink-500
                           shadow-lg shadow-violet-500/30
                           transition-all duration-200 active:scale-[0.97]">
                <Play className="w-5 h-5 fill-white" />
                Watch Now
              </button>

              <Link to={`/anime/${id}/${slug}`}
                className="block text-center px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm text-gray-400 hover:text-white">
                ← Back to {anime.title}
              </Link>
            </aside>

            {/* Main */}
            <main>
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.10),transparent_30%)] pointer-events-none" />
                <div className="relative space-y-8">

                  <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">{anime.title}</h1>
                    <p className="text-violet-300 font-semibold mt-1 text-lg">Episode {numericEpisode}</p>
                  </div>

                  {(episodeContent?.customIntro || episodeContent?.watchGuide || episodeContent?.whyWatch) && (
                    <div className="space-y-5">
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
                    <button onClick={openPlayer}
                      className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg
                                 bg-gradient-to-r from-violet-600 to-pink-600
                                 hover:from-violet-500 hover:to-pink-500
                                 shadow-xl shadow-violet-500/25
                                 transition-all duration-200 active:scale-[0.97]">
                      <Play className="w-6 h-6 fill-white" />
                      Watch Episode {numericEpisode}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
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