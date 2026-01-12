import { AxiosError } from 'axios';

export interface RetryConfig {
    maxRetries: number;
    retryDelay: number;
    retryableStatusCodes: number[];
    shouldRetry: (error: AxiosError) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second base delay
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    shouldRetry: (error: AxiosError) => {
        // Don't retry if no response (could be CORS or network issue on client side)
        if (!error.response) {
            return !error.code || error.code !== 'ERR_CANCELED';
        }

        const status = error.response.status;
        const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

        // Retry on specific status codes
        return retryableStatusCodes.includes(status);
    },
};

export function getRetryDelay(retryCount: number, baseDelay = 1000): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(baseDelay * Math.pow(2, retryCount), 10000);
}

export function shouldRetryRequest(error: AxiosError, retryCount: number, config: Partial<RetryConfig> = {}): boolean {
    const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

    if (retryCount >= mergedConfig.maxRetries) {
        return false;
    }

    return mergedConfig.shouldRetry(error);
}

export { DEFAULT_RETRY_CONFIG };
