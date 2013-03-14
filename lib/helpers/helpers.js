var colors = require("colors");

module.exports = {
	log : log,
	guard : guard
};

var logTypes = {
	error : { handler : function displayError(message, err) {
		console.error(message.red.bold);
		if (err && err.stack) { console.error(err.stack); }
		if (err && err.inner) { displayError(err.inner.message, err.inner); }
	}},
	info : { color : "grey" },
	event : { color : "cyan", bold : true }
};

function log() {
	var args = Array.prototype.slice.apply(arguments);
	var message = args.pop();
	var type = args.length > 0 ? args.pop() : "info";
	
	var output = "["+ getTimestamp() +":" + type.toUpperCase() + "] >>> ";
	output += message;
	
	typeConfig = logTypes[type];

	if (typeConfig && typeConfig.handler) {
		typeConfig.handler(output, message);
	} else {
		if (typeConfig && typeConfig.color) { output = output[typeConfig.color]; }
		if (typeConfig && typeConfig.bold) { output = output.bold; }
		console.log(output);
	}
}

function guard() {
	var args = Array.prototype.slice.apply(arguments);
	var isError = args.shift();
	var callback = args.length > 0 && typeof(args[args.length-1]) == "function" ? args.pop() : null;
	var message = args.length > 0 && typeof(args[0]) == "string" ? args.shift() : isError;
	var inner = args.length > 0 ? args.shift() : (isError && message !== isError && isError.message ? isError : null);
	var isError = !!isError;
	var error = message instanceof Error ? message : new Error(message);
	if (inner) { error.inner = inner; }
	
	if (isError) {
		if (callback) {
			callback(error);
		} else {
			//log("error", error);
			throw error;
		}
	}
	return isError;
}

/* Private Methods */
function getTimestamp() {
    var currentTime = new Date()
    var hours = currentTime.getHours()
    var minutes = currentTime.getMinutes()
    var seconds = currentTime.getSeconds()

    if (minutes < 10) { minutes = "0" + minutes }
    if (seconds < 10) { seconds = "0" + seconds }
    return hours + ":" + minutes + ":" + seconds;
}