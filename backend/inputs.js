const assert = require("assert");
const {labeledLog} = require("./util.js");
const log = labeledLog("inputs.js");

const valid_types = ["color", "slider", "vslider"];

class InputGroup {
	constructor(config, group_index, groups) {
		this.name = config.name;
		this.type = config.type;
		this.group = config.group;
		this.group_index = group_index;
		this.channels = config.channels;
		this._groups = groups;
	}

	getGroup() {
		return this._groups[this.group_index];
	}

	updateChannels(array) {
		let vc = [];
		for (let i = 0; i < array.length; i++) {
			if (i >= this.channels.length) {break;}
			vc.push({p:this.channels[i], v:array[i]});
		}
		this.getGroup().updateChannels(vc);
	}
}

function getInputs(c_inputs, groups) {
	let inputs = [];
	for (let i = 0; i < c_inputs.length; i++) {
		let ci = c_inputs[i];
		assert(ci.hasOwnProperty("name"));
		assert(ci.hasOwnProperty("type"));
		assert(ci.hasOwnProperty("group"));
		assert(ci.hasOwnProperty("channels"));
		assert(valid_types.includes(ci.type));
		let group_indexes = groups.reduce((a, g, i) => {
			if (g.name === ci.group) {
				a.push(i);
			}
			return a;
		},[]);
		if (group_indexes.length < 1) {
			log(`Could not find group '${ci.group}' for input '${ci.name}'!`);
			continue;
		} else if (group_indexes.length > 1) {
			log(`Found multiple group entries named '${ci.group}'`);
		}
		inputs.push(new InputGroup(ci, group_indexes[0], groups));
	}
	return inputs;
}

module.exports = {getInputs};
