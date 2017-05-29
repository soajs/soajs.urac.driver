"use strict";
var assert = require("assert");
var helper = require("../../helper.js");
var utils = helper.requireModule('./lib/drivers/twitter.js');

describe("testing twitter driver", function () {

	it("test mapProfile", function (done) {
		
		var data = {
			profile: {
				id: "id",
				username : "testing_username",
				displayName : "testing_displayName"
			}
		};
		utils.mapProfile(data, function (error, body) {
			assert.ifError(error);
			assert.ok(body);
			done();
		});
	});

});