'use client';

import { useState, useEffect } from 'react';
import { ContentItem } from '@/modules/content';

interface ContentSelectorProps {
  onContentSelect: (content: string) => void;
}

export default function ContentSelector({ onContentSelect }: ContentSelectorProps) {
  const [localList, setLocalList] = useState<Omit<ContentItem, 'content'>[]>([]);
  const [yleList, setYleList] = useState<Omit<ContentItem, 'content'>[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [yleLoading, setYleLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Fetch local library on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content');
        if (!res.ok) throw new Error('Failed');
        setLocalList(await res.json());
        setLocalError(null);
      } catch {
        setLocalError('Failed to load library.');
      } finally {
        setLocalLoading(false);
      }
    })();
  }, []);

  // Fetch YLE episodes on mount — fail silently (live source may be unavailable)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?yle=list');
        if (res.ok) {
          const data = await res.json();
          setYleList(Array.isArray(data) ? data : []);
        }
      } catch {
        // YLE unavailable — just show nothing
      } finally {
        setYleLoading(false);
      }
    })();
  }, []);

  // Load a specific content item when selected
  const handleSelect = async (id: string) => {
    try {
      setLoadingId(id);
      setSelectedId(id);
      const res = await fetch(`/api/content?id=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      onContentSelect(data.content);
    } catch {
      // Silently unselect on error
      setSelectedId(null);
    } finally {
      setLoadingId(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':     return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced':     return 'bg-purple-100 text-purple-800';
      default:             return 'bg-gray-100 text-gray-800';
    }
  };

  const renderItem = (item: Omit<ContentItem, 'content'>) => (
    <button
      key={item.id}
      onClick={() => handleSelect(item.id)}
      disabled={loadingId === item.id}
      className={`text-left w-full p-4 rounded-lg border-2 transition-all ${
        selectedId === item.id
          ? 'border-indigo-500 bg-indigo-50 shadow-md'
          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-medium text-gray-900 leading-snug">{item.title}</h4>
        <div className="flex items-center gap-1.5 shrink-0">
          {loadingId === item.id && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-r-transparent" />
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(item.difficulty)}`}>
            {item.difficulty}
          </span>
        </div>
      </div>
      {item.description && (
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
      )}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.slice(0, 5).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );

  const isAnythingLoading = localLoading && yleLoading;

  if (isAnythingLoading) {
    return (
      <div className="text-center py-6">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-500 border-r-transparent" />
        <p className="mt-2 text-gray-600">Loading content...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Library (local markdown files) ── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Library
        </h3>
        {localLoading ? (
          <div className="text-center py-2">
            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-r-transparent" />
          </div>
        ) : localError ? (
          <p className="text-sm text-red-600">{localError}</p>
        ) : localList.length === 0 ? (
          <p className="text-sm text-gray-500">No stories yet. Add .md files to public/content/finnish/.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {localList.map(renderItem)}
          </div>
        )}
      </section>

      {/* ── Live news (YLE Selkouutiset) ── */}
      {(yleLoading || yleList.length > 0) && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Live news
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Yle Selkouutiset — recent episodes in easy Finnish
          </p>
          {yleLoading ? (
            <div className="text-center py-2">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-r-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {yleList.map(renderItem)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}