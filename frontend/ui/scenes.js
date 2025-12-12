import {newElement} from './elementUtil';
import {getMenu} from './ui';
import {Types} from './type';

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

function constructSceneView(scenes, _parent, scene_callback) {
  let body = getMenu("scenes");
  body.scene_container = document.getElementById("d-scenes-selector");
  body.scene_container.innerHTML = "";
  scenes.forEach((scene) => {
    scene.type = Types.Scene;
    createSceneUI(scene, _parent, scene_callback);
    createSceneUI(scene, body.scene_container, scene_callback);
	});
  console.log("scenes:", scenes);
}

export {constructSceneView};
