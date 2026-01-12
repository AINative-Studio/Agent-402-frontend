import { useState } from 'react';
import { Download, FileJson, Share2, Copy, Check } from 'lucide-react';
import type { ReplayStep } from '../hooks/useRunReplay';

interface PlaybackControlsProps {
    steps: ReplayStep[];
    runId: string;
    currentStepIndex: number;
}

/**
 * PlaybackControls provides export and sharing functionality for workflow replays
 * Supports JSON export, PDF generation, and shareable links
 */
export function PlaybackControls({
    steps,
    runId,
    currentStepIndex
}: PlaybackControlsProps) {
    const [copied, setCopied] = useState(false);
    const [exporting, setExporting] = useState(false);

    /**
     * Export replay data as JSON
     */
    const handleExportJSON = () => {
        setExporting(true);

        try {
            const exportData = {
                run_id: runId,
                exported_at: new Date().toISOString(),
                current_step: currentStepIndex + 1,
                total_steps: steps.length,
                steps: steps.map((step, index) => ({
                    step_number: index + 1,
                    timestamp: step.timestamp,
                    type: step.type,
                    agent_role: step.agentRole,
                    title: step.title,
                    description: step.description,
                    data: step.data
                }))
            };

            const blob = new Blob(
                [JSON.stringify(exportData, null, 2)],
                { type: 'application/json' }
            );
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `workflow-replay-${runId}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting JSON:', error);
        } finally {
            setExporting(false);
        }
    };

    /**
     * Export replay as PDF (basic HTML-to-print implementation)
     */
    const handleExportPDF = () => {
        setExporting(true);

        try {
            // Create a printable version of the replay data
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('Please allow popups to export PDF');
                setExporting(false);
                return;
            }

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Workflow Replay - ${runId}</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            padding: 40px;
                            color: #333;
                        }
                        h1 { font-size: 24px; margin-bottom: 10px; }
                        h2 { font-size: 18px; margin-top: 30px; margin-bottom: 10px; }
                        h3 { font-size: 16px; margin-top: 20px; margin-bottom: 8px; }
                        .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
                        .step {
                            page-break-inside: avoid;
                            border: 1px solid #ddd;
                            padding: 20px;
                            margin-bottom: 20px;
                            border-radius: 8px;
                        }
                        .step-header {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 15px;
                            padding-bottom: 10px;
                            border-bottom: 1px solid #eee;
                        }
                        .step-type {
                            display: inline-block;
                            padding: 4px 12px;
                            background: #f0f0f0;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: uppercase;
                        }
                        .step-time {
                            color: #666;
                            font-size: 14px;
                            font-family: 'Courier New', monospace;
                        }
                        pre {
                            background: #f5f5f5;
                            padding: 15px;
                            border-radius: 4px;
                            overflow-x: auto;
                            font-size: 12px;
                        }
                        @media print {
                            body { padding: 20px; }
                            .step { page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Workflow Replay Report</h1>
                    <div class="meta">
                        <strong>Run ID:</strong> ${runId}<br>
                        <strong>Exported:</strong> ${new Date().toLocaleString()}<br>
                        <strong>Total Steps:</strong> ${steps.length}<br>
                        <strong>Current Step:</strong> ${currentStepIndex + 1}
                    </div>

                    ${steps.map((step, index) => `
                        <div class="step">
                            <div class="step-header">
                                <div>
                                    <h3>Step ${index + 1}: ${step.title}</h3>
                                    <span class="step-type">${step.type}</span>
                                    ${step.agentRole ? `<span class="step-type">${step.agentRole}</span>` : ''}
                                </div>
                                <div class="step-time">${new Date(step.timestamp).toLocaleString()}</div>
                            </div>
                            <p>${step.description}</p>
                            <pre>${JSON.stringify(step.data, null, 2)}</pre>
                        </div>
                    `).join('')}

                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
                </html>
            `;

            printWindow.document.write(printContent);
            printWindow.document.close();
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            setExporting(false);
        }
    };

    /**
     * Copy current step details to clipboard
     */
    const handleCopyStep = async () => {
        const currentStep = steps[currentStepIndex];
        if (!currentStep) return;

        try {
            const stepText = `
Step ${currentStepIndex + 1} of ${steps.length}
Type: ${currentStep.type}
Agent: ${currentStep.agentRole || 'N/A'}
Title: ${currentStep.title}
Description: ${currentStep.description}
Timestamp: ${new Date(currentStep.timestamp).toLocaleString()}

Data:
${JSON.stringify(currentStep.data, null, 2)}
            `.trim();

            await navigator.clipboard.writeText(stepText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    /**
     * Generate shareable link to this replay
     */
    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/runs/${runId}?step=${currentStepIndex + 1}`;

        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Error copying share link:', error);
        }
    };

    return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Export & Share</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Export JSON */}
                <button
                    onClick={handleExportJSON}
                    disabled={exporting}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Export as JSON"
                >
                    <FileJson className="w-5 h-5" />
                    <span className="text-sm font-medium">Export JSON</span>
                </button>

                {/* Export PDF */}
                <button
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Export as PDF"
                >
                    <Download className="w-5 h-5" />
                    <span className="text-sm font-medium">Export PDF</span>
                </button>

                {/* Copy Step */}
                <button
                    onClick={handleCopyStep}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors"
                    aria-label="Copy current step details"
                >
                    {copied ? (
                        <>
                            <Check className="w-5 h-5 text-[var(--success)]" />
                            <span className="text-sm font-medium text-[var(--success)]">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-5 h-5" />
                            <span className="text-sm font-medium">Copy Step</span>
                        </>
                    )}
                </button>

                {/* Share Link */}
                <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors"
                    aria-label="Share replay link"
                >
                    {copied ? (
                        <>
                            <Check className="w-5 h-5 text-[var(--success)]" />
                            <span className="text-sm font-medium text-[var(--success)]">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Share</span>
                        </>
                    )}
                </button>
            </div>

            {/* Export Status */}
            {exporting && (
                <div className="mt-4 p-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                    <p className="text-sm text-[var(--primary)] text-center">
                        Preparing export...
                    </p>
                </div>
            )}

            {/* Info Text */}
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted)] text-center">
                    Export includes all {steps.length} workflow steps with full data
                </p>
            </div>
        </div>
    );
}
