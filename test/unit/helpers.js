"use strict";
var assert = require("assert");
var helper = require("../helper.js");
var utils = helper.requireModule('./lib/helpers.js');

describe("testing helpers", function () {

	it("test comparePasswd", function (done) {

		var servicesConfig = {
			hashIterations: 1024,
			seedLength: 32,
			optionalAlgorithm: "md5"
		};
		var config = {
			model: 'mongo',
			hashIterations: 1024,
			seedLength: 32
		};
		var pwd = "123456";
		var cypher = "$2a$04$yn9yaxQysIeH2VCixdovJ.TLuOEjFjS5D2Otd7sO7uMkzi9bXX1tq";

		utils.comparePasswd(servicesConfig, pwd, cypher, config, function (error, body) {
			assert.ifError(error);
			done();
		});
	});

	describe("testing assureConfig", function () {

		it("urac record missing. With callback", function (done) {
			var obj = {};
			utils.assureConfig(obj, null, function (error, body) {
				assert.ifError(error);
				done();
			});
		});

		it("urac record missing. WithOut callback", function (done) {
			var obj = {};
			utils.assureConfig(obj, null);
			done();
		});

		it("user with key ACL", function (done) {
			//password = 123456
			var user2 = {
				"_id": "54ee46e7a8643c4d10a61ba3",
				"username": "user2",
				"password": '$2a$04$yn9yaxQysIeH2VCixdovJ.TLuOEjFjS5D2Otd7sO7uMkzi9bXX1tq',
				"firstName": "user",
				"lastName": "two",
				"email": "user2@domain.com",
				"ts": new Date().getTime(),
				"status": "active",
				"profile": {},
				"groups": ['silver', 'bronze'],
				"config": {
				},
				"groupsConfig" : [
					{
                        "config" : {
                            "allowedPackages" : {
                                "TPROD" : [
                                    "TPROD_BASIC"
                                ]
                            }
                        }
					}
				],
				"tenant": {
					"id": '10d2cb5fc04ce51e06000001',
					"code": 'test'
				}
			};

			var obj = {};
			utils.assureConfig(obj, user2, function (error, body) {
				assert.ifError(error);
				done();
			});
		});

	});


});