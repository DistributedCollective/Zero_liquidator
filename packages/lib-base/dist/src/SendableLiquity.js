"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._successfulReceipt = exports._failedReceipt = exports._pendingReceipt = void 0;
/** @internal */
exports._pendingReceipt = { status: "pending" };
/** @internal */
const _failedReceipt = (rawReceipt) => ({
    status: "failed",
    rawReceipt
});
exports._failedReceipt = _failedReceipt;
/** @internal */
const _successfulReceipt = (rawReceipt, details, toString) => ({
    status: "succeeded",
    rawReceipt,
    details,
    ...(toString ? { toString } : {})
});
exports._successfulReceipt = _successfulReceipt;
//# sourceMappingURL=SendableLiquity.js.map