const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Wallet, providers, utils, ethers, Contract } = require("ethers");
const { Decimal, LiquityStoreState } = require("@liquity/lib-base");
const { EthersLiquity, EthersLiquityWithStore, } = require("../packages/lib-ethers/dist");
const { _getContracts } = require("../packages/lib-ethers/dist/src/EthersLiquityConnection");
const configs = require('../src/configs/testnet');
const { formatEther, parseEther } = require('ethers/lib/utils');
const Utils = require('../src/utils/utils');

const mnemonic = "laundry act silent desert item mansion indoor upon flee obey pioneer example";
const hdnode = ethers.utils.HDNode.fromMnemonic(mnemonic);
const derivationPath = "m/44'/37310'/0'/0/";

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
const provider = new providers.JsonRpcProvider(configs.node);
const owner = new Wallet(ownerPrivateKey).connect(provider);


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
    console.log('set price to', price);
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
async function createLiquidations(nr = 100, price) {
    for (let i = 70; i < nr; i++) {
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

async function start() {
    const liquity = await EthersLiquity.connect(owner, { useStore: "blockPolled" });
    liquity.store.start();

    liquity.store.subscribe(({ newState }) => {
        // logState("new state", newState);
    });

    
    liquity.store.onLoaded = async () => {
        logState('current state', liquity.store.state);

        createLiquidations(71, Number(liquity.store.state.price.toString()));

        console.log('zusdPool', (await liquity.getZUSDInStabilityPool()).toString());

        // await depositZUSDToPool();

        // await setPrice(50000);

        //#1. open a big trove on wallet 1
        // await openTrove(1.6, 50000); //ICR = 140% 

        //#2. open a small trove on wallet 2
        // await openTrove(0.005, 190); //dept 218zusd, ICR = 114%

        // //#3. price drop for ICR of trove #2 < 110
        // await setPrice(46000); //107%


        // const res = await liquity.liquidate(liquity.store.state.trove.ownerAddress);
        // console.log(res);
    };
}

start().catch(console.error);