"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopulatableEthersLiquity = exports.PopulatedEthersRedemption = exports.PopulatedEthersLiquityTransaction = exports.SentEthersLiquityTransaction = exports._redeemMaxIterations = void 0;
const assert_1 = __importDefault(require("assert"));
const constants_1 = require("@ethersproject/constants");
const lib_base_1 = require("@liquity/lib-base");
const EthersLiquityConnection_1 = require("./EthersLiquityConnection");
const contracts_1 = require("./contracts");
const parseLogs_1 = require("./parseLogs");
const decimalify = (bigNumber) => lib_base_1.Decimal.fromBigNumberString(bigNumber.toHexString());
// With 70 iterations redemption costs about ~10M gas, and each iteration accounts for ~138k more
/** @internal */
exports._redeemMaxIterations = 70;
const defaultBorrowingRateSlippageTolerance = lib_base_1.Decimal.from(0.005); // 0.5%
const defaultRedemptionRateSlippageTolerance = lib_base_1.Decimal.from(0.001); // 0.1%
const noDetails = () => undefined;
const compose = (f, g) => (_) => f(g(_));
const id = (t) => t;
// Takes ~6-7K to update lastFeeOperationTime. Let's be on the safe side.
const addGasForPotentialLastFeeOperationTimeUpdate = (gas) => gas.add(10000);
// First traversal in ascending direction takes ~50K, then ~13.5K per extra step.
// 80K should be enough for 3 steps, plus some extra to be safe.
const addGasForPotentialListTraversal = (gas) => gas.add(80000);
const addGasForZEROIssuance = (gas) => gas.add(50000);
// To get the best entropy available, we'd do something like:
//
// const bigRandomNumber = () =>
//   BigNumber.from(
//     `0x${Array.from(crypto.getRandomValues(new Uint32Array(8)))
//       .map(u32 => u32.toString(16).padStart(8, "0"))
//       .join("")}`
//   );
//
// However, Window.crypto is browser-specific. Since we only use this for randomly picking Troves
// during the search for hints, Math.random() will do fine, too.
//
// This returns a random integer between 0 and Number.MAX_SAFE_INTEGER
const randomInteger = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
// Maximum number of trials to perform in a single getApproxHint() call. If the number of trials
// required to get a statistically "good" hint is larger than this, the search for the hint will
// be broken up into multiple getApproxHint() calls.
//
// This should be low enough to work with popular public Ethereum providers like Infura without
// triggering any fair use limits.
const maxNumberOfTrialsAtOnce = 2500;
function* generateTrials(totalNumberOfTrials) {
    assert_1.default(Number.isInteger(totalNumberOfTrials) && totalNumberOfTrials > 0);
    while (totalNumberOfTrials) {
        const numberOfTrials = Math.min(totalNumberOfTrials, maxNumberOfTrialsAtOnce);
        yield numberOfTrials;
        totalNumberOfTrials -= numberOfTrials;
    }
}
/**
 * A transaction that has already been sent.
 *
 * @remarks
 * Returned by {@link SendableEthersLiquity} functions.
 *
 * @public
 */
class SentEthersLiquityTransaction {
    /** @internal */
    constructor(rawSentTransaction, connection, parse) {
        this.rawSentTransaction = rawSentTransaction;
        this._connection = connection;
        this._parse = parse;
    }
    _receiptFrom(rawReceipt) {
        return rawReceipt
            ? rawReceipt.status
                ? lib_base_1._successfulReceipt(rawReceipt, this._parse(rawReceipt), () => parseLogs_1.logsToString(rawReceipt, EthersLiquityConnection_1._getContracts(this._connection)))
                : lib_base_1._failedReceipt(rawReceipt)
            : lib_base_1._pendingReceipt;
    }
    /** {@inheritDoc @liquity/lib-base#SentLiquityTransaction.getReceipt} */
    async getReceipt() {
        return this._receiptFrom(await EthersLiquityConnection_1._getProvider(this._connection).getTransactionReceipt(this.rawSentTransaction.hash));
    }
    /** {@inheritDoc @liquity/lib-base#SentLiquityTransaction.waitForReceipt} */
    async waitForReceipt() {
        const receipt = this._receiptFrom(await EthersLiquityConnection_1._getProvider(this._connection).waitForTransaction(this.rawSentTransaction.hash));
        assert_1.default(receipt.status !== "pending");
        return receipt;
    }
}
exports.SentEthersLiquityTransaction = SentEthersLiquityTransaction;
/**
 * A transaction that has been prepared for sending.
 *
 * @remarks
 * Returned by {@link PopulatableEthersLiquity} functions.
 *
 * @public
 */
