const artnet = require('artnet');
const {labeledLog} = require("./util.js");
const log = labeledLog("artnet.js");

let artnet_devices = [];

function addArtnetDevices(devices) {
	if (devices.length < 1) {
		log("No ArtNet devices configured");
		return;
	}
	for (let i = 0; i < devices.length; i++) {
		artnet_devices.push(artnet(devices[i]));
	}
}

function artnetSend(universe) {
	if (artnet_devices < 1) {
		return;
	}
	for (let i = 0; i < artnet_devices.length; i++) {
		artnet_devices[i].set(universe.universe, universe.data, () => {});
	}
}

module.exports = {addArtnetDevices, artnetSend};
