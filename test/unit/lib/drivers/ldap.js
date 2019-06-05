"use strict";

const helper = require("../../../helper.js");
const driver = helper.requireModule('./lib/drivers/ldap.js');
const assert = require('assert');

describe("Unit test for: driver - ldap", function () {

    it("test - mapProfile", function (done) {
        let user = {
            "dn": "123456789",
            "cn": "tony",
            "sn": "hage",
            "mail": "antoine@soajs.org",
            "id": "123456789"
        };
        driver.mapProfile(user, (error, profile) => {
            assert.ok(profile);
            assert.equal(profile.email, "antoine@soajs.org");
            done();
        });
    });
});