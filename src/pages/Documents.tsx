import { useState } from 'react';
import { FileText, Trash2, Database, Search, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { DocumentUploader } from '../components/DocumentUploader';
import { useSearchDocuments, useDeleteDocument } from '../hooks/useDocuments';
import { useProject } from '../hooks/useProject';
import { SkeletonListCard } from '../components/skeletons';

export function Documents() {
    const { currentProject } = useProject();
    const [namespace, setNamespace] = useState('default');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [metadata, setMetadata] = useState<Record<string, string>>({});

    const { data: documents, isLoading, refetch } = useSearchDocuments({ namespace });
    const deleteMutation = useDeleteDocument();

    const handleDelete = async (vectorId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        try {
            await deleteMutation.mutateAsync({ vectorId, namespace });
        } catch (error) {
            console.error('Failed to delete document:', error);
        }
    };

    const handleAddMetadata = () => {
        const key = prompt('Enter metadata key:');
        if (!key) return;
        const value = prompt('Enter metadata value:');
        if (!value) return;

        setMetadata(prev => ({ ...prev, [key]: value }));
    };

    const handleRemoveMetadata = (key: string) => {
        setMetadata(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    const filteredDocuments = documents?.filter(doc =>
        searchQuery === '' ||
        doc.document.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (!currentProject) {
        return (
            <div className="p-6 text-gray-400 text-center">
                Please select a project to manage documents.
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Documents</h1>
                <p className="text-gray-400 mt-1">
                    Upload and store documents with automatic embedding generation
                </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Upload Documents
                    </h2>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showFilters && (
                    <div className="space-y-4 pt-4 border-t border-gray-700">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Namespace
                            </label>
                            <input
                                type="text"
                                value={namespace}
                                onChange={(e) => setNamespace(e.target.value)}
                                placeholder="default"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Metadata
                                </label>
                                <button
                                    onClick={handleAddMetadata}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    + Add metadata
                                </button>
                            </div>
                            {Object.keys(metadata).length > 0 ? (
                                <div className="space-y-2">
                                    {Object.entries(metadata).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2 bg-gray-700 rounded px-3 py-2">
                                            <span className="text-sm text-gray-300 flex-1">
                                                <span className="font-medium">{key}:</span> {value}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveMetadata(key)}
                                                className="text-gray-400 hover:text-red-400 transition-colors"
                                                aria-label={`Remove ${key}`}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No metadata added</p>
                            )}
                        </div>
                    </div>
                )}

                <DocumentUploader
                    namespace={namespace}
                    metadata={Object.keys(metadata).length > 0 ? metadata : undefined}
                    onUploadComplete={refetch}
                />
            </div>

            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Stored Documents
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Namespace:</span>
                        <span className="font-mono text-blue-400">{namespace}</span>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search documents..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {isLoading ? (
                    <SkeletonListCard items={3} />
                ) : filteredDocuments.length > 0 ? (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-400">
                            {filteredDocuments.length} document(s) found
                        </p>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white mb-2 break-words">
                                                {doc.document}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span className="font-mono">
                                                    ID: {doc.id}
                                                </span>
                                                {doc.score !== undefined && (
                                                    <span>
                                                        Score: {(doc.score * 100).toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                            {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {Object.entries(doc.metadata).map(([key, value]) => (
                                                        <span
                                                            key={key}
                                                            className="text-xs bg-gray-600 px-2 py-1 rounded"
                                                        >
                                                            {key}: {String(value)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            disabled={deleteMutation.isPending}
                                            className="p-2 hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                            aria-label="Delete document"
                                        >
                                            {deleteMutation.isPending ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        {searchQuery ? (
                            <p>No documents match your search.</p>
                        ) : (
                            <p>No documents found in this namespace. Upload some documents to get started.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
