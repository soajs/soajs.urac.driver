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

	describe("social login email linking", function () {
		let calls = null;
		let bySocialId = null;
		let byEmail = null;
		let stubModel = {
			"getSocialNetworkUser": (data, cb) => {
				calls.push({ "op": "getSocialNetworkUser", data });
				if (data.email && byEmail) {
					return cb(null, JSON.parse(JSON.stringify(byEmail)));
				}
				return cb(null, bySocialId ? JSON.parse(JSON.stringify(bySocialId)) : null);
			},
			"getUserByEmail": (data, cb) => {
				calls.push({ "op": "getUserByEmail", data });
				return cb(null, byEmail);
			},
			"updateSocialNetworkUser": (record, cb) => {
				calls.push({ "op": "updateSocialNetworkUser", record });
				return cb(null, 1);
			},
			"insertSocialNetworkUser": (record, cb) => {
				calls.push({ "op": "insertSocialNetworkUser", record });
				return cb(null, [Object.assign({ "_id": "new_id" }, record)]);
			}
		};
		let victim = {
			"_id": "victim_id",
			"username": "victim",
			"email": "victim@example.com",
			"groups": ["owner"],
			"tenant": { "id": "5c0e74ba9acc3c5a84a51259", "code": "TES0" }
		};
		let attacker = (emailVerified) => {
			let user = {
				"firstName": "attacker",
				"lastName": "attacker",
				"email": "victim@example.com",
				"username": "attacker_google_sub_123",
				"id": "attacker_google_sub_123",
				"accessToken": "attacker_access",
				"refreshToken": "attacker_refresh"
			};
			if (emailVerified !== undefined) {
				user.emailVerified = emailVerified;
			}
			return { "user": user, "mode": "google" };
		};
		// the callback runs inside the stub, a failed assert would be swallowed, hand it to done
		let check = (done, fn) => {
			try {
				fn();
				done();
			} catch (e) {
				done(e);
			}
		};

		beforeEach(() => {
			calls = [];
			bySocialId = null;
			byEmail = null;
		});

		it("an unverified email does not take over the account that owns it", function (done) {
			byEmail = victim;
			BL.save(soajs, attacker(false), stubModel, (error, record) => {
				check(done, () => {
					assert.ok(error);
					assert.equal(error.code, 408);
					assert.equal(record, undefined);
					assert.deepStrictEqual(calls[0].data, { "id": "attacker_google_sub_123", "mode": "google" });
					assert.ok(!calls.some((c) => c.op === "updateSocialNetworkUser" || c.op === "insertSocialNetworkUser"));
				});
			});
		});

		it("an email without the verified flag is treated as unverified", function (done) {
			byEmail = victim;
			BL.save(soajs, attacker(), stubModel, (error) => {
				check(done, () => {
					assert.equal(error.code, 408);
					assert.ok(!calls.some((c) => c.op === "updateSocialNetworkUser"));
				});
			});
		});

		it("a verified email links the login to the account that owns it", function (done) {
			byEmail = victim;
			BL.save(soajs, attacker(true), stubModel, (error, record) => {
				check(done, () => {
					assert.ifError(error);
					assert.equal(calls[0].data.email, "victim@example.com");
					assert.equal(record._id, "victim_id");
					assert.equal(record.socialId.google.id, "attacker_google_sub_123");
				});
			});
		});

		it("a login already linked is found by its provider id, whatever its email", function (done) {
			bySocialId = Object.assign({}, victim, { "socialId": { "google": { "id": "attacker_google_sub_123" } } });
			BL.save(soajs, attacker(false), stubModel, (error, record) => {
				check(done, () => {
					assert.ifError(error);
					assert.equal(record._id, "victim_id");
					assert.ok(!calls.some((c) => c.op === "getUserByEmail"));
				});
			});
		});

		it("a new login with an unverified email no account uses creates its account", function (done) {
			BL.save(soajs, attacker(false), stubModel, (error, record) => {
				check(done, () => {
					assert.ifError(error);
					assert.equal(record._id, "new_id");
					assert.deepStrictEqual(calls.map((c) => c.op), ["getSocialNetworkUser", "getUserByEmail", "insertSocialNetworkUser"]);
				});
			});
		});
	});
});
