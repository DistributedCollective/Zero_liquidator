"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendableEthersLiquity = void 0;
const sendTransaction = (tx) => tx.send();
/**
 * Ethers-based implementation of {@link @liquity/lib-base#SendableLiquity}.
 *
 * @public
 */
class SendableEthersLiquity {
    constructor(populatable) {
        this._populate = populatable;
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.openTrove} */
    openTrove(params, maxBorrowingRate, overrides) {
        return this._populate.openTrove(params, maxBorrowingRate, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.openNueTrove} */
    openNueTrove(params, maxBorrowingRate, overrides) {
        return this._populate.openNueTrove(params, maxBorrowingRate, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.closeTrove} */
    closeTrove(overrides) {
        return this._populate.closeTrove(overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.closeNueTrove} */
    closeNueTrove(overrides) {
        return this._populate.closeNueTrove(overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.adjustTrove} */
    adjustTrove(params, maxBorrowingRate, overrides) {
        return this._populate.adjustTrove(params, maxBorrowingRate, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.adjustNueTrove} */
    adjustNueTrove(params, maxBorrowingRate, overrides) {
        return this._populate.adjustNueTrove(params, maxBorrowingRate, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.depositCollateral} */
    depositCollateral(amount, overrides) {
        return this._populate.depositCollateral(amount, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.withdrawCollateral} */
    withdrawCollateral(amount, overrides) {
        return this._populate.withdrawCollateral(amount, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.borrowZUSD} */
    borrowZUSD(amount, maxBorrowingRate, overrides) {
        return this._populate.borrowZUSD(amount, maxBorrowingRate, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.repayZUSD} */
    repayZUSD(amount, overrides) {
        return this._populate.repayZUSD(amount, overrides).then(sendTransaction);
    }
    /** @internal */
    setPrice(price, overrides) {
        return this._populate.setPrice(price, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.liquidate} */
    liquidate(address, overrides) {
        return this._populate.liquidate(address, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.liquidateUpTo} */
    liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides) {
        return this._populate
            .liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides)
            .then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.depositZUSDInStabilityPool} */
    depositZUSDInStabilityPool(amount, frontendTag, overrides) {
        return this._populate
            .depositZUSDInStabilityPool(amount, frontendTag, overrides)
            .then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.withdrawZUSDFromStabilityPool} */
    withdrawZUSDFromStabilityPool(amount, overrides) {
        return this._populate.withdrawZUSDFromStabilityPool(amount, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.withdrawGainsFromStabilityPool} */
    withdrawGainsFromStabilityPool(overrides) {
        return this._populate.withdrawGainsFromStabilityPool(overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.transferCollateralGainToTrove} */
    transferCollateralGainToTrove(overrides) {
        return this._populate.transferCollateralGainToTrove(overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.sendZUSD} */
    sendZUSD(toAddress, amount, overrides) {
        return this._populate.sendZUSD(toAddress, amount, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.sendZERO} */
    sendZERO(toAddress, amount, overrides) {
        return this._populate.sendZERO(toAddress, amount, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.redeemZUSD} */
    redeemZUSD(amount, maxRedemptionRate, overrides) {
        return this._populate.redeemZUSD(amount, maxRedemptionRate, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.claimCollateralSurplus} */
    claimCollateralSurplus(overrides) {
        return this._populate.claimCollateralSurplus(overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.stakeZERO} */
    stakeZERO(amount, overrides) {
        return this._populate.stakeZERO(amount, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.unstakeZERO} */
    unstakeZERO(amount, overrides) {
        return this._populate.unstakeZERO(amount, overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.withdrawGainsFromStaking} */
    withdrawGainsFromStaking(overrides) {
        return this._populate.withdrawGainsFromStaking(overrides).then(sendTransaction);
    }
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.registerFrontend} */
    registerFrontend(kickbackRate, overrides) {
        return this._populate.registerFrontend(kickbackRate, overrides).then(sendTransaction);
    }
}
exports.SendableEthersLiquity = SendableEthersLiquity;
//# sourceMappingURL=SendableEthersLiquity.js.map