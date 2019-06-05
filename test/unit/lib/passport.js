"use strict";
const coreModules = require("soajs.core.modules");
const core = coreModules.core;
const helper = require("../../helper.js");
const BL = helper.requireModule('./lib/passport.js');
const assert = require('assert');

describe("Unit test for: lib - passport", function () {
    let req = {
        "soajs": {
            "inputmaskData": {
                "strategy": "facebook"
            },
            "servicesConfig": {
                "urac": {
                    "passportLogin": {
                        "facebook": {
                            "clientID": "331502413866510",
                            "clientSecret": "1a07a7eb9c9884dc5d148106ede830b2",
                            "callbackURL": "http://local-widget.com/urac/login/success?mode=facebook"
                        }
                    }
                }
            },
            "config": helper.requireModule("./config.js")
        }
    };
    let res = {};

    it("test - getDriver - error", function (done) {
        req.soajs.inputmaskData.strategy = "wrongdriver";
        BL.getDriver(req, true, function (error, driver) {
            assert.ok(error.code, "410");
            done();
        });
    });
    it("test - getDriver", function (done) {
        req.soajs.inputmaskData.strategy = "facebook";
        BL.getDriver(req, true, function (error, driver) {
            assert.ok(driver);
            done();
        });
    });
    it("test - init - error strategy", function (done) {
        req.soajs.inputmaskData.strategy = "wrongdriver";
        BL.init(req, function (error, passport) {
            assert.ok(error.code, "410");
            done();
        });
    });
    it("test - init - error servicesConfig", function (done) {
        req.soajs.inputmaskData.strategy = "facebook";
        req.soajs.servicesConfig.urac.passportLogin = {};
        BL.init(req, function (error, passport) {
            assert.ok(error.code, "410");
            done();
        });
    });
    it("test - init", function (done) {
        req.soajs.inputmaskData.strategy = "facebook";
        req.soajs.servicesConfig.urac.passportLogin = {
            "facebook": {
                "clientID": "331502413866510",
                "clientSecret": "1a07a7eb9c9884dc5d148106ede830b2",
                "callbackURL": "http://local-widget.com/urac/login/success?mode=facebook"
            }
        };
        BL.init(req, function (error, passport) {
            assert.ok(passport);
            done();
        });
    });
    it("test - initAuth - error", function (done) {
        req.soajs.inputmaskData.strategy = "wrongdriver";
        let passport = {
            "authenticate": (authentication, config) => {
                return (req, res) => {
                    done();
                };
            }
        };
        BL.initAuth(req, res, passport, function (error) {
            assert.ok(error.code, "410");
            done();
        });
    });
    it("test - initAuth", function (done) {
        req.soajs.inputmaskData.strategy = "facebook";
        let passport = {
            "authenticate": (authentication, config) => {
                return (req, res) => {
                    done();
                };
            }
        };
        BL.initAuth(req, res, passport, function (error) {
            done();
        });
    });

});