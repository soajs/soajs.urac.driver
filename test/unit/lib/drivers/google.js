"use strict";

const helper = require("../../../helper.js");
const driver = helper.requireModule('./lib/drivers/google.js');
const assert = require('assert');

describe("Unit test for: driver - google", function () {
	let req = {
		"soajs": {
			"inputmaskData": {
				"strategy": "github"
			},
			"servicesConfig": {
				"passportLogin": {
					"github": {
						"clientID": "393278808961-7qahk8kadr2jhbo05o84pbp5tc774a1l.apps.googleusercontent.com",
						"clientSecret": "sdSpS8FLeUvc0UBs_z8m4f89",
						"callbackURL": "http://local-widget.com/urac/login/success"
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
				"name": {
					"givenName": "antoine",
					"familyName": "hage"
				},
				"emails": [{"value": "antoine@soajs.org"}],
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