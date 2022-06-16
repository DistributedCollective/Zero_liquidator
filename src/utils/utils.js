const { Telegram } = require('telegraf');
const config = require('../configs');

let telegramBot;
if (config.telegram && config.telegram.apiToken) {
    telegramBot = new Telegram(config.telegram.apiToken);
}

module.exports = new class Utils {
    formatDate(date) {
        const output = new Date(parseInt(date) * 1000).toISOString().slice(0, 19).replace("T", " ");
        return output;
    }

    waste(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    async sendTelegramMsg(msg) {
        if (telegramBot) {
            try {
                await telegramBot.sendMessage(config.telegram.chatId, msg, { parse_mode: 'HTML' });
            } catch (e) {
                Log.e(e);
            }
        }
    }
}