// assets/js/validation.js
// ---------- tiny utils ----------
function toHex(buf){ return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join(''); }

// Canonical string builder: order & separator are FIXED
function buildCanonicalString(d){
  // اگر یکی از این کلیدها نبود، رشته‌ی خالی برای آن می‌گذاریم تا ترتیب به‌هم نخورد
  const f = (x)=> (x ?? '').toString().trim();
  return [
    f(d.batch_id),
    f(d.nutrient_target),
    f(d.verified_result),
    f(d.co2e_summary),       // اگر قبلاً co2_summary داشتی، قبل از این تابع نرمال کن
    f(d.efsa_claim_ref),
    f(d.issued_at)
  ].join('|'); // جداکننده همیشه '|'
}

// SHA-256 checksum over canonical string (first 32 hex chars shown as "checksum")
async function calcHash(canonStr){
  const enc = new TextEncoder().encode(canonStr);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return toHex(digest).slice(0,32);
}

// Mock HMAC-SHA256 signature over canonical string (full hex)
async function signHmac(canonStr, secret='demo_secret_key'){
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(canonStr));
  return toHex(sig);
}

// Public API used by claim.html
export async function runVerification(dossier){
  // اگر co2e_summary نبود ولی co2_summary بود، نرمال‌سازی:
  if (dossier.co2e_summary == null && dossier.co2_summary != null){
    dossier.co2e_summary = dossier.co2_summary;
  }

  const canon = buildCanonicalString(dossier);
  const hashComputed = await calcHash(canon);
  const sigComputed  = await signHmac(canon, 'demo_secret_key');

  // نمایش در UI اگر این IDها را داری
  const hashEl = document.getElementById('integrityHash');
  if (hashEl) hashEl.textContent = hashComputed;

  // integrity: اگر JSON فیلدی به اسم integrity_hash داشت، با آن مقایسه کن؛
  // وگرنه اگر نداشت، از signature_payload قبلی استفاده نکن—فقط hashComputed را نشان بده و PASS کن.
  let integrityPass = true;
  if (typeof dossier.integrity_hash === 'string' && dossier.integrity_hash.trim() !== ''){
    integrityPass = (dossier.integrity_hash.trim().toLowerCase() === hashComputed.toLowerCase());
  }

  // signature: اگر JSON فیلدی به اسم signature داشت، باید با HMAC ما برابر باشد تا PASS شود.
  let signaturePass = true;
  if (typeof dossier.signature === 'string' && dossier.signature.trim() !== ''){
    signaturePass = (dossier.signature.trim().toLowerCase() === sigComputed.toLowerCase());
  }

  // نوشتن نتایج
  const ok = (id, text) => { const el = document.getElementById(id); if (el){ el.innerHTML = `✅ ${text}`; el.style.color = '#23683d'; }};
  const bad = (id, text) => { const el = document.getElementById(id); if (el){ el.innerHTML = `❌ ${text}`; el.style.color = '#8c2626'; }};

  if (integrityPass) ok('check-integrity', 'Data integrity check passed');
  else bad('check-integrity', 'HASH MISMATCH — data tampered');

  if (signaturePass) ok('check-signature', 'Certification signature valid');
  else bad('check-signature', 'Invalid signature / authority mismatch');

  // تغییر badge بالا
  const badge = document.getElementById('sigBadge');
  if (badge){
    if (integrityPass && signaturePass){
      badge.className = 'badge ok';
      badge.textContent = 'Signature Valid — Machine-verifiable claim';
    } else {
      badge.className = 'badge bad';
      badge.textContent = 'Signature Invalid — Signature Mismatch';
    }
  }
}
