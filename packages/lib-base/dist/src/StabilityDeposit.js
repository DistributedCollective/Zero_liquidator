"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StabilityDeposit = void 0;
const Decimal_1 = require("./Decimal");
/**
 * A Stability Deposit and its accrued gains.
 *
 * @public
 */
class StabilityDeposit {
    /** @internal */
    constructor(initialZUSD, currentZUSD, collateralGain, zeroReward, frontendTag) {
        this.initialZUSD = initialZUSD;
        this.currentZUSD = currentZUSD;
        this.collateralGain = collateralGain;
        this.zeroReward = zeroReward;
        this.frontendTag = frontendTag;
        if (this.currentZUSD.gt(this.initialZUSD)) {
            throw new Error("currentZUSD can't be greater than initialZUSD");
        }
    }
    get isEmpty() {
        return (this.initialZUSD.isZero &&
            this.currentZUSD.isZero &&
            this.collateralGain.isZero &&
            this.zeroReward.isZero);
    }
    /** @internal */
    toString() {
        return (`{ initialZUSD: ${this.initialZUSD}` +
            `, currentZUSD: ${this.currentZUSD}` +
            `, collateralGain: ${this.collateralGain}` +
            `, zeroReward: ${this.zeroReward}` +
            `, frontendTag: "${this.frontendTag}" }`);
    }
    /**
     * Compare to another instance of `StabilityDeposit`.
     */
    equals(that) {
        return (this.initialZUSD.eq(that.initialZUSD) &&
            this.currentZUSD.eq(that.currentZUSD) &&
            this.collateralGain.eq(that.collateralGain) &&
            this.zeroReward.eq(that.zeroReward) &&
            this.frontendTag === that.frontendTag);
    }
    /**
     * Calculate the difference between the `currentZUSD` in this Stability Deposit and `thatZUSD`.
     *
     * @returns An object representing the change, or `undefined` if the deposited amounts are equal.
     */
    whatChanged(thatZUSD) {
        thatZUSD = Decimal_1.Decimal.from(thatZUSD);
        if (thatZUSD.lt(this.currentZUSD)) {
            return { withdrawZUSD: this.currentZUSD.sub(thatZUSD), withdrawAllZUSD: thatZUSD.isZero };
        }
        if (thatZUSD.gt(this.currentZUSD)) {
            return { depositZUSD: thatZUSD.sub(this.currentZUSD) };
        }
    }
    /**
     * Apply a {@link StabilityDepositChange} to this Stability Deposit.
     *
     * @returns The new deposited ZUSD amount.
     */
    apply(change) {
        if (!change) {
            return this.currentZUSD;
        }
        if (change.withdrawZUSD !== undefined) {
            return change.withdrawAllZUSD || this.currentZUSD.lte(change.withdrawZUSD)
                ? Decimal_1.Decimal.ZERO
                : this.currentZUSD.sub(change.withdrawZUSD);
        }
        else {
            return this.currentZUSD.add(change.depositZUSD);
        }
    }
}
exports.StabilityDeposit = StabilityDeposit;
//# sourceMappingURL=StabilityDeposit.js.map