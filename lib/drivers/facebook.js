"use strict";

var lib = {
	/**
	 * Initialize facebook strategy
	 *
	 * @param {Request Object} req
	 * @param {Callback(error object, authentication data object) Function} cb
	 */
	"init": function (req, cb) {
		var mode = req.soajs.inputmaskData.strategy;
		var data = {
			strategy: require('passport-facebook').Strategy,
			authentication: 'facebook',
			configAuth: {
				clientID: req.soajs.servicesConfig.urac.passportLogin[mode].clientID,
				clientSecret: req.soajs.servicesConfig.urac.passportLogin[mode].clientSecret.trim(),
				callbackURL: req.soajs.servicesConfig.urac.passportLogin[mode].callbackURL,
				scope: 'email',
				profileFields: ['id', 'email', 'name']
			}
		};
		return cb(null, data);
	},
	
	/**
	 * Map facebook user returned from API to SOAJS profile correspondingly
	 *
	 * @param {User Object} user
	 * @param {Callback(error object, profile object) Function} cb
	 */
	"mapProfile": function (user, cb) {
		var profile = {
			firstName: user.profile._json.first_name,
			lastName: user.profile._json.last_name,
			email: user.profile._json.email,
			password: '',
			username: user.profile.id,
			id: user.profile.id
		};
		return cb(null, profile);
	},
	
	/**
	 * Update the request object before authenticating (inapplicable for facebook)
	 *
	 * @param {Request Object} req
	 * @param {Callback(error) Function} cb
	 */
	"preAuthenticate": function (req, cb) {
		return cb(null);
	},
	
	/**
	 * Custom update passport configuration before authenticating (inapplicable for facebook)
	 *
	 * @param {Configuration Object} config
	 * @param {Callback(error object, config updated) Function} cb
	 */
	"updateConfig": function (config, cb) {
		return cb(null, config);
	}
};

module.exports = lib;