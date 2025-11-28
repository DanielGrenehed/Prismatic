const ws = require('ws');
const {tlog} = require('./util.js');

let sockets = [];

function wsSendAll(msg, ws=null) {
	if (typeof(msg) != "string") {
		msg = JSON.stringify(msg);
	}
	for (socket of sockets) {
		if (socket != ws) {
			socket.send(msg);
		}
	}
}

function createWSServer(config, newSocketCallback, onMessageCallback) {
	const ws_server = new ws.WebSocketServer(config);
	ws_server.on('connection', (socket, req) => {
		newSocketCallback(socket);
		sockets.push(socket);
		//tlog(`${req.socket.remoteAddress} socket opened (${sockets.length} client(s) connected)`);
		socket.on('error', console.error);
		socket.on('message', (msg) => {
			onMessageCallback(msg, socket);
		});
		socket.on("close", (event) => {
			sockets = sockets.filter((s) => {return s != socket;});
			//tlog(`${req.socket.remoteAddress} socket closed (${sockets.length} socket(s))`);
		});
	});
	return ws_server;
}

function wsNumConnected() {
	return sockets.length;
}

module.exports = {wsSendAll, createWSServer, wsNumConnected};
