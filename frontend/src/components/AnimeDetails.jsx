import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ExternalLink,
  Play,
  Star,
  Calendar,
  Tv,
  Clock3,
  Heart,
  TrendingUp,
  Hash,
  Globe2,
  Building2,
  Users,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import SEO from './SEO';
import { animeAPI } from '../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const slugify = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const AnimeDetails = () => {
  const { id } = useParams();

  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [openDropdownEpisode, setOpenDropdownEpisode] = useState(null);
  const [episodesPage, setEpisodesPage] = useState(1);
  const [customContent, setCustomContent] = useState(null);

 useEffect(() => {
  const fetchDetails = async () => {
    setEpisodesPage(1);
    setLoading(true);
    setError(null);

    try {
      const data = await animeAPI.getDetails(id);

      if (!data || (Array.isArray(data) && data.length === 0)) {
        setError('Anime not found');
        setLoading(false);
        return;
      }

      setAnime(data);

      const score =
        data.averageScore ??
        data.meanScore ??
        (data.rating ? Math.round(parseFloat(data.rating) * 10) : '');

      // Content fetch separat — nu blocheaza pagina daca esueaza
      try {
        const contentRes = await fetch(
          `${API_BASE}/content/anime/${encodeURIComponent(id)}?title=${encodeURIComponent(
            data.title || ''
          )}&year=${encodeURIComponent(data.year || '')}&score=${encodeURIComponent(
            score
          )}&genres=${encodeURIComponent((data.genres || []).join(','))}`
        );
        if (contentRes.ok) {
          const contentJson = await contentRes.json();
          setCustomContent(contentJson?.success ? (contentJson.data || null) : null);
        }
      } catch {
        setCustomContent(null);
      }

    } catch (err) {
      console.error('Error fetching anime details:', err);
      setError('Failed to load anime details');
    } finally {
      setLoading(false);
    }
  };

  if (id) fetchDetails();
}, [id]);

  useEffect(() => {
    const closeDropdown = () => setOpenDropdownEpisode(null);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  const formatDate = (dateObj) => {
    if (!dateObj?.year) return 'Unknown';
    const month = dateObj.month ? String(dateObj.month).padStart(2, '0') : '01';
    const day = dateObj.day ? String(dateObj.day).padStart(2, '0') : '01';
    return `${dateObj.year}-${month}-${day}`;
  };

  const formatAiringTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'finished':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'ongoing':
      case 'releasing':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'upcoming':
      case 'not yet released':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'hiatus':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const generatedEpisodes = useMemo(() => {
    if (!anime) return [];

    const totalEpisodesRaw = anime.totalEpisodes || anime.episodes || 0;
    const totalEpisodes =
      typeof totalEpisodesRaw === 'number'
        ? totalEpisodesRaw
        : parseInt(totalEpisodesRaw, 10) || 0;

    if (totalEpisodes <= 0) return [];

    const animeTitle = anime.title || 'Unknown Anime';

    return Array.from({ length: totalEpisodes }, (_, index) => ({
      id: `${id}-episode-${index + 1}`,
      number: index + 1,
      title: `${animeTitle}: Episode ${index + 1}`,
      image: anime.image || null,
    }));
  }, [anime, id]);

  const displayAverageScore =
    anime?.averageScore != null
      ? anime.averageScore
      : anime?.rating && !Number.isNaN(parseFloat(anime.rating))
      ? Math.round(parseFloat(anime.rating) * 10)
      : null;

  const displayMeanScore =
    anime?.meanScore != null
      ? anime.meanScore
      : anime?.averageScore != null
      ? anime.averageScore
      : anime?.rating && !Number.isNaN(parseFloat(anime.rating))
      ? Math.round(parseFloat(anime.rating) * 10)
      : null;

  const EPISODES_PER_PAGE = 20;
  const totalEpisodePages = Math.ceil(generatedEpisodes.length / EPISODES_PER_PAGE);

  const paginatedEpisodes = generatedEpisodes.slice(
    (episodesPage - 1) * EPISODES_PER_PAGE,
    episodesPage * EPISODES_PER_PAGE
  );

  const episodeProviders = useMemo(() => {
    if (!anime?.title || generatedEpisodes.length === 0) return {};

    return generatedEpisodes.reduce((acc, episode) => {
      const epNumber = episode.number;
      const exactQuery = `${anime.title} episode ${epNumber}`;
      const encodedExactQuery = encodeURIComponent(exactQuery);
      const encodedTitle = encodeURIComponent(anime.title);

      acc[epNumber] = [
        {
          name: 'Google',
          url: `https://www.google.com/search?q=${encodedExactQuery}`,
        },
        {
          name: 'YouTube',
          url: `https://www.youtube.com/results?search_query=${encodedExactQuery}`,
        },
        {
          name: 'Crunchyroll',
          url: `https://www.crunchyroll.com/search?q=${encodedExactQuery}`,
        },
        {
          name: 'Aniwatch',
          url: `https://aniwatchtv.to/search?keyword=${encodedTitle}`,
        },
      ];

      return acc;
    }, {});
  }, [anime, generatedEpisodes]);

  // eslint-disable-next-line no-unused-vars
  const toggleEpisodeDropdown = (e, episodeNumber) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdownEpisode((prev) => (prev === episodeNumber ? null : episodeNumber));
  };

  // eslint-disable-next-line no-unused-vars
  const openProvider = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpenDropdownEpisode(null);
  };

  const statCards = anime
    ? [
        { label: 'Format', value: anime.format || 'Unknown', icon: Tv },
        { label: 'Episodes', value: anime.totalEpisodes || 'Unknown', icon: Hash },
        { label: 'Episode Duration', value: anime.duration ? `${anime.duration} mins` : 'Unknown', icon: Clock3 },
        { label: 'Status', value: anime.status || 'Unknown', icon: Sparkles },
        { label: 'Start Date', value: formatDate(anime.startDate), icon: Calendar },
        { label: 'End Date', value: formatDate(anime.endDate), icon: Calendar },
        {
          label: 'Season',
          value: anime.season && anime.seasonYear ? `${anime.season} ${anime.seasonYear}` : 'Unknown',
          icon: Calendar,
        },
        { label: 'Average Score', value: displayAverageScore != null ? `${displayAverageScore}%` : 'N/A', icon: Star },
        { label: 'Mean Score', value: displayMeanScore != null ? `${displayMeanScore}%` : 'N/A', icon: BarChart3 },
        { label: 'Popularity', value: anime.popularity?.toLocaleString() || '0', icon: TrendingUp },
        { label: 'Favorites', value: (anime.favourites ?? anime.favorites ?? 0).toLocaleString(), icon: Heart },
        { label: 'Source', value: anime.sourceMaterial || anime.source || 'Unknown', icon: Globe2 },
      ]
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1f] flex items-center justify-center">
        <div className="text-white text-xl">Loading anime details...</div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-[#0a0f1f] flex items-center justify-center">
        <div className="text-red-400 text-xl">{error || 'Anime not found'}</div>
      </div>
    );
  }

  const animeSlug = slugify(anime.title);
  const canonicalPath = `/anime/${anime.id}/${animeSlug}`;

  const seoTitle = `${anime.title} Episodes, Characters, Staff & Watch Links`;
  const seoDescription = anime.description
    ? `${anime.description.slice(0, 140)}... Watch episode links, character info, staff, relations and stats for ${anime.title}.`
    : `Watch ${anime.title} episode links, character info, staff, relations and stats on AnimeLeveling.`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: anime.title,
    image: anime.image,
    description: anime.description,
    genre: anime.genres || [],
    datePublished: anime.startDate?.year
      ? `${anime.startDate.year}-${String(anime.startDate.month || 1).padStart(2, '0')}-${String(
          anime.startDate.day || 1
        ).padStart(2, '0')}`
      : undefined,
    numberOfEpisodes: anime.totalEpisodes || undefined,
  };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={anime.image}
        path={canonicalPath}
        type="article"
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-[#0a0f1f] text-white">
        <div className="relative overflow-hidden">
          {anime.bannerImage ? (
            <div
              className="h-[340px] bg-cover bg-center"
              style={{ backgroundImage: `url(${anime.bannerImage})` }}
            />
          ) : (
            <div className="h-[340px] bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1f] via-[#0a0f1f]/70 to-black/40" />
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-16 -mt-40 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-8">
            <aside className="space-y-6">
              <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <img
                  src={anime.image}
                  alt={anime.title}
                  className="w-full h-auto object-cover"
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4 shadow-xl">
                <div
                  className={`inline-flex px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(
                    anime.status
                  )}`}
                >
                  {anime.status}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-black/20 p-4 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Average Score</p>
                    <p className="text-2xl font-bold text-emerald-300">
                      {displayAverageScore != null ? `${displayAverageScore}%` : 'N/A'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Mean Score</p>
                    <p className="text-2xl font-bold text-yellow-300">
                      {displayMeanScore != null ? `${displayMeanScore}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-400">Popularity</span>
                    <span>{anime.popularity?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-400">Favorites</span>
                    <span>{(anime.favourites ?? anime.favorites ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-400">Country</span>
                    <span>{anime.countryOfOrigin || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-400">Adult</span>
                    <span>{anime.isAdult ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {anime.siteUrl && (
                  <a
                    href={anime.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-500 transition px-4 py-3 font-semibold"
                  >
                    Open on AniList
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </aside>

            <main className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
                <div className="flex flex-col gap-6">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">{anime.title}</h1>

                    {anime.alternativeTitles?.length > 0 && (
                      <p className="text-gray-300 text-sm md:text-base">{anime.alternativeTitles.join(' • ')}</p>
                    )}

                    {anime.hashtag && <p className="mt-3 text-violet-300 font-medium">{anime.hashtag}</p>}
                  </div>

                  {anime.description && (
                    <div>
                      <h2 className="text-xl font-bold mb-3">Synopsis</h2>
                      <p className="text-gray-200 leading-8 whitespace-pre-line">{anime.description}</p>
                    </div>
                  )}

                  {customContent && (
                    <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-2xl space-y-6">
                      {customContent.customIntro && (
                        <div>
                          <h2 className="text-2xl font-bold mb-3">Overview</h2>
                          <p className="text-gray-200 leading-8 whitespace-pre-line">
                            {customContent.customIntro}
                          </p>
                        </div>
                      )}

                      {customContent.watchGuide && (
                        <div>
                          <h3 className="text-xl font-bold mb-3">Where to watch</h3>
                          <p className="text-gray-300 leading-7 whitespace-pre-line">
                            {customContent.watchGuide}
                          </p>
                        </div>
                      )}

                      {customContent.whyWatch && (
                        <div>
                          <h3 className="text-xl font-bold mb-3">Why watch {anime.title}?</h3>
                          <p className="text-gray-300 leading-7 whitespace-pre-line">
                            {customContent.whyWatch}
                          </p>
                        </div>
                      )}
                    </section>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {statCards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={card.label}
                          className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-black/30 transition"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-violet-300" />
                            </div>
                            <span className="text-sm text-gray-400">{card.label}</span>
                          </div>
                          <p className="text-lg font-semibold">{card.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  {anime.genres?.length > 0 && (
                    <section>
                      <h3 className="text-lg font-bold mb-3">Genres</h3>
                      <div className="flex flex-wrap gap-2">
                        {anime.genres.map((genre) => (
                          <span
                            key={genre}
                            className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/20 text-sky-200 text-sm"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {(anime.romajiTitle || anime.englishTitle || anime.nativeTitle || anime.synonyms?.length > 0) && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                        <h3 className="text-lg font-bold mb-3">Titles</h3>
                        <div className="space-y-2 text-sm">
                          {anime.romajiTitle && (
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-400">Romaji</span>
                              <span className="text-right">{anime.romajiTitle}</span>
                            </div>
                          )}
                          {anime.englishTitle && (
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-400">English</span>
                              <span className="text-right">{anime.englishTitle}</span>
                            </div>
                          )}
                          {anime.nativeTitle && (
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-400">Native</span>
                              <span className="text-right">{anime.nativeTitle}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                        <h3 className="text-lg font-bold mb-3">Synonyms</h3>
                        {anime.synonyms?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {anime.synonyms.map((syn) => (
                              <span
                                key={syn}
                                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm"
                              >
                                {syn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">No synonyms available.</p>
                        )}
                      </div>
                    </section>
                  )}

                  {anime.allStudios?.length > 0 && (
                    <section>
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-violet-300" />
                        Studios / Producers
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {anime.allStudios.map((studio) => (
                          <span
                            key={`${studio.name}-${studio.isAnimationStudio}`}
                            className={`px-3 py-1 rounded-full text-sm border ${
                              studio.isAnimationStudio
                                ? 'bg-emerald-500/15 border-emerald-400/20 text-emerald-200'
                                : 'bg-white/5 border-white/10 text-gray-200'
                            }`}
                          >
                            {studio.name}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {anime.tags?.length > 0 && (
                    <section>
                      <h3 className="text-lg font-bold mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {anime.tags.map((tag) => (
                          <span
                            key={tag.name}
                            className="px-3 py-1 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200 text-sm"
                          >
                            {tag.name} {tag.rank ? `${tag.rank}%` : ''}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {anime.externalLinks?.length > 0 && (
                    <section>
                      <h3 className="text-lg font-bold mb-3">External & Streaming Links</h3>
                      <div className="flex flex-wrap gap-3">
                        {anime.externalLinks.map((link) => (
                          <a
                            key={`${link.site}-${link.url}`}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
                          >
                            <span>{link.site}</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-xl">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'episodes', label: 'Episodes' },
                    { id: 'characters', label: 'Characters' },
                    { id: 'staff', label: 'Staff' },
                    { id: 'relations', label: 'Relations' },
                    { id: 'recommendations', label: 'Recommendations' },
                    { id: 'stats', label: 'Stats' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                        activeTab === tab.id
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {anime.trailer && (
                      <section>
                        <h3 className="text-xl font-bold mb-4">Trailer</h3>
                        <div className="aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black">
                          {anime.trailer.site === 'youtube' ? (
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${anime.trailer.id}`}
                              title="Anime Trailer"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <img
                              src={anime.trailer.thumbnail}
                              alt="Trailer thumbnail"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </section>
                    )}

                    {anime.nextAiring && (
                      <section className="rounded-2xl bg-sky-500/10 border border-sky-400/20 p-5">
                        <h3 className="text-lg font-bold mb-2">Next Airing</h3>
                        <p>Episode {anime.nextAiring.episode}</p>
                        <p className="text-sm text-gray-300 mt-1">
                          Airing: {formatAiringTime(anime.nextAiring.airingAt)}
                        </p>
                      </section>
                    )}
                  </div>
                )}

                {activeTab === 'episodes' && (
                  <div>
                    <h3 className="text-xl font-bold mb-5">Episodes</h3>

                    {generatedEpisodes.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {paginatedEpisodes.map((episode) => {
                            const episodeNumber = episode.number;
                            const providers = episodeProviders[episodeNumber] || [];
                            const isOpen = openDropdownEpisode === episodeNumber;

                            return (
                              <div
                                key={episode.id}
                                className="rounded-3xl border border-white/10 bg-black/20 overflow-hidden hover:bg-black/30 transition relative"
                              >
                                <div className="w-full aspect-[3/4] overflow-hidden rounded-t-3xl">
                                  {episode.image ? (
                                    <img
                                      src={episode.image}
                                      alt={episode.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Play className="w-10 h-10 text-gray-500" />
                                    </div>
                                  )}
                                </div>

                                <div className="p-5">
                                  <h4 className="font-semibold text-base mb-1 leading-6">{anime.title}</h4>
                                  <p className="text-sm text-gray-400 mb-4">Episode {episodeNumber}</p>
                                    <Link
                                      to={`/anime/${id}/${slugify(anime.title)}/episode/${episodeNumber}`}
                                      className="inline-flex items-center justify-center w-full px-4 py-3 rounded-2xl border border-white/10 bg-violet-600 hover:bg-violet-500 transition text-sm font-medium"
                                    >
                                      Open episode page
                                    </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {totalEpisodePages > 1 && (
                          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                            <button
                              onClick={() => setEpisodesPage((prev) => Math.max(prev - 1, 1))}
                              disabled={episodesPage === 1}
                              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
                            >
                              Previous
                            </button>

                            {Array.from({ length: totalEpisodePages }, (_, index) => index + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => setEpisodesPage(page)}
                                className={`px-4 py-2 rounded-xl text-sm border transition ${
                                  episodesPage === page
                                    ? 'bg-violet-600 border-violet-500 text-white'
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                }`}
                              >
                                {page}
                              </button>
                            ))}

                            <button
                              onClick={() =>
                                setEpisodesPage((prev) => Math.min(prev + 1, totalEpisodePages))
                              }
                              disabled={episodesPage === totalEpisodePages}
                              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400">No episode data available.</p>
                    )}
                  </div>
                )}

                {activeTab === 'characters' && (
                  <div>
                    <h3 className="text-xl font-bold mb-5">Characters</h3>
                    {anime.characters?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {anime.characters.map((character, index) => (
                          <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="flex gap-4">
                              <img
                                src={character.image}
                                alt={character.name}
                                className="w-16 h-16 rounded-xl object-cover"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold">{character.name}</p>
                                <p className="text-sm text-violet-300">{character.role}</p>
                                {character.voiceActor && (
                                  <p className="text-xs text-gray-300 mt-2">VA: {character.voiceActor.name}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No character information available.</p>
                    )}
                  </div>
                )}

                {activeTab === 'staff' && (
                  <div>
                    <h3 className="text-xl font-bold mb-5">Staff</h3>
                    {anime.staff?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {anime.staff.map((member, index) => (
                          <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="flex gap-4">
                              <img
                                src={member.image}
                                alt={member.name}
                                className="w-16 h-16 rounded-xl object-cover"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold">{member.name}</p>
                                <p className="text-sm text-gray-300">{member.role}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No staff information available.</p>
                    )}
                  </div>
                )}

                {activeTab === 'relations' && (
                  <div>
                    <h3 className="text-xl font-bold mb-5">Relations</h3>
                    {anime.relations?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {anime.relations.map((relation, index) => (
                          <Link
                            key={index}
                            to={`/anime/${relation.id}/${slugify(relation.title)}`}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-black/30 transition"
                          >
                            <div className="flex gap-4">
                              <img
                                src={relation.image}
                                alt={relation.title}
                                className="w-20 h-28 rounded-xl object-cover"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-sm mb-1">{relation.title}</p>
                                <p className="text-xs text-violet-300 mb-1">{relation.type}</p>
                                <p className="text-xs text-gray-400">
                                  {relation.format} • {relation.year || 'Unknown'}
                                </p>
                                {relation.rating !== 'N/A' && (
                                  <p className="text-xs text-yellow-300 mt-2">★ {relation.rating}</p>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No related anime found.</p>
                    )}
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div>
                    <h3 className="text-xl font-bold mb-5">Recommendations</h3>
                    {anime.recommendations?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {anime.recommendations.map((rec, index) => (
                          <Link
                            key={index}
                            to={`/anime/${rec.id}/${slugify(rec.title)}`}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-black/30 transition"
                          >
                            <div className="flex gap-4">
                              <img
                                src={rec.image}
                                alt={rec.title}
                                className="w-20 h-28 rounded-xl object-cover"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-sm mb-1">{rec.title}</p>
                                <p className="text-xs text-gray-400">
                                  {rec.format} • {rec.year || 'Unknown'}
                                </p>
                                {rec.rating !== 'N/A' && (
                                  <p className="text-xs text-yellow-300 mt-2">★ {rec.rating}</p>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No recommendations available.</p>
                    )}
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-300" />
                        Status Distribution
                      </h3>
                      {anime.statusDistribution?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {anime.statusDistribution.map((item) => (
                            <div
                              key={`${item.status}-${item.amount}`}
                              className="rounded-2xl border border-white/10 bg-black/20 p-4"
                            >
                              <div className="flex justify-between gap-4">
                                <span className="text-gray-300">{item.status}</span>
                                <span className="font-semibold">{item.amount.toLocaleString()} users</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No status distribution available.</p>
                      )}
                    </section>

                    <section>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-violet-300" />
                        Score Distribution
                      </h3>
                      {anime.scoreDistribution?.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                          {anime.scoreDistribution.map((item) => (
                            <div
                              key={`${item.score}-${item.amount}`}
                              className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center"
                            >
                              <p className="text-sm text-gray-400">{item.score}</p>
                              <p className="text-lg font-bold">{item.amount}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No score distribution available.</p>
                      )}
                    </section>

                    <section>
                      <h3 className="text-xl font-bold mb-4">Rankings</h3>
                      {anime.rankings?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {anime.rankings.map((ranking, index) => (
                            <div
                              key={`${ranking.id || ranking.rank}-${ranking.context || index}`}
                              className="rounded-2xl border border-white/10 bg-black/20 p-4"
                            >
                              <div className="flex justify-between gap-4">
                                <span className="text-gray-300">{ranking.context}</span>
                                <span className="font-semibold">#{ranking.rank}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No rankings available.</p>
                      )}
                    </section>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnimeDetails;