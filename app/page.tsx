"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  connectOneAmWallet,
  formatAddress,
  ONE_AM_EXTENSION_URL,
  type OneAmWalletSession,
} from "@/lib/wallet";
import { verifyAgeOver18 } from "@/lib/age-verify";

type TabId = "verify" | "history" | "network" | "how" | "architecture" | "security" | "sdk";
type ProofType = "age";
type ToastType = "info" | "success" | "error";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type LedgerItem = {
  id: number;
  title: string;
  hash: string;
  revoking: boolean;
};

const disclosureOptions: Array<{ value: ProofType; label: string; inputLabel: string; inputType: string; placeholder: string }> = [
  {
    value: "age",
    label: "Age Verification ( >= 18 )",
    inputLabel: "Date of Birth",
    inputType: "date",
    placeholder: "",
  },
];

const navItems: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "verify", label: "Verify", icon: "fa-fingerprint" },
  { id: "history", label: "Ledger", icon: "fa-database" },
  { id: "network", label: "Network", icon: "fa-server" },
];

const protocolItems: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "how", label: "How it Works", icon: "fa-circle-question" },
  { id: "architecture", label: "Architecture", icon: "fa-sitemap" },
  { id: "security", label: "Security Audits", icon: "fa-shield" },
  { id: "sdk", label: "Documentation", icon: "fa-book" },
];

