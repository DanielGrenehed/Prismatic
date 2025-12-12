import {newElement} from './elementUtil';
import {getMenu} from './ui';
import {Types} from './type';
import {addGlobalSwatchWatcher, getGlobalSwatches} from './colorPicker';

let on_swatch_callback = (_,__) => {};

function setSwatchCallback(cb) {
  on_swatch_callback = cb;
}

function createSceneUI(scene, _parent, callback) {
  let s_cont = newElement("", ["grid", "scene-container", "button"]);
  let s_name = newElement(scene.name, ["lrpad"]);
  s_cont.appendChild(s_name);

  let s_split = newElement("",["splitter"]);
  s_cont.appendChild(s_split);

  let s_time = newElement(scene.time + "s", ["lrpad"]);
  s_cont.appendChild(s_time);

  s_cont.addEventListener('click', (e) => callback(e, scene));
  _parent.appendChild(s_cont);
}

function setSwatches(swatches) {
  let view = getMenu("scenes");   
  view.swatch_container.innerHTML = "";
  swatches.forEach((color) => {
    let swatch = newElement("", ["swatch"]);
    swatch.style.background = color;
    swatch.addEventListener("click", (e) => {
      on_swatch_callback(color, e);
    });
    view.swatch_container.appendChild(swatch);
  });
}

addGlobalSwatchWatcher(setSwatches);

function constructSceneView(scenes, _parent, scene_callback) {
  let view = getMenu("scenes");
  view.scene_container = document.getElementById("d-scenes-selector");
  view.scene_container.innerHTML = "";
  view.swatch_container = document.getElementById("d-swatch-launcher");
  view.swatch_container.innerHTML = "";
  scenes.forEach((scene) => {
    scene.type = Types.Scene;
    createSceneUI(scene, _parent, scene_callback);
    createSceneUI(scene, view.scene_container, scene_callback);
	});
  setSwatches(getGlobalSwatches());
  console.log("scenes:", scenes);
}

export {constructSceneView, setSwatchCallback};
