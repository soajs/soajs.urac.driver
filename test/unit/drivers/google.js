"use strict";
var assert = require("assert");
var helper = require("../../helper.js");
var utils = helper.requireModule('./lib/drivers/google.js');

describe("testing google driver", function () {

	it("test mapProfile", function (done) {

		var data = {
			profile: {
				id: "id",
				emails: [{
					value: "email.com"
				}],
				name: {
					givenName: "givenName",
					familyName: "familyName"
				}
			}
		};
		utils.mapProfile(data, function (error, body) {
			assert.ifError(error);
			assert.ok(body);
			utils.preAuthenticate(null, function(){
				done();
			});
		});
	});

});