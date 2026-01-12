import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useUploadDocuments } from '../hooks/useDocuments';

interface DocumentFile {
    id: string;
    name: string;
    content: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    vectorId?: string;
}

interface DocumentUploaderProps {
    namespace?: string;
    metadata?: Record<string, unknown>;
    onUploadComplete?: () => void;
}

export function DocumentUploader({
    namespace = 'default',
    metadata,
    onUploadComplete
}: DocumentUploaderProps) {
    const [files, setFiles] = useState<DocumentFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadMutation = useUploadDocuments();

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        await processFiles(droppedFiles);
    };

    const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
        await processFiles(selectedFiles);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const processFiles = async (fileList: File[]) => {
        const textFiles = fileList.filter(file =>
            file.type === 'text/plain' ||
            file.name.endsWith('.txt') ||
            file.name.endsWith('.md') ||
            file.type === 'text/markdown'
        );

        if (textFiles.length === 0) {
            return;
        }

        const newFiles: DocumentFile[] = await Promise.all(
            textFiles.map(async (file) => {
                const content = await readFileContent(file);
                return {
                    id: `${Date.now()}-${Math.random()}`,
                    name: file.name,
                    content,
                    status: 'pending' as const,
                };
            })
        );

        setFiles(prev => [...prev, ...newFiles]);
    };

    const readFileContent = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const removeFile = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const uploadFiles = async () => {
        const pendingFiles = files.filter(f => f.status === 'pending');
        if (pendingFiles.length === 0) return;

        setFiles(prev => prev.map(f =>
            f.status === 'pending' ? { ...f, status: 'uploading' } : f
        ));

        try {
            const documents = pendingFiles.map(f => f.content);
            const result = await uploadMutation.mutateAsync({
                documents,
                namespace,
                metadata: metadata ? pendingFiles.map(() => metadata) : undefined,
            });

            setFiles(prev => prev.map((file) => {
                if (file.status === 'uploading') {
                    const resultIndex = pendingFiles.findIndex(pf => pf.id === file.id);
                    if (resultIndex >= 0 && result.results[resultIndex]) {
                        return {
                            ...file,
                            status: 'success',
                            vectorId: result.results[resultIndex].vector_id,
                        };
                    }
                }
                return file;
            }));

            if (onUploadComplete) {
                onUploadComplete();
            }
        } catch (error) {
            setFiles(prev => prev.map(f =>
                f.status === 'uploading'
                    ? { ...f, status: 'error', error: (error as Error).message }
                    : f
            ));
        }
    };

    const clearCompleted = () => {
        setFiles(prev => prev.filter(f => f.status !== 'success'));
    };

    const hasFiles = files.length > 0;
    const hasPending = files.some(f => f.status === 'pending');
    const hasSuccess = files.some(f => f.status === 'success');
    const isUploading = uploadMutation.isPending;

    return (
        <div className="space-y-4">
            <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-800'
                }`}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        fileInputRef.current?.click();
                    }
                }}
                aria-label="Upload documents"
            >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-white font-medium mb-1">
                    Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-400">
                    Supports .txt and .md files
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,text/plain,text/markdown"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="File input"
                />
            </div>

            {hasFiles && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-300">
                            Files ({files.length})
                        </h3>
                        {hasSuccess && (
                            <button
                                onClick={clearCompleted}
                                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                            >
                                Clear completed
                            </button>
                        )}
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-3 bg-gray-800 rounded-lg p-3 border border-gray-700"
                            >
                                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">
                                        {file.name}
                                    </p>
                                    {file.error && (
                                        <p className="text-xs text-red-400 mt-1">
                                            {file.error}
                                        </p>
                                    )}
                                    {file.vectorId && (
                                        <p className="text-xs text-gray-500 mt-1 font-mono">
                                            {file.vectorId}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {file.status === 'pending' && (
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>
                                    )}
                                    {file.status === 'uploading' && (
                                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                    )}
                                    {file.status === 'success' && (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                    )}
                                    {file.status === 'error' && (
                                        <AlertCircle className="w-4 h-4 text-red-400" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasPending && (
                        <button
                            onClick={uploadFiles}
                            disabled={isUploading}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading and embedding...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Upload and embed {files.filter(f => f.status === 'pending').length} file(s)
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
