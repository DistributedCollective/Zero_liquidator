import { LogDescription } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { Log } from "@ethersproject/abstract-provider";
import { Contract, ContractInterface, Overrides, CallOverrides, PopulatedTransaction, ContractTransaction } from "@ethersproject/contracts";
import { ActivePool, BorrowerOperations, TroveManager, TroveManagerRedeemOps, ZUSDToken, CollSurplusPool, CommunityIssuance, DefaultPool, ZEROToken, HintHelpers, ZEROStaking, MultiTroveGetter, PriceFeed, PriceFeedTestnet, SortedTroves, StabilityPool, GasPool, LiquityBaseParams, IERC20, FeeDistributor } from "../types";
import { EthersProvider, EthersSigner } from "./types";
export interface _TypedLogDescription<T> extends Omit<LogDescription, "args"> {
    args: T;
}
declare type BucketOfFunctions = Record<string, (...args: unknown[]) => never>;
export declare type _TypeSafeContract<T> = Pick<T, {
    [P in keyof T]: BucketOfFunctions extends T[P] ? never : P;
} extends {
    [_ in keyof T]: infer U;
} ? U : never>;
declare type EstimatedContractFunction<R = unknown, A extends unknown[] = unknown[], O = Overrides> = (overrides: O, adjustGas: (gas: BigNumber) => BigNumber, ...args: A) => Promise<R>;
declare type CallOverridesArg = [overrides?: CallOverrides];
declare type TypedContract<T extends Contract, U, V> = _TypeSafeContract<T> & U & {
    [P in keyof V]: V[P] extends (...args: infer A) => unknown ? (...args: A) => Promise<ContractTransaction> : never;
} & {
    readonly callStatic: {
        [P in keyof V]: V[P] extends (...args: [...infer A, never]) => infer R ? (...args: [...A, ...CallOverridesArg]) => R : never;
    };
    readonly estimateAndPopulate: {
        [P in keyof V]: V[P] extends (...args: [...infer A, infer O | undefined]) => unknown ? EstimatedContractFunction<PopulatedTransaction, A, O> : never;
    };
};
export declare class _LiquityContract extends Contract {
    readonly estimateAndPopulate: Record<string, EstimatedContractFunction<PopulatedTransaction>>;
    constructor(addressOrName: string, contractInterface: ContractInterface, signerOrProvider?: EthersSigner | EthersProvider);
    extractEvents(logs: Log[], name: string): _TypedLogDescription<unknown>[];
}
/** @internal */
export declare type _TypedLiquityContract<T = unknown, U = unknown> = TypedContract<_LiquityContract, T, U>;
/** @internal */
export interface _LiquityContracts {
    activePool: ActivePool;
    borrowerOperations: BorrowerOperations;
    troveManager: TroveManager;
    troveManagerRedeemOps: TroveManagerRedeemOps;
    zusdToken: ZUSDToken;
    nueToken?: IERC20;
    collSurplusPool: CollSurplusPool;
    communityIssuance: CommunityIssuance;
    defaultPool: DefaultPool;
    zeroToken: ZEROToken;
    hintHelpers: HintHelpers;
    zeroStaking: ZEROStaking;
    multiTroveGetter: MultiTroveGetter;
    priceFeed: PriceFeed | PriceFeedTestnet;
    sortedTroves: SortedTroves;
    stabilityPool: StabilityPool;
    gasPool: GasPool;
    liquityBaseParams: LiquityBaseParams;
    feeDistributor: FeeDistributor;
}
/** @internal */
export declare const _priceFeedIsTestnet: (priceFeed: PriceFeed | PriceFeedTestnet) => priceFeed is PriceFeedTestnet;
declare type LiquityContractsKey = keyof _LiquityContracts;
/** @internal */
export declare type _LiquityContractAddresses = Record<LiquityContractsKey, string>;
/** @internal */
export interface _LiquityDeploymentJSON {
    readonly chainId: number;
    readonly addresses: _LiquityContractAddresses;
    readonly version: string;
    readonly deploymentDate: number;
    readonly startBlock: number;
    readonly bootstrapPeriod: number;
    readonly governanceAddress: string;
    readonly sovFeeCollectorAddress?: string;
    readonly wrbtcAddress?: string;
    readonly presaleAddress?: string;
    readonly marketMakerAddress?: string;
    readonly _priceFeedIsTestnet: boolean;
    readonly _isDev: boolean;
}
/** @internal */
export declare const _connectToContracts: (signerOrProvider: EthersSigner | EthersProvider, { addresses, _priceFeedIsTestnet }: _LiquityDeploymentJSON) => _LiquityContracts;
export {};
//# sourceMappingURL=contracts.d.ts.map