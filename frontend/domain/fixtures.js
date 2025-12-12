import {createSubverse} from './universe';
import {newElement} from './elementUtil';
import {Types} from './type';

function applyDelta(value, acc, delta) {
  // Accumulate fractional change
  acc += delta;

  if (acc < 0) acc -=1;
  // Extract whole steps (could be negative!)
  let steps = Math.trunc(acc);

  // Clamp steps so value stays between 0 and 255
  let newValue = Math.min(Math.max(value + steps, 0), 255);

  // Remove whole part from accumulator
  if (newValue < 255) acc -= steps;

  // Normalize accumulator to [0,1]
  if (acc >= 1 && newValue === 255) {
    acc = 1;
  } else {
    acc = acc % 1;
  }
  if (acc < 0) {
    if (newValue === 0) {
      acc = 0;
    } else {
      acc += 1;
    }
  }

  // Remove -0 issue
  if (Object.is(acc, -0)) acc = 0;

  return [newValue, acc];
}

class Fixture {
	constructor(fixture) {
    this.type = Types.Fixture;
		this.model = fixture.model;
		this.mode = fixture.mode;
		this.universe = fixture.universe;
		this.address = fixture.address;

		this.channel_names = fixture.channel_names;
		this.channels = fixture.channels;
		this.channel_defaults = fixture.channel_defaults;
		
		this._subverse_update_callbacks = [];
		this._channel_update_callbacks = [];
    
    this.hasPan = this.channel_names.includes("pan");
    this.hasFPan = this.channel_names.includes("fine_pan");
    this.hasTilt = this.channel_names.includes("tilt");
    this.hasFTilt = this.channel_names.includes("fine_tilt");
    this.hasZoom = this.channel_names.includes("zoom");
    this.hasFZoom = this.channel_names.includes("fine_zoom");
    this.hasFocus = this.channel_names.includes("focus");
    this.hasFFocus = this.channel_names.includes("fine_focus");
    this.updated = {};
	}	

  isSameFixture(f) {
    if (this.model !== f.model) return false;
    if (this.mode !== f.mode) return false;
    if (this.universe !== f.universe) return false;
    if (this.address !== f.address) return false;
    return true;
  }

	subverse() {
		return createSubverse(this.universe, this.address, this.channels);
	}

  channelSubverses(channels) {
    if (!Array.isArray(channels)) channels = [channels];
    const result = [];
    let start = null;
    let values = [];

    this.channel_names.forEach((name, i) => {
      if (channels.includes(name)) {
        if (!start) start = i;
        values.push(this.channels[i]);
      } else {
        if (values.length > 0 && start) {
          result.push(createSubverse(this.universe, this.address + start-1, values));
          start = null;
          values = [];
        }
      }
    });
    if (values.length > 0 && start) {
      result.push(createSubverse(this.universe, this.address + start-1, values));
    }
    return result;
  }

  getFutureChannelSubverses(channels, vals) {
    const result = [];
    let start = null;
    let values = [];

    this.channel_names.forEach((name, i) => {
      let idx = channels.indexOf(name);
      if (idx !== -1) {
        if (!start) start = i;
        values.push(vals[idx]);
      } else {
        if (values.length > 0 && start) { 
          result.push(createSubverse(this.universe, this.address + start-1, values));
          start = null;
          values = [];
        }
      }
    });
    if (values.length > 0 && start) { 
          result.push(createSubverse(this.universe, this.address + start-1, values));
    }
    return result;
  }

  hasUpdates() {
    return Object.keys(this.updated).length > 0;
  }

  getSubverseUpdates(clear_updates=true) {
    const keys = Object.keys(this.updated).map(Number).sort((a,b)=>a-b);
    const result = [];
    let start = null;
    let prev = null;
    let values = [];

    for (const key of keys) {
      if (start === null) {
        start = key;
        prev = key;
        values.push(this.channels[key]);
        continue;
      }
      if (key === prev +1) {
        values.push(this.channels[key]);
        prev = key;
      } else {
        result.push({start, end: prev, values});
        start = key;
        prev = key;
        values = [this.channels[key]];
      }
    }
    if (start !== null) {
      result.push({start, end: prev, values});
    }
    if (clear_updates) this.updated = {};

    const out = result.map((s) => createSubverse(this.universe, this.address + s.start, s.values));
    return out;
  }

