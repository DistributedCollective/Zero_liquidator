import { Decimal, Decimalish } from "./Decimal";
/**
 * Represents the change between two Stability Deposit states.
 *
 * @public
 */
export declare type StabilityDepositChange<T> = {
    depositZUSD: T;
    withdrawZUSD?: undefined;
} | {
    depositZUSD?: undefined;
    withdrawZUSD: T;
    withdrawAllZUSD: boolean;
};
/**
 * A Stability Deposit and its accrued gains.
 *
 * @public
 */
export declare class StabilityDeposit {
    /** Amount of ZUSD in the Stability Deposit at the time of the last direct modification. */
    readonly initialZUSD: Decimal;
    /** Amount of ZUSD left in the Stability Deposit. */
    readonly currentZUSD: Decimal;
    /** Amount of native currency (e.g. Ether) received in exchange for the used-up ZUSD. */
    readonly collateralGain: Decimal;
    /** Amount of ZERO rewarded since the last modification of the Stability Deposit. */
    readonly zeroReward: Decimal;
    /**
     * Address of frontend through which this Stability Deposit was made.
     *
     * @remarks
     * If the Stability Deposit was made through a frontend that doesn't tag deposits, this will be
     * the zero-address.
     */
    readonly frontendTag: string;
    /** @internal */
    constructor(initialZUSD: Decimal, currentZUSD: Decimal, collateralGain: Decimal, zeroReward: Decimal, frontendTag: string);
    get isEmpty(): boolean;
    /** @internal */
    toString(): string;
    /**
     * Compare to another instance of `StabilityDeposit`.
     */
    equals(that: StabilityDeposit): boolean;
    /**
     * Calculate the difference between the `currentZUSD` in this Stability Deposit and `thatZUSD`.
     *
     * @returns An object representing the change, or `undefined` if the deposited amounts are equal.
     */
    whatChanged(thatZUSD: Decimalish): StabilityDepositChange<Decimal> | undefined;
    /**
     * Apply a {@link StabilityDepositChange} to this Stability Deposit.
     *
     * @returns The new deposited ZUSD amount.
     */
    apply(change: StabilityDepositChange<Decimalish> | undefined): Decimal;
}
//# sourceMappingURL=StabilityDeposit.d.ts.map