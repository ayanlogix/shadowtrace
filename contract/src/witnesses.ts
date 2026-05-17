import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type AgeVerifyPrivateState = {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
};

export const AgeVerifyPrivateStateId = "ageVerifyPrivateState" as const;
export type AgeVerifyPrivateStateId = typeof AgeVerifyPrivateStateId;

export const emptyAgeVerifyPrivateState: AgeVerifyPrivateState = {
  birthYear: 0,
  birthMonth: 0,
  birthDay: 0,
};

function requireDob(context: WitnessContext<unknown, AgeVerifyPrivateState>) {
  const state = context.privateState;

  if (!state.birthYear || !state.birthMonth || !state.birthDay) {
    throw new Error("DOB private state is missing. Enter DOB before generating an age proof.");
  }

  return state;
}

export const witnesses = {
  birthYear: (context: WitnessContext<unknown, AgeVerifyPrivateState>) => BigInt(requireDob(context).birthYear),
  birthMonth: (context: WitnessContext<unknown, AgeVerifyPrivateState>) => BigInt(requireDob(context).birthMonth),
  birthDay: (context: WitnessContext<unknown, AgeVerifyPrivateState>) => BigInt(requireDob(context).birthDay),
};
