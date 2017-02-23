"use strict";
var request = require("request");
var Mongo = require("soajs.core.modules").mongo;
var mongo;

var testConsole = {
	log: function () {
		if (process.env.SHOW_LOGS === 'true') {
			console.log.apply(this, arguments);
		}
	}
};

module.exports = {
	getKey: function () {
		return "aa39b5490c4a4ed0e56d7ec1232a428f771e8bb83cfcee16de14f735d0f5da587d5968ec4f785e38570902fd24e0b522b46cb171872d1ea038e88328e7d973ff47d9392f72b2d49566209eb88eb60aed8534a965cf30072c39565bd8d72f68ac";
	},
	
	requireModule: function (path) {
		return require((process.env.APP_DIR_FOR_CODE_COVERAGE || '../') + path);
	},
	
	getMongo: function () {
		var registry = require("./registry.js");
		if (!mongo) {
			mongo = {};
			mongo.urac = new Mongo(registry("test_urac", ""));
		}
		return mongo;
	},
	
	requester: function (method, params, cb) {
		var requestOptions = {
			'uri': params.uri,
			'json': params.body || true
		};
		if (params.headers) requestOptions.headers = params.headers;
		if (params.authorization) requestOptions.headers.authorization = params.authorization;
		if (params.qs) requestOptions.qs = params.qs;
		if (params.form !== undefined) requestOptions.form = params.form;
		
		testConsole.log('===========================================================================');
		testConsole.log('==== URI     :', params.uri);
		testConsole.log('==== REQUEST :', JSON.stringify(requestOptions));
		request[method](requestOptions, function (err, response, body) {
			testConsole.log('==== RESPONSE:', JSON.stringify(body));
			return cb(err, body, response);
		});
	}
};