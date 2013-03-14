#!/usr/bin/env node

var path = require("path");
var colors = require("colors"), optimist = require("optimist");

var spidernest = require("../lib/spidernest.js");

var cli = createCli();
var args = cli.argv;

if (args.help === true) { cli.showHelp(); } else {
	loadConfiguration(path.resolve(process.cwd(), args.config), function(err, configFunc) {
		if (err) { spidernest.helpers.log("error", err); return; } 
		var config = configFunc();
		switch (args.type) {
			case "nest":
				spidernest.nest.start(config, function(err, nest) {
					if (err) { spidernest.helpers.log("error", err); return; }
					spidernest.helpers.log("event", "Nest Started!");
				});
				break;
			case "spider":
				spidernest.spider.start(config, function(err, spider) {
					if (err) { spidernest.helpers.log("error", err); return; }
					spidernest.helpers.log("event", "Spider Started!");
				});
				break;
			default:
				spidernest.helpers.log("error", "Unrecognised type : "+ args.type);
				break;
		}		
	});
}

/* Private Functions */
function createCli() {
	return optimist
		.usage('Start either a spider or nest using the specified configuration.'.bold.yellow + '\nUsage: $0 -t <spider|nest> -c <config file>'.yellow)
		.default('h', false).boolean('h').alias('h', 'help').describe('h', 'Shows the usage information')
		.demand('t').string('t').alias('t', 'type').describe('t', 'Choose to start either a spider or a nest')
    .demand('c').string('c').alias('c', 'config').describe('c', 'Configuration file for spider/nest');
}

function loadConfiguration(configFile, callback) {
	if (path.extname(configFile) == "") { configFile += ".js"; }
	var config = null;
	try { config = require(configFile); } catch(err) {
		spidernest.helpers.guard(err, "Error loading configuration file : " + configFile, callback);
	}
	if (config !== null) { callback(null, config); } 
}