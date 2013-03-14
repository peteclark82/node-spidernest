var path = require("path"), mkdirp = require("mkdirp"), ce = require("cloneextend"),
		http = require("http"), express = require("express");

var helpers = require("../helpers/helpers.js");
var socketServer = require("./nestSocketServer.js");
var restServer = require("./nestRestServer.js");
		
module.exports = {
	start : start
};

function start(userConfig, callback) {
	var config = getDefaultedConfig(userConfig);
	
	var app = express();
	app.use(express.bodyParser());
	var httpServer = http.createServer(app);
		
	var nest = {};
	
	socketServer.create({ server : httpServer }, function(err, socket) {
		if (helpers.guard(err, callback)) {return;}
		restServer.create({ express : app }, function(err, rest) {
			if (helpers.guard(err, callback)) {return;}
			
			socket.on("spider.register", spiderRegisterHandler);
			socket.on("spider.requestWork", spiderRequestWorkHandler);
			socket.on("nest.submitWork", nestSubmitWorkHandler);
			
			rest.on("nest.crawl", nestCrawlHandler)
			
			httpServer.listen(config.port, function(err) {
				if (helpers.guard(err, callback)) {return;}
				helpers.log("event", "Nest server listening on port : "+ config.port);
				callback(null, nest);
			});
			
			/* Socket Server Handlers */
			function spiderRegisterHandler(options, callback) {
				helpers.log("event", "Spider registered : "+ options.spider.host +":"+ options.spider.port);
				callback();
			}
			function spiderRequestWorkHandler(options, callback) {
				helpers.log("info", "Spider requested work size : "+ options.size);
				callback();
				var urls = getUrlsFromQueue(options.size);
				if (urls.length > 0) {
					var workLoad = {
						id : "1234",
						urls : urls
					};
					socket.emit("spider.sendWork", workLoad);
					helpers.log("info", "Spider sent work load size : "+ urls.length);
				}
			}
			function nestSubmitWorkHandler(options, callback) {
				helpers.log("info", "Spider submitted work for url : "+ options.source);
				processSubmittedWork(options);
				callback();
			}
			
			/* Rest Server Handlers */
			function nestCrawlHandler(options, callback) {
				var url = options.url;
				if (helpers.guard(typeof(url) !== "string", "No url specified", callback)) {return;}				
				addUrlsToQueue([url]);
				
				socket.emit("nest.nudgeSpiders", {}, function(err) {
					if (helpers.guard(err, callback)) {return;}
					helpers.log("event", "New crawl started : "+ url);
					callback();
				})
			}
		});
	});
	
	/* Private Methods */
	var crawlQueue = [], inProgress = {}, processed = {};
	function processSubmittedWork(workResult) {
		processed[workResult.source] = true;
		helpers.log("info", "Processing submitted work size : "+ workResult.urls.length);
		var urls = workResult.urls;
		var finalUrls = [], filteredCount = 0;
		while(urls.length > 0) {
			var url = urls.shift();
			var approved = false;
			for(var i=0; i<config.rules.length; i++) {
				if (config.rules[i](url) === true) { approved = true; break; } 
			}
			if (approved === true) { finalUrls.push(url); } else { filteredCount++; }
		}
		helpers.log("info", filteredCount + " url(s) filtered");
		addUrlsToQueue(finalUrls);
	}	
	function addUrlsToQueue(urls) {
		urls.forEach(function(url) {
			crawlQueue.push({ url : url });
		});
		helpers.log("info", urls.length + " url(s) added to the queue. New size : "+ crawlQueue.length);
	}
	function getUrlsFromQueue(size) {
		var urls = crawlQueue.splice(crawlQueue.length-size, size);
		urls.forEach(function(urlEntry) {
			var url = urlEntry.url;
			inProgress[url] = true;
		});
		return urls;
	}
}

/* Private Methods */
function getDefaultedConfig(userConfig) {
	var config = {
		port : 8999,
		paths : {
			output : path.join(process.cwd(), "output"),
			working : path.join(process.cwd(), "working")
		},
		rules : []
	};
	ce.extend(config, userConfig);
	return config;
}