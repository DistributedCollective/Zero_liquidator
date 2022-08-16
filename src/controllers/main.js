const { Decimal, UserTrove, ZUSD_LIQUIDATION_RESERVE, Trove } = require("@liquity/lib-base");
const { EthersLiquity, EthersLiquityWithStore } = require("../../packages/lib-ethers/dist");
const { _getContracts } = require("../../packages/lib-ethers/dist/src/EthersLiquityConnection");

const { Wallet, providers, utils, ethers, Contract } = require("ethers");
const config = require('../configs');
const db = require('./db');
const monitor = require('./monitor');
const mempool = require('./mempool');
const TroveStatus = require("../models/troveStatus");
const Utils = require('../utils/utils');

function log(message) {
    console.log(`${`[${new Date().toLocaleTimeString()}]`} ${message}`);
}

const info = message => log(`${"ℹ"} ${message}`);
const warn = message => log(`${"‼"} ${message}`);
const error = message => log(`${"✖"} ${message}`);
const success = message => log(`${"✔"} ${message}`);

/**
 * @param {EthersLiquityWithStore} [liquity]
 */
async function updateTrovesStatus(liquity) {
    try {
        const troves = await liquity.getTroves({
            first: 1000,
            sortedBy: "ascendingCollateralRatio"
        });
        await Promise.all(troves.map(trove => {
            trove.icr = trove.collateralRatio(liquity.store.state.price);
            return db.addTrove(trove);
        }));

        const openingTroves = await db.listTroves({
            status: [ TroveStatus.open, TroveStatus.liquidating ]
        });

        for (let i = 0; i < openingTroves.length; i++) {
            const trove = openingTroves[i];
            const netTrove = await liquity.getTrove(trove.owner);

            if (netTrove && (netTrove.status == TroveStatus.closedByOwner || netTrove.status == TroveStatus.closedByLiquidation)) {
                await db.updateTrove(trove.id, { status: netTrove.status });
                console.log('updated', netTrove);
            }
        }

    } catch (err) {
        console.error(err);
    }
}

let lastGasPrice;
class MainCtrl {
    async init() {
        await db.initDb(config.db);
        mempool.init();
        
        this.provider = new providers.JsonRpcProvider(config.node);
        this.wallet = new Wallet(process.env.PRIVATE_KEY).connect(this.provider);
        this.liquity = await EthersLiquity.connect(this.wallet, { useStore: "blockPolled" });
    }

    async start(io) {
        await this.init();

        const liquity = this.liquity;
        const { troveManager } = _getContracts(liquity.connection);
    
        monitor.init(this.wallet, liquity);
        io.on('connection', (socket) => {
            socket.on('getAccountInfo', async (cb) => monitor.getAccountInfo(cb));
            socket.on('getNetworkData', async (cb) => monitor.getNetworkData(cb));
            socket.on('getTotals', async (cb) => monitor.getTotals(cb));
            socket.on('getLast24HTotals', async (cb) => monitor.getTotals(cb, true));
            socket.on('listTroves', async (...args) => monitor.listTroves(...args));
        });
    
        const p = this;
        
        liquity.store.onLoaded = () => {
            info("Waiting for price drops...");
            p.tryToLiquidate(liquity);

            let timer;
            let oldState;
            
            p.provider.on('block', async () => {
                let newState = liquity.store.state;
    
                console.log("\n%s: new price %s, old %s", new Date(), newState.price, oldState && oldState.price);
                console.log("Total troves", (await liquity.getTotal()).toString());
                console.log("NumberOfTroves", await liquity.store.state.numberOfTroves);
                console.log('System TCR', utils.formatEther(await troveManager.getTCR(liquity.store.state.price.mul(100).bigNumber)));
    
                if (timer != null) {
                    clearInterval(timer);
                    timer = null;
                }
    
                timer = setInterval(async () => {
                    newState = liquity.store.state;
    
                    if (oldState && newState.price.lt(oldState.price)) {
                        await p.tryToLiquidate(liquity);
    
                        clearInterval(timer);
                        timer = null;
                    }
                    
                    oldState = newState;
                }, 5000);
            });
        };

        liquity.store.start();
    }

