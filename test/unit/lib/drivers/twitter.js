"use strict";

const helper = require("../../../helper.js");
const driver = helper.requireModule('./lib/drivers/twitter.js');
const assert = require('assert');

describe("Unit test for: driver - twitter", function () {
    let req = {
        "session": {},
        "soajs": {
            "inputmaskData": {
                "strategy": "twitter",
                "oauth_token": "TTTTT",
                "oauth_verifier": "VVVVV"
            },
            "servicesConfig": {
                "urac": {
                    "passportLogin": {
                        "twitter": {
                            "clientID": "qywH8YMduIsKA2RRlUkS50kCZ",
                            "clientSecret": "aodnXVCBijQcS8sJrcLM3ULgCl9VEoqqwu00XgamRUv5qm8bF1",
                            "callbackURL": "http://local-widget.com/urac/login/success",
                            "userProfileURL": "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true"
                        }
                    }
                }
            }
        }
    };
    it("test - init", function (done) {
        driver.init(req, (error, data) => {
            assert.ok(data);
            done();
        });
    });
    it("test - mapProfile", function (done) {
        let user = {
            "profile": {
                "displayName": "antoine",
                "username": "ahage",
                "id": "123456789"
            }
        };
        driver.mapProfile(user, (error, profile) => {
            assert.ok(profile);
            assert.equal(profile.email, "ahage@twitter.com");
            done();
        });
    });
    it("test - preAuthenticate", function (done) {
        driver.preAuthenticate(req, (error) => {
            assert.equal(req.session['oauth:twitter'].oauth_token, "TTTTT");
            done();
        });
    });
    it("test - updateConfig", function (done) {
        driver.updateConfig({"conf": "1"}, (error, config) => {
            assert.equal(config.conf, "1");
            done();
        });
    });
});