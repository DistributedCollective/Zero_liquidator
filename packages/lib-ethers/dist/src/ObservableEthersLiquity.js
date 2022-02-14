"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservableEthersLiquity = void 0;
const EthersLiquityConnection_1 = require("./EthersLiquityConnection");
const debouncingDelayMs = 50;
const debounce = (listener) => {
    let timeoutId = undefined;
    let latestBlock = 0;
    return (...args) => {
        const event = args[args.length - 1];
        if (event.blockNumber !== undefined && event.blockNumber > latestBlock) {
            latestBlock = event.blockNumber;
        }
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            listener(latestBlock);
            timeoutId = undefined;
        }, debouncingDelayMs);
    };
};
/** @alpha */
class ObservableEthersLiquity {
    constructor(readable) {
        this._readable = readable;
    }
    watchTotalRedistributed(onTotalRedistributedChanged) {
        const { activePool, defaultPool } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const etherSent = activePool.filters.EtherSent();
        const redistributionListener = debounce((blockTag) => {
            this._readable.getTotalRedistributed({ blockTag }).then(onTotalRedistributedChanged);
        });
        const etherSentListener = (toAddress, _amount, event) => {
            if (toAddress === defaultPool.address) {
                redistributionListener(event);
            }
        };
        activePool.on(etherSent, etherSentListener);
        return () => {
            activePool.removeListener(etherSent, etherSentListener);
        };
    }
    watchTroveWithoutRewards(onTroveChanged, address) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireAddress(this._readable.connection));
        const { troveManager, borrowerOperations } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const troveUpdatedByTroveManager = troveManager.filters.TroveUpdated(address);
        const troveUpdatedByBorrowerOperations = borrowerOperations.filters.TroveUpdated(address);
        const troveListener = debounce((blockTag) => {
            this._readable.getTroveBeforeRedistribution(address, { blockTag }).then(onTroveChanged);
        });
        troveManager.on(troveUpdatedByTroveManager, troveListener);
        borrowerOperations.on(troveUpdatedByBorrowerOperations, troveListener);
        return () => {
            troveManager.removeListener(troveUpdatedByTroveManager, troveListener);
            borrowerOperations.removeListener(troveUpdatedByBorrowerOperations, troveListener);
        };
    }
    watchNumberOfTroves(onNumberOfTrovesChanged) {
        const { troveManager } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const { TroveUpdated } = troveManager.filters;
        const troveUpdated = TroveUpdated();
        const troveUpdatedListener = debounce((blockTag) => {
            this._readable.getNumberOfTroves({ blockTag }).then(onNumberOfTrovesChanged);
        });
        troveManager.on(troveUpdated, troveUpdatedListener);
        return () => {
            troveManager.removeListener(troveUpdated, troveUpdatedListener);
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    watchPrice(onPriceChanged) {
        // TODO revisit
        // We no longer have our own PriceUpdated events. If we want to implement this in an event-based
        // manner, we'll need to listen to aggregator events directly. Or we could do polling.
        throw new Error("Method not implemented.");
    }
    watchTotal(onTotalChanged) {
        const { troveManager } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const { TroveUpdated } = troveManager.filters;
        const troveUpdated = TroveUpdated();
        const totalListener = debounce((blockTag) => {
            this._readable.getTotal({ blockTag }).then(onTotalChanged);
        });
        troveManager.on(troveUpdated, totalListener);
        return () => {
            troveManager.removeListener(troveUpdated, totalListener);
        };
    }
    watchStabilityDeposit(onStabilityDepositChanged, address) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireAddress(this._readable.connection));
        const { activePool, stabilityPool } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const { UserDepositChanged } = stabilityPool.filters;
        const { EtherSent } = activePool.filters;
        const userDepositChanged = UserDepositChanged(address);
        const etherSent = EtherSent();
        const depositListener = debounce((blockTag) => {
            this._readable.getStabilityDeposit(address, { blockTag }).then(onStabilityDepositChanged);
        });
        const etherSentListener = (toAddress, _amount, event) => {
            if (toAddress === stabilityPool.address) {
                // Liquidation while Stability Pool has some deposits
                // There may be new gains
                depositListener(event);
            }
        };
        stabilityPool.on(userDepositChanged, depositListener);
        activePool.on(etherSent, etherSentListener);
        return () => {
            stabilityPool.removeListener(userDepositChanged, depositListener);
            activePool.removeListener(etherSent, etherSentListener);
        };
    }
    watchZUSDInStabilityPool(onZUSDInStabilityPoolChanged) {
        const { zusdToken, stabilityPool } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const { Transfer } = zusdToken.filters;
        const transferZUSDFromStabilityPool = Transfer(stabilityPool.address);
        const transferZUSDToStabilityPool = Transfer(null, stabilityPool.address);
        const stabilityPoolZUSDFilters = [transferZUSDFromStabilityPool, transferZUSDToStabilityPool];
        const stabilityPoolZUSDListener = debounce((blockTag) => {
            this._readable.getZUSDInStabilityPool({ blockTag }).then(onZUSDInStabilityPoolChanged);
        });
        stabilityPoolZUSDFilters.forEach(filter => zusdToken.on(filter, stabilityPoolZUSDListener));
        return () => stabilityPoolZUSDFilters.forEach(filter => zusdToken.removeListener(filter, stabilityPoolZUSDListener));
    }
    watchZUSDBalance(onZUSDBalanceChanged, address) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireAddress(this._readable.connection));
        const { zusdToken } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        const { Transfer } = zusdToken.filters;
        const transferZUSDFromUser = Transfer(address);
        const transferZUSDToUser = Transfer(null, address);
        const zusdTransferFilters = [transferZUSDFromUser, transferZUSDToUser];
        const zusdTransferListener = debounce((blockTag) => {
            this._readable.getZUSDBalance(address, { blockTag }).then(onZUSDBalanceChanged);
        });
        zusdTransferFilters.forEach(filter => zusdToken.on(filter, zusdTransferListener));
        return () => zusdTransferFilters.forEach(filter => zusdToken.removeListener(filter, zusdTransferListener));
    }
    watchNUEBalance(onNUEBalanceChanged, address) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireAddress(this._readable.connection));
        const { nueToken } = EthersLiquityConnection_1._getContracts(this._readable.connection);
        if (!nueToken) {
            throw "nue token address not set";
        }
        const { Transfer } = nueToken.filters;
        const transferNUEFromUser = Transfer(address);
        const transferNUEToUser = Transfer(null, address);
        const nueTransferFilters = [transferNUEFromUser, transferNUEToUser];
        const zusdTransferListener = debounce((blockTag) => {
            this._readable.getNUEBalance(address, { blockTag }).then(onNUEBalanceChanged);
        });
        nueTransferFilters.forEach(filter => nueToken.on(filter, zusdTransferListener));
        return () => nueTransferFilters.forEach(filter => nueToken.removeListener(filter, zusdTransferListener));
    }
}
exports.ObservableEthersLiquity = ObservableEthersLiquity;
//# sourceMappingURL=ObservableEthersLiquity.js.map