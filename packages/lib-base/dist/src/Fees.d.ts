import { Decimal, Decimalish } from "./Decimal";
/**
 * Calculator for fees.
 *
 * @remarks
 * Returned by the {@link ReadableLiquity.getFees | getFees()} function.
 *
 * @public
 */
export declare class Fees {
    private readonly _baseRateWithoutDecay;
    private readonly _minuteDecayFactor;
    private readonly _beta;
    private readonly _lastFeeOperation;
    private readonly _timeOfLatestBlock;
    private readonly _recoveryMode;
    /** @internal */
    constructor(baseRateWithoutDecay: Decimalish, minuteDecayFactor: Decimalish, beta: Decimalish, lastFeeOperation: Date, timeOfLatestBlock: Date, recoveryMode: boolean);
    /** @internal */
    _setRecoveryMode(recoveryMode: boolean): Fees;
    /**
     * Compare to another instance of `Fees`.
     */
    equals(that: Fees): boolean;
    /** @internal */
    toString(): string;
    /** @internal */
    baseRate(when?: Date): Decimal;
    /**
     * Calculate the current borrowing rate.
     *
     * @param when - Optional timestamp that can be used to calculate what the borrowing rate would
     *               decay to at a point of time in the future.
     *
     * @remarks
     * By default, the fee is calculated at the time of the latest block. This can be overridden using
     * the `when` parameter.
     *
     * To calculate the borrowing fee in ZUSD, multiply the borrowed ZUSD amount by the borrowing rate.
     *
     * @example
     * ```typescript
     * const fees = await liquity.getFees();
     *
     * const borrowedZUSDAmount = 100;
     * const borrowingRate = fees.borrowingRate();
     * const borrowingFeeZUSD = borrowingRate.mul(borrowedZUSDAmount);
     * ```
     */
    borrowingRate(when?: Date): Decimal;
    /**
     * Calculate the current redemption rate.
     *
     * @param redeemedFractionOfSupply - The amount of ZUSD being redeemed divided by the total supply.
     * @param when - Optional timestamp that can be used to calculate what the redemption rate would
     *               decay to at a point of time in the future.
     *
     * @remarks
     * By default, the fee is calculated at the time of the latest block. This can be overridden using
     * the `when` parameter.
  
     * Unlike the borrowing rate, the redemption rate depends on the amount being redeemed. To be more
     * precise, it depends on the fraction of the redeemed amount compared to the total ZUSD supply,
     * which must be passed as a parameter.
     *
     * To calculate the redemption fee in ZUSD, multiply the redeemed ZUSD amount with the redemption
     * rate.
     *
     * @example
     * ```typescript
     * const fees = await liquity.getFees();
     * const total = await liquity.getTotal();
     *
     * const redeemedZUSDAmount = Decimal.from(100);
     * const redeemedFractionOfSupply = redeemedZUSDAmount.div(total.debt);
     * const redemptionRate = fees.redemptionRate(redeemedFractionOfSupply);
     * const redemptionFeeZUSD = redemptionRate.mul(redeemedZUSDAmount);
     * ```
     */
    redemptionRate(redeemedFractionOfSupply?: Decimalish, when?: Date): Decimal;
}
//# sourceMappingURL=Fees.d.ts.map