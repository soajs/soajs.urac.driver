"use strict";

let lib = {
	/**
	 * Initialize Google strategy
	 *
	 */
	"init": function (req, cb) {
        let mode = req.soajs.inputmaskData.strategy;
        let data = {
			strategy: require('passport-azure-ad').OAuth2Strategy, // OAuthStrategy, OAuth2Strategy
			authentication: 'azure',
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
	 */
	"mapProfile": function (user, cb) {
        let email = '';
		if (user.profile.emails && user.profile.emails.length !== 0) {
			email = user.profile.emails[0].value;
		}
        let profile = {
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
	 */
	"preAuthenticate": function (req, cb) {
		return cb(null);
	},
	
	/**
	 * Custom update passport configuration before authenticating
	 *
	 */
	"updateConfig": function (config, cb) {
		return cb(null, config);
	}
};

module.exports = lib;