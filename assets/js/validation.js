// Simple helpers
function toHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Mock SHA-256 over key fields (order-fixed)
async function calcHash(dossier) {
  const payload = `${dossier.batch_id}|${dossier.verified_result}|${dossier.co2e_summary}`;
  const enc = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  // shorten to 32 hex to look like a "checksum"
  return toHex(digest).slice(0, 32);
}

// Mock HMAC signature verification
async function verifySignature(dossier) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode('demo_secret_key'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const message = `${dossier.batch_id}|${dossier.verified_result}|${dossier.issued_at}`;
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const expected = toHex(sigBuf);
  return expected === dossier.signature;
}

// Run both checks; return {integrityOk, signatureOk}
async function runVerification(dossier) {
  const hashOk = (await calcHash(dossier)) === (dossier.data_hash || '');
  const sigOk = await verifySignature(dossier);
  return { integrityOk: hashOk, signatureOk: sigOk && hashOk };
}
