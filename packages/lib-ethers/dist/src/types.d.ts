import { BigNumberish } from "@ethersproject/bignumber";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { BlockTag, TransactionResponse, TransactionReceipt } from "@ethersproject/abstract-provider";
import { PopulatedTransaction } from "@ethersproject/contracts";
/**
 * Optional parameters taken by {@link EthersLiquity} transaction functions.
 *
 * @public
 */
export interface EthersTransactionOverrides {
    from?: string;
    nonce?: BigNumberish;
    gasLimit?: BigNumberish;
    gasPrice?: BigNumberish;
}
/**
 * Optional parameters taken by {@link ReadableEthersLiquity} functions.
 *
 * @public
 */
export interface EthersCallOverrides {
    blockTag?: BlockTag;
}
/**
 * Alias of Ethers' abstract
 * {@link https://docs.ethers.io/v5/api/providers/ | Provider} type.
 *
 * @public
 */
export declare type EthersProvider = Provider;
/**
 * Alias of Ethers' abstract
 * {@link https://docs.ethers.io/v5/api/signer/ | Signer} type.
 *
 * @public
 */
export declare type EthersSigner = Signer;
/**
 * Alias of Ethers'
 * {@link https://docs.ethers.io/v5/api/providers/types/#providers-TransactionResponse | TransactionResponse}
 * type.
 *
 * @public
 */
export declare type EthersTransactionResponse = TransactionResponse;
/**
 * Alias of Ethers'
 * {@link https://docs.ethers.io/v5/api/providers/types/#providers-TransactionReceipt | TransactionReceipt}
 * type.
 *
 * @public
 */
export declare type EthersTransactionReceipt = TransactionReceipt;
/**
 * Alias of Ethers' `PopulatedTransaction` type, which implements
 * {@link https://docs.ethers.io/v5/api/utils/transactions/#UnsignedTransaction | UnsignedTransaction}.
 *
 * @public
 */
export declare type EthersPopulatedTransaction = PopulatedTransaction;
//# sourceMappingURL=types.d.ts.map