"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsToString = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const constants_1 = require("@ethersproject/constants");
const lib_base_1 = require("@liquity/lib-base");
const interfaceLookupFrom = (contractLookup) => {
    return Object.fromEntries(Object.entries(contractLookup).map(([, contract]) => [contract.address, contract.interface]));
};
const nameLookupFrom = (contractLookup) => {
    return Object.fromEntries(Object.entries(contractLookup).map(([name, contract]) => [contract.address, name]));
};
const tryToParseLog = (log, interfaceLookup) => {
    const { address } = log;
    if (address in interfaceLookup) {
        try {
            return { address, logDescription: interfaceLookup[address].parseLog(log) };
        }
        catch (err) {
            console.warn("Failed to parse log:");
            console.warn(log);
            console.warn("Caught:");
            console.warn(err);
        }
    }
};
const parseLogs = (logs, interfaceLookup) => {
    const parsedLogs = [];
    const unparsedLogs = [];
    logs.forEach(log => {
        const parsedLog = tryToParseLog(log, interfaceLookup);
        if (parsedLog) {
            parsedLogs.push(parsedLog);
        }
        else {
            unparsedLogs.push(log);
        }
    });
    return [parsedLogs, unparsedLogs];
};
const VERY_BIG = bignumber_1.BigNumber.from(10).pow(9);
const prettify = (arg, nameLookup) => {
    if (bignumber_1.BigNumber.isBigNumber(arg)) {
        if (arg.gte(VERY_BIG)) {
            return `${lib_base_1.Decimal.fromBigNumberString(arg.toHexString())}e18`;
        }
        else {
            return arg.toString();
        }
    }
    else if (typeof arg === "string") {
        return arg === constants_1.AddressZero
            ? "address(0)"
            : nameLookup && arg in nameLookup
                ? nameLookup[arg]
                : arg;
    }
    else {
        return String(arg);
    }
};
const logDescriptionToString = (logDescription, nameLookup) => {
    const prettyEntries = Object.entries(logDescription.args)
        .filter(([key]) => !key.match(/^[0-9]/))
        .map(([key, value]) => `${key}: ${prettify(value, nameLookup)}`);
    return `${logDescription.name}({ ${prettyEntries.join(", ")} })`;
};
const logsToString = (receipt, contracts) => {
    const contractLookup = contracts;
    const interfaceLookup = interfaceLookupFrom(contractLookup);
    const contractNameLookup = nameLookupFrom(contractLookup);
    const nameLookup = {
        [receipt.from]: "user",
        ...contractNameLookup
    };
    const [parsedLogs, unparsedLogs] = parseLogs(receipt.logs, interfaceLookup);
    if (unparsedLogs.length > 0) {
        console.warn("Warning: not all logs were parsed. Unparsed logs:");
        console.warn(unparsedLogs);
    }
    if (parsedLogs.length > 0) {
        return (`Logs of tx ${receipt.transactionHash}:\n` +
            parsedLogs
                .map(({ address, logDescription }) => `  ${contractNameLookup[address]}.${logDescriptionToString(logDescription, nameLookup)}`)
                .join("\n"));
    }
    else {
        return `No logs were parsed in tx ${receipt.transactionHash}`;
    }
};
exports.logsToString = logsToString;
//# sourceMappingURL=parseLogs.js.map