import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { DocumentUploadRequest, DocumentUploadResponse, SearchResponse } from '../lib/types';

function getProjectId(): string {
    return localStorage.getItem('projectId') || 'default';
}

interface UploadDocumentsInput {
    documents: string[];
    namespace?: string;
    metadata?: Record<string, unknown>[];
    model?: string;
}

export function useUploadDocuments() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UploadDocumentsInput) => {
            const projectId = getProjectId();
            const request: DocumentUploadRequest = {
                documents: input.documents,
                namespace: input.namespace || 'default',
                metadata: input.metadata,
                model: input.model || 'BAAI/bge-small-en-v1.5',
                upsert: false,
            };

            const { data } = await apiClient.post<DocumentUploadResponse>(
                `/${projectId}/embeddings/embed-and-store`,
                request
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });
}

interface SearchDocumentsInput {
    namespace?: string;
    limit?: number;
}

export function useSearchDocuments(input: SearchDocumentsInput = {}) {
    const projectId = getProjectId();

    return useQuery({
        queryKey: ['documents', projectId, input.namespace],
        queryFn: async () => {
            // Return empty array since we don't have a search query
            // This hook should only be used when there's an actual search query
            return [];
        },
        // Disable this query since it requires a non-empty search query
        // Use a different endpoint for listing all documents
        enabled: false,
    });
}

interface DeleteDocumentInput {
    vectorId: string;
    namespace?: string;
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: DeleteDocumentInput) => {
            const projectId = getProjectId();
            await apiClient.delete(
                `/${projectId}/vectors/${input.vectorId}`,
                {
                    params: {
                        namespace: input.namespace || 'default',
                    },
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });
}