    /**
     * @param {EthersLiquityWithStore} [liquity]
     * @param {number} max max number of troves to get liquidated
     */
    async tryToLiquidate(liquity, max = 100) {
        const { store } = liquity;
    
        const riskiestTroves = await liquity.getTroves({
            first: 1000,
            sortedBy: "ascendingCollateralRatio"
        })
    
        info(new Date(), "RiskiestTroves", riskiestTroves.length);
        info("Current Price", String(store.state.price));
    
        await Promise.all(riskiestTroves.map(trove => {
            trove.icr = trove.collateralRatio(liquity.store.state.price);
            return db.addTrove(trove);
        }));
    
        let troves = await this.filterLiquidateTroves(store.state.price, riskiestTroves);
        troves = troves
            .sort(this.byDescendingCollateral)
            .slice(0, max);
    
        info('Liquidated troves', troves.length);
    
        if (troves.length === 0) {
            // Nothing to liquidate
            return;
        }
    
        let {tx, expectedCompensation} = await this.sendLiquidate(liquity, troves);

        if (tx == null) return;

        tx = await this.listenHigherGasPriceTx(liquity, tx, troves, expectedCompensation);

        await this.handleSuccessLiquidation(tx, troves);
    }

    async sendLiquidate(liquity, troves) {
        const { store } = liquity;
        const addresses = troves.map(trove => trove.ownerAddress);
        let tx;
    
        try {
            const maxGasPriceFromMempool = await mempool.getMaxLiquidateGasPrice(addresses);
            let gasPrice;

            console.log('maxGasPriceFromMempool', maxGasPriceFromMempool.toString());
    
            if (maxGasPriceFromMempool.gt(0)) {
                gasPrice = maxGasPriceFromMempool.mul(1.05);
            } else {
                gasPrice = await liquity.connection.provider
                .getGasPrice()
                .then(bn => Decimal.fromBigNumberString(bn.toHexString()).mul(config.gasPriceBuffer) );
    
                if (lastGasPrice != null && gasPrice.lt(lastGasPrice)) {
                    gasPrice = lastGasPrice;
                }
            }
    
            await Promise.all(troves.map(trove => db.updateTrove(trove.dbId, {
                status: TroveStatus.liquidating
            })));
    
            const liquidation = await liquity.populate.liquidate(addresses, { gasPrice: gasPrice.hex });
            const gasLimit = liquidation.rawPopulatedTransaction.gasLimit.toNumber();
            const expectedCost = gasPrice.mul(gasLimit).mul(store.state.price);
    
            const total = troves.reduce((a, b) => a.add(b));
            const expectedCompensation = total.collateral
                .mul(0.005)
                .mul(store.state.price)
                .add(ZUSD_LIQUIDATION_RESERVE.mul(troves.length));
    
            if (expectedCost.gt(expectedCompensation.mul(config.gasCostThreshold))) {
                // In reality, the TX cost will be lower than this thanks to storage refunds, but let's be
                // on the safe side.
                warn(
                    "Skipping liquidation due to high TX cost " +
                    `($${expectedCost.toString(2)} > $${expectedCompensation.toString(2)}).`
                );
                return {};
            }
    
            info(new Date(), `gas price ${gasPrice.toString()}`);
            info(`Attempting to liquidate ${troves.length} Trove(s)...`);
            info(`Expected cost ${expectedCost.toString()}, expected compensation ${expectedCompensation.toString()}`);
    
            if (lastGasPrice == null || lastGasPrice.lt(gasPrice)) {
                lastGasPrice = gasPrice;
            }
    
            console.log('sending tx', new Date());
            tx = await liquidation.send({
                gasLimit: String(Math.round(gasLimit * 1.2))
            });
            console.log('tx', tx.rawSentTransaction.hash);
    
            return {
                tx,
                expectedCompensation
            };
        } catch (err) {
            error("Unexpected error:");
            console.error(err);
    
            await Promise.all(troves.map((trove) => db.updateLiquidatingTrove(trove.ownerAddress, {
                txHash: tx && tx.rawSentTransaction.hash,
                status: TroveStatus.failed
            })));
            return {};
        }
    }

