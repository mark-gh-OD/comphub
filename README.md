# Comp Hub – React Mock UI Demo (No Install)

This demo is intentionally built **without a Node/npm build step** so you can use it on locked-down laptops.
It loads React + Babel from CDNs and calls your **Postman Mock Server** (Path B).

## 1) Prerequisites
- A Postman Mock Server URL (e.g., `https://xxxx.mock.pstmn.io`)
- The mock server should expose endpoints like:
  - `GET /producers`
  - `GET /producers/{producerId}`
  - `GET /producers/{producerId}/vcp-documents`
  - `GET /rules?producerId=...`
  - `GET /rules/{ruleId}/usage`

## 2) Run / Share
### A) Shareable demo via GitHub Pages (recommended)
1. Create a GitHub repo and upload these files at the repo root.
2. Enable GitHub Pages for the repo (Settings → Pages → Source: main / root).
3. Share the generated URL.

### B) Shareable demo via CodeSandbox (no install)
- Import the repo into CodeSandbox using their repository import flow.

## 3) Use the UI
1. Paste your Postman Mock base URL into the top input.
2. Pick an **as-of date** to simulate effective/deposit month behavior.
3. Select a producer.
4. Click a Rule ID to drill down to usage rows.

## Notes
- In-browser Babel is meant for prototypes (not production).
- For production, migrate this UI to a bundler (Vite/CRA) and replace mocked calls with real APIs.
