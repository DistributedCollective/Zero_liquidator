"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._connectToMulticall = void 0;
const contracts_1 = require("@ethersproject/contracts");
const multicallAbi = [
    {
        constant: true,
        inputs: [],
        name: "getCurrentBlockTimestamp",
        outputs: [
            {
                name: "timestamp",
                type: "uint256"
            }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
    }
];
const multicallAddress = {
    1: "0xeefba1e63905ef1d7acba5a8513c70307c1ce441",
    3: "0x53c43764255c17bd724f74c4ef150724ac50a3ed",
    4: "0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821",
    5: "0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e",
    42: "0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a"
};
const hasMulticall = (chainId) => chainId in multicallAddress;
const _connectToMulticall = (signerOrProvider, chainId) => hasMulticall(chainId)
    ? new contracts_1.Contract(multicallAddress[chainId], multicallAbi, signerOrProvider)
    : undefined;
exports._connectToMulticall = _connectToMulticall;
//# sourceMappingURL=_Multicall.js.map