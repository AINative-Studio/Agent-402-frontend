import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function NetworkStatus() {
    const { isOnline } = useNetworkStatus();

    if (isOnline) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-lg shadow-lg">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">No internet connection</span>
            </div>
        </div>
    );
}
