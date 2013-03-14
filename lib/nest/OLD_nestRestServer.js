var express = require("express");

var helpers = require("../helpers/helpers.js");
var HookEmitter = require("../helpers/hookEmitter.js");

module.exports = {
	create : create
};

function create(options, callback) {
	var app = express();
	app.use(express.bodyParser()); //this responds and logs "400 Bad Request" if no JSON body present. Need to handle error
	
	var hooks = new HookEmitter();
	
	app.post(/^\/spider\/register\/{0,1}$/, spiderRegisterHandler);
	
	app.listen(options.port, function(err) {
		if (helpers.guard(err, callback)) {return;}
		helpers.log("event", "Nest server listening on port : "+ options.port);
		callback(null, hooks);
	});
	
	/* Route Handlers */
	function spiderRegisterHandler(req, res) {
		var options = {
			spider : {
				ipAddress : req.connection.remoteAddress,
				details : req.body
			}
		};
		hooks.emit("spider.register", options, function(err) {
			if (err) {
				helpers.log("error", "Error registering spider with nest");
				res.statusCode = 500;
				res.end(JSON.stringify({ message : "Unexpected error occurred on nest server" }));
			} else {
				res.statusCode = 200;
				res.end();
			}
		});
	}
}