import { CollateralGainTransferDetails, Decimal, Decimalish, LiquidationDetails, LiquityReceipt, MinedReceipt, PopulatableLiquity, PopulatedLiquityTransaction, PopulatedRedemption, RedemptionDetails, SentLiquityTransaction, StabilityDepositChangeDetails, StabilityPoolGainsWithdrawalDetails, Trove, TroveAdjustmentDetails, TroveAdjustmentParams, TroveClosureDetails, TroveCreationDetails, TroveCreationParams } from "@liquity/lib-base";
import { EthersPopulatedTransaction, EthersTransactionOverrides, EthersTransactionReceipt, EthersTransactionResponse } from "./types";
import { EthersLiquityConnection } from "./EthersLiquityConnection";
import { ReadableEthersLiquity } from "./ReadableEthersLiquity";
/** @internal */
export declare const _redeemMaxIterations = 70;
/**
 * A transaction that has already been sent.
 *
 * @remarks
 * Returned by {@link SendableEthersLiquity} functions.
 *
 * @public
 */
export declare class SentEthersLiquityTransaction<T = unknown> implements SentLiquityTransaction<EthersTransactionResponse, LiquityReceipt<EthersTransactionReceipt, T>> {
    /** Ethers' representation of a sent transaction. */
    readonly rawSentTransaction: EthersTransactionResponse;
    private readonly _connection;
    private readonly _parse;
    /** @internal */
    constructor(rawSentTransaction: EthersTransactionResponse, connection: EthersLiquityConnection, parse: (rawReceipt: EthersTransactionReceipt) => T);
    private _receiptFrom;
    /** {@inheritDoc @liquity/lib-base#SentLiquityTransaction.getReceipt} */
    getReceipt(): Promise<LiquityReceipt<EthersTransactionReceipt, T>>;
    /** {@inheritDoc @liquity/lib-base#SentLiquityTransaction.waitForReceipt} */
    waitForReceipt(): Promise<MinedReceipt<EthersTransactionReceipt, T>>;
}
/**
 * A transaction that has been prepared for sending.
 *
 * @remarks
 * Returned by {@link PopulatableEthersLiquity} functions.
 *
 * @public
 */
export declare class PopulatedEthersLiquityTransaction<T = unknown> implements PopulatedLiquityTransaction<EthersPopulatedTransaction, SentEthersLiquityTransaction<T>> {
    /** Unsigned transaction object populated by Ethers. */
    readonly rawPopulatedTransaction: EthersPopulatedTransaction;
    private readonly _connection;
    private readonly _parse;
    /** @internal */
    constructor(rawPopulatedTransaction: EthersPopulatedTransaction, connection: EthersLiquityConnection, parse: (rawReceipt: EthersTransactionReceipt) => T);
    /** {@inheritDoc @liquity/lib-base#PopulatedLiquityTransaction.send} */
    send(): Promise<SentEthersLiquityTransaction<T>>;
}
/**
 * {@inheritDoc @liquity/lib-base#PopulatedRedemption}
 *
 * @public
 */
export declare class PopulatedEthersRedemption extends PopulatedEthersLiquityTransaction<RedemptionDetails> implements PopulatedRedemption<EthersPopulatedTransaction, EthersTransactionResponse, EthersTransactionReceipt> {
    /** {@inheritDoc @liquity/lib-base#PopulatedRedemption.attemptedZUSDAmount} */
    readonly attemptedZUSDAmount: Decimal;
    /** {@inheritDoc @liquity/lib-base#PopulatedRedemption.redeemableZUSDAmount} */
    readonly redeemableZUSDAmount: Decimal;
    /** {@inheritDoc @liquity/lib-base#PopulatedRedemption.isTruncated} */
    readonly isTruncated: boolean;
    private readonly _increaseAmountByMinimumNetDebt?;
    /** @internal */
    constructor(rawPopulatedTransaction: EthersPopulatedTransaction, connection: EthersLiquityConnection, attemptedZUSDAmount: Decimal, redeemableZUSDAmount: Decimal, increaseAmountByMinimumNetDebt?: (maxRedemptionRate?: Decimalish) => Promise<PopulatedEthersRedemption>);
    /** {@inheritDoc @liquity/lib-base#PopulatedRedemption.increaseAmountByMinimumNetDebt} */
    increaseAmountByMinimumNetDebt(maxRedemptionRate?: Decimalish): Promise<PopulatedEthersRedemption>;
}
/** @internal */
export interface _TroveChangeWithFees<T> {
    params: T;
    newTrove: Trove;
    fee: Decimal;
}
/**
 * Ethers-based implementation of {@link @liquity/lib-base#PopulatableLiquity}.
 *
 * @public
 */
export declare class PopulatableEthersLiquity implements PopulatableLiquity<EthersTransactionReceipt, EthersTransactionResponse, EthersPopulatedTransaction> {
    private readonly _readable;
    constructor(readable: ReadableEthersLiquity);
    private _wrapSimpleTransaction;
    private _wrapTroveChangeWithFees;
    private _wrapTroveClosure;
    private _wrapLiquidation;
    private _extractStabilityPoolGainsWithdrawalDetails;
    private _wrapStabilityPoolGainsWithdrawal;
    private _wrapStabilityDepositTopup;
    private _wrapStabilityDepositWithdrawal;
    private _wrapCollateralGainTransfer;
    private _findHintsForNominalCollateralRatio;
    private _findHints;
    private _findRedemptionHints;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.openTrove} */
    openTrove(params: TroveCreationParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<TroveCreationDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.openNueTrove} */
    openNueTrove(params: TroveCreationParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<TroveCreationDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.closeTrove} */
    closeTrove(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<TroveClosureDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.closeNueTrove} */
    closeNueTrove(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<TroveClosureDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.depositCollateral} */
    depositCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.withdrawCollateral} */
    withdrawCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.borrowZUSD} */
    borrowZUSD(amount: Decimalish, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.repayZUSD} */
    repayZUSD(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.adjustTrove} */
    adjustTrove(params: TroveAdjustmentParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.adjustNueTrove} */
    adjustNueTrove(params: TroveAdjustmentParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.claimCollateralSurplus} */
    claimCollateralSurplus(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<void>>;
    /** @internal */
    setPrice(price: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.liquidate} */
    liquidate(address: string | string[], overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<LiquidationDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.liquidateUpTo} */
    liquidateUpTo(maximumNumberOfTrovesToLiquidate: number, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<LiquidationDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.depositZUSDInStabilityPool} */
    depositZUSDInStabilityPool(amount: Decimalish, frontendTag?: string, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<StabilityDepositChangeDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.withdrawZUSDFromStabilityPool} */
    withdrawZUSDFromStabilityPool(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<StabilityDepositChangeDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.withdrawGainsFromStabilityPool} */
    withdrawGainsFromStabilityPool(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<StabilityPoolGainsWithdrawalDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.transferCollateralGainToTrove} */
    transferCollateralGainToTrove(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<CollateralGainTransferDetails>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.sendZUSD} */
    sendZUSD(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.sendZERO} */
    sendZERO(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.redeemZUSD} */
    redeemZUSD(amount: Decimalish, maxRedemptionRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersRedemption>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.stakeZERO} */
    stakeZERO(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.unstakeZERO} */
    unstakeZERO(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.withdrawGainsFromStaking} */
    withdrawGainsFromStaking(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#PopulatableLiquity.registerFrontend} */
    registerFrontend(kickbackRate: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersLiquityTransaction<void>>;
}
//# sourceMappingURL=PopulatableEthersLiquity.d.ts.map