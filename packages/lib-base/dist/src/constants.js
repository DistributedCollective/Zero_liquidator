"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINIMUM_REDEMPTION_RATE = exports.MAXIMUM_BORROWING_RATE = exports.MINIMUM_BORROWING_RATE = exports.ZUSD_MINIMUM_DEBT = exports.ZUSD_MINIMUM_NET_DEBT = exports.ZUSD_LIQUIDATION_RESERVE = exports.MINIMUM_COLLATERAL_RATIO = exports.CRITICAL_COLLATERAL_RATIO = void 0;
const Decimal_1 = require("./Decimal");
/**
 * Total collateral ratio below which recovery mode is triggered.
 *
 * @public
 */
exports.CRITICAL_COLLATERAL_RATIO = Decimal_1.Decimal.from(1.5);
/**
 * Collateral ratio below which a Trove can be liquidated in normal mode.
 *
 * @public
 */
exports.MINIMUM_COLLATERAL_RATIO = Decimal_1.Decimal.from(1.1);
/**
 * Amount of ZUSD that's reserved for compensating the liquidator of a Trove.
 *
 * @public
 */
exports.ZUSD_LIQUIDATION_RESERVE = Decimal_1.Decimal.from(20);
/**
 * A Trove must always have at least this much debt on top of the
 * {@link ZUSD_LIQUIDATION_RESERVE | liquidation reserve}.
 *
 * @remarks
 * Any transaction that would result in a Trove with less net debt than this will be reverted.
 *
 * @public
 */
exports.ZUSD_MINIMUM_NET_DEBT = Decimal_1.Decimal.from(180);
/**
 * A Trove must always have at least this much debt.
 *
 * @remarks
 * Any transaction that would result in a Trove with less debt than this will be reverted.
 *
 * @public
 */
exports.ZUSD_MINIMUM_DEBT = exports.ZUSD_LIQUIDATION_RESERVE.add(exports.ZUSD_MINIMUM_NET_DEBT);
/**
 * Value that the {@link Fees.borrowingRate | borrowing rate} will never decay below.
 *
 * @remarks
 * Note that the borrowing rate can still be lower than this during recovery mode, when it's
 * overridden by zero.
 *
 * @public
 */
exports.MINIMUM_BORROWING_RATE = Decimal_1.Decimal.from(0.005);
/**
 * Value that the {@link Fees.borrowingRate | borrowing rate} will never exceed.
 *
 * @public
 */
exports.MAXIMUM_BORROWING_RATE = Decimal_1.Decimal.from(0.05);
/**
 * Value that the {@link Fees.redemptionRate | redemption rate} will never decay below.
 *
 * @public
 */
exports.MINIMUM_REDEMPTION_RATE = Decimal_1.Decimal.from(0.005);
//# sourceMappingURL=constants.js.map