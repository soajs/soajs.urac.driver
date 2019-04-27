"use strict";

let lib = {
    /**
     * Initialize Google strategy

     identityMetadata: 'https://login.microsoftonline.com/' + test_parameters.tenantID + '/.well-known/openid-configuration',
     clientID: test_parameters.clientID,
     validateIssuer: true,
     issuer: ['https://sts.windows.net/' + test_parameters.tenantID + '/'],
     passReqToCallback: false,

     responseType: 'code id_token',
     responseMode: 'form_post',
     redirectUrl: 'http://localhost:3000/auth/openid/return',
     allowHttpForRedirectUrl: true,
     clientSecret: test_parameters.clientSecret,
     scope: null,
     loggingLevel: null,
     nonceLifetime: null,

     */
    "init": function (req, cb) {
        let mode = req.soajs.inputmaskData.strategy;
        let data = {
            strategy: require('passport-azure-ad').BearerStrategy, // BearerStrategy, OIDCStrategy
            authentication: 'azure',
            configAuth: {
                // Required
                // 'https://login.microsoftonline.com/<your_tenant_name>.onmicrosoft.com/v2.0/.well-known/openid-configuration',
                // or 'https://login.microsoftonline.com/<your_tenant_guid>/v2.0/.well-known/openid-configuration'
                // or you can use the common endpoint
                // 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration'
                identityMetadata: req.soajs.servicesConfig.urac.passportLogin[mode].identityMetadata,

                // Required
                clientID: req.soajs.servicesConfig.urac.passportLogin[mode].clientID,

                // Required.
                // If you are using the common endpoint, you should either set `validateIssuer` to false, or provide a value for `issuer`.
                validateIssuer: req.soajs.servicesConfig.urac.passportLogin[mode].validateIssuer || true,

                // Required if you are using common endpoint and setting `validateIssuer` to true.
                // For tenant-specific endpoint, this field is optional, we will use the issuer from the metadata by default.
                issuer: req.soajs.servicesConfig.urac.passportLogin[mode].issuer || null,

                // Required.
                // Set to true if you use `function(req, token, done)` as the verify callback.
                // Set to false if you use `function(req, token)` as the verify callback.
                passReqToCallback: req.soajs.servicesConfig.urac.passportLogin[mode].passReqToCallback || true,

                // Optional, default value is clientID
                audience: req.soajs.servicesConfig.urac.passportLogin[mode].audience || null,

                // Optional. Default value is false.
                // Set to true if you accept access_token whose `aud` claim contains multiple values.
                allowMultiAudiencesInToken: req.soajs.servicesConfig.urac.passportLogin[mode].allowMultiAudiencesInToken || false,

                // Optional. 'error', 'warn' or 'info'
                loggingLevel: req.soajs.servicesConfig.urac.passportLogin[mode].loggingLevel || 'info',

            }
        };

        // Required to be true to use B2C
        if (req.soajs.servicesConfig.urac.passportLogin[mode].isB2C)
            data.configAuth.isB2C = req.soajs.servicesConfig.urac.passportLogin[mode].isB2C;

        // Required to use B2C
        if (req.soajs.servicesConfig.urac.passportLogin[mode].policyName)
            data.configAuth.policyName = req.soajs.servicesConfig.urac.passportLogin[mode].policyName;

        // Optional.
        if (req.soajs.servicesConfig.urac.passportLogin[mode].loggingNoPII)
            data.configAuth.loggingNoPII = req.soajs.servicesConfig.urac.passportLogin[mode].loggingNoPII;

        // Optional.
        if (req.soajs.servicesConfig.urac.passportLogin[mode].clockSkew)
            data.configAuth.clockSkew = req.soajs.servicesConfig.urac.passportLogin[mode].clockSkew;

        // Optional.
        if (req.soajs.servicesConfig.urac.passportLogin[mode].scope)
            data.configAuth.scope = req.soajs.servicesConfig.urac.passportLogin[mode].scope;


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