class PopulatedEthersLiquityTransaction {
    /** @internal */
    constructor(rawPopulatedTransaction, connection, parse) {
        this.rawPopulatedTransaction = rawPopulatedTransaction;
        this._connection = connection;
        this._parse = parse;
    }
    /** {@inheritDoc @liquity/lib-base#PopulatedLiquityTransaction.send} */
    async send() {
        return new SentEthersLiquityTransaction(await EthersLiquityConnection_1._requireSigner(this._connection).sendTransaction(this.rawPopulatedTransaction), this._connection, this._parse);
    }
}
exports.PopulatedEthersLiquityTransaction = PopulatedEthersLiquityTransaction;
/**
 * {@inheritDoc @liquity/lib-base#PopulatedRedemption}
 *
 * @public
 */
class PopulatedEthersRedemption extends PopulatedEthersLiquityTransaction {
    /** @internal */
    constructor(rawPopulatedTransaction, connection, attemptedZUSDAmount, redeemableZUSDAmount, increaseAmountByMinimumNetDebt) {
        const { troveManager } = EthersLiquityConnection_1._getContracts(connection);
        super(rawPopulatedTransaction, connection, ({ logs }) => troveManager
            .extractEvents(logs, "Redemption")
            .map(({ args: { _ETHSent, _ETHFee, _actualZUSDAmount, _attemptedZUSDAmount } }) => ({
            attemptedZUSDAmount: decimalify(_attemptedZUSDAmount),
            actualZUSDAmount: decimalify(_actualZUSDAmount),
            collateralTaken: decimalify(_ETHSent),
            fee: decimalify(_ETHFee)
        }))[0]);
        this.attemptedZUSDAmount = attemptedZUSDAmount;
        this.redeemableZUSDAmount = redeemableZUSDAmount;
        this.isTruncated = redeemableZUSDAmount.lt(attemptedZUSDAmount);
        this._increaseAmountByMinimumNetDebt = increaseAmountByMinimumNetDebt;
    }
    /** {@inheritDoc @liquity/lib-base#PopulatedRedemption.increaseAmountByMinimumNetDebt} */
    increaseAmountByMinimumNetDebt(maxRedemptionRate) {
        if (!this._increaseAmountByMinimumNetDebt) {
            throw new Error("PopulatedEthersRedemption: increaseAmountByMinimumNetDebt() can " +
                "only be called when amount is truncated");
        }
        return this._increaseAmountByMinimumNetDebt(maxRedemptionRate);
    }
}
exports.PopulatedEthersRedemption = PopulatedEthersRedemption;
/**
 * Ethers-based implementation of {@link @liquity/lib-base#PopulatableLiquity}.
 *
 * @public
 */
