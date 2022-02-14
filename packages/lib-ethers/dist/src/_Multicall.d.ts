import { BigNumber } from "@ethersproject/bignumber";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { CallOverrides, Contract } from "@ethersproject/contracts";
import { _TypeSafeContract } from "./contracts";
export interface _Multicall extends _TypeSafeContract<Contract> {
    getCurrentBlockTimestamp(overrides?: CallOverrides): Promise<BigNumber>;
}
export declare const _connectToMulticall: (signerOrProvider: Signer | Provider, chainId: number) => _Multicall | undefined;
//# sourceMappingURL=_Multicall.d.ts.map