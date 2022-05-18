const { Decimal, UserTrove, ZUSD_LIQUIDATION_RESERVE, Trove } = require("@liquity/lib-base");
const { EthersLiquity, EthersLiquityWithStore } = require("../../packages/lib-ethers/dist");
const { Wallet, providers, } = require("ethers");
const config = require('../configs');
const db = require('./db');
const monitor = require('./monitor');

function log(message) {
    console.log(`${`[${new Date().toLocaleTimeString()}]`} ${message}`);
}

const info = message => log(`${"ℹ"} ${message}`);
const warn = message => log(`${"‼"} ${message}`);
const error = message => log(`${"✖"} ${message}`);
const success = message => log(`${"✔"} ${message}`);

module.exports.start = async function (io) {
    await db.initDb(config.db);
    
    const provider = new providers.JsonRpcProvider(config.node);
    const wallet = new Wallet(process.env.PRIVATE_KEY).connect(provider);
    const liquity = await EthersLiquity.connect(wallet, { useStore: "blockPolled" });

    monitor.init(wallet, liquity);
    io.on('connection', (socket) => {
        socket.on('getAccountInfo', async (cb) => monitor.getAccountInfo(cb));
        socket.on('getNetworkData', async (cb) => monitor.getNetworkData(cb));
        socket.on('getTotals', async (cb) => monitor.getTotals(cb));
        socket.on('getLast24HTotals', async (cb) => monitor.getTotals(cb, true));
        socket.on('listTroves', async (...args) => monitor.listTroves(...args));
    });

    
    liquity.store.onLoaded = () => {
        info("Waiting for price drops...");
        tryToLiquidate(liquity);
    };

    liquity.store.subscribe(async ({ newState, oldState }) => {
        // Try to liquidate whenever the price drops
        console.log("\nnew price %s, old %s", newState.price, oldState.price);
        console.log("Total troves", (await liquity.getTotal()).toString());
        console.log("ZUSD in Pool", (await liquity.getZUSDInStabilityPool()).toString());

        tryToLiquidate(liquity);
        // if (newState.price.lt(oldState.price)) {
        //     tryToLiquidate(liquity);
        // }
    });

    liquity.store.start();
}

/**
 * @param {Decimal} [price]
 * @returns {(trove: UserTrove) => boolean}
 */
const underCollateralized = price => trove => {
    // console.log(trove.ownerAddress + " col " + trove.collateralRatio(price));
    return trove.collateralRatioIsBelowMinimum(price);
}

/**
 * @param {UserTrove}
 * @param {UserTrove}
 */
const byDescendingCollateral = ({ collateral: a }, { collateral: b }) =>
    b.gt(a) ? 1 : b.lt(a) ? -1 : 0;

/**
 * @param { Decimal } price
 * @param { UserTrove[] } troves
 * @returns { Promise<UserTrove[]> }
 */
const filterLiquidateTroves = async (price, troves) => {
    const filteredTroves = [];
    await Promise.all(troves.map(async (trove) => {
        if (!underCollateralized(price)(trove)) return false;
        const added = await db.getTrove(trove.ownerAddress);
        if (added && added.status == 'open') {
            trove.dbId = added.id;
            filteredTroves.push(trove);
        }
    }));
    return filteredTroves;
}

/**
 * @param {EthersLiquityWithStore} [liquity]
 */
