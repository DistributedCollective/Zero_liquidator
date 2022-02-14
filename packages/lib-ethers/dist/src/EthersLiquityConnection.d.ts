import { BlockTag } from "@ethersproject/abstract-provider";
import { EthersProvider, EthersSigner } from "./types";
import { _LiquityContractAddresses, _LiquityContracts, _LiquityDeploymentJSON } from "./contracts";
import { _Multicall } from "./_Multicall";
declare const brand: unique symbol;
/**
 * Information about a connection to the Liquity protocol.
 *
 * @remarks
 * Provided for debugging / informational purposes.
 *
 * Exposed through {@link ReadableEthersLiquity.connection} and {@link EthersLiquity.connection}.
 *
 * @public
 */
export interface EthersLiquityConnection extends EthersLiquityConnectionOptionalParams {
    /** Ethers `Provider` used for connecting to the network. */
    readonly provider: EthersProvider;
    /** Ethers `Signer` used for sending transactions. */
    readonly signer?: EthersSigner;
    /** Chain ID of the connected network. */
    readonly chainId: number;
    /** Version of the Liquity contracts (Git commit hash). */
    readonly version: string;
    /** Date when the Liquity contracts were deployed. */
    readonly deploymentDate: Date;
    /** Number of block in which the first Liquity contract was deployed. */
    readonly startBlock: number;
    /** Time period (in seconds) after `deploymentDate` during which redemptions are disabled. */
    readonly bootstrapPeriod: number;
    /** A mapping of Liquity contracts' names to their addresses. */
    readonly addresses: Record<string, string>;
    /** @internal */
    readonly _priceFeedIsTestnet: boolean;
    /** @internal */
    readonly _isDev: boolean;
    /** @internal */
    readonly [brand]: unique symbol;
}
/** @internal */
export interface _InternalEthersLiquityConnection extends EthersLiquityConnection {
    readonly addresses: _LiquityContractAddresses;
    readonly _contracts: _LiquityContracts;
    readonly _multicall?: _Multicall;
}
/** @internal */
export declare const _getContracts: (connection: EthersLiquityConnection) => _LiquityContracts;
/** @internal */
export declare const _getBlockTimestamp: (connection: EthersLiquityConnection, blockTag?: BlockTag) => Promise<number>;
/** @internal */
export declare const _requireSigner: (connection: EthersLiquityConnection) => EthersSigner;
/** @internal */
export declare const _getProvider: (connection: EthersLiquityConnection) => EthersProvider;
/** @internal */
export declare const _requireAddress: (connection: EthersLiquityConnection, overrides?: {
    from?: string | undefined;
} | undefined) => string;
/** @internal */
export declare const _requireFrontendAddress: (connection: EthersLiquityConnection) => string;
/** @internal */
export declare const _usingStore: (connection: EthersLiquityConnection) => connection is EthersLiquityConnection & {
    useStore: EthersLiquityStoreOption;
};
/**
 * Thrown when trying to connect to a network where Liquity is not deployed.
 *
 * @remarks
 * Thrown by {@link ReadableEthersLiquity.(connect:2)} and {@link EthersLiquity.(connect:2)}.
 *
 * @public
 */
export declare class UnsupportedNetworkError extends Error {
    /** Chain ID of the unsupported network. */
    readonly chainId: number;
    /** @internal */
    constructor(chainId: number);
}
/** @internal */
export declare const _connectToDeployment: (deployment: _LiquityDeploymentJSON, signerOrProvider: EthersSigner | EthersProvider, optionalParams?: EthersLiquityConnectionOptionalParams | undefined) => EthersLiquityConnection;
/**
 * Possible values for the optional
 * {@link EthersLiquityConnectionOptionalParams.useStore | useStore}
 * connection parameter.
 *
 * @remarks
 * Currently, the only supported value is `"blockPolled"`, in which case a
 * {@link BlockPolledLiquityStore} will be created.
 *
 * @public
 */
export declare type EthersLiquityStoreOption = "blockPolled";
/**
 * Optional parameters of {@link ReadableEthersLiquity.(connect:2)} and
 * {@link EthersLiquity.(connect:2)}.
 *
 * @public
 */
export interface EthersLiquityConnectionOptionalParams {
    /**
     * Address whose Trove, Stability Deposit, ZERO Stake and balances will be read by default.
     *
     * @remarks
     * For example {@link EthersLiquity.getTrove | getTrove(address?)} will return the Trove owned by
     * `userAddress` when the `address` parameter is omitted.
     *
     * Should be omitted when connecting through a {@link EthersSigner | Signer}. Instead `userAddress`
     * will be automatically determined from the `Signer`.
     */
    readonly userAddress?: string;
    /**
     * Address that will receive ZERO rewards from newly created Stability Deposits by default.
     *
     * @remarks
     * For example
     * {@link EthersLiquity.depositZUSDInStabilityPool | depositZUSDInStabilityPool(amount, frontendTag?)}
     * will tag newly made Stability Deposits with this address when its `frontendTag` parameter is
     * omitted.
     */
    readonly frontendTag?: string;
    /**
     * Create a {@link @liquity/lib-base#LiquityStore} and expose it as the `store` property.
     *
     * @remarks
     * When set to one of the available {@link EthersLiquityStoreOption | options},
     * {@link ReadableEthersLiquity.(connect:2) | ReadableEthersLiquity.connect()} will return a
     * {@link ReadableEthersLiquityWithStore}, while
     * {@link EthersLiquity.(connect:2) | EthersLiquity.connect()} will return an
     * {@link EthersLiquityWithStore}.
     *
     * Note that the store won't start monitoring the blockchain until its
     * {@link @liquity/lib-base#LiquityStore.start | start()} function is called.
     */
    readonly useStore?: EthersLiquityStoreOption;
}
/** @internal */
export declare function _connectByChainId<T>(provider: EthersProvider, signer: EthersSigner | undefined, chainId: number, optionalParams: EthersLiquityConnectionOptionalParams & {
    useStore: T;
}): EthersLiquityConnection & {
    useStore: T;
};
/** @internal */
export declare function _connectByChainId(provider: EthersProvider, signer: EthersSigner | undefined, chainId: number, optionalParams?: EthersLiquityConnectionOptionalParams): EthersLiquityConnection;
/** @internal */
export declare const _connect: (signerOrProvider: EthersSigner | EthersProvider, optionalParams?: EthersLiquityConnectionOptionalParams | undefined) => Promise<EthersLiquityConnection>;
export {};
//# sourceMappingURL=EthersLiquityConnection.d.ts.map