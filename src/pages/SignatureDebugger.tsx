import { useState, useEffect } from 'react';
import {
    Key,
    CheckCircle,
    XCircle,
    Copy,
    RotateCw,
    Shield,
    AlertCircle,
    Info,
    Eye,
    EyeOff,
    FileCode,
    Play,
    Zap,
    Lock
} from 'lucide-react';
import { useSignature, type VerificationResult } from '../hooks/useSignature';

const EXAMPLE_PAYLOADS = [
    {
        name: 'Payment Transaction',
        payload: {
            transaction_type: 'payment',
            amount: 1500.00,
            currency: 'USD',
            merchant_id: 'did:key:merchant-abc123',
            timestamp: new Date().toISOString(),
            metadata: {
                order_id: 'ORD-2024-001',
                customer_id: 'CUST-789'
            }
        }
    },
    {
        name: 'Agent Authorization',
        payload: {
            action: 'execute_trade',
            agent_id: 'did:key:agent-trader-001',
            task_id: 'TASK-123-456',
            permissions: ['read_market_data', 'execute_trades'],
            timestamp: new Date().toISOString()
        }
    },
    {
        name: 'Compliance Approval',
        payload: {
            approval_type: 'compliance_check',
            risk_score: 15,
            approved_by: 'did:key:compliance-officer',
            entity_id: 'ENTITY-XYZ',
            timestamp: new Date().toISOString(),
            checks_passed: ['kyc', 'aml', 'sanctions']
        }
    },
    {
        name: 'Simple Message',
        payload: {
            message: 'Hello, World!',
            sender: 'did:key:user-001',
            timestamp: new Date().toISOString()
        }
    }
];

