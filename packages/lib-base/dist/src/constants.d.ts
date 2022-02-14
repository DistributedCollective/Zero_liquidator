import { Decimal } from "./Decimal";
/**
 * Total collateral ratio below which recovery mode is triggered.
 *
 * @public
 */
export declare const CRITICAL_COLLATERAL_RATIO: Decimal;
/**
 * Collateral ratio below which a Trove can be liquidated in normal mode.
 *
 * @public
 */
export declare const MINIMUM_COLLATERAL_RATIO: Decimal;
/**
 * Amount of ZUSD that's reserved for compensating the liquidator of a Trove.
 *
 * @public
 */
export declare const ZUSD_LIQUIDATION_RESERVE: Decimal;
/**
 * A Trove must always have at least this much debt on top of the
 * {@link ZUSD_LIQUIDATION_RESERVE | liquidation reserve}.
 *
 * @remarks
 * Any transaction that would result in a Trove with less net debt than this will be reverted.
 *
 * @public
 */
export declare const ZUSD_MINIMUM_NET_DEBT: Decimal;
/**
 * A Trove must always have at least this much debt.
 *
 * @remarks
 * Any transaction that would result in a Trove with less debt than this will be reverted.
 *
 * @public
 */
export declare const ZUSD_MINIMUM_DEBT: Decimal;
/**
 * Value that the {@link Fees.borrowingRate | borrowing rate} will never decay below.
 *
 * @remarks
 * Note that the borrowing rate can still be lower than this during recovery mode, when it's
 * overridden by zero.
 *
 * @public
 */
export declare const MINIMUM_BORROWING_RATE: Decimal;
/**
 * Value that the {@link Fees.borrowingRate | borrowing rate} will never exceed.
 *
 * @public
 */
export declare const MAXIMUM_BORROWING_RATE: Decimal;
/**
 * Value that the {@link Fees.redemptionRate | redemption rate} will never decay below.
 *
 * @public
 */
export declare const MINIMUM_REDEMPTION_RATE: Decimal;
//# sourceMappingURL=constants.d.ts.map