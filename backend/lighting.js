const assert = require("assert");
const models = require("./fixtures.json");
const {labeledLog} = require("./util.js");
const log = labeledLog("lighting.js");
const {createSubverse} = require("./universe.js");

assert(models.hasOwnProperty("fixture_models"));
const fxt_mods = models.fixture_models;

class Fixture {
	constructor(conf, address, mode) {
		this.model = conf.model;
		this.mode = conf.mode;
		this.universe = conf.universe;
		this.address = address;

		this.channel_names = mode.channels;
		this.channels = new Array(mode.channels.length).fill(0);
		this.channel_defaults = new Array(mode.channels.length).fill(0);

		if (conf.hasOwnProperty("channel_defaults")) {
			for (let i = 0; i < conf.channel_defaults.length; i++) {
				let channel_name = Object.keys(conf.channel_defaults[i])[0];
				let value = conf.channel_defaults[i][channel_name];
				const channel = this.channel_names.indexOf(channel_name);
				if (channel > -1) {
					this.channels[channel] = value;
					this.channel_defaults[channel] = value;
				} else {
					log(`Could not find index of channel default (model: ${this.model}, mode: ${this.mode}, address: ${this.address}, ch: ${channel}, ch_name: ${channel_name})`);
				}
			}
		}
	}

	subverse() {
		return createSubverse(this.universe, this.address, this.channels);
	}
	
	updateChannels(values) {
		let updated = 0;
		for (let i = 0; i < values.length; i++) {
			assert(values[i].hasOwnProperty("p"));
			assert(values[i].hasOwnProperty("v"));
			let v = values[i];
	
			for (let j = 0; j < this.channel_names.length; j++) {
				if (this.channel_names[j] === v.p && this.channels[j] != v.v) {
					this.channels[j] = v.v;
					updated++;
				}
			}
		}
	};

	reset() {
		let updated = 0;
		for (let i = 0; i < this.channels.length; i++) {
			if (this.channels[i] != this.channel_defaults[i]) {
				this.channels[i] = this.channel_defaults[i];
				updated++;
			}
		}
	};
}

class FixtureGroup {
	constructor(name, fixture_indexes, fixtures) {
		this.name = name;
		this.fixture_indexes = fixture_indexes;
		this.fixtures = fixtures;
	}

	updateChannels(values) {
		for (let i of this.fixture_indexes) {
			this.fixtures[i].updateChannels(values);
		}
	}

	subverses() {
		let subverses = [];
		for (let f of this.fixture_indexes) {
			subverses.push(this.fixtures[f].subverse());
		}
		return subverses();
	}
}

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

function getModel(m_name) {
	const models = fxt_mods.filter(m => m.name === m_name);
	if (models.length < 1) {
		log(`Could not find model with name '${m_name}'`);
		return null;
	} else if (models.length > 1) {
		log(`Found multiple models named '${m_name}'`);
	}
	assert(models[0].hasOwnProperty("modes"));
	return models[0];
}

function getMode(model, mode) {
	if (model == null) {
		return null;
	}
	const modes = model.modes.filter(m => m.name === mode);
	if (modes.length < 1) {
		log(`Could not find mode '${c_fxt.mode}' in model '${c_fxt.model}'!`);
		return null;
	} else if (modes.length > 1) {
		log(`Found multiple modes named '${c_fxt.mode}' in model '${c_fxt.model}'`);
	}
	assert(modes[0].hasOwnProperty("channels"));
	return modes[0];
}

function getFixtures(conf_fxt) {
	let fixtures = [];
	for (let i = 0; i < conf_fxt.length; i++) {
		const c_fxt = conf_fxt[i];
		assert(c_fxt.hasOwnProperty("model"));
		assert(c_fxt.hasOwnProperty("mode"));
		assert(c_fxt.hasOwnProperty("universe"));
		assert(c_fxt.hasOwnProperty("addresses"));
		
		const mode = getMode(getModel(c_fxt.model), c_fxt.mode);
		if (mode == null) continue;

		for (address of c_fxt.addresses) {
			fixtures.push(new Fixture(c_fxt, address, mode));
		}
	}
	return fixtures;
}

function getFixtureIndexes(universe, fixtures) {
	assert(universe.hasOwnProperty("universe"));
	assert(universe.hasOwnProperty("fixtures"));
	let fa = universe.fixtures;
	return fixtures.reduce((a, f, i) => {
		if (f.universe == universe.universe && 
			fa.includes(f.address)) {
			a.push(i);
		}
		return a;
	}, []);
}

function getGroups(c_groups, fixtures) {
	let groups = [];
	for (let i = 0; i < c_groups.length; i++) {
		let cg = c_groups[i];
		assert(cg.hasOwnProperty("name"));
		assert(cg.hasOwnProperty("universes"));
		let fixture_indexes = cg.universes.map((u) => {
				let indexes = getFixtureIndexes(u, fixtures);
				return indexes;	
			}).reduce((a, l, i) => {
				return a.concat(l);
			}, []);
    log(`Group '${cg.name}' has ${fixture_indexes.length} fixtures`);

		if (fixture_indexes.length < 1) {
			log(`Group ${cg.name} has no fixtures!`);
			continue;
		}
		groups.push(new FixtureGroup(cg.name, fixture_indexes, fixtures));
	}
	return groups;
}

const input_types = ["color", "slider", "vslider"];

function getInputs(c_inputs, groups) {
	let inputs = [];
	for (let i = 0; i < c_inputs.length; i++) {
		let ci = c_inputs[i];
		assert(ci.hasOwnProperty("name"));
		assert(ci.hasOwnProperty("type"));
		assert(ci.hasOwnProperty("group"));
		assert(ci.hasOwnProperty("channels"));
		assert(input_types.includes(ci.type));
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

function loadLighting(config) {
	assert(config.hasOwnProperty("fixtures"));
	let fixtures = getFixtures(config.fixtures);
	log(`Fixtures: ${fixtures.length}`);

	assert(config.hasOwnProperty("groups"));
	let groups = getGroups(config.groups, fixtures);
	log(`Groups: ${groups.length}`);

	assert(config.hasOwnProperty("inputs"));
	let inputs = getInputs(config.inputs, groups);
	log(`Inputs: ${inputs.length}`);
	
	return {
		fixtures:fixtures, 
		groups:groups, 
		inputs:inputs
	};
}

module.exports = {loadLighting};
