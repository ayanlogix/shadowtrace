declare module "@contract/managed/age-verify/contract/index.js" {
  export type Witnesses<PS> = {
    birthYear(context: import("@midnight-ntwrk/compact-runtime").WitnessContext<unknown, PS>): bigint;
    birthMonth(context: import("@midnight-ntwrk/compact-runtime").WitnessContext<unknown, PS>): bigint;
    birthDay(context: import("@midnight-ntwrk/compact-runtime").WitnessContext<unknown, PS>): bigint;
  };

  export type Ledger = {
    readonly verifiedProofs: bigint;
    readonly latestClaimId: { bytes: Uint8Array };
  };

  export class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
    constructor(witnesses: W);
  }

  export function ledger(
    state:
      | import("@midnight-ntwrk/compact-runtime").StateValue
      | import("@midnight-ntwrk/compact-runtime").ChargedState,
  ): Ledger;
}
