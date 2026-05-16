// --- DOM ELEMENTS ---
const loginBtn = document.getElementById('login-btn');
const loginMain = document.getElementById('login-main');
const walletModal = document.getElementById('wallet-modal');
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const generateProofBtn = document.getElementById('generate-proof');
const consoleEl = document.getElementById('console');
const resultsCard = document.getElementById('results-card');
const overlay = document.getElementById('overlay');
const currentTabName = document.getElementById('current-tab-name');
const proofTypeSelect = document.getElementById('proof-type');
const dynamicInputLabel = document.getElementById('dynamic-input-label');
const dynamicInput = document.getElementById('dynamic-input');
const connectedWalletText = document.getElementById('connected-wallet-text');
const blockHeightEl = document.getElementById('block-height');

// Boot Sequence
const bootSequence = document.getElementById('boot-sequence');
const bootText = document.getElementById('boot-text');
const bootProgress = document.getElementById('boot-progress');

// --- UX FIXES ---
dynamicInput.addEventListener('click', function() {
    if (this.type === 'date' && typeof this.showPicker === 'function') this.showPicker();
});

// --- SELECTIVE DISCLOSURE LOGIC ---
proofTypeSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'age') {
        dynamicInputLabel.innerText = "Date of Birth";
        dynamicInput.type = "date";
        dynamicInput.placeholder = "";
    } else if (val === 'finance') {
        dynamicInputLabel.innerText = "Bank Statement Hash (SHA-256)";
        dynamicInput.type = "text";
        dynamicInput.placeholder = "0x...";
    } else if (val === 'citizenship') {
        dynamicInputLabel.innerText = "Passport Document ID";
        dynamicInput.type = "text";
        dynamicInput.placeholder = "Doc ID...";
    }
});

// --- WALLET & BOOT LOGIC ---
loginBtn.addEventListener('click', () => {
    loginMain.classList.add('hidden');
    walletModal.classList.remove('hidden');
});

function closeWalletModal() {
    walletModal.classList.add('hidden');
    loginMain.classList.remove('hidden');
}

function startBootSequence(walletName) {
    document.querySelectorAll('.wallet-option').forEach(opt => opt.style.pointerEvents = 'none');
    
    walletModal.classList.add('hidden');
    loginScreen.classList.add('hidden');
    bootSequence.classList.remove('hidden');
    
    connectedWalletText.innerText = `${walletName.toUpperCase()}: 0x8F2...9A1`;
    localStorage.setItem('shadowtrace_wallet', walletName);

    setTimeout(() => { bootText.innerText = `AUTHENTICATING_SIGNATURE...`; bootProgress.style.width = "40%"; }, 400);
    setTimeout(() => { bootText.innerText = "SYNCING_STATE..."; bootProgress.style.width = "80%"; }, 900);
    setTimeout(() => { bootText.innerText = "ACCESS_GRANTED"; bootProgress.style.width = "100%"; }, 1300);

    setTimeout(() => {
        bootSequence.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        consoleEl.innerHTML = '';
        typeToConsole(`System initialized. Wallet connected.`);
        startBlockTicker();
    }, 1600);
}

function disconnectWallet() {
    localStorage.removeItem('shadowtrace_wallet');
    // Show Toast
    showToast('Wallet disconnected securely.', 'info');
    
    // Reset App State after short delay
    setTimeout(() => {
        appContainer.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        
        // Reset Inputs
        dynamicInput.value = '';
        consoleEl.innerHTML = '';
        document.querySelectorAll('.wallet-option').forEach(opt => opt.style.pointerEvents = 'auto');
        bootProgress.style.width = "0%";
    }, 800);
}

// --- LIVE METRICS TICKER ---
function startBlockTicker() {
    let currentBlock = 8492105;
    let currentValidators = 124;
    
    setInterval(() => {
        // Block Height
        currentBlock += Math.floor(Math.random() * 2);
        blockHeightEl.innerText = currentBlock.toLocaleString();
        
        // Network Latency (fluctuates between 38ms and 65ms)
        const latencyEl = document.getElementById('network-latency');
        if (latencyEl) {
            const ping = Math.floor(Math.random() * (65 - 38 + 1)) + 38;
            latencyEl.innerText = `${ping}ms`;
            latencyEl.style.color = ping > 55 ? '#ffaa00' : 'var(--success)';
        }

        // Validators (fluctuates occasionally)
        const validatorEl = document.getElementById('active-validators');
        if (validatorEl && Math.random() > 0.7) {
            currentValidators = Math.random() > 0.5 ? currentValidators + 1 : currentValidators - 1;
            validatorEl.innerText = currentValidators;
        }

    }, 3000);
}

