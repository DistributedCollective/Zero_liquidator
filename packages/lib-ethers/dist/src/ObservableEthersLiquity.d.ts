import { Decimal, ObservableLiquity, StabilityDeposit, Trove, TroveWithPendingRedistribution } from "@liquity/lib-base";
import { ReadableEthersLiquity } from "./ReadableEthersLiquity";
/** @alpha */
export declare class ObservableEthersLiquity implements ObservableLiquity {
    private readonly _readable;
    constructor(readable: ReadableEthersLiquity);
    watchTotalRedistributed(onTotalRedistributedChanged: (totalRedistributed: Trove) => void): () => void;
    watchTroveWithoutRewards(onTroveChanged: (trove: TroveWithPendingRedistribution) => void, address?: string): () => void;
    watchNumberOfTroves(onNumberOfTrovesChanged: (numberOfTroves: number) => void): () => void;
    watchPrice(onPriceChanged: (price: Decimal) => void): () => void;
    watchTotal(onTotalChanged: (total: Trove) => void): () => void;
    watchStabilityDeposit(onStabilityDepositChanged: (stabilityDeposit: StabilityDeposit) => void, address?: string): () => void;
    watchZUSDInStabilityPool(onZUSDInStabilityPoolChanged: (zusdInStabilityPool: Decimal) => void): () => void;
    watchZUSDBalance(onZUSDBalanceChanged: (balance: Decimal) => void, address?: string): () => void;
    watchNUEBalance(onNUEBalanceChanged: (balance: Decimal) => void, address?: string): () => void;
}
//# sourceMappingURL=ObservableEthersLiquity.d.ts.map