"use strict";

var lib = {
	/**
	 * Initialize Google strategy
	 *
	 * @param {Request Object} req
	 * @param {Callback(error object, authentication data object) Function} cb
	 */
	"init": function (req, cb) {
		var mode = req.soajs.inputmaskData.strategy;
		var data = {
			strategy: require('passport-google-oauth').OAuth2Strategy, // OAuthStrategy, OAuth2Strategy
			authentication: 'google',
			configAuth: {
				clientID: req.soajs.servicesConfig.urac.passportLogin[mode].clientID,
				clientSecret: req.soajs.servicesConfig.urac.passportLogin[mode].clientSecret.trim(),
				callbackURL: req.soajs.servicesConfig.urac.passportLogin[mode].callbackURL,
				accessType: 'offline',
				// approvalPrompt: 'force',
				scope: 'email'
			}
		};
		return cb(null, data);
	},
	
	/**
	 * Map Google user returned from API to SOAJS profile correspondingly
	 *
	 * @param {User Object} user
	 * @param {Callback(error object, profile object) Function} cb
	 */
	"mapProfile": function (user, cb) {
		var email = '';
		if (user.profile.emails && user.profile.emails.length !== 0) {
			email = user.profile.emails[0].value;
		}
		var profile = {
			firstName: user.profile.name.givenName,
			lastName: user.profile.name.familyName,
			email: email,
			password: '',
			username: user.profile.id,
			id: user.profile.id
		};
		return cb(null, profile);
	},
	
	/**
	 * Update the request object before authenticating (inapplicable for Google)
	 *
	 * @param {Request Object} req
	 * @param {Callback(error) Function} cb
	 */
	"preAuthenticate": function (req, cb) {
		return cb(null);
	},
	
	/**
	 * Custom update passport configuration before authenticating
	 *
	 * @param {Configuration Object} config
	 * @param {Callback(error object, config updated) Function} cb
	 */
	"updateConfig": function (config, cb) {
		config.scope = 'email'; // request email information
		config.accessType = 'offline';
		
		return cb(null, config);
	}
};

module.exports = lib;