// --- NETWORK DIAGNOSTICS ---
function runNetworkDiagnostics() {
    const btn = document.getElementById('run-diagnostics-btn');
    const icon = document.getElementById('network-icon');
    const title = document.getElementById('network-status-title');
    const desc = document.getElementById('network-status-desc');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Scanning...';
    icon.className = 'fa-solid fa-satellite-dish fa-fade';
    icon.style.color = 'var(--accent)';
    title.innerText = 'Analyzing P2P Peers...';
    desc.innerText = 'Pinging Midnight consensus nodes and verifying compact runtime hashes.';

    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Run Diagnostics';
        icon.className = 'fa-solid fa-chart-network';
        icon.style.color = 'var(--success)';
        title.innerText = 'Node Sync Optimal';
        desc.innerText = 'Your local Light Node is fully synchronized with the Midnight P2P network.';
        showToast('Diagnostics complete. 0 issues found.', 'success');
    }, 2500);
}

// --- CUSTOM SELECT LOGIC ---
function toggleSelect() {
    const options = document.getElementById('select-options');
    options.classList.toggle('hidden');
}

function selectOption(element, value, text) {
    // Update Hidden Input
    document.getElementById('proof-type').value = value;
    
    // Update Trigger Text
    document.getElementById('selected-disclosure-text').innerText = text;
    
    // Update Active Class
    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
    
    // Close Dropdown
    document.getElementById('select-options').classList.add('hidden');
    
    // Handle dynamic labels (Age vs Finance)
    const label = document.getElementById('dynamic-input-label');
    const input = document.getElementById('dynamic-input');
    
    if (value === 'age') {
        label.innerText = 'Date of Birth';
        input.type = 'date';
    } else if (value === 'finance') {
        label.innerText = 'Target Balance Threshold';
        input.type = 'text';
        input.placeholder = '$10,000.00';
    } else {
        label.innerText = 'Identity Document Number';
        input.type = 'text';
        input.placeholder = 'e.g. PASS-9210-XX';
    }
}

// Close select when clicking outside
window.addEventListener('click', (e) => {
    const select = document.getElementById('disclosure-select');
    const options = document.getElementById('select-options');
    if (select && !select.contains(e.target)) {
        options.classList.add('hidden');
    }
});

// --- TAB SWITCHING ---
function switchTab(tabId, element = null) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const selectedTab = document.getElementById(`tab-${tabId}`);
    if (selectedTab) selectedTab.classList.remove('hidden');

    if (element) {
        element.classList.add('active');
    } else {
        const navItem = document.querySelector(`.nav-item[onclick*="'${tabId}'"]`);
        if (navItem) navItem.classList.add('active');
    }

    currentTabName.innerText = tabId.toUpperCase();
}

