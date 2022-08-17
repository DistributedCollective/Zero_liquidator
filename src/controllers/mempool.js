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
     * Get sum gas of all pending transactions in mempool
     */

    async getTotalMempoolTxGas() {
        let txList = await this.getMempoolTxs();
        let totalGas = Decimal.from(0);
        txList = txList.sort((a, b) => Number(b.gasPrice) - Number(a.gasPrice));

        console.log('pending txs', txList.length);

        for (const tx of txList) {
            totalGas = totalGas.add(Decimal.from(Number(tx.gas)));
        }
        return totalGas;
    }
}

module.exports = new Mempool();