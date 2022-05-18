const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Wallet, providers, utils, ethers, Contract } = require("ethers");
const { Decimal, LiquityStoreState } = require("@liquity/lib-base");
const { EthersLiquity, EthersLiquityWithStore, } = require("../packages/lib-ethers");
const { _getContracts } = require("../packages/lib-ethers/dist/src/EthersLiquityConnection");
const configs = require('../src/configs/testnet');
const { formatEther, parseEther } = require('ethers/lib/utils');

const deployments = require('../packages/lib-ethers/deployments/default/rsktestnet.json');

const MockBalanceRedirectPresaleAbi = require('./MockBalanceRedirectPresale.json');
const ZUSDAbi = require('./ZUSDToken.json');

// const privateKey = process.env.PRIVATE_KEY;
const privateKey = "0xe14cbe14c9515be1fe7ce6065c9434a0f1f8583ddfaf45efd91cc9c40b56ac56";
const provider = new providers.JsonRpcProvider(configs.node);
const wallet = new Wallet(privateKey).connect(provider);


/** @type {EthersLiquityWithStore} */
let liquity;

async function openTrove(collateralBtc, borrowUsd) {
    const trove = await liquity.openTrove({
        depositCollateral: new Decimal(utils.parseEther(String(collateralBtc))),
        borrowZUSD: new Decimal(utils.parseEther(String(borrowUsd)))
    });
    console.log('created trove');
    console.log(trove);
}

async function setPrice(price) {
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
        troveStatus: state.trove.status,
        troveICR: state.trove.collateralRatio(state.price).mul(100).toString()
    });
}

async function start() {
    liquity = await EthersLiquity.connect(wallet, { useStore: "blockPolled" });
    liquity.store.start();
    
    liquity.store.subscribe(({ newState }) => {
        logState("new state", newState);
    });

    
    liquity.store.onLoaded = async () => {
        logState('current state', liquity.store.state);

        console.log('zusdPool', (await liquity.getZUSDInStabilityPool()).toString());
        console.log('bal', (await liquity.getZUSDBalance('0xE7827491F432Bbc2736abEBDA20Af057cc7c00a9')).toString());
        console.log((await liquity.getTrove('0xE7827491F432Bbc2736abEBDA20Af057cc7c00a9')).toString());

        const { troveManager } = _getContracts(liquity.connection);

        const recoveryMode = await troveManager.checkRecoveryMode(parseEther(liquity.store.state.price.toString()));
        console.log('recoveryMode', recoveryMode);

        await setPrice(33750);
    };

}

start().catch(console.error);