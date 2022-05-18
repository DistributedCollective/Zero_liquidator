const { EthersLiquityWithStore } = require("../../packages/lib-ethers/dist");

const { Wallet } = require("ethers");
const { formatEther } = require("ethers/lib/utils");
const db = require('./db');
const config = require('../configs');

class Monitor {
    init(wallet, liquidity) {
        /** @type { Wallet } */
        this.wallet = wallet;

        /** @type {EthersLiquityWithStore} */
        this.liquidity = liquidity;
    }

    /**
     * Load all detail of account wallets on this relayer
     */
    async getAccountInfo(cb) {
        let accountWithInfo = {
            address: this.wallet.address,
            usdBalance: "0",
            rBtcBalance: Number(
                formatEther(await this.wallet.getBalance())
            ).toFixed(5),
            zusdBalance: Number(
                (await this.liquidity.getZUSDBalance(this.wallet.address)).toString()
            ),
            zeroBalance: Number(
                (await this.liquidity.getZEROBalance(this.wallet.address)).toString()
            ),
            nueBalance: Number(
                (await this.liquidity.getNUEBalance(this.wallet.address)).toString()
            ),
        };

        let usdBalance = accountWithInfo.zusdBalance 
            + accountWithInfo.zeroBalance 
            + accountWithInfo.nueBalance;

        if (Number(accountWithInfo.rBtcBalance) > 0) {
            usdBalance += Number(accountWithInfo.rBtcBalance) * Number(this.liquidity.store.state.price.toString());
        }

        accountWithInfo.usdBalance = usdBalance.toFixed(2);

        cb(accountWithInfo);
    }

    /**
     * Load total processed orders, profit
     */
    async getTotals(cb, last24h = false) {
        const result = await db.getTotals(last24h);
        console.log(result);
        cb(result);
    }

    getNetworkData(cb) {
        const resp = {
            blockExplorer: config.blockExplorer
        };
        cb(resp)
    }

    async listTroves({ status = '', offset = 0, limit = 10 }, cb) {
        const troves = await db.listTroves({ status, limit, offset, latest: true});
        const total = await db.countTroves({ status });
        cb({
            list: troves,
            total,
            offset,
            limit
        });
    }
}

module.exports = new Monitor();