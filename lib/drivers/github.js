"use strict";

let lib = {
    /**
     * Initialize GitHub strategy
     *
     */
    "init": function (req, cb) {
        let mode = req.soajs.inputmaskData.strategy;
        let data = {
            strategy: require('passport-github').Strategy,
            authentication: 'github',
            configAuth: {
                clientID: req.soajs.servicesConfig.passportLogin[mode].clientID,
                clientSecret: req.soajs.servicesConfig.passportLogin[mode].clientSecret.trim(),
                callbackURL: req.soajs.servicesConfig.passportLogin[mode].callbackURL
            }
        };
        return cb(null, data);
    },

    /**
     * Map Github user returned from API to SOAJS profile correspondingly
     *
     */
    "mapProfile": function (user, cb) {
        let profile = {
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
     */
    "preAuthenticate": function (req, cb) {
        return cb(null);
    },

    /**
     * Custom update passport configuration before authenticating (inapplicable for Github)
     *
     */
    "updateConfig": function (config, cb) {
        return cb(null, config);
    }
};

module.exports = lib;