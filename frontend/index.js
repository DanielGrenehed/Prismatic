import {addClasses, withLabel} from './elementUtil';
import {createWS} from './ws';
import {updateMultiverse, addMultiverseChangeCallback, getUniverse} from './universe';
import {Fixture, createFixtureUI} from './fixtures';
import {Group} from './groups';
import {InputGroup, createInputUI} from './inputs';
import {constructSceneView, launchScene, handleSceneConflicts} from './scenes';
import {constructAdvancedView} from './advancedView';
import {constructUpdater, stage} from "./updater";
import {setGlobalSwatches, setSwatchWatcher} from "./colorPicker";
import {loadMenu, getMenu, refreshUI} from "./ui";
import {Types} from "./type";

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
  updateMultiverse(scene.subverses);
  stage(scene);
  console.log("Ctrl-click on scene:", scene);
}

function newScene(scene) {
  scenes.push(scene);
  ws.send({type:"update",scenes:scenes});
}

function deleteScene(scene) {
  scenes = scenes.filter((s) => s!==scene);
  ws.send({type:"update",scenes:scenes});
}

function onUpdateMessage(json) {
  let home = getMenu("home");
	if (json.hasOwnProperty("fixtures")) {
		fixtures = json.fixtures.map((f) => new Fixture(f));
    controller.constructControllerUI(fixtures);
		constructAdvancedView(fixtures, newScene);
    constructUpdater(fixtures, ws);
	}
	if (json.hasOwnProperty("groups")) {
		groups = json.groups.map((g) => new Group(g, fixtures));
	}
	if (json.hasOwnProperty("inputs")) {
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
        deleteScene(scene)
      } else if (e.ctrlKey) {
        triggerScene(scene);
      } else {
        launchScene(scene);
      }
    });
	}
	if (json.hasOwnProperty("subverses")) {
	  updateMultiverse(json.subverses);	
    handleSceneConflicts(json.subverses);
	}
  if (json.hasOwnProperty("swatches")) {
    setGlobalSwatches(json.swatches);
  }
}

function onWSMessage(json) {
	if (!json.hasOwnProperty("type")) return;
	switch (json.type) {
		case "trigger":
      if (json.trigger === "clear") {
        updateMultiverse(fixtures.map((f) => {
          f.reset();
          return f.subverse();
        }));
      } else {
        console.log("Unknown trigger:", json.trigger);
      }
			break;
		case "update":
			onUpdateMessage(json);
			break;     
	}
}

ws = createWS(host, onWSMessage, Array.from(document.getElementsByClassName("connection-status")));
