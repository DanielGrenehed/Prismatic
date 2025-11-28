const http = require('http');
const fs = require("fs");
const {labeledLog} = require("./util.js");
const log = labeledLog("httpserver.js");

function createHTTPServer(config, static_paths) {

	for (const [url, obj] of Object.entries(static_paths)) {
		if (obj.hasOwnProperty("content")) continue;
		fs.readFile(__basedir + '/' + obj["path"], function(err, content) {
			if (err) throw err;
			static_paths[url].content = content.toString();
		});
	} 


	const server = http.createServer((req, res) => {
		if (req.url in static_paths) {
			res.statusCode = 200;
			res.setHeader("Content-Type", static_paths[req.url]["Content-Type"]);
			res.end(static_paths[req.url]["content"]);

		} else if (req.url == "" || req.url == "/") { // Default to index
			res.statusCode = 200;
			res.setHeader("Content-Type", "text/html");
			res.end(static_paths["/index"]["content"]);

		} else {	
			res.statusCode = 404;
			res.setHeader("Content-Type","text/plain");
			res.end("File not found!");
		}
	});

	server.listen(config.port, config.host, () => {
		log(`server running on ${config.host}:${config.port}`);
	});

	return server;
}

module.exports = {createHTTPServer};
