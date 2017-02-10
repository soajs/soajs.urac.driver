"use strict";

var lib = {
	/**
	 * Initialize Twitter strategy
	 *
	 * @param {Request Object} req
	 * @param {Callback(error object, authentication data object) Function} cb
	 */
	"init": function (req, cb) {
		var mode = req.soajs.inputmaskData.strategy;
		var userProfileURL = "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true";
		if (req.soajs.servicesConfig.urac.passportLogin[mode].userProfileURL) {
			userProfileURL = req.soajs.servicesConfig.urac.passportLogin[mode].userProfileURL;
		}
		var data = {
			strategy: require('passport-twitter').Strategy,
			authentication: 'twitter',
			configAuth: {
				consumerKey: req.soajs.servicesConfig.urac.passportLogin[mode].clientID,
				consumerSecret: req.soajs.servicesConfig.urac.passportLogin[mode].clientSecret.trim(),
				callbackURL: req.soajs.servicesConfig.urac.passportLogin[mode].callbackURL,
				userProfileURL: userProfileURL,
				includeEmail: true
			}
		};
		return cb(null, data);
	},
	
	/**
	 * Map Twitter user returned from API to SOAJS profile correspondingly
	 *
	 * @param {Object} user
	 * @param {Callback(error object, profile object) Function} cb
	 */
	"mapProfile": function (user, cb) {
		var profile = {
			firstName: user.profile.displayName,
			lastName: '',
			email: user.profile.username + '@twitter.com',
			password: '',
			username: user.profile.username + '_' + user.profile.id,
			id: user.profile.id
		};
		return cb(null, profile);
	},
	
	
	/**
	 * Update the request object before authenticating
	 *
	 * @param {Request Object} req
	 * @param {Callback(error) Function} cb
	 */
	"preAuthenticate": function (req, cb) {
		if (req.soajs.inputmaskData.oauth_token && req.soajs.inputmaskData.oauth_verifier) {
			var oauth_token = req.soajs.inputmaskData.oauth_token;
			var oauth_verifier = req.soajs.inputmaskData.oauth_verifier;
			
			req.session['oauth:twitter'] = {
				'oauth_token': oauth_token,
				'oauth_token_secret': oauth_verifier
			};
		}
		else {
			req.soajs.log.error('Missing query params');
		}
		return cb(null);
	},
	
	/**
	 * Custom update passport configuration before authenticating (inapplicable for Twitter)
	 *
	 * @param {Object} config
	 * @param {Callback(error object, config updated) Function} cb
	 */
	"updateConfig": function (config, cb) {
		return cb(null, config);
	}
};

module.exports = lib;