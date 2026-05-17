# ShadowTrace

**Privacy-preserving identity protocol built on the Midnight Network.**

ShadowTrace is a zero-knowledge identity interface for proving credentials such as age, financial solvency, or citizenship without exposing the underlying sensitive data.

## Core Features

- **Selective Disclosure:** Users choose exactly what to prove without revealing raw data.
- **Dual-State Model:** Private state remains local to the user's device while only the proof is anchored to the ledger.
- **Compact Smart Contracts:** Built around Midnight Compact circuits.
- **Zero-Trust Session Management:** Wallet connection, disconnection, and restored sessions.
- **Dynamic Network Polling:** Simulated Midnight network status, validator count, and latency.

## Architecture

- **Frontend:** Next.js App Router with a client-side React dashboard in `app/page.tsx`.
- **Styling:** Global CSS in `app/globals.css`.
- **Assets:** Static assets in `public/`.
- **Smart Contract:** `contract/index.compact`.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

---

Built for the Midnight ecosystem hackathon.
