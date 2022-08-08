module.exports = {
    node: "http://54.187.183.196:4444",
    db: "zero_main.db",
    blockExplorer: "https://explorer.rsk.co",
    serverPort: 3005,
    telegram: {
        apiToken: process.env.TELEGRAM_APITOKEN,
        chatId: process.env.TELEGRAM_CHATID
    },
    gasPriceBuffer: 1.1
};
