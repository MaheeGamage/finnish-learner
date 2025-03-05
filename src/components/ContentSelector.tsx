import { useState, useEffect } from 'react';
import { ContentItem } from '@/utils/contentLoader';

interface ContentSelectorProps {
  onContentSelect: (content: string) => void;
  currentLang: 'en' | 'fi';
}

export default function ContentSelector({ onContentSelect, currentLang }: ContentSelectorProps) {
  const [contentList, setContentList] = useState<Omit<ContentItem, 'content'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch available content on mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/content');
        
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        
        const data = await response.json();
        setContentList(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, []);

  // Load specific content when selected
  const handleContentSelect = async (id: string) => {
    try {
      setLoading(true);
      setSelectedId(id);
      
      const response = await fetch(`/api/content?id=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      const data = await response.json();
      onContentSelect(data.content);
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load selected content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && contentList.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-500 border-r-transparent"></div>
        <p className="mt-2 text-gray-600">Loading content...</p>
      </div>
    );
  }

  if (error && contentList.length === 0) {
    return (
      <div className="text-center py-4 text-red-600">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (contentList.length === 0) {
    return (
      <div className="text-center py-4 text-gray-600">
        <p>No Finnish content found. Add .md files to the content directory.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-800">Select Finnish Content</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {contentList.map((item) => (
          <button
            key={item.id}
            onClick={() => handleContentSelect(item.id)}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              selectedId === item.id
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(item.difficulty)}`}>
                {item.difficulty}
              </span>
            </div>
            {item.description && (
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}