"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadableEthersLiquity = void 0;
const lib_base_1 = require("@liquity/lib-base");
const EthersLiquityConnection_1 = require("./EthersLiquityConnection");
const BlockPolledLiquityStore_1 = require("./BlockPolledLiquityStore");
// TODO: these are constant in the contracts, so it doesn't make sense to make a call for them,
// but to avoid having to update them here when we change them in the contracts, we could read
// them once after deployment and save them to LiquityDeployment.
const MINUTE_DECAY_FACTOR = lib_base_1.Decimal.from("0.999037758833783000");
const BETA = lib_base_1.Decimal.from(2);
var BackendTroveStatus;
(function (BackendTroveStatus) {
    BackendTroveStatus[BackendTroveStatus["nonExistent"] = 0] = "nonExistent";
    BackendTroveStatus[BackendTroveStatus["active"] = 1] = "active";
    BackendTroveStatus[BackendTroveStatus["closedByOwner"] = 2] = "closedByOwner";
    BackendTroveStatus[BackendTroveStatus["closedByLiquidation"] = 3] = "closedByLiquidation";
    BackendTroveStatus[BackendTroveStatus["closedByRedemption"] = 4] = "closedByRedemption";
})(BackendTroveStatus || (BackendTroveStatus = {}));
const panic = (error) => {
    throw error;
};
const userTroveStatusFrom = (backendStatus) => backendStatus === BackendTroveStatus.nonExistent
    ? "nonExistent"
    : backendStatus === BackendTroveStatus.active
        ? "open"
        : backendStatus === BackendTroveStatus.closedByOwner
            ? "closedByOwner"
            : backendStatus === BackendTroveStatus.closedByLiquidation
                ? "closedByLiquidation"
                : backendStatus === BackendTroveStatus.closedByRedemption
                    ? "closedByRedemption"
                    : panic(new Error(`invalid backendStatus ${backendStatus}`));
const decimalify = (bigNumber) => lib_base_1.Decimal.fromBigNumberString(bigNumber.toHexString());
const numberify = (bigNumber) => bigNumber.toNumber();
const convertToDate = (timestamp) => new Date(timestamp * 1000);
const validSortingOptions = ["ascendingCollateralRatio", "descendingCollateralRatio"];
const expectPositiveInt = (obj, key) => {
    if (obj[key] !== undefined) {
        if (!Number.isInteger(obj[key])) {
            throw new Error(`${key} must be an integer`);
        }
        if (obj[key] < 0) {
            throw new Error(`${key} must not be negative`);
        }
    }
};
/**
 * Ethers-based implementation of {@link @liquity/lib-base#ReadableLiquity}.
 *
 * @public
 */
