const {labeledLog} = require("./util.js");
const log = labeledLog("scenes.js");
const {dbStoreScene, dbDeleteScene} = require("./db.js");

let scenes = {};
function listScenes() {
	let s = [];
	for (let sc in scenes) {
		s.push(scenes[sc]);
	}
	return s;
}

function setScene(scene) {
  if (scene.hasOwnProperty("delete")) {
    if (scene.delete) {
      deleteScene(scene);
      return;
    }
  }
	scenes[scene.name] = scene;	
}

function deleteScene(scene) {
  if (!scene.hasOwnProperty("name")) {
    log("Cannot delete scene without name to identify", "failed removing scene locally");
    return;
  }
  delete scenes[scene.name];
}

function updateScenes(scenes) {
  let names = scenes.map((s) => s.name);
  const deleted_scenes = listScenes().filter((s) => !names.includes(s.name)) || [];
  scenes.forEach((s) => {
    setScene(s);
    dbStoreScene(s); 
  });
  deleted_scenes.forEach((s) => {
    deleteScene(s);
    dbDeleteScene(s);
  });
}

module.exports = {listScenes, setScene, deleteScene, updateScenes};