	addSubverseUpdateCallback(cb) {
		this._subverse_update_callbacks.push(cb);
	}

	removeSubverseUpdateCallback(cb) {
		this._subverse_update_callbacks = this._subverse_update_callbacks.filter(e => e != cb);
	}

	addChannelUpdateCallback(cb) {
		this._channel_update_callbacks.push(cb);
	}

	removeChannelUpdateCallback(cb) {
		this._channel_update_callbacks = this._channel_update_callbacks.filter(e => e != cb);
	}

	updateFromSubverse(verse) {
		const clen = this.channels.length;
		const vlen = verse.lastIndex();
		const subverse = this.subverse();
		if (!subverse.intersects(verse)) return false;
		let updated = 0;
		let channel_i = 0;
		let verse_i = 0;
		if (subverse.start > verse.start) {
			verse_i = subverse.start - verse.start;
		} else if (subverse.start < verse.start) {
			channel_i = verse.start - subverse.start;
		}
		while (channel_i < clen && verse_i <= vlen) {
			if (subverse.data[channel_i] != verse.data[verse_i]) {
				this.channels[channel_i] = verse.data[verse_i];
				updated++;
        delete this.updated[channel_i];
			}
			channel_i++;
			verse_i++;
		}
		if (updated != 0) {
			for (let cb of this._subverse_update_callbacks) {
				cb(this);
			}

		}
		return updated != 0;
	}

	updateChannels(values) {
		let updated = 0;
    values.forEach((v) => {
      this.channel_names.forEach((name, i) => {
				if (name === v.p && this.channels[i] != v.v) {
					this.channels[i] = v.v;
					updated++;
					this.updated[i] = v.v;
				}
			});
		});
		if (updated != 0) {
			for (let cb of this._channel_update_callbacks) {
				cb(this);
			}
		}
	}

	reset() {
		let updated = 0;
    this.updated = {};
		for (let i = 0; i < this.channels.length; i++) {
			if (this.channels[i] != this.channel_defaults[i]) {
				this.channels[i] = this.channel_defaults[i];
				updated++;
        this.updated[i] = this.channels[i];
			}
		}
		if (updated != 0) {
			for (let cb of this._channel_update_callbacks) {
				cb(this);
			}
		}
	}

	getChannelValues(channels) {
		let data = [];
		for (let i = 0; i < channels.length; i++) {
			let channel_i = this.channel_names.indexOf(channels[i]);
			if (channel_i > -1) {
				data.push(this.channels[channel_i]);
			}
		}
		return data;
	}

