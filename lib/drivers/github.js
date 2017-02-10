"use strict";

var lib = {
	/**
	 * Initialize GitHub strategy
	 *
	 * @param {Request Object} req
	 * @param {Callback(error object, authentication data object) Function} cb
	 */
	"init": function (req, cb) {
		var mode = req.soajs.inputmaskData.strategy;
		var data = {
			strategy: require('passport-github').Strategy,
			authentication: 'github',
			configAuth: {
				clientID: req.soajs.servicesConfig.urac.passportLogin[mode].clientID,
				clientSecret: req.soajs.servicesConfig.urac.passportLogin[mode].clientSecret.trim(),
				callbackURL: req.soajs.servicesConfig.urac.passportLogin[mode].callbackURL
			}
		};
		return cb(null, data);
	},
	
	/**
	 * Map Github user returned from API to SOAJS profile correspondingly
	 *
	 * @param {User Object} user
	 * @param {Callback(error object, profile object) Function} cb
	 */
	"mapProfile": function (user, cb) {
		var profile = {
			firstName: user.profile.username,
			lastName: '',
			email: user.profile.username + '@github.com',
			password: '',
			username: user.profile.username + '_' + user.profile.id,
			id: user.profile.id
		};
		return cb(null, profile);
	},
	
	/**
	 * Update the request object before authenticating (inapplicable for Github)
	 *
	 * @param {Request Object} req
	 * @param {Callback(error) Function} cb
	 */
	"preAuthenticate": function (req, cb) {
		return cb(null);
	},
	
	/**
	 * Custom update passport configuration before authenticating (inapplicable for Github)
	 *
	 * @param {Configuration Object} config
	 * @param {Callback(error object, config updated) Function} cb
	 */
	"updateConfig": function (config, cb) {
		return cb(null, config);
	}
};

module.exports = lib;