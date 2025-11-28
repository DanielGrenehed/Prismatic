const assert = require("assert");
const {labeledLog} = require("./util.js");
const log = labeledLog("universe.js");

let multiverse = {};
let change_callbacks = [];

function emptyUniverse(uni) {
	return createSubverse(uni, 0, new Array(512).fill(0));
}

function getMultiverse() {
	let universes = [];
	for (let i in multiverse) {
		universes.push(multiverse[i]);
	}
	return universes;
}

function clearMultiverse() {
	for (let i in multiverse) {
		multiverse[i] = emptyUniverse(i);
		for (let callback of change_callbacks) {
			callback(multiverse[i]);
		}
	}
}

function getUniverse(i) {
	i = parseInt(i);
	if (!multiverse.hasOwnProperty(i)) {
		multiverse[i] = emptyUniverse(i);
		log(`universe ${i} created`);
	}
	let universe = multiverse[i];
	return universe;
}

function updateMultiverse(subverses) {
	let updated = [];
	for (let i = 0; i < subverses.length; i++) {
		let verse = subverses[i];
		assert(typeof(verse.universe) === "number");
		
		let uni = getUniverse(verse.universe);
		let uni_i = verse.start;
		for (let j = 0; j < verse.data.length; j++) {
			if (uni.data[uni_i+j] != verse.data[j]) {
				uni.data[uni_i+j] = verse.data[j];
				if (!updated.includes(uni.universe)) {
					updated.push(uni.universe);
				}
			}
		}	
		multiverse[uni.universe] = uni;
	}
	
	if (updated.length != 0) {
		for (let i of updated) {
			let uni = multiverse[i];
			for (let i = 0; i < change_callbacks.length; i++) {
				change_callbacks[i](uni);
			}
		} 
	}

	return updated.length != 0;
}

function addMultiverseChangeCallback(callback) {
	change_callbacks.push(callback);
}

function removeMultiverseChangeCallback(callback) {
	change_callbacks = change_callbacks.filter(e => e != callback);
}

class Subverse {
	constructor(universe, start, data) {
		this.universe = universe;
		this.start = start;
		this.data = data;
	}

	lastIndex() {
		return (this.start + this.data.length -1);
	}

	intersects(otherverse) {
		if (otherverse.universe != this.universe) return false;
		if (otherverse.lastIndex() < this.start) return false;
		if (otherverse.start > this.lastIndex()) return false;
		return true;
	}
}

function createSubverse(universe, start, data) {
	assert(start >= 0);
	assert(start + data.length <= 512);
	assert(universe > 0);
	assert(data != null);
	return new Subverse(universe, start, data);
}

module.exports = {createSubverse, getUniverse, getMultiverse, updateMultiverse, clearMultiverse, addMultiverseChangeCallback, removeMultiverseChangeCallback};
