const {labeledLog} = require("./util.js");
const log = labeledLog("db.js");

let db = null;

function dbStoreMultiverse(multiverse) {
	if (!db) return;
  multiverse.forEach((universe) => {
		db.run("INSERT OR REPLACE INTO universes(universe, data) VALUES (?,?);",
			[universe.universe, JSON.stringify(universe.data)],
			(err, row) => {
				if (err) {
					log(err);
				}
			});
	});
}

function dbGetMultiverse(callback) {
	db.each("SELECT * FROM universes;", (err, row) => {
		if (err) {
			log(err, "Error selecting from universes");
			return;
		}
    callback(row);
	});
}

function dbStoreScene(scene) {
	if (!db) return;
	db.run("INSERT OR REPLACE INTO scenes(name, time, subverses) VALUES (?,?,?);",
		[scene.name, scene.time, JSON.stringify(scene.subverses)],
		(err, row) => {
			if (err) {
				log(err);
			}
		});
}

function dbDeleteScene(scene) {
  if (!db) return;
  db.run("DELETE FROM scenes WHERE name=?", [scene.name], (err, row) => {
    if (err) {
      log(err, "tried to delete scene");
    } else {
      log(row, "scene deleted");
    }
  });
}

function dbGetScenes(callback) {
  if (!db) return;
	db.each("SELECT * FROM scenes;", (err, row) => {
		if (err) {
			log(err, "Error selecting from scenes");
			return;
		}
    callback(row);
	});
}

function dbStoreValue(name, value) {
  if (!db) return;
  if (typeof value !== 'string') value = JSON.stringify(value);
  db.run("INSERT OR REPLACE INTO config(name, value) VALUES (?,?);",
    [name, value],
    (err, row) => {
      if (err) {
        log(err, "Error inserting into config");
        return;
      }
  });
}

function dbGetValue(name, callback) {
  if (!db) return;
  db.each("SELECT * FROM config WHERE name = ?;", [name], (err, row) => {
    if (err) {
      log(err, "Error selecting from config");
      return;
    }
    if (callback) callback(row);
  });
}

function setupDatabase(file) {
	log(`using db from: '${file}'`);
	const sqlite3 = require('sqlite3');
	db = new sqlite3.Database(file);

	db.exec("CREATE TABLE IF NOT EXISTS universes (universe INTEGER PRIMARY KEY, data BLOB);");
	db.exec("CREATE TABLE IF NOT EXISTS scenes (name PRIMARY KEY, time, subverses BLOB);");
  db.exec("CREATE TABLE IF NOT EXISTS config (name PRIMARY KEY, value BLOB);");
}

module.exports = {dbStoreMultiverse, dbGetMultiverse, dbStoreScene, dbGetScenes, dbStoreValue, dbDeleteScene, dbGetValue, setupDatabase};
