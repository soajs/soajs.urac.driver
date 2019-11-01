"use strict";

const helper = require("../../../helper.js");
const driver = helper.requireModule('./lib/drivers/github.js');
const assert = require('assert');

describe("Unit test for: driver - github", function () {
	let req = {
		"soajs": {
			"inputmaskData": {
				"strategy": "github"
			},
			"servicesConfig": {
				"passportLogin": {
					"github": {
						"clientID": "79729863675e2513ae44",
						"clientSecret": "3f37cea1cff3e2ead1a11d96f9961e27293739e4",
						"callbackURL": "http://local-widget.com/urac/login/success?mode=github"
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
				"username": "ahage",
				"id": "123456789"
			}
		};
		driver.mapProfile(user, (error, profile) => {
			assert.ok(profile);
			assert.equal(profile.email, "ahage@github.com");
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