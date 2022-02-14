"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionFailedError = void 0;
/**
 * Thrown by {@link TransactableLiquity} functions in case of transaction failure.
 *
 * @public
 */
class TransactionFailedError extends Error {
    /** @internal */
    constructor(name, message, failedReceipt) {
        super(message);
        this.name = name;
        this.failedReceipt = failedReceipt;
    }
}
exports.TransactionFailedError = TransactionFailedError;
//# sourceMappingURL=TransactableLiquity.js.map