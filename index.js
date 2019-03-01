"use strict";
var soajsValidator = require("soajs.core.modules/soajs.core").validator;

var driverConfig = require('./config.js');
var fs = require("fs");
var merge = require('merge');
var ActiveDirectory = require('activedirectory');

var passportLib = require('./lib/passport.js');

var request = require('request');

/**
 * Initialize the Business Logic model
 * @param {SOAJS Object} soajs
 * @param {Callback Function} cb
 */
function initBLModel(soajs, cb) {
    var modelName = driverConfig.model;
    if (soajs.servicesConfig && soajs.servicesConfig.model) {
        modelName = soajs.servicesConfig.model;
    }
    if (process.env.SOAJS_TEST && soajs.inputmaskData && soajs.inputmaskData.model) {
        modelName = soajs.inputmaskData.model;
    }

    var modelPath = __dirname + "/model/" + modelName + ".js";
    return requireModel(modelPath, cb);

    /**
     * checks if model file exists, requires it and returns it.
     * @param filePath
     * @param cb
     */
    function requireModel(filePath, cb) {
        //check if file exist. if not return error
        fs.exists(filePath, function (exists) {
            if (!exists) {
                soajs.log.error('Requested Model Not Found!');
                return cb(601);
            }

            driver.model = require(filePath);
            return cb();
        });
    }

}

function checkUserTenantAccess(record, tenantObj) {
    if (record && record.tenant && tenantObj && tenantObj.id) {
        if (record.tenant.id === tenantObj.id) {
            return true;
        }
        if (record.config && record.config.allowedTenants){
            if (record.config.allowedTenants[tenantObj.id]){
                return true;
            }
        }
    }
    return false;
}

function getTenantGroup(record, tenantObj) {
    if (record && record.tenant && tenantObj && tenantObj.id) {
        if (record.tenant.id === tenantObj.id) {
            return ({"groups": record.groups, "tenant": {"id":tenantObj.id,"code":tenantObj.code}});
        }
        if (record.config && record.config.allowedTenants){
            if (record.config.allowedTenants[tenantObj.id]){
                return ({"groups": record.config.allowedTenants[tenantObj.id], "tenant": {"id":tenantObj.id,"code":tenantObj.code}});
            }
        }
    }
    return null;
}

var utilities = require("./lib/helpers.js");