class PopulatableEthersLiquity {
    constructor(readable) {
        this._readable = readable;
    }
    _wrapSimpleTransaction(rawPopulatedTransaction) {
        return new PopulatedEthersLiquityTransaction(rawPopulatedTransaction, this._readable.connection, noDetails);
    }
    _wrapTroveChangeWithFees(params, rawPopulatedTransaction) {
        const { borrowerOperations } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return new PopulatedEthersLiquityTransaction(rawPopulatedTransaction, this._readable.connection, ({ logs }) => {
            const [newTrove] = borrowerOperations
                .extractEvents(logs, "TroveUpdated")
                .map(({ args: { _coll, _debt } }) => new lib_base_1.Trove(decimalify(_coll), decimalify(_debt)));
            const [fee] = borrowerOperations
                .extractEvents(logs, "ZUSDBorrowingFeePaid")
                .map(({ args: { _ZUSDFee } }) => decimalify(_ZUSDFee));
            return {
                params,
                newTrove,
                fee
            };
        });
    }
    async _wrapTroveClosure(rawPopulatedTransaction) {
        const { activePool, zusdToken } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return new PopulatedEthersLiquityTransaction(rawPopulatedTransaction, this._readable.connection, ({ logs, from: userAddress }) => {
            const [repayZUSD] = zusdToken
                .extractEvents(logs, "Transfer")
                .filter(({ args: { from, to } }) => from === userAddress && to === constants_1.AddressZero)
                .map(({ args: { value } }) => decimalify(value));
            const [withdrawCollateral] = activePool
                .extractEvents(logs, "EtherSent")
                .filter(({ args: { _to } }) => _to === userAddress)
                .map(({ args: { _amount } }) => decimalify(_amount));
            return {
                params: repayZUSD.nonZero ? { withdrawCollateral, repayZUSD } : { withdrawCollateral }
            };
        });
    }
    _wrapLiquidation(rawPopulatedTransaction) {
        const { troveManager } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return new PopulatedEthersLiquityTransaction(rawPopulatedTransaction, this._readable.connection, ({ logs }) => {
            const liquidatedAddresses = troveManager
                .extractEvents(logs, "TroveLiquidated")
                .map(({ args: { _borrower } }) => _borrower);
            const [totals] = troveManager
                .extractEvents(logs, "Liquidation")
                .map(({ args: { _ZUSDGasCompensation, _collGasCompensation, _liquidatedColl, _liquidatedDebt } }) => ({
                collateralGasCompensation: decimalify(_collGasCompensation),
                zusdGasCompensation: decimalify(_ZUSDGasCompensation),
                totalLiquidated: new lib_base_1.Trove(decimalify(_liquidatedColl), decimalify(_liquidatedDebt))
            }));
            return {
                liquidatedAddresses,
                ...totals
            };
        });
    }
    _extractStabilityPoolGainsWithdrawalDetails(logs) {
        const { stabilityPool } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const [newZUSDDeposit] = stabilityPool
            .extractEvents(logs, "UserDepositChanged")
            .map(({ args: { _newDeposit } }) => decimalify(_newDeposit));
        const [[collateralGain, zusdLoss]] = stabilityPool
            .extractEvents(logs, "ETHGainWithdrawn")
            .map(({ args: { _ETH, _ZUSDLoss } }) => [decimalify(_ETH), decimalify(_ZUSDLoss)]);
        const [zeroReward] = stabilityPool
            .extractEvents(logs, "ZEROPaidToDepositor")
            .map(({ args: { _ZERO } }) => decimalify(_ZERO));
        return {
            zusdLoss,
            newZUSDDeposit,
            collateralGain,
            zeroReward
        };
    }
    _wrapStabilityPoolGainsWithdrawal(rawPopulatedTransaction) {
        return new PopulatedEthersLiquityTransaction(rawPopulatedTransaction, this._readable.connection, ({ logs }) => this._extractStabilityPoolGainsWithdrawalDetails(logs));
    }
    _wrapStabilityDepositTopup(change, rawPopulatedTransaction) {
        return new PopulatedEthersLiquityTransaction(rawPopulatedTransaction, this._readable.connection, ({ logs }) => ({
            ...this._extractStabilityPoolGainsWithdrawalDetails(logs),
            change
        }));
    }
    async _wrapStabilityDepositWithdrawal(rawPopulatedTransaction) {
        const { stabilityPool, zusdToken } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return new PopulatedEthersLiquityTransaction(rawPopulatedTransaction, this._readable.connection, ({ logs, from: userAddress }) => {
            const gainsWithdrawalDetails = this._extractStabilityPoolGainsWithdrawalDetails(logs);
            const [withdrawZUSD] = zusdToken
                .extractEvents(logs, "Transfer")
                .filter(({ args: { from, to } }) => from === stabilityPool.address && to === userAddress)
                .map(({ args: { value } }) => decimalify(value));
            return {
                ...gainsWithdrawalDetails,
                change: { withdrawZUSD, withdrawAllZUSD: gainsWithdrawalDetails.newZUSDDeposit.isZero }
            };
        });
    }
    _wrapCollateralGainTransfer(rawPopulatedTransaction) {
        const { borrowerOperations } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return new PopulatedEthersLiquityTransaction(rawPopulatedTransaction, this._readable.connection, ({ logs }) => {
            const [newTrove] = borrowerOperations
                .extractEvents(logs, "TroveUpdated")
                .map(({ args: { _coll, _debt } }) => new lib_base_1.Trove(decimalify(_coll), decimalify(_debt)));
            return {
                ...this._extractStabilityPoolGainsWithdrawalDetails(logs),
                newTrove
            };
        });
    }
    async _findHintsForNominalCollateralRatio(nominalCollateralRatio) {
        const { sortedTroves, hintHelpers } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const numberOfTroves = await this._readable.getNumberOfTroves();
        if (!numberOfTroves) {
            return [constants_1.AddressZero, constants_1.AddressZero];
        }
        if (nominalCollateralRatio.infinite) {
            return [constants_1.AddressZero, await sortedTroves.getFirst()];
        }
        const totalNumberOfTrials = Math.ceil(10 * Math.sqrt(numberOfTroves));
        const [firstTrials, ...restOfTrials] = generateTrials(totalNumberOfTrials);
        const collectApproxHint = ({ latestRandomSeed, results }, numberOfTrials) => hintHelpers
            .getApproxHint(nominalCollateralRatio.hex, numberOfTrials, latestRandomSeed)
            .then(({ latestRandomSeed, ...result }) => ({
            latestRandomSeed,
            results: [...results, result]
        }));
        const { results } = await restOfTrials.reduce((p, numberOfTrials) => p.then(state => collectApproxHint(state, numberOfTrials)), collectApproxHint({ latestRandomSeed: randomInteger(), results: [] }, firstTrials));
        const { hintAddress } = results.reduce((a, b) => (a.diff.lt(b.diff) ? a : b));
        return sortedTroves.findInsertPosition(nominalCollateralRatio.hex, hintAddress, hintAddress);
    }
    async _findHints(trove) {
        if (trove instanceof lib_base_1.TroveWithPendingRedistribution) {
            throw new Error("Rewards must be applied to this Trove");
        }
        return this._findHintsForNominalCollateralRatio(trove._nominalCollateralRatio);
    }
    async _findRedemptionHints(amount) {
        const { hintHelpers } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const price = await this._readable.getPrice();
        const { firstRedemptionHint, partialRedemptionHintNICR, truncatedZUSDamount } = await hintHelpers.getRedemptionHints(amount.hex, price.hex, exports._redeemMaxIterations);
        const [partialRedemptionUpperHint, partialRedemptionLowerHint] = partialRedemptionHintNICR.isZero()
            ? [constants_1.AddressZero, constants_1.AddressZero]
            : await this._findHintsForNominalCollateralRatio(decimalify(partialRedemptionHintNICR));
        return [
            decimalify(truncatedZUSDamount),
            firstRedemptionHint,
            partialRedemptionUpperHint,
            partialRedemptionLowerHint,
            partialRedemptionHintNICR
        ];
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.openTrove} */
    async openTrove(params, maxBorrowingRate, overrides) {
        const { borrowerOperations } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const normalized = lib_base_1._normalizeTroveCreation(params);
        const { depositCollateral, borrowZUSD } = normalized;
        const fees = await this._readable.getFees();
        const borrowingRate = fees.borrowingRate();
        const newTrove = lib_base_1.Trove.create(normalized, borrowingRate);
        maxBorrowingRate =
            maxBorrowingRate !== undefined
                ? lib_base_1.Decimal.from(maxBorrowingRate)
                : borrowingRate.add(defaultBorrowingRateSlippageTolerance);
        return this._wrapTroveChangeWithFees(normalized, await borrowerOperations.estimateAndPopulate.openTrove({ value: depositCollateral.hex, ...overrides }, compose(addGasForPotentialLastFeeOperationTimeUpdate, addGasForPotentialListTraversal), maxBorrowingRate.hex, borrowZUSD.hex, ...(await this._findHints(newTrove))));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.openNueTrove} */
    async openNueTrove(params, maxBorrowingRate, overrides) {
        const { borrowerOperations } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const normalized = lib_base_1._normalizeTroveCreation(params);
        const { depositCollateral, borrowZUSD } = normalized;
        const fees = await this._readable.getFees();
        const borrowingRate = fees.borrowingRate();
        const newTrove = lib_base_1.Trove.create(normalized, borrowingRate);
        maxBorrowingRate =
            maxBorrowingRate !== undefined
                ? lib_base_1.Decimal.from(maxBorrowingRate)
                : borrowingRate.add(defaultBorrowingRateSlippageTolerance);
        return this._wrapTroveChangeWithFees(normalized, await borrowerOperations.estimateAndPopulate.openNueTrove({ value: depositCollateral.hex, ...overrides }, compose(addGasForPotentialLastFeeOperationTimeUpdate, addGasForPotentialListTraversal), maxBorrowingRate.hex, borrowZUSD.hex, ...(await this._findHints(newTrove))));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.closeTrove} */
    async closeTrove(overrides) {
        const { borrowerOperations } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return this._wrapTroveClosure(await borrowerOperations.estimateAndPopulate.closeTrove({ ...overrides }, id));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.closeNueTrove} */
    async closeNueTrove(overrides) {
        const { borrowerOperations } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return this._wrapTroveClosure(await borrowerOperations.estimateAndPopulate.closeNueTrove({ ...overrides }, (gas) => gas.mul(125).div(100)));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.depositCollateral} */
    depositCollateral(amount, overrides) {
        return this.adjustTrove({ depositCollateral: amount }, undefined, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.withdrawCollateral} */
    withdrawCollateral(amount, overrides) {
        return this.adjustTrove({ withdrawCollateral: amount }, undefined, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.borrowZUSD} */
    borrowZUSD(amount, maxBorrowingRate, overrides) {
        return this.adjustTrove({ borrowZUSD: amount }, maxBorrowingRate, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.repayZUSD} */
    repayZUSD(amount, overrides) {
        return this.adjustTrove({ repayZUSD: amount }, undefined, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.adjustTrove} */
    async adjustTrove(params, maxBorrowingRate, overrides) {
        var _a, _b;
        const address = EthersLiquityConnection_1._requireAddress(this._readable.connection, overrides);
        const { borrowerOperations } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const normalized = lib_base_1._normalizeTroveAdjustment(params);
        const { depositCollateral, withdrawCollateral, borrowZUSD, repayZUSD } = normalized;
        const [trove, fees] = await Promise.all([
            this._readable.getTrove(address),
            borrowZUSD && this._readable.getFees()
        ]);
        const borrowingRate = fees === null || fees === void 0 ? void 0 : fees.borrowingRate();
        const finalTrove = trove.adjust(normalized, borrowingRate);
        maxBorrowingRate =
            maxBorrowingRate !== undefined
                ? lib_base_1.Decimal.from(maxBorrowingRate)
                : (_a = borrowingRate === null || borrowingRate === void 0 ? void 0 : borrowingRate.add(defaultBorrowingRateSlippageTolerance)) !== null && _a !== void 0 ? _a : lib_base_1.Decimal.ZERO;
        return this._wrapTroveChangeWithFees(normalized, await borrowerOperations.estimateAndPopulate.adjustTrove({ value: depositCollateral === null || depositCollateral === void 0 ? void 0 : depositCollateral.hex, ...overrides }, compose(borrowZUSD ? addGasForPotentialLastFeeOperationTimeUpdate : id, addGasForPotentialListTraversal), maxBorrowingRate.hex, (withdrawCollateral !== null && withdrawCollateral !== void 0 ? withdrawCollateral : lib_base_1.Decimal.ZERO).hex, ((_b = borrowZUSD !== null && borrowZUSD !== void 0 ? borrowZUSD : repayZUSD) !== null && _b !== void 0 ? _b : lib_base_1.Decimal.ZERO).hex, !!borrowZUSD, ...(await this._findHints(finalTrove))));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.adjustNueTrove} */
    async adjustNueTrove(params, maxBorrowingRate, overrides) {
        var _a, _b;
        const address = EthersLiquityConnection_1._requireAddress(this._readable.connection, overrides);
        const { borrowerOperations } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const normalized = lib_base_1._normalizeTroveAdjustment(params);
        const { depositCollateral, withdrawCollateral, borrowZUSD, repayZUSD } = normalized;
        const [trove, fees] = await Promise.all([
            this._readable.getTrove(address),
            borrowZUSD && this._readable.getFees()
        ]);
        const borrowingRate = fees === null || fees === void 0 ? void 0 : fees.borrowingRate();
        const finalTrove = trove.adjust(normalized, borrowingRate);
        maxBorrowingRate =
            maxBorrowingRate !== undefined
                ? lib_base_1.Decimal.from(maxBorrowingRate)
                : (_a = borrowingRate === null || borrowingRate === void 0 ? void 0 : borrowingRate.add(defaultBorrowingRateSlippageTolerance)) !== null && _a !== void 0 ? _a : lib_base_1.Decimal.ZERO;
        return this._wrapTroveChangeWithFees(normalized, await borrowerOperations.estimateAndPopulate.adjustNueTrove({ value: depositCollateral === null || depositCollateral === void 0 ? void 0 : depositCollateral.hex, ...overrides }, compose(borrowZUSD ? addGasForPotentialLastFeeOperationTimeUpdate : id, addGasForPotentialListTraversal), maxBorrowingRate.hex, (withdrawCollateral !== null && withdrawCollateral !== void 0 ? withdrawCollateral : lib_base_1.Decimal.ZERO).hex, ((_b = borrowZUSD !== null && borrowZUSD !== void 0 ? borrowZUSD : repayZUSD) !== null && _b !== void 0 ? _b : lib_base_1.Decimal.ZERO).hex, !!borrowZUSD, ...(await this._findHints(finalTrove))));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.claimCollateralSurplus} */
    async claimCollateralSurplus(overrides) {
        const { borrowerOperations } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return this._wrapSimpleTransaction(await borrowerOperations.estimateAndPopulate.claimCollateral({ ...overrides }, id));
    }
    /** @internal */
    async setPrice(price, overrides) {
        const { priceFeed } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        if (!contracts_1._priceFeedIsTestnet(priceFeed)) {
            throw new Error("setPrice() unavailable on this deployment of Liquity");
        }
        return this._wrapSimpleTransaction(await priceFeed.estimateAndPopulate.setPrice({ ...overrides }, id, lib_base_1.Decimal.from(price).hex));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.liquidate} */
    async liquidate(address, overrides) {
        const { troveManager } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        if (Array.isArray(address)) {
            return this._wrapLiquidation(await troveManager.estimateAndPopulate.batchLiquidateTroves({ ...overrides }, addGasForZEROIssuance, address));
        }
        else {
            return this._wrapLiquidation(await troveManager.estimateAndPopulate.liquidate({ ...overrides }, addGasForZEROIssuance, address));
        }
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.liquidateUpTo} */
    async liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides) {
        const { troveManager } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return this._wrapLiquidation(await troveManager.estimateAndPopulate.liquidateTroves({ ...overrides }, addGasForZEROIssuance, maximumNumberOfTrovesToLiquidate));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.depositZUSDInStabilityPool} */
    async depositZUSDInStabilityPool(amount, frontendTag, overrides) {
        var _a;
        const { stabilityPool } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const depositZUSD = lib_base_1.Decimal.from(amount);
        return this._wrapStabilityDepositTopup({ depositZUSD }, await stabilityPool.estimateAndPopulate.provideToSP({ ...overrides }, addGasForZEROIssuance, depositZUSD.hex, (_a = frontendTag !== null && frontendTag !== void 0 ? frontendTag : this._readable.connection.frontendTag) !== null && _a !== void 0 ? _a : constants_1.AddressZero));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.withdrawZUSDFromStabilityPool} */
    async withdrawZUSDFromStabilityPool(amount, overrides) {
        const { stabilityPool } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return this._wrapStabilityDepositWithdrawal(await stabilityPool.estimateAndPopulate.withdrawFromSP({ ...overrides }, addGasForZEROIssuance, lib_base_1.Decimal.from(amount).hex));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.withdrawGainsFromStabilityPool} */
    async withdrawGainsFromStabilityPool(overrides) {
        const { stabilityPool } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return this._wrapStabilityPoolGainsWithdrawal(await stabilityPool.estimateAndPopulate.withdrawFromSP({ ...overrides }, addGasForZEROIssuance, lib_base_1.Decimal.ZERO.hex));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.transferCollateralGainToTrove} */
    async transferCollateralGainToTrove(overrides) {
        const address = EthersLiquityConnection_1._requireAddress(this._readable.connection, overrides);
        const { stabilityPool } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const [initialTrove, stabilityDeposit] = await Promise.all([
            this._readable.getTrove(address),
            this._readable.getStabilityDeposit(address)
        ]);
        const finalTrove = initialTrove.addCollateral(stabilityDeposit.collateralGain);
        return this._wrapCollateralGainTransfer(await stabilityPool.estimateAndPopulate.withdrawETHGainToTrove({ ...overrides }, compose(addGasForPotentialListTraversal, addGasForZEROIssuance), ...(await this._findHints(finalTrove))));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.sendZUSD} */
    async sendZUSD(toAddress, amount, overrides) {
        const { zusdToken } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return this._wrapSimpleTransaction(await zusdToken.estimateAndPopulate.transfer({ ...overrides }, id, toAddress, lib_base_1.Decimal.from(amount).hex));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.sendZERO} */
    async sendZERO(toAddress, amount, overrides) {
        const { zeroToken } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return this._wrapSimpleTransaction(await zeroToken.estimateAndPopulate.transfer({ ...overrides }, id, toAddress, lib_base_1.Decimal.from(amount).hex));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.redeemZUSD} */
    async redeemZUSD(amount, maxRedemptionRate, overrides) {
        const { troveManager } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const attemptedZUSDAmount = lib_base_1.Decimal.from(amount);
        const [fees, total, [truncatedAmount, firstRedemptionHint, ...partialHints]] = await Promise.all([
            this._readable.getFees(),
            this._readable.getTotal(),
            this._findRedemptionHints(attemptedZUSDAmount)
        ]);
        if (truncatedAmount.isZero) {
            throw new Error(`redeemZUSD: amount too low to redeem (try at least ${lib_base_1.ZUSD_MINIMUM_NET_DEBT})`);
        }
        const defaultMaxRedemptionRate = (amount) => lib_base_1.Decimal.min(fees.redemptionRate(amount.div(total.debt)).add(defaultRedemptionRateSlippageTolerance), lib_base_1.Decimal.ONE);
        const populateRedemption = async (attemptedZUSDAmount, maxRedemptionRate, truncatedAmount = attemptedZUSDAmount, partialHints = [constants_1.AddressZero, constants_1.AddressZero, 0]) => {
            const maxRedemptionRateOrDefault = maxRedemptionRate !== undefined
                ? lib_base_1.Decimal.from(maxRedemptionRate)
                : defaultMaxRedemptionRate(truncatedAmount);
            return new PopulatedEthersRedemption(await troveManager.estimateAndPopulate.redeemCollateral({ ...overrides }, addGasForPotentialLastFeeOperationTimeUpdate, truncatedAmount.hex, firstRedemptionHint, ...partialHints, exports._redeemMaxIterations, maxRedemptionRateOrDefault.hex), this._readable.connection, attemptedZUSDAmount, truncatedAmount, truncatedAmount.lt(attemptedZUSDAmount)
                ? newMaxRedemptionRate => populateRedemption(truncatedAmount.add(lib_base_1.ZUSD_MINIMUM_NET_DEBT), newMaxRedemptionRate !== null && newMaxRedemptionRate !== void 0 ? newMaxRedemptionRate : maxRedemptionRate)
                : undefined);
        };
        return populateRedemption(attemptedZUSDAmount, maxRedemptionRate, truncatedAmount, partialHints);
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.stakeZERO} */
    async stakeZERO(amount, overrides) {
        const { zeroStaking } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return this._wrapSimpleTransaction(await zeroStaking.estimateAndPopulate.stake({ ...overrides }, id, lib_base_1.Decimal.from(amount).hex));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.unstakeZERO} */
    async unstakeZERO(amount, overrides) {
        const { zeroStaking } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return this._wrapSimpleTransaction(await zeroStaking.estimateAndPopulate.unstake({ ...overrides }, id, lib_base_1.Decimal.from(amount).hex));
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.withdrawGainsFromStaking} */
    withdrawGainsFromStaking(overrides) {
        return this.unstakeZERO(lib_base_1.Decimal.ZERO, overrides);
    }
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.registerFrontend} */
    async registerFrontend(kickbackRate, overrides) {
        const { stabilityPool } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        return this._wrapSimpleTransaction(await stabilityPool.estimateAndPopulate.registerFrontEnd({ ...overrides }, id, lib_base_1.Decimal.from(kickbackRate).hex));
    }
}
exports.PopulatableEthersLiquity = PopulatableEthersLiquity;
//# sourceMappingURL=PopulatableEthersLiquity.js.map