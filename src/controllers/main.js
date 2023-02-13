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

const GAS_RATE_TO_BUMPTX = 1.4; //min rate of gas price need to increase to bump tx
const COLLATERAL_COMPENSATION_RATE = 0.005;
const gasIncreaseValue = Decimal.fromBigNumberString(ethers.BigNumber.from(String(config.gasIncrease)).toHexString());

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
            status: [ TroveStatus.open, TroveStatus.liquidating ],
            limit: 1000
        });

        for (let i = 0; i < openingTroves.length; i++) {
            const trove = openingTroves[i];
            const netTrove = await liquity.getTrove(trove.owner);

            const closedStatus = [
                TroveStatus.closedByOwner,
                TroveStatus.closedByLiquidation,
                TroveStatus.closedByRedemption,
            ];

            if (netTrove && closedStatus.indexOf(netTrove.status) >= 0) {
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

                updateTrovesStatus(liquity);
            });
        };

        liquity.store.start();

        this.watchTroveLiquidated(troveManager);
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
    
        info(new Date() + " - RiskiestTroves: " + riskiestTroves.length);
        info("Current Price " + String(store.state.price));
    
        await Promise.all(riskiestTroves.map(trove => {
            trove.icr = trove.collateralRatio(liquity.store.state.price);
            return db.addTrove(trove);
        }));
    
        let troves = await this.filterLiquidateTroves(store.state.price, riskiestTroves);
        troves = troves
            .sort(this.byDescendingCollateral)
            .slice(0, max);
    
        info('Liquidated troves: ' + troves.length);
    
        if (troves.length === 0) {
            // Nothing to liquidate
            return;
        }
    
        let {tx, expectedCompensation} = await this.liquidate(liquity, troves);

        if (tx == null) return;

        tx = await this.listenHigherGasPriceTx(liquity, tx, troves, expectedCompensation);

        await this.handleSuccessfulLiquidation(tx, troves);
    }

    /**
     * The profitability threshold is calculated by comparing tx cost with liquidation reward.
     * The liqudiation reward is the sum of 0.5% of the deposited amount + 20zusd of each trove.
     */
    async liquidate(liquity, troves) {
        const { store } = liquity;
        const addresses = troves.map(trove => trove.ownerAddress);
        let tx;
    
        try {
            const liquidation = await liquity.populate.liquidate(addresses);
            const gasLimit = Math.round(liquidation.rawPopulatedTransaction.gasLimit.toNumber() * 1.2);

            const mempoolStats = await mempool.getMempoolStats(Decimal.from(gasLimit));
            const maxGasPriceFromMempool = await mempool.getMaxLiquidationGasPrice(addresses);
            let gasPrice;

            console.log('maxGasPriceFromMempool', maxGasPriceFromMempool.toString());
            console.log('lowestGasPriceInBlock', mempoolStats.lowestGasPriceInBlock.toString());
    
            if (maxGasPriceFromMempool.gt(0)) {
                gasPrice = maxGasPriceFromMempool.add(gasIncreaseValue);
            } else {
                gasPrice = await liquity.connection.provider
                .getGasPrice()
                .then(bn => Decimal.fromBigNumberString(bn.toHexString()).mul(config.gasPriceBuffer) );
    
                if (lastGasPrice != null && gasPrice.lt(lastGasPrice)) {
                    gasPrice = lastGasPrice;
                }
            }

            if (mempoolStats.isBlockFull && gasPrice.lt(mempoolStats.lowestGasPriceInBlock)) {
                gasPrice = mempoolStats.lowestGasPriceInBlock.mul(config.gasPriceBuffer);
            }
    
            await Promise.all(troves.map(trove => db.updateTrove(trove.dbId, {
                status: TroveStatus.liquidating
            })));
    
            const expectedCost = gasPrice.mul(gasLimit).mul(store.state.price);

            const total = troves.reduce((a, b) => a.add(b));
            const expectedCompensation = total.collateral
                .mul(COLLATERAL_COMPENSATION_RATE)
                .mul(store.state.price) //btc price
                .add(ZUSD_LIQUIDATION_RESERVE.mul(troves.length)); //20 zusd
    
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
    
            try {
                console.log('sending tx', new Date());
                tx = await liquidation.send({
                    gasPrice: gasPrice.hex,
                    gasLimit: String(gasLimit)
                });
                console.log('tx', tx.rawSentTransaction.hash);
        
                return {
                    tx,
                    expectedCompensation
                };
            } catch (err2) {
                error("An error occured when sending liquidation transaction");
                error(err2);

                await Promise.all(troves.map((trove) => db.updateLiquidatingTrove(trove.ownerAddress, {
                    txHash: tx && tx.rawSentTransaction.hash,
                    status: TroveStatus.failed
                })));
            }

        } catch (err) {
            error("Unexpected error:");
            error(err);
        }

        return {};
    }

    /**
     * watch mempool pending txs, if there is a liquidation tx with higher gas price,
     * try to send a new tx with higher price, maximum 5 times
     * @returns new tx with higher gas price
     */
    async listenHigherGasPriceTx(liquity, tx, troves, expectedCompensation) {
        const timeout = 60000; //stop after timeout
        const startAt = Date.now();
        const p = this;
        let newLiqTx = tx;
        let nrTryWithHighGas = 5;
        let timer;
        let confirmedTx = null;
        let txList = [tx];

        this.liquity.liquidate()

        info('listening higher gas price tx on mempool');

        // Check confirmation of all sent transactions, if one of those txs get confirmed, stop try to bump tx
        async function checkTransactionsConfirmation() {
            await Promise.all(txList.map(async (tx) => {
                const txHash = tx.rawSentTransaction.hash;
                const receipt = await p.provider.getTransactionReceipt(txHash);
                if (receipt && receipt.confirmations > 0) {
                    info(`confirmed tx ${txHash}`)
                    confirmedTx = tx;
                }
            }));
        }

        return new Promise(async (resolve) => {
            timer = setInterval(async () => {
                const curTx = newLiqTx.rawSentTransaction;
                const isTimeout = Date.now() - startAt > timeout;
                const curPrice = liquity.store.state.price;

                await checkTransactionsConfirmation();

                if (confirmedTx || nrTryWithHighGas <= 0 || isTimeout) {
                    clearInterval(timer);
                    timer = null;
                    return resolve(confirmedTx);
                }
    
                const maxGasPriceFromMempool = await mempool.getMaxLiquidationGasPrice(null, curTx);
                const curGasPrice = Decimal.fromBigNumberString(curTx.gasPrice.toHexString());
                if (maxGasPriceFromMempool.gt(curGasPrice)) {
                    const addresses = troves.map(trove => trove.ownerAddress);
                    let newGasPrice = maxGasPriceFromMempool.add(gasIncreaseValue);

                    if (newGasPrice.lt(curGasPrice.mul(GAS_RATE_TO_BUMPTX))) {
                        newGasPrice = curGasPrice.mul(GAS_RATE_TO_BUMPTX).add(gasIncreaseValue);
                    }

                    const expectedCost = newGasPrice.mul(curTx.gasLimit.toNumber()).mul(curPrice);

                    info(`trying to send new tx with higher gasprice, old tx ${tx.rawSentTransaction.hash}, new gasprice ${newGasPrice.toString()}`);

                    if (expectedCost.lt(expectedCompensation.mul(config.gasCostThreshold))) {
                        newLiqTx = await liquity.send.liquidate(addresses, {
                            gasPrice: newGasPrice.hex,
                            nonce: curTx.nonce
                        });

                        info(`new tx ${newLiqTx.rawSentTransaction.hash}`);
                        txList.push(newLiqTx);
        
                        nrTryWithHighGas --;
                    }
                }            
            }, 5000); 
        });
    }

    async handleSuccessfulLiquidation(tx, troves) {
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

    /**
     * Watch liquidated troves and find the liquidator address, tx hash
     * 
     * @param {import("../../packages/lib-ethers/dist/types").TroveManager} troveManager 
     */
    watchTroveLiquidated(troveManager) {
        const troveLiquidatedEvent = troveManager.filters.TroveLiquidated();
        const p = this;

        troveManager.on(troveLiquidatedEvent, async (troveOwnerAdr) => {
            info(`Trove of ${troveOwnerAdr} get liquidated`);

            await Utils.waste(1); //delay a litle time to wait db updated

            const dbTrove = await db.getTrove(troveOwnerAdr);

            if (dbTrove) {
                const logs = await p.provider.getLogs(troveManager.filters.TroveLiquidated(troveOwnerAdr));
                const txHash = logs && logs[0] && logs[0].transactionHash;

                if (txHash) {
                    const tx = await p.provider.getTransaction(txHash);
                    
                    await db.updateTrove(dbTrove.id, {
                        liquidator: tx.from,
                        txHash: txHash
                    });
                }
            }
        });
    }
}

module.exports = new MainCtrl();