var driver = {
    "model": null,

    /**
     * Initialize passport based on the strategy requested
     *
     * @param {Request object} req
     * @param {Callback(error object, passport object) Function} cb
     */
    "passportLibInit": function (req, cb) {
        passportLib.init(req, cb);
    },

    /**
     * Authenticate through passport
     *
     * @param {Request object} req
     * @param {Response object} res
     * @param {Passport object} passport
     */
    "passportLibInitAuth": function (req, response, passport) {
        passportLib.initAuth(req, response, passport);
    },

    /**
     * Get driver, do what is needed before authenticating, and authenticate
     *
     * @param {Request object} req
     * @param {Response object} res
     * @param {Passport object} passport
     * @param {Callback(error object, data object) function} cb
     */
    "passportLibAuthenticate": function (req, res, passport, cb) {
        var authentication = req.soajs.inputmaskData.strategy;

        passportLib.getDriver(req, false, function (err, passportDriver) {
            passportDriver.preAuthenticate(req, function (error) {
                passport.authenticate(authentication, {session: false}, function (err, user, info) {
                    if (err) {
                        req.soajs.log.error(err);
                        return cb({"code": 499, "msg": err.toString()});
                    }
                    if (!user) {
                        cb({"code": 403, "msg": req.soajs.config.errors[403]});
                    }

                    req.soajs.inputmaskData.user = user;
                    initBLModel(req.soajs, function (err) {
                        var mode = req.soajs.inputmaskData.strategy;
                        utilities.saveUser(req.soajs, driver.model, mode, user, function (error, data) {
                            cb(error, data);
                        });
                    });
                })(req, res);

            });
        });

    },

    /**
     * Verify login credentials and login
     *
     * @param {SOAJS object} soajs
     * @param {Object} data
     * @param {Callback(error object, data object) function} cb
     */
    "login": function (soajs, data, cb) {
        var username = data.username;
        var password = data.password;
        var criteria = {
            'username': username,
            'status': 'active'
        };

        var pattern = soajsValidator.SchemaPatterns.email;
        if (pattern.test(username)) {
            delete criteria.username;
            criteria.email = username;
        }

        initBLModel(soajs, function (err) {
            if (err) {
                return cb(err);
            }
            driver.model.initConnection(soajs);
            utilities.findRecord(soajs, driver.model, criteria, cb, function (record) {
                var myConfig = driverConfig;
                if (soajs.config) {
                    myConfig = soajs.config;
                }
                utilities.comparePasswd(soajs.servicesConfig.urac, password, record.password, myConfig, function (err, response) {
                    if (err || !response) {
                        driver.model.closeConnection(soajs);
                        return cb(413);
                    }
                    delete record.password;
                    delete record.socialId;

                    if (!checkUserTenantAccess(record, soajs.tenant)) {
                        return cb(403);
                    }
                    if (record.groups && Array.isArray(record.groups) && record.groups.length !== 0) {
                        //Get Groups config
                        utilities.findGroups(soajs, driver.model, record, function (record) {
                            driver.model.closeConnection(soajs);
                            return cb(null, record);
                        });
                    }
                    else {
                        driver.model.closeConnection(soajs);
                        return cb(null, record);
                    }

                });

            });
        });
    },

    /**
     * Get logged in record from database
     *
     * @param {SOAJS object} soajs
     * @param {Object} data
     * @param {Callback(error object, user record object) function} cb
     */
    "getRecord": function (soajs, data, cb) {
        initBLModel(soajs, function (err) {
            driver.model.initConnection(soajs);
            var id;
            try {
                id = driver.model.validateId(soajs, data.id);
            }
            catch (e) {
                return cb(411);
            }

            var criteria = {
                '_id': id
            };
            utilities.findRecord(soajs, driver.model, criteria, cb, function (record) {
                delete record.password;

                let groupInfo = getTenantGroup (record, soajs.tenant);
                if (groupInfo.groups && Array.isArray(groupInfo.groups) && groupInfo.groups.length !== 0) {
                    record.groups = groupInfo.groups;
                    record.tenant = groupInfo.tenant;
                    utilities.findGroups(soajs, driver.model, record, function (record) {
                        returnUser(record);
                    });
                }
                else {
                    returnUser(record);
                }

                function returnUser(record) {
                    utilities.assureConfig(soajs, record);
                    driver.model.closeConnection(soajs);
                    return cb(null, record);
                }
            });
        });
    },
    /**
     * Login through OpenAM
     *
     * Expects to have openam configuration object under soajs.servicesConfig.urac.
     *
     * Example openam configuration object:
     * {
     *   attributesURL: "https://test.com/openam/identity/json/attributes",
     *   attributesMap: [
     *     { field: 'sAMAccountName', mapTo: 'id' },
     *     { field: 'sAMAccountName', mapTo: 'username' },
     *     { field: 'mail', mapTo: 'email' },
     *     { field: 'givenname', mapTo: 'firstName' },
     *     { field: 'sn', mapTo: 'lastName' }
     *   ],
     *   timeout: 5000
     * }
     *
     * @param {SOAJS object} soajs
     * @param {Object} data
     * @param {Callback(error object, user record object) function} cb
     */
    "openamLogin": function (soajs, data, cb) {
        var token = data.token;
        var openam;

        if (soajs.servicesConfig.urac && soajs.servicesConfig.urac.openam) {
            openam = soajs.servicesConfig.urac.openam;
        }
        else {
            return cb({"code": 712, "msg": soajs.config.errors[712]});
        }

        var openamAttributesURL = openam.attributesURL;
        var openamAttributesMap = openam.attributesMap;
        var openamTimeout = openam.timeout || 10000;

        request.post(openamAttributesURL, {
            form: {subjectid: token},
            timeout: openamTimeout
        }, function (error, response, body) {
            var userRecord;

            if (error) {
                soajs.log.error(error);
                return cb({"code": 710, "msg": soajs.config.errors[710]});
            }

            if (!response || response.statusCode !== 200) {
                soajs.log.error("OpenAM token invalid!");
                return cb({"code": 711, "msg": soajs.config.errors[711]});
            }

            try {
                userRecord = JSON.parse(body);
            } catch (err) {
                soajs.log.error("OpenAM response invalid!");
                return cb({"code": 712, "msg": soajs.config.errors[712]});
            }

            soajs.log.debug('Authenticated!');

            initBLModel(soajs, function (err) {
                utilities.saveUser(soajs, driver.model, 'openam', {
                    userRecord: userRecord,
                    attributesMap: openamAttributesMap
                }, function (error, record) {
                    return cb(null, record);
                });
            });
        });
    },

    /**
     * Login through LDAP
     *
     * @param {SOAJS object} soajs
     * @param {Object} data
     * @param {Callback(error object, user record object) function} cb
     */
    "ldapLogin": function (soajs, data, cb) {
        var username = data.username;
        var password = data.password;
        var ldapServer;

        if (soajs.servicesConfig.urac && soajs.servicesConfig.urac.ldapServer) {
            ldapServer = soajs.servicesConfig.urac.ldapServer;
        }
        else {
            return cb({"code": 706, "msg": soajs.config.errors[706]});
        }
        var host = ldapServer.host;
        var port = ldapServer.port;
        var baseDN = ldapServer.baseDN.replace(new RegExp(' ', 'g'), '');
        var adminUser = ldapServer.adminUser.replace(new RegExp(' ', 'g'), '');
        var adminPassword = ldapServer.adminPassword;
        var url = host + ":" + port;

        var filter = 'uid=' + username;
        var fullFilter = 'uid=' + username + ',' + baseDN;

        var ad = new ActiveDirectory({
            url: url,
            baseDN: baseDN,
            username: adminUser,
            password: adminPassword
        });

        ad.authenticate(fullFilter, password, function (err, auth) {
            if (err) {
                soajs.log.error(err);
                if (err.code && err.code === 'ECONNREFUSED') {
                    soajs.log.error("Connection Refused!");
                    return cb({"code": 700, "msg": soajs.config.errors[700]});
                }
                if (err.lde_message) {
                    if (err.lde_message.includes('Incorrect DN given')) { // invalid admin username
                        soajs.log.error("Incorrect DN given!");
                        return cb({"code": 701, "msg": soajs.config.errors[701]});
                    }

                    if (err.lde_message.includes('INVALID_CREDENTIALS') && err.lde_message.includes(adminUser)) { // invalid admin credentials (wrong admin password)
                        soajs.log.error("Invalid Admin Credentials");
                        return cb({"code": 702, "msg": soajs.config.errors[702]});
                    }

                    if (err.lde_message.includes('INVALID_CREDENTIALS') && err.lde_message.includes(filter)) { // invalid user credentials (wrong user password)
                        soajs.log.error("Invalid User Credentials");
                        var obj = {"code": 703, "msg": soajs.config.errors[703]};
                        return cb(obj);
                    }
                }

                return cb({"code": 704, "msg": soajs.config.errors[704]});
            }

            if (auth) {
                soajs.log.debug('Authenticated!');

                ad.find(filter, function (err, user) {
                    // since the user is authenticated, no error can be generated in this find call
                    // since we are searching using the filter => we will have one result
                    var userRecord = user.other[0];

                    initBLModel(soajs, function (err) {
                        utilities.saveUser(soajs, driver.model, 'ldap', userRecord, function (error, record) {
                            return cb(null, record);
                        });
                    });

                });

            }
            else {
                soajs.log.error("Authentication failed.");
                return cb({"code": 705, "msg": soajs.config.errors[705]});
            }
        });
    }
};

module.exports = driver;