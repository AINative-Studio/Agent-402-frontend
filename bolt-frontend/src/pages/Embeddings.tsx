import { useState } from 'react';
import { Search, Loader2, FileText, BarChart3, Database } from 'lucide-react';
import { useSemanticSearch, useEmbedAndStore } from '../hooks/useEmbeddings';
import { useProject } from '../hooks/useProject';

export function Embeddings() {
  const { currentProject } = useProject();
  const [query, setQuery] = useState('');
  const [namespace, setNamespace] = useState('default');
  const [threshold, setThreshold] = useState(0.7);
  const [activeTab, setActiveTab] = useState<'search' | 'store'>('search');

  // Embed & Store form state
  const [embedText, setEmbedText] = useState('');
  const [embedNamespace, setEmbedNamespace] = useState('default');

  const searchMutation = useSemanticSearch();
  const embedMutation = useEmbedAndStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    searchMutation.mutate({
      query_text: query,
      namespace,
      threshold,
      limit: 10,
    });
  };

  const handleEmbed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!embedText.trim()) return;

    embedMutation.mutate(
      {
        texts: [embedText],
        namespace: embedNamespace,
      },
      {
        onSuccess: () => {
          setEmbedText('');
        },
      }
    );
  };

  if (!currentProject) {
    return (
      <div className="p-6 text-gray-400 text-center">
        Please select a project to use embeddings search.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Embeddings</h1>
        <p className="text-gray-400 mt-1">Search and store embeddings using natural language</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'search'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'store'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Store Embedding
        </button>
      </div>

      {/* Search Form */}
      {activeTab === 'search' && (
        <form onSubmit={handleSearch} className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search Query
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your search query..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Namespace
            </label>
            <input
              type="text"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Similarity Threshold: {threshold}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={searchMutation.isPending || !query.trim()}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {searchMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search
            </>
          )}
        </button>
      </form>

      {/* Results */}
      {searchMutation.data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Results ({searchMutation.data.results?.length || 0})
            </h2>
            {searchMutation.data.processing_time_ms && (
              <span className="text-sm text-gray-400">
                {searchMutation.data.processing_time_ms}ms
              </span>
            )}
          </div>

          {searchMutation.data.results?.length > 0 ? (
            <div className="space-y-3">
              {searchMutation.data.results.map((result, index) => (
                <div
                  key={result.id || index}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-400">#{index + 1}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-400">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {(result.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-white">{result.document}</p>
                  {result.metadata && Object.keys(result.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {JSON.stringify(result.metadata)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No results found. Try adjusting your query or threshold.
            </div>
          )}
        </div>
      )}

      {searchMutation.isError && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          Error: {searchMutation.error?.message || 'Search failed'}
        </div>
      )}
    </div>
  );
}
