import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { EmbeddingResponse, SearchResponse } from '../lib/types';

interface GenerateEmbeddingInput {
  text: string;
  model?: string;
}

interface GenerateEmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
  text: string;
  processing_time_ms: number;
}

export function useGenerateEmbedding() {
  return useMutation({
    mutationFn: async (input: GenerateEmbeddingInput) => {
      const { data } = await apiClient.post<GenerateEmbeddingResponse>('/embeddings/generate', {
        texts: [input.text],
        model: input.model || 'BAAI/bge-small-en-v1.5',
      });
      return data;
    },
  });
}

interface CompareEmbeddingsInput {
  text1: string;
  text2: string;
  model?: string;
}

interface CompareEmbeddingsResponse {
  text1: string;
  text2: string;
  embedding1: number[];
  embedding2: number[];
  cosine_similarity: number;
  model: string;
  dimensions: number;
  processing_time_ms: number;
}

export function useCompareEmbeddings() {
  return useMutation({
    mutationFn: async (input: CompareEmbeddingsInput) => {
      const { data } = await apiClient.post<CompareEmbeddingsResponse>('/embeddings/compare', {
        text1: input.text1,
        text2: input.text2,
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
