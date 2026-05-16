# 🧑‍💻 Developer Guide: ShadowTrace Integration

Welcome to the team! This guide outlines the current state of ShadowTrace and the roadmap for the **Midnight SDK** integration.

## 🏁 Current State
- **UI/UX:** 100% Complete. The dashboard handles tab switching and terminal simulations.
- **ZK Circuit:** Initial draft ready in `contract/index.compact`.
- **Logic:** Verification flow is simulated in `script.js`.

## 🛠️ Your Mission (Backend / ZK)
We need to replace the simulated ZK-generation in `script.js` with real calls to the Midnight network.

### 1. Compile the Circuit
Use the Compact compiler to generate the TypeScript bindings for our age check:
```bash
compactc contract/index.compact
```

### 2. Midnight JS SDK Integration
We need to implement the following in a new `integration.ts` or directly in `script.js`:
- **Wallet Connection:** Connect to the Midnight wallet (Lace/extension).
- **Proof Generation:** Call the `prove_age_18` function with user-provided birth year.
- **Ledger Anchoring:** Submit the proof to the Midnight network.

### 3. Proof Server Setup
Configure the connection to the Midnight Proof Server (localhost:6300) to handle the witness data calculation.

## 📦 Getting Started
1. Clone the repo.
2. Run a local server (e.g., `python -m http.server 8000`).
3. Check the `script.js` file for the `// Verification Logic` section—this is where the SDK calls should live.

---
Let's build the future of privacy! 🚀🛡️
