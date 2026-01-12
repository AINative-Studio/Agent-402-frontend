import { useState } from 'react';
import {
    Globe,
    Key,
    CheckCircle,
    Copy,
    ExternalLink,
    AlertCircle,
    Play,
    Loader2,
    FileCode,
    Shield,
    Info
} from 'lucide-react';
import { useX402Discovery, testX402Endpoint } from '../hooks/useX402Discovery';
import { useProject } from '../hooks/useProject';
import { appConfig } from '../config/app.config';
import config from '../lib/config';

export function X402Discovery() {
    const { data, isLoading, error, refetch } = useX402Discovery();
    const { currentProject } = useProject();
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
        error?: string;
    } | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleTestEndpoint = async () => {
        if (!currentProject?.project_id) {
            setTestResult({
                success: false,
                message: 'No project selected',
                error: 'Please select a project to test the endpoint',
            });
            return;
        }

        const apiKey = localStorage.getItem('apiKey');
        if (!apiKey) {
            setTestResult({
                success: false,
                message: 'No API key found',
                error: 'Please log in again to test the endpoint',
            });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const result = await testX402Endpoint(currentProject.project_id, apiKey);
            setTestResult(result);
        } catch (err) {
            setTestResult({
                success: false,
                message: 'Test failed',
                error: String(err),
            });
        } finally {
            setIsTesting(false);
        }
    };

    const getFullEndpointUrl = (endpoint: string) => {
        return `${config.api.baseUrl}${endpoint}`;
    };

    const getDiscoveryUrl = () => {
        return `${config.api.baseUrl}/.well-known/x402`;
    };

    const ErrorIcon = appConfig.emptyStates.error.icon;

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-32 bg-[var(--surface)] rounded-2xl" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-48 bg-[var(--surface)] rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-[var(--surface)] border border-[var(--danger)]/20 rounded-2xl p-6">
                        <div className="flex items-start gap-3">
                            <ErrorIcon className="w-5 h-5 text-[var(--danger)] mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-[var(--danger)] mb-1">
                                    {appConfig.emptyStates.error.title}
                                </h3>
                                <p className="text-sm text-[var(--muted)]">
                                    {error instanceof Error ? error.message : appConfig.emptyStates.error.message}
                                </p>
                                <button
                                    onClick={() => refetch()}
                                    className="mt-4 px-4 py-2 bg-[var(--danger)] text-white rounded-lg text-sm font-medium hover:opacity-90"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
                        <Globe className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                        <p className="text-[var(--muted)]">No discovery data available</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--success)]/10 border border-[var(--border)] rounded-2xl p-6 sm:p-8">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Globe className="w-6 h-6 text-[var(--primary)]" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2">X402 Protocol Discovery</h1>
                            <p className="text-[var(--muted)]">
                                Protocol capabilities and endpoint configuration
                            </p>
                        </div>
                    </div>

                    {/* Discovery URL */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-[var(--muted)] mb-1">Discovery Endpoint</div>
                                <code className="text-sm font-mono break-all">{getDiscoveryUrl()}</code>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => copyToClipboard(getDiscoveryUrl())}
                                    className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                                    aria-label="Copy discovery URL"
                                >
                                    <Copy className="w-4 h-4 text-[var(--muted)]" />
                                </button>
                                <a
                                    href={getDiscoveryUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                                    aria-label="Open discovery endpoint in new tab"
                                >
                                    <ExternalLink className="w-4 h-4 text-[var(--muted)]" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Server Information */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[var(--success)]/10 rounded-xl flex items-center justify-center">
                            <Info className="w-5 h-5 text-[var(--success)]" />
                        </div>
                        <h2 className="text-xl font-semibold">Server Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="text-sm text-[var(--muted)] mb-1">Name</div>
                            <div className="font-medium">{data.server_info.name}</div>
                        </div>
                        <div>
                            <div className="text-sm text-[var(--muted)] mb-1">Description</div>
                            <div className="font-medium">{data.server_info.description}</div>
                        </div>
                    </div>
                </div>

                {/* Protocol Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Version & Endpoint */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
                                <FileCode className="w-5 h-5 text-[var(--primary)]" />
                            </div>
                            <h2 className="text-xl font-semibold">Protocol Version</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-[var(--muted)] mb-1">Version</div>
                                <div className="text-2xl font-bold text-[var(--primary)]">{data.version}</div>
                            </div>
                            <div>
                                <div className="text-sm text-[var(--muted)] mb-2">X402 Endpoint</div>
                                <div className="bg-[var(--surface-2)] rounded-lg p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <code className="text-sm font-mono break-all flex-1">
                                            {getFullEndpointUrl(data.endpoint)}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(getFullEndpointUrl(data.endpoint))}
                                            className="p-1.5 hover:bg-[var(--surface)] rounded flex-shrink-0"
                                            aria-label="Copy endpoint URL"
                                        >
                                            <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Supported DIDs */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[var(--warning)]/10 rounded-xl flex items-center justify-center">
                                <Key className="w-5 h-5 text-[var(--warning)]" />
                            </div>
                            <h2 className="text-xl font-semibold">Supported DIDs</h2>
                        </div>
                        <div className="space-y-2">
                            {data.supported_dids.map((did) => (
                                <div
                                    key={did}
                                    className="flex items-center gap-2 bg-[var(--surface-2)] rounded-lg p-3"
                                >
                                    <CheckCircle className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                                    <code className="text-sm font-mono">{did}</code>
                                </div>
                            ))}
                        </div>
                        {data.supported_dids.length === 0 && (
                            <p className="text-sm text-[var(--muted)] italic">No DID methods configured</p>
                        )}
                    </div>

                    {/* Signature Methods */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[var(--success)]/10 rounded-xl flex items-center justify-center">
                                <Shield className="w-5 h-5 text-[var(--success)]" />
                            </div>
                            <h2 className="text-xl font-semibold">Signature Methods</h2>
                        </div>
                        <div className="space-y-2">
                            {data.signature_methods.map((method) => (
                                <div
                                    key={method}
                                    className="flex items-center gap-2 bg-[var(--surface-2)] rounded-lg p-3"
                                >
                                    <CheckCircle className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                                    <code className="text-sm font-mono">{method}</code>
                                </div>
                            ))}
                        </div>
                        {data.signature_methods.length === 0 && (
                            <p className="text-sm text-[var(--muted)] italic">No signature methods configured</p>
                        )}
                    </div>

                    {/* Test Endpoint */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
                                <Play className="w-5 h-5 text-[var(--primary)]" />
                            </div>
                            <h2 className="text-xl font-semibold">Test Endpoint</h2>
                        </div>
                        <p className="text-sm text-[var(--muted)] mb-4">
                            Test the X402 endpoint connectivity and authentication
                        </p>
                        <button
                            onClick={handleTestEndpoint}
                            disabled={isTesting || !currentProject}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTesting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Testing...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    <span>Test Connection</span>
                                </>
                            )}
                        </button>

                        {testResult && (
                            <div
                                className={`mt-4 p-4 rounded-lg border ${
                                    testResult.success
                                        ? 'bg-[var(--success)]/10 border-[var(--success)]/20'
                                        : 'bg-[var(--danger)]/10 border-[var(--danger)]/20'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {testResult.success ? (
                                        <CheckCircle className="w-5 h-5 text-[var(--success)] mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-[var(--danger)] mt-0.5 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div
                                            className={`font-medium mb-1 ${
                                                testResult.success ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                                            }`}
                                        >
                                            {testResult.message}
                                        </div>
                                        {testResult.error && (
                                            <div className="text-sm text-[var(--muted)] break-words">
                                                {testResult.error}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Example Usage */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Example Usage</h2>
                    <div className="space-y-4">
                        <div>
                            <div className="text-sm font-medium mb-2">cURL</div>
                            <div className="bg-[var(--surface-2)] rounded-lg p-4 relative group">
                                <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
                                    {`curl ${getDiscoveryUrl()}`}
                                </pre>
                                <button
                                    onClick={() => copyToClipboard(`curl ${getDiscoveryUrl()}`)}
                                    className="absolute top-2 right-2 p-2 bg-[var(--surface)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Copy cURL command"
                                >
                                    <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-2">JavaScript</div>
                            <div className="bg-[var(--surface-2)] rounded-lg p-4 relative group">
                                <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
                                    {`fetch('${getDiscoveryUrl()}')
  .then(res => res.json())
  .then(data => console.log(data));`}
                                </pre>
                                <button
                                    onClick={() =>
                                        copyToClipboard(
                                            `fetch('${getDiscoveryUrl()}')\n  .then(res => res.json())\n  .then(data => console.log(data));`
                                        )
                                    }
                                    className="absolute top-2 right-2 p-2 bg-[var(--surface)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Copy JavaScript code"
                                >
                                    <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-2">Python</div>
                            <div className="bg-[var(--surface-2)] rounded-lg p-4 relative group">
                                <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
                                    {`import requests

response = requests.get('${getDiscoveryUrl()}')
data = response.json()
print(data)`}
                                </pre>
                                <button
                                    onClick={() =>
                                        copyToClipboard(
                                            `import requests\n\nresponse = requests.get('${getDiscoveryUrl()}')\ndata = response.json()\nprint(data)`
                                        )
                                    }
                                    className="absolute top-2 right-2 p-2 bg-[var(--surface)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Copy Python code"
                                >
                                    <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Schema */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Response Schema</h2>
                    <div className="bg-[var(--surface-2)] rounded-lg p-4 relative group">
                        <pre className="text-xs font-mono overflow-auto max-h-96 whitespace-pre-wrap break-words">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                        <button
                            onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
                            className="absolute top-2 right-2 p-2 bg-[var(--surface)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Copy response schema"
                        >
                            <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
