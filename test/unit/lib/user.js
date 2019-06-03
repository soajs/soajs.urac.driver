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
            "profile": {
                "_json":
                    {
                        "first_name": "antoine",
                        "last_name": "hage",
                        "email": "antoine@soajs.org"
                    },
                "id": "123456789"
            },
            "accessToken":"44a5399dcce96325fadfab908e614bf00e6fe967",
            "refreshToken":"ddfd5eb42417b480471b4cec06381244658ffc7a"
        };
        let data = {"user": user, "mode": "facebook"};
        BL.save(soajs, data, modelUserObj, (error, record) => {
            assert.ok(record);
            done();
        });
    });


    it("test - save - with data", function (done) {
        let user = {
            "profile": {
                "_json":
                    {
                        "first_name": "antoine",
                        "last_name": "hage",
                        "email": "antoine@soajs.org"
                    },
                "id": "123456789"
            },
            "accessToken":"44a5399dcce96325fadfab908e614bf00e6fe967",
            "refreshToken":"ddfd5eb42417b480471b4cec06381244658ffc7a"
        };
        let data = {"user": user, "mode": "facebook"};
        BL.save(soajs, data, modelUserObj, (error, record) => {
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
            "pin": "1235"
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
                        AAAAA: [
                            "AAAAA_OWNER"
                        ]
                    }
                },
            }
        ];
        BL.assureConfig(userRecord);
        assert.equal(userRecord.groupsConfig.allowedPackages.BBBBB, "BBBBB_OWNER");
        done();
    });

    after((done) => {
        modelUserObj.closeConnection();
        done();
    });
});