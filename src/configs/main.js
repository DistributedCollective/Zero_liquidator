module.exports = {
    node: "https://main.sovryn.app/rpc",
    db: "zero_main.db",
    blockExplorer: "https://explorer.rsk.co",
    serverPort: 3005,
    telegram: {
        apiToken: process.env.TELEGRAM_APITOKEN,
        chatId: process.env.TELEGRAM_CHATID
    },
    gasPriceBuffer: 1.1,
    gasCostThreshold: 0.95
};
