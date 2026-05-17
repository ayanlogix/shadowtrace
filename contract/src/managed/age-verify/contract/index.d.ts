import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  birthYear(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  birthMonth(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  birthDay(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  verifyAdult(context: __compactRuntime.CircuitContext<PS>,
              claimId_0: Uint8Array,
              currentYear_0: bigint,
              currentMonth_0: bigint,
              currentDay_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  verifyAdult(context: __compactRuntime.CircuitContext<PS>,
              claimId_0: Uint8Array,
              currentYear_0: bigint,
              currentMonth_0: bigint,
              currentDay_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  verifyAdult(context: __compactRuntime.CircuitContext<PS>,
              claimId_0: Uint8Array,
              currentYear_0: bigint,
              currentMonth_0: bigint,
              currentDay_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly verifiedProofs: bigint;
  readonly latestClaimId: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
