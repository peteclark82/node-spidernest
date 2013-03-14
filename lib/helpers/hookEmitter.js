var async = require("async");

module.exports = hookEmitter;

function hookEmitter() {
	var allListeners = {};

	this.on = addListener;
	this.emit = emit;	
	
	function addListener(hookName, callback) {
		if (allListeners[hookName] === undefined) {
			allListeners[hookName] = [];
		}
		allListeners[hookName].push(callback);
	}
	
	function emit() {
		var hookName = arguments[0];
		var context = arguments.length == 4 ? arguments[1] : null;
		var options = arguments.length == 4 ? arguments[2] : arguments[1];
		var callback = arguments.length == 4 ? arguments[3] : arguments[2];
	
		var listeners = allListeners[hookName];
		if (listeners === undefined) {
			if (callback !== undefined) { callback(); }
		} else {
			async.forEachSeries(listeners, function(listener, next) {
				listener.apply(context, [options, next]);
			}, function (err) {
				if (err && callback !== undefined) {callback(err);} else {
					if (callback !== undefined) { callback(); }
				}
			});
		}
	}
}