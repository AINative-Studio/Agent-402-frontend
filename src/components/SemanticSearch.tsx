import { useState, useEffect } from 'react';
import { Search, Loader2, Clock, X, TrendingUp, FileText } from 'lucide-react';
import type { SearchResult } from '../lib/types';

interface SemanticSearchProps {
    onSearch: (query: string, threshold: number) => void;
    isLoading: boolean;
    results: SearchResult[];
    error: Error | null;
    namespace?: string;
}

interface SearchHistoryItem {
    query: string;
    timestamp: string;
    resultCount: number;
}

export function SemanticSearch({
    onSearch,
    isLoading,
    results,
    error,
    namespace = 'default',
}: SemanticSearchProps) {
    const [query, setQuery] = useState('');
    const [threshold, setThreshold] = useState(0.7);
    const [showHistory, setShowHistory] = useState(false);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

    // Load search history from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(`search-history-${namespace}`);
        if (stored) {
            try {
                setSearchHistory(JSON.parse(stored));
            } catch {
                setSearchHistory([]);
            }
        }
    }, [namespace]);

    // Save search history to localStorage when it changes
    useEffect(() => {
        if (searchHistory.length > 0) {
            localStorage.setItem(
                `search-history-${namespace}`,
                JSON.stringify(searchHistory.slice(0, 10))
            );
        }
    }, [searchHistory, namespace]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        onSearch(query, threshold);

        // Add to search history
        const newHistoryItem: SearchHistoryItem = {
            query,
            timestamp: new Date().toISOString(),
            resultCount: 0,
        };
        setSearchHistory((prev) => [newHistoryItem, ...prev.slice(0, 9)]);
    };

    const handleHistoryClick = (historyQuery: string) => {
        setQuery(historyQuery);
        setShowHistory(false);
        onSearch(historyQuery, threshold);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem(`search-history-${namespace}`);
    };

    const highlightMatch = (text: string, query: string): JSX.Element => {
        if (!query.trim()) return <>{text}</>;

        const regex = new RegExp(`(${query.trim().split(/\s+/).join('|')})`, 'gi');
        const parts = text.split(regex);

        return (
            <>
                {parts.map((part, index) =>
                    regex.test(part) ? (
                        <mark
                            key={index}
                            className="bg-[var(--warning)]/30 text-[var(--warning)] px-1 rounded"
                        >
                            {part}
                        </mark>
                    ) : (
                        <span key={index}>{part}</span>
                    )
                )}
            </>
        );
    };

    return (
        <div className="space-y-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setShowHistory(true)}
                            placeholder="Search memories using natural language..."
                            className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                            aria-label="Semantic search query"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Search History Dropdown */}
                    {showHistory && searchHistory.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-10 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
                                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                    <Clock className="w-4 h-4" />
                                    <span>Recent Searches</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearHistory}
                                    className="text-xs text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {searchHistory.map((item, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleHistoryClick(item.query)}
                                        className="w-full px-4 py-2 text-left hover:bg-[var(--surface-2)] transition-colors"
                                    >
                                        <div className="text-sm text-[var(--text)]">{item.query}</div>
                                        <div className="text-xs text-[var(--muted)] mt-1">
                                            {new Date(item.timestamp).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Click outside to close history */}
                {showHistory && (
                    <div
                        className="fixed inset-0 z-0"
                        onClick={() => setShowHistory(false)}
                    />
                )}

                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-[var(--muted)] mb-2">
                            Similarity Threshold: {(threshold * 100).toFixed(0)}%
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="1"
                            step="0.05"
                            value={threshold}
                            onChange={(e) => setThreshold(parseFloat(e.target.value))}
                            className="w-full h-2 bg-[var(--surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                            aria-label="Similarity threshold"
                        />
                        <div className="flex justify-between text-xs text-[var(--subtle)] mt-1">
                            <span>Broader</span>
                            <span>Precise</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center gap-2"
                        aria-label="Search memories"
                    >
                        {isLoading ? (
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
                </div>
            </form>

            {/* Error State */}
            {error && (
                <div className="bg-[var(--danger)]/10 border border-[var(--danger)] rounded-xl p-4 text-[var(--danger)]">
                    <p className="font-medium">Search failed</p>
                    <p className="text-sm mt-1">{error.message}</p>
                </div>
            )}

            {/* Results */}
            {results && results.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                            Search Results ({results.length})
                        </h3>
                        <div className="text-sm text-[var(--muted)]">
                            Showing memories above {(threshold * 100).toFixed(0)}% similarity
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {results.map((result, index) => (
                            <div
                                key={result.id || index}
                                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)] transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-[var(--primary)]" />
                                        <span className="text-sm text-[var(--muted)]">
                                            Result #{index + 1}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--success)]/10">
                                        <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                                        <span className="text-sm font-semibold text-[var(--success)]">
                                            {(result.score * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                <p className="text-[var(--text)] leading-relaxed">
                                    {highlightMatch(result.document, query)}
                                </p>

                                {result.metadata && Object.keys(result.metadata).length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                        <details className="text-sm">
                                            <summary className="cursor-pointer text-[var(--muted)] hover:text-[var(--text)] transition-colors select-none">
                                                View Metadata
                                            </summary>
                                            <pre className="mt-2 text-xs text-[var(--subtle)] overflow-auto bg-[var(--surface-2)] rounded-lg p-3">
                                                {JSON.stringify(result.metadata, null, 2)}
                                            </pre>
                                        </details>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {results && results.length === 0 && !error && !isLoading && query && (
                <div className="text-center py-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                    <Search className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                    <p className="text-[var(--muted)] mb-2">No matching memories found</p>
                    <p className="text-sm text-[var(--subtle)]">
                        Try lowering the similarity threshold or using different search terms
                    </p>
                </div>
            )}
        </div>
    );
}
