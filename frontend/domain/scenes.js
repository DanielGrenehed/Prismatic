import {newElement} from './elementUtil';
import {stage} from "./updater";
import {updateMultiverse, getMultiverseValues, getSubverseDelta} from './universe';
import {Types} from './type';
import {remap, lerp} from './math';

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

let active_scenes = {};

function launchScene(scene) {
  let end_time = new Date();
  end_time.setSeconds(end_time.getSeconds() + scene.time);

  let entry = {
    start: new Date().getTime(),
    end: end_time.getTime(),
    scene: scene,
    subverses: scene.subverses.map((s)=>getSubverseDelta(s)),
  };

  active_scenes[scene.name] = entry;
  //console.log("Launching scene:", scene, "active_scenes:", active_scenes);
}

function intersect(sub1, sub2) {
  /*
   * returns null when nothing done, otherwise an array of new subverses
   * */

  if (sub1.universe !== sub2.universe) return null;
  const a1 = sub1.start;
  const b1 = sub1.start + sub1.data.length;
  const a2 = sub2.start;
  const b2 = sub2.start + sub2.data.length;
  
  if (a1 < a2 && b1 > b2) {  
    // sub2 inside sub1 (there are channels of both sides of sub 2)
    const p1 = a2-a1;
    const p2 = b2-a1;
    return [{
      universe: sub1.universe,
      start: a1,
      data: sub1.data.slice(0, p1),
    },{
      universe: sub1.universe,
      start: b2,
      data: sub1.data.slice(p2),
    }];
  }
  if (a2 <= a1 && b2 < b1 && b2 > a1) {
    // sub1 starts inside sub2 
    const p = b2-a1;
    return [{
      universe: sub1.universe,
      start: b2,
      data: sub1.data.slice(p),
    }];
  }
  if (a1 < a2 && a2 < b1 && b2 >= b1) {
    // sub2 starts inside sub1
    const p = a1 - a2;
    return [{
      universe: sub1.universe,
      start: a1,
      data: sub1.data.slice(0, p),
    }];
  }
  if (a2 <= a1 && b2 >= b1) return [];

  return null;
}

function handleSceneConflicts(subverses) {
  Object.entries(active_scenes).forEach(([name, scene]) => {
    // find if any subverse intersects with scene subverses
    scene.subverses.forEach((sub1) => {
      let intersected = false;
      for (const sub2 of subverses) {
        let inter = intersect(sub1, sub2);
        if (inter !== null) {
          //console.log("Intersection!!!", inter, "sub1:", sub1, "sub2:", sub2);
          scene.subverses = scene.subverses.filter((s) => s !== sub1).concat(inter);

          break;
        }
      }
    });
    if (scene.subverses.length === 0) {
      //console.log("No unaffected channels on running scene:", scene);
      delete active_scenes[name];
    }
  });
}

const interval = setInterval(function() {
  // Handle active_scenes
  //
  const now = new Date().getTime();
  Object.entries(active_scenes).forEach(([name, scene]) => {

    if (now >= scene.end) {
      const subverses = scene.subverses.map((sub) => {
        return {
          universe: sub.universe,
          start: sub.start,
          data: sub.data.map(([u, s]) => s),
        };
      });
      updateMultiverse(subverses);
      stage({type: Types.Scene, subverses: subverses});
      delete active_scenes[name];
      //console.log("Scene finished:", scene);
    } else {
          
    /*
     *  For each subverse in scene, calculate current state of
     *  value based on lerp between start and end subverses
     *  according to the time between scene's start and the 
     *  ending time
     *
      */
      const progress = remap(scene.start, scene.end, 0.0, 1.0, now);
      //console.log("Progress: ", progress, "scene.start:", scene.start, "scene.end:", scene.end, "now:", now);
      const subverses = scene.subverses.map((sub) => {
        return {
          universe: sub.universe,
          start: sub.start,
          data: sub.data.map(([start, end]) => lerp(start, end, progress)),
        };
      });
      updateMultiverse(subverses);

      stage({type: Types.Scene, subverses: subverses});
    }
  });
}, 100);

export {constructSceneView, launchScene, handleSceneConflicts};
