import { Decimal, Decimalish } from "./Decimal";
/** @internal */ export declare type _CollateralDeposit<T> = {
    depositCollateral: T;
};
/** @internal */ export declare type _CollateralWithdrawal<T> = {
    withdrawCollateral: T;
};
/** @internal */ export declare type _ZUSDBorrowing<T> = {
    borrowZUSD: T;
};
/** @internal */ export declare type _ZUSDRepayment<T> = {
    repayZUSD: T;
};
/** @internal */ export declare type _NoCollateralDeposit = Partial<_CollateralDeposit<undefined>>;
/** @internal */ export declare type _NoCollateralWithdrawal = Partial<_CollateralWithdrawal<undefined>>;
/** @internal */ export declare type _NoZUSDBorrowing = Partial<_ZUSDBorrowing<undefined>>;
/** @internal */ export declare type _NoZUSDRepayment = Partial<_ZUSDRepayment<undefined>>;
/** @internal */
export declare type _CollateralChange<T> = (_CollateralDeposit<T> & _NoCollateralWithdrawal) | (_CollateralWithdrawal<T> & _NoCollateralDeposit);
/** @internal */
export declare type _NoCollateralChange = _NoCollateralDeposit & _NoCollateralWithdrawal;
/** @internal */
export declare type _DebtChange<T> = (_ZUSDBorrowing<T> & _NoZUSDRepayment) | (_ZUSDRepayment<T> & _NoZUSDBorrowing);
/** @internal */
export declare type _NoDebtChange = _NoZUSDBorrowing & _NoZUSDRepayment;
/**
 * Parameters of an {@link TransactableLiquity.openTrove | openTrove()} transaction.
 *
 * @remarks
 * The type parameter `T` specifies the allowed value type(s) of the particular `TroveCreationParams`
 * object's properties.
 *
 * <h2>Properties</h2>
 *
 * <table>
 *
 *   <tr>
 *     <th> Property </th>
 *     <th> Type </th>
 *     <th> Description </th>
 *   </tr>
 *
 *   <tr>
 *     <td> depositCollateral </td>
 *     <td> T </td>
 *     <td> The amount of collateral that's deposited. </td>
 *   </tr>
 *
 *   <tr>
 *     <td> borrowZUSD </td>
 *     <td> T </td>
 *     <td> The amount of ZUSD that's borrowed. </td>
 *   </tr>
 *
 * </table>
 *
 * @public
 */
export declare type TroveCreationParams<T = unknown> = _CollateralDeposit<T> & _NoCollateralWithdrawal & _ZUSDBorrowing<T> & _NoZUSDRepayment;
/**
 * Parameters of a {@link TransactableLiquity.closeTrove | closeTrove()} transaction.
 *
 * @remarks
 * The type parameter `T` specifies the allowed value type(s) of the particular `TroveClosureParams`
 * object's properties.
 *
 * <h2>Properties</h2>
 *
 * <table>
 *
 *   <tr>
 *     <th> Property </th>
 *     <th> Type </th>
 *     <th> Description </th>
 *   </tr>
 *
 *   <tr>
 *     <td> withdrawCollateral </td>
 *     <td> T </td>
 *     <td> The amount of collateral that's withdrawn. </td>
 *   </tr>
 *
 *   <tr>
 *     <td> repayZUSD? </td>
 *     <td> T </td>
 *     <td> <i>(Optional)</i> The amount of ZUSD that's repaid. </td>
 *   </tr>
 *
 * </table>
 *
 * @public
 */
export declare type TroveClosureParams<T> = _CollateralWithdrawal<T> & _NoCollateralDeposit & Partial<_ZUSDRepayment<T>> & _NoZUSDBorrowing;
/**
 * Parameters of an {@link TransactableLiquity.adjustTrove | adjustTrove()} transaction.
 *
 * @remarks
 * The type parameter `T` specifies the allowed value type(s) of the particular
 * `TroveAdjustmentParams` object's properties.
 *
 * Even though all properties are optional, a valid `TroveAdjustmentParams` object must define at
 * least one.
 *
 * Defining both `depositCollateral` and `withdrawCollateral`, or both `borrowZUSD` and `repayZUSD`
 * at the same time is disallowed, and will result in a type-checking error.
 *
 * <h2>Properties</h2>
 *
 * <table>
 *
 *   <tr>
 *     <th> Property </th>
 *     <th> Type </th>
 *     <th> Description </th>
 *   </tr>
 *
 *   <tr>
 *     <td> depositCollateral? </td>
 *     <td> T </td>
 *     <td> <i>(Optional)</i> The amount of collateral that's deposited. </td>
 *   </tr>
 *
 *   <tr>
 *     <td> withdrawCollateral? </td>
 *     <td> T </td>
 *     <td> <i>(Optional)</i> The amount of collateral that's withdrawn. </td>
 *   </tr>
 *
 *   <tr>
 *     <td> borrowZUSD? </td>
 *     <td> T </td>
 *     <td> <i>(Optional)</i> The amount of ZUSD that's borrowed. </td>
 *   </tr>
 *
 *   <tr>
 *     <td> repayZUSD? </td>
 *     <td> T </td>
 *     <td> <i>(Optional)</i> The amount of ZUSD that's repaid. </td>
 *   </tr>
 *
 * </table>
 *
 * @public
 */
