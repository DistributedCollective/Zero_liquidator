module.exports = {
    node: "https://rsk-internal.sovryn.app/rpc",
    db: "zero_main.db",
    blockExplorer: "https://explorer.rsk.co",
    serverPort: 3007,
    telegram: {
        apiToken: process.env.TELEGRAM_APITOKEN,
        chatId: process.env.TELEGRAM_CHATID
    },
    gasPriceBuffer: 1.1,
    gasCostThreshold: 0.95,
    gasIncrease: 1, //wei
};
