const {labeledLog} = require("./util.js");
const log = labeledLog("scenes.js");

let scenes = {};
function listScenes() {
	let s = [];
	for (let sc in scenes) {
		s.push(scenes[sc]);
	}
	return s;
}

function setScene(scene) {
	scenes[scene.name] = scene;	
}

let on_scene_update_callbacks = [];
let on_scene_start_callbacks = [];

function onScene(json) {
	if (!json.hasOwnProperty("trigger")) {
		log("scene with no trigger");
		log(json);
		return;
	}
	if (!json.hasOwnProperty("name")) {
		log("scene without name");
		log(json);
		return;
	}
	if (!json.hasOwnProperty("time")) {
		log("scene without time");
		log(json);
		return;
	}
	if (!json.hasOwnProperty("subverses")) {
		log("scene without subverses");
		log(json);
		return;
	}
	let scene = {
		name:json.name, 
		time:json.time, 
		subverses:json.subverses
	};

	switch (json.trigger) {
		case "update":
			for (let cb of on_scene_update_callbacks) {
				cb(scene);
			}
			break;
		case "start":
			for (let cb of on_scene_start_callbacks) {
				cb(scene);
			} 
			break;
	}
}

function addOnSceneUpdate(cb) {
	on_scene_update_callbacks.push(cb);
}

function removeOnSceneUpdate(cb) {
	on_scene_update_callbacks = on_scene_update_callbacks.filter(e => e!=cb);
}

function addOnSceneStart(cb) {
	on_scene_start_callbacks.push(cb);
}

function removeOnSceneStart(cb) {
	on_scene_start_callbacks = on_scene_start_callbacks.filter(e => e!=cb);
}

module.exports = {setScene, listScenes, onScene, addOnSceneUpdate, removeOnSceneUpdate, addOnSceneStart, removeOnSceneStart};
