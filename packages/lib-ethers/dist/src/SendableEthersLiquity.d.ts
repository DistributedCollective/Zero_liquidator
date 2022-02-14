import { CollateralGainTransferDetails, Decimalish, LiquidationDetails, RedemptionDetails, SendableLiquity, StabilityDepositChangeDetails, StabilityPoolGainsWithdrawalDetails, TroveAdjustmentDetails, TroveAdjustmentParams, TroveClosureDetails, TroveCreationDetails, TroveCreationParams } from "@liquity/lib-base";
import { EthersTransactionOverrides, EthersTransactionReceipt, EthersTransactionResponse } from "./types";
import { PopulatableEthersLiquity, SentEthersLiquityTransaction } from "./PopulatableEthersLiquity";
/**
 * Ethers-based implementation of {@link @liquity/lib-base#SendableLiquity}.
 *
 * @public
 */
export declare class SendableEthersLiquity implements SendableLiquity<EthersTransactionReceipt, EthersTransactionResponse> {
    private _populate;
    constructor(populatable: PopulatableEthersLiquity);
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.openTrove} */
    openTrove(params: TroveCreationParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<TroveCreationDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.openNueTrove} */
    openNueTrove(params: TroveCreationParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<TroveCreationDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.closeTrove} */
    closeTrove(overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<TroveClosureDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.closeNueTrove} */
    closeNueTrove(overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<TroveClosureDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.adjustTrove} */
    adjustTrove(params: TroveAdjustmentParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.adjustNueTrove} */
    adjustNueTrove(params: TroveAdjustmentParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.depositCollateral} */
    depositCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.withdrawCollateral} */
    withdrawCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.borrowZUSD} */
    borrowZUSD(amount: Decimalish, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.repayZUSD} */
    repayZUSD(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<TroveAdjustmentDetails>>;
    /** @internal */
    setPrice(price: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.liquidate} */
    liquidate(address: string | string[], overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<LiquidationDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.liquidateUpTo} */
    liquidateUpTo(maximumNumberOfTrovesToLiquidate: number, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<LiquidationDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.depositZUSDInStabilityPool} */
    depositZUSDInStabilityPool(amount: Decimalish, frontendTag?: string, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<StabilityDepositChangeDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.withdrawZUSDFromStabilityPool} */
    withdrawZUSDFromStabilityPool(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<StabilityDepositChangeDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.withdrawGainsFromStabilityPool} */
    withdrawGainsFromStabilityPool(overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<StabilityPoolGainsWithdrawalDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.transferCollateralGainToTrove} */
    transferCollateralGainToTrove(overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<CollateralGainTransferDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.sendZUSD} */
    sendZUSD(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.sendZERO} */
    sendZERO(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.redeemZUSD} */
    redeemZUSD(amount: Decimalish, maxRedemptionRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<RedemptionDetails>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.claimCollateralSurplus} */
    claimCollateralSurplus(overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.stakeZERO} */
    stakeZERO(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.unstakeZERO} */
    unstakeZERO(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.withdrawGainsFromStaking} */
    withdrawGainsFromStaking(overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<void>>;
    /** {@inheritDoc @liquity/lib-base#SendableLiquity.registerFrontend} */
    registerFrontend(kickbackRate: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersLiquityTransaction<void>>;
}
//# sourceMappingURL=SendableEthersLiquity.d.ts.map