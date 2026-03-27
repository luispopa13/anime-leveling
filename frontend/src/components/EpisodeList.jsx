import React, { useState, useEffect } from 'react';
import {
  Play,
  Clock,
  CheckCircle,
  Circle,
  Calendar,
  Hash,
} from 'lucide-react';
import { animeAPI } from '../services/api';

const EpisodeList = ({ animeId, onEpisodeSelect, currentEpisode }) => {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchProgress, setWatchProgress] = useState({});

  useEffect(() => {
    if (animeId) {
      fetchEpisodes();
      loadWatchProgress();
    }
  }, [animeId]);

  const fetchEpisodes = async () => {
    try {
      setLoading(true);
      setError(null);

      const episodesData = await animeAPI.getEpisodes(animeId);

      if (episodesData && episodesData.episodes) {
        setEpisodes(episodesData.episodes);
      } else {
        setError('No episodes found');
      }
    } catch (err) {
      console.error('Error fetching episodes:', err);
      setError('Failed to load episodes');
    } finally {
      setLoading(false);
    }
  };

  const loadWatchProgress = async () => {
    try {
      const savedProgress = localStorage.getItem(`watch_progress_${animeId}`);
      if (savedProgress) {
        setWatchProgress(JSON.parse(savedProgress));
      }
    } catch (err) {
      console.error('Error loading watch progress:', err);
    }
  };

  const handleEpisodeClick = (episode) => {
    onEpisodeSelect(episode);

    const newProgress = {
      ...watchProgress,
      [episode.number]: {
        ...watchProgress[episode.number],
        started: true,
        lastWatched: Date.now(),
      },
    };

    setWatchProgress(newProgress);
    localStorage.setItem(`watch_progress_${animeId}`, JSON.stringify(newProgress));
  };

  const getEpisodeStatus = (episodeNumber) => {
    const progress = watchProgress[episodeNumber];
    if (!progress) return 'unwatched';
    if (progress.completed) return 'completed';
    if (progress.started) return 'watching';
    return 'unwatched';
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    return `${minutes}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Episodes</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-600 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Episodes</h2>
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">{error}</div>
          <button
            onClick={fetchEpisodes}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Episodes</h2>
        <div className="text-center py-8 text-gray-400">No episodes available</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-white">
        Episodes ({episodes.length})
      </h2>

      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {episodes.map((episode) => {
          const status = getEpisodeStatus(episode.number);
          const isCurrentEpisode = episode.number === currentEpisode;

          return (
            <div
              key={episode.id || episode.number}
              onClick={() => handleEpisodeClick(episode)}
              className={`group cursor-pointer rounded-lg p-4 transition-all duration-200 ${
                isCurrentEpisode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="relative flex-shrink-0">
                  {episode.image ? (
                    <img
                      src={episode.image}
                      alt={`Episode ${episode.number}`}
                      className="w-16 h-12 object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-12 bg-gray-600 rounded flex items-center justify-center">
                      <Hash className="w-4 h-4 text-gray-400" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    {status === 'watching' && (
                      <Circle className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    )}
                    {status === 'unwatched' && (
                      <Circle className="w-4 h-4 text-gray-500" />
                    )}

                    <h3 className="font-medium truncate">
                      {episode.title || `Episode ${episode.number}`}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs opacity-80">
                    <span>Episode {episode.number}</span>

                    {episode.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(episode.duration)}
                      </span>
                    )}

                    {episode.airDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(episode.airDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-300">
                Open watch options for this episode
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EpisodeList;