# 🛡️ ShadowTrace
**Privacy-Preserving Identity Protocol built on the Midnight Network.**

![ShadowTrace Protocol](https://img.shields.io/badge/Network-Midnight_Testnet-success)
![UI](https://img.shields.io/badge/UI-Vercel_Aesthetic-black)
![Architecture](https://img.shields.io/badge/Architecture-Zero_Knowledge-blue)

ShadowTrace is a zero-knowledge identity protocol that eliminates the trade-off between privacy and usability. It allows users to prove credentials (Age, Financial Solvency, Citizenship) on-chain without ever exposing the underlying sensitive data.

## 🌟 Core Features
*   **Selective Disclosure:** Users choose exactly what to prove without revealing raw data.
*   **Dual-State Model:** Private state remains strictly local to the user's device, while only the 128-byte zk-SNARK proof is anchored to the Midnight public ledger.
*   **Compact Smart Contracts:** Built using Midnight's TypeScript-based Compact language for native privacy circuits.
*   **Zero-Trust Session Management:** Built-in wallet connection/disconnection logic ensuring session security.
*   **Dynamic Network Polling:** Live simulated connections to the Midnight P2P network to monitor Validator status and latency.

## 🛠️ Architecture

*   **Frontend:** Vanilla JS / CSS (No heavy frameworks, highly optimized).
*   **Smart Contract:** `contract/index.compact` (Contains the `prove_age_18` circuit).
*   **Web3 Client:** `src/web3-client.ts` (Handles Lace/Nightly wallet connection and Midnight Node Prover execution).

## 🚀 For Developers (Running Locally)

To run the full Web3 integration, you must have the Midnight SDKs installed.

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Compile the Compact Circuit:**
   Use the Midnight Compiler to turn `index.compact` into the required `ZKIR` files.

3. **Start the Bundler:**
   ```bash
   npm run dev
   ```

## 🤝 Project Handoff
Please refer to `ANKIT_HANDOFF.md` for specific instructions on wiring the compiled Compact circuits into the frontend UI logic. 

---
*Built for the Midnight Ecosystem Hackathon.*
