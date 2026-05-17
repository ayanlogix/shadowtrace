# ShadowTrace

**Privacy-preserving identity protocol built on the Midnight Network.**

ShadowTrace is a zero-knowledge identity interface for proving age eligibility without exposing the user's date of birth.

## Core Features

- **Age Eligibility Proof:** Proves `age >= 18` from a local DOB witness.
- **DOB Privacy:** The date of birth is held in private state, used for proof generation, then discarded locally.
- **Compact Smart Contract:** `contract/src/age-verify.compact` asserts the age rule and stores only proof metadata.
- **1AM Wallet Flow:** Connects to `window.midnight['1am']` on preprod and uses the wallet-sponsored proof/balance/submit path.
- **Midnight SDK Integration:** Uses generated Compact assets from `contract/src/managed/age-verify` and serves ZK keys from `public/zk/age-verify`.

## Architecture

- **Frontend:** Next.js App Router with a client-side React dashboard in `app/page.tsx`.
- **Styling:** Global CSS in `app/globals.css`.
- **Assets:** Static assets in `public/`.
- **Smart Contract:** `contract/src/age-verify.compact`.
- **Generated Contract:** `contract/src/managed/age-verify`.
- **ZK Assets:** `public/zk/age-verify`.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Compile the Compact contract and sync ZK assets:

```bash
npm run build:contract
```

On Windows, `compact` may resolve to the built-in NTFS compression tool. Install the Midnight Compact compiler, then run with `COMPACT_BIN` pointing to the real executable if needed:

```bash
$env:COMPACT_BIN="C:\path\to\midnight\compact.exe"
npm run build:contract
```

Create a production build:

```bash
npm run build
```

---

Built for the Midnight ecosystem hackathon.
