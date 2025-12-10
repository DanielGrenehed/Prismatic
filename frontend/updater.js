import {updateMultiverse} from './universe';
import {refreshUI} from './ui';
import {Types} from './type';

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


export {stage, constructUpdater};
