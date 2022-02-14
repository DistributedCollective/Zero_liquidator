"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._CachedReadableLiquity = void 0;
/** @internal */
class _CachedReadableLiquity {
    constructor(readable, cache) {
        this._readable = readable;
        this._cache = cache;
    }
    async getTotalRedistributed(...extraParams) {
        var _a;
        return ((_a = this._cache.getTotalRedistributed(...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getTotalRedistributed(...extraParams));
    }
    async getTroveBeforeRedistribution(address, ...extraParams) {
        var _a;
        return ((_a = this._cache.getTroveBeforeRedistribution(address, ...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getTroveBeforeRedistribution(address, ...extraParams));
    }
    async getTrove(address, ...extraParams) {
        const [troveBeforeRedistribution, totalRedistributed] = await Promise.all([
            this.getTroveBeforeRedistribution(address, ...extraParams),
            this.getTotalRedistributed(...extraParams)
        ]);
        return troveBeforeRedistribution.applyRedistribution(totalRedistributed);
    }
    async getNumberOfTroves(...extraParams) {
        var _a;
        return ((_a = this._cache.getNumberOfTroves(...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getNumberOfTroves(...extraParams));
    }
    async getPrice(...extraParams) {
        var _a;
        return (_a = this._cache.getPrice(...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getPrice(...extraParams);
    }
    async getTotal(...extraParams) {
        var _a;
        return (_a = this._cache.getTotal(...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getTotal(...extraParams);
    }
    async getStabilityDeposit(address, ...extraParams) {
        var _a;
        return ((_a = this._cache.getStabilityDeposit(address, ...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getStabilityDeposit(address, ...extraParams));
    }
    async getRemainingStabilityPoolZEROReward(...extraParams) {
        var _a;
        return ((_a = this._cache.getRemainingStabilityPoolZEROReward(...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getRemainingStabilityPoolZEROReward(...extraParams));
    }
    async getZUSDInStabilityPool(...extraParams) {
        var _a;
        return ((_a = this._cache.getZUSDInStabilityPool(...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getZUSDInStabilityPool(...extraParams));
    }
    async getZUSDBalance(address, ...extraParams) {
        var _a;
        return ((_a = this._cache.getZUSDBalance(address, ...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getZUSDBalance(address, ...extraParams));
    }
    async getNUEBalance(address, ...extraParams) {
        var _a;
        return ((_a = this._cache.getNUEBalance(address, ...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getNUEBalance(address, ...extraParams));
    }
    async getZEROBalance(address, ...extraParams) {
        var _a;
        return ((_a = this._cache.getZEROBalance(address, ...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getZEROBalance(address, ...extraParams));
    }
    async getCollateralSurplusBalance(address, ...extraParams) {
        var _a;
        return ((_a = this._cache.getCollateralSurplusBalance(address, ...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getCollateralSurplusBalance(address, ...extraParams));
    }
    async getTroves(params, ...extraParams) {
        var _a;
        const { beforeRedistribution, ...restOfParams } = params;
        const [totalRedistributed, troves] = await Promise.all([
            beforeRedistribution ? undefined : this.getTotalRedistributed(...extraParams),
            (_a = this._cache.getTroves({ beforeRedistribution: true, ...restOfParams }, ...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getTroves({ beforeRedistribution: true, ...restOfParams }, ...extraParams)
        ]);
        if (totalRedistributed) {
            return troves.map(trove => trove.applyRedistribution(totalRedistributed));
        }
        else {
            return troves;
        }
    }
    async getFees(...extraParams) {
        var _a;
        return (_a = this._cache.getFees(...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getFees(...extraParams);
    }
    async getZEROStake(address, ...extraParams) {
        var _a;
        return ((_a = this._cache.getZEROStake(address, ...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getZEROStake(address, ...extraParams));
    }
    async getTotalStakedZERO(...extraParams) {
        var _a;
        return ((_a = this._cache.getTotalStakedZERO(...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getTotalStakedZERO(...extraParams));
    }
    async getFrontendStatus(address, ...extraParams) {
        var _a;
        return ((_a = this._cache.getFrontendStatus(address, ...extraParams)) !== null && _a !== void 0 ? _a : this._readable.getFrontendStatus(address, ...extraParams));
    }
}
exports._CachedReadableLiquity = _CachedReadableLiquity;
//# sourceMappingURL=_CachedReadableLiquity.js.map