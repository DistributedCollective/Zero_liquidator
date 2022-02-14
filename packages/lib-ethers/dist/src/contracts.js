"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._connectToContracts = exports._priceFeedIsTestnet = exports._LiquityContract = void 0;
const contracts_1 = require("@ethersproject/contracts");
const ActivePool_json_1 = __importDefault(require("../abi/ActivePool.json"));
const BorrowerOperations_json_1 = __importDefault(require("../abi/BorrowerOperations.json"));
const TroveManager_json_1 = __importDefault(require("../abi/TroveManager.json"));
const TroveManagerRedeemOps_json_1 = __importDefault(require("../abi/TroveManagerRedeemOps.json"));
const ZUSDToken_json_1 = __importDefault(require("../abi/ZUSDToken.json"));
const IERC20_json_1 = __importDefault(require("../abi/IERC20.json"));
const CollSurplusPool_json_1 = __importDefault(require("../abi/CollSurplusPool.json"));
const CommunityIssuance_json_1 = __importDefault(require("../abi/CommunityIssuance.json"));
const DefaultPool_json_1 = __importDefault(require("../abi/DefaultPool.json"));
const ZEROToken_json_1 = __importDefault(require("../abi/ZEROToken.json"));
const HintHelpers_json_1 = __importDefault(require("../abi/HintHelpers.json"));
const ZEROStaking_json_1 = __importDefault(require("../abi/ZEROStaking.json"));
const MultiTroveGetter_json_1 = __importDefault(require("../abi/MultiTroveGetter.json"));
const PriceFeed_json_1 = __importDefault(require("../abi/PriceFeed.json"));
const PriceFeedTestnet_json_1 = __importDefault(require("../abi/PriceFeedTestnet.json"));
const SortedTroves_json_1 = __importDefault(require("../abi/SortedTroves.json"));
const StabilityPool_json_1 = __importDefault(require("../abi/StabilityPool.json"));
const GasPool_json_1 = __importDefault(require("../abi/GasPool.json"));
const LiquityBaseParams_json_1 = __importDefault(require("../abi/LiquityBaseParams.json"));
const FeeDistributor_json_1 = __importDefault(require("../abi/FeeDistributor.json"));
const buildEstimatedFunctions = (estimateFunctions, functions) => Object.fromEntries(Object.keys(estimateFunctions).map(functionName => [
    functionName,
    async (overrides, adjustEstimate, ...args) => {
        if (overrides.gasLimit === undefined) {
            const estimatedGas = await estimateFunctions[functionName](...args, overrides);
            overrides = {
                ...overrides,
                gasLimit: adjustEstimate(estimatedGas)
            };
        }
        return functions[functionName](...args, overrides);
    }
]));
class _LiquityContract extends contracts_1.Contract {
    constructor(addressOrName, contractInterface, signerOrProvider) {
        super(addressOrName, contractInterface, signerOrProvider);
        // this.estimateAndCall = buildEstimatedFunctions(this.estimateGas, this);
        this.estimateAndPopulate = buildEstimatedFunctions(this.estimateGas, this.populateTransaction);
    }
    extractEvents(logs, name) {
        return logs
            .filter(log => log.address === this.address)
            .map(log => this.interface.parseLog(log))
            .filter(e => e.name === name);
    }
}
exports._LiquityContract = _LiquityContract;
/** @internal */
const _priceFeedIsTestnet = (priceFeed) => "setPrice" in priceFeed;
exports._priceFeedIsTestnet = _priceFeedIsTestnet;
const getAbi = (priceFeedIsTestnet) => ({
    activePool: ActivePool_json_1.default,
    borrowerOperations: BorrowerOperations_json_1.default,
    troveManager: TroveManager_json_1.default,
    troveManagerRedeemOps: TroveManagerRedeemOps_json_1.default,
    zusdToken: ZUSDToken_json_1.default,
    nueToken: IERC20_json_1.default,
    communityIssuance: CommunityIssuance_json_1.default,
    defaultPool: DefaultPool_json_1.default,
    zeroToken: ZEROToken_json_1.default,
    hintHelpers: HintHelpers_json_1.default,
    zeroStaking: ZEROStaking_json_1.default,
    multiTroveGetter: MultiTroveGetter_json_1.default,
    priceFeed: priceFeedIsTestnet ? PriceFeedTestnet_json_1.default : PriceFeed_json_1.default,
    sortedTroves: SortedTroves_json_1.default,
    stabilityPool: StabilityPool_json_1.default,
    gasPool: GasPool_json_1.default,
    collSurplusPool: CollSurplusPool_json_1.default,
    liquityBaseParams: LiquityBaseParams_json_1.default,
    feeDistributor: FeeDistributor_json_1.default,
});
const mapLiquityContracts = (contracts, f) => Object.fromEntries(Object.entries(contracts).map(([key, t]) => [key, f(t, key)]));
/** @internal */
const _connectToContracts = (signerOrProvider, { addresses, _priceFeedIsTestnet }) => {
    const abi = getAbi(_priceFeedIsTestnet);
    return mapLiquityContracts(addresses, (address, key) => new _LiquityContract(address, abi[key], signerOrProvider));
};
exports._connectToContracts = _connectToContracts;
//# sourceMappingURL=contracts.js.map