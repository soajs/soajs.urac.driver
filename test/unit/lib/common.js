"use strict";
const helper = require("../../helper.js");
const BL = helper.requireModule('./lib/common.js');
const assert = require('assert');

describe("Unit test for: lib - common", function () {
/*
    it("test - aclEnvObj - no acl", function (done) {
        let aclObj = {};
        let response = BL.aclEnvObj(aclObj);
        assert.equal(response, false);
        done();
    });
    it("test - aclEnvObj - with acl", function (done) {
        let aclObj = {
            "delete": {}
        };
        let response = BL.aclEnvObj(aclObj);
        done();
    });
*/
    it("test - comparePasswd", function (done) {
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

        BL.comparePasswd(servicesConfig, pwd, cypher, config, function (error, result) {
            assert.equal(result, false);
            done();
        });
    });
    it("test - checkUserTenantAccess - main tenant", function (done) {
        let record = {
            tenant: {
                id: "5c0e74ba9acc3c5a84a51259",
                code: "TES0",
                pin: {
                    code: "1235",
                    allowed: true
                }
            },
            groups: [
                "owner", "devop"
            ],
            config: {
                allowedTenants: [
                    {
                        tenant: {
                            id: "THYME_tID",
                            code: "THYME_CODE",
                            pin: {
                                code: "5678",
                                allowed: true
                            }
                        },
                        groups: [
                            "waiter"
                        ]
                    },
                    {
                        tenant: {
                            id: "ELVIRA_tID",
                            code: "ELVIRA_CODE"
                        },
                        groups: [
                            "manager"
                        ]
                    }
                ]
            }
        };
        let tenantObj = {
            id: "5c0e74ba9acc3c5a84a51259"
        };
        let response = BL.checkUserTenantAccess(record, tenantObj);
        assert.equal(response.tenant.id, "5c0e74ba9acc3c5a84a51259");
        done();
    });
    it("test - checkUserTenantAccess - sub tenant", function (done) {
        let record = {
            tenant: {
                id: "5c0e74ba9acc3c5a84a51259",
                code: "TES0",
                pin: {
                    code: "1235",
                    allowed: true
                }
            },
            groups: [
                "owner", "devop"
            ],
            config: {
                allowedTenants: [
                    {
                        tenant: {
                            id: "THYME_tID",
                            code: "THYME_CODE",
                            pin: {
                                code: "5678",
                                allowed: true
                            }
                        },
                        groups: [
                            "waiter"
                        ]
                    },
                    {
                        tenant: {
                            id: "ELVIRA_tID",
                            code: "ELVIRA_CODE"
                        },
                        groups: [
                            "manager"
                        ]
                    }
                ]
            }
        };
        let tenantObj = {
            id: "THYME_tID"
        };
        let response = BL.checkUserTenantAccess(record, tenantObj);
        assert.equal(response.tenant.id, "THYME_tID");
        done();
    });

});