"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TroveWithPendingRedistribution = exports.UserTrove = exports._emptyTrove = exports.Trove = exports._normalizeTroveAdjustment = exports._normalizeTroveCreation = void 0;
const assert_1 = __importDefault(require("assert"));
const Decimal_1 = require("./Decimal");
const constants_1 = require("./constants");
const invalidTroveCreation = (invalidTrove, error) => ({
    type: "invalidCreation",
    invalidTrove,
    error
});
const troveCreation = (params) => ({
    type: "creation",
    params
});
const troveClosure = (params) => ({
    type: "closure",
    params
});
const troveAdjustment = (params, setToZero) => ({
    type: "adjustment",
    params,
    setToZero
});
const valueIsDefined = (entry) => entry[1] !== undefined;
const allowedTroveCreationKeys = [
    "depositCollateral",
    "borrowZUSD"
];
function checkAllowedTroveCreationKeys(entries) {
    const badKeys = entries
        .filter(([k]) => !allowedTroveCreationKeys.includes(k))
        .map(([k]) => `'${k}'`);
    if (badKeys.length > 0) {
        throw new Error(`TroveCreationParams: property ${badKeys.join(", ")} not allowed`);
    }
}
const troveCreationParamsFromEntries = (entries) => {
    const params = Object.fromEntries(entries);
    const missingKeys = allowedTroveCreationKeys.filter(k => !(k in params)).map(k => `'${k}'`);
    if (missingKeys.length > 0) {
        throw new Error(`TroveCreationParams: property ${missingKeys.join(", ")} missing`);
    }
    return params;
};
const decimalize = ([k, v]) => [k, Decimal_1.Decimal.from(v)];
const nonZero = ([, v]) => !v.isZero;
/** @internal */
const _normalizeTroveCreation = (params) => {
    const definedEntries = Object.entries(params).filter(valueIsDefined);
    checkAllowedTroveCreationKeys(definedEntries);
    const nonZeroEntries = definedEntries.map(decimalize);
    return troveCreationParamsFromEntries(nonZeroEntries);
};
exports._normalizeTroveCreation = _normalizeTroveCreation;
const allowedTroveAdjustmentKeys = [
    "depositCollateral",
    "withdrawCollateral",
    "borrowZUSD",
    "repayZUSD"
];
function checkAllowedTroveAdjustmentKeys(entries) {
    const badKeys = entries
        .filter(([k]) => !allowedTroveAdjustmentKeys.includes(k))
        .map(([k]) => `'${k}'`);
    if (badKeys.length > 0) {
        throw new Error(`TroveAdjustmentParams: property ${badKeys.join(", ")} not allowed`);
    }
}
const collateralChangeFrom = ({ depositCollateral, withdrawCollateral }) => {
    if (depositCollateral !== undefined && withdrawCollateral !== undefined) {
        throw new Error("TroveAdjustmentParams: 'depositCollateral' and 'withdrawCollateral' " +
            "can't be present at the same time");
    }
    if (depositCollateral !== undefined) {
        return { depositCollateral };
    }
    if (withdrawCollateral !== undefined) {
        return { withdrawCollateral };
    }
};
const debtChangeFrom = ({ borrowZUSD, repayZUSD }) => {
    if (borrowZUSD !== undefined && repayZUSD !== undefined) {
        throw new Error("TroveAdjustmentParams: 'borrowZUSD' and 'repayZUSD' can't be present at the same time");
    }
    if (borrowZUSD !== undefined) {
        return { borrowZUSD };
    }
    if (repayZUSD !== undefined) {
        return { repayZUSD };
    }
};
const troveAdjustmentParamsFromEntries = (entries) => {
    const params = Object.fromEntries(entries);
    const collateralChange = collateralChangeFrom(params);
    const debtChange = debtChangeFrom(params);
    if (collateralChange !== undefined && debtChange !== undefined) {
        return { ...collateralChange, ...debtChange };
    }
    if (collateralChange !== undefined) {
        return collateralChange;
    }
    if (debtChange !== undefined) {
        return debtChange;
    }
    throw new Error("TroveAdjustmentParams: must include at least one non-zero parameter");
};
/** @internal */
const _normalizeTroveAdjustment = (params) => {
    const definedEntries = Object.entries(params).filter(valueIsDefined);
    checkAllowedTroveAdjustmentKeys(definedEntries);
    const nonZeroEntries = definedEntries.map(decimalize).filter(nonZero);
    return troveAdjustmentParamsFromEntries(nonZeroEntries);
};
exports._normalizeTroveAdjustment = _normalizeTroveAdjustment;
const applyFee = (borrowingRate, debtIncrease) => debtIncrease.mul(Decimal_1.Decimal.ONE.add(borrowingRate));
const unapplyFee = (borrowingRate, debtIncrease) => debtIncrease._divCeil(Decimal_1.Decimal.ONE.add(borrowingRate));
const NOMINAL_COLLATERAL_RATIO_PRECISION = Decimal_1.Decimal.from(100);
/**
 * A combination of collateral and debt.
 *
 * @public
 */
