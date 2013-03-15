var path = require("path"), mkdirp = require("mkdirp"), ce = require("cloneextend");
var Crawler = require("crawler").Crawler, cheerio = require("cheerio");

var helpers = require("../helpers/helpers.js");
var client = require("./nestSocketClient.js");
		
module.exports = {
	start : start
};

function start(userConfig, callback) {
	var config = getDefaultedConfig(userConfig);
	
	var spider = {};
	
	client.create(config.nest, function(err, nestClient) {
		if (helpers.guard(err, callback)) {return;}
			
		var crawlerOptions = ce.cloneextend(config.crawler, { callback : crawlerHandler, onDrain : crawlerFinished });
		var crawler = new Crawler(crawlerOptions);
		var isWorking = false;
		//console.log(require("sys").inspect(crawler));
		
		nestClient.on("spider.registered", spiderRegisteredHandler);
		nestClient.on("spider.nudged", spiderNudgedHandler);
		nestClient.on("spider.workReceived", spiderWorkReceivedHandler);
		
		nestClient.emit("spider.register", { "hello" : "world!" }, function(err) {
			if (helpers.guard(err)) { return; }
		});
		
		callback(null, spider);
		
		/* Crawler Handler */
		function crawlerHandler(err, result) {
			if (err) { helpers.log("error", err); return; }
			switch(result.statusCode) {
				case 200:
					successCrawl(result); break;
				default:
					helpers.log("info", "Finished crawling url, error code '"+ result.statusCode +"' : "+ result.req.path);
					helpers.log("info", "Body:-\n '"+ result.body);
					break;
			}
		}
		function crawlerFinished() {
			isWorking = false;
		}
		function successCrawl(result) {
			var $ = cheerio.load(result.body);
			var $anchors = $("a[rel!='nofollow']");
			var urls = [];
			$anchors.each(function() {
				urls.push(this.attr("href"));
			});
			var crawlResult = {
				source : result.req.path,
				urls : urls
			}
			nestClient.emit("nest.submitWork", crawlResult);
			//var isLast = crawler.pool.waitingClientsCount() == 0;
			//isWorking = !isLast;
			helpers.log("info", "Finished crawling url found '"+ urls.length +"' link(s) : "+ crawlResult.source);
		}
		
		/* Nest Client Handlers */
		function spiderRegisteredHandler(options, callback) {
			helpers.log("event", "Successfully registered with nest : "+ config.nest.host);
			callback();
		}
		function spiderNudgedHandler(options, callback) {
			if (isWorking == false) {
				nestClient.emit("spider.requestWork", { size : config.spider.webSize });
				helpers.log("info", "Requesting work size : "+ config.spider.webSize);
			}
			callback();
		}
		function spiderWorkReceivedHandler(options, callback) {
			helpers.log("info", "Received work load ("+ options.id +") size : "+ options.urls.length);
			isWorking = true;
			options.urls.forEach(function(urlEntry) {
				console.log(urlEntry.url);
				crawler.queue(urlEntry.url);
			});
			callback();
		}
	});
}

/* Private Methods */
function getDefaultedConfig(userConfig) {
	var config = {
		nest : {
			host : "127.0.0.1",
			port : 8999
		},
		spider : {
			webSize : 1
		},
		crawler : {
			maxConnections : 1,
			followAllRedirects : true,
			timeout : 1000,
			proxy : "http://10.10.2.100:3128",
			jQuery : false
		}
	};
	ce.extend(config, userConfig);
	return config;
}