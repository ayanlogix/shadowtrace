# 🛡️ ShadowTrace: Devpost Submission Playbook

Copy and paste these professional, judge-optimized answers directly into your Devpost submission form!

---

### 🎁 Sponsor / Special Prizes
*   **Select:** `DeFi Track` (and/or `Best Beginner Hack` if applicable).

### 💬 Discord Usernames
```text
~暗•│A y a n (ayanlogix)
Ankitzz (Ankitzz)
```

---

### 📝 Q1: Tell us more about your experience working with Midnight during the hackathon (e.g. how you used it, things that worked really well, issues you had, etc.).
```text
Building on Midnight has been an incredibly eye-opening developer experience. We used the Compact smart contract language to build local Zero-Knowledge circuits for age verification and solvency proofs, and integrated it directly with the 1AM Wallet connector in the frontend. What worked exceptionally well was Compact's TypeScript-like syntax—it completely bypassed the steep learning curve of writing raw ZK circuits in Rust or Circom. The local node prover runtime was extremely responsive. The only minor hurdle we faced was setting up the browser WASM bundlers for the Midnight.js client-side libraries, but switching our pipeline to a Vite/Next.js setup allowed us to manage the dynamic imports perfectly.
```

---

### 📝 Q2: What was the most interesting thing you learned at the Midnight Hackathon?
```text
The most interesting paradigm shift we learned was Midnight’s unique separated state model—specifically, keeping private state strictly local to the user’s client enclave while anchoring only the 128-byte cryptographic proof hash to the public ledger. Seeing a real Zero-Knowledge proof compiled in the browser, verified locally, and successfully settled on the preprod node without exposing the user's raw date of birth was an absolute 'aha!' moment. It completely solves the privacy vs. auditability trade-off.
```

---

### 📝 Q3: Do you have any feedback or ideas for improving Midnight?
```text
We would love to see more off-the-shelf boilerplate templates for modern frontends (e.g., standard Next.js, React, and Svelte templates) pre-configured with the WASM loaders and the DApp connector API bindings. Having unified UI wrapper components for the wallet connection lifecycle (Lace, Nightly, 1AM) would dramatically accelerate frontend prototyping for developers jumping into the ecosystem.
```