export declare type TroveAdjustmentParams<T = unknown> = (_CollateralChange<T> & _NoDebtChange) | (_DebtChange<T> & _NoCollateralChange) | (_CollateralChange<T> & _DebtChange<T>);
/**
 * Describes why a Trove could not be created.
 *
 * @remarks
 * See {@link TroveChange}.
 *
 * <h2>Possible values</h2>
 *
 * <table>
 *
 *   <tr>
 *     <th> Value </th>
 *     <th> Reason </th>
 *   </tr>
 *
 *   <tr>
 *     <td> "missingLiquidationReserve" </td>
 *     <td> A Trove's debt cannot be less than the liquidation reserve. </td>
 *   </tr>
 *
 * </table>
 *
 * More errors may be added in the future.
 *
 * @public
 */
export declare type TroveCreationError = "missingLiquidationReserve";
/**
 * Represents the change between two Trove states.
 *
 * @remarks
 * Returned by {@link Trove.whatChanged}.
 *
 * Passed as a parameter to {@link Trove.apply}.
 *
 * @public
 */
export declare type TroveChange<T> = {
    type: "invalidCreation";
    invalidTrove: Trove;
    error: TroveCreationError;
} | {
    type: "creation";
    params: TroveCreationParams<T>;
} | {
    type: "closure";
    params: TroveClosureParams<T>;
} | {
    type: "adjustment";
    params: TroveAdjustmentParams<T>;
    setToZero?: "collateral" | "debt";
};
/** @internal */
export declare const _normalizeTroveCreation: (params: Record<string, Decimalish | undefined>) => TroveCreationParams<Decimal>;
/** @internal */
export declare const _normalizeTroveAdjustment: (params: Record<string, Decimalish | undefined>) => TroveAdjustmentParams<Decimal>;
/**
 * A combination of collateral and debt.
 *
 * @public
 */
