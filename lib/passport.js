'use strict';
const fs = require("fs");
const passport = require("passport");

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
					return cb({"code": 427, "msg": req.soajs.config.errors[427]});
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
		let authentication = req.soajs.inputmaskData.strategy;
		main.getDriver(req, true, function (err, driver) {
			if (err) {
				return cb(err);
			}
			if (!req.soajs.servicesConfig || !req.soajs.servicesConfig.urac.passportLogin[authentication]) {
				return cb({"code": 399, "msg": req.soajs.config.errors[399]});
			}
			driver.init(req, function (error, data) {
				// now we have the strategy, configuration , and authentication method defined
				let myStrategy = new data.strategy(data.configAuth, function (accessToken, refreshToken, profile, done) {
						return done(null, {"profile": profile, "refreshToken": refreshToken, "accessToken": accessToken});
					}
				);
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
		let config = {session: false};
		main.getDriver(req, false, function (err, driver) {
			driver.updateConfig(config, function (error, config) {
				passport.authenticate(authentication, config)(req, res);
			});
		});
	}
};

module.exports = main;