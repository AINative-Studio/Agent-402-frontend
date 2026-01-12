# DID Signature Verification Debugger - Usage Guide

## Quick Start

### Accessing the Debugger
1. Navigate to the Agent-402 frontend application
2. Click "Signature Debugger" in the sidebar (Shield icon)
3. Or visit `/signature-debugger` directly

## Generating a Signature

### Step 1: Generate or Input Key Pair
1. Click "Generate New" to create a random key pair, OR
2. Paste your own 64-character hex private key
3. The public key will be automatically derived and displayed

### Step 2: Prepare Your Payload
1. Select an example payload from the buttons, OR
2. Enter your own JSON payload in the editor
3. Ensure the JSON is valid (errors will be shown in red)

### Step 3: Sign the Payload
1. Click the "Sign Payload" button
2. The signature will appear in the results panel
3. Copy the signature using the copy button if needed

## Verifying a Signature

### Step 1: Switch to Verify Tab
1. Click the "Verify Signature" tab at the top
2. If you just generated a signature, fields will be pre-populated

### Step 2: Input Verification Data
1. **Payload**: The original JSON payload that was signed
2. **Signature**: The DER-encoded signature hex string
3. **Public Key**: The public key corresponding to the private key used for signing

### Step 3: Run Verification
1. Click "Verify Signature" button
2. View the step-by-step verification process
3. See the final result (Valid or Invalid)

## Understanding Verification Steps

The debugger shows 5 verification steps:

1. **Input Validation**: Checks all required fields are present
2. **Public Key Parsing**: Converts hex public key to ECDSA format
3. **Payload Canonicalization**: Creates deterministic JSON representation
4. **ECDSA Signature Verification**: Performs cryptographic verification
5. **Final Validation**: Confirms overall integrity

Each step shows:
- ✅ Green checkmark for success
- ❌ Red X for failure
- ℹ️ Blue info icon for in-progress
- Technical details in expandable sections

## Testing Scenarios

### Test Case 1: Valid Signature
1. Generate a key pair
2. Sign a payload
3. Verify the signature
4. **Expected**: All steps pass, "Signature Valid" result

### Test Case 2: Tampered Payload
1. Generate and sign a payload
2. In Verify tab, modify the payload slightly
3. Verify the signature
4. **Expected**: Verification fails, "Signature Invalid" result

### Test Case 3: Wrong Public Key
1. Generate and sign a payload
2. Generate a different key pair
3. Use the new public key to verify the old signature
4. **Expected**: Verification fails

### Test Case 4: Invalid Format
1. Try to sign with an invalid private key (wrong length)
2. **Expected**: Error message about invalid key format

## Security Best Practices

### DO
- ✅ Use this tool for testing and education
- ✅ Generate new keys for each test
- ✅ Verify signatures before trusting them
- ✅ Understand each verification step

### DON'T
- ❌ Use production private keys in this debugger
- ❌ Share your private keys
- ❌ Store private keys in browser localStorage
- ❌ Trust signatures without verification

## Common Issues

### Issue: "Invalid private key format"
**Solution**: Ensure your private key is exactly 64 hexadecimal characters

### Issue: "Invalid JSON format"
**Solution**: Check your payload for syntax errors (missing quotes, commas, etc.)

### Issue: Signature doesn't verify
**Possible causes**:
- Payload was modified after signing
- Wrong public key used for verification
- Signature was corrupted during copy/paste

## Example Workflow

### Scenario: Agent Authorization
```
1. Click "Agent Authorization" example payload
2. Click "Generate New" for a fresh key pair
3. Click "Sign Payload"
4. Switch to "Verify Signature" tab
5. Click "Verify Signature"
6. Observe all 5 verification steps pass
```

### Scenario: Testing Payload Tampering
```
1. Generate and sign any payload
2. Go to Verify tab (fields auto-populated)
3. Change a value in the payload JSON
4. Click "Verify Signature"
5. Observe verification fails at step 4
```

## Advanced Features

### Copy Functionality
- Click copy icon next to any key or signature
- Confirmation message appears
- Data is copied to clipboard

### Private Key Visibility
- Click eye icon to show/hide private key
- Default is hidden for security
- Remember: never share private keys!

### Auto-Population
- After signing, verification fields auto-fill
- Saves time for testing workflows
- Can be manually edited if needed

## Tips and Tricks

1. **Quick Testing**: Use example payloads for rapid testing
2. **Copy Keys**: Save generated keys for later use
3. **Compare Results**: Generate multiple signatures to compare
4. **Educational Tool**: Great for learning ECDSA concepts
5. **Debugging**: Use step details to understand failures

## Technical Notes

### Signature Format
- Uses DER (Distinguished Encoding Rules) format
- Hex-encoded for display
- Compatible with standard ECDSA implementations

### Key Format
- Private key: 64-character hex (32 bytes)
- Public key: 130-character hex (65 bytes uncompressed)
- Curve: secp256k1 (Bitcoin/Ethereum standard)

### Payload Handling
- JSON is canonicalized (keys sorted alphabetically)
- Ensures consistent signatures for same data
- Whitespace and key order don't affect signature

## Troubleshooting

### Verification Always Fails
1. Ensure payload exactly matches signed data
2. Check public key corresponds to private key used
3. Verify signature wasn't truncated during copy

### Can't Generate Keys
1. Check browser console for errors
2. Ensure JavaScript is enabled
3. Try refreshing the page

### Performance Issues
1. Large payloads may take longer to process
2. Complex JSON structures are supported
3. Consider browser performance for very large data

## Integration with Agent-402

This debugger helps you:
- Understand X402 request signing
- Test signature verification logic
- Debug agent authentication issues
- Learn DID-based cryptographic patterns

## Further Reading

- [ECDSA on Wikipedia](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm)
- [secp256k1 Curve](https://en.bitcoin.it/wiki/Secp256k1)
- [DID Specification](https://www.w3.org/TR/did-core/)
- [X402 Protocol Documentation](../docs/X402.md)

---

**Need Help?**  
If you encounter issues or have questions:
1. Check the browser console for errors
2. Review this usage guide
3. Refer to the implementation documentation
4. Contact the development team

**Version**: 1.0  
**Last Updated**: 2024-01-11
