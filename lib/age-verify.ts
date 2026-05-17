"use client";

import { ContractState, sampleSigningKey } from "@midnight-ntwrk/compact-runtime";
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import {
  createUnprovenDeployTx,
  submitCallTxAsync,
  submitTxAsync,
} from "@midnight-ntwrk/midnight-js-contracts";
import { AgeVerifyPrivateStateId, emptyAgeVerifyPrivateState, witnesses } from "@contract/witnesses";
import type { ConnectedSession } from "@/lib/wallet";
import { fromHex } from "@/lib/wallet";

const ZK_ASSET_PATH = "/zk/age-verify/";
const CONTRACT_STORAGE_KEY = "shadowtrace_age_verify_contract";

export type AgeVerifyProofResult = {
  txId: string;
  contractAddress: string;
  claimId: string;
  proofCount: bigint | null;
};

async function loadAgeVerifyContract() {
  try {
    return await import("@contract/managed/age-verify/contract/index.js");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`AgeVerify contract failed to load: ${msg}. Run \`npm run build:contract\` to compile.`);
  }
}

async function makeCompiledContract() {
  const AgeVerify = await loadAgeVerifyContract();

  return (CompiledContract.make("age-verify", AgeVerify.Contract as any) as any).pipe(
    (CompiledContract.withWitnesses as any)(witnesses),
    (CompiledContract.withCompiledFileAssets as any)(ZK_ASSET_PATH),
  );
}

function randomClaimIdBytes() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return { bytes };
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseDob(dob: string) {
  const [year, month, day] = dob.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Enter a valid date of birth.");
  }

  return { birthYear: year, birthMonth: month, birthDay: day };
}

function todayParts() {
  const now = new Date();
  return {
    currentYear: BigInt(now.getFullYear()),
    currentMonth: BigInt(now.getMonth() + 1),
    currentDay: BigInt(now.getDate()),
  };
}

export function getStoredAgeVerifyContract(networkId: string) {
  return localStorage.getItem(`${CONTRACT_STORAGE_KEY}:${networkId}`);
}

function storeAgeVerifyContract(networkId: string, contractAddress: string) {
  localStorage.setItem(`${CONTRACT_STORAGE_KEY}:${networkId}`, contractAddress);
}

export function decodeAgeVerifyProofCount(stateHex: string): bigint | null {
  void stateHex;
  return null;
}

export async function decodeAgeVerifyProofCountAsync(stateHex: string): Promise<bigint | null> {
  try {
    const AgeVerify = await loadAgeVerifyContract();
    const contractState = ContractState.deserialize(fromHex(stateHex));
    const ledger = AgeVerify.ledger(contractState.data);
    return ledger.verifiedProofs as unknown as bigint;
  } catch {
    return null;
  }
}

export async function deployAgeVerifyContract(session: ConnectedSession): Promise<string> {
  const compiledContract = await makeCompiledContract();

  const deployTxData = await (createUnprovenDeployTx as any)(
    {
      zkConfigProvider: session.providers.zkConfigProvider,
      walletProvider: session.providers.walletProvider,
    },
    {
      compiledContract,
      args: [],
      privateStateId: AgeVerifyPrivateStateId,
      initialPrivateState: emptyAgeVerifyPrivateState,
      signingKey: sampleSigningKey(),
    },
  );

  const contractAddress = deployTxData.public.contractAddress;

  await (submitTxAsync as any)(session.providers, {
    unprovenTx: deployTxData.private.unprovenTx,
  });

  await session.providers.privateStateProvider.setContractAddress(contractAddress);
  await session.providers.privateStateProvider.set(AgeVerifyPrivateStateId, deployTxData.private.initialPrivateState);
  await session.providers.privateStateProvider.setSigningKey(contractAddress, deployTxData.private.signingKey);
  storeAgeVerifyContract(session.config.networkId, contractAddress);

  return contractAddress;
}

export async function ensureAgeVerifyContract(session: ConnectedSession) {
  const stored = getStoredAgeVerifyContract(session.config.networkId);

  if (stored) {
    await session.providers.privateStateProvider.setContractAddress(stored);
    return stored;
  }

  return deployAgeVerifyContract(session);
}

export async function verifyAgeOver18(session: ConnectedSession, dob: string): Promise<AgeVerifyProofResult> {
  const privateDob = parseDob(dob);
  const contractAddress = await ensureAgeVerifyContract(session);
  const compiledContract = await makeCompiledContract();
  const claim = randomClaimIdBytes();
  const today = todayParts();

  await session.providers.privateStateProvider.setContractAddress(contractAddress);
  await session.providers.privateStateProvider.set(AgeVerifyPrivateStateId, privateDob);

  try {
    const submitted = await (submitCallTxAsync as any)(session.providers, {
      compiledContract,
      contractAddress,
      circuitId: "verifyAdult",
      args: [claim, today.currentYear, today.currentMonth, today.currentDay],
      privateStateId: AgeVerifyPrivateStateId,
    });

    await session.providers.privateStateProvider.set(AgeVerifyPrivateStateId, emptyAgeVerifyPrivateState);

    return {
      txId: submitted.txId ?? submitted.public?.txId ?? submitted.public?.txHash ?? "submitted",
      contractAddress,
      claimId: `0x${bytesToHex(claim.bytes)}`,
      proofCount: null,
    };
  } catch (error) {
    await session.providers.privateStateProvider.set(AgeVerifyPrivateStateId, emptyAgeVerifyPrivateState);
    throw error;
  }
}
