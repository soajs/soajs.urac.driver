"use strict";

let lib = {
    /**
     * Initialize Twitter strategy
     *
     */
    "init": function (req, cb) {
        let mode = req.soajs.inputmaskData.strategy;
        let userProfileURL = "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true";
        if (req.soajs.servicesConfig.urac.passportLogin[mode].userProfileURL) {
            userProfileURL = req.soajs.servicesConfig.urac.passportLogin[mode].userProfileURL;
        }
        let data = {
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
     */
    "mapProfile": function (user, cb) {
        let profile = {
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
     */
    "preAuthenticate": function (req, cb) {
        if (req.soajs.inputmaskData.oauth_token && req.soajs.inputmaskData.oauth_verifier) {
            let oauth_token = req.soajs.inputmaskData.oauth_token;
            let oauth_verifier = req.soajs.inputmaskData.oauth_verifier;

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
     */
    "updateConfig": function (config, cb) {
        return cb(null, config);
    }
};

module.exports = lib;