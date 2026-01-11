import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { EmbeddingResponse, SearchResponse } from '../lib/types';

interface GenerateEmbeddingInput {
  texts: string[];
  model?: string;
}

export function useGenerateEmbedding() {
  return useMutation({
    mutationFn: async (input: GenerateEmbeddingInput) => {
      const { data } = await apiClient.post<EmbeddingResponse>('/embeddings/generate', {
        texts: input.texts,
        model: input.model || 'BAAI/bge-small-en-v1.5',
      });
      return data;
    },
  });
}

interface EmbedAndStoreInput {
  texts: string[];
  namespace?: string;
  metadata?: Record<string, unknown>;
  model?: string;
}

interface EmbedAndStoreResponse {
  stored_count: number;
  vector_ids: string[];
  namespace: string;
  model: string;
}

export function useEmbedAndStore() {
  return useMutation({
    mutationFn: async (input: EmbedAndStoreInput) => {
      const { data } = await apiClient.post<EmbedAndStoreResponse>('/embeddings/embed-and-store', {
        texts: input.texts,
        namespace: input.namespace || 'default',
        metadata: input.metadata,
        model: input.model || 'BAAI/bge-small-en-v1.5',
      });
      return data;
    },
  });
}

interface SemanticSearchInput {
  query_text: string;
  namespace?: string;
  limit?: number;
  threshold?: number;
  model?: string;
}

export function useSemanticSearch() {
  return useMutation({
    mutationFn: async (input: SemanticSearchInput) => {
      const { data } = await apiClient.post<SearchResponse>('/embeddings/search', {
        query_text: input.query_text,
        namespace: input.namespace || 'default',
        limit: input.limit || 10,
        threshold: input.threshold || 0.7,
        model: input.model || 'BAAI/bge-small-en-v1.5',
      });
      return data;
    },
  });
}