  pan(d) {
    if (!this.hasPan) return; 
    if (d === 0) return;
    if (!this.pan_acc) this.pan_acc = 0;
    const old_v = this.getChannelValues(["pan"])[0];
    let [v, acc] = applyDelta(old_v, this.pan_acc, d);
    this.pan_acc = acc;
    let updates = [];
    if (v !== old_v) {
      updates.push({p:"pan",v:v});
    }
    if (this.hasFPan) updates.push({p:"fine_pan",v:Math.trunc(this.pan_acc*255)});
    this.updateChannels(updates);
    return updates.length > 0;
  }
  tilt(d) {
    if (!this.hasTilt) return;
    if (d === 0) return;
    if (!this.tilt_acc) this.tilt_acc = 0;
    let old_v = this.getChannelValues(["tilt"])[0];
    let [v, acc] = applyDelta(old_v, this.tilt_acc, d);
    this.tilt_acc = acc;
    let updates = [];
    if (v !== old_v) {
      updates.push({p:"tilt",v:v});
    }
    if (this.hasFTilt) updates.push({p:"fine_tilt",v:Math.trunc(this.tilt_acc*255)});
    this.updateChannels(updates);
    return updates.length > 0;
  }
  zoom(d) {
    if (!this.hasZoom) return;
    if (d === 0) return;
    if (!this.zoom_acc) this.zoom_acc = 0;
    let old_v = this.getChannelValues(["zoom"])[0];
    let [v, acc] = applyDelta(old_v, this.zoom_acc, d);
    this.zoom_acc = acc;
    let updates = [];
    if (v !== old_v) {
      updates.push({p:"zoom",v:v});
    }
    if (this.hasFZoom) updates.push({p:"fine_zoom",v:Math.trunc(this.zoom_acc*255)});
    this.updateChannels(updates);
    return updates.length > 0;
  }
  focus(d) {
    if (!this.hasFocus) return;
    if (d === 0) return;
    if (!this.focus_acc) this.focus_acc = 0; 
    let old_v = this.getChannelValues(["focus"])[0];
    let [v, acc] = applyDelta(old_v, this.focus_acc, d);
    this.focus_acc = acc;
    let updates = [];
    if (v !== old_v) {
      updates.push({p:"focus",v:v});
    }
    if (this.hasFFocus) updates.push({p:"fine_focus",v:this.focus_acc*255});
    this.updateChannels(updates);
    return updates.length > 0;
  }
}

function createFixtureUI(fixture, cb, long_press_cb=null) {
  //if (fixture.ui) return fixture.ui;
	fixture.selected = false;
	let f_container = newElement("",["fixture-container","pointer"]);
	let fadd = newElement(fixture.address+1, ["fixture-address"]);
	let fmod = newElement(fixture.model, ["fixture-model"]);
	let fmde = newElement(fixture.mode, ["fixture-mode"]);
	f_container.appendChild(fadd);
	f_container.appendChild(fmod);
	f_container.appendChild(fmde);
  let sc = newElement("", ["fixture-colored-border"]);
  sc.appendChild(f_container);
	sc.addEventListener('click', (e) => {
    if (e.shiftKey) {
      if (long_press_cb) long_press_cb(fixture);
    } else {
      sc.setSelected(!fixture.selected);
		  cb(fixture);
    }
	});
  if (long_press_cb) {
    const blockContextMenu = (e) => {e.preventDefault();};
    sc.touch_timer = null;
    sc.addEventListener("touchstart", (e) => {
      clearTimeout(sc.touch_timer);
      sc.addEventListener("contextmenu", blockContextMenu);
      sc.touch_timer = setTimeout(() => {
        long_press_cb(fixture);
      }, 700);
    });
    sc.addEventListener("touchend", (e) => {
      clearTimeout(sc.touch_timer);
      sc.touch_timer = null;
      sc.removeEventListener("contextmenu", blockContextMenu);
    });
    sc.addEventListener("touchcancel", (e) => {
      clearTimeout(sc.touch_timer); 
    });
    sc.addEventListener("touchmove", (e) => {
      clearTimeout(sc.touch_timer);
    });
  }
	sc.setSelected = (selected) => {
		fixture.selected = selected;
		if (selected) {
			f_container.classList.add("selected");
		} else {
			f_container.classList.remove("selected");
		}
	};
	sc.redraw = () => {};
  sc.colors = [];
  sc.updateColor = () => {
    let str = "rgba(0,0,0,0)";
    if (sc.colors.length > 0) str = `linear-gradient(15deg, ${sc.colors.reduce((a, clr, i) => a + (i===0 ? "":",") + clr)})`
    sc.style.background = str;
    sc.style.opactiy = sc.colors.length > 0 ? 1 : 0;
  };
  sc.addColor = (color) => {
    if (sc.colors.includes(color)) return;
    sc.colors.push(color);
    sc.updateColor();
  };
  sc.removeColor = (color) => {
    if (!sc.colors.includes(color)) return;
    sc.colors = sc.colors.filter((c) => c !== color);
    sc.updateColor();
  };
	sc.fixture = fixture;
  fixture.ui = sc;
	return sc;
}

export {Fixture, createFixtureUI};
