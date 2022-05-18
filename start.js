require('dotenv').config();
const IO = require('socket.io');
const express = require('express');
const http = require('http');

const main = require('./src/controllers/main');
const config = require('./src/configs');

const app = express();
const server = http.createServer(app);
const io = new IO.Server(server);

app.use('/', express.static('public/dist'));

server.listen(config.serverPort, () => {
    console.log('listening on *:' + config.serverPort);
});

main.start(io).catch(err => {
    console.error(err);
    process.exit(1);
});
