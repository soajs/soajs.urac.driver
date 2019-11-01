"use strict";

const helper = require("../../../helper.js");
const driver = helper.requireModule('./lib/drivers/facebook.js');
const assert = require('assert');

describe("Unit test for: driver - facebook", function () {
	let req = {
		"soajs": {
			"inputmaskData": {
				"strategy": "facebook"
			},
			"servicesConfig": {
				"passportLogin": {
					"facebook": {
						"clientID": "331502413866510",
						"clientSecret": "1a07a7eb9c9884dc5d148106ede830b2",
						"callbackURL": "http://local-widget.com/urac/login/success?mode=facebook"
					}
				}
			}
		}
	};
	it("test - init", function (done) {
		driver.init(req, (error, data) => {
			assert.ok(data);
			done();
		});
	});
	it("test - mapProfile", function (done) {
		let user = {
			"profile": {
				"_json":
					{
						"first_name": "tony",
						"last_name": "hage",
						"email": "antoine@soajs.org"
					},
				"id": "123456789"
			}
		};
		driver.mapProfile(user, (error, profile) => {
			assert.ok(profile);
			assert.equal(profile.email, "antoine@soajs.org");
			done();
		});
	});
	it("test - preAuthenticate", function (done) {
		driver.preAuthenticate(req, (error) => {
			done();
		});
	});
	it("test - updateConfig", function (done) {
		driver.updateConfig({"conf": "1"}, (error, config) => {
			assert.equal(config.conf, "1");
			done();
		});
	});
});