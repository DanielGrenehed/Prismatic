import {updateMultiverse} from './universe';
import {refreshUI} from './ui';

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
      staged.forEach((f) => {
        if (f.hasUpdates()) {
          f.getSubverseUpdates().forEach((s) => {
            subverses.push(s);
          });
        } else {
          //console.log("No update, sending whole fixture subverse");
          //subverses.push(f.subverse());
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
}, 100);


export {stage, constructUpdater};
