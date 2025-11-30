import {addClasses, withLabel} from './elementUtil';
import {createWS} from './ws';
import {updateMultiverse, addMultiverseChangeCallback, getUniverse} from './universe';
import {Fixture, createFixtureUI} from './fixtures';
import {Group} from './groups';
import {InputGroup, createInputUI} from './inputs';
import {constructSceneView} from './scenes';
import {constructAdvancedView} from './advancedView';
import {constructUpdater, stage} from "./updater";
import {setGlobalSwatches, setSwatchWatcher} from "./colorPicker";
import {loadMenu, getMenu, refreshUI} from "./ui";

import * as controller from './controller';

let host = "ws://"+window.location.hostname+":3030";
let ws;
let fixtures = [];
let groups = [];
let inputs = [];
let scenes = [];

loadMenu();

addMultiverseChangeCallback((universe) => {
  fixtures.forEach((f) => f.updateFromSubverse(universe));
  inputs.forEach((i) => i._updateFromFixtures());
  refreshUI();
});

setSwatchWatcher((swatches) => ws.send({type:"update", swatches:swatches}));

let clear_btns = Array.from(document.getElementsByClassName("clear-button"));
clear_btns.forEach((b) => b.addEventListener("click", (e) => {ws.send({type:"trigger",trigger:"clear"});}));

function triggerScene(scene) {
  //console.log(`triggering scene '${scene.name}' subverses: `, scene.subverses);
  updateMultiverse(scene.subverses);
  ws.send({type: "scene",
    trigger: "start",
    name: scene.name,
    time: scene.time,
    subverses: scene.subverses
  }); 
}

function onUpdateMessage(json) {
  //console.log("Got update:", json);
  let home = getMenu("home");
	if (json.hasOwnProperty("fixtures")) {
		fixtures = json.fixtures.map((f) => new Fixture(f));
		constructAdvancedView(fixtures, (scene) => {ws.send(scene);});
    controller.constructControllerUI(fixtures);
    constructUpdater(fixtures, ws);
	}
	if (json.hasOwnProperty("groups")) {
		groups = json.groups.map((g) => new Group(g, fixtures));
	}
	if (json.hasOwnProperty("inputs")) {
    home.ui_elements.forEach((i) => {
      if (i.destruct) i.destruct();
    });
		home.body.innerHTML = "";
		inputs = json.inputs.map((i) => {
      let input = new InputGroup(i, groups);
      home.ui_elements.push(createInputUI(input, home.body));
      return input;
    });
	}
	if (json.hasOwnProperty("scenes")) {
		scenes = json.scenes.map((scene) => scene);
		let footer = document.getElementsByTagName("footer")[0];
		footer.innerHTML = "";
		constructSceneView(scenes, footer, (e, scene) => {
      if (e.ctrlKey && e.shiftKey) {

        scenes = scenes.filter((s) => s!==scene);
        console.log("Deleting scene:", scene, "scenes:", scenes);
        ws.send({type:"update",scenes:scenes});
      } else {
        triggerScene(scene);
      }
    });
	}
	if (json.hasOwnProperty("subverses")) {
	  updateMultiverse(json.subverses);	
	}
  if (json.hasOwnProperty("swatches")) {
    setGlobalSwatches(json.swatches);
  }
}

function onWSMessage(json) {
	if (!json.hasOwnProperty("type")) {
		return;
	}

	switch (json.type) {
		case "trigger":
      if (json.trigger === "clear") {
        updateMultiverse(fixtures.map((f) => {
          f.reset();
          return f.subverse();
        }));
      }
			break;
		case "scene":
			break;
		case "update":
			onUpdateMessage(json);
			break;     
	}
}

ws = createWS(host, onWSMessage, Array.from(document.getElementsByClassName("connection-status")));
