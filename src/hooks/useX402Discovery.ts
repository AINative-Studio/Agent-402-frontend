import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import config from '../lib/config';

export interface X402DiscoveryResponse {
    version: string;
    endpoint: string;
    supported_dids: string[];
    signature_methods: string[];
    server_info: {
        name: string;
        description: string;
    };
}

export const x402DiscoveryKeys = {
    all: ['x402-discovery'] as const,
    discovery: () => [...x402DiscoveryKeys.all, 'info'] as const,
};

export function useX402Discovery() {
    return useQuery({
        queryKey: x402DiscoveryKeys.discovery(),
        queryFn: async () => {
            const baseUrl = config.api.baseUrl;
            const { data } = await axios.get<X402DiscoveryResponse>(`${baseUrl}/.well-known/x402`);
            return data;
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

export async function testX402Endpoint(projectId: string, apiKey: string): Promise<{
    success: boolean;
    message: string;
    response?: unknown;
    error?: string;
}> {
    try {
        const response = await axios.get(`${config.api.fullUrl}/${projectId}/x402-requests`, {
            headers: {
                'X-API-Key': apiKey,
            },
            params: {
                limit: 1,
            },
        });

        return {
            success: true,
            message: 'X402 endpoint is accessible and responding',
            response: response.data,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return {
                success: false,
                message: 'Failed to access X402 endpoint',
                error: error.response?.data?.detail || error.message,
            };
        }
        return {
            success: false,
            message: 'Failed to access X402 endpoint',
            error: String(error),
        };
    }
}
