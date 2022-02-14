import { Decimal } from "./Decimal";
import { StabilityDeposit } from "./StabilityDeposit";
import { Trove, TroveWithPendingRedistribution, UserTrove } from "./Trove";
import { Fees } from "./Fees";
import { ZEROStake } from "./ZEROStake";
import { FrontendStatus } from "./ReadableLiquity";
/**
 * State variables read from the blockchain.
 *
 * @public
 */
export interface LiquityStoreBaseState {
    /** Status of currently used frontend. */
    frontend: FrontendStatus;
    /** Status of user's own frontend. */
    ownFrontend: FrontendStatus;
    /** Number of Troves that are currently open. */
    numberOfTroves: number;
    /** User's native currency balance (e.g. Ether). */
    accountBalance: Decimal;
    /** User's ZUSD token balance. */
    zusdBalance: Decimal;
    /** User's NUE token balance. */
    nueBalance: Decimal;
    /** User's ZERO token balance. */
    zeroBalance: Decimal;
    /**
     * Amount of leftover collateral available for withdrawal to the user.
     *
     * @remarks
     * See {@link ReadableLiquity.getCollateralSurplusBalance | getCollateralSurplusBalance()} for
     * more information.
     */
    collateralSurplusBalance: Decimal;
    /** Current price of the native currency (e.g. Ether) in USD. */
    price: Decimal;
    /** Total amount of ZUSD currently deposited in the Stability Pool. */
    zusdInStabilityPool: Decimal;
    /** Total collateral and debt in the Liquity system. */
    total: Trove;
    /**
     * Total collateral and debt per stake that has been liquidated through redistribution.
     *
     * @remarks
     * Needed when dealing with instances of {@link TroveWithPendingRedistribution}.
     */
    totalRedistributed: Trove;
    /**
     * User's Trove in its state after the last direct modification.
     *
     * @remarks
     * The current state of the user's Trove can be found as
     * {@link LiquityStoreDerivedState.trove | trove}.
     */
    troveBeforeRedistribution: TroveWithPendingRedistribution;
    /** User's stability deposit. */
    stabilityDeposit: StabilityDeposit;
    /** Remaining ZERO that will be collectively rewarded to stability depositors. */
    remainingStabilityPoolZEROReward: Decimal;
    /** @internal */
    _feesInNormalMode: Fees;
    /** User's ZERO stake. */
    zeroStake: ZEROStake;
    /** Total amount of ZERO currently staked. */
    totalStakedZERO: Decimal;
    /** @internal */
    _riskiestTroveBeforeRedistribution: TroveWithPendingRedistribution;
}
/**
 * State variables derived from {@link LiquityStoreBaseState}.
 *
 * @public
 */
export interface LiquityStoreDerivedState {
    /** Current state of user's Trove */
    trove: UserTrove;
    /** Calculator for current fees. */
    fees: Fees;
    /**
     * Current borrowing rate.
     *
     * @remarks
     * A value between 0 and 1.
     *
     * @example
     * For example a value of 0.01 amounts to a borrowing fee of 1% of the borrowed amount.
     */
    borrowingRate: Decimal;
    /**
     * Current redemption rate.
     *
     * @remarks
     * Note that the actual rate paid by a redemption transaction will depend on the amount of ZUSD
     * being redeemed.
     *
     * Use {@link Fees.redemptionRate} to calculate a precise redemption rate.
     */
    redemptionRate: Decimal;
    /**
     * Whether there are any Troves with collateral ratio below the
     * {@link MINIMUM_COLLATERAL_RATIO | minimum}.
     */
    haveUndercollateralizedTroves: boolean;
}
/**
 * Type of {@link LiquityStore}'s {@link LiquityStore.state | state}.
 *
 * @remarks
 * It combines all properties of {@link LiquityStoreBaseState} and {@link LiquityStoreDerivedState}
 * with optional extra state added by the particular `LiquityStore` implementation.
 *
 * The type parameter `T` may be used to type the extra state.
 *
 * @public
 */
export declare type LiquityStoreState<T = unknown> = LiquityStoreBaseState & LiquityStoreDerivedState & T;
/**
 * Parameters passed to {@link LiquityStore} listeners.
 *
 * @remarks
 * Use the {@link LiquityStore.subscribe | subscribe()} function to register a listener.

 * @public
 */
export interface LiquityStoreListenerParams<T = unknown> {
    /** The entire previous state. */
    newState: LiquityStoreState<T>;
    /** The entire new state. */
    oldState: LiquityStoreState<T>;
    /** Only the state variables that have changed. */
    stateChange: Partial<LiquityStoreState<T>>;
}
/**
 * Abstract base class of Liquity data store implementations.
 *
 * @remarks
 * The type parameter `T` may be used to type extra state added to {@link LiquityStoreState} by the
 * subclass.
 *
 * Implemented by {@link @liquity/lib-ethers#BlockPolledLiquityStore}.
 *
 * @public
 */
export declare abstract class LiquityStore<T = unknown> {
    /** Turn console logging on/off. */
    logging: boolean;
    /**
     * Called after the state is fetched for the first time.
     *
     * @remarks
     * See {@link LiquityStore.start | start()}.
     */
    onLoaded?: () => void;
    /** @internal */
    protected _loaded: boolean;
    private _baseState?;
    private _derivedState?;
    private _extraState?;
    private _updateTimeoutId;
    private _listeners;
    /**
     * The current store state.
     *
     * @remarks
     * Should not be accessed before the store is loaded. Assign a function to
     * {@link LiquityStore.onLoaded | onLoaded} to get a callback when this happens.
     *
     * See {@link LiquityStoreState} for the list of properties returned.
     */
    get state(): LiquityStoreState<T>;
    /** @internal */
    protected abstract _doStart(): () => void;
    /**
     * Start monitoring the blockchain for Liquity state changes.
     *
     * @remarks
     * The {@link LiquityStore.onLoaded | onLoaded} callback will be called after the state is fetched
     * for the first time.
     *
     * Use the {@link LiquityStore.subscribe | subscribe()} function to register listeners.
     *
     * @returns Function to stop the monitoring.
     */
    start(): () => void;
    private _cancelUpdateIfScheduled;
    private _scheduleUpdate;
    private _logUpdate;
    private _updateIfChanged;
    private _silentlyUpdateIfChanged;
    private _updateFees;
    private _reduce;
    private _derive;
    private _reduceDerived;
    /** @internal */
    protected abstract _reduceExtra(extraState: T, extraStateUpdate: Partial<T>): T;
    private _notify;
    /**
     * Register a state change listener.
     *
     * @param listener - Function that will be called whenever state changes.
     * @returns Function to unregister this listener.
     */
    subscribe(listener: (params: LiquityStoreListenerParams<T>) => void): () => void;
    /** @internal */
    protected _load(baseState: LiquityStoreBaseState, extraState?: T): void;
    /** @internal */
    protected _update(baseStateUpdate?: Partial<LiquityStoreBaseState>, extraStateUpdate?: Partial<T>): void;
}
//# sourceMappingURL=LiquityStore.d.ts.map