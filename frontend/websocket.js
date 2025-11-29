
let loader = document.getElementById("loader");

function showLoader(on) {
  if (on) {
    loader.classList.add("hidden");
  } else {
    loader.classList.remove("hidden");
  }
}

const WSState = {
  0: "Connecting",
  1: "Connected",
  2: "Disconnecting",
  3: "Disconnected",
};

function createWS(host, onMessageCallback, status_elements) {
	let ws = {};
	ws.socket = {"readyState":3}; // 0: Connecting, 1: Open, 2: Closing, 3: Closed
	ws.stime = 0;
	ws.state = 3;
	ws.callback = (message) => {
		onMessageCallback(JSON.parse(message.data));	
	}

	ws.last_state = ws.state;
	ws.updateStatus = () => {
		if (ws.last_state == ws.state) return;
		ws.last_state = ws.state;
		let str = "";
		switch (ws.state) {
			case 0:
				str = "<div class='status-prog'></div>"
				break;
			case 1:
				str = "<div class='status-ok'></div>"
				break;
			case 2:
				str = "<div class='status-warn'></div>"
				break;
			case 3:
				str = "<div class='status-err'></div>"
				break;
			default:
				console.log("Undefined state", ws.state);
		}
    showLoader(ws.state === 1);
    console.log("Websocket status: ", WSState[ws.state]);
    status_elements.forEach((e) => {e.innerHTML = str;});
	}


	ws.handleWebSocket = () => {
		let ctime = new Date().getTime();
		let diff = ctime - ws.stime;
		ws.stime = ctime;
		if (diff < 600 && ws.socket.readyState > 1) {
			if (ws.socket.readyState != 2) {
				ws.state = 3;
			}
		}
		ws.updateStatus();
		if (ws.state != 3) {return;}
		if (ws.socket.readyState != 3) {ws.socket.close();}
		ws.state = 0;
		ws.socket = new WebSocket(host);
		ws.socket.onmessage = ws.callback;
		ws.socket.onerror = (error) => {console.log(error);};
		ws.socket.onopen = (v) => {
			ws.state = 1;
			ws.updateStatus();
			console.log(`ws open`,v);
		};
		ws.socket.onclose = (v) => {
			ws.state = 3;
			ws.updateStatus();
			console.log(`ws close`,v);
		};
	}
	
	ws.send = (msg) => {
		if (ws.socket.readyState == 1) {
			ws.socket.send(typeof(msg) === "string" ? msg : JSON.stringify(msg));
		}
	}

	ws.interval = setInterval(ws.handleWebSocket, 500);
	ws.handleWebSocket();
	return ws;
}

export {createWS};
