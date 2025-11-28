const {getMultiverse, updateMultiverse, createSubverse} = require("./universe.js");
const {setScene} = require("./scenes.js");
const {labeledLog} = require("./util.js");
const log = labeledLog("db.js");

let db = null;

function dbStoreMultiverse() {
	if (db == null) return;
	for (let universe of getMultiverse()) {
		db.run("INSERT OR REPLACE INTO universes(universe, data) VALUES (?,?);",
			[universe.universe, JSON.stringify(universe.data)],
			(err, row) => {
				if (err != null) {
					log(err);
				}
			});
	}
}

function dbStoreScene(scene) {
	if (db == null) return;
	db.run("INSERT OR REPLACE INTO scenes(name, time, subverses) VALUES (?,?,?);",
		[scene.name, scene.time, JSON.stringify(scene.subverses)],
		(err, row) => {
			if (err != null) {
				log(err);
			}
		});
}

function setupDatabase(file) {
	log(`using db from: '${file}'`);
	const sqlite3 = require('sqlite3');
	db = new sqlite3.Database(file);

	db.exec("CREATE TABLE IF NOT EXISTS universes (universe INTEGER PRIMARY KEY, data BLOB);");
	db.exec("CREATE TABLE IF NOT EXISTS scenes(name PRIMARY KEY, time, subverses BLOB);");

	db.each("SELECT * FROM universes;", (err, row) => {
		if (err != null) {
			log(err);
			return;
		}
		let universe = createSubverse(row.universe, 0, JSON.parse(row.data));

		updateMultiverse([universe]);
		log(universe);
	});

	db.each("SELECT * FROM scenes;", (err, row) => {
		if (err != null) {
			log(err);
			return;
		}
		setScene({
			name:row.name, 
			time:parseFloat(row.time), 
			subverses:JSON.parse(row.subverses)
		});	
	});
}

module.exports = {dbStoreMultiverse, dbStoreScene, setupDatabase};
