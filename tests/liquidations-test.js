const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Wallet, providers, utils, ethers, Contract } = require("ethers");
const { Decimal, LiquityStoreState } = require("@liquity/lib-base");
const { EthersLiquity, EthersLiquityWithStore, } = require("../packages/lib-ethers/dist");
const { _getContracts } = require("../packages/lib-ethers/dist/src/EthersLiquityConnection");
const configs = require('../src/configs/testnet');
const { formatEther, parseEther } = require('ethers/lib/utils');
const Utils = require('../src/utils/utils');
const main = require('../src/controllers/main');
const db = require('../src/controllers/db');
const mempool = require('../src/controllers/mempool');

const mnemonic = process.env.MNEMONIC;
const hdnode = ethers.utils.HDNode.fromMnemonic(mnemonic);
const derivationPath = "m/44'/37310'/0'/0/";

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
const botPrivateKey = process.env.PRIVATE_KEY;
const provider = new providers.JsonRpcProvider(configs.node);
const owner = new Wallet(ownerPrivateKey).connect(provider);
const bot = new Wallet(botPrivateKey).connect(provider);


async function openTrove(liquity, collateralBtc, borrowUsd, icr) {
    const ownerAddress = liquity.store.state.trove.ownerAddress;
    console.log('#' + ownerAddress, 'opening trove: deposited', collateralBtc, 'rBTC,', 'borrowed', borrowUsd, 'ZUSD,', 'ICR:', icr.toFixed(1) + '%');
    
    await liquity.openTrove({
        depositCollateral: new Decimal(utils.parseEther(String(collateralBtc))),
        borrowZUSD: new Decimal(utils.parseEther(String(borrowUsd)))
    });
    console.log('created trove on wallet', ownerAddress);
    await Utils.waste(5);
    logState("    ", liquity.store.state);
}

async function setPrice(liquity, price) {
    console.log('set price to', price.toString());
    const res = await liquity.setPrice(new Decimal(utils.parseEther(String(price))));
    console.log(res);
}

/**
 * @param {LiquityStoreState} state 
 */
async function logState(msg, state) {
    // console.log(state);
    console.log(msg, {
        price: state.price.toString(),
        numberOfTroves: state.numberOfTroves,
        block: state.blockTag,
        owner: state.trove.ownerAddress,
        troveStatus: state.trove.status,
        deposited: state.trove.collateral.toString(),
        borrowed: state.trove.debt.toString(),
        troveICR: state.trove.collateralRatio(state.price).mul(100).toString()
    });
}

async function distributeFund(wallet, amount, addFee = 0.0001) {
    const adr = wallet.address;
    const bal = await wallet.getBalance();

    console.log('#' + adr, 'distributing', amount + 'rBTC,', 'balance:', formatEther(bal));
    const fund = parseEther(String((Number(amount) + (addFee || 0)).toFixed(8)));
    if (bal.lt(fund)) {
        const value = fund.sub(bal);
        const tx = await owner.sendTransaction({
            value: value,
            to: adr
        });
        console.log('#' + adr, '    sending tx', tx.hash);
        await tx.wait();
    }
}


/**
 * Create troves with random deposited amount ~180 - 280xusd (on rbtc)
 * Randome ICR 150% - 180%
 */
async function createTroves(nr = 100, price) {
    for (let i = 10; i < nr; i++) {
        const account = hdnode.derivePath(derivationPath + i);
        const wallet = new ethers.Wallet(account.privateKey).connect(provider);
        console.log('\n=============== Wallet #%s: %s ===============', i, wallet.address);

        const borrowZUSD = Math.round(Math.random() * 100) + 180;

        /**
         * rbtc * price / (zusd + $20 fee) = icr
         */
        const icr = Math.round(Math.random() * 30) + 150;
        const depositAmount = (icr * (borrowZUSD + 20) / (price * 100)).toFixed(6);

        const liquity = await EthersLiquity.connect(wallet, { useStore: "blockPolled" });
        liquity.store.start();

        await new Promise(async (resolve) => {
            liquity.store.onLoaded = async () => {
                logState('Liquidation of wallet ' + wallet.address, liquity.store.state);
                if (liquity.store.state.trove.status != 'open') {
                    await distributeFund(wallet, depositAmount);
                    await openTrove(liquity, depositAmount, borrowZUSD, icr);
                }
                resolve();
            };
        });
    }
}

