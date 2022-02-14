require('dotenv').config();
const main = require('./controllers/main');

main.start().catch(err => {
    console.error(err);
    process.exit(1);
});
