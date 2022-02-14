"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthersLiquity = exports.EthersTransactionFailedError = void 0;
const lib_base_1 = require("@liquity/lib-base");
const EthersLiquityConnection_1 = require("./EthersLiquityConnection");
const PopulatableEthersLiquity_1 = require("./PopulatableEthersLiquity");
const ReadableEthersLiquity_1 = require("./ReadableEthersLiquity");
const SendableEthersLiquity_1 = require("./SendableEthersLiquity");
/**
 * Thrown by {@link EthersLiquity} in case of transaction failure.
 *
 * @public
 */
class EthersTransactionFailedError extends lib_base_1.TransactionFailedError {
    constructor(message, failedReceipt) {
        super("EthersTransactionFailedError", message, failedReceipt);
    }
}
exports.EthersTransactionFailedError = EthersTransactionFailedError;
const waitForSuccess = async (tx) => {
    const receipt = await tx.waitForReceipt();
    if (receipt.status !== "succeeded") {
        throw new EthersTransactionFailedError("Transaction failed", receipt);
    }
    return receipt.details;
};
/**
 * Convenience class that combines multiple interfaces of the library in one object.
 *
 * @public
 */
class EthersLiquity {
    /** @internal */
    constructor(readable) {
        this._readable = readable;
        this.connection = readable.connection;
        this.populate = new PopulatableEthersLiquity_1.PopulatableEthersLiquity(readable);
        this.send = new SendableEthersLiquity_1.SendableEthersLiquity(this.populate);
    }
    /** @internal */
    static _from(connection) {
        if (EthersLiquityConnection_1._usingStore(connection)) {
            return new _EthersLiquityWithStore(ReadableEthersLiquity_1.ReadableEthersLiquity._from(connection));
        }
        else {
            return new EthersLiquity(ReadableEthersLiquity_1.ReadableEthersLiquity._from(connection));
        }
    }
    static async connect(signerOrProvider, optionalParams) {
        return EthersLiquity._from(await EthersLiquityConnection_1._connect(signerOrProvider, optionalParams));
    }
    hasStore() {
        return false;
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTotalRedistributed} */
    getTotalRedistributed(overrides) {
        return this._readable.getTotalRedistributed(overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTroveBeforeRedistribution} */
    getTroveBeforeRedistribution(address, overrides) {
        return this._readable.getTroveBeforeRedistribution(address, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTrove} */
    getTrove(address, overrides) {
        return this._readable.getTrove(address, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getNumberOfTroves} */
    getNumberOfTroves(overrides) {
        return this._readable.getNumberOfTroves(overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getPrice} */
    getPrice(overrides) {
        return this._readable.getPrice(overrides);
    }
    /** @internal */
    _getActivePool(overrides) {
        return this._readable._getActivePool(overrides);
    }
    /** @internal */
    _getDefaultPool(overrides) {
        return this._readable._getDefaultPool(overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTotal} */
    getTotal(overrides) {
        return this._readable.getTotal(overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getStabilityDeposit} */
    getStabilityDeposit(address, overrides) {
        return this._readable.getStabilityDeposit(address, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getRemainingStabilityPoolZEROReward} */
    getRemainingStabilityPoolZEROReward(overrides) {
        return this._readable.getRemainingStabilityPoolZEROReward(overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZUSDInStabilityPool} */
    getZUSDInStabilityPool(overrides) {
        return this._readable.getZUSDInStabilityPool(overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZUSDBalance} */
    getZUSDBalance(address, overrides) {
        return this._readable.getZUSDBalance(address, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getNUEBalance} */
    getNUEBalance(address, overrides) {
        return this._readable.getNUEBalance(address, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZEROBalance} */
    getZEROBalance(address, overrides) {
        return this._readable.getZEROBalance(address, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getCollateralSurplusBalance} */
    getCollateralSurplusBalance(address, overrides) {
        return this._readable.getCollateralSurplusBalance(address, overrides);
    }
    getTroves(params, overrides) {
        return this._readable.getTroves(params, overrides);
    }
    /** @internal */
    _getFeesFactory(overrides) {
        return this._readable._getFeesFactory(overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getFees} */
    getFees(overrides) {
        return this._readable.getFees(overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZEROStake} */
    getZEROStake(address, overrides) {
        return this._readable.getZEROStake(address, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTotalStakedZERO} */
    getTotalStakedZERO(overrides) {
        return this._readable.getTotalStakedZERO(overrides);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getFrontendStatus} */
    getFrontendStatus(address, overrides) {
        return this._readable.getFrontendStatus(address, overrides);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.openTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    openTrove(params, maxBorrowingRate, overrides) {
        return this.send.openTrove(params, maxBorrowingRate, overrides).then(waitForSuccess);
    }
    /**
   * {@inheritDoc @liquity/lib-base#TransactableLiquity.openTrove}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   */
    openNueTrove(params, maxBorrowingRate, overrides) {
        return this.send.openNueTrove(params, maxBorrowingRate, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.closeTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    closeTrove(overrides) {
        return this.send.closeTrove(overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.closeNueTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    closeNueTrove(overrides) {
        return this.send.closeNueTrove(overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.adjustTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    adjustTrove(params, maxBorrowingRate, overrides) {
        return this.send.adjustTrove(params, maxBorrowingRate, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.adjustNueTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    adjustNueTrove(params, maxBorrowingRate, overrides) {
        return this.send.adjustNueTrove(params, maxBorrowingRate, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.depositCollateral}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    depositCollateral(amount, overrides) {
        return this.send.depositCollateral(amount, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.withdrawCollateral}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    withdrawCollateral(amount, overrides) {
        return this.send.withdrawCollateral(amount, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.borrowZUSD}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    borrowZUSD(amount, maxBorrowingRate, overrides) {
        return this.send.borrowZUSD(amount, maxBorrowingRate, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.repayZUSD}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    repayZUSD(amount, overrides) {
        return this.send.repayZUSD(amount, overrides).then(waitForSuccess);
    }
    /** @internal */
    setPrice(price, overrides) {
        return this.send.setPrice(price, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.liquidate}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    liquidate(address, overrides) {
        return this.send.liquidate(address, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.liquidateUpTo}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides) {
        return this.send.liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.depositZUSDInStabilityPool}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    depositZUSDInStabilityPool(amount, frontendTag, overrides) {
        return this.send.depositZUSDInStabilityPool(amount, frontendTag, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.withdrawZUSDFromStabilityPool}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    withdrawZUSDFromStabilityPool(amount, overrides) {
        return this.send.withdrawZUSDFromStabilityPool(amount, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.withdrawGainsFromStabilityPool}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    withdrawGainsFromStabilityPool(overrides) {
        return this.send.withdrawGainsFromStabilityPool(overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.transferCollateralGainToTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    transferCollateralGainToTrove(overrides) {
        return this.send.transferCollateralGainToTrove(overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.sendZUSD}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    sendZUSD(toAddress, amount, overrides) {
        return this.send.sendZUSD(toAddress, amount, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.sendZERO}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    sendZERO(toAddress, amount, overrides) {
        return this.send.sendZERO(toAddress, amount, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.redeemZUSD}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    redeemZUSD(amount, maxRedemptionRate, overrides) {
        return this.send.redeemZUSD(amount, maxRedemptionRate, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.claimCollateralSurplus}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    claimCollateralSurplus(overrides) {
        return this.send.claimCollateralSurplus(overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.stakeZERO}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    stakeZERO(amount, overrides) {
        return this.send.stakeZERO(amount, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.unstakeZERO}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    unstakeZERO(amount, overrides) {
        return this.send.unstakeZERO(amount, overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.withdrawGainsFromStaking}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    withdrawGainsFromStaking(overrides) {
        return this.send.withdrawGainsFromStaking(overrides).then(waitForSuccess);
    }
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.registerFrontend}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    registerFrontend(kickbackRate, overrides) {
        return this.send.registerFrontend(kickbackRate, overrides).then(waitForSuccess);
    }
}
exports.EthersLiquity = EthersLiquity;
class _EthersLiquityWithStore extends EthersLiquity {
    constructor(readable) {
        super(readable);
        this.store = readable.store;
    }
    hasStore(store) {
        return store === undefined || store === this.connection.useStore;
    }
}
//# sourceMappingURL=EthersLiquity.js.map