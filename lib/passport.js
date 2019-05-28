'use strict';
const fs = require("fs");

let main = {
    /**
     * Return the driver based on the strategy requested
     *
     */
    "getDriver": function (req, check, cb) {
        let mode = req.soajs.inputmaskData.strategy;
        let filePath = __dirname + "/drivers/" + mode + ".js";

        function returnDriver() {
            let driver = require(filePath);
            return cb(null, driver);
        }

        if (check) {
            fs.exists(filePath, function (exists) {
                if (!exists) {
                    return cb({"code": 410, "msg": soajs.config.errors[410]});
                }
                returnDriver();
            });
        }
        else {
            returnDriver();
        }
    },

    /**
     * Initialize passport based on the strategy requested
     *
     */
    "init": function (req, cb) {
        let passport = require("passport");
        let authentication = req.soajs.inputmaskData.strategy;
        main.getDriver(req, true, function (err, driver) {
            if (err) {
                return cb(err);
            }
            if (!req.soajs.servicesConfig || !req.soajs.servicesConfig.urac || !req.soajs.servicesConfig.urac.passportLogin || !req.soajs.servicesConfig.urac.passportLogin[authentication]) {
                return cb({"code": 420, "msg": soajs.config.errors[420]});
            }
            driver.init(req, function (error, data) {
                // now we have the strategy, configuration , and authentication method defined
                let myStrategy = new data.strategy(data.configAuth, function () {//(accessToken, refreshToken, profile, done) {
                    let accessToken = null;
                    let refreshToken = null;
                    let profile = null;
                    let done = arguments[arguments.length - 1];
                    switch (arguments.length) {
                        //controller, cb
                        case 2:
                            accessToken = arguments[0];
                            break;
                        case 3:
                            accessToken = arguments[0];
                            refreshToken = arguments[1];
                            break;
                        case 4:
                            accessToken = arguments[0];
                            refreshToken = arguments[1];
                            profile = arguments[1];
                            break;
                    }
                    done(null, {"profile": profile, "refreshToken": refreshToken, "accessToken": accessToken});
                });
                passport.use(myStrategy);
                return cb(null, passport);
            });
        });

    },

    /**
     * Authenticate through passport
     *
     */
    "initAuth": function (req, res, passport) {
        let authentication = req.soajs.inputmaskData.strategy;
        if (authentication === "azure")
            authentication = 'oauth-bearer';

        let config = {session: false};
        main.getDriver(req, false, function (err, driver) {
            if (err) {
                return cb(err);
            }
            driver.updateConfig(config, function (error, config) {
                passport.authenticate(authentication, config)(req, res);
            });
        });
    }
};

module.exports = main;