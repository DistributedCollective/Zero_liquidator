"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockPolledLiquityStore = void 0;
const constants_1 = require("@ethersproject/constants");
const lib_base_1 = require("@liquity/lib-base");
const EthersLiquityConnection_1 = require("./EthersLiquityConnection");
const promiseAllValues = (object) => {
    const keys = Object.keys(object);
    return Promise.all(Object.values(object)).then(values => Object.fromEntries(values.map((value, i) => [keys[i], value])));
};
const decimalify = (bigNumber) => lib_base_1.Decimal.fromBigNumberString(bigNumber.toHexString());
/**
 * Ethers-based {@link @liquity/lib-base#LiquityStore} that updates state whenever there's a new
 * block.
 *
 * @public
 */
class BlockPolledLiquityStore extends lib_base_1.LiquityStore {
    constructor(readable) {
        super();
        this.connection = readable.connection;
        this._readable = readable;
        this._provider = EthersLiquityConnection_1._getProvider(readable.connection);
    }
    async _getRiskiestTroveBeforeRedistribution(overrides) {
        const riskiestTroves = await this._readable.getTroves({ first: 1, sortedBy: "ascendingCollateralRatio", beforeRedistribution: true }, overrides);
        if (riskiestTroves.length === 0) {
            return new lib_base_1.TroveWithPendingRedistribution(constants_1.AddressZero, "nonExistent");
        }
        return riskiestTroves[0];
    }
    async _get(blockTag) {
        const { userAddress, frontendTag } = this.connection;
        const { blockTimestamp, createFees, ...baseState } = await promiseAllValues({
            blockTimestamp: EthersLiquityConnection_1._getBlockTimestamp(this.connection, blockTag),
            createFees: this._readable._getFeesFactory({ blockTag }),
            price: this._readable.getPrice({ blockTag }),
            numberOfTroves: this._readable.getNumberOfTroves({ blockTag }),
            totalRedistributed: this._readable.getTotalRedistributed({ blockTag }),
            total: this._readable.getTotal({ blockTag }),
            zusdInStabilityPool: this._readable.getZUSDInStabilityPool({ blockTag }),
            totalStakedZERO: this._readable.getTotalStakedZERO({ blockTag }),
            _riskiestTroveBeforeRedistribution: this._getRiskiestTroveBeforeRedistribution({ blockTag }),
            remainingStabilityPoolZEROReward: this._readable.getRemainingStabilityPoolZEROReward({
                blockTag
            }),
            frontend: frontendTag
                ? this._readable.getFrontendStatus(frontendTag, { blockTag })
                : { status: "unregistered" },
            ...(userAddress
                ? {
                    accountBalance: this._provider.getBalance(userAddress, blockTag).then(decimalify),
                    zusdBalance: this._readable.getZUSDBalance(userAddress, { blockTag }),
                    nueBalance: this._readable.getNUEBalance(userAddress, { blockTag }),
                    zeroBalance: this._readable.getZEROBalance(userAddress, { blockTag }),
                    collateralSurplusBalance: this._readable.getCollateralSurplusBalance(userAddress, {
                        blockTag
                    }),
                    troveBeforeRedistribution: this._readable.getTroveBeforeRedistribution(userAddress, {
                        blockTag
                    }),
                    stabilityDeposit: this._readable.getStabilityDeposit(userAddress, { blockTag }),
                    zeroStake: this._readable.getZEROStake(userAddress, { blockTag }),
                    ownFrontend: this._readable.getFrontendStatus(userAddress, { blockTag })
                }
                : {
                    accountBalance: lib_base_1.Decimal.ZERO,
                    zusdBalance: lib_base_1.Decimal.ZERO,
                    nueBalance: lib_base_1.Decimal.ZERO,
                    zeroBalance: lib_base_1.Decimal.ZERO,
                    uniTokenBalance: lib_base_1.Decimal.ZERO,
                    uniTokenAllowance: lib_base_1.Decimal.ZERO,
                    liquidityMiningStake: lib_base_1.Decimal.ZERO,
                    liquidityMiningZEROReward: lib_base_1.Decimal.ZERO,
                    collateralSurplusBalance: lib_base_1.Decimal.ZERO,
                    troveBeforeRedistribution: new lib_base_1.TroveWithPendingRedistribution(constants_1.AddressZero, "nonExistent"),
                    stabilityDeposit: new lib_base_1.StabilityDeposit(lib_base_1.Decimal.ZERO, lib_base_1.Decimal.ZERO, lib_base_1.Decimal.ZERO, lib_base_1.Decimal.ZERO, constants_1.AddressZero),
                    zeroStake: new lib_base_1.ZEROStake(),
                    ownFrontend: { status: "unregistered" }
                })
        });
        return [
            {
                ...baseState,
                _feesInNormalMode: createFees(blockTimestamp, false),
            },
            {
                blockTag,
                blockTimestamp
            }
        ];
    }
    /** @internal @override */
    _doStart() {
        this._get().then(state => {
            if (!this._loaded) {
                this._load(...state);
            }
        });
        const blockListener = async (blockTag) => {
            const state = await this._get(blockTag);
            if (this._loaded) {
                this._update(...state);
            }
            else {
                this._load(...state);
            }
        };
        this._provider.on("block", blockListener);
        return () => {
            this._provider.off("block", blockListener);
        };
    }
    /** @internal @override */
    _reduceExtra(oldState, stateUpdate) {
        var _a, _b;
        return {
            blockTag: (_a = stateUpdate.blockTag) !== null && _a !== void 0 ? _a : oldState.blockTag,
            blockTimestamp: (_b = stateUpdate.blockTimestamp) !== null && _b !== void 0 ? _b : oldState.blockTimestamp
        };
    }
}
exports.BlockPolledLiquityStore = BlockPolledLiquityStore;
//# sourceMappingURL=BlockPolledLiquityStore.js.map