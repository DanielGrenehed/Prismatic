import {refreshUI, getMenu} from './ui';
import {createTabbedContainer, newElement, createLabel} from './elementUtil';
let multiverse = {};
let change_callbacks = [];
let fixtures = [];

function getUniverse(i) {
	if (!multiverse.hasOwnProperty(i)) {
		multiverse[i] = createSubverse(i, 0, new Array(512).fill(0));
	}
	return multiverse[i];
}

function getMultiverseValues(subs) {
  let subverses = [];
  
  subs.forEach((sub) => {
    subverses.push(getUniverse(sub.universe).data.slice(sub.start, sub.start + sub.data.length));
  });

  return subverses;
}


function getSubverseDelta(sub) {
  let start = getUniverse(sub.universe).data.slice(sub.start, sub.start+sub.data.length);
  let subverse = {
    universe: sub.universe,
    start: sub.start,
    data: start.map((v, i) => [v, sub.data[i]]),
  };
  return subverse;
}

function updateMultiverse(subverses, skip_cb=false) {
	let updated = [];
  subverses.forEach((verse) => {
		let uni = getUniverse(verse.universe);
		let start = verse.start;
		for (let j = 0; j < verse.data.length; j++) {
			if (uni.data[start+j] != verse.data[j]) {
				uni.data[start+j] = verse.data[j];
				if (!updated.includes(uni.universe)) {
					updated.push(uni.universe);
				}
			}
		}	
		multiverse[uni.universe] = uni;
	});
	
  //console.log("multiverse, updated:", updated.length);
  if (!skip_cb) {
    for (let i in multiverse) {
      let uni = multiverse[i];
      for (let callback of change_callbacks) {
        callback(uni);
      }
    } 
  }
  if (updated.length > 0) {
    getMenu("multiverse").redraw();
  }
	return updated.length != 0;
}

function addMultiverseChangeCallback(callback) {
	change_callbacks.push(callback);
}

function removeMultiverseChangeCallback(callback) {
	change_callbacks = change_callbacks.filter(e => e != callback);
}

function _filterData(data) {
	for (let i = 0; i < data.length; i++) {
		data[i] = Math.max(Math.min(Math.round(data[i]), 255), 0);
	}
	return data;
}

class Subverse {
	constructor(universe, start, data) {
		this.universe = universe;
		this.start = start;
		this.data = _filterData(data);
	}
	lastIndex() {
		return this.start + this.data.length - 1;
	}
	intersects(otherverse) {
		if (otherverse.universe != this.universe) return false;
		if (otherverse.lastIndex() < this.start) return false;
		if (otherverse.start > this.lastIndex()) return false;
		return true;
	}
}

function createSubverse(universe, start, data) {
	return new Subverse(universe, start, data);
}

function constructUniverseView(u) {
  let universe = newElement("", ["flex", "gap-1", "wrap", "padded", "border"]);
  universe.data = getUniverse(u).data;
  universe.ui = universe.data.map((v, i) => {
    let channel = newElement("", ["background", "rounded", "padded", "byte"]);
    channel.innerHTML = v;
    channel.redraw = () => {
      channel.innerHTML = getUniverse(u).data[i];
    };
    channel.title = i;
    universe.appendChild(channel);
    return channel;
  });
  universe.redraw = () => {
    universe.ui.forEach((c) => c.redraw());
  };
  return universe;
}

function constructViewOfFixtures() {
  let view = getMenu("multiverse");
  fixtures.forEach((f) => {
    let tab_name = "Universe " + f.universe;
    
    if (!view.tabbed_container.hasTab(tab_name)) {
      let tab = view.tabbed_container.addTab(tab_name);
      view.universes[f.universe] = constructUniverseView(f.universe);
      tab.appendChild(view.universes[f.universe]);
    }

    f.channel_names.forEach((channel, i) => {
      let idx = i + f.address;
      let ui = view.universes[f.universe].ui[idx];
      ui.title = "" + idx + ": " + f.model + " '" + channel + "'";
    });
  });
}

function constructMultiverseView(fs) {
  let view = getMenu("multiverse");
  view.body.innerHTML = "";
  view.universes = {};
  view.tabbed_container = createTabbedContainer([], (tab) => {});
  view.body.appendChild(view.tabbed_container);
  view.redraw = () => {
    Object.entries(view.universes).forEach(([_, u]) => u.redraw());
  };
  fixtures = fs; 
  constructViewOfFixtures();
}

export {constructMultiverseView, createSubverse, Subverse, updateMultiverse, addMultiverseChangeCallback, removeMultiverseChangeCallback, getUniverse, getMultiverseValues, getSubverseDelta};
