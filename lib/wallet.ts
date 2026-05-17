"use client";

export const ONE_AM_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/1am/bphnkdkcnfhompoegfpgnkidcjfbojjp";

export type OneAmWalletSession = {
  api: any;
  config: {
    networkId?: string;
    indexerUri?: string;
    indexerWsUri?: string;
    proverServerUri?: string;
    substrateNodeUri?: string;
  };
  unshieldedAddress: string;
  shieldedAddress: string | null;
  shieldedCoinPublicKey: string | null;
  shieldedEncryptionPublicKey: string | null;
  dustAddress: string | null;
  authSignature: string | null;
};

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

  const authMessage = `ShadowTrace login\nNetwork: ${config.networkId ?? network}\nAddress: ${
    unshieldedAddress.unshieldedAddress
  }\nIssued: ${new Date().toISOString()}`;

  const authSignature =
    typeof api.signData === "function" ? await api.signData(authMessage, { encoding: "text" }) : null;

  return {
    api,
    config,
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
