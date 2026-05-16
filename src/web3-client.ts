import { MidnightProviders, DAppConnectorAPI } from '@midnight-ntwrk/dapp-connector-api';
import { MidnightClient, ProofService } from '@midnight-ntwrk/midnight-js';
import { prove_age_18 } from '../contract/index.compact'; // Assuming compiled output

// 1. STATE MANAGEMENT
export const web3State = {
    walletAPI: null as DAppConnectorAPI | null,
    midnightClient: null as MidnightClient | null,
    isConnected: false,
    userAddress: ''
};

// 2. CONNECT WALLET (LACE / NIGHTLY)
export async function connectWeb3Wallet(walletName: string): Promise<boolean> {
    try {
        console.log(`[Web3] Attempting to connect to ${walletName}...`);

        // Check if the browser extension has injected the midnight object
        if (typeof window.midnight === 'undefined') {
            throw new Error('No Midnight-compatible wallet found in browser.');
        }

        // Connect to Lace (or selected wallet)
        const walletId = walletName === 'Lace' ? 'lace' : 'nightly';
        const walletAPI = await window.midnight[walletId].enable();
        
        web3State.walletAPI = walletAPI;
        
        // Initialize the Midnight Client using the Wallet's API
        const providers = new MidnightProviders({ walletAPI });
        web3State.midnightClient = new MidnightClient(providers);

        // Get User Address
        const addresses = await walletAPI.getAddresses();
        web3State.userAddress = addresses[0];
        web3State.isConnected = true;

        console.log(`[Web3] Wallet Connected: ${web3State.userAddress}`);
        return true;

    } catch (error) {
        console.error('[Web3] Wallet Connection Failed:', error);
        return false;
    }
}

// 3. GENERATE ZERO-KNOWLEDGE PROOF
export async function generateIdentityProof(birthYear: number): Promise<{ success: boolean; hash?: string; error?: string }> {
    if (!web3State.isConnected || !web3State.midnightClient) {
        return { success: false, error: 'Wallet not connected' };
    }

    try {
        console.log('[Web3] Initializing Prover Server...');
        
        // Step 1: Calculate current year logic locally
        const currentYear = new Date().getFullYear();
        
        // Step 2: Initialize Proof Service (Connects to Midnight Node)
        const prover = new ProofService('https://testnet.midnight.network/prove');
        
        console.log('[Web3] Executing Compact Circuit (prove_age_18)...');
        
        // Step 3: Run the ZK Circuit Locally
        // We pass the current year and birth year. 
        // The circuit ensures (current_year - birth_year) >= 18 without revealing the actual birth year to the network.
        const proofContext = await web3State.midnightClient.createProof(
            prove_age_18, // The compiled Compact circuit
            {
                current_year: currentYear,
                birth_year: birthYear
            },
            prover
        );

        console.log('[Web3] Submitting proof transaction to Ledger...');
        
        // Step 4: Submit the generated proof to the blockchain
        const txResponse = await web3State.midnightClient.submitTransaction(proofContext);

        if (txResponse.status === 'success') {
            console.log(`[Web3] Proof Anchored. TX Hash: ${txResponse.hash}`);
            return { success: true, hash: txResponse.hash };
        } else {
            throw new Error('Transaction rejected by network.');
        }

    } catch (error) {
        console.error('[Web3] Proof Generation Failed:', error);
        return { success: false, error: error.message };
    }
}

// 4. FETCH LIVE BLOCK HEIGHT
export async function getLiveBlockHeight(): Promise<number> {
    if (!web3State.isConnected || !web3State.midnightClient) return 0;
    
    try {
        const ledgerState = await web3State.midnightClient.getLedgerState();
        return ledgerState.blockHeight;
    } catch (error) {
        console.error('[Web3] Failed to fetch block height:', error);
        return 0;
    }
}
