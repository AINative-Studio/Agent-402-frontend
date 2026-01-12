import { useState } from 'react';
import { Search, Loader2, FileText, BarChart3, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useSemanticSearch } from '../hooks/useEmbeddings';
import { useProject } from '../hooks/useProject';
import type { SearchResult } from '../lib/types';

interface FilterState {
  namespace: string;
  topK: number;
  threshold: number;
  includeMetadata: boolean;
  includeEmbeddings: boolean;
}

export function VectorSearch() {
  const { currentProject } = useProject();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<FilterState>({
    namespace: 'default',
    topK: 10,
    threshold: 0.5,
    includeMetadata: true,
    includeEmbeddings: false,
  });

  const searchMutation = useSemanticSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    searchMutation.mutate({
      query_text: query,
      namespace: filters.namespace,
      limit: filters.topK,
      threshold: filters.threshold,
      model: 'BAAI/bge-small-en-v1.5',
    });
  };

  const toggleResultExpanded = (resultId: string) => {
    setExpandedResults(prev => {
      const next = new Set(prev);
      if (next.has(resultId)) {
        next.delete(resultId);
      } else {
        next.add(resultId);
      }
      return next;
    });
  };

  const highlightMatch = (text: string, query: string): JSX.Element => {
    if (!query.trim()) return <span>{text}</span>;

    const queryTerms = query.toLowerCase().split(/\s+/);
    const words = text.split(/(\s+)/);

    return (
      <span>
        {words.map((word, idx) => {
          const isMatch = queryTerms.some(term =>
            word.toLowerCase().includes(term)
          );
          return isMatch ? (
            <mark key={idx} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">
              {word}
            </mark>
          ) : (
            <span key={idx}>{word}</span>
          );
        })}
      </span>
    );
  };

  if (!currentProject) {
    return (
      <div className="p-6 text-gray-400 text-center">
        Please select a project to use vector search.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vector Search</h1>
        <p className="text-gray-400 mt-1">
          Search documents using natural language and semantic similarity
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
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
                placeholder="Enter your natural language query..."
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Search Parameters</span>
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Namespace
                </label>
                <input
                  type="text"
                  value={filters.namespace}
                  onChange={(e) => setFilters({ ...filters, namespace: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Isolate search to specific namespace
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Top K Results: {filters.topK}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={filters.topK}
                  onChange={(e) => setFilters({ ...filters, topK: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of results (1-50)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Similarity Threshold: {filters.threshold.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={filters.threshold}
                  onChange={(e) => setFilters({ ...filters, threshold: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum similarity score (0.0-1.0)
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.includeMetadata}
                    onChange={(e) => setFilters({ ...filters, includeMetadata: e.target.checked })}
                    className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  Include metadata in results
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.includeEmbeddings}
                    onChange={(e) => setFilters({ ...filters, includeEmbeddings: e.target.checked })}
                    className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  Include embedding vectors
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={searchMutation.isPending || !query.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {searchMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>
      </form>

      {/* Search Results */}
      {searchMutation.data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Results ({searchMutation.data.results?.length || 0})
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              {searchMutation.data.namespace && (
                <span className="px-2 py-1 bg-gray-700 rounded">
                  Namespace: {searchMutation.data.namespace}
                </span>
              )}
              {searchMutation.data.processing_time_ms !== undefined && (
                <span>{searchMutation.data.processing_time_ms}ms</span>
              )}
            </div>
          </div>

          {searchMutation.data.results && searchMutation.data.results.length > 0 ? (
            <div className="space-y-3">
              {searchMutation.data.results.map((result: SearchResult, index: number) => {
                const isExpanded = expandedResults.has(result.id);
                const hasMetadata = result.metadata && Object.keys(result.metadata).length > 0;
                const hasEmbedding = result.embedding && result.embedding.length > 0;

                // Calculate similarity percentage
                const similarityPercent = (result.score * 100).toFixed(1);

                // Determine score color
                let scoreColor = 'text-green-400';
                if (result.score < 0.7) scoreColor = 'text-yellow-400';
                if (result.score < 0.5) scoreColor = 'text-orange-400';

                return (
                  <div
                    key={result.id}
                    className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          <div>
                            <span className="text-sm text-gray-400">Result #{index + 1}</span>
                            <p className="text-xs text-gray-500 font-mono">{result.id}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 ${scoreColor}`}>
                          <BarChart3 className="w-5 h-5" />
                          <span className="text-lg font-bold">
                            {similarityPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Document Text with Highlighting */}
                      <div className="mt-3 mb-3">
                        <p className="text-white leading-relaxed">
                          {highlightMatch(result.document, query)}
                        </p>
                      </div>

                      {/* Metadata Preview */}
                      {hasMetadata && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <button
                            onClick={() => toggleResultExpanded(result.id)}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            <span>
                              {isExpanded ? 'Hide' : 'Show'} Metadata
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-3 bg-gray-900 rounded border border-gray-700">
                              <pre className="text-xs text-gray-400 overflow-x-auto">
                                {JSON.stringify(result.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Embedding Vector Info */}
                      {hasEmbedding && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-700 rounded">
                            Embedding: {result.embedding!.length} dimensions
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                No results found for your query.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your search query or lowering the similarity threshold.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {searchMutation.isError && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-1">Search Error</h3>
          <p className="text-red-400 text-sm">
            {(searchMutation.error as any)?.detail || searchMutation.error?.message || 'An error occurred while searching'}
          </p>
        </div>
      )}

      {/* Help Text */}
      {!searchMutation.data && !searchMutation.isError && !searchMutation.isPending && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-3">How to use Vector Search</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Enter a natural language query describing what you are looking for</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Adjust the similarity threshold to control result quality (higher = more strict)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Use Top K to limit the number of results returned</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Results are sorted by relevance with similarity scores displayed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Use namespaces to isolate searches to specific collections</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
