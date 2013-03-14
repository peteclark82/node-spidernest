var io = require("socket.io-client");

var helpers = require("../helpers/helpers.js");
var HookEmitter = require("../helpers/hookEmitter.js");

module.exports = {
	create : create
};

function create(options, callback) {	
	var hostAndPort = options.host + ":" + options.port;
	var socket = io.connect("http://127.0.0.1:8080/nest-socket", {reconnect: true, log : true});

	var clientHooks = new HookEmitter();
	
	clientHooks.on("spider.register", spiderRegisterHandler);
	clientHooks.on("spider.requestWork", spiderRequestWorkHandler);
	clientHooks.on("nest.submitWork", nestSubmitWorkHandler);
	
	socket.on("error", function(err) { helpers.log("error", err); });
	socket.on("connect", function(socketNotSureWhatFor) { });
	socket.on("spider.registered", spiderRegisteredHandler);
	socket.on("spider.nudged", spiderNudgedHandler);
	socket.on("spider.workReceived", spiderWorkReceivedHandler);
	
	callback(null, clientHooks);
	
	/* Client Hook Handlers */
	function spiderRegisterHandler(options, callback) {
		socket.emit("spider.register", options);
	}
	function spiderRequestWorkHandler(options, callback) {
		socket.emit("spider.requestWork", options);
	}
	function nestSubmitWorkHandler(options, callback) {
		socket.emit("nest.submitWork", options);
	}
	
	/* Sockets Handlers */	
	function spiderRegisteredHandler(options) {
		clientHooks.emit("spider.registered", options);
	}
	function spiderNudgedHandler(options) {
		clientHooks.emit("spider.nudged", options);
	}
	function spiderWorkReceivedHandler(options) {
		clientHooks.emit("spider.workReceived", options);
	}
}