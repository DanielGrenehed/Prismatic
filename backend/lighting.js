const assert = require("assert");
const {getFixtures} = require("./fixtures.js");
const {getGroups} = require("./groups.js");
const {getInputs} = require("./inputs.js");

const {labeledLog} = require("./util.js");
const log = labeledLog("lighting.js");

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
