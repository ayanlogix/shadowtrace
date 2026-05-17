"use client";

import { ContractState } from "@midnight-ntwrk/compact-runtime";
import { LedgerParameters, Transaction, ZswapChainState } from "@midnight-ntwrk/ledger-v8";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type { MidnightProvider, WalletProvider } from "@midnight-ntwrk/midnight-js-types";

export const ONE_AM_EXTENSION_URL = "https://1am.xyz";

export type ConnectedSession = {
  api: any;
  config: {
    networkId: string;
    indexerUri: string;
    indexerWsUri: string;
    proverServerUri?: string;
    substrateNodeUri?: string;
  };
  providers: {
    privateStateProvider: ReturnType<typeof createPrivateStateProvider>;
    publicDataProvider: ReturnType<typeof createPatchedPublicDataProvider>;
    zkConfigProvider: FetchZkConfigProvider<any>;
    proofProvider: { proveTx: (unprovenTx: any) => Promise<any> };
    walletProvider: WalletProvider;
    midnightProvider: MidnightProvider;
  };
  unshieldedAddress: string;
  shieldedAddress: string | null;
  shieldedCoinPublicKey: string | null;
  shieldedEncryptionPublicKey: string | null;
  dustAddress: string | null;
  authSignature: string | null;
};

export type OneAmWalletSession = ConnectedSession;

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) throw new Error("Invalid hex string from wallet.");

  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = parseInt(normalized.slice(index, index + 2), 16);
  }

  return bytes;
}

export function detectOneAmWallet(): Promise<any | null> {
  return new Promise((resolve) => {
    let attempts = 0;

    const check = () => {
      const wallet = (window as any).midnight?.["1am"];
      if (wallet) {
        resolve(wallet);
        return;
      }

      attempts += 1;
      if (attempts > 50) {
        resolve(null);
        return;
      }

      window.setTimeout(check, 100);
    };

    check();
  });
}

function createPrivateStateProvider() {
  let scope = "";
  const stateStore = new Map<string, unknown>();
  const signingKeyStore = new Map<string, unknown>();
  const key = (id: string) => `${scope}:${id}`;

  return {
    setContractAddress(address: string) {
      scope = address;
    },
    async set(id: string, state: unknown) {
      stateStore.set(key(id), state);
    },
    async get(id: string) {
      return stateStore.get(key(id)) ?? null;
    },
    async remove(id: string) {
      stateStore.delete(key(id));
    },
    async clear() {
      stateStore.clear();
    },
    async setSigningKey(address: string, signingKey: unknown) {
      signingKeyStore.set(address, signingKey);
    },
    async getSigningKey(address: string) {
      return signingKeyStore.get(address) ?? null;
    },
    async removeSigningKey(address: string) {
      signingKeyStore.delete(address);
    },
    async clearSigningKeys() {
      signingKeyStore.clear();
    },
    async exportPrivateStates(): Promise<never> {
      throw new Error("Private state export is not implemented.");
    },
    async importPrivateStates(): Promise<never> {
      throw new Error("Private state import is not implemented.");
    },
    async exportSigningKeys(): Promise<never> {
      throw new Error("Signing key export is not implemented.");
    },
    async importSigningKeys(): Promise<never> {
      throw new Error("Signing key import is not implemented.");
    },
  };
}

