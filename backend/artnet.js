const artnet = require('artnet');
const {labeledLog} = require("./util.js");
const log = labeledLog("artnet.js");

let artnet_devices = [];

function addArtnetDevices(devices) {
	if (devices.length < 1) {
		log("No ArtNet devices configured");
		return;
	}
  devices.forEach((d) => artnet_devices.push(artnet(d)));
}

function artnetSend(universe) {
	if (!artnet_devices || artnet_devices.length < 1) return;
  artnet_devices.forEach((ad) => 
    ad.set(universe.universe, universe.data, 
      (s) => {/*log(s, "Device universe set");*/}
    )
  );
}

module.exports = {addArtnetDevices, artnetSend};
