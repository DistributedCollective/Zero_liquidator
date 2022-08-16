const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Wallet, providers, utils, ethers, Contract, BigNumber } = require("ethers");
const configs = require('../src/configs/testnet');
const mempool = require('../src/controllers/mempool');
const abiLoan = require('./abiLoan.json');
const abiProtocol = require('./abiProtocol.json');
const abiSwap = require('./abiSwap.json');
const Utils = require('../src/utils/utils');
const { Decimal } = require('@liquity/lib-base');
const {formatEther, parseEther} = ethers.utils;

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
const mnemonic = "";
const hdnode = ethers.utils.HDNode.fromMnemonic(mnemonic);
const derivationPath = "m/44'/37310'/0'/0/";
const iXusdAdr = '0xe27428101550f8104a6d06d830e2e0a097e1d006';
const wrbtc = '0x69fe5cec81d5ef92600c1a0db1f11986ab3758ab';
const xusd = '0xa9262cc3fb54ea55b1b0af00efca9416b8d59570';
const sovProtocolAdr = '0x25380305f223B32FDB844152abD2E82BC5Ad99c3';
const sovSwapAdr = '0x6390df6de9f24902b29740371525c2ceaA8F5a4f';

const provider = new providers.JsonRpcProvider(configs.node);
const owner = new Wallet(ownerPrivateKey).connect(provider);
const iXusd = new Contract(iXusdAdr, abiLoan, provider);
const sovProtocol = new Contract(sovProtocolAdr, abiProtocol, provider);
const sovSwap = new Contract(sovSwapAdr, abiSwap, provider);

const maxBlockGas = 6800000;

let minEntryPrice;

runTest().catch(console.log);

async function runTest(nrTest = 6) {
    mempool.init();

    const accounts = [];
    const marginSize = '0.01';

    for (let i = 0; i < nrTest; i++) {
        const account = hdnode.derivePath(derivationPath + i);
        const wallet = new ethers.Wallet(account.privateKey).connect(provider);
        accounts.push(wallet);
        await checkFund(wallet, marginSize);

        await checkCloseTrade(wallet);
    }

    await getMinEntryPrice();

    for (const account of accounts) {
        const mempoolGas = await mempool.getTotalMempoolTxGas();
        const marginTradeGas = Decimal.from(1500000);
        console.log('current mempool gas', mempoolGas.toString());

        if (mempoolGas.add(marginTradeGas).lt(maxBlockGas)) {
            const lev = Math.round((Math.random() * 2) + 3).toString();
            await marginTrade(account, marginSize, lev);
        }
    }

    const mempoolTxs = await mempool.getMempoolTxs();
    console.log('mempool tx', mempoolTxs);
    const totalMempoolGas = await mempool.getTotalMempoolTxGas();
    console.log('total gas', totalMempoolGas.toString());
}

async function checkFund(wallet, amount, addFee = 0.001) {
    const adr = wallet.address;
    const bal = await wallet.getBalance();
    console.log('#' + adr, 'checking fund', amount + 'rBTC,', 'balance:', formatEther(bal));
    const fund = parseEther(String((Number(amount) + (addFee || 0)).toFixed(8)));
    if (bal.lt(fund)) {
        const value = fund.sub(bal);
        const tx = await owner.sendTransaction({
            value: value,
            to: adr
        });
        await tx.wait();
        console.log('#' + adr, 'tx', tx.hash);
    }
}

/**
 * create a Long position on iXusd loan contract
 */
async function marginTrade(trader, amount, leverage) {
    const gasPrice = (await provider.getGasPrice()).mul(120).div(100);
    const loanId = ethers.constants.HashZero;
    const val = parseEther(amount);
    const leverageAmount = parseEther(leverage);
    const loanTokenSent = 0;
    const collateralTokenSent = val;
    const collateralTokenAdr = wrbtc;
    const loanDataBytes = '0x';

    const tx = await iXusd.connect(trader).marginTrade(
        loanId,
        leverageAmount,
        loanTokenSent,
        collateralTokenSent,
        collateralTokenAdr,
        trader.address,
        minEntryPrice,
        loanDataBytes, {
            gasPrice,
            value: val
        }
    );

    console.log('%s send margin trade', trader.address, tx);
}

async function checkCloseTrade(trader) {
    const loans = await sovProtocol.getUserLoans(trader.address, 0, 100, 1, false, false);
    if (loans && loans.length > 0) {
        for (const loanData of loans) {
            if (loanData && loanData.loanId != ethers.constants.HashZero) {
                const closeAmount = parseEther('10000');
                const tx = await sovProtocol.connect(trader).closeWithSwap(
                    loanData.loanId,
                    trader.address,
                    closeAmount,
                    true,
                    '0x'
                );
                console.log('close trade tx', tx);
            }
        }
    }
}

async function getMinEntryPrice() {
    const path = await sovSwap.conversionPath(wrbtc, xusd);
    const amount = parseEther('0.05');
    const amountOut = await sovSwap.rateByPath(path, amount);
    const curPrice = amount.mul(ethers.constants.WeiPerEther).div(amountOut);
    minEntryPrice = curPrice.mul(80).div(100);
    console.log('curprice ', formatEther(curPrice), 'min price', formatEther(minEntryPrice));
}