class ReadableEthersLiquity {
    /** @internal */
    constructor(connection) {
        this.connection = connection;
    }
    /** @internal */
    static _from(connection) {
        const readable = new ReadableEthersLiquity(connection);
        return connection.useStore === "blockPolled"
            ? new _BlockPolledReadableEthersLiquity(readable)
            : readable;
    }
    /**
     * Connect to the Liquity protocol and create a `ReadableEthersLiquity` object.
     *
     * @param signerOrProvider - Ethers `Signer` or `Provider` to use for connecting to the Ethereum
     *                           network.
     * @param optionalParams - Optional parameters that can be used to customize the connection.
     */
    static async connect(signerOrProvider, optionalParams) {
        return ReadableEthersLiquity._from(await EthersLiquityConnection_1._connect(signerOrProvider, optionalParams));
    }
    hasStore() {
        return false;
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTotalRedistributed} */
    async getTotalRedistributed(overrides) {
        const { troveManager } = EthersLiquityConnection_1._getContracts(this.connection);
        const [collateral, debt] = await Promise.all([
            troveManager.L_ETH({ ...overrides }).then(decimalify),
            troveManager.L_ZUSDDebt({ ...overrides }).then(decimalify)
        ]);
        return new lib_base_1.Trove(collateral, debt);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTroveBeforeRedistribution} */
    async getTroveBeforeRedistribution(address, overrides) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireAddress(this.connection));
        const { troveManager } = EthersLiquityConnection_1._getContracts(this.connection);
        const [trove, snapshot] = await Promise.all([
            troveManager.Troves(address, { ...overrides }),
            troveManager.rewardSnapshots(address, { ...overrides })
        ]);
        if (trove.status === BackendTroveStatus.active) {
            return new lib_base_1.TroveWithPendingRedistribution(address, userTroveStatusFrom(trove.status), decimalify(trove.coll), decimalify(trove.debt), decimalify(trove.stake), new lib_base_1.Trove(decimalify(snapshot.ETH), decimalify(snapshot.ZUSDDebt)));
        }
        else {
            return new lib_base_1.TroveWithPendingRedistribution(address, userTroveStatusFrom(trove.status));
        }
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTrove} */
    async getTrove(address, overrides) {
        const [trove, totalRedistributed] = await Promise.all([
            this.getTroveBeforeRedistribution(address, overrides),
            this.getTotalRedistributed(overrides)
        ]);
        return trove.applyRedistribution(totalRedistributed);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getNumberOfTroves} */
    async getNumberOfTroves(overrides) {
        const { troveManager } = EthersLiquityConnection_1._getContracts(this.connection);
        return (await troveManager.getTroveOwnersCount({ ...overrides })).toNumber();
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getPrice} */
    getPrice(overrides) {
        const { priceFeed } = EthersLiquityConnection_1._getContracts(this.connection);
        return priceFeed.callStatic.fetchPrice({ ...overrides }).then(decimalify);
    }
    /** @internal */
    async _getActivePool(overrides) {
        const { activePool } = EthersLiquityConnection_1._getContracts(this.connection);
        const [activeCollateral, activeDebt] = await Promise.all([
            activePool.getETH({ ...overrides }),
            activePool.getZUSDDebt({ ...overrides })
        ].map(getBigNumber => getBigNumber.then(decimalify)));
        return new lib_base_1.Trove(activeCollateral, activeDebt);
    }
    /** @internal */
    async _getDefaultPool(overrides) {
        const { defaultPool } = EthersLiquityConnection_1._getContracts(this.connection);
        const [liquidatedCollateral, closedDebt] = await Promise.all([
            defaultPool.getETH({ ...overrides }),
            defaultPool.getZUSDDebt({ ...overrides })
        ].map(getBigNumber => getBigNumber.then(decimalify)));
        return new lib_base_1.Trove(liquidatedCollateral, closedDebt);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTotal} */
    async getTotal(overrides) {
        const [activePool, defaultPool] = await Promise.all([
            this._getActivePool(overrides),
            this._getDefaultPool(overrides)
        ]);
        return activePool.add(defaultPool);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getStabilityDeposit} */
    async getStabilityDeposit(address, overrides) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireAddress(this.connection));
        const { stabilityPool } = EthersLiquityConnection_1._getContracts(this.connection);
        const [{ frontEndTag, initialValue }, currentZUSD, collateralGain, zeroReward] = await Promise.all([
            stabilityPool.deposits(address, { ...overrides }),
            stabilityPool.getCompoundedZUSDDeposit(address, { ...overrides }),
            stabilityPool.getDepositorETHGain(address, { ...overrides }),
            stabilityPool.getDepositorSOVGain(address, { ...overrides })
        ]);
        return new lib_base_1.StabilityDeposit(decimalify(initialValue), decimalify(currentZUSD), decimalify(collateralGain), decimalify(zeroReward), frontEndTag);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getRemainingStabilityPoolZEROReward} */
    async getRemainingStabilityPoolZEROReward(overrides) {
        const { communityIssuance } = EthersLiquityConnection_1._getContracts(this.connection);
        const issuanceCap = decimalify(await communityIssuance.ZEROSupplyCap());
        const totalZEROIssued = decimalify(await communityIssuance.totalZEROIssued({ ...overrides }));
        const remaining = issuanceCap.gt(totalZEROIssued)
            ? issuanceCap.sub(totalZEROIssued)
            : lib_base_1.Decimal.from(0);
        return remaining;
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZUSDInStabilityPool} */
    getZUSDInStabilityPool(overrides) {
        const { stabilityPool } = EthersLiquityConnection_1._getContracts(this.connection);
        return stabilityPool.getTotalZUSDDeposits({ ...overrides }).then(decimalify);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZUSDBalance} */
    getZUSDBalance(address, overrides) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireAddress(this.connection));
        const { zusdToken } = EthersLiquityConnection_1._getContracts(this.connection);
        return zusdToken.balanceOf(address, { ...overrides }).then(decimalify);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getNUEBalance} */
    getNUEBalance(address, overrides) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireAddress(this.connection));
        const { nueToken } = EthersLiquityConnection_1._getContracts(this.connection);
        if (!nueToken) {
            throw "nue token address not set";
        }
        return nueToken.balanceOf(address, { ...overrides }).then(decimalify);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZEROBalance} */
    getZEROBalance(address, overrides) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireAddress(this.connection));
        const { zeroToken } = EthersLiquityConnection_1._getContracts(this.connection);
        return zeroToken.balanceOf(address, { ...overrides }).then(decimalify);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getCollateralSurplusBalance} */
    getCollateralSurplusBalance(address, overrides) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireAddress(this.connection));
        const { collSurplusPool } = EthersLiquityConnection_1._getContracts(this.connection);
        return collSurplusPool.getCollateral(address, { ...overrides }).then(decimalify);
    }
    async getTroves(params, overrides) {
        var _a, _b;
        const { multiTroveGetter } = EthersLiquityConnection_1._getContracts(this.connection);
        expectPositiveInt(params, "first");
        expectPositiveInt(params, "startingAt");
        if (!validSortingOptions.includes(params.sortedBy)) {
            throw new Error(`sortedBy must be one of: ${validSortingOptions.map(x => `"${x}"`).join(", ")}`);
        }
        const [totalRedistributed, backendTroves] = await Promise.all([
            params.beforeRedistribution ? undefined : this.getTotalRedistributed({ ...overrides }),
            multiTroveGetter.getMultipleSortedTroves(params.sortedBy === "descendingCollateralRatio"
                ? (_a = params.startingAt) !== null && _a !== void 0 ? _a : 0 : -(((_b = params.startingAt) !== null && _b !== void 0 ? _b : 0) + 1), params.first, { ...overrides })
        ]);
        const troves = mapBackendTroves(backendTroves);
        if (totalRedistributed) {
            return troves.map(trove => trove.applyRedistribution(totalRedistributed));
        }
        else {
            return troves;
        }
    }
    /** @internal */
    async _getFeesFactory(overrides) {
        const { troveManager } = EthersLiquityConnection_1._getContracts(this.connection);
        const [lastFeeOperationTime, baseRateWithoutDecay] = await Promise.all([
            troveManager.lastFeeOperationTime({ ...overrides }),
            troveManager.baseRate({ ...overrides }).then(decimalify)
        ]);
        return (blockTimestamp, recoveryMode) => new lib_base_1.Fees(baseRateWithoutDecay, MINUTE_DECAY_FACTOR, BETA, convertToDate(lastFeeOperationTime.toNumber()), convertToDate(blockTimestamp), recoveryMode);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getFees} */
    async getFees(overrides) {
        const [createFees, total, price, blockTimestamp] = await Promise.all([
            this._getFeesFactory(overrides),
            this.getTotal(overrides),
            this.getPrice(overrides),
            EthersLiquityConnection_1._getBlockTimestamp(this.connection, overrides === null || overrides === void 0 ? void 0 : overrides.blockTag)
        ]);
        return createFees(blockTimestamp, total.collateralRatioIsBelowCritical(price));
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getZEROStake} */
    async getZEROStake(address, overrides) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireAddress(this.connection));
        const { zeroStaking } = EthersLiquityConnection_1._getContracts(this.connection);
        const [stakedZERO, collateralGain, zusdGain] = await Promise.all([
            zeroStaking.stakes(address, { ...overrides }),
            zeroStaking.getPendingETHGain(address, { ...overrides }),
            zeroStaking.getPendingZUSDGain(address, { ...overrides })
        ].map(getBigNumber => getBigNumber.then(decimalify)));
        return new lib_base_1.ZEROStake(stakedZERO, collateralGain, zusdGain);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getTotalStakedZERO} */
    async getTotalStakedZERO(overrides) {
        const { zeroStaking } = EthersLiquityConnection_1._getContracts(this.connection);
        return zeroStaking.totalZEROStaked({ ...overrides }).then(decimalify);
    }
    /** {@inheritDoc @liquity/lib-base#ReadableLiquity.getFrontendStatus} */
    async getFrontendStatus(address, overrides) {
        address !== null && address !== void 0 ? address : (address = EthersLiquityConnection_1._requireFrontendAddress(this.connection));
        const { stabilityPool } = EthersLiquityConnection_1._getContracts(this.connection);
        const { registered, kickbackRate } = await stabilityPool.frontEnds(address, { ...overrides });
        return registered
            ? { status: "registered", kickbackRate: decimalify(kickbackRate) }
            : { status: "unregistered" };
    }
}
exports.ReadableEthersLiquity = ReadableEthersLiquity;
const mapBackendTroves = (troves) => troves.map(trove => new lib_base_1.TroveWithPendingRedistribution(trove.owner, "open", // These Troves are coming from the SortedTroves list, so they must be open
decimalify(trove.coll), decimalify(trove.debt), decimalify(trove.stake), new lib_base_1.Trove(decimalify(trove.snapshotETH), decimalify(trove.snapshotZUSDDebt))));
class BlockPolledLiquityStoreBasedCache {
    constructor(store) {
        this._store = store;
    }
    _blockHit(overrides) {
        return (!overrides ||
            overrides.blockTag === undefined ||
            overrides.blockTag === this._store.state.blockTag);
    }
    _userHit(address, overrides) {
        return (this._blockHit(overrides) &&
            (address === undefined || address === this._store.connection.userAddress));
    }
    _frontendHit(address, overrides) {
        return (this._blockHit(overrides) &&
            (address === undefined || address === this._store.connection.frontendTag));
    }
    getTotalRedistributed(overrides) {
        if (this._blockHit(overrides)) {
            return this._store.state.totalRedistributed;
        }
    }
    getTroveBeforeRedistribution(address, overrides) {
        if (this._userHit(address, overrides)) {
            return this._store.state.troveBeforeRedistribution;
        }
    }
    getTrove(address, overrides) {
        if (this._userHit(address, overrides)) {
            return this._store.state.trove;
        }
    }
    getNumberOfTroves(overrides) {
        if (this._blockHit(overrides)) {
            return this._store.state.numberOfTroves;
        }
    }
    getPrice(overrides) {
        if (this._blockHit(overrides)) {
            return this._store.state.price;
        }
    }
    getTotal(overrides) {
        if (this._blockHit(overrides)) {
            return this._store.state.total;
        }
    }
    getStabilityDeposit(address, overrides) {
        if (this._userHit(address, overrides)) {
            return this._store.state.stabilityDeposit;
        }
    }
    getRemainingStabilityPoolZEROReward(overrides) {
        if (this._blockHit(overrides)) {
            return this._store.state.remainingStabilityPoolZEROReward;
        }
    }
    getZUSDInStabilityPool(overrides) {
        if (this._blockHit(overrides)) {
            return this._store.state.zusdInStabilityPool;
        }
    }
    getZUSDBalance(address, overrides) {
        if (this._userHit(address, overrides)) {
            return this._store.state.zusdBalance;
        }
    }
    getNUEBalance(address, overrides) {
        if (this._userHit(address, overrides)) {
            return this._store.state.nueBalance;
        }
    }
    getZEROBalance(address, overrides) {
        if (this._userHit(address, overrides)) {
            return this._store.state.zeroBalance;
        }
    }
    getCollateralSurplusBalance(address, overrides) {
        if (this._userHit(address, overrides)) {
            return this._store.state.collateralSurplusBalance;
        }
    }
    getFees(overrides) {
        if (this._blockHit(overrides)) {
            return this._store.state.fees;
        }
    }
    getZEROStake(address, overrides) {
        if (this._userHit(address, overrides)) {
            return this._store.state.zeroStake;
        }
    }
    getTotalStakedZERO(overrides) {
        if (this._blockHit(overrides)) {
            return this._store.state.totalStakedZERO;
        }
    }
    getFrontendStatus(address, overrides) {
        if (this._frontendHit(address, overrides)) {
            return this._store.state.frontend;
        }
    }
    getTroves() {
        return undefined;
    }
}
class _BlockPolledReadableEthersLiquity extends lib_base_1._CachedReadableLiquity {
    constructor(readable) {
        const store = new BlockPolledLiquityStore_1.BlockPolledLiquityStore(readable);
        super(readable, new BlockPolledLiquityStoreBasedCache(store));
        this.store = store;
        this.connection = readable.connection;
    }
    hasStore(store) {
        return store === undefined || store === "blockPolled";
    }
    _getActivePool() {
        throw new Error("Method not implemented.");
    }
    _getDefaultPool() {
        throw new Error("Method not implemented.");
    }
    _getFeesFactory() {
        throw new Error("Method not implemented.");
    }
    _getRemainingLiquidityMiningZERORewardCalculator() {
        throw new Error("Method not implemented.");
    }
}
//# sourceMappingURL=ReadableEthersLiquity.js.map