export function SignatureDebugger() {
    const {
        generateKeyPair,
        signPayload,
        verifySignature,
        derivePublicKey,
        validatePrivateKey,
        isGenerating,
        isVerifying,
        error: hookError
    } = useSignature();

    // Key management
    const [privateKey, setPrivateKey] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [showPrivateKey, setShowPrivateKey] = useState(false);

    // Payload editor
    const [payloadInput, setPayloadInput] = useState(JSON.stringify(EXAMPLE_PAYLOADS[0].payload, null, 2));
    const [payloadError, setPayloadError] = useState<string | null>(null);

    // Signature results
    const [generatedSignature, setGeneratedSignature] = useState('');
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

    // Verification inputs
    const [verifyPayloadInput, setVerifyPayloadInput] = useState('');
    const [verifySignatureInput, setVerifySignatureInput] = useState('');
    const [verifyPublicKeyInput, setVerifyPublicKeyInput] = useState('');

    // UI state
    const [activeTab, setActiveTab] = useState<'generate' | 'verify'>('generate');
    const [copied, setCopied] = useState<string | null>(null);

    // Derive public key when private key changes
    useEffect(() => {
        if (privateKey && validatePrivateKey(privateKey)) {
            try {
                const derived = derivePublicKey(privateKey);
                setPublicKey(derived);
            } catch {
                setPublicKey('');
            }
        } else {
            setPublicKey('');
        }
    }, [privateKey, derivePublicKey, validatePrivateKey]);

    const handleGenerateKeyPair = () => {
        try {
            const { privateKey: pk, publicKey: pubKey } = generateKeyPair();
            setPrivateKey(pk);
            setPublicKey(pubKey);
        } catch (err) {
            // Error handling is done in the hook
        }
    };

    const handleSignPayload = async () => {
        setPayloadError(null);
        setVerificationResult(null);

        try {
            const parsed = JSON.parse(payloadInput);
            const result = await signPayload(parsed, privateKey);
            setGeneratedSignature(result.signature);

            // Auto-populate verification tab
            setVerifyPayloadInput(payloadInput);
            setVerifySignatureInput(result.signature);
            setVerifyPublicKeyInput(result.publicKey);
        } catch (err) {
            if (err instanceof SyntaxError) {
                setPayloadError('Invalid JSON format');
            } else {
                setPayloadError(err instanceof Error ? err.message : 'Failed to sign payload');
            }
        }
    };

    const handleVerifySignature = async () => {
        setPayloadError(null);

        try {
            const parsed = JSON.parse(verifyPayloadInput);
            const result = await verifySignature(parsed, verifySignatureInput, verifyPublicKeyInput);
            setVerificationResult(result);
        } catch (err) {
            if (err instanceof SyntaxError) {
                setPayloadError('Invalid JSON format in payload');
            }
        }
    };

    const loadExamplePayload = (index: number) => {
        const example = EXAMPLE_PAYLOADS[index];
        setPayloadInput(JSON.stringify(example.payload, null, 2));
        setPayloadError(null);
        setGeneratedSignature('');
        setVerificationResult(null);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const getStepIcon = (status: 'success' | 'error' | 'info') => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-[var(--success)]" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-[var(--danger)]" />;
            case 'info':
                return <Info className="w-5 h-5 text-[var(--primary)]" />;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">DID Signature Verification Debugger</h2>
                            <p className="text-[var(--muted)]">
                                Test ECDSA signature generation and verification for DID-based authentication
                            </p>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-300">
                                <p className="font-medium mb-1">Educational Tool</p>
                                <p className="text-blue-200/80">
                                    This debugger uses secp256k1 elliptic curve cryptography (same as Bitcoin/Ethereum)
                                    to demonstrate how DID-based signatures work. All operations happen locally in your browser.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-[var(--border)]">
                    <button
                        onClick={() => setActiveTab('generate')}
                        className={`px-6 py-3 font-medium transition-colors relative ${
                            activeTab === 'generate'
                                ? 'text-[var(--primary)]'
                                : 'text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                        aria-label="Generate signature tab"
                    >
                        <div className="flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            <span>Generate Signature</span>
                        </div>
                        {activeTab === 'generate' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('verify')}
                        className={`px-6 py-3 font-medium transition-colors relative ${
                            activeTab === 'verify'
                                ? 'text-[var(--primary)]'
                                : 'text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                        aria-label="Verify signature tab"
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Verify Signature</span>
                        </div>
                        {activeTab === 'verify' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                        )}
                    </button>
                </div>

                {/* Generate Tab */}
                {activeTab === 'generate' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Key Management */}
                        <div className="space-y-6">
                            {/* Key Generation */}
                            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-[var(--warning)]" />
                                        Key Pair
                                    </h3>
                                    <button
                                        onClick={handleGenerateKeyPair}
                                        className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                                        aria-label="Generate new key pair"
                                    >
                                        <RotateCw className="w-4 h-4" />
                                        <span>Generate New</span>
                                    </button>
                                </div>

                                {/* Private Key */}
                                <div className="space-y-2 mb-4">
                                    <label htmlFor="private-key" className="block text-sm font-medium">
                                        Private Key
                                        <span className="ml-2 text-xs text-[var(--danger)]">(Keep Secret)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="private-key"
                                            type={showPrivateKey ? 'text' : 'password'}
                                            value={privateKey}
                                            onChange={(e) => setPrivateKey(e.target.value)}
                                            placeholder="64-character hex string"
                                            className="w-full px-3 py-2 pr-20 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                            <button
                                                onClick={() => setShowPrivateKey(!showPrivateKey)}
                                                className="p-1 hover:bg-[var(--surface-2)] rounded"
                                                aria-label={showPrivateKey ? 'Hide private key' : 'Show private key'}
                                            >
                                                {showPrivateKey ? (
                                                    <EyeOff className="w-4 h-4 text-[var(--muted)]" />
                                                ) : (
                                                    <Eye className="w-4 h-4 text-[var(--muted)]" />
                                                )}
                                            </button>
                                            {privateKey && (
                                                <button
                                                    onClick={() => copyToClipboard(privateKey, 'privateKey')}
                                                    className="p-1 hover:bg-[var(--surface-2)] rounded"
                                                    aria-label="Copy private key"
                                                >
                                                    <Copy className="w-4 h-4 text-[var(--muted)]" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {privateKey && !validatePrivateKey(privateKey) && (
                                        <p className="text-xs text-[var(--danger)] flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Invalid private key format
                                        </p>
                                    )}
                                    {copied === 'privateKey' && (
                                        <p className="text-xs text-[var(--success)]">Copied to clipboard</p>
                                    )}
                                </div>

                                {/* Public Key */}
                                <div className="space-y-2">
                                    <label htmlFor="public-key" className="block text-sm font-medium">
                                        Public Key
                                        <span className="ml-2 text-xs text-[var(--muted)]">(Auto-derived)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="public-key"
                                            type="text"
                                            value={publicKey}
                                            readOnly
                                            placeholder="Generated from private key"
                                            className="w-full px-3 py-2 pr-10 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg font-mono text-sm cursor-not-allowed"
                                        />
                                        {publicKey && (
                                            <button
                                                onClick={() => copyToClipboard(publicKey, 'publicKey')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--surface)] rounded"
                                                aria-label="Copy public key"
                                            >
                                                <Copy className="w-4 h-4 text-[var(--muted)]" />
                                            </button>
                                        )}
                                    </div>
                                    {copied === 'publicKey' && (
                                        <p className="text-xs text-[var(--success)]">Copied to clipboard</p>
                                    )}
                                </div>
                            </div>

                            {/* Payload Editor */}
                            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <FileCode className="w-5 h-5 text-[var(--primary)]" />
                                        Payload to Sign
                                    </h3>
                                </div>

                                {/* Example Payloads */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Example Payloads</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {EXAMPLE_PAYLOADS.map((example, index) => (
                                            <button
                                                key={index}
                                                onClick={() => loadExamplePayload(index)}
                                                className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--background)] transition-colors text-left"
                                                aria-label={`Load ${example.name} example`}
                                            >
                                                {example.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* JSON Editor */}
                                <div className="space-y-2">
                                    <label htmlFor="payload-input" className="block text-sm font-medium">
                                        JSON Payload
                                    </label>
                                    <textarea
                                        id="payload-input"
                                        value={payloadInput}
                                        onChange={(e) => {
                                            setPayloadInput(e.target.value);
                                            setPayloadError(null);
                                        }}
                                        rows={12}
                                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                                        placeholder='{"key": "value"}'
                                    />
                                    {payloadError && (
                                        <p className="text-xs text-[var(--danger)] flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {payloadError}
                                        </p>
                                    )}
                                </div>

                                {/* Sign Button */}
                                <button
                                    onClick={handleSignPayload}
                                    disabled={!privateKey || !validatePrivateKey(privateKey) || !payloadInput || isGenerating}
                                    className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Sign payload"
                                >
                                    <Zap className="w-4 h-4" />
                                    <span>{isGenerating ? 'Signing...' : 'Sign Payload'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Right Column - Results */}
                        <div className="space-y-6">
                            {/* Signature Result */}
                            {generatedSignature && (
                                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                                        <h3 className="text-lg font-semibold">Generated Signature</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Signature (DER format)</label>
                                            <div className="relative">
                                                <div className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg">
                                                    <code className="text-xs font-mono block break-all">
                                                        {generatedSignature}
                                                    </code>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(generatedSignature, 'signature')}
                                                    className="absolute top-2 right-2 p-2 bg-[var(--surface)] hover:bg-[var(--background)] border border-[var(--border)] rounded-lg"
                                                    aria-label="Copy signature"
                                                >
                                                    <Copy className="w-4 h-4 text-[var(--muted)]" />
                                                </button>
                                            </div>
                                            {copied === 'signature' && (
                                                <p className="text-xs text-[var(--success)] mt-1">Copied to clipboard</p>
                                            )}
                                        </div>

                                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                                <div className="text-sm">
                                                    <p className="font-medium text-green-300 mb-1">Signature Created</p>
                                                    <p className="text-green-200/80">
                                                        Your payload has been cryptographically signed. Switch to the
                                                        "Verify Signature" tab to test verification (fields are pre-populated).
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setActiveTab('verify')}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)] transition-colors"
                                            aria-label="Switch to verify tab"
                                        >
                                            <Play className="w-4 h-4" />
                                            <span>Verify This Signature</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Info Cards */}
                            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-[var(--primary)]" />
                                    How It Works
                                </h3>
                                <div className="space-y-3 text-sm text-[var(--muted)]">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-[var(--primary)]">1</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--text)] mb-1">Generate Key Pair</p>
                                            <p>Create a new secp256k1 ECDSA key pair or provide your own private key</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-[var(--primary)]">2</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--text)] mb-1">Prepare Payload</p>
                                            <p>Enter or select a JSON payload representing the data to sign</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-[var(--primary)]">3</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--text)] mb-1">Sign</p>
                                            <p>The payload is canonicalized and signed with your private key</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-[var(--primary)]">4</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--text)] mb-1">Verify</p>
                                            <p>Anyone with the public key can verify the signature is authentic</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {hookError && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm">
                                            <p className="font-medium text-red-300 mb-1">Error</p>
                                            <p className="text-red-200/80">{hookError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Verify Tab */}
                {activeTab === 'verify' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Verification Inputs */}
                        <div className="space-y-6">
                            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-[var(--success)]" />
                                    Verification Inputs
                                </h3>

                                {/* Payload Input */}
                                <div className="space-y-2 mb-4">
                                    <label htmlFor="verify-payload" className="block text-sm font-medium">
                                        Payload (JSON)
                                    </label>
                                    <textarea
                                        id="verify-payload"
                                        value={verifyPayloadInput}
                                        onChange={(e) => setVerifyPayloadInput(e.target.value)}
                                        rows={8}
                                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                                        placeholder='{"key": "value"}'
                                    />
                                </div>

                                {/* Signature Input */}
                                <div className="space-y-2 mb-4">
                                    <label htmlFor="verify-signature" className="block text-sm font-medium">
                                        Signature
                                    </label>
                                    <input
                                        id="verify-signature"
                                        type="text"
                                        value={verifySignatureInput}
                                        onChange={(e) => setVerifySignatureInput(e.target.value)}
                                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        placeholder="DER-encoded signature hex"
                                    />
                                </div>

                                {/* Public Key Input */}
                                <div className="space-y-2 mb-4">
                                    <label htmlFor="verify-public-key" className="block text-sm font-medium">
                                        Public Key
                                    </label>
                                    <input
                                        id="verify-public-key"
                                        type="text"
                                        value={verifyPublicKeyInput}
                                        onChange={(e) => setVerifyPublicKeyInput(e.target.value)}
                                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        placeholder="Public key hex"
                                    />
                                </div>

                                {/* Verify Button */}
                                <button
                                    onClick={handleVerifySignature}
                                    disabled={!verifyPayloadInput || !verifySignatureInput || !verifyPublicKeyInput || isVerifying}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--success)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Verify signature"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{isVerifying ? 'Verifying...' : 'Verify Signature'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Right Column - Verification Results */}
                        <div className="space-y-6">
                            {verificationResult && (
                                <>
                                    {/* Result Summary */}
                                    <div className={`bg-[var(--surface)] border rounded-2xl p-6 ${
                                        verificationResult.isValid
                                            ? 'border-green-500/20'
                                            : 'border-red-500/20'
                                    }`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            {verificationResult.isValid ? (
                                                <>
                                                    <CheckCircle className="w-8 h-8 text-[var(--success)]" />
                                                    <div>
                                                        <h3 className="text-xl font-bold text-[var(--success)]">Signature Valid</h3>
                                                        <p className="text-sm text-[var(--muted)]">
                                                            Cryptographic verification passed
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-8 h-8 text-[var(--danger)]" />
                                                    <div>
                                                        <h3 className="text-xl font-bold text-[var(--danger)]">Signature Invalid</h3>
                                                        <p className="text-sm text-[var(--muted)]">
                                                            Verification failed
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {verificationResult.error && (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                                <p className="text-sm text-red-300">{verificationResult.error}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Verification Steps */}
                                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <Info className="w-5 h-5 text-[var(--primary)]" />
                                            Verification Steps
                                        </h3>

                                        <div className="space-y-4">
                                            {verificationResult.steps.map((step, index) => (
                                                <div key={index} className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {getStepIcon(step.status)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-mono text-[var(--muted)]">
                                                                Step {step.step}
                                                            </span>
                                                            <h4 className="font-medium">{step.title}</h4>
                                                        </div>
                                                        <p className="text-sm text-[var(--muted)] mb-1">
                                                            {step.description}
                                                        </p>
                                                        {step.details && (
                                                            <div className="mt-2 p-2 bg-[var(--surface-2)] rounded-lg">
                                                                <code className="text-xs font-mono text-[var(--muted)] block break-all">
                                                                    {step.details}
                                                                </code>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Instructions when no result */}
                            {!verificationResult && (
                                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Info className="w-5 h-5 text-[var(--primary)]" />
                                        Verification Process
                                    </h3>
                                    <div className="space-y-3 text-sm text-[var(--muted)]">
                                        <p>The verification process includes the following steps:</p>
                                        <ol className="list-decimal list-inside space-y-2 ml-2">
                                            <li>Validate input formats</li>
                                            <li>Parse public key from hex format</li>
                                            <li>Canonicalize payload to deterministic JSON</li>
                                            <li>Perform ECDSA signature verification</li>
                                            <li>Confirm cryptographic integrity</li>
                                        </ol>
                                        <p className="pt-2 border-t border-[var(--border)]">
                                            Fill in the verification inputs and click "Verify Signature" to see
                                            detailed step-by-step results.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
