import { Decimal, Decimalish } from "./Decimal";
/**
 * Represents the change between two states of an ZERO Stake.
 *
 * @public
 */
export declare type ZEROStakeChange<T> = {
    stakeZERO: T;
    unstakeZERO?: undefined;
} | {
    stakeZERO?: undefined;
    unstakeZERO: T;
    unstakeAllZERO: boolean;
};
/**
 * Represents a user's ZERO stake and accrued gains.
 *
 * @remarks
 * Returned by the {@link ReadableLiquity.getZEROStake | getZEROStake()} function.

 * @public
 */
export declare class ZEROStake {
    /** The amount of ZERO that's staked. */
    readonly stakedZERO: Decimal;
    /** Collateral gain available to withdraw. */
    readonly collateralGain: Decimal;
    /** ZUSD gain available to withdraw. */
    readonly zusdGain: Decimal;
    /** @internal */
    constructor(stakedZERO?: Decimal, collateralGain?: Decimal, zusdGain?: Decimal);
    get isEmpty(): boolean;
    /** @internal */
    toString(): string;
    /**
     * Compare to another instance of `ZEROStake`.
     */
    equals(that: ZEROStake): boolean;
    /**
     * Calculate the difference between this `ZEROStake` and `thatStakedZERO`.
     *
     * @returns An object representing the change, or `undefined` if the staked amounts are equal.
     */
    whatChanged(thatStakedZERO: Decimalish): ZEROStakeChange<Decimal> | undefined;
    /**
     * Apply a {@link ZEROStakeChange} to this `ZEROStake`.
     *
     * @returns The new staked ZERO amount.
     */
    apply(change: ZEROStakeChange<Decimalish> | undefined): Decimal;
}
//# sourceMappingURL=ZEROStake.d.ts.map