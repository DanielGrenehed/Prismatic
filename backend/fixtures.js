const assert = require("assert");
const models = require("./fixtures.json");
const {createSubverse} = require("./universe.js");
const {labeledLog} = require("./util.js");
const log = labeledLog("fixtures.js");

assert(models.hasOwnProperty("fixture_models"));
const fxt_mods = models.fixture_models;


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

class Fixture {
	constructor(conf, address, mode) {
		this.model = conf.model;
		this.mode = conf.mode;
		this.universe = conf.universe;
		this.address = address;

		this.channel_names = mode.channels;
		this.channels = new Array(mode.channels.length).fill(0);
		this.channel_defaults = new Array(mode.channels.length).fill(0);
		
		this._subverse_update_callbacks = [];
		this._channel_update_callbacks = [];

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
		const subverse = this.subverse();
		const clen = subverse.lastIndex();
		const vlen = verse.lastIndex();
		if (!subverse.intersects(verse)) return false;

		let updated = 0;
		let channel_i = 0;
		let verse_i = 0;

		if (subverse.start > verse.start) {
			verse_i = subverse.start - verse.start;
		} else if (subverse.start < verse.start) {
			channel_i = verse.start - subverse.start;
		}
		while (channel_i <= clen && verse_i <= vlen) {
			if (subverse.data[channel_i] != verse.data[verse_i]) {
				this.channels[channel_i] = verse.data[verse_i];
				updated++;
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
		if (updated != 0) {
			for (let cb of this._channel_update_callbacks) {
				cb(this);
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
		if (updated != 0) {
			for (let cb of this._channel_update_callbacks) {
				cb(this);
			}
		}
	};

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

module.exports = {getFixtures};