export declare class Trove {
    /** Amount of native currency (e.g. Ether) collateralized. */
    readonly collateral: Decimal;
    /** Amount of ZUSD owed. */
    readonly debt: Decimal;
    /** @internal */
    constructor(collateral?: Decimal, debt?: Decimal);
    get isEmpty(): boolean;
    /**
     * Amount of ZUSD that must be repaid to close this Trove.
     *
     * @remarks
     * This doesn't include the liquidation reserve, which is refunded in case of normal closure.
     */
    get netDebt(): Decimal;
    /** @internal */
    get _nominalCollateralRatio(): Decimal;
    /** Calculate the Trove's collateralization ratio at a given price. */
    collateralRatio(price: Decimalish): Decimal;
    /**
     * Whether the Trove is undercollateralized at a given price.
     *
     * @returns
     * `true` if the Trove's collateralization ratio is less than the
     * {@link MINIMUM_COLLATERAL_RATIO}.
     */
    collateralRatioIsBelowMinimum(price: Decimalish): boolean;
    /**
     * Whether the collateralization ratio is less than the {@link CRITICAL_COLLATERAL_RATIO} at a
     * given price.
     *
     * @example
     * Can be used to check whether the Liquity protocol is in recovery mode by using it on the return
     * value of {@link ReadableLiquity.getTotal | getTotal()}. For example:
     *
     * ```typescript
     * const total = await liquity.getTotal();
     * const price = await liquity.getPrice();
     *
     * if (total.collateralRatioIsBelowCritical(price)) {
     *   // Recovery mode is active
     * }
     * ```
     */
    collateralRatioIsBelowCritical(price: Decimalish): boolean;
    /** Whether the Trove is sufficiently collateralized to be opened during recovery mode. */
    isOpenableInRecoveryMode(price: Decimalish): boolean;
    /** @internal */
    toString(): string;
    equals(that: Trove): boolean;
    add(that: Trove): Trove;
    addCollateral(collateral: Decimalish): Trove;
    addDebt(debt: Decimalish): Trove;
    subtract(that: Trove): Trove;
    subtractCollateral(collateral: Decimalish): Trove;
    subtractDebt(debt: Decimalish): Trove;
    multiply(multiplier: Decimalish): Trove;
    setCollateral(collateral: Decimalish): Trove;
    setDebt(debt: Decimalish): Trove;
    private _debtChange;
    private _collateralChange;
    /**
     * Calculate the difference between this Trove and another.
     *
     * @param that - The other Trove.
     * @param borrowingRate - Borrowing rate to use when calculating a borrowed amount.
     *
     * @returns
     * An object representing the change, or `undefined` if the Troves are equal.
     */
    whatChanged(that: Trove, borrowingRate?: Decimalish): TroveChange<Decimal> | undefined;
    /**
     * Make a new Trove by applying a {@link TroveChange} to this Trove.
     *
     * @param change - The change to apply.
     * @param borrowingRate - Borrowing rate to use when adding a borrowed amount to the Trove's debt.
     */
    apply(change: TroveChange<Decimal> | undefined, borrowingRate?: Decimalish): Trove;
    /**
     * Calculate the result of an {@link TransactableLiquity.openTrove | openTrove()} transaction.
     *
     * @param params - Parameters of the transaction.
     * @param borrowingRate - Borrowing rate to use when calculating the Trove's debt.
     */
    static create(params: TroveCreationParams<Decimalish>, borrowingRate?: Decimalish): Trove;
    /**
     * Calculate the parameters of an {@link TransactableLiquity.openTrove | openTrove()} transaction
     * that will result in the given Trove.
     *
     * @param that - The Trove to recreate.
     * @param borrowingRate - Current borrowing rate.
     */
    static recreate(that: Trove, borrowingRate?: Decimalish): TroveCreationParams<Decimal>;
    /**
     * Calculate the result of an {@link TransactableLiquity.adjustTrove | adjustTrove()} transaction
     * on this Trove.
     *
     * @param params - Parameters of the transaction.
     * @param borrowingRate - Borrowing rate to use when adding to the Trove's debt.
     */
    adjust(params: TroveAdjustmentParams<Decimalish>, borrowingRate?: Decimalish): Trove;
    /**
     * Calculate the parameters of an {@link TransactableLiquity.adjustTrove | adjustTrove()}
     * transaction that will change this Trove into the given Trove.
     *
     * @param that - The desired result of the transaction.
     * @param borrowingRate - Current borrowing rate.
     */
    adjustTo(that: Trove, borrowingRate?: Decimalish): TroveAdjustmentParams<Decimal>;
}
/** @internal */
export declare const _emptyTrove: Trove;
/**
 * Represents whether a UserTrove is open or not, or why it was closed.
 *
 * @public
 */
export declare type UserTroveStatus = "nonExistent" | "open" | "closedByOwner" | "closedByLiquidation" | "closedByRedemption";
/**
 * A Trove that is associated with a single owner.
 *
 * @remarks
 * The SDK uses the base {@link Trove} class as a generic container of collateral and debt, for
 * example to represent the {@link ReadableLiquity.getTotal | total collateral and debt} locked up
 * in the protocol.
 *
 * The `UserTrove` class extends `Trove` with extra information that's only available for Troves
 * that are associated with a single owner (such as the owner's address, or the Trove's status).
 *
 * @public
 */
export declare class UserTrove extends Trove {
    /** Address that owns this Trove. */
    readonly ownerAddress: string;
    /** Provides more information when the UserTrove is empty. */
    readonly status: UserTroveStatus;
    /** @internal */
    constructor(ownerAddress: string, status: UserTroveStatus, collateral?: Decimal, debt?: Decimal);
    equals(that: UserTrove): boolean;
    /** @internal */
    toString(): string;
}
/**
 * A Trove in its state after the last direct modification.
 *
 * @remarks
 * The Trove may have received collateral and debt shares from liquidations since then.
 * Use {@link TroveWithPendingRedistribution.applyRedistribution | applyRedistribution()} to
 * calculate the Trove's most up-to-date state.
 *
 * @public
 */
export declare class TroveWithPendingRedistribution extends UserTrove {
    private readonly stake;
    private readonly snapshotOfTotalRedistributed;
    /** @internal */
    constructor(ownerAddress: string, status: UserTroveStatus, collateral?: Decimal, debt?: Decimal, stake?: Decimal, snapshotOfTotalRedistributed?: Trove);
    applyRedistribution(totalRedistributed: Trove): UserTrove;
    equals(that: TroveWithPendingRedistribution): boolean;
}
//# sourceMappingURL=Trove.d.ts.map