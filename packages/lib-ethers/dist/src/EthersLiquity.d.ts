import { CollateralGainTransferDetails, Decimal, Decimalish, FailedReceipt, Fees, FrontendStatus, LiquidationDetails, LiquityStore, ZEROStake, RedemptionDetails, StabilityDeposit, StabilityDepositChangeDetails, StabilityPoolGainsWithdrawalDetails, TransactableLiquity, TransactionFailedError, Trove, TroveAdjustmentDetails, TroveAdjustmentParams, TroveClosureDetails, TroveCreationDetails, TroveCreationParams, TroveListingParams, TroveWithPendingRedistribution, UserTrove } from "@liquity/lib-base";
import { EthersLiquityConnection, EthersLiquityConnectionOptionalParams } from "./EthersLiquityConnection";
import { EthersCallOverrides, EthersProvider, EthersSigner, EthersTransactionOverrides, EthersTransactionReceipt } from "./types";
import { PopulatableEthersLiquity } from "./PopulatableEthersLiquity";
import { ReadableEthersLiquity } from "./ReadableEthersLiquity";
import { SendableEthersLiquity } from "./SendableEthersLiquity";
import { BlockPolledLiquityStore } from "./BlockPolledLiquityStore";
/**
 * Thrown by {@link EthersLiquity} in case of transaction failure.
 *
 * @public
 */
export declare class EthersTransactionFailedError extends TransactionFailedError<FailedReceipt<EthersTransactionReceipt>> {
    constructor(message: string, failedReceipt: FailedReceipt<EthersTransactionReceipt>);
}
/**
 * Convenience class that combines multiple interfaces of the library in one object.
 *
 * @public
 */
