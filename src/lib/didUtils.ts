/**
 * DID validation and generation utilities
 */

const DID_ETHR_PATTERN = /^did:ethr:0x[a-fA-F0-9]{40}$/;

/**
 * Validates a DID string against the did:ethr: format
 * @param did - The DID string to validate
 * @returns True if valid, false otherwise
 */
export function validateDID(did: string): boolean {
  if (!did || typeof did !== 'string') {
    return false;
  }
  return DID_ETHR_PATTERN.test(did.trim());
}

/**
 * Generates a random Ethereum address for DID creation
 * @returns A valid did:ethr: identifier
 */
export function generateDID(): string {
  const hexChars = '0123456789abcdef';
  let address = '0x';

  for (let i = 0; i < 40; i++) {
    address += hexChars[Math.floor(Math.random() * 16)];
  }

  return `did:ethr:${address}`;
}

/**
 * Formats a DID for display (shortens the middle)
 * @param did - The DID to format
 * @param prefixLength - Number of characters to show at start (default: 15)
 * @param suffixLength - Number of characters to show at end (default: 8)
 * @returns Formatted DID string
 */
export function formatDID(did: string, prefixLength = 15, suffixLength = 8): string {
  if (!did || did.length <= prefixLength + suffixLength) {
    return did;
  }

  const prefix = did.substring(0, prefixLength);
  const suffix = did.substring(did.length - suffixLength);

  return `${prefix}...${suffix}`;
}

/**
 * Extracts the Ethereum address from a DID
 * @param did - The DID string
 * @returns The Ethereum address or null if invalid
 */
export function extractAddressFromDID(did: string): string | null {
  if (!validateDID(did)) {
    return null;
  }

  return did.replace('did:ethr:', '');
}

/**
 * Validates DID format and provides detailed error message
 * @param did - The DID to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateDIDWithError(did: string): { isValid: boolean; error?: string } {
  if (!did || typeof did !== 'string') {
    return { isValid: false, error: 'DID is required' };
  }

  const trimmedDID = did.trim();

  if (trimmedDID.length === 0) {
    return { isValid: false, error: 'DID cannot be empty' };
  }

  if (!trimmedDID.startsWith('did:ethr:')) {
    return { isValid: false, error: 'DID must start with "did:ethr:"' };
  }

  if (!trimmedDID.startsWith('did:ethr:0x')) {
    return { isValid: false, error: 'DID must contain Ethereum address starting with "0x"' };
  }

  const address = trimmedDID.replace('did:ethr:', '');

  if (address.length !== 42) {
    return { isValid: false, error: 'Ethereum address must be 42 characters (0x + 40 hex chars)' };
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { isValid: false, error: 'Invalid Ethereum address format (must be hex characters)' };
  }

  return { isValid: true };
}
