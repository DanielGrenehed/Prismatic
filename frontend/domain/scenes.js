import {newElement} from './elementUtil';
import {Types} from './type';

function constructSceneView(scenes, _parent, scene_callback) {
  scenes.forEach((scene) => {
    scene.type = Types.Scene;
		let s_cont = newElement("", ["grid", "scene-container", "button"]);
		let s_name = newElement(scene.name, ["lrpad"]);
		s_cont.appendChild(s_name);

		let s_split = newElement("",["splitter"]);
		s_cont.appendChild(s_split);

		let s_time = newElement(scene.time + "s", ["lrpad"]);
		s_cont.appendChild(s_time);

		s_cont.addEventListener('click', (e) => scene_callback(e, scene));
		_parent.appendChild(s_cont);
	});
  console.log("scenes:", scenes);
}

export {constructSceneView};