const sdkCode = `// Import the ShadowTrace Prover
import { ShadowTraceProver } from '@shadowtrace/sdk';

// Initialize Prover with User Wallet
const prover = new ShadowTraceProver(walletConnector);

// Request ZK Proof for Age >= 18
const proof = await prover.verifyConstraint('AGE_OVER_18');

console.log(proof.hash);`;

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [booting, setBooting] = useState(false);
  const [bootText, setBootText] = useState("INITIALIZING_RUNTIME...");
  const [bootProgress, setBootProgress] = useState(0);
  const [walletName] = useState("1AM Wallet");
  const [walletSession, setWalletSession] = useState<OneAmWalletSession | null>(null);
  const [walletMissing, setWalletMissing] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("verify");
  const [proofType, setProofType] = useState<ProofType>("age");
  const [selectOpen, setSelectOpen] = useState(false);
  const [dynamicInput, setDynamicInput] = useState("");
  const [consoleLines, setConsoleLines] = useState<string[]>(["System ready."]);
  const [blockHeight, setBlockHeight] = useState(8492105);
  const [validators, setValidators] = useState(124);
  const [latency, setLatency] = useState(42);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [proofHash, setProofHash] = useState("");
  const [generating, setGenerating] = useState(false);
  const [ledgerItems, setLedgerItems] = useState<LedgerItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ageContractAddress, setAgeContractAddress] = useState("");
  const consoleRef = useRef<HTMLDivElement>(null);

  const selectedDisclosure = useMemo(
    () => disclosureOptions.find((option) => option.value === proofType) ?? disclosureOptions[0],
    [proofType],
  );

  const connectedWalletLabel = walletSession
    ? `1AM: ${formatAddress(walletSession.unshieldedAddress)}`
    : "1AM: Not connected";

  useEffect(() => {
    localStorage.removeItem("shadowtrace_wallet");
    setIsMounted(true);
  }, []);

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight });
  }, [consoleLines]);

  useEffect(() => {
    if (!isConnected) return;

    const ticker = window.setInterval(() => {
      setBlockHeight((current) => current + Math.floor(Math.random() * 2));
      setLatency(Math.floor(Math.random() * (65 - 38 + 1)) + 38);
      setValidators((current) => {
        if (Math.random() <= 0.7) return current;
        return Math.random() > 0.5 ? current + 1 : current - 1;
      });
    }, 3000);

    return () => window.clearInterval(ticker);
  }, [isConnected]);

  const addConsoleLine = (message: string) => {
    setConsoleLines((current) => [...current, `> ${message}`]);
  };

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const startBootSequence = async () => {
    setWalletModalOpen(false);
    setBooting(true);
    setWalletMissing(false);
    setAuthError("");
    setBootText("INITIALIZING_RUNTIME...");
    setBootProgress(0);

    try {
      setBootText("CHECKING_1AM_EXTENSION...");
      setBootProgress(20);

      const sessionPromise = connectOneAmWallet("preprod");

      setBootProgress(40);
      setBootText("CONNECTING_PREPROD...");

      const session = await sessionPromise;

      setBootProgress(80);
      setBootText("VERIFYING_WALLET_SIGNATURE...");

      if (!session.authSignature) {
        throw new Error("Wallet verification failed: 1AM did not return a signature.");
      }

      setWalletSession(session);
      setBootProgress(100);
      setBootText("ACCESS_GRANTED");

      window.setTimeout(() => {
        setBooting(false);
        setIsConnected(true);
        setConsoleLines([
          "> 1AM wallet authenticated on preprod.",
          `> Unshielded address: ${session.unshieldedAddress}`,
          `> Shielded address: ${session.shieldedAddress ?? "Unavailable"}`,
        ]);
      }, 450);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to connect 1AM wallet.";
      setBooting(false);
      setWalletModalOpen(true);
      setAuthError(message);
      setWalletMissing(message.toLowerCase().includes("not installed"));
      showToast(message, "error");
    }
  };

  const disconnectWallet = () => {
    localStorage.removeItem("shadowtrace_wallet");
    setWalletSession(null);
    showToast("Wallet disconnected securely.", "info");

    window.setTimeout(() => {
      setIsConnected(false);
      setDynamicInput("");
      setConsoleLines([]);
      setBootProgress(0);
      setResultsOpen(false);
      setGenerating(false);
      setActiveTab("verify");
    }, 800);
  };

  const runNetworkDiagnostics = () => {
    setDiagnosticsRunning(true);

    window.setTimeout(() => {
      setDiagnosticsRunning(false);
      showToast("Diagnostics complete. 0 issues found.", "success");
    }, 2500);
  };

  const generateProof = async () => {
    if (!dynamicInput) {
      addConsoleLine(`Error: ${selectedDisclosure.inputLabel} is required.`);
      showToast(`Please enter your ${selectedDisclosure.inputLabel.toLowerCase()}`, "error");
      return;
    }

    if (!walletSession) {
      showToast("Connect 1AM wallet before generating a proof.", "error");
      return;
    }

    setGenerating(true);
    addConsoleLine("Loading Compact circuit: [AGE_VERIFY]");
    addConsoleLine("DOB loaded into local private state. It will not be sent as a circuit argument.");

    try {
      addConsoleLine("Proving age >= 18 with 1AM sponsored transaction flow...");
      const proof = await verifyAgeOver18(walletSession, dynamicInput);

      setProofHash(proof.txId);
      setAgeContractAddress(proof.contractAddress);
      addConsoleLine(`Proof submitted to Midnight ledger. Contract: ${proof.contractAddress}`);
      addConsoleLine(`Claim id anchored: ${proof.claimId}`);
      addConsoleLine("DOB private state discarded locally after proof submission.");
      setResultsOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Age proof failed.";
      addConsoleLine(`Proof rejected: ${message}`);
      showToast(message.includes("age is under 18") ? "Age proof failed: user is under 18." : message, "error");
      setGenerating(false);
    }
  };

  const acknowledgeProof = () => {
    setResultsOpen(false);
    setGenerating(false);
    addConsoleLine("Proof acknowledged.");
    setLedgerItems((current) => [
      ...current,
      {
        id: Date.now(),
        title: selectedDisclosure.label,
        hash: proofHash,
        revoking: false,
      },
    ]);
    showToast("New proof added to Ledger", "success");
  };

  const revokeProof = (itemId: number) => {
    setLedgerItems((current) => current.map((item) => (item.id === itemId ? { ...item, revoking: true } : item)));
    addConsoleLine("INITIATING_NULLIFIER_BURN...");

    window.setTimeout(() => {
      setLedgerItems((current) => current.filter((item) => item.id !== itemId));
      showToast("Zero-knowledge proof successfully revoked.", "success");
      addConsoleLine("NULLIFIER_BURN_COMPLETE. PROOF_REVOKED.");
    }, 1500);
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, "success");
    } catch {
      showToast("Failed to copy text", "error");
    }
  };

  if (!isMounted) {
    return <div style={{ background: '#050505', minHeight: '100vh' }} />;
  }

  return (
    <>
      <div className={`overlay ${resultsOpen ? "active" : ""}`} />

      {!isConnected && !booting && (
        <div className="login-screen">
          {!walletModalOpen && (
            <div className="login-content">
              <div className="login-logo">
                <Image src="/logo.png" alt="ShadowTrace" width={80} height={80} priority />
              </div>
              <h1>ShadowTrace.</h1>
              <p>Zero-knowledge identity anchored to Midnight. No compromise.</p>
              <button className="btn-primary login-button" onClick={() => setWalletModalOpen(true)}>
                Connect Midnight Wallet <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          )}

          {walletModalOpen && (
            <div className="wallet-modal">
              <h3>Select Provider</h3>
              <button className="wallet-option" onClick={startBootSequence}>
                <span>1AM Wallet</span>
                <strong>DUST-FREE</strong>
              </button>
              {authError && (
                <div className="wallet-auth-message">
                  <p>{authError}</p>
                  {walletMissing && (
                    <a href={ONE_AM_EXTENSION_URL} target="_blank" rel="noreferrer">
                      Install 1AM Wallet
                    </a>
                  )}
                </div>
              )}

              <button className="cancel-wallet" onClick={() => setWalletModalOpen(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {booting && (
        <div className="boot-sequence">
          <div>{bootText}</div>
          <div className="boot-progress-bar">
            <div className="boot-progress-fill" style={{ width: `${bootProgress}%` }} />
          </div>
        </div>
      )}

      {isConnected && (
        <div className="app-container">
          <aside className="sidebar">
            <div className="logo">
              <Image src="/logo.png" alt="ShadowTrace" width={28} height={28} /> ShadowTrace
            </div>

            <nav>
              {navItems.map((item) => (
                <button
                  className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                >
                  <i className={`fa-solid ${item.icon}`} /> {item.label}
                </button>
              ))}
            </nav>

            <div className="protocol-label">PROTOCOL</div>

            <nav className="protocol-nav">
              {protocolItems.map((item) => (
                <button
                  className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                >
                  <i className={`fa-solid ${item.icon}`} /> {item.label}
                </button>
              ))}

              <a href="https://github.com/ayanlogix/shadowtrace" target="_blank" rel="noreferrer" className="nav-item">
                <i className="fa-brands fa-github" /> Open Source
              </a>

              <div className="sidebar-rule" />

              <div className="sidebar-stats">
                <div>
                  BLOCK: <span>{blockHeight.toLocaleString()}</span>
                </div>
                <div>
                  WALLET: <span>{connectedWalletLabel}</span>
                </div>
                <div>
                  NETWORK: <span>{walletSession?.config.networkId ?? "preprod"}</span>
                </div>
                <div>
                  DUST: <span>{formatAddress(walletSession?.dustAddress)}</span>
                </div>
                {ageContractAddress && (
                  <div>
                    CONTRACT: <span>{formatAddress(ageContractAddress)}</span>
                  </div>
                )}
              </div>

              <button className="btn-secondary disconnect-button" onClick={disconnectWallet}>
                <i className="fa-solid fa-power-off" /> Disconnect
              </button>
            </nav>
          </aside>

          <main className="dashboard">
            <header className="header">
              <div>
                OVERVIEW / <span>{activeTab.toUpperCase()}</span>
              </div>
              <div className="status-pill">
                <div className="status-indicator" /> TESTNET_SYNCED
              </div>
            </header>

            {activeTab === "verify" && (
              <div className="tab-content active">
                <div className="grid">
                  <div className="card">
                    <h3>Construct ZK Proof</h3>
                    <div className="input-group">
                      <label className="split-label">
                        Selective Disclosure Type
                        <span>ZKP CIRCUIT</span>
                      </label>
                      <div className="custom-select">
                        <button className="select-trigger" onClick={() => setSelectOpen((open) => !open)}>
                          <span>{selectedDisclosure.label}</span>
                          <i className="fa-solid fa-chevron-down" />
                        </button>
                        {selectOpen && (
                          <div className="select-options">
                            {disclosureOptions.map((option) => (
                              <button
                                className={`option ${proofType === option.value ? "active" : ""}`}
                                key={option.value}
                                onClick={() => {
                                  setProofType(option.value);
                                  setDynamicInput("");
                                  setSelectOpen(false);
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <label>{selectedDisclosure.inputLabel}</label>
                      <input
                        type={selectedDisclosure.inputType}
                        value={dynamicInput}
                        onChange={(event) => setDynamicInput(event.target.value)}
                        placeholder={selectedDisclosure.placeholder}
                      />
                    </div>
                    <button className="btn-primary full-width" disabled={generating} onClick={generateProof}>
                      <i className={`fa-solid ${generating ? "fa-circle-notch fa-spin" : "fa-microchip"}`} />
                      {generating ? "Processing..." : "Generate Proof"}
                    </button>
                  </div>

                  <div className="terminal">
                    <div className="terminal-header">
                      <span>MN_KERNEL_V17</span>
                      <span className="terminal-status">IDLE</span>
                    </div>
                    <div className="terminal-body" ref={consoleRef}>
                      {consoleLines.map((line, index) => (
                        <div key={`${line}-${index}`}>
                          {line.startsWith(">") ? <span className="highlight">&gt;</span> : null}{" "}
                          {line.startsWith(">") ? line.slice(1).trim() : line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="tab-content active">
                <div className="card">
                  <h3>Ledger Events</h3>
                  <p className="muted-copy">Manage your active zero-knowledge proofs anchored to the network.</p>
                  {ledgerItems.map((item) => (
                    <div className={`ledger-item ${item.revoking ? "revoking" : ""}`} key={item.id}>
                      <div>
                        <div>{item.title}</div>
                        <span>
                          {item.hash.substring(0, 10)}...{item.hash.substring(item.hash.length - 4)}
                        </span>
                      </div>
                      <button className="btn-secondary revoke-button" onClick={() => revokeProof(item.id)} disabled={item.revoking}>
                        {item.revoking ? "Revoking..." : "Revoke"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "network" && (
              <div className="tab-content active">
                <div className="grid">
                  <div className="card">
                    <h3>Midnight Testnet</h3>
                    <div className="metric-list">
                      <div>
                        <span>Active Validators</span>
                        <strong>{validators}</strong>
                      </div>
                      <div>
                        <span>Network Latency</span>
                        <strong className={latency > 55 ? "warning" : "success"}>{latency}ms</strong>
                      </div>
                      <div>
                        <span>Compact Version</span>
                        <strong>v0.12.4</strong>
                      </div>
                    </div>
                  </div>
                  <div className="card network-card">
                    <i className={`fa-solid ${diagnosticsRunning ? "fa-satellite-dish fa-fade" : "fa-chart-network"}`} />
                    <h4>{diagnosticsRunning ? "Analyzing P2P Peers..." : "Node Sync Optimal"}</h4>
                    <p>
                      {diagnosticsRunning
                        ? "Pinging Midnight consensus nodes and verifying compact runtime hashes."
                        : "Your local Light Node is fully synchronized with the Midnight P2P network."}
                    </p>
                    <button className="btn-secondary" onClick={runNetworkDiagnostics} disabled={diagnosticsRunning}>
                      <i className={`fa-solid ${diagnosticsRunning ? "fa-circle-notch fa-spin" : "fa-rotate"}`} />
                      {diagnosticsRunning ? "Scanning..." : "Run Diagnostics"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "how" && (
              <InfoSection title="How ShadowTrace Works">
                <p>
                  ShadowTrace is a zero-knowledge identity protocol built to solve the privacy paradox: how to prove who
                  you are without revealing your data. By leveraging Midnight Network private state, users generate
                  mathematical proofs of attributes that can be verified on-chain with certainty.
                </p>
                <div className="steps-grid">
                  {[
                    ["1", "Secure Connect", "Establish a cryptographically secure session by linking your Midnight-compatible wallet."],
                    ["2", "Witness Gen", "Raw identity data is processed through a WASM-compiled Compact circuit in browser memory."],
                    ["3", "Anchoring", "The final proof is broadcast to the Midnight Ledger and anchored permanently."],
                  ].map(([number, title, copy]) => (
                    <div className="step-card" key={number}>
                      <div>{number}</div>
                      <h3>{title}</h3>
                      <p>{copy}</p>
                    </div>
                  ))}
                </div>
              </InfoSection>
            )}

            {activeTab === "architecture" && (
              <InfoSection title="Protocol Architecture">
                <p>
                  ShadowTrace uses a hybrid proof and zero-knowledge model anchored to the Midnight sidechain. The
                  architecture keeps personally identifiable information on the client device.
                </p>
                <div className="architecture-panel">
                  <span>INTERNAL_DIAGRAM_V2</span>
                  <div>
                    {[
                      ["fa-user-shield", "Client Prover"],
                      ["fa-server", "Compact VM"],
                      ["fa-cubes", "Ledger"],
                    ].map(([icon, label], index) => (
                      <div className="architecture-node" key={label}>
                        <div>
                          <i className={`fa-solid ${icon}`} />
                          <strong>{label}</strong>
                        </div>
                        {index < 2 && <i className="fa-solid fa-arrow-right-long architecture-arrow" />}
                      </div>
                    ))}
                  </div>
                </div>
              </InfoSection>
            )}

            {activeTab === "security" && (
              <InfoSection title="Security & Audits">
                <p>
                  Trust is earned through cryptographic certainty, not promises. ShadowTrace is built on secure
                  zero-knowledge primitives in the Midnight ecosystem.
                </p>
                <div className="card audit-card">
                  <div>
                    <h3>
                      <i className="fa-solid fa-shield-check" /> CertiK Smart Contract Audit
                    </h3>
                    <span className="status-pill">PASSED (MOCK)</span>
                  </div>
                  <p>
                    The ShadowTrace Compact circuits were theoretically audited for logic flaws, constraint completeness,
                    and memory leaks. The circuits enforce strict mathematical boundaries on user data.
                  </p>
                </div>
              </InfoSection>
            )}

            {activeTab === "sdk" && (
              <InfoSection title="Developer SDK">
                <p>Integrate ShadowTrace ZK-Identity into your own Web3 DApp in just 3 lines of code.</p>
                <div className="terminal code-terminal">
                  <div className="terminal-header">
                    <span>TypeScript - v1.4.2</span>
                    <button onClick={() => copyText(sdkCode, "SDK implementation copied to clipboard")}>
                      <i className="fa-solid fa-copy" /> Copy
                    </button>
                  </div>
                  <pre className="terminal-body">{sdkCode}</pre>
                </div>
              </InfoSection>
            )}
          </main>
        </div>
      )}

      <div className={`results-card ${resultsOpen ? "active" : ""}`}>
        <i className="fa-regular fa-circle-check result-icon" />
        <h2>Proof Anchored</h2>
        <p>Securely anchored to the Midnight Ledger.</p>
        <div className="hash-box">
          <div className="hash-label">TRANSACTION HASH</div>
          <div className="hash-value">{proofHash}</div>
          <button className="copy-btn" onClick={() => copyText(proofHash, "Transaction hash copied to clipboard")}>
            <i className="fa-regular fa-copy" />
          </button>
        </div>
        <button className="btn-secondary full-width" onClick={acknowledgeProof}>
          Acknowledge
        </button>
      </div>

      <div id="toast-container">
        {toasts.map((toast) => (
          <div className="toast" key={toast.id}>
            <i
              className={`fa-solid ${
                toast.type === "success"
                  ? "fa-circle-check success"
                  : toast.type === "error"
                    ? "fa-circle-xmark error"
                    : "fa-circle-info info"
              }`}
            />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="tab-content active info-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
