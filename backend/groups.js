const assert = require("assert");
const {labeledLog} = require("./util.js");
const log = labeledLog("groups.js");

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

module.exports = {getGroups};
