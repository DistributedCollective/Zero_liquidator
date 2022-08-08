const ethers = require('ethers');
const troveManagerAbi = require('../../packages/lib-ethers/abi/TroveManager.json');
const { Decimal } = require("@liquity/lib-base");

const troveMangerInterface = new ethers.utils.Interface(troveManagerAbi);

class Mempool {
    async getMaxLiquidateGasPrice(troveAddresses) {
        const txs = await this.getMempoolTxs();
        const maxGasPrice = Decimal.from(0);
        txs.forEach(tx => {
            if (this.detectLiqTx(tx)) {
                let isSameLiqTroves = true;
                troveAddresses.forEach(adr => {
                    if (tx.input.indexOf(adr.toLowerCase().replace('0x', '')) < 0) isSameLiqTroves = false;
                });

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
}

module.exports = new Mempool();