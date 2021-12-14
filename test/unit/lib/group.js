"use strict";
const coreModules = require("soajs.core.modules");
const core = coreModules.core;
const helper = require("../../helper.js");
const BL = helper.requireModule('./lib/group.js');
const Model = helper.requireModule('./model/mongo/group.js');
const assert = require('assert');

describe("Unit test for: lib - user", function () {
	
	let modelGroupObj = null;
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
	
	before((done) => {
		modelGroupObj = new Model(soajs);
		done();
	});
	
	it("test - find - error", function (done) {
		let data = {};
		BL.find(soajs, data, modelGroupObj, (error) => {
			assert.ok(error);
			done();
		});
	});
	it("test - find - data", function (done) {
		let data = {
			"groups": ["owner"]
		};
		BL.find(soajs, data, modelGroupObj, (error, record) => {
			assert.equal(record[0].code, "owner");
			done();
		});
	});
	
	after((done) => {
		modelGroupObj.closeConnection();
		done();
	});
});
