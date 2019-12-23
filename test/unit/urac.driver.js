"use strict";

const coreModules = require("soajs.core.modules");
const core = coreModules.core;
const helper = require("../helper.js");
const driver = helper.requireModule('./index.js');
const assert = require('assert');

describe("Unit test for: urac.driver", function () {
    let id = null;
    let soajs = {
        "meta": core.meta,
        "tenant": {
            "code": "TES0",
            "id": "5c0e74ba9acc3c5a84a51259"
        },
        "servicesConfig": {
            "urac": {
                "model": "oracle"
            }
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
                        "bufferMaxEntries": 0
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
    it("test - loginByPin - error model", function (done) {
        soajs.servicesConfig.urac.model = "oracle";
        driver.loginByPin(soajs, {}, (error) => {
            assert.equal(error.code, "601");
            done();
        });
    });
    it("test - loginByPin - error pin", function (done) {
        soajs.servicesConfig.urac.model = "mongo";
        driver.loginByPin(soajs, {}, (error) => {
            assert.equal(error.code, "403");
            done();
        });
    });
    it("test - loginByPin - error tenant", function (done) {
        let input = {
            "pin": "1235"
        };
        soajs.tenant.id = "9999999999";
        driver.login(soajs, input, (error) => {
            assert.equal(error.code, "403");
            done();
        });
    });
    it("test - loginByPin", function (done) {
        let input = {
            "pin": "1235"
        };
        soajs.tenant.id = "5c0e74ba9acc3c5a84a51259";
        driver.loginByPin(soajs, input, (error, record) => {
            assert.equal(record.email, 'me@localhost.com');
            assert.ok(record.groupsConfig);
            done();
        });
    });
    it("test - loginByPin - sub tenant", function (done) {
        let input = {
            "pin": "5678"
        };
        soajs.tenant = {
            id: "5c0e74ba9acc3c5a84a51251",
            code: "TES1",
            main: {
                "code": "TES0",
                "id": "5c0e74ba9acc3c5a84a51259"
            }
        };
        driver.loginByPin(soajs, input, (error, record) => {
            assert.equal(record.email, 'me@localhost.com');
            assert.deepStrictEqual(record.groups, [ 'sub' ]);
            assert.ok(record.groupsConfig);
            done();
        });
    });

    it.skip("test - login - error model", function (done) {
        soajs.tenant = {
            "code": "TES0",
            "id": "5c0e74ba9acc3c5a84a51259"
        };
        soajs.servicesConfig.urac.model = "oracle";
        driver.modelInit = false;
        driver.login(soajs, {}, (error) => {
            assert.equal(error.code, "601");
            done();
        });
    });
    it("test - login - error user", function (done) {
        soajs.servicesConfig.urac.model = "mongo";
        driver.login(soajs, {}, (error) => {
            assert.equal(error.code, "403");
            done();
        });
    });
    it("test - login - error password", function (done) {
        let input = {
            "username": "owner"
        };
        driver.login(soajs, input, (error) => {
            assert.equal(error.code, "402");
            done();
        });
    });
    it("test - login", function (done) {
        let input = {
            "username": "owner",
            "password": "password"
        };
        driver.login(soajs, input, (error, record) => {
            assert.equal(record.email, 'me@localhost.com');
            done();
        });
    });
    it("test - login - wrong user", function (done) {
        let input = {
            "username": "owner1",
            "password": "password"
        };
        driver.login(soajs, input, (error, record) => {
            assert.equal(error.code, "403");
            done();
        });
    });

    it("test - getRecord - username", function (done) {
        let input = {
            "username": "owner"
        };
        driver.getRecord(soajs, input, (error, record) => {
            assert.equal(record.email, 'me@localhost.com');
            id = record._id.toString();
            done();
        });
    });
    it("test - getRecord - id", function (done) {
        let input = {
            "id": id
        };
        driver.getRecord(soajs, input, (error, record) => {
            assert.equal(record.email, 'me@localhost.com');
            done();
        });
    });
    it("test - getRecord - id error", function (done) {
        let input = {
            "id": "777777777"
        };
        driver.getRecord(soajs, input, (error, record) => {
            assert.equal(error.code, "404");
            done();
        });
    });
    it("test - getRecord - error tenant", function (done) {
        let input = {
            "id": id
        };
        soajs.tenant.id = "9999999999";
        driver.getRecord(soajs, input, (error) => {
            assert.equal(error.code, "403");
            done();
        });
    });

    it("test - save user", function (done) {
        let user = {
            "firstName": "antoine",
            "lastName": "hage",
            "email": "antoine@soajs.org",
            "password": '',
            "username": "123456789",
            "id": "123456789",
            "accessToken":"44a5399dcce96325fadfab908e614bf00e6fe967",
            "refreshToken":"ddfd5eb42417b480471b4cec06381244658ffc7a"
        };
        let input = {"user": user, "mode": "facebook"};

        driver.saveUser(soajs, input, (error, response) => {
            assert.equal(response.username, "123456789");
            done();
        });
    });
});