export declare class EthersLiquity implements ReadableEthersLiquity, TransactableLiquity {
    /** Information about the connection to the Liquity protocol. */
    readonly connection: EthersLiquityConnection;
    /** Can be used to create populated (unsigned) transactions. */
    readonly populate: PopulatableEthersLiquity;
    /** Can be used to send transactions without waiting for them to be mined. */
    readonly send: SendableEthersLiquity;
    private _readable;
    /** @internal */
    constructor(readable: ReadableEthersLiquity);
    /** @internal */
    static _from(connection: EthersLiquityConnection & {
        useStore: "blockPolled";
    }): EthersLiquityWithStore<BlockPolledLiquityStore>;
    /** @internal */
    static _from(connection: EthersLiquityConnection): EthersLiquity;
    /** @internal */
    static connect(signerOrProvider: EthersSigner | EthersProvider, optionalParams: EthersLiquityConnectionOptionalParams & {
        useStore: "blockPolled";
    }): Promise<EthersLiquityWithStore<BlockPolledLiquityStore>>;
    /**
     * Connect to the Liquity protocol and create an `EthersLiquity` object.
     *
     * @param signerOrProvider - Ethers `Signer` or `Provider` to use for connecting to the Ethereum
     *                           network.
     * @param optionalParams - Optional parameters that can be used to customize the connection.
     */
    static connect(signerOrProvider: EthersSigner | EthersProvider, optionalParams?: EthersLiquityConnectionOptionalParams): Promise<EthersLiquity>;
    /**
     * Check whether this `EthersLiquity` is an {@link EthersLiquityWithStore}.
     */
    hasStore(): this is EthersLiquityWithStore;
    /**
     * Check whether this `EthersLiquity` is an
     * {@link EthersLiquityWithStore}\<{@link BlockPolledLiquityStore}\>.
     */
    hasStore(store: "blockPolled"): this is EthersLiquityWithStore<BlockPolledLiquityStore>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTotalRedistributed} */
    getTotalRedistributed(overrides?: EthersCallOverrides): Promise<Trove>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTroveBeforeRedistribution} */
    getTroveBeforeRedistribution(address?: string, overrides?: EthersCallOverrides): Promise<TroveWithPendingRedistribution>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTrove} */
    getTrove(address?: string, overrides?: EthersCallOverrides): Promise<UserTrove>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getNumberOfTroves} */
    getNumberOfTroves(overrides?: EthersCallOverrides): Promise<number>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getPrice} */
    getPrice(overrides?: EthersCallOverrides): Promise<Decimal>;
    /** @internal */
    _getActivePool(overrides?: EthersCallOverrides): Promise<Trove>;
    /** @internal */
    _getDefaultPool(overrides?: EthersCallOverrides): Promise<Trove>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTotal} */
    getTotal(overrides?: EthersCallOverrides): Promise<Trove>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getStabilityDeposit} */
    getStabilityDeposit(address?: string, overrides?: EthersCallOverrides): Promise<StabilityDeposit>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getRemainingStabilityPoolZEROReward} */
    getRemainingStabilityPoolZEROReward(overrides?: EthersCallOverrides): Promise<Decimal>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZUSDInStabilityPool} */
    getZUSDInStabilityPool(overrides?: EthersCallOverrides): Promise<Decimal>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZUSDBalance} */
    getZUSDBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getNUEBalance} */
    getNUEBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZEROBalance} */
    getZEROBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getCollateralSurplusBalance} */
    getCollateralSurplusBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
    /** @internal */
    getTroves(params: TroveListingParams & {
        beforeRedistribution: true;
    }, overrides?: EthersCallOverrides): Promise<TroveWithPendingRedistribution[]>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.(getTroves:2)} */
    getTroves(params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]>;
    /** @internal */
    _getFeesFactory(overrides?: EthersCallOverrides): Promise<(blockTimestamp: number, recoveryMode: boolean) => Fees>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getFees} */
    getFees(overrides?: EthersCallOverrides): Promise<Fees>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZEROStake} */
    getZEROStake(address?: string, overrides?: EthersCallOverrides): Promise<ZEROStake>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTotalStakedZERO} */
    getTotalStakedZERO(overrides?: EthersCallOverrides): Promise<Decimal>;
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getFrontendStatus} */
    getFrontendStatus(address?: string, overrides?: EthersCallOverrides): Promise<FrontendStatus>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.openTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    openTrove(params: TroveCreationParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveCreationDetails>;
    /**
   * {@inheritDoc @liquity/lib-base#TransactableLiquity.openTrove}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   */
    openNueTrove(params: TroveCreationParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveCreationDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.closeTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    closeTrove(overrides?: EthersTransactionOverrides): Promise<TroveClosureDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.closeNueTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    closeNueTrove(overrides?: EthersTransactionOverrides): Promise<TroveClosureDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.adjustTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    adjustTrove(params: TroveAdjustmentParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveAdjustmentDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.adjustNueTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    adjustNueTrove(params: TroveAdjustmentParams<Decimalish>, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveAdjustmentDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.depositCollateral}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    depositCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveAdjustmentDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.withdrawCollateral}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    withdrawCollateral(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveAdjustmentDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.borrowZUSD}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    borrowZUSD(amount: Decimalish, maxBorrowingRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveAdjustmentDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.repayZUSD}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    repayZUSD(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<TroveAdjustmentDetails>;
    /** @internal */
    setPrice(price: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.liquidate}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    liquidate(address: string | string[], overrides?: EthersTransactionOverrides): Promise<LiquidationDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.liquidateUpTo}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    liquidateUpTo(maximumNumberOfTrovesToLiquidate: number, overrides?: EthersTransactionOverrides): Promise<LiquidationDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.depositZUSDInStabilityPool}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    depositZUSDInStabilityPool(amount: Decimalish, frontendTag?: string, overrides?: EthersTransactionOverrides): Promise<StabilityDepositChangeDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.withdrawZUSDFromStabilityPool}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    withdrawZUSDFromStabilityPool(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<StabilityDepositChangeDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.withdrawGainsFromStabilityPool}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    withdrawGainsFromStabilityPool(overrides?: EthersTransactionOverrides): Promise<StabilityPoolGainsWithdrawalDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.transferCollateralGainToTrove}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    transferCollateralGainToTrove(overrides?: EthersTransactionOverrides): Promise<CollateralGainTransferDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.sendZUSD}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    sendZUSD(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.sendZERO}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    sendZERO(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.redeemZUSD}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    redeemZUSD(amount: Decimalish, maxRedemptionRate?: Decimalish, overrides?: EthersTransactionOverrides): Promise<RedemptionDetails>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.claimCollateralSurplus}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    claimCollateralSurplus(overrides?: EthersTransactionOverrides): Promise<void>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.stakeZERO}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    stakeZERO(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.unstakeZERO}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    unstakeZERO(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.withdrawGainsFromStaking}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    withdrawGainsFromStaking(overrides?: EthersTransactionOverrides): Promise<void>;
    /**
     * {@inheritDoc @liquity/lib-base#TransactableLiquity.registerFrontend}
     *
     * @throws
     * Throws {@link EthersTransactionFailedError} in case of transaction failure.
     */
    registerFrontend(kickbackRate: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
}
/**
 * Variant of {@link EthersLiquity} that exposes a {@link @liquity/lib-base#LiquityStore}.
 *
 * @public
 */
export interface EthersLiquityWithStore<T extends LiquityStore = LiquityStore> extends EthersLiquity {
    /** An object that implements LiquityStore. */
    readonly store: T;
}
//# sourceMappingURL=EthersLiquity.d.ts.map