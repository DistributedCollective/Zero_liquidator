import { LiquityStoreState, LiquityStore } from "@liquity/lib-base";
import { ReadableEthersLiquity } from "./ReadableEthersLiquity";
import { EthersLiquityConnection } from "./EthersLiquityConnection";
/**
 * Extra state added to {@link @liquity/lib-base#LiquityStoreState} by
 * {@link BlockPolledLiquityStore}.
 *
 * @public
 */
export interface BlockPolledLiquityStoreExtraState {
    /**
     * Number of block that the store state was fetched from.
     *
     * @remarks
     * May be undefined when the store state is fetched for the first time.
     */
    blockTag?: number;
    /**
     * Timestamp of latest block (number of seconds since epoch).
     */
    blockTimestamp: number;
}
/**
 * The type of {@link BlockPolledLiquityStore}'s
 * {@link @liquity/lib-base#LiquityStore.state | state}.
 *
 * @public
 */
export declare type BlockPolledLiquityStoreState = LiquityStoreState<BlockPolledLiquityStoreExtraState>;
/**
 * Ethers-based {@link @liquity/lib-base#LiquityStore} that updates state whenever there's a new
 * block.
 *
 * @public
 */
export declare class BlockPolledLiquityStore extends LiquityStore<BlockPolledLiquityStoreExtraState> {
    readonly connection: EthersLiquityConnection;
    private readonly _readable;
    private readonly _provider;
    constructor(readable: ReadableEthersLiquity);
    private _getRiskiestTroveBeforeRedistribution;
    private _get;
    /** @internal @override */
    protected _doStart(): () => void;
    /** @internal @override */
    protected _reduceExtra(oldState: BlockPolledLiquityStoreExtraState, stateUpdate: Partial<BlockPolledLiquityStoreExtraState>): BlockPolledLiquityStoreExtraState;
}
//# sourceMappingURL=BlockPolledLiquityStore.d.ts.map