"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZEROStake = void 0;
const Decimal_1 = require("./Decimal");
/**
 * Represents a user's ZERO stake and accrued gains.
 *
 * @remarks
 * Returned by the {@link ReadableLiquity.getZEROStake | getZEROStake()} function.

 * @public
 */
class ZEROStake {
    /** @internal */
    constructor(stakedZERO = Decimal_1.Decimal.ZERO, collateralGain = Decimal_1.Decimal.ZERO, zusdGain = Decimal_1.Decimal.ZERO) {
        this.stakedZERO = stakedZERO;
        this.collateralGain = collateralGain;
        this.zusdGain = zusdGain;
    }
    get isEmpty() {
        return this.stakedZERO.isZero && this.collateralGain.isZero && this.zusdGain.isZero;
    }
    /** @internal */
    toString() {
        return (`{ stakedZERO: ${this.stakedZERO}` +
            `, collateralGain: ${this.collateralGain}` +
            `, zusdGain: ${this.zusdGain} }`);
    }
    /**
     * Compare to another instance of `ZEROStake`.
     */
    equals(that) {
        return (this.stakedZERO.eq(that.stakedZERO) &&
            this.collateralGain.eq(that.collateralGain) &&
            this.zusdGain.eq(that.zusdGain));
    }
    /**
     * Calculate the difference between this `ZEROStake` and `thatStakedZERO`.
     *
     * @returns An object representing the change, or `undefined` if the staked amounts are equal.
     */
    whatChanged(thatStakedZERO) {
        thatStakedZERO = Decimal_1.Decimal.from(thatStakedZERO);
        if (thatStakedZERO.lt(this.stakedZERO)) {
            return {
                unstakeZERO: this.stakedZERO.sub(thatStakedZERO),
                unstakeAllZERO: thatStakedZERO.isZero
            };
        }
        if (thatStakedZERO.gt(this.stakedZERO)) {
            return { stakeZERO: thatStakedZERO.sub(this.stakedZERO) };
        }
    }
    /**
     * Apply a {@link ZEROStakeChange} to this `ZEROStake`.
     *
     * @returns The new staked ZERO amount.
     */
    apply(change) {
        if (!change) {
            return this.stakedZERO;
        }
        if (change.unstakeZERO !== undefined) {
            return change.unstakeAllZERO || this.stakedZERO.lte(change.unstakeZERO)
                ? Decimal_1.Decimal.ZERO
                : this.stakedZERO.sub(change.unstakeZERO);
        }
        else {
            return this.stakedZERO.add(change.stakeZERO);
        }
    }
}
exports.ZEROStake = ZEROStake;
//# sourceMappingURL=ZEROStake.js.map