function createPatchedPublicDataProvider(queryUrl: string, subscriptionUrl: string) {
  const base = indexerPublicDataProvider(queryUrl, subscriptionUrl);

  async function queryLatest(query: string, address: string) {
    const response = await fetch(queryUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables: { address } }),
    });

    if (!response.ok) throw new Error(`Indexer HTTP error: ${response.status}`);

    const payload = await response.json();
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error: any) => error.message).join("; "));
    }

    return payload.data?.contractAction ?? null;
  }

  return {
    ...base,
    async queryContractState(contractAddress: string, config?: any) {
      if (config) return base.queryContractState(contractAddress, config);

      const action = await queryLatest(
        `
        query LATEST_CONTRACT_STATE($address: HexEncoded!) {
          contractAction(address: $address) { state }
        }
      `,
        contractAddress,
      );

      return action ? ContractState.deserialize(fromHex(action.state)) : null;
    },
    async queryZSwapAndContractState(contractAddress: string, config?: any) {
      if (config) return base.queryZSwapAndContractState(contractAddress, config);

      const action = await queryLatest(
        `
        query LATEST_BOTH_STATE($address: HexEncoded!) {
          contractAction(address: $address) {
            state
            zswapState
            transaction { block { ledgerParameters } }
          }
        }
      `,
        contractAddress,
      );

      if (!action?.zswapState) return null;

      return [
        ZswapChainState.deserialize(fromHex(action.zswapState)),
        ContractState.deserialize(fromHex(action.state)),
        action.transaction?.block?.ledgerParameters
          ? LedgerParameters.deserialize(fromHex(action.transaction.block.ledgerParameters))
          : LedgerParameters.initialParameters(),
      ] as const;
    },
  };
}

export async function connectOneAmWallet(network = "preprod"): Promise<OneAmWalletSession> {
  const wallet = await detectOneAmWallet();

  if (!wallet) {
    throw new Error("1AM wallet is not installed.");
  }

  const api = await wallet.connect(network);
  const [config, unshieldedAddress, shieldedAddresses, dustAddress] = await Promise.all([
    api.getConfiguration(),
    api.getUnshieldedAddress(),
    api.getShieldedAddresses(),
    api.getDustAddress?.().catch(() => null),
  ]);

  setNetworkId(config.networkId);

  const zkConfigProvider = new FetchZkConfigProvider<any>(
    new URL("/zk/age-verify/", window.location.origin).toString(),
    window.fetch.bind(window),
  );
  const provingProvider = await api.getProvingProvider(zkConfigProvider);

  const proofProvider = {
    async proveTx(unprovenTx: any) {
      const { CostModel } = await import("@midnight-ntwrk/ledger-v8");
      return unprovenTx.prove(provingProvider, CostModel.initialCostModel());
    },
  };

  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
    getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
    balanceTx: async (tx: any) => {
      const txHex = toHex(tx.serialize());
      const balanced = await api.balanceUnsealedTransaction(txHex);
      if (!balanced?.tx) throw new Error("balanceUnsealedTransaction returned invalid result.");
      return Transaction.deserialize("signature", "proof", "binding", fromHex(balanced.tx));
    },
  };

  const midnightProvider: MidnightProvider = {
    submitTx: async (tx: any) => {
      const txHex = toHex(tx.serialize());
      const result = await api.submitTransaction(txHex);
      if (typeof result === "string" && result) return result;
      if (result?.transactionId) return result.transactionId;
      if (result?.id) return result.id;
      return txHex.slice(0, 64);
    },
  };

  const authMessage = `ShadowTrace login\nNetwork: ${config.networkId ?? network}\nAddress: ${
    unshieldedAddress.unshieldedAddress
  }\nIssued: ${new Date().toISOString()}`;

  const authSignature =
    typeof api.signData === "function" ? await api.signData(authMessage, { encoding: "text" }) : null;

  return {
    api,
    config,
    providers: {
      privateStateProvider: createPrivateStateProvider(),
      publicDataProvider: createPatchedPublicDataProvider(config.indexerUri, config.indexerWsUri),
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    },
    unshieldedAddress: unshieldedAddress.unshieldedAddress,
    shieldedAddress: shieldedAddresses?.shieldedAddress ?? null,
    shieldedCoinPublicKey: shieldedAddresses?.shieldedCoinPublicKey ?? null,
    shieldedEncryptionPublicKey: shieldedAddresses?.shieldedEncryptionPublicKey ?? null,
    dustAddress: dustAddress?.dustAddress ?? null,
    authSignature,
  };
}

export function formatAddress(address: string | null | undefined, prefixLength = 8, suffixLength = 6) {
  if (!address) return "Unavailable";
  if (address.length <= prefixLength + suffixLength + 3) return address;
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}
