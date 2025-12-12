import {refreshUI} from './ui';
import {Types} from './type';
import {updateMultiverse, getMultiverseValues, getSubverseDelta} from './universe';
import {remap, lerp} from './math';

let active_modifiers = {};

function launchScene(scene) {
  let end_time = new Date();
  end_time.setSeconds(end_time.getSeconds() + scene.time);
  let entry = {
    start: new Date().getTime(),
    end: end_time.getTime(),
    scene: scene,
    subverses: scene.subverses.map((s)=>getSubverseDelta(s)),
  };
  active_modifiers[scene.name] = entry;
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

function handleModifierConflicts(subverses) {
  Object.entries(active_modifiers).forEach(([name, modifier]) => {
    // find if any subverse intersects with modifier subverses
    modifier.subverses.forEach((sub1) => {
      let intersected = false;
      for (const sub2 of subverses) {
        let inter = intersect(sub1, sub2);
        if (inter !== null) {
          modifier.subverses = modifier.subverses.filter((s) => s !== sub1).concat(inter);
          break;
        }
      }
    });
    if (modifier.subverses.length === 0) {
      delete active_modifiers[name];
    }
  });
}

function handleActiveModifiers() {
  // Handle active_modifiers
  const now = new Date().getTime();
  Object.entries(active_modifiers).forEach(([name, modifier]) => {

    if (now >= modifier.end) {
      const subverses = modifier.subverses.map((sub) => {
        return {
          universe: sub.universe,
          start: sub.start,
          data: sub.data.map(([u, s]) => s),
        };
      });
      updateMultiverse(subverses);
      stage({type: Types.Scene, subverses: subverses});
      delete active_modifiers[name];
      //console.log("Scene finished:", modifier);
    } else {
          
    /*
     *  For each subverse in modifier, calculate current state of
     *  value based on lerp between start and end subverses
     *  according to the time between modifier's start and the 
     *  ending time
     *
      */
      const progress = remap(modifier.start, modifier.end, 0.0, 1.0, now);
      //console.log("Progress: ", progress, "modifier.start:", modifier.start, "modifier.end:", modifier.end, "now:", now);
      const subverses = modifier.subverses.map((sub) => {
        return {
          universe: sub.universe,
          start: sub.start,
          data: sub.data.map(([start, end]) => Math.floor(lerp(start, end, progress))),
        };
      });
      updateMultiverse(subverses);

      stage({type: Types.Scene, subverses: subverses});
    }
  });
}

let ws = null; 
let staged = [];

function stage(fixture) {
  if (Array.isArray(fixture)) {
    fixture.forEach((f) => stage(f));
    return;
  }
//  updateMultiverse(fixture.getSubverseUpdates(false), true);
  if (staged.includes(fixture)) return;
  staged.push(fixture);
};

function constructUpdater(fixtures, ws_) {
  ws = ws_;
} 

const interval = setInterval(function() {
  handleActiveModifiers();
  if (ws) {
    if (staged.length > 0) {
      let subverses = [];
      staged.forEach((s) => {
        
        switch (s.type) {
          case Types.Fixture: 
            if (s.hasUpdates()) {
              s.getSubverseUpdates().forEach((sub) => subverses.push(sub));
            } else {
              //console.log("No update, sending whole fixture subverse");
              //subverses.push(f.subverse());
            }
            break;
          case Types.Scene:
            s.subverses.forEach((sub) => subverses.push(sub));
            break;
          default:
            console.log("Updater: Unknown type: ", s.type);
        }
      });
      try {
        updateMultiverse(subverses, true);
        refreshUI();
        ws.send({type:"update", subverses:subverses});
        staged = [];
      } catch (e) {}
    }
  }
}, 50);

export {stage, constructUpdater, handleModifierConflicts, launchScene};