class Trove {
    /** @internal */
    constructor(collateral = Decimal_1.Decimal.ZERO, debt = Decimal_1.Decimal.ZERO) {
        this.collateral = collateral;
        this.debt = debt;
    }
    get isEmpty() {
        return this.collateral.isZero && this.debt.isZero;
    }
    /**
     * Amount of ZUSD that must be repaid to close this Trove.
     *
     * @remarks
     * This doesn't include the liquidation reserve, which is refunded in case of normal closure.
     */
    get netDebt() {
        if (this.debt.lt(constants_1.ZUSD_LIQUIDATION_RESERVE)) {
            throw new Error(`netDebt should not be used when debt < ${constants_1.ZUSD_LIQUIDATION_RESERVE}`);
        }
        return this.debt.sub(constants_1.ZUSD_LIQUIDATION_RESERVE);
    }
    /** @internal */
    get _nominalCollateralRatio() {
        return this.collateral.mulDiv(NOMINAL_COLLATERAL_RATIO_PRECISION, this.debt);
    }
    /** Calculate the Trove's collateralization ratio at a given price. */
    collateralRatio(price) {
        return this.collateral.mulDiv(price, this.debt);
    }
    /**
     * Whether the Trove is undercollateralized at a given price.
     *
     * @returns
     * `true` if the Trove's collateralization ratio is less than the
     * {@link MINIMUM_COLLATERAL_RATIO}.
     */
    collateralRatioIsBelowMinimum(price) {
        return this.collateralRatio(price).lt(constants_1.MINIMUM_COLLATERAL_RATIO);
    }
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
    collateralRatioIsBelowCritical(price) {
        return this.collateralRatio(price).lt(constants_1.CRITICAL_COLLATERAL_RATIO);
    }
    /** Whether the Trove is sufficiently collateralized to be opened during recovery mode. */
    isOpenableInRecoveryMode(price) {
        return this.collateralRatio(price).gte(constants_1.CRITICAL_COLLATERAL_RATIO);
    }
    /** @internal */
    toString() {
        return `{ collateral: ${this.collateral}, debt: ${this.debt} }`;
    }
    equals(that) {
        return this.collateral.eq(that.collateral) && this.debt.eq(that.debt);
    }
    add(that) {
        return new Trove(this.collateral.add(that.collateral), this.debt.add(that.debt));
    }
    addCollateral(collateral) {
        return new Trove(this.collateral.add(collateral), this.debt);
    }
    addDebt(debt) {
        return new Trove(this.collateral, this.debt.add(debt));
    }
    subtract(that) {
        const { collateral, debt } = that;
        return new Trove(this.collateral.gt(collateral) ? this.collateral.sub(collateral) : Decimal_1.Decimal.ZERO, this.debt.gt(debt) ? this.debt.sub(debt) : Decimal_1.Decimal.ZERO);
    }
    subtractCollateral(collateral) {
        return new Trove(this.collateral.gt(collateral) ? this.collateral.sub(collateral) : Decimal_1.Decimal.ZERO, this.debt);
    }
    subtractDebt(debt) {
        return new Trove(this.collateral, this.debt.gt(debt) ? this.debt.sub(debt) : Decimal_1.Decimal.ZERO);
    }
    multiply(multiplier) {
        return new Trove(this.collateral.mul(multiplier), this.debt.mul(multiplier));
    }
    setCollateral(collateral) {
        return new Trove(Decimal_1.Decimal.from(collateral), this.debt);
    }
    setDebt(debt) {
        return new Trove(this.collateral, Decimal_1.Decimal.from(debt));
    }
    _debtChange({ debt }, borrowingRate) {
        return debt.gt(this.debt)
            ? { borrowZUSD: unapplyFee(borrowingRate, debt.sub(this.debt)) }
            : { repayZUSD: this.debt.sub(debt) };
    }
    _collateralChange({ collateral }) {
        return collateral.gt(this.collateral)
            ? { depositCollateral: collateral.sub(this.collateral) }
            : { withdrawCollateral: this.collateral.sub(collateral) };
    }
    /**
     * Calculate the difference between this Trove and another.
     *
     * @param that - The other Trove.
     * @param borrowingRate - Borrowing rate to use when calculating a borrowed amount.
     *
     * @returns
     * An object representing the change, or `undefined` if the Troves are equal.
     */
    whatChanged(that, borrowingRate = constants_1.MINIMUM_BORROWING_RATE) {
        var _a;
        if (this.collateral.eq(that.collateral) && this.debt.eq(that.debt)) {
            return undefined;
        }
        if (this.isEmpty) {
            if (that.debt.lt(constants_1.ZUSD_LIQUIDATION_RESERVE)) {
                return invalidTroveCreation(that, "missingLiquidationReserve");
            }
            return troveCreation({
                depositCollateral: that.collateral,
                borrowZUSD: unapplyFee(borrowingRate, that.netDebt)
            });
        }
        if (that.isEmpty) {
            return troveClosure(this.netDebt.nonZero
                ? { withdrawCollateral: this.collateral, repayZUSD: this.netDebt }
                : { withdrawCollateral: this.collateral });
        }
        return this.collateral.eq(that.collateral)
            ? troveAdjustment(this._debtChange(that, borrowingRate), that.debt.zero && "debt")
            : this.debt.eq(that.debt)
                ? troveAdjustment(this._collateralChange(that), that.collateral.zero && "collateral")
                : troveAdjustment({
                    ...this._debtChange(that, borrowingRate),
                    ...this._collateralChange(that)
                }, (_a = (that.debt.zero && "debt")) !== null && _a !== void 0 ? _a : (that.collateral.zero && "collateral"));
    }
    /**
     * Make a new Trove by applying a {@link TroveChange} to this Trove.
     *
     * @param change - The change to apply.
     * @param borrowingRate - Borrowing rate to use when adding a borrowed amount to the Trove's debt.
     */
    apply(change, borrowingRate = constants_1.MINIMUM_BORROWING_RATE) {
        if (!change) {
            return this;
        }
        switch (change.type) {
            case "invalidCreation":
                if (!this.isEmpty) {
                    throw new Error("Can't create onto existing Trove");
                }
                return change.invalidTrove;
            case "creation": {
                if (!this.isEmpty) {
                    throw new Error("Can't create onto existing Trove");
                }
                const { depositCollateral, borrowZUSD } = change.params;
                return new Trove(depositCollateral, constants_1.ZUSD_LIQUIDATION_RESERVE.add(applyFee(borrowingRate, borrowZUSD)));
            }
            case "closure":
                if (this.isEmpty) {
                    throw new Error("Can't close empty Trove");
                }
                return exports._emptyTrove;
            case "adjustment": {
                const { setToZero, params: { depositCollateral, withdrawCollateral, borrowZUSD, repayZUSD } } = change;
                const collateralDecrease = withdrawCollateral !== null && withdrawCollateral !== void 0 ? withdrawCollateral : Decimal_1.Decimal.ZERO;
                const collateralIncrease = depositCollateral !== null && depositCollateral !== void 0 ? depositCollateral : Decimal_1.Decimal.ZERO;
                const debtDecrease = repayZUSD !== null && repayZUSD !== void 0 ? repayZUSD : Decimal_1.Decimal.ZERO;
                const debtIncrease = borrowZUSD ? applyFee(borrowingRate, borrowZUSD) : Decimal_1.Decimal.ZERO;
                return setToZero === "collateral"
                    ? this.setCollateral(Decimal_1.Decimal.ZERO).addDebt(debtIncrease).subtractDebt(debtDecrease)
                    : setToZero === "debt"
                        ? this.setDebt(Decimal_1.Decimal.ZERO)
                            .addCollateral(collateralIncrease)
                            .subtractCollateral(collateralDecrease)
                        : this.add(new Trove(collateralIncrease, debtIncrease)).subtract(new Trove(collateralDecrease, debtDecrease));
            }
        }
    }
    /**
     * Calculate the result of an {@link TransactableLiquity.openTrove | openTrove()} transaction.
     *
     * @param params - Parameters of the transaction.
     * @param borrowingRate - Borrowing rate to use when calculating the Trove's debt.
     */
    static create(params, borrowingRate) {
        return exports._emptyTrove.apply(troveCreation(exports._normalizeTroveCreation(params)), borrowingRate);
    }
    /**
     * Calculate the parameters of an {@link TransactableLiquity.openTrove | openTrove()} transaction
     * that will result in the given Trove.
     *
     * @param that - The Trove to recreate.
     * @param borrowingRate - Current borrowing rate.
     */
    static recreate(that, borrowingRate) {
        const change = exports._emptyTrove.whatChanged(that, borrowingRate);
        assert_1.default((change === null || change === void 0 ? void 0 : change.type) === "creation");
        return change.params;
    }
    /**
     * Calculate the result of an {@link TransactableLiquity.adjustTrove | adjustTrove()} transaction
     * on this Trove.
     *
     * @param params - Parameters of the transaction.
     * @param borrowingRate - Borrowing rate to use when adding to the Trove's debt.
     */
    adjust(params, borrowingRate) {
        return this.apply(troveAdjustment(exports._normalizeTroveAdjustment(params)), borrowingRate);
    }
    /**
     * Calculate the parameters of an {@link TransactableLiquity.adjustTrove | adjustTrove()}
     * transaction that will change this Trove into the given Trove.
     *
     * @param that - The desired result of the transaction.
     * @param borrowingRate - Current borrowing rate.
     */
    adjustTo(that, borrowingRate) {
        const change = this.whatChanged(that, borrowingRate);
        assert_1.default((change === null || change === void 0 ? void 0 : change.type) === "adjustment");
        return change.params;
    }
}
exports.Trove = Trove;
/** @internal */
exports._emptyTrove = new Trove();
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
class UserTrove extends Trove {
    /** @internal */
    constructor(ownerAddress, status, collateral, debt) {
        super(collateral, debt);
        this.ownerAddress = ownerAddress;
        this.status = status;
    }
    equals(that) {
        return (super.equals(that) && this.ownerAddress === that.ownerAddress && this.status === that.status);
    }
    /** @internal */
    toString() {
        return (`{ ownerAddress: "${this.ownerAddress}"` +
            `, collateral: ${this.collateral}` +
            `, debt: ${this.debt}` +
            `, status: "${this.status}" }`);
    }
}
exports.UserTrove = UserTrove;
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
class TroveWithPendingRedistribution extends UserTrove {
    /** @internal */
    constructor(ownerAddress, status, collateral, debt, stake = Decimal_1.Decimal.ZERO, snapshotOfTotalRedistributed = exports._emptyTrove) {
        super(ownerAddress, status, collateral, debt);
        this.stake = stake;
        this.snapshotOfTotalRedistributed = snapshotOfTotalRedistributed;
    }
    applyRedistribution(totalRedistributed) {
        const afterRedistribution = this.add(totalRedistributed.subtract(this.snapshotOfTotalRedistributed).multiply(this.stake));
        return new UserTrove(this.ownerAddress, this.status, afterRedistribution.collateral, afterRedistribution.debt);
    }
    equals(that) {
        return (super.equals(that) &&
            this.stake.eq(that.stake) &&
            this.snapshotOfTotalRedistributed.equals(that.snapshotOfTotalRedistributed));
    }
}
exports.TroveWithPendingRedistribution = TroveWithPendingRedistribution;
//# sourceMappingURL=Trove.js.map