"use strict";

const helper = require("../../../helper.js");
const driver = helper.requireModule('./lib/drivers/openam.js');
const assert = require('assert');

describe("Unit test for: driver - openam", function () {

    it("test - mapProfile", function (done) {
        let user = {
            userRecord: {
                attributes: [
                    {name: 'sAMAccountName', values: ['test']},
                    {name: 'mail', values: ['antoine@soajs.org']},
                    {name: 'givenname', values: ['test']},
                    {name: 'sn', values: ['test']}
                ]
            },
            attributesMap: [
                {field: 'sAMAccountName', mapTo: 'id'},
                {field: 'sAMAccountName', mapTo: 'username'},
                {field: 'mail', mapTo: 'email'},
                {field: 'givenname', mapTo: 'firstName'},
                {field: 'sn', mapTo: 'lastName'}
            ]
        };
        driver.mapProfile(user, (error, profile) => {
            assert.ok(profile);
            assert.equal(profile.email, "antoine@soajs.org");
            done();
        });
    });
});