var io = require("socket.io");

var helpers = require("../helpers/helpers.js");
var HookEmitter = require("../helpers/hookEmitter.js");

module.exports = {
	create : create
};

function create(options, callback) {	
	var serverHooks = new HookEmitter();
	var app = options.express;
	
	app.post(/\/nest\/crawl\/{0,1}/, startCrawlHandler);
	
	callback(null, serverHooks);
	
	/* Rest Handlers */
	function startCrawlHandler(req, res) {
		var options = req.body;
		serverHooks.emit("nest.crawl", options, function(err) {
			if (err) { respondWithError(res, err); return; }
			res.statusCode = 200;
			res.end();
		});
	}
	
	/* Private Methods */
	function respondWithError(res, err) {
		res.statusCode = 500;
		res.end(JSON.stringify({ message : err.toString() }));
	}
}