async function tryToLiquidate(liquity) {
    const { store } = liquity;

    const [gasPrice, riskiestTroves] = await Promise.all([
        liquity.connection.provider
            .getGasPrice()
            .then(bn => Decimal.fromBigNumberString(bn.toHexString())),

        liquity.getTroves({
            first: 1000,
            sortedBy: "ascendingCollateralRatio"
        })
    ]);

    console.log("RiskiestTroves", riskiestTroves.length);
    console.log("Current Price", String(store.state.price));

    await Promise.all(riskiestTroves.map(trove => {
        trove.icr = trove.collateralRatio(liquity.store.state.price);
        return db.addTrove(trove);
    }));

    let troves = await filterLiquidateTroves(store.state.price, riskiestTroves);
    troves = troves
        .sort(byDescendingCollateral)
        .slice(0, 40);

    console.log('Liquidated troves', troves.length);

    if (troves.length === 0) {
        // Nothing to liquidate
        return;
    }

    const addresses = troves.map(trove => trove.ownerAddress);
    let tx;

    try {
        await Promise.all(troves.map(trove => db.updateTrove(trove.dbId, {
            status: 'liquidating'
        })));

        const liquidation = await liquity.populate.liquidate(addresses, { gasPrice: gasPrice.hex });
        const gasLimit = liquidation.rawPopulatedTransaction.gasLimit.toNumber();
        const expectedCost = gasPrice.mul(gasLimit).mul(store.state.price);

        const total = troves.reduce((a, b) => a.add(b));
        const expectedCompensation = total.collateral
            .mul(0.005)
            .mul(store.state.price)
            .add(ZUSD_LIQUIDATION_RESERVE.mul(troves.length));

        if (expectedCost.gt(expectedCompensation)) {
            // In reality, the TX cost will be lower than this thanks to storage refunds, but let's be
            // on the safe side.
            warn(
                "Skipping liquidation due to high TX cost " +
                `($${expectedCost.toString(2)} > $${expectedCompensation.toString(2)}).`
            );
            return;
        }

        info(`Attempting to liquidate ${troves.length} Trove(s)...`);

        tx = await liquidation.send();
        console.log('tx', tx.rawSentTransaction.hash);

        console.log(await db.troveModel.find({ owner: troves.map(t => t.ownerAddress) }));

        const receipt = await tx.waitForReceipt();

        if (receipt.status === "failed") {
            error(`TX ${receipt.rawReceipt.transactionHash} failed.`);
            await Promise.all(troves.map(async (trove) => {
                const dbTrove = await db.getTrove(trove.ownerAddress, 'liquidating');
                if (dbTrove) {
                    await db.updateTrove(dbTrove.id, {
                        txHash: tx && tx.rawSentTransaction.hash,
                        status: 'failed'
                    });
                }
            }));
            return;
        }

        const { collateralGasCompensation, zusdGasCompensation, liquidatedAddresses } = receipt.details;
        const gasCost = gasPrice.mul(receipt.rawReceipt.gasUsed.toNumber()).mul(store.state.price);
        const totalCompensation = collateralGasCompensation
            .mul(store.state.price)
            .add(zusdGasCompensation);
        const totalProfit = totalCompensation.sub(gasCost);
        const profitPerTrove = totalProfit.div(liquidatedAddresses.length);

        await Promise.all(troves.map(trove => db.updateTrove(trove.dbId, {
            liquidator: receipt.rawReceipt.from,
            txHash: receipt.rawReceipt.transactionHash,
            profit: profitPerTrove.toString(),
            status: 'liquidated'
        })));

        console.log(await db.troveModel.find({ owner: troves.map(t => t.ownerAddress) }));

        success(
            `Received ${collateralGasCompensation.toString(4)} RBTC ` +
            `${zusdGasCompensation.toString(2)} ZUSD compensation (` +
            (totalCompensation.gte(gasCost)
                ? `$${totalCompensation.sub(gasCost).toString(2)} profit`
                : `$${gasCost.sub(totalCompensation).toString(2)} loss`) +
            `) for liquidating ${liquidatedAddresses.length} Trove(s).`
        );
    } catch (err) {
        error("Unexpected error:");
        console.error(err);

        await Promise.all(troves.map(async (trove) => {
            const dbTrove = await db.getTrove(trove.ownerAddress, 'liquidating');
            if (dbTrove) {
                await db.updateTrove(dbTrove.id, {
                    txHash: tx && tx.rawSentTransaction.hash,
                    status: 'failed'
                });
            }
        }));
    }
}