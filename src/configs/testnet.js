module.exports = {
    node: "https://testnet.sovryn.app/rpc",
    db: "zero_testnet.db",
    blockExplorer: "https://explorer.testnet.rsk.co",
    serverPort: 3004,
    telegram: {
        apiToken: process.env.TELEGRAM_APITOKEN,
        chatId: process.env.TELEGRAM_CHATID
    },
    gasPriceBuffer: 1.1
};
