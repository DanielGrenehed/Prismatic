global.__basedir = __dirname;
const assert = require('assert');
const {labeledLog} = require('./backend/util.js');
const {createHTTPServer} = require('./backend/httpserver.js');
const {wsSendAll, createWSServer, wsNumConnected} = require('./backend/wss.js');
const config = require("./config.json");
const static_paths = require("./static.json");
const {updateMultiverse, getMultiverse, addMultiverseChangeCallback, createSubverse} = require("./backend/universe.js");

const {loadLighting} = require("./backend/lighting.js");
const {addArtnetDevices, artnetSend} = require("./backend/artnet.js");
const {setScene, deleteScene, updateScenes, listScenes} = require("./backend/scenes.js");
const {dbStoreMultiverse, dbStoreScene, dbDeleteScene, dbGetScenes, setupDatabase, dbStoreValue, dbGetValue} = require("./backend/db.js");


const log = labeledLog("index.js");

assert(config.hasOwnProperty("artnet"));
addArtnetDevices(config.artnet);
addMultiverseChangeCallback(artnetSend);

let lighting = loadLighting(config);
let swatches = [];

function saveSwatches(s) {
  swatches = s;
  dbStoreValue("swatches", swatches);
}

function handleTrigger(json) {
	if (!json.hasOwnProperty("trigger")) return;
	switch (json.trigger) {
		case "clear":
			let subverses = [];
			for (let fixture of lighting.fixtures) {
				fixture.reset();
				subverses.push(fixture.subverse());
			}
			updateMultiverse(subverses);
      wsSendAll(json);
			break;
		default:
			log(`Trigger not implemented (${json.value})`);
	}
}

function handleScenesUpdate(scenes) {
  if (!scenes) scenes = [];
  updateScenes(scenes);
	wsSendAll({type:"update", scenes:listScenes()});
}

function onUpdateMessage(json, ws) {
	if (json.hasOwnProperty("subverses")) {
		let subverses = json.subverses.map((v) => createSubverse(v.universe, v.start, v.data));
		updateMultiverse(subverses);
    wsSendAll(json, ws);
	}
  if (json.hasOwnProperty("swatches")) {
    saveSwatches(json.swatches);
    wsSendAll(json, ws); 
  }
  if (json.hasOwnProperty("scenes")) {
    handleScenesUpdate(json.scenes); 
  }
}

function onWSMessage(msg, ws) {
	let json = JSON.parse(msg);
	if (!json.hasOwnProperty("type")) {
    console.log("Message without type:", json);
    return;
  }
	switch (json.type) {
		case "update":
			onUpdateMessage(json, ws);
			break;
		case "trigger":
			handleTrigger(json);
			break;
		default:
			console.log("Unknown type: " + json.type);
	}
}

function currentState() {
	return {
		type:		"update",
		fixtures: 	lighting.fixtures, 
		groups: 	lighting.groups, 
		inputs: 	lighting.inputs, 
		scenes:		listScenes(), 
		subverses:	getMultiverse(),
    swatches: swatches,
	};
}

function onNewSocket(socket) {
	socket.send(JSON.stringify(currentState()));
}

let _multiverse = {};

function updateClients() {
	if (wsNumConnected() < 1) return;
	for (let k in _multiverse) {
		wsSendAll(_multiverse[k]);
		delete _multiverse[k];
	}
}

addMultiverseChangeCallback((universe) => {
	_multiverse[universe.universe] = JSON.stringify({
		type:"update",
		subverses:[universe]
	});
});

if (config.hasOwnProperty("database")) {
	assert(config.database.hasOwnProperty("path"));
	setupDatabase(__basedir + '/' + config.database.path);
  dbGetValue("swatches", (row) => {
    console.log("Swatch callback, row:", row);
    if (row.name === "swatches" && row.value) {
      let value = row.value;
      if (typeof value === "string") value = JSON.parse(value);
      if (!Array.isArray(value)) {
        console.log("Trying to get swatches from '", value,"', but it is not an array. Aborting");
      } else {
        swatches = value;
      }
    }
  });
  dbGetScenes((row) => {
    setScene({
      name: row.name,
      time: parseFloat(row.time),
      subverses: JSON.parse(row.subverses),
    });
  });
}


const http_server = createHTTPServer(config.http_server, static_paths);
const ws_server = createWSServer(config.ws_server, onNewSocket, onWSMessage);

//setInterval(updateClients,250);
setInterval(dbStoreMultiverse, 1000);
