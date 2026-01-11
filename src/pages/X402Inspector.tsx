import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Key, CheckCircle, XCircle, Copy } from 'lucide-react';
import { useX402Requests } from '../hooks/useX402';
import { useProject } from '../hooks/useProject';
import type { X402Request } from '../lib/types';

export function X402Inspector() {
  const { runId } = useParams<{ runId: string }>();
  const { currentProject } = useProject();
  const { data: requests = [], isLoading, error } = useX402Requests(currentProject?.project_id, runId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const truncate = (str: string, length: number = 16) => {
    if (str.length <= length) return str;
    return `${str.slice(0, length / 2)}...${str.slice(-length / 2)}`;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-[var(--surface)] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <XCircle className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
            <p className="text-[var(--danger)] mb-2">Failed to load X402 requests</p>
            <p className="text-sm text-[var(--muted)]">{error instanceof Error ? error.message : 'An error occurred'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">X402 Requests</h2>
          <p className="text-[var(--muted)]">Cryptographically signed requests with verification status</p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <Key className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
            <p className="text-[var(--muted)]">No X402 requests found for this run</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.request_id || request.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        request.verified
                          ? 'bg-[var(--success)]/10'
                          : 'bg-[var(--danger)]/10'
                      }`}>
                        {request.verified ? (
                          <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                        ) : (
                          <XCircle className="w-5 h-5 text-[var(--danger)]" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {request.verified ? 'Verified' : 'Unverified'}
                        </div>
                        <div className="text-sm text-[var(--muted)]">
                          {new Date(request.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-[var(--muted)] mb-1">DID</div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">{truncate(request.merchant_did || request.did || '', 24)}</code>
                          <button
                            onClick={() => copyToClipboard(request.merchant_did || request.did || '')}
                            className="p-1 hover:bg-[var(--surface-2)] rounded"
                          >
                            <Copy className="w-3 h-3 text-[var(--muted)]" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-[var(--muted)] mb-1">Payload Hash</div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">{truncate(request.payload_hash || '', 24)}</code>
                          <button
                            onClick={() => copyToClipboard(request.payload_hash || '')}
                            className="p-1 hover:bg-[var(--surface-2)] rounded"
                          >
                            <Copy className="w-3 h-3 text-[var(--muted)]" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {(request as any).signature && (
                      <div className="mt-4">
                        <div className="text-xs text-[var(--muted)] mb-1">Signature</div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">{truncate((request as any).signature, 48)}</code>
                          <button
                            onClick={() => copyToClipboard((request as any).signature)}
                            className="p-1 hover:bg-[var(--surface-2)] rounded"
                          >
                            <Copy className="w-3 h-3 text-[var(--muted)]" />
                          </button>
                          <button
                            onClick={() => setExpandedId(expandedId === (request.request_id || request.id) ? null : (request.request_id || request.id))}
                            className="ml-auto text-xs text-[var(--primary)] hover:underline"
                          >
                            {expandedId === (request.request_id || request.id) ? 'Collapse' : 'Expand'}
                          </button>
                        </div>
                      </div>
                    )}

                    {expandedId === (request.request_id || request.id) && (request as any).signature && (
                      <div className="mt-4 space-y-3">
                        <div className="bg-[var(--surface-2)] rounded-xl p-4">
                          <div className="text-xs text-[var(--muted)] mb-2">Full Signature</div>
                          <code className="text-xs font-mono block break-all">{(request as any).signature}</code>
                        </div>

                        {(request as any).payload && (
                          <div className="bg-[var(--surface-2)] rounded-xl p-4">
                            <div className="text-xs text-[var(--muted)] mb-2">Payload</div>
                            <pre className="text-xs font-mono overflow-auto">
                              {JSON.stringify((request as any).payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
