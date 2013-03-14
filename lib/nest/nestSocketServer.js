var io = require("socket.io");

var helpers = require("../helpers/helpers.js");
var HookEmitter = require("../helpers/hookEmitter.js");

module.exports = {
	create : create
};

function create(options, callback) {
	var socketServer = io.listen(options.server, { log : false });
	socketServer.set('log level', 10);
	
	var serverHooks = new HookEmitter();
		
	socketServer.of("/nest-socket").on("connection", function(socket) {		
		serverHooks.on("nest.nudgeSpiders", nestNudgeSpidersHandler);
		serverHooks.on("spider.sendWork", spiderSendWorkHandler);
	
		socket.on("spider.register", spiderRegisterHandler);
		socket.on("spider.requestWork", spiderRequestWorkHandler);
		socket.on("nest.submitWork", nestSubmitWorkHandler);
	
		/* Server Hook Handlers */
		function nestNudgeSpidersHandler(options, callback) {
			socket.emit("spider.nudged", options);
			helpers.log("info", "Spider nudged");
			callback();
		}
		function spiderSendWorkHandler(options, callback) {
			socket.emit("spider.workReceived", options);
			callback();
		}
	
		/* Socket Handlers */
		function spiderRegisterHandler(data) {
			var address = socket.handshake.address;
			var options = {
				spider : {
					host : address.address,
					port : address.port,
					details : data
				}
			};
			serverHooks.emit("spider.register", options, function(err) {
				if (err) { respondWithError("Error registering spider with nest", err); return; }
				socket.emit("spider.registered", {});
			});
		}		
		function spiderRequestWorkHandler(data) {
			serverHooks.emit("spider.requestWork", data, function(err) {
				if (err) { respondWithError("Error requesting work", err); return; }
			});
		}	
		function nestSubmitWorkHandler(data) {
			serverHooks.emit("nest.submitWork", data, function(err) {
				if (err) { respondWithError("Error submitting work", err); return; }
			});
		}	
	});
	
	callback(null, serverHooks);	
	
	/* Private Methods */
	function respondWithError(logMessage, err) {
		helpers.log("error", message);
		helpers.log("error", err);
		serverHooks.emit("error", { message : "Unexpected error occurred on nest server", error : err });
	}
}