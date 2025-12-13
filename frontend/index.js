import {addClasses, withLabel} from './elementUtil';
import {createWS} from './ws';
import {updateMultiverse, addMultiverseChangeCallback, getUniverse} from './universe';
import {Fixture, setFixtures, getFixtures} from './fixtures';
import {Group} from './groups';
import {InputGroup, createInputUI} from './inputs';
import {constructSceneView, setSwatchCallback} from './scenes';
import {constructAdvancedView} from './advancedView';
import {constructUpdater, stage, launchModifier, handleModifierConflicts} from "./updater";
import {setGlobalSwatches, setSwatchWatcher} from "./colorPicker";
import {stringToColor} from "./colorUtil";
import {loadMenu, getMenu, refreshUI} from "./ui";
import {Types} from "./type";
import {constructMultiverseView} from './universe';
import {constructControllerUI} from './controller';
import {createLogger} from './util';
const {isLogging, log} = createLogger("index");

let host = "ws://"+window.location.hostname+":3030";
let ws;
let groups = [];
let inputs = [];
let scenes = [];

loadMenu();

addMultiverseChangeCallback((universe) => {
  getFixtures().forEach((f) => f.updateFromSubverse(universe));
  inputs.forEach((i) => i._updateFromFixtures());
  refreshUI();
});
setSwatchCallback((c, e) => {
  let rgb = stringToColor(c);
  let subverses = [];
  getFixtures().forEach((f) => subverses = subverses.concat(f.getFutureChannelSubverses(["r","g","b"], rgb)));
  launchModifier({
    type: Types.ColorChange,
    color: c,
    subverses,
    time: 1,
  });
});

setSwatchWatcher((swatches) => ws.send({type:"update", swatches:swatches}));

let clear_btns = Array.from(document.getElementsByClassName("clear-button"));
clear_btns.forEach((b) => b.addEventListener("click", (e) => {ws.send({type:"trigger",trigger:"clear"});}));

function triggerScene(scene) {
  updateMultiverse(scene.subverses);
  stage(scene);
  log("Ctrl-click on scene:", scene);
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
		let fixtures = json.fixtures.map((f) => new Fixture(f));
    setFixtures(fixtures);
    constructMultiverseView(fixtures);
    constructControllerUI(fixtures);
		constructAdvancedView(fixtures, newScene);
    constructUpdater(fixtures, ws);
	}
	if (json.hasOwnProperty("groups")) {
		groups = json.groups.map((g) => new Group(g, getFixtures()));
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
    scenes.sort((a,b) => a.name.localeCompare(b.name))
		let footer = document.getElementsByTagName("footer")[0];
		footer.innerHTML = "";
		constructSceneView(scenes, footer, (e, scene) => {
      if (e.ctrlKey && e.shiftKey) {
        deleteScene(scene)
      } else if (e.ctrlKey) {
        triggerScene(scene);
      } else {
        launchModifier(scene);
      }
    });
	}
	if (json.hasOwnProperty("subverses")) {
	  updateMultiverse(json.subverses);	
    handleModifierConflicts(json.subverses);
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
        updateMultiverse(getFixtures().map((f) => {
          f.reset();
          return f.subverse();
        }));
      } else {
        log("Unknown trigger:", json.trigger);
      }
			break;
		case "update":
			onUpdateMessage(json);
			break;     
	}
}

ws = createWS(host, onWSMessage, Array.from(document.getElementsByClassName("connection-status")));
