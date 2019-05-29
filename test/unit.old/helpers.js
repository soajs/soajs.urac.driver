"use strict";
const assert = require("assert");
const helper = require("../helper.js");
const utils = helper.requireModule('./lib/helpers.js');
const model = helper.requireModule('./model/mongo.js');

let soajs = {
	"registry":{
		"tenantMetaDB":{
            "urac": {
                "prefix": "",
                "cluster": "test_cluster",
                "name": "#TENANT_NAME#_urac",
                "servers": [
                    {
                        "host": "127.0.0.1",
                        "port": 27017
                    }
                ],
                "credentials": null,
                "streaming": {
                    "batchSize": 1000
                },
                "URLParam": {
                    "bufferMaxEntries": 0
                },
                "timeConnected": 1552747598093
            }
		}
	}
};

describe("testing helpers", function () {

	it("test comparePasswd", function (done) {

		let servicesConfig = {
			hashIterations: 1024,
			seedLength: 32,
			optionalAlgorithm: "md5"
		};
        let config = {
			model: 'mongo',
			hashIterations: 1024,
			seedLength: 32
		};
        let pwd = "123456";
        let cypher = "$2a$04$yn9yaxQysIeH2VCixdovJ.TLuOEjFjS5D2Otd7sO7uMkzi9bXX1tq";

		utils.comparePasswd(servicesConfig, pwd, cypher, config, function (error) {
			assert.ifError(error);
			done();
		});
	});

	describe("testing assureConfig", function () {

		it("urac record missing. With callback", function (done) {
			let obj = {};
			utils.assureConfig(obj, null, function (error) {
				assert.ifError(error);
				done();
			});
		});

		it("urac record missing. WithOut callback", function (done) {
            let obj = {};
			utils.assureConfig(obj, null);
			done();
		});

		it("user with key ACL", function (done) {
			//password = 123456
            let user2 = {
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

            let obj = {};
			utils.assureConfig(obj, user2, function (error) {
				assert.ifError(error);
				done();
			});
		});

	});


});