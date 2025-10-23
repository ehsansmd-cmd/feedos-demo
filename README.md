# FeedOS™ Demo MVP (Static)

This is a **static demo** for Business Finland submission, showing:
- Telemetry dashboard (mock data) → `index.html`
- QR-verifiable Outcome Dossier (FCS™ JSON) → `dossier/claim_clm_demo_001.json`
- Verification page (QR + JSON link) → `claim.html?token=clm_demo_001`

## Deploy on Vercel or Netlify
1. Download the `/feedos_demo` folder.
2. Create a new project on Vercel/Netlify using this folder as the root.
3. Ensure `index.html` is the entry point. No build step required.
4. Test:
   - `https://<your-domain>/` (dashboard)
   - `https://<your-domain>/claim.html?token=clm_demo_001` (verification)
   - `https://<your-domain>/dossier/claim_clm_demo_001.json` (JSON API)

## Files
- `index.html` — dashboard & navigation
- `claim.html` — verification page + QR
- `data/mock_telemetry.json` — mock telemetry (24 hours, 10-min interval)
- `dossier/claim_clm_demo_001.json` — simulated FCS™ dossier
- `assets/` — placeholder for future assets
- `README.md`

> Note: This is a non-production demo (no real sensors, no backend). It is aligned with the MVP SOW modules 3.4–3.6 and the Business Plan sections 4.1–4.4.
