"use strict";
var assert = require("assert");
var helper = require("../../helper.js");
var utils = helper.requireModule('./lib/drivers/facebook.js');

describe("testing facebook driver", function () {

	it("test mapProfile", function (done) {

		var data = {
			profile: {
				id: "id",
				"_json": {
					first_name: "first_name",
					last_name: "last_name"
				}
			}
		};
		utils.mapProfile(data, function (error, body) {
			assert.ifError(error);
			assert.ok(body);
			done();
		});
	});

});