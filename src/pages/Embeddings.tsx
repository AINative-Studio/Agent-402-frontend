import { useState } from 'react';
import { Search, Loader2, FileText, BarChart3, Database, Code, GitCompare, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useSemanticSearch, useEmbedAndStore, useGenerateEmbedding, useCompareEmbeddings } from '../hooks/useEmbeddings';
import { useProject } from '../hooks/useProject';

type TabType = 'generate' | 'compare' | 'search' | 'store';

export function Embeddings() {
    const { currentProject } = useProject();
    const [activeTab, setActiveTab] = useState<TabType>('generate');

    // Generate tab state
    const [generateText, setGenerateText] = useState('');
    const [showFullEmbedding, setShowFullEmbedding] = useState(false);

    // Compare tab state
    const [compareText1, setCompareText1] = useState('');
    const [compareText2, setCompareText2] = useState('');
    const [showEmbedding1, setShowEmbedding1] = useState(false);
    const [showEmbedding2, setShowEmbedding2] = useState(false);

    // Search tab state
    const [query, setQuery] = useState('');
    const [namespace, setNamespace] = useState('default');
    const [threshold, setThreshold] = useState(0.7);

    // Store tab state
    const [embedText, setEmbedText] = useState('');
    const [embedNamespace, setEmbedNamespace] = useState('default');

    const generateMutation = useGenerateEmbedding();
    const compareMutation = useCompareEmbeddings();
    const searchMutation = useSemanticSearch();
    const embedMutation = useEmbedAndStore();

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!generateText.trim()) return;

        generateMutation.mutate({
            text: generateText,
        });
    };

    const handleCompare = (e: React.FormEvent) => {
        e.preventDefault();
        if (!compareText1.trim() || !compareText2.trim()) return;

        compareMutation.mutate({
            text1: compareText1,
            text2: compareText2,
        });
    };

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

    const truncateEmbedding = (embedding: number[], limit = 10) => {
        if (embedding.length <= limit) return embedding;
        return [...embedding.slice(0, limit), -1]; // -1 as truncation indicator
    };

    const formatEmbedding = (embedding: number[], isTruncated: boolean) => {
        return (
            <div className="font-mono text-xs bg-gray-900 p-3 rounded-lg overflow-x-auto">
                <span className="text-gray-400">[</span>
                {embedding.map((val, idx) => {
                    if (val === -1) {
                        return (
                            <span key={idx} className="text-blue-400">
                                ... (and {isTruncated ? embedding.length - 10 : 0} more)
                            </span>
                        );
                    }
                    return (
                        <span key={idx}>
                            <span className="text-green-400">{val.toFixed(6)}</span>
                            {idx < embedding.length - 1 && <span className="text-gray-400">, </span>}
                        </span>
                    );
                })}
                <span className="text-gray-400">]</span>
            </div>
        );
    };

    const getSimilarityColor = (score: number) => {
        if (score >= 0.8) return 'text-green-400';
        if (score >= 0.6) return 'text-yellow-400';
        if (score >= 0.4) return 'text-orange-400';
        return 'text-red-400';
    };

    const getSimilarityLabel = (score: number) => {
        if (score >= 0.8) return 'Very Similar';
        if (score >= 0.6) return 'Similar';
        if (score >= 0.4) return 'Somewhat Similar';
        return 'Not Similar';
    };

    if (!currentProject) {
        return (
            <div className="p-6 text-gray-400 text-center">
                Please select a project to use the embeddings playground.
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Embeddings Playground</h1>
                <p className="text-gray-400 mt-1">
                    Generate, compare, and search embeddings using natural language
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'generate'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Generate
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('compare')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'compare'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <GitCompare className="w-4 h-4" />
                        Compare
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'search'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Search
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('store')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'store'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Store
                    </div>
                </button>
            </div>

            {/* Generate Embedding Tab */}
            {activeTab === 'generate' && (
                <div className="space-y-4">
                    <form onSubmit={handleGenerate} className="bg-gray-800 rounded-lg p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Text to Embed
                            </label>
                            <textarea
                                value={generateText}
                                onChange={(e) => setGenerateText(e.target.value)}
                                placeholder="Enter text to generate embedding..."
                                rows={4}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={generateMutation.isPending || !generateText.trim()}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {generateMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Code className="w-4 h-4" />
                                    Generate Embedding
                                </>
                            )}
                        </button>
                    </form>

                    {generateMutation.data && (
                        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                            {/* Model Info */}
                            <div className="flex items-center gap-2 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                                <Info className="w-5 h-5 text-blue-400" />
                                <div className="flex-1">
                                    <div className="text-sm text-gray-300">
                                        <span className="font-medium">Model:</span>{' '}
                                        <span className="text-blue-400">{generateMutation.data.model}</span>
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        <span className="font-medium">Dimensions:</span>{' '}
                                        <span className="text-green-400">{generateMutation.data.dimensions}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Processing time: {generateMutation.data.processing_time_ms}ms
                                    </div>
                                </div>
                            </div>

                            {/* Embedding Vector */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Embedding Vector ({generateMutation.data.embedding.length} dimensions)
                                    </label>
                                    <button
                                        onClick={() => setShowFullEmbedding(!showFullEmbedding)}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        {showFullEmbedding ? (
                                            <>
                                                <ChevronUp className="w-3 h-3" />
                                                Show Less
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-3 h-3" />
                                                Show All
                                            </>
                                        )}
                                    </button>
                                </div>
                                {formatEmbedding(
                                    showFullEmbedding
                                        ? generateMutation.data.embedding
                                        : truncateEmbedding(generateMutation.data.embedding),
                                    !showFullEmbedding
                                )}
                            </div>
                        </div>
                    )}

                    {generateMutation.isError && (
                        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
                            Error: {generateMutation.error?.message || 'Failed to generate embedding'}
                        </div>
                    )}
                </div>
            )}

            {/* Compare Embeddings Tab */}
            {activeTab === 'compare' && (
                <div className="space-y-4">
                    <form onSubmit={handleCompare} className="bg-gray-800 rounded-lg p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                First Text
                            </label>
                            <textarea
                                value={compareText1}
                                onChange={(e) => setCompareText1(e.target.value)}
                                placeholder="Enter first text..."
                                rows={3}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Second Text
                            </label>
                            <textarea
                                value={compareText2}
                                onChange={(e) => setCompareText2(e.target.value)}
                                placeholder="Enter second text..."
                                rows={3}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={compareMutation.isPending || !compareText1.trim() || !compareText2.trim()}
                            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {compareMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Comparing...
                                </>
                            ) : (
                                <>
                                    <GitCompare className="w-4 h-4" />
                                    Compare Embeddings
                                </>
                            )}
                        </button>
                    </form>

                    {compareMutation.data && (
                        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                            {/* Model Info */}
                            <div className="flex items-center gap-2 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                                <Info className="w-5 h-5 text-blue-400" />
                                <div className="flex-1">
                                    <div className="text-sm text-gray-300">
                                        <span className="font-medium">Model:</span>{' '}
                                        <span className="text-blue-400">{compareMutation.data.model}</span>
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        <span className="font-medium">Dimensions:</span>{' '}
                                        <span className="text-green-400">{compareMutation.data.dimensions}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Processing time: {compareMutation.data.processing_time_ms}ms
                                    </div>
                                </div>
                            </div>

                            {/* Similarity Score */}
                            <div className="p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700 rounded-lg text-center">
                                <div className="text-sm text-gray-300 mb-2">Cosine Similarity</div>
                                <div className={`text-5xl font-bold ${getSimilarityColor(compareMutation.data.cosine_similarity)}`}>
                                    {(compareMutation.data.cosine_similarity * 100).toFixed(2)}%
                                </div>
                                <div className="text-sm text-gray-400 mt-2">
                                    {getSimilarityLabel(compareMutation.data.cosine_similarity)}
                                </div>
                            </div>

                            {/* Embedding 1 */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Embedding 1 ({compareMutation.data.embedding1.length} dimensions)
                                    </label>
                                    <button
                                        onClick={() => setShowEmbedding1(!showEmbedding1)}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        {showEmbedding1 ? (
                                            <>
                                                <ChevronUp className="w-3 h-3" />
                                                Hide
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-3 h-3" />
                                                Show
                                            </>
                                        )}
                                    </button>
                                </div>
                                {showEmbedding1 && formatEmbedding(compareMutation.data.embedding1, false)}
                            </div>

                            {/* Embedding 2 */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Embedding 2 ({compareMutation.data.embedding2.length} dimensions)
                                    </label>
                                    <button
                                        onClick={() => setShowEmbedding2(!showEmbedding2)}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        {showEmbedding2 ? (
                                            <>
                                                <ChevronUp className="w-3 h-3" />
                                                Hide
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-3 h-3" />
                                                Show
                                            </>
                                        )}
                                    </button>
                                </div>
                                {showEmbedding2 && formatEmbedding(compareMutation.data.embedding2, false)}
                            </div>
                        </div>
                    )}

                    {compareMutation.isError && (
                        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
                            Error: {compareMutation.error?.message || 'Failed to compare embeddings'}
                        </div>
                    )}
                </div>
            )}

            {/* Search Form */}
            {activeTab === 'search' && (
                <div className="space-y-4">
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

                    {/* Search Results */}
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
            )}

            {/* Store Embedding Form */}
            {activeTab === 'store' && (
                <div className="space-y-4">
                    <form onSubmit={handleEmbed} className="bg-gray-800 rounded-lg p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Text to Embed
                            </label>
                            <textarea
                                value={embedText}
                                onChange={(e) => setEmbedText(e.target.value)}
                                placeholder="Enter text to create embedding..."
                                rows={4}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Namespace
                            </label>
                            <input
                                type="text"
                                value={embedNamespace}
                                onChange={(e) => setEmbedNamespace(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={embedMutation.isPending || !embedText.trim()}
                            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {embedMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Storing...
                                </>
                            ) : (
                                <>
                                    <Database className="w-4 h-4" />
                                    Store Embedding
                                </>
                            )}
                        </button>
                    </form>

                    {/* Store Success Message */}
                    {embedMutation.isSuccess && (
                        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 text-green-400">
                            Successfully stored embedding! Vector ID: {embedMutation.data.vector_ids?.[0]}
                        </div>
                    )}

                    {/* Store Error Message */}
                    {embedMutation.isError && (
                        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
                            Error: {embedMutation.error?.message || 'Failed to store embedding'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