    /**
     * watch mempool pending txs, if there is a same liquidation tx with higher gas price,
     * it will try to send new tx with higher price, maximum 5 times
     * @returns new tx with higher gas price
     */
    async listenHigherGasPriceTx(liquity, tx, troves, expectedCompensation) {
        const timeout = 60000; //stop after timeout
        const startAt = Date.now();
        const p = this;
        let newLiqTx = tx;
        let nrTryWithHighGas = 5;
        let timer;

        info('listening higher gas price tx on mempool');

        return new Promise(async (resolve) => {
            timer = setInterval(async () => {
                const curTx = newLiqTx.rawSentTransaction;
                const isTimeout = Date.now() - startAt > timeout;
                const curPrice = liquity.store.state.price;

                const receipt = await p.provider.getTransactionReceipt(curTx.hash);

                if ((receipt && receipt.status == 1) || nrTryWithHighGas <= 0 || isTimeout) {
                    clearInterval(timer);
                    timer = null;
                    return resolve(newLiqTx);
                }
    
                const maxGasPriceFromMempool = await mempool.getMaxLiquidateGasPrice(null, curTx);
                const curGasPrice = Decimal.fromBigNumberString(curTx.gasPrice.toHexString());
                if (maxGasPriceFromMempool.gt(curGasPrice)) {
                    const addresses = troves.map(trove => trove.ownerAddress);
                    let newGasPrice = maxGasPriceFromMempool.mul(1.005);
                    if (newGasPrice.lt(curGasPrice.mul(1.4))) {
                        newGasPrice = curGasPrice.mul(1.4001);
                    }

                    const expectedCost = newGasPrice.mul(curTx.gasLimit.toNumber()).mul(curPrice);

                    info(`trying to send new tx with higher gasprice, old tx ${tx.rawSentTransaction.hash}, new gasprice ${newGasPrice.toString()}`);

                    if (expectedCost.lt(expectedCompensation.mul(config.gasCostThreshold))) {
                        newLiqTx = await liquity.send.liquidate(addresses, {
                            gasPrice: newGasPrice.hex,
                            nonce: curTx.nonce
                        });

                        info(`new tx ${newLiqTx.rawSentTransaction.hash}`);
        
                        nrTryWithHighGas --;
                    }
                }            
            }, 5000); 
        });
    }

    async handleSuccessLiquidation(tx, troves) {
        const receipt = await tx.waitForReceipt();

        if (receipt.status === "failed") {
            error(`TX ${receipt.rawReceipt.transactionHash} failed.`);
            await Promise.all(troves.map((trove) => db.updateLiquidatingTrove(trove.ownerAddress, {
                txHash: tx && tx.rawSentTransaction.hash,
                status: TroveStatus.failed
            })));
            return;
        }

        const { collateralGasCompensation, zusdGasCompensation, liquidatedAddresses } = receipt.details;
        
        console.log('liquidatedAddresses', liquidatedAddresses.length, liquidatedAddresses);

        const gasPrice = Decimal.fromBigNumberString(tx.rawSentTransaction.gasPrice);
        const gasCost = gasPrice.mul(receipt.rawReceipt.gasUsed.toNumber()).mul(store.state.price);
        const totalCompensation = collateralGasCompensation
            .mul(store.state.price)
            .add(zusdGasCompensation);
        const totalProfit = totalCompensation.sub(gasCost);
        const profitPerTrove = totalProfit.div(liquidatedAddresses.length);

        await Promise.all(troves.map(trove => {
            if (liquidatedAddresses.includes(trove.ownerAddress)) {
                return db.updateLiquidatingTrove(trove.ownerAddress, {
                    liquidator: receipt.rawReceipt.from,
                    txHash: receipt.rawReceipt.transactionHash,
                    profit: profitPerTrove.toString(),
                    status: TroveStatus.liquidated
                });
            }
        }));

        const msg = `Received ${collateralGasCompensation.toString(4)} RBTC ` +
            `${zusdGasCompensation.toString(2)} ZUSD compensation (` +
            (totalCompensation.gte(gasCost)
                ? `$${totalProfit.toString(2)} profit`
                : `$${gasCost.sub(totalCompensation).toString(2)} loss`) +
            `) for liquidating ${liquidatedAddresses.length} Trove(s).`;

        success(msg);
        
        Utils.sendTelegramMsg(`<b>ZERO:</b> ${msg}
            \nTx: ${config.blockExplorer}/tx/${tx.rawSentTransaction.hash}`
        );
    }

    /**
     * @param {Decimal} [price]
     * @returns {(trove: UserTrove) => boolean}
     */
     underCollateralized = price => trove => {
        // console.log(trove.ownerAddress + " col " + trove.collateralRatio(price));
        return trove.collateralRatioIsBelowMinimum(price);
    }

    /**
     * @param {UserTrove}
     * @param {UserTrove}
     */
    byDescendingCollateral = ({ collateral: a }, { collateral: b }) =>
        b.gt(a) ? 1 : b.lt(a) ? -1 : 0;

    /**
     * @param { Decimal } price
     * @param { UserTrove[] } troves
     * @returns { Promise<UserTrove[]> }
     */
    filterLiquidateTroves = async (price, troves) => {
        const filteredTroves = [];
        await Promise.all(troves.map(async (trove) => {
            if (!this.underCollateralized(price)(trove)) return false;
            const added = await db.getTrove(trove.ownerAddress, TroveStatus.open);
            if (added) {
                trove.dbId = added.id;
                filteredTroves.push(trove);
            }
        }));
        return filteredTroves;
    }

}

module.exports = new MainCtrl();