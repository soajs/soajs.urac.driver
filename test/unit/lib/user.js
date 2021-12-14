"use strict";
const coreModules = require("soajs.core.modules");
const core = coreModules.core;
const helper = require("../../helper.js");
const BL = helper.requireModule('./lib/user.js');
const Model = helper.requireModule('./model/mongo/user.js');
const assert = require('assert');

describe("Unit test for: lib - user", function () {
	
	let modelUserObj = null;
	let _id = null;
	let userRecord = null;
	let soajs = {
		"meta": core.meta,
		"tenant": {
			"code": "TES0",
			"id": "5c0e74ba9acc3c5a84a51259"
		},
		"registry": {
			"tenantMetaDB": {
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
						"useUnifiedTopology": true
					},
					"timeConnected": 1552747598093
				}
			}
		},
		"log": {
			"error": (msg) => {
				console.log(msg);
			},
			"debug": (msg) => {
				console.log(msg);
			}
		},
		"config": helper.requireModule("./config.js")
	};
	let soajs_subtenant = {
		"meta": soajs.meta,
		"registry": soajs.registry,
		"log": soajs.log,
		"config": soajs.config,
		"tenant": {
			"type": "client",
			"main": {
				"code": "TES0",
				"id": "5c0e74ba9acc3c5a84a51259"
			},
			"code": "TES1",
			"id": "5c0e74ba9acc3c5a84a5125a"
		}
	};
	
	before((done) => {
		modelUserObj = new Model(soajs);
		done();
	});
	
	it("test - lastLogin", function (done) {
		let data = {
			"username": "owner"
		};
		BL.lastLogin(soajs, data, modelUserObj, () => {
			done();
		});
	});
	
	it("test - save - no data", function (done) {
		let data = {};
		BL.save(soajs, data, modelUserObj, (error) => {
			assert.ok(error);
			done();
		});
	});
	
	it("test - save - with data", function (done) {
		let user = {
			"firstName": "antoine",
			"lastName": "hage",
			"email": "antoine@soajs.org",
			"password": '',
			"username": "123456789",
			"groups": ["antoinegroup"],
			"id": "123456789",
			"accessToken": "44a5399dcce96325fadfab908e614bf00e6fe967",
			"refreshToken": "ddfd5eb42417b480471b4cec06381244658ffc7a"
		};
		let data = {"user": user, "mode": "facebook"};
		BL.save(soajs, data, modelUserObj, (error, record) => {
			assert.ok(record);
			done();
		});
	});
	
	
	it("test - save - with data - record exist", function (done) {
		let user = {
			"firstName": "tony",
			"lastName": "hage",
			"email": "antoine@soajs.org",
			"password": '',
			"username": "123456789",
			"groups": ["tonygroup"],
			"id": "123456789",
			"accessToken": "44a5399dcce96325fadfab908e614bf00e6fe967",
			"refreshToken": "ddfd5eb42417b480471b4cec06381244658ffc7a"
		};
		let data = {"user": user, "mode": "facebook"};
		BL.save(soajs, data, modelUserObj, (error, record) => {
			assert.equal(record.firstName, "tony");
			assert.ok(record);
			done();
		});
	});
	
	it("test - save - with data - record exist", function (done) {
		let user = {
			"firstName": "tony2",
			"lastName": "hage",
			"email": "antoine@soajs.org",
			"password": '',
			"username": "123456789",
			"groups": ["tony2group"],
			"id": "123456789",
			"accessToken": "44a5399dcce96325fadfab908e614bf00e6fe967",
			"refreshToken": "ddfd5eb42417b480471b4cec06381244658ffc7a"
		};
		let data = {"user": user, "mode": "facebook"};
		BL.save(soajs_subtenant, data, modelUserObj, (error, record) => {
			assert.equal(record.firstName, "tony2");
			assert.ok(record);
			done();
		});
	});
	
	it("test - save - with data - subtenant", function (done) {
		let user = {
			"firstName": "mateo",
			"lastName": "hage",
			"email": "mateo@soajs.org",
			"password": '',
			"username": "22222222",
			"groups": ["mateogroup"],
			"id": "22222222",
			"accessToken": "44a5399dcce96325fadfab908e614bf00e6fe967",
			"refreshToken": "ddfd5eb42417b480471b4cec06381244658ffc7a"
		};
		let data = {"user": user, "mode": "facebook"};
		BL.save(soajs_subtenant, data, modelUserObj, (error, record) => {
			assert.equal(record.firstName, "mateo");
			assert.equal(record.config.allowedTenants[0].tenant.id, "5c0e74ba9acc3c5a84a5125a");
			assert.ok(record);
			done();
		});
	});
	
	it("test - save - with data - same subtenant", function (done) {
		let user = {
			"firstName": "mateo2",
			"lastName": "hage",
			"email": "mateo@soajs.org",
			"password": '',
			"username": "22222222",
			"groups": ["mateo2group"],
			"id": "22222222",
			"accessToken": "44a5399dcce96325fadfab908e614bf00e6fe967",
			"refreshToken": "ddfd5eb42417b480471b4cec06381244658ffc7a"
		};
		soajs_subtenant.tenant.id = "4444444444444444";
		soajs_subtenant.tenant.code = "CCCC";
		
		let data = {"user": user, "mode": "facebook"};
		BL.save(soajs_subtenant, data, modelUserObj, (error, record) => {
			assert.equal(record.firstName, "mateo2");
			assert.equal(record.config.allowedTenants.length, 2);
			assert.ok(record);
			done();
		});
	});
	
	it("test - find - username", function (done) {
		let data = {
			"username": "owner"
		};
		BL.find(soajs, data, modelUserObj, (error, record) => {
			assert.equal(record.email, "me@localhost.com");
			done();
		});
	});
	it("test - find - email", function (done) {
		let data = {
			"email": "me@localhost.com"
		};
		BL.find(soajs, data, modelUserObj, (error, record) => {
			assert.equal(record.username, "owner");
			done();
		});
	});
	it("test - find - pin", function (done) {
		let data = {
			"pin": "1235",
			"tId": "5c0e74ba9acc3c5a84a51259"
		};
		BL.find(soajs, data, modelUserObj, (error, record) => {
			assert.equal(record.username, "owner");
			_id = record._id;
			done();
		});
	});
	it("test - find - id", function (done) {
		let data = {
			"id": _id
		};
		BL.find(soajs, data, modelUserObj, (error, record) => {
			assert.equal(record.username, "owner");
			userRecord = record;
			done();
		});
	});
	it("test - assureConfig", function (done) {
		userRecord.groupsConfig = [
			{
				config: {
					allowedPackages: {
						BBBBB: [
							"BBBBB_OWNER"
						]
					}
				}
			},
			{
				config: {
					allowedPackages: {
						BBBBB: [
							"BBBBB_OWNER2",
							"BBBBB_OWNER3"
						]
					}
				}
			},
			{
				config: {
					allowedPackages: {
						AAAAA: [
							"AAAAA_OWNER"
						]
					}
				}
			}
		];
		BL.assureConfig(userRecord, (error, userRecord) => {
			assert.deepEqual(userRecord.groupsConfig.allowedPackages.BBBBB, ['BBBBB_OWNER', 'BBBBB_OWNER2', 'BBBBB_OWNER3']);
			assert.deepEqual(userRecord.groupsConfig.allowedPackages.AAAAA, ["AAAAA_OWNER"]);
			done();
		});
	});
	
	after((done) => {
		modelUserObj.closeConnection();
		done();
	});
});