async function sendLiquidateTroves(liquity, troves, gasPrice, nonce) {
    if (gasPrice == null) {
        gasPrice = await liquity.connection.provider
            .getGasPrice()
            .then(
                bn => Decimal.fromBigNumberString(bn.toHexString()).mul(configs.gasPriceBuffer)
            );
    }
    
    const addresses = troves.map(trove => trove.ownerAddress);
    console.log(new Date(), `liquidating troves ${troves.length}, gasPrice: ${gasPrice.toString()}`);
    const tx = await liquity.send.liquidate(addresses, { 
        gasPrice: gasPrice.hex,
        nonce: nonce
    });
    console.log(new Date(), 'tx ', tx.rawSentTransaction);
    return tx;
}

async function testLiquidations(liquity) {
    createTroves(50, Number(liquity.store.state.price.toString()));

    // await setPrice(liquity, 50000);

    // // #1. open a big trove on wallet 1
    // await openTrove(liquity, 1.6, 50000); //ICR = 140% 

    // // #2. open a small trove on wallet 2
    // await openTrove(liquity,0.005, 190); //dept 218zusd, ICR = 114%

    // //#3. price drop for ICR of trove #2 < 110
    // await setPrice(liquity, 46000); //107%


    // const res = await liquity.liquidate(liquity.store.state.trove.ownerAddress);
    // console.log(res);
}

async function testGasPrice(ownerLiquity) {
    const botLiquity = await EthersLiquity.connect(bot, { useStore: "blockPolled" });
    botLiquity.store.start();

    botLiquity.store.onLoaded = async () => {
        // await setPrice(botLiquity, 50000);

        const lowICRTroves = await botLiquity.getTroves({
            first: 100,
            sortedBy: "ascendingCollateralRatio"
        });
        const lowestTrove = lowICRTroves[0];
        const curPrice = botLiquity.store.state.price;
        console.log(lowestTrove);
        console.log('debt', lowestTrove.debt.toString())
        console.log('collateral', lowestTrove.collateral.toString())
        console.log('icr', lowestTrove.collateralRatio(curPrice).toString());
        console.log('curPrice', curPrice.toString());

        await Promise.all(lowICRTroves.map(trove => {
            trove.icr = trove.collateralRatio(botLiquity.store.state.price);
            return db.addTrove(trove);
        }));

        //new price to icr < 110%: icr = price * coll/debt
        const newPrice = lowestTrove.debt.mulDiv(1.10 * 0.95, lowestTrove.collateral);
        console.log('newPrice', newPrice.toString());

        let liquidatingTroves = await main.filterLiquidateTroves(newPrice, lowICRTroves);
        console.log('Under Collateralized', liquidatingTroves.length);

        // lowICRTroves.forEach(trove => console.log(trove.ownerAddress, trove.collateralRatio(newPrice).toString()));

        await setPrice(ownerLiquity, newPrice);

        liquidatingTroves = liquidatingTroves.sort(main.byDescendingCollateral);

        const troves = liquidatingTroves.slice(0, 1);
        const liqTx1 = await sendLiquidateTroves(ownerLiquity, troves);

        const memTxs = await mempool.getMempoolTxs();
        console.log(memTxs);

        const {tx, expectedCompensation} = await main.liquidate(botLiquity, troves);

        if (tx) {
            console.log(tx.rawSentTransaction);

            main.listenHigherGasPriceTx(botLiquity, tx, troves, expectedCompensation).then(newTx => {
                console.log('final liquidation tx', newTx.rawSentTransaction);
            });

            //resend liquidation with higher gas price
            const higherGasPrice = Decimal.fromBigNumberString(liqTx1.rawSentTransaction.gasPrice.toHexString()).mul(1.400001);
            console.log('re-sending liquidation with higher gas price', higherGasPrice.toString());
            await sendLiquidateTroves(ownerLiquity, troves, higherGasPrice, liqTx1.rawSentTransaction.nonce);
        }
    };

}

async function start() {
    await main.init();

    const liquity = await EthersLiquity.connect(owner, { useStore: "blockPolled" });
    liquity.store.start();

    liquity.store.subscribe(({ newState }) => {
        // logState("new state", newState);
    });
    
    liquity.store.onLoaded = async () => {
        logState('current state', liquity.store.state);

        console.log('zusdPool', (await liquity.getZUSDInStabilityPool()).toString());


        // testLiquidations(liquity);

        testGasPrice(liquity);
    };
}

start().catch(console.error);