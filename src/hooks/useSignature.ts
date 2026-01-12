import { useState, useCallback } from 'react';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

export interface SignatureResult {
    signature: string;
    publicKey: string;
    payload: string;
}

export interface VerificationResult {
    isValid: boolean;
    steps: VerificationStep[];
    error?: string;
}

export interface VerificationStep {
    step: number;
    title: string;
    description: string;
    status: 'success' | 'error' | 'info';
    details?: string;
}

/**
 * Custom hook for DID-based ECDSA signature generation and verification
 * Uses secp256k1 elliptic curve (same as Bitcoin/Ethereum)
 */
export function useSignature() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Generate a new ECDSA key pair
     */
    const generateKeyPair = useCallback(() => {
        try {
            const keyPair = ec.genKeyPair();
            const privateKey = keyPair.getPrivate('hex');
            const publicKey = keyPair.getPublic('hex');

            return {
                privateKey,
                publicKey,
                did: `did:key:${publicKey.substring(0, 32)}...`
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate key pair';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, []);

    /**
     * Sign a payload with a private key
     */
    const signPayload = useCallback(async (
        payload: Record<string, unknown>,
        privateKey: string
    ): Promise<SignatureResult> => {
        setIsGenerating(true);
        setError(null);

        try {
            // Validate private key format
            if (!privateKey || privateKey.length !== 64) {
                throw new Error('Invalid private key format. Expected 64-character hex string.');
            }

            // Create key pair from private key
            const keyPair = ec.keyFromPrivate(privateKey, 'hex');
            const publicKey = keyPair.getPublic('hex');

            // Canonicalize payload (deterministic JSON serialization)
            const payloadString = JSON.stringify(payload, Object.keys(payload).sort());

            // Create hash of payload
            const msgHash = Buffer.from(payloadString).toString('hex');

            // Sign the hash
            const signature = keyPair.sign(msgHash);
            const signatureHex = signature.toDER('hex');

            return {
                signature: signatureHex,
                publicKey,
                payload: payloadString
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to sign payload';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    }, []);

    /**
     * Verify a signature with step-by-step validation
     */
    const verifySignature = useCallback(async (
        payload: Record<string, unknown>,
        signature: string,
        publicKey: string
    ): Promise<VerificationResult> => {
        setIsVerifying(true);
        setError(null);

        const steps: VerificationStep[] = [];
        let currentStep = 1;

        try {
            // Step 1: Validate inputs
            steps.push({
                step: currentStep++,
                title: 'Input Validation',
                description: 'Validating signature and public key format',
                status: 'info'
            });

            if (!signature || !publicKey || !payload) {
                throw new Error('Missing required parameters');
            }

            steps[steps.length - 1].status = 'success';
            steps[steps.length - 1].details = 'All inputs present and valid';

            // Step 2: Parse public key
            steps.push({
                step: currentStep++,
                title: 'Public Key Parsing',
                description: 'Parsing public key from hex format',
                status: 'info'
            });

            let keyPair;
            try {
                keyPair = ec.keyFromPublic(publicKey, 'hex');
                steps[steps.length - 1].status = 'success';
                steps[steps.length - 1].details = `Public key parsed successfully (${publicKey.substring(0, 16)}...)`;
            } catch (err) {
                steps[steps.length - 1].status = 'error';
                steps[steps.length - 1].details = err instanceof Error ? err.message : 'Invalid public key format';
                throw new Error('Invalid public key format');
            }

            // Step 3: Canonicalize payload
            steps.push({
                step: currentStep++,
                title: 'Payload Canonicalization',
                description: 'Creating deterministic JSON representation',
                status: 'info'
            });

            const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
            const msgHash = Buffer.from(payloadString).toString('hex');

            steps[steps.length - 1].status = 'success';
            steps[steps.length - 1].details = `Payload hash: ${msgHash.substring(0, 32)}...`;

            // Step 4: Verify signature
            steps.push({
                step: currentStep++,
                title: 'ECDSA Signature Verification',
                description: 'Verifying signature against payload hash',
                status: 'info'
            });

            let isValid = false;
            try {
                isValid = keyPair.verify(msgHash, signature);

                if (isValid) {
                    steps[steps.length - 1].status = 'success';
                    steps[steps.length - 1].details = 'Signature verification succeeded';
                } else {
                    steps[steps.length - 1].status = 'error';
                    steps[steps.length - 1].details = 'Signature does not match payload';
                }
            } catch (err) {
                steps[steps.length - 1].status = 'error';
                steps[steps.length - 1].details = err instanceof Error ? err.message : 'Signature verification failed';
                isValid = false;
            }

            // Step 5: Final validation
            steps.push({
                step: currentStep++,
                title: 'Final Validation',
                description: 'Confirming cryptographic integrity',
                status: isValid ? 'success' : 'error',
                details: isValid
                    ? 'Signature is cryptographically valid and matches the payload'
                    : 'Signature validation failed - payload may have been tampered with'
            });

            return {
                isValid,
                steps
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Verification failed';
            setError(errorMessage);

            return {
                isValid: false,
                steps,
                error: errorMessage
            };
        } finally {
            setIsVerifying(false);
        }
    }, []);

    /**
     * Derive public key from private key
     */
    const derivePublicKey = useCallback((privateKey: string): string => {
        try {
            const keyPair = ec.keyFromPrivate(privateKey, 'hex');
            return keyPair.getPublic('hex');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to derive public key';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, []);

    /**
     * Validate private key format
     */
    const validatePrivateKey = useCallback((privateKey: string): boolean => {
        try {
            if (!privateKey || privateKey.length !== 64) {
                return false;
            }
            // Try to create a key pair to validate
            ec.keyFromPrivate(privateKey, 'hex');
            return true;
        } catch {
            return false;
        }
    }, []);

    return {
        generateKeyPair,
        signPayload,
        verifySignature,
        derivePublicKey,
        validatePrivateKey,
        isGenerating,
        isVerifying,
        error
    };
}
