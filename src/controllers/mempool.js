const ethers = require('ethers');
const troveManagerAbi = require('../../packages/lib-ethers/abi/TroveManager.json');
const { Decimal } = require("@liquity/lib-base");
const config = require('../configs');

const troveMangerInterface = new ethers.utils.Interface(troveManagerAbi);
const maxBlockGas = 6800000;

class Mempool {
    init() {
        this.provider = new ethers.providers.JsonRpcProvider(config.node);
    }

    async getMaxLiquidationGasPrice(troveAddresses, curLiqTx) {
        const txs = await this.getMempoolTxs();
        let maxGasPrice = Decimal.from(0);
        console.log('mempool length', txs.length);
        txs.forEach(tx => {
            if (this.detectLiqTx(tx)) {
                let isSameLiqTroves = true;
                if (troveAddresses) {
                    troveAddresses.forEach(adr => {
                        if (tx.input.indexOf(adr.toLowerCase().replace('0x', '')) < 0) isSameLiqTroves = false;
                    });
                }

                if (curLiqTx && curLiqTx.hash != tx.hash) {
                    isSameLiqTroves = tx.input == curLiqTx.data;
                }

                const gasPrice = Decimal.fromBigNumberString(tx.gasPrice);
                if (isSameLiqTroves && gasPrice.gt(maxGasPrice)) {
                    maxGasPrice = gasPrice;
                }
            }
        });

        return maxGasPrice;
    }

    async getMaxGasPrice()  {
        const txs = await this.getMempoolTxs();
        let maxGasPrice = Decimal.from(0);
        let totalGas = Decimal.from(0);

        txs.forEach(tx => {
            const gasPrice = Decimal.fromBigNumberString(tx.gasPrice);
            if (gasPrice.gt(maxGasPrice)) {
                maxGasPrice = gasPrice;
            }
            totalGas = totalGas.add(Decimal.fromBigNumberString(tx.gas));
        });

        return {
            maxGasPrice,
            isBlockFull: totalGas.gt(maxBlockGas)
        };
    }

    async getMempoolTxs() {
        try {
            const res = await this.provider.send('txpool_content');
            if (res && res.pending) {
                let txs = [];
                for (const adrTxs of Object.values(res.pending)) {
                    for (const id of Object.keys(adrTxs)) {
                        if (adrTxs[id] && adrTxs[id].length > 0) {
                            txs = txs.concat(adrTxs[id]);
                        }
                    }
                }

                return txs;
            }
        } catch (er) {
            console.log(er);
        }

        return [];
    }

    detectLiqTx(tx) {
        const method1 = troveMangerInterface.getSighash('batchLiquidateTroves');
        const method2 = troveMangerInterface.getSighash('liquidate');

        return tx.input.startsWith(method1) || tx.input.startsWith(method2);
    }

    /**
     * Get stats of current pending txs in mempool
     * - sum gas of all pending transactions
     * - is block full with max 6.8mio gas?
     * - highest gas price of the pending txs
     * 
     * @param {Decimal} liquidationTxGas gas limit of liquidation tx to check lowest gas price that ensure tx will be included in current block
     */

    async getMempoolStats(liquidationTxGas = Decimal.from(0)) {
        let txList = await this.getMempoolTxs();
        let totalGas = Decimal.from(0);
        let lowestGasPriceInBlock;

        txList = txList.sort((a, b) => Number(b.gasPrice) - Number(a.gasPrice));

        lowestGasPriceInBlock = Decimal.fromBigNumberString(txList[txList.length - 1].gasPrice);

        console.log('pending txs', txList.length);

        for (const tx of txList) {
            totalGas = totalGas.add(Decimal.from(Number(tx.gas)));

            if (totalGas.add(liquidationTxGas).lt(maxBlockGas)) {
                lowestGasPriceInBlock = Decimal.fromBigNumberString(tx.gasPrice);
            }
        }

        return {
            totalGas: totalGas,
            isBlockFull: totalGas.gt(maxBlockGas),
            lowestGasPriceInBlock
        }
    }
}

module.exports = new Mempool();