// --- TERMINAL LOGIC ---
function typeToConsole(message) {
    const line = document.createElement('div');
    line.innerHTML = `<span class="highlight">></span> ${message}`;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

// --- VERIFICATION LOGIC ---
let lastGeneratedHash = '';
let ledgerItemCount = 1;

function generateRandomHash() {
    const chars = '0123456789ABCDEF';
    let hash = 'ZKP_';
    for (let i = 0; i < 24; i++) {
        if (i > 0 && i % 4 === 0) hash += '_';
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
}

generateProofBtn.addEventListener('click', () => {
    if (!dynamicInput.value) {
        typeToConsole(`Error: ${dynamicInputLabel.innerText} is required.`);
        return;
    }

    const proofTypeStr = proofTypeSelect.options[proofTypeSelect.selectedIndex].text;
    
    // Generate dynamic hash
    lastGeneratedHash = generateRandomHash();
    document.getElementById('proof-hash').innerText = lastGeneratedHash;

    generateProofBtn.disabled = true;
    generateProofBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
    typeToConsole(`Loading Compact Circuit: [${proofTypeSelect.value.toUpperCase()}]`);
    
    setTimeout(() => {
        typeToConsole("Generating witness data securely...");
        setTimeout(() => {
            typeToConsole(`Constructing zero-knowledge proof for: ${proofTypeStr}`);
            setTimeout(() => {
                typeToConsole("Proof generated successfully.");
                setTimeout(showResults, 600);
            }, 1200);
        }, 1200);
    }, 800);
});

function showResults() {
    overlay.classList.add('active');
    resultsCard.classList.add('active');
}

function resetUI() {
    overlay.classList.remove('active');
    resultsCard.classList.remove('active');
    generateProofBtn.disabled = false;
    generateProofBtn.innerHTML = '<i class="fa-solid fa-microchip"></i> Generate Proof';
    typeToConsole("Proof anchored to ledger.");
    
    // Dynamically add to Ledger
    const proofTypeStr = proofTypeSelect.options[proofTypeSelect.selectedIndex].text;
    addLedgerItem(proofTypeStr, lastGeneratedHash);
    
    showToast('New proof added to Ledger', 'success');
}

function addLedgerItem(title, hash) {
    ledgerItemCount++;
    const ledgerContainer = document.querySelector('#tab-history .card');
    
    const itemId = `ledger-item-${ledgerItemCount}`;
    const shortHash = hash.substring(0, 10) + '...' + hash.substring(hash.length - 4);
    
    const itemHTML = `
        <div id="${itemId}" style="border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; margin-top: 12px; background: rgba(0, 230, 118, 0.02); border-color: rgba(0, 230, 118, 0.2);">
            <div>
                <div style="font-weight: 500; font-size: 0.95rem; margin-bottom: 4px;">${title}</div>
                <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary);">${shortHash}</div>
            </div>
            <button onclick="revokeProof('${itemId}')" class="btn-secondary" style="padding: 8px 16px; font-size: 0.8rem; color: #ff4444; border-color: rgba(255,68,68,0.2);">
                Revoke
            </button>
        </div>
    `;
    
    ledgerContainer.insertAdjacentHTML('beforeend', itemHTML);
}

// --- COPY TO CLIPBOARD ---
function copyHash() {
    const hashText = document.getElementById('proof-hash').innerText;
    const copyIcon = document.getElementById('copy-icon');
    
    navigator.clipboard.writeText(hashText).then(() => {
        copyIcon.className = 'fa-solid fa-check';
        copyIcon.style.color = 'var(--success)';
        showToast('Transaction hash copied to clipboard', 'success');
        
        setTimeout(() => {
            copyIcon.className = 'fa-regular fa-copy';
            copyIcon.style.color = '';
        }, 2000);
    }).catch(err => {
        showToast('Failed to copy text', 'error');
    });
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let iconClass = 'fa-solid fa-circle-info info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check success';
    if (type === 'error') iconClass = 'fa-solid fa-circle-xmark error';
    
    toast.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        if (container.contains(toast)) {
            container.removeChild(toast);
        }
    }, 3000);
}

// --- REVOKE PROOF LOGIC ---
function revokeProof(itemId) {
    const item = document.getElementById(itemId);
    if (!item) return;

    // Simulate Network Request
    item.style.opacity = '0.5';
    item.querySelector('button').innerText = 'Revoking...';
    typeToConsole("INITIATING_NULLIFIER_BURN...");

    setTimeout(() => {
        item.style.transform = 'translateX(100%)';
        item.style.opacity = '0';
        setTimeout(() => {
            item.remove();
            showToast('Zero-knowledge proof successfully revoked.', 'success');
            typeToConsole("NULLIFIER_BURN_COMPLETE. PROOF_REVOKED.");
        }, 300);
    }, 1500);
}

// --- PERSISTENT LOGIN ---
window.addEventListener('DOMContentLoaded', () => {
    const savedWallet = localStorage.getItem('shadowtrace_wallet');
    if (savedWallet) {
        loginScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        connectedWalletText.innerText = `${savedWallet.toUpperCase()}: 0x8F2...9A1`;
        startBlockTicker();
        typeToConsole(`Session restored. Welcome back.`);
    }

    // Initialize Flatpickr
    flatpickr("#dynamic-input", {
        dateFormat: "Y-m-d",
        disableMobile: "true",
        animate: true,
        monthSelectorType: "dropdown"
    });
});
