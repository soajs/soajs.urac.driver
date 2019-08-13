"use strict";

const coreModules = require("soajs.core.modules");
const core = coreModules.core;
const helper = require("../../../helper.js");
const Model = helper.requireModule('./model/mongo/user.js');
const assert = require('assert');

describe("Unit test for: model - user", function () {
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
        }
    };
    let socialRecord = null;
    let modelObj = null;

    it("Constructor - with tenant - open connection", function (done) {
        modelObj = new Model(soajs);
        done();
    });
    it("test - validateId", function (done) {
        modelObj.validateId({"id": "5c8d0c505653de3985aa0ffe"}, (error, id) => {
            assert.equal(id, "5c8d0c505653de3985aa0ffe");
            done();
        });
    });
    it("test - lastLogin", function (done) {
        modelObj.lastLogin({"username": "owner", "lastLogin": new Date().getTime()}, (error, record) => {
            assert.equal(record, 1);
            done();
        });
    });
    it("test - lastLogin - error", function (done) {
        modelObj.lastLogin({}, (error, record) => {
            assert.ok(error);
            done();
        });
    });

    it("test - insertSocialNetworkUser", function (done) {
        modelObj.insertSocialNetworkUser({
            "username": "social",
            "firstName": "mathieu",
            "email": "me@social.com",
            "socialId": {"facebook": {"id": 123456}}
        }, (error, record) => {
            assert.ok(record);
            done();
        });
    });
    it("test - insertSocialNetworkUser - error", function (done) {
        modelObj.insertSocialNetworkUser({"username": "owner"}, (error, record) => {
            assert.ok(error);
            done();
        });
    });
    it("test - getSocialNetworkUser", function (done) {
        modelObj.getSocialNetworkUser({
            "mode": "facebook",
            "id": 123456
        }, (error, record) => {
            socialRecord = record;
            assert.equal(record.username, "social");
            done();
        });
    });
    it("test - updateSocialNetworkUser", function (done) {
        socialRecord.firstName = "mateo";
        modelObj.updateSocialNetworkUser(socialRecord, (error, record) => {
            assert.ok(record);
            done();
        });
    });
    it("test - getSocialNetworkUser - email", function (done) {
        modelObj.getSocialNetworkUser({
            "mode": "facebook",
            "id": 123456,
            "email": "me@social.com"
        }, (error, record) => {
            assert.equal(record.username, "social");
            done();
        });
    });
    it("test - getSocialNetworkUser - error", function (done) {
        modelObj.getSocialNetworkUser({"username": "owner"}, (error, record) => {
            assert.ok(error);
            done();
        });
    });

    it("test - getUserByEmail", function (done) {
        modelObj.getUserByEmail({"email": "me@localhost.com"}, (error, record) => {
            assert.equal(record.username, "owner");
            done();
        });
    });
    it("test - getUserByEmail - error", function (done) {
        modelObj.getUserByEmail({}, (error, record) => {
            assert.ok(error);
            done();
        });
    });
    it("test - getUserByUsernameOrId", function (done) {
        modelObj.getUserByUsernameOrId({"username": "owner"}, (error, record) => {
            assert.equal(record.username, "owner");
            done();
        });
    });
    it("test - getUserByUsernameOrId - error", function (done) {
        modelObj.getUserByUsernameOrId({}, (error, record) => {
            assert.ok(error);
            done();
        });
    });
    it("test - getUserByPin", function (done) {
        modelObj.getUserByPin({"pin": "1235", "tId": "5c0e74ba9acc3c5a84a51259"}, (error, record) => {
            assert.equal(record.username, "owner");
            done();
        });
    });
    it("test - getUserByPin - error", function (done) {
        modelObj.getUserByPin({}, (error, record) => {
            assert.ok(error);
            done();
        });
    });
    it("Constructor - with tenant - close connection", function (done) {
        modelObj.closeConnection();
        done();
    });


    it("Constructor - with sub tenant - open connection", function (done) {
        soajs.tenant.main = {
            "code": "TES1",
            "id": "5c0e74ba9acc3c5a84a51251"
        };
        modelObj = new Model(soajs);
        done();
    });

    it("Constructor - with sub tenant - close connection", function (done) {
        modelObj.closeConnection();
        done();
    });

    it("Constructor - with roaming - open connection", function (done) {
        delete soajs.tenant.main;
        soajs.tenant.roaming = {
            "code": "TES2",
            "id": "5c0e74ba9acc3c5a84a51252",
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
        };
        modelObj = new Model(soajs);
        done();
    });

    it("Constructor - with roaming - close connection", function (done) {
        modelObj.closeConnection();
        done();
    });
});