import {Slider} from './slider';
import {ColorPicker} from './colorPicker';
import {stage} from './updater';
import {getUnifiedChannels} from './advancedView';
import {handleSceneConflicts} from './scenes';

function _arrayEquals(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length != b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] != b[i]) return false;
	}
	return true;
}

class InputGroup {
	constructor(input, groups) {
		this.name = input.name;
		this.type = input.type;
		this.group = groups[input.group_index];
		this.channels = input.channels;
		this.values = [];
		this._from_fixture_callbacks = [];
	}

	getGroup() {
		return this.group;
	}

	updateChannels(array) {
		let vc = [];
		let i = 0;
		for (let channel of this.channels) {
			vc.push({p:channel, v:array[i]});
			if (i < array.length -1) {
				i++;
			}
		}
		this.getGroup().updateChannels(vc);
	}

	addFromFixtureCallback(cb) {
		this._from_fixture_callbacks.push(cb);
	}

	removeFromFixtureCallback(cb) {
		this._from_fixture_callbacks = this._from_fixture_callbacks.filter(e => e != cb);
	}

	_updateFromFixtures() {
		let channel_values = this.group.getChannelValues(this.channels);
		if (channel_values == null || channel_values.length < 1) return;
		for (let i = 1; i < channel_values.length; i++) {
			if (!_arrayEquals(channel_values[i-1], channel_values[i])) return;
		}
		if (_arrayEquals(this.values, channel_values[0])) return;
		this.values = channel_values[0];
		for (let cb of this._from_fixture_callbacks) {
			cb(this);
		}
	}
}

function createInputUI(input, _parent) {
	
	function onInputUpdate(input) {
    stage(input.getGroup().fixtures);
    handleSceneConflicts(input.getGroup().localUpdates());
	}
	
  //console.log("inputs.js input:", input);
	let ui;
	switch (input.type) {
		case "color":
			ui = new ColorPicker((cp) => {
				input.updateChannels(cp.rgb);
				onInputUpdate(input);
			});
      ui.redraw = () => {
        let rgb = getUnifiedChannels(["r","g","b"], input.getGroup().fixtures);
        ui.setRGB(rgb[0]);
      };
			input.addFromFixtureCallback((vs) => {
				ui.setRGB(vs.values);
			});
			_parent.appendChild(ui.container);
			break;
		case "slider":
			ui = new Slider(input.name, 255, (v) => {
				input.updateChannels([v]);
				onInputUpdate(input);
			}, true);
      ui.redraw = () => {
        let v = getUnifiedChannels([input.channels[0]], input.getGroup().fixtures);
        ui.setValue(v[0]);
        ui.updateValues();
      };
			_parent.appendChild(ui.container);
			input.addFromFixtureCallback((vs) => {
				ui.setValue(vs.values[0]);
			});
			break;
		case "vslider":
			ui = new Slider(input.name, 255, (v) => {
				input.updateChannels([v]);
				onInputUpdate(input);
			}, false);
      ui.redraw = () => {
        let v = getUnifiedChannels([input.channels[0]], input.getGroup().fixtures);
        ui.setValue(v[0]);
        ui.updateValues();
      };
			_parent.appendChild(ui.container);
			input.addFromFixtureCallback((vs) => {
				ui.setValue(vs.values[0]);
			});	
			break;
		default:
			console.log(`Unknown input type '${input.type}'`);
	}
	input._updateFromFixtures();
	return ui;
}


export {InputGroup